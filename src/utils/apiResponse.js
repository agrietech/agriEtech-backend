/**
 * Standardized API Response Helper for AgriEtech Platform
 * Formats all responses into consistent, predictable JSON structures.
 */

class ApiResponse {
  /**
   * Send a successful response
   */
  static success(res, { data = null, message = null, meta = null, statusCode = 200 } = {}) {
    return res.status(statusCode).json({
      success: true,
      data,
      ...(message && { message }),
      ...(meta && { meta }),
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Send a 201 Created response
   */
  static created(
    res,
    { data = null, message = 'Resource created successfully', meta = null } = {}
  ) {
    return this.success(res, { data, message, meta, statusCode: 201 });
  }

  /**
   * Send a 204 No Content response
   */
  static noContent(res) {
    return res.status(204).send();
  }

  /**
   * Send a paginated collection response
   */
  static paginated(res, { data = [], page = 1, limit = 20, total = 0, message = null } = {}) {
    const totalPages = Math.ceil(total / limit) || 1;
    return res.status(200).json({
      success: true,
      data,
      ...(message && { message }),
      meta: {
        page: Number(page),
        limit: Number(limit),
        total: Number(total),
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Send a formatted error response
   */
  static error(
    res,
    {
      message = 'Internal Server Error',
      code = 'INTERNAL_ERROR',
      details = null,
      statusCode = 500,
      stack = null,
    } = {}
  ) {
    return res.status(statusCode).json({
      success: false,
      error: {
        code,
        message,
        ...(details && { details }),
      },
      ...(stack && process.env.NODE_ENV === 'development' && { stack }),
      timestamp: new Date().toISOString(),
    });
  }
}

module.exports = ApiResponse;
