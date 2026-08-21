const { prisma, isConnected } = require('../../config/db');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../../utils/errors');

/**
 * Role Request Service
 * Handles hierarchical role application and approval system
 */

// Requestable roles mapping
const REQUESTABLE_ROLES = ['DEVELOPMENT_AGENT', 'WOREDA_OFFICER', 'RESEARCHER'];

// Role hierarchy for approval
const ROLE_HIERARCHY = {
  DEVELOPMENT_AGENT: ['WOREDA_OFFICER', 'ADMIN'],
  WOREDA_OFFICER: ['ADMIN'],
  RESEARCHER: ['ADMIN'],
};

/**
 * Submit a new role upgrade request
 */
async function submitRoleRequest(userId, requestData) {
  const {
    requestedRole,
    regionId,
    regionName,
    zoneId,
    zoneName,
    woredaId,
    woredaName,
    kebeleName,
    staffIdNumber,
    organizationName,
  } = requestData;

  // Validate requestable role
  if (!REQUESTABLE_ROLES.includes(requestedRole)) {
    throw new BadRequestError(
      `Invalid requested role. Must be one of: ${REQUESTABLE_ROLES.join(', ')}`
    );
  }

  // Get user details
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, fullName: true, phoneNumber: true, email: true, role: true },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Check if user already has this role
  if (user.role === requestedRole) {
    throw new BadRequestError(`You already have the ${requestedRole} role`);
  }

  // Check for duplicate pending request
  const existingRequest = await prisma.roleRequest.findFirst({
    where: {
      userId,
      requestedRole,
      status: 'PENDING',
    },
  });

  if (existingRequest) {
    throw new BadRequestError(
      `You already have a pending request for the ${requestedRole} role`
    );
  }

  // Validate required fields
  if (!staffIdNumber || !organizationName) {
    throw new BadRequestError('Staff ID number and organization name are required');
  }

  // Create role request
  const roleRequest = await prisma.roleRequest.create({
    data: {
      userId: user.id,
      userName: user.fullName,
      userPhone: user.phoneNumber,
      userEmail: user.email,
      currentRole: user.role,
      requestedRole,
      regionId,
      regionName,
      zoneId,
      zoneName,
      woredaId,
      woredaName,
      kebeleName,
      staffIdNumber,
      organizationName,
      status: 'PENDING',
    },
  });

  return roleRequest;
}

/**
 * Get user's own role requests
 */
async function getUserRoleRequests(userId, filters = {}) {
  const { status, limit = 10, offset = 0 } = filters;

  const where = { userId };
  if (status) {
    where.status = status;
  }

  const [requests, total] = await Promise.all([
    prisma.roleRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset),
    }),
    prisma.roleRequest.count({ where }),
  ]);

  return {
    requests,
    total,
    limit: parseInt(limit),
    offset: parseInt(offset),
  };
}

/**
 * Get pending requests for review (hierarchical filtering)
 */
async function getPendingRequests(reviewerId, filters = {}) {
  const { requestedRole, woredaId, limit = 20, offset = 0 } = filters;

  // Get reviewer details
  const reviewer = await prisma.user.findUnique({
    where: { id: reviewerId },
    select: { role: true, woredaId: true },
  });

  if (!reviewer) {
    throw new NotFoundError('Reviewer not found');
  }

  // Build where clause based on reviewer's role
  const where = { status: 'PENDING' };

  // Apply role-based filtering
  if (reviewer.role === 'WOREDA_OFFICER') {
    // Woreda officers can only approve Development Agents in their woreda
    where.requestedRole = 'DEVELOPMENT_AGENT';
    if (reviewer.woredaId) {
      where.woredaId = reviewer.woredaId;
    }
  } else if (reviewer.role === 'ADMIN') {
    // Admins can approve all requests
    if (requestedRole) {
      where.requestedRole = requestedRole;
    }
    if (woredaId) {
      where.woredaId = woredaId;
    }
  } else {
    // Other roles cannot review requests
    throw new ForbiddenError('You do not have permission to review role requests');
  }

  const [requests, total] = await Promise.all([
    prisma.roleRequest.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      take: parseInt(limit),
      skip: parseInt(offset),
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
            role: true,
          },
        },
      },
    }),
    prisma.roleRequest.count({ where }),
  ]);

  return {
    requests,
    total,
    limit: parseInt(limit),
    offset: parseInt(offset),
  };
}

/**
 * Approve a role request
 */
