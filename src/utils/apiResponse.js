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
   * Helper to parse and sanitize pagination query parameters from Express req
   * Enforces min 1, default limit, and caps at maxLimit (default 100).
   */
  static parsePagination(req, { defaultLimit = 20, maxLimit = 100 } = {}) {
    const rawPage = parseInt(req.query?.page, 10);
    const rawLimit = parseInt(req.query?.limit, 10);

    const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
    const limit = Number.isInteger(rawLimit) && rawLimit > 0
      ? Math.min(rawLimit, maxLimit)
      : defaultLimit;
    const skip = (page - 1) * limit;

    return { page, limit, skip };
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
      message,
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

