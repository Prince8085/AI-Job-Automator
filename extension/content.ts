/**
 * Content Script for Browser Extension
 * Detects forms and enables auto-fill functionality
 */

import FormDetector, { DetectedForm } from './formDetector';

// Type definitions for Chrome extension API
interface ChromeMessage {
  type: string;
  formId?: string;
  resumeData?: any;
  data?: any;
}

interface ChromeSender {
  tab?: { id: number };
  frameId?: number;
  id?: string;
}

// Declare chrome global
declare const chrome: {
  runtime: {
    sendMessage: (message: ChromeMessage, callback?: (response: any) => void) => void;
    onMessage: {
      addListener: (listener: (request: ChromeMessage, sender: ChromeSender, sendResponse: (response?: any) => void) => void) => void;
    };
    lastError?: { message: string };
  };
};

// ============================================
// FORM DETECTION & HIGHLIGHTING
// ============================================

/**
 * Detect forms on page load and send to popup
 */
function detectAndHighlightForms() {
  const forms = FormDetector.detectForms();

  if (forms.length === 0) {
    console.log('No application forms detected on this page');
    return;
  }

  console.log(`✅ Found ${forms.length} application form(s)`);

  // Send detected forms to popup
  chrome.runtime.sendMessage(
    {
      type: 'FORMS_DETECTED',
      data: {
        count: forms.length,
        forms: forms.map(f => ({
          id: f.id,
          name: f.name,
          fieldCount: f.fields.length,
          platform: f.platform,
          confidence: f.confidence,
        })),
      },
    },
    (_response: any) => {
      if (chrome.runtime.lastError) {
        console.warn('Message error:', chrome.runtime.lastError);
      }
    }
  );

  // Highlight forms with high confidence
  forms.forEach(form => {
    if (form.confidence > 70) {
      highlightForm(form);
    }
  });
}

/**
 * Highlight detected form with visual indicator
 */
function highlightForm(form: DetectedForm) {
  // Add container div around form to highlight it
  const container = document.createElement('div');
  container.style.cssText = `
    border: 3px solid #4CAF50 !important;
    border-radius: 8px !important;
    padding: 10px !important;
    margin: 10px 0 !important;
    background-color: rgba(76, 175, 80, 0.05) !important;
    position: relative;
  `;

  // Add badge
  const badge = document.createElement('div');
  badge.textContent = '✓ AI Job Automator Detected';
  badge.style.cssText = `
    background-color: #4CAF50;
    color: white;
    padding: 5px 10px;
    border-radius: 4px;
    font-size: 12px;
    margin-bottom: 10px;
    font-weight: bold;
  `;

  container.appendChild(badge);
  form.submitButton?.parentElement?.insertBefore(container, form.submitButton);
}

// ============================================
// AUTO-FILL FUNCTIONALITY
// ============================================

/**
 * Auto-fill a form with provided data
 */
async function autoFillForm(formId: string, resumeData: any) {
  const forms = FormDetector.detectForms();
  const form = forms.find(f => f.id === formId);

  if (!form) {
    console.error('Form not found:', formId);
    return false;
  }

  try {
    // Map resume data to form fields
    const fieldMapping = FormDetector.mapResumeToFields(form.fields, resumeData);

    let successCount = 0;

    for (const [field, value] of fieldMapping.entries()) {
      const element = field.element as HTMLInputElement | HTMLTextAreaElement;

      if (value instanceof File) {
        // Handle file uploads
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(value);
        (element as HTMLInputElement).files = dataTransfer.files;

        // Trigger change event
        element.dispatchEvent(new Event('change', { bubbles: true }));
      } else {
        // Fill text/email/tel fields
        element.value = value;

        // Trigger input event
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('blur', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
      }

      successCount++;
    }

    console.log(`✅ Auto-filled ${successCount} fields`);
    return true;
  } catch (error) {
    console.error('Error auto-filling form:', error);
    return false;
  }
}

// ============================================
// SUBMISSION TRACKING
// ============================================

/**
 * Track submission when form is submitted
 * NOTE: Functionality preserved but not currently used
 */
/*
function trackFormSubmission(form: DetectedForm) {
  if (form.submitButton) {
    form.submitButton.addEventListener('click', () => {
      chrome.runtime.sendMessage(
        {
          type: 'APPLICATION_SUBMITTED',
          data: {
            formId: form.id,
            formName: form.name,
            platform: form.platform,
            timestamp: new Date().toISOString(),
            url: window.location.href,
          },
        },
        response => {
          console.log('Application tracked:', response);
        }
      );
    });
  }
}
*/

// ============================================
// MESSAGE HANDLING
// ============================================

/**
 * Listen for messages from popup/background
 */
chrome.runtime.onMessage.addListener((request: ChromeMessage, _sender: ChromeSender, sendResponse: (response?: any) => void) => {
  if (request.type === 'DETECT_FORMS') {
    const forms = FormDetector.detectForms();
    sendResponse({
      success: true,
      data: forms.map(f => ({
        id: f.id,
        name: f.name,
        fields: f.fields.map(field => ({
          name: field.name,
          type: field.type,
          label: field.label,
          required: field.required,
        })),
        confidence: f.confidence,
        platform: f.platform,
      })),
    });
  } else if (request.type === 'AUTO_FILL') {
    autoFillForm(request.formId || '', request.resumeData || {}).then(success => {
      sendResponse({
        success,
        message: success ? 'Form filled successfully' : 'Failed to fill form',
      });
    });
    return true; // Will respond asynchronously
  } else if (request.type === 'SUBMIT_FORM') {
    const forms = FormDetector.detectForms();
    const form = forms.find(f => f.id === request.formId);
    if (form?.submitButton) {
      (form.submitButton as HTMLElement).click();
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: 'Form not found' });
    }
  }
});

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize content script on page load
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', detectAndHighlightForms);
} else {
  detectAndHighlightForms();
}

console.log('✅ AI Job Automator content script loaded');