async function approveRoleRequest(requestId, reviewerId, reviewerName) {
  // Get request
  const request = await prisma.roleRequest.findUnique({
    where: { id: requestId },
    include: {
      user: {
        select: { id: true, role: true, woredaId: true },
      },
    },
  });

  if (!request) {
    throw new NotFoundError('Role request not found');
  }

  if (request.status !== 'PENDING') {
    throw new BadRequestError(`Request is already ${request.status.toLowerCase()}`);
  }

  // Get reviewer details
  const reviewer = await prisma.user.findUnique({
    where: { id: reviewerId },
    select: { role: true, woredaId: true },
  });

  if (!reviewer) {
    throw new NotFoundError('Reviewer not found');
  }

  // Check if reviewer has permission to approve this request
  const allowedApprovers = ROLE_HIERARCHY[request.requestedRole] || [];
  if (!allowedApprovers.includes(reviewer.role)) {
    throw new ForbiddenError(
      `Your role (${reviewer.role}) cannot approve ${request.requestedRole} requests`
    );
  }

  // Additional woreda-specific check for WOREDA_OFFICER reviewers
  if (reviewer.role === 'WOREDA_OFFICER') {
    if (reviewer.woredaId !== request.woredaId) {
      throw new ForbiddenError('You can only approve requests from your own woreda');
    }
    if (request.requestedRole !== 'DEVELOPMENT_AGENT') {
      throw new ForbiddenError('Woreda officers can only approve Development Agent requests');
    }
  }

  // Update request and user role in a transaction
  const [updatedRequest] = await prisma.$transaction([
    prisma.roleRequest.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        reviewedById: reviewerId,
        reviewedByName: reviewerName,
        reviewedAt: new Date(),
      },
    }),
    prisma.user.update({
      where: { id: request.userId },
      data: { role: request.requestedRole },
    }),
    prisma.auditLog.create({
      data: {
        action: 'ROLE_REQUEST_APPROVED',
        adminId: reviewerId,
        adminEmail: reviewerName,
        details: `Approved ${request.requestedRole} role for user ${request.userName} (${request.userId})`,
      },
    }),
  ]);

  return updatedRequest;
}

/**
 * Reject a role request
 */
async function rejectRoleRequest(requestId, reviewerId, reviewerName, rejectionReason) {
  // Get request
  const request = await prisma.roleRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    throw new NotFoundError('Role request not found');
  }

  if (request.status !== 'PENDING') {
    throw new BadRequestError(`Request is already ${request.status.toLowerCase()}`);
  }

  // Get reviewer details
  const reviewer = await prisma.user.findUnique({
    where: { id: reviewerId },
    select: { role: true, woredaId: true },
  });

  if (!reviewer) {
    throw new NotFoundError('Reviewer not found');
  }

  // Check if reviewer has permission
  const allowedApprovers = ROLE_HIERARCHY[request.requestedRole] || [];
  if (!allowedApprovers.includes(reviewer.role)) {
    throw new ForbiddenError(
      `Your role (${reviewer.role}) cannot review ${request.requestedRole} requests`
    );
  }

  // Additional woreda-specific check
  if (reviewer.role === 'WOREDA_OFFICER' && reviewer.woredaId !== request.woredaId) {
    throw new ForbiddenError('You can only review requests from your own woreda');
  }

  if (!rejectionReason) {
    throw new BadRequestError('Rejection reason is required');
  }

  // Update request
  const [updatedRequest] = await prisma.$transaction([
    prisma.roleRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        rejectionReason,
        reviewedById: reviewerId,
        reviewedByName: reviewerName,
        reviewedAt: new Date(),
      },
    }),
    prisma.auditLog.create({
      data: {
        action: 'ROLE_REQUEST_REJECTED',
        adminId: reviewerId,
        adminEmail: reviewerName,
        details: `Rejected ${request.requestedRole} role for user ${request.userName} (${request.userId}). Reason: ${rejectionReason}`,
      },
    }),
  ]);

  return updatedRequest;
}

/**
 * Get request statistics (admin only)
 */
async function getRoleRequestStats() {
  const [total, pending, approved, rejected, byRole] = await Promise.all([
    prisma.roleRequest.count(),
    prisma.roleRequest.count({ where: { status: 'PENDING' } }),
    prisma.roleRequest.count({ where: { status: 'APPROVED' } }),
    prisma.roleRequest.count({ where: { status: 'REJECTED' } }),
    prisma.roleRequest.groupBy({
      by: ['requestedRole', 'status'],
      _count: true,
    }),
  ]);

  return {
    total,
    pending,
    approved,
    rejected,
    byRoleAndStatus: byRole,
  };
}

module.exports = {
  submitRoleRequest,
  getUserRoleRequests,
  getPendingRequests,
  approveRoleRequest,
  rejectRoleRequest,
  getRoleRequestStats,
  REQUESTABLE_ROLES,
};
