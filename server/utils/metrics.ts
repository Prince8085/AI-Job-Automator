/**
 * Monitoring & Metrics Service
 * Tracks API health, performance, and error metrics
 */

import { logger } from './logger';

export interface MetricPoint {
  timestamp: number;
  value: number;
  labels?: Record<string, string>;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  lastChecked: number;
  components: Record<string, ComponentHealth>;
}

export interface ComponentHealth {
  status: 'up' | 'down';
  responseTime: number;
  errorCount: number;
  lastChecked: number;
}

export interface ApiMetrics {
  totalRequests: number;
  totalErrors: number;
  totalDuration: number;
  averageResponseTime: number;
  errorRate: string;
  uptimePercentage: string;
}

class MetricsCollector {
  private metrics = {
    http: {
      requestCount: 0,
      errorCount: 0,
      totalDuration: 0,
      statusCodes: new Map<number, number>(),
      endpoints: new Map<string, EndpointMetrics>(),
    },
    database: {
      queryCount: 0,
      errorCount: 0,
      totalDuration: 0,
      slowQueries: 0,
    },
    ai: {
      requestCount: 0,
      errorCount: 0,
      totalDuration: 0,
      tokensUsed: 0,
    },
  };

  private health: HealthStatus = {
    status: 'healthy',
    uptime: 0,
    lastChecked: Date.now(),
    components: {},
  };

  private startTime = Date.now();
  private metricsHistory: MetricPoint[] = [];

  constructor() {
    this.startHealthChecks();
  }

  /**
   * Record HTTP request
   */
  recordHttpRequest(
    endpoint: string,
    method: string,
    statusCode: number,
    duration: number
  ): void {
    this.metrics.http.requestCount++;
    this.metrics.http.totalDuration += duration;

    // Track status codes
    const count = this.metrics.http.statusCodes.get(statusCode) || 0;
    this.metrics.http.statusCodes.set(statusCode, count + 1);

    // Track errors
    if (statusCode >= 400) {
      this.metrics.http.errorCount++;

      if (statusCode >= 500) {
        this.health.status = 'degraded';
      }
    }

    // Track by endpoint
    const key = `${method} ${endpoint}`;
    if (!this.metrics.http.endpoints.has(key)) {
      this.metrics.http.endpoints.set(key, {
        count: 0,
        duration: 0,
        errors: 0,
      });
    }

    const endpointMetrics = this.metrics.http.endpoints.get(key)!;
    endpointMetrics.count++;
    endpointMetrics.duration += duration;
    if (statusCode >= 400) {
      endpointMetrics.errors++;
    }

    // Track slow requests
    if (duration > 1000) {
      logger.warn('Slow HTTP request detected', {
        endpoint,
        method,
        duration: `${duration}ms`,
      });
    }

    this.recordMetric('http.request', 1);
  }

  /**
   * Record database query
   */
  recordDatabaseQuery(duration: number, error?: boolean): void {
    this.metrics.database.queryCount++;
    this.metrics.database.totalDuration += duration;

    if (error) {
      this.metrics.database.errorCount++;
    }

    if (duration > 500) {
      this.metrics.database.slowQueries++;
    }

    this.recordMetric('database.query', 1);
  }

  /**
   * Record AI API call
   */
  recordAiRequest(
    duration: number,
    tokensUsed: number = 0,
    error?: boolean
  ): void {
    this.metrics.ai.requestCount++;
    this.metrics.ai.totalDuration += duration;
    this.metrics.ai.tokensUsed += tokensUsed;

    if (error) {
      this.metrics.ai.errorCount++;
    }

    this.recordMetric('ai.request', 1);
    if (tokensUsed > 0) {
      this.recordMetric('ai.tokens', tokensUsed);
    }
  }

  /**
   * Record generic metric
   */
  recordMetric(name: string, value: number, labels?: Record<string, string>): void {
    this.metricsHistory.push({
      timestamp: Date.now(),
      value,
      labels: { ...labels, metric: name },
    });

    // Keep only last 1000 metrics per type
    if (this.metricsHistory.length > 10000) {
      this.metricsHistory = this.metricsHistory.slice(-1000);
    }
  }

  /**
   * Get current API metrics
   */
  getApiMetrics(): ApiMetrics {
    const totalRequests = this.metrics.http.requestCount;
    const totalErrors = this.metrics.http.errorCount;
    const totalDuration = this.metrics.http.totalDuration;
    const averageResponseTime =
      totalRequests > 0 ? Math.round(totalDuration / totalRequests) : 0;

    const errorRate =
      totalRequests > 0
        ? ((totalErrors / totalRequests) * 100).toFixed(2)
        : '0.00';

    const uptimePercentage =
      totalRequests > 0
        ? (((totalRequests - totalErrors) / totalRequests) * 100).toFixed(2)
        : '100.00';

    return {
      totalRequests,
      totalErrors,
      totalDuration,
      averageResponseTime,
      errorRate: `${errorRate}%`,
      uptimePercentage: `${uptimePercentage}%`,
    };
  }

