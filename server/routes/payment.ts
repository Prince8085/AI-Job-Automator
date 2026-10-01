/**
 * Payment Routes - Express endpoints for payment processing
 * Add these to your server/index.ts
 */

import express, { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { paymentService } from '../../db/services/paymentService';

const paymentLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: 'Too many payment requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

export const createPaymentRoutes = (app: express.Application) => {
  // ============================================
  // PAYMENT ENDPOINTS
  // ============================================

  // Plan definitions (amount in paise)
  const PAYMENT_PLANS: Record<string, { amount: number; credits: number }> = {
    starter: { amount: 19900, credits: 100 },
    pro: { amount: 49900, credits: 500 },
    mega: { amount: 99900, credits: 1500 },
  };

  /**
   * POST /api/payments/create-order
   * Create a Razorpay order server-side. Falls back to a mock order
   * when the Razorpay keys are invalid/unreachable so demo mode keeps working.
   */
  app.post(
    '/api/payments/create-order',
    paymentLimiter,
    async (req: Request, res: Response) => {
      const { planId, userId } = req.body;

      const plan = PAYMENT_PLANS[planId];
      if (!plan) {
        return res.status(400).json({
          success: false,
          error: 'Invalid plan ID',
        });
      }

      const keyId = process.env.RAZORPAY_KEY_ID;
      const keySecret = process.env.RAZORPAY_KEY_SECRET;

      // Try to create a real Razorpay order
      if (keyId && keySecret) {
        try {
          const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
          const rpRes = await fetch('https://api.razorpay.com/v1/orders', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Basic ${auth}`,
            },
            body: JSON.stringify({
              amount: plan.amount,
              currency: 'INR',
              receipt: `receipt_${Date.now()}`,
              notes: { planId, userId: userId || 'anonymous' },
            }),
          });

          if (rpRes.ok) {
            const order = await rpRes.json();
            return res.status(200).json({
              success: true,
              data: {
                orderId: order.id,
                amount: order.amount,
                currency: order.currency || 'INR',
                planId,
                credits: plan.credits,
              },
            });
          }
          console.warn('⚠️ Razorpay order creation failed, using mock order:', rpRes.status);
        } catch (error) {
          console.warn('⚠️ Razorpay unreachable, using mock order:', error);
        }
      }

      // Mock order fallback (demo mode / invalid keys)
      return res.status(200).json({
        success: true,
        data: {
          orderId: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          amount: plan.amount,
          currency: 'INR',
          planId,
          credits: plan.credits,
          mock: true,
        },
      });
    }
  );

  /**
   * POST /api/payments/verify
   * Verify Razorpay payment and update user credits
   */
  app.post(
    '/api/payments/verify',
    paymentLimiter,
    async (req: Request, res: Response) => {
      try {
        const { orderId, paymentId, signature, userId, credits } = req.body;

        // Validate inputs
        if (
          typeof orderId !== 'string' ||
          typeof paymentId !== 'string' ||
          typeof signature !== 'string' ||
          typeof userId !== 'string' ||
          !Number.isFinite(Number(credits)) ||
          Number(credits) <= 0
        ) {
          return res.status(400).json({
            success: false,
            error: 'Missing or invalid payment information',
            retryable: false,
          });
        }

        const normalizedCredits = Math.floor(Number(credits));

      // Verify signature (ensures payment actually came from Razorpay)
      const isValid = paymentService.verifyRazorpaySignature(orderId, paymentId, signature);

      if (!isValid) {
        console.error('🚨 FRAUD ATTEMPT: Invalid signature for payment', paymentId);
        return res.status(403).json({
          success: false,
          error: 'Payment verification failed - invalid signature',
          retryable: false,
        });
      }

        // Record transaction in database
        const transaction = await paymentService.recordTransaction(
          userId,
          orderId,
          paymentId,
          0, // Amount not needed here (stored in frontend)
          normalizedCredits,
          signature
        );

        // Update user credits
        await paymentService.updateUserCredits(userId, normalizedCredits);

        console.log(
          `✅ Payment verified and credits added for user ${userId}: +${normalizedCredits} credits`,
          `Transaction: ${transaction.id}`
        );

        return res.status(200).json({
          success: true,
          message: 'Payment verified successfully',
          transactionId: transaction.id,
          creditsAdded: normalizedCredits,
        });
      } catch (error: any) {
        console.error('❌ Payment verification error:', error);
        return res.status(500).json({
          success: false,
          error: error.message || 'Payment verification failed',
          retryable: true,
        });
      }
    }
  );

  /**
   * POST /api/payments/webhook
   * Handle Razorpay webhook events (for payment notifications)
   */
  app.post('/api/payments/webhook', async (req: Request, res: Response) => {
    try {
      const { event, payload } = req.body;

      if (!event || !payload) {
        return res.status(400).json({
          success: false,
          error: 'Invalid webhook payload',
        });
      }

      // Process webhook event
      const handled = await paymentService.handleWebhookEvent(event, payload);

      if (!handled) {
        console.warn(`⚠️ Webhook event not handled: ${event}`);
      }

      // Always return 200 to acknowledge receipt
      return res.status(200).json({
        success: true,
        message: 'Webhook processed',
      });
    } catch (error: any) {
      console.error('❌ Webhook error:', error);
      // Still return 200 to prevent Razorpay retries
      return res.status(200).json({
        success: false,
        message: 'Webhook received but processing failed',
      });
    }
  });

  /**
   * GET /api/payments/history/:userId
   * Get payment history for user
   */
  app.get('/api/payments/history/:userId', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID required',
        });
      }

      const history = await paymentService.getPaymentHistory(userId);

      return res.status(200).json({
        success: true,
        history,
        count: history.length,
      });
    } catch (error: any) {
      console.error('❌ Error fetching payment history:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch payment history',
      });
    }
  });

  /**
   * POST /api/payments/invoice/:transactionId
   * Generate invoice for transaction
   */
  app.post('/api/payments/invoice/:transactionId', async (req: Request, res: Response) => {
    try {
      const { transactionId } = req.params;

      if (!transactionId) {
        return res.status(400).json({
          success: false,
          error: 'Transaction ID required',
        });
      }

      const invoice = await paymentService.generateInvoice(transactionId);

      return res.status(200).json({
        success: true,
        invoice,
      });
    } catch (error: any) {
      console.error('❌ Error generating invoice:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate invoice',
      });
    }
  });

  /**
   * POST /api/payments/refund
   * Process refund for payment
   */
  app.post('/api/payments/refund', async (req: Request, res: Response) => {
    try {
      const { paymentId, amount } = req.body;

      if (!paymentId || !amount) {
        return res.status(400).json({
          success: false,
          error: 'Payment ID and amount required',
        });
      }

      const refunded = await paymentService.refundPayment(paymentId, amount);

      if (!refunded) {
        return res.status(500).json({
          success: false,
          error: 'Refund processing failed',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Refund processed successfully',
        paymentId,
        refundedAmount: amount,
      });
    } catch (error: any) {
      console.error('❌ Refund error:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to process refund',
      });
    }
  });

  /**
   * POST /api/payments/validate-amount
   * Validate payment amount against plan
   */
  app.post('/api/payments/validate-amount', async (req: Request, res: Response) => {
    try {
      const { planId, amount } = req.body;

      // Define valid plans
      const validPlans: Record<string, number> = {
        starter: 19900, // ₹199 in paise
        pro: 49900, // ₹499 in paise
        mega: 99900, // ₹999 in paise
      };

      if (!validPlans[planId]) {
        return res.status(400).json({
          success: false,
          error: 'Invalid plan ID',
        });
      }

      const expectedAmount = validPlans[planId];

      if (amount !== expectedAmount) {
        console.warn(
          `⚠️ Amount mismatch - expected: ${expectedAmount}, received: ${amount}`
        );
        return res.status(400).json({
          success: false,
          error: 'Payment amount does not match plan price',
          expected: expectedAmount,
          received: amount,
        });
      }

      return res.status(200).json({
        success: true,
        valid: true,
        amount: expectedAmount,
      });
    } catch (error: any) {
      console.error('❌ Amount validation error:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to validate amount',
      });
    }
  });
};

/**
 * USAGE IN server/index.ts:
 * 
 * import { createPaymentRoutes } from './routes/payment';
 * 
 * // Create payment routes
 * createPaymentRoutes(app);
 * 
 * // Server will have these endpoints:
 * // POST  /api/payments/verify
 * // POST  /api/payments/webhook
 * // GET   /api/payments/history/:userId
 * // POST  /api/payments/invoice/:transactionId
 * // POST  /api/payments/refund
 * // POST  /api/payments/validate-amount
 */
