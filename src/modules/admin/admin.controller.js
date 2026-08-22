const adminService = require('./admin.service');
const roleRequestService = require('../roleRequest/roleRequest.service');

/**
 * Admin Controller - Professional Enterprise Dashboard
 */

async function getOverview(_req, res, next) {
  try {
    const data = await adminService.getOverview();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function getUsers(req, res, next) {
  try {
    const { page, limit, role, woredaId, search } = req.query;
    const data = await adminService.getUsers({ page, limit, role, woredaId, search });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function createUser(req, res, next) {
  try {
    const adminContext = { id: req.user?.id, email: req.user?.email, ip: req.ip };
    const data = await adminService.createUser(req.body, adminContext);
    return res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    const adminContext = { id: req.user?.id, email: req.user?.email, ip: req.ip };
    const data = await adminService.updateUser(id, req.body, adminContext);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function updateUserRole(req, res, next) {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const adminContext = { id: req.user?.id, email: req.user?.email, ip: req.ip };
    const data = await adminService.updateUserRole(id, role, adminContext);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
}

async function updateUserStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { isEmailVerified } = req.body;
    const adminContext = { id: req.user?.id, email: req.user?.email, ip: req.ip };
    const data = await adminService.updateUserStatus(id, { isEmailVerified }, adminContext);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;
    const adminContext = { id: req.user?.id, email: req.user?.email, ip: req.ip };
    const data = await adminService.deleteUser(id, adminContext);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function getFarms(req, res, next) {
  try {
    const { page, limit, woredaId, search } = req.query;
    const data = await adminService.getFarms({ page, limit, woredaId, search });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function createFarm(req, res, next) {
  try {
    const adminContext = { id: req.user?.id, email: req.user?.email, ip: req.ip };
    const data = await adminService.createFarm(req.body, adminContext);
    return res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function updateFarm(req, res, next) {
  try {
    const { id } = req.params;
    const adminContext = { id: req.user?.id, email: req.user?.email, ip: req.ip };
    const data = await adminService.updateFarm(id, req.body, adminContext);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function deleteFarm(req, res, next) {
  try {
    const { id } = req.params;
    const adminContext = { id: req.user?.id, email: req.user?.email, ip: req.ip };
    const data = await adminService.deleteFarm(id, adminContext);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function getSensors(req, res, next) {
  try {
    const { page, limit } = req.query;
    const data = await adminService.getSensors({ page, limit });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function createSensor(req, res, next) {
  try {
    const adminContext = { id: req.user?.id, email: req.user?.email, ip: req.ip };
    const data = await adminService.createSensor(req.body, adminContext);
    return res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function deleteSensor(req, res, next) {
  try {
    const { id } = req.params;
    const adminContext = { id: req.user?.id, email: req.user?.email, ip: req.ip };
    const data = await adminService.deleteSensor(id, adminContext);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function getAlerts(req, res, next) {
  try {
    const { page, limit } = req.query;
    const data = await adminService.getAlerts({ page, limit });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function deleteAlert(req, res, next) {
  try {
    const { id } = req.params;
    const adminContext = { id: req.user?.id, email: req.user?.email, ip: req.ip };
    const data = await adminService.deleteAlert(id, adminContext);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function getDiagnoses(req, res, next) {
  try {
    const { page, limit } = req.query;
    const data = await adminService.getDiagnoses({ page, limit });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function deleteDiagnosis(req, res, next) {
  try {
    const { id } = req.params;
    const adminContext = { id: req.user?.id, email: req.user?.email, ip: req.ip };
    const data = await adminService.deleteDiagnosis(id, adminContext);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function getSystemHealth(_req, res, next) {
  try {
    const data = await adminService.getSystemHealth();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function triggerIngestion(req, res, next) {
  try {
    const { jobType, payload } = req.body;
    const adminContext = { id: req.user?.id, email: req.user?.email, ip: req.ip };
    const data = await adminService.triggerIngestion(jobType, payload, adminContext);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function broadcastEmergencyAlert(req, res, next) {
  try {
    const adminContext = { id: req.user?.id, email: req.user?.email, ip: req.ip };
    const data = await adminService.broadcastEmergencyAlert(req.body, adminContext);
    return res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function getAuditLogs(req, res, next) {
  try {
    const { limit } = req.query;
    const data = await adminService.getAuditLogs(limit);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/**
 * Render Professional Admin Dashboard
 */
function renderDashboard(_req, res) {
  const fs = require('fs');
  const path = require('path');
  
  const dashboardPath = path.join(__dirname, 'templates', 'dashboard.html');
  
  fs.readFile(dashboardPath, 'utf8', (err, html) => {
    if (err) {
      console.error('Error loading dashboard:', err);
      return res.status(500).send('Dashboard template not found');
    }
    
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  });
}


async function cleanTestData(req, res, next) {
  try {
    const adminContext = { id: req.user?.id, email: req.user?.email, ip: req.ip };
    const result = await adminService.cleanTestData(adminContext);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  cleanTestData,
  getOverview,
  getUsers,
  createUser,
  updateUser,
  updateUserRole,
  updateUserStatus,
  deleteUser,
  getFarms,
  createFarm,
  updateFarm,
  deleteFarm,
  getSensors,
  createSensor,
  deleteSensor,
  getAlerts,
  deleteAlert,
  getDiagnoses,
  deleteDiagnosis,
  getSystemHealth,
  triggerIngestion,
  broadcastEmergencyAlert,
  getAuditLogs,
  renderDashboard,
};