  /**
   * Get endpoint metrics
   */
  getEndpointMetrics(endpoint?: string): Record<string, EndpointMetrics> {
    if (endpoint) {
      const results: Record<string, EndpointMetrics> = {};
      for (const [key, metrics] of this.metrics.http.endpoints) {
        if (key.includes(endpoint)) {
          results[key] = metrics;
        }
      }
      return results;
    }

    const results: Record<string, EndpointMetrics> = {};
    for (const [key, metrics] of this.metrics.http.endpoints) {
      results[key] = metrics;
    }
    return results;
  }

  /**
   * Get database metrics
   */
  getDatabaseMetrics() {
    const avgQueryTime =
      this.metrics.database.queryCount > 0
        ? Math.round(
            this.metrics.database.totalDuration /
              this.metrics.database.queryCount
          )
        : 0;

    return {
      totalQueries: this.metrics.database.queryCount,
      totalErrors: this.metrics.database.errorCount,
      averageQueryTime: `${avgQueryTime}ms`,
      slowQueries: this.metrics.database.slowQueries,
      errorRate:
        this.metrics.database.queryCount > 0
          ? (
              (this.metrics.database.errorCount /
                this.metrics.database.queryCount) *
              100
            ).toFixed(2)
          : '0.00',
    };
  }

  /**
   * Get AI metrics
   */
  getAiMetrics() {
    const avgDuration =
      this.metrics.ai.requestCount > 0
        ? Math.round(this.metrics.ai.totalDuration / this.metrics.ai.requestCount)
        : 0;

    return {
      totalRequests: this.metrics.ai.requestCount,
      totalErrors: this.metrics.ai.errorCount,
      averageDuration: `${avgDuration}ms`,
      tokensUsed: this.metrics.ai.tokensUsed,
      errorRate:
        this.metrics.ai.requestCount > 0
          ? (
              (this.metrics.ai.errorCount / this.metrics.ai.requestCount) *
              100
            ).toFixed(2)
          : '0.00',
    };
  }

  /**
   * Get health status
   */
  getHealth(): HealthStatus {
    const uptime = Date.now() - this.startTime;

    this.health = {
      status: this.determineHealthStatus(),
      uptime,
      lastChecked: Date.now(),
      components: this.health.components,
    };

    return this.health;
  }

  /**
   * Update component status
   */
  setComponentStatus(
    component: string,
    status: 'up' | 'down',
    responseTime: number = 0
  ): void {
    this.health.components[component] = {
      status,
      responseTime,
      errorCount: status === 'down' ? (this.health.components[component]?.errorCount || 0) + 1 : 0,
      lastChecked: Date.now(),
    };
  }

  /**
   * Determine overall health status
   */
  private determineHealthStatus(): 'healthy' | 'degraded' | 'unhealthy' {
    const downComponents = Object.values(this.health.components).filter(
      (c) => c.status === 'down'
    ).length;

    const totalComponents = Object.keys(this.health.components).length;

    if (downComponents === 0 && this.metrics.http.errorCount === 0) {
      return 'healthy';
    }

    if (downComponents < totalComponents / 2) {
      return 'degraded';
    }

    return 'unhealthy';
  }

  /**
   * Start periodic health checks
   */
  private startHealthChecks(): void {
    setInterval(() => {
      const apiMetrics = this.getApiMetrics();

      // Check if error rate is too high
      if (parseFloat(apiMetrics.errorRate) > 10) {
        this.health.status = 'degraded';
        logger.warn('High error rate detected', {
          errorRate: apiMetrics.errorRate,
        });
      }
    }, 60000); // Check every minute
  }

  /**
   * Reset all metrics
   */
  resetMetrics(): void {
    this.metrics = {
      http: {
        requestCount: 0,
        errorCount: 0,
        totalDuration: 0,
        statusCodes: new Map(),
        endpoints: new Map(),
      },
      database: {
        queryCount: 0,
        errorCount: 0,
        totalDuration: 0,
        slowQueries: 0,
      },
      ai: {
        requestCount: 0,
        errorCount: 0,
        totalDuration: 0,
        tokensUsed: 0,
      },
    };

    this.metricsHistory = [];
    logger.info('Metrics reset');
  }

  /**
   * Get metrics summary
   */
  getSummary() {
    return {
      api: this.getApiMetrics(),
      database: this.getDatabaseMetrics(),
      ai: this.getAiMetrics(),
      health: this.getHealth(),
      uptime: `${Math.floor((Date.now() - this.startTime) / 1000)}s`,
    };
  }
}

interface EndpointMetrics {
  count: number;
  duration: number;
  errors: number;
}

export const metricsCollector = new MetricsCollector();

export default metricsCollector;
