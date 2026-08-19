const axios = require('axios');
const logger = require('./logger');
const { ServiceUnavailableError, RateLimitError } = require('./errors');

// Lazy load to avoid circular dependency
let apiUsageTracker = null;
const getApiUsageTracker = () => {
  if (!apiUsageTracker) {
    apiUsageTracker = require('./apiUsageTracker');
  }
  return apiUsageTracker;
};

/**
 * Enhanced HTTP client with retry logic, rate limiting, and comprehensive error handling
 */
class HttpClient {
  constructor(options = {}) {
    this.retryAttempts = options.retryAttempts || 3;
    this.retryDelay = options.retryDelay || 1000; // milliseconds
    this.timeout = options.timeout || 15000;
    this.rateLimitDelay = options.rateLimitDelay || 1000;
    this.lastRequestTime = {};
  }

  /**
   * Make HTTP request with retry logic
   */
  async request(config, serviceName = 'unknown') {
    const startTime = Date.now();
    let lastError = null;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        // Rate limiting per service
        await this.enforceRateLimit(serviceName);

        // Make request
        const response = await axios({
          ...config,
          timeout: this.timeout,
        });

        const duration = Date.now() - startTime;
        logger.logApiCall(serviceName, config.url, duration, true);

        // Track usage
        try {
          await getApiUsageTracker().logUsage(serviceName, config.url, duration, true);
        } catch (trackError) {
          // Don't fail the request if tracking fails
          logger.debug('Failed to track API usage', { error: trackError.message });
        }

        return response.data;
      } catch (error) {
        lastError = error;
        const duration = Date.now() - startTime;

        // Log the error
        logger.logApiCall(serviceName, config.url, duration, false, error);

        // Track failed usage
        try {
          await getApiUsageTracker().logUsage(serviceName, config.url, duration, false, error);
        } catch (trackError) {
          logger.debug('Failed to track API usage', { error: trackError.message });
        }

        // Check if we should retry
        if (!this.shouldRetry(error, attempt)) {
          throw this.handleError(error, serviceName);
        }

        // Calculate exponential backoff
        const delay = this.retryDelay * Math.pow(2, attempt - 1);
        logger.warn(
          `Retry attempt ${attempt}/${this.retryAttempts} for ${serviceName} after ${delay}ms`
        );

        await this.sleep(delay);
      }
    }

    // All retries exhausted
    throw this.handleError(lastError, serviceName);
  }

  /**
   * GET request
   */
  async get(url, options = {}, serviceName = 'unknown') {
    return this.request(
      {
        method: 'GET',
        url,
        ...options,
      },
      serviceName
    );
  }

  /**
   * POST request
   */
  async post(url, data, options = {}, serviceName = 'unknown') {
    return this.request(
      {
        method: 'POST',
        url,
        data,
        ...options,
      },
      serviceName
    );
  }

  /**
   * PUT request
   */
  async put(url, data, options = {}, serviceName = 'unknown') {
    return this.request(
      {
        method: 'PUT',
        url,
        data,
        ...options,
      },
      serviceName
    );
  }

  /**
   * DELETE request
   */
  async delete(url, options = {}, serviceName = 'unknown') {
    return this.request(
      {
        method: 'DELETE',
        url,
        ...options,
      },
      serviceName
    );
  }

  /**
   * Enforce rate limiting per service
   */
  async enforceRateLimit(serviceName) {
    const now = Date.now();
    const lastRequest = this.lastRequestTime[serviceName] || 0;
    const timeSinceLastRequest = now - lastRequest;

    if (timeSinceLastRequest < this.rateLimitDelay) {
      const waitTime = this.rateLimitDelay - timeSinceLastRequest;
      await this.sleep(waitTime);
    }

    this.lastRequestTime[serviceName] = Date.now();
  }

  /**
   * Determine if request should be retried
   */
  shouldRetry(error, attempt) {
    // Don't retry if we've exhausted attempts
    if (attempt >= this.retryAttempts) {
      return false;
    }

    // Don't retry client errors (4xx except 429)
    if (error.response) {
      const status = error.response.status;
      if (status >= 400 && status < 500 && status !== 429) {
        return false;
      }
    }

    // Retry network errors, timeouts, 5xx, and 429
    return (
      !error.response || // Network error
      error.code === 'ECONNABORTED' || // Timeout
      error.response.status === 429 || // Rate limit
      error.response.status >= 500 // Server error
    );
  }

  /**
   * Handle and transform errors
   */
  handleError(error, serviceName) {
    if (error.response) {
      const { status, data } = error.response;

      if (status === 429) {
        return new RateLimitError(`Rate limit exceeded for ${serviceName}`, {
          service: serviceName,
          retryAfter: error.response.headers['retry-after'],
        });
      }

      if (status >= 500) {
        return new ServiceUnavailableError(`${serviceName} service unavailable`, {
          service: serviceName,
          status,
          message: data?.message,
        });
      }

      return new Error(`${serviceName} API error: ${data?.message || error.message}`);
    }

    if (error.code === 'ECONNABORTED') {
      return new ServiceUnavailableError(`${serviceName} request timeout`, {
        service: serviceName,
        timeout: this.timeout,
      });
    }

    if (error.request) {
      return new ServiceUnavailableError(`${serviceName} network error`, {
        service: serviceName,
        message: error.message,
      });
    }

    return error;
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Create default instance
const httpClient = new HttpClient({
  retryAttempts: 3,
  retryDelay: 1000,
  timeout: 15000,
  rateLimitDelay: 500,
});

module.exports = {
  HttpClient,
  httpClient,
};
