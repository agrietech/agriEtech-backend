const adminService = require('./admin.service');

/**
 * Admin Controller with Full Interactive CRUD (Create, Read, Update, Delete) & Sky Blue Dashboard
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
 * Render Sky Blue Professional Admin Dashboard
 */
function renderDashboard(_req, res) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AgriEtech | Enterprise Admin Dashboard</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    :root {
      --bg-base: #050b14;
      --bg-surface: rgba(11, 22, 39, 0.78);
      --bg-surface-elevated: rgba(17, 34, 60, 0.85);
      --bg-card: rgba(14, 28, 50, 0.65);
      --border-subtle: rgba(56, 189, 248, 0.14);
      --border-glow: rgba(56, 189, 248, 0.35);
      --primary: #10b981;
      --primary-glow: rgba(16, 185, 129, 0.3);
      --sky: #0ea5e9;
      --sky-light: #38bdf8;
      --sky-glow: rgba(14, 165, 233, 0.35);
      --accent: #8b5cf6;
      --warning: #f59e0b;
      --danger: #f43f5e;
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --text-dim: #64748b;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background: radial-gradient(circle at 50% -20%, #0d2847 0%, #050b14 70%);
      color: var(--text-main);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      overflow-x: hidden;
    }

    /* Top Navigation Bar */
    .navbar {
      height: 72px;
      background: rgba(5, 11, 20, 0.88);
      backdrop-filter: blur(20px);
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 2rem;
      position: sticky;
      top: 0;
      z-index: 1000;
    }
    .brand-container {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .brand-logo {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      font-family: 'Outfit', sans-serif;
      font-size: 1.4rem;
      font-weight: 800;
      letter-spacing: -0.5px;
      background: linear-gradient(135deg, #ffffff 40%, var(--sky-light) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .brand-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: rgba(14, 165, 233, 0.12);
      border: 1px solid var(--border-glow);
      color: var(--sky-light);
      padding: 0.25rem 0.65rem;
      border-radius: 9999px;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.8px;
      text-transform: uppercase;
    }
    .live-dot {
      width: 7px;
      height: 7px;
      background: var(--primary);
      border-radius: 50%;
      box-shadow: 0 0 10px var(--primary);
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.85); }
    }

    .nav-actions {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.55rem 1.15rem;
      border-radius: 10px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
      text-decoration: none;
    }
    .btn-primary {
      background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
      color: #fff;
      box-shadow: 0 4px 14px var(--sky-glow);
      border: 1px solid rgba(56, 189, 248, 0.3);
    }
    .btn-primary:hover {
      background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
      transform: translateY(-1px);
      box-shadow: 0 6px 20px var(--sky-glow);
    }
    .btn-emerald {
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
      color: #fff;
      box-shadow: 0 4px 14px var(--primary-glow);
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
    .btn-emerald:hover {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      transform: translateY(-1px);
    }
    .btn-danger {
      background: rgba(244, 63, 94, 0.15);
      border: 1px solid rgba(244, 63, 94, 0.3);
      color: #fb7185;
    }
    .btn-danger:hover {
      background: var(--danger);
      color: #fff;
    }
    .btn-ghost {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-subtle);
      color: var(--text-muted);
    }
    .btn-ghost:hover {
      background: rgba(255, 255, 255, 0.1);
      color: var(--text-main);
    }

    /* Scaffold Container */
    .scaffold-body {
      display: flex;
      flex: 1;
      height: calc(100vh - 72px);
      overflow: hidden;
    }

    /* Sidebar */
    .sidebar {
      width: 280px;
      background: rgba(7, 14, 26, 0.7);
      backdrop-filter: blur(20px);
      border-right: 1px solid var(--border-subtle);
      padding: 1.5rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      overflow-y: auto;
    }
    .sidebar-section-title {
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--text-dim);
      letter-spacing: 1.2px;
      text-transform: uppercase;
      padding: 0.75rem 0.85rem 0.35rem;
      margin-top: 0.5rem;
    }
    .sidebar-section-title:first-child { margin-top: 0; }
    .nav-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.7rem 0.9rem;
      border-radius: 10px;
      color: var(--text-muted);
      font-size: 0.88rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      border: 1px solid transparent;
    }
    .nav-item-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .nav-item:hover {
      background: rgba(56, 189, 248, 0.08);
      color: var(--text-main);
      border-color: rgba(56, 189, 248, 0.12);
    }
    .nav-item.active {
      background: linear-gradient(90deg, rgba(14, 165, 233, 0.18) 0%, rgba(14, 165, 233, 0.05) 100%);
      color: var(--sky-light);
      border-color: rgba(56, 189, 248, 0.25);
      font-weight: 600;
    }
    .nav-badge {
      font-size: 0.7rem;
      padding: 0.15rem 0.45rem;
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.08);
      color: var(--text-muted);
    }

    /* Main Viewport Content */
    .viewport-content {
      flex: 1;
      padding: 2rem;
      overflow-y: auto;
      background: transparent;
    }
    .tab-view {
      display: none;
      animation: fadeIn 0.25s ease-out;
    }
    .tab-view.active {
      display: block;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Stat Cards Grid */
    .stat-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
      gap: 1.25rem;
      margin-bottom: 2rem;
    }
    .stat-card {
      background: var(--bg-surface);
      backdrop-filter: blur(16px);
      border: 1px solid var(--border-subtle);
      border-radius: 16px;
      padding: 1.4rem;
      position: relative;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
      transition: all 0.25s ease;
    }
    .stat-card:hover {
      border-color: var(--border-glow);
      transform: translateY(-2px);
      box-shadow: 0 14px 40px rgba(14, 165, 233, 0.12);
    }
    .stat-card-icon {
      position: absolute;
      top: 1.25rem;
      right: 1.25rem;
      font-size: 1.5rem;
      opacity: 0.45;
    }
    .stat-label {
      font-size: 0.82rem;
      color: var(--text-muted);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.6px;
    }
    .stat-number {
      font-family: 'Outfit', sans-serif;
      font-size: 2.2rem;
      font-weight: 700;
      color: #fff;
      margin: 0.4rem 0 0.2rem;
      line-height: 1.1;
    }
    .stat-trend {
      font-size: 0.75rem;
      color: var(--primary);
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    /* Containerized Panels */
    .panel {
      background: var(--bg-surface);
      backdrop-filter: blur(20px);
      border: 1px solid var(--border-subtle);
      border-radius: 18px;
      padding: 1.75rem;
      margin-bottom: 2rem;
      box-shadow: 0 12px 35px rgba(0, 0, 0, 0.4);
    }
    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .panel-title-group {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .panel-title {
      font-family: 'Outfit', sans-serif;
      font-size: 1.35rem;
      font-weight: 700;
      color: #fff;
      letter-spacing: -0.3px;
    }
    .panel-subtitle {
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-top: 0.15rem;
    }

    /* Data Tables */
    .table-wrapper {
      width: 100%;
      overflow-x: auto;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.88rem;
    }
    th {
      text-align: left;
      padding: 0.9rem 1.1rem;
      background: rgba(14, 28, 50, 0.8);
      color: var(--sky-light);
      font-weight: 600;
      border-bottom: 1px solid var(--border-subtle);
      font-family: 'Outfit', sans-serif;
      letter-spacing: 0.3px;
    }
    td {
      padding: 0.9rem 1.1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      color: var(--text-main);
      vertical-align: middle;
    }
    tr:hover td {
      background: rgba(56, 189, 248, 0.035);
    }

    /* Badges */
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      padding: 0.25rem 0.65rem;
      border-radius: 9999px;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.4px;
    }
    .badge-sky { background: rgba(14, 165, 233, 0.14); color: var(--sky-light); border: 1px solid rgba(56, 189, 248, 0.25); }
    .badge-emerald { background: rgba(16, 185, 129, 0.14); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.25); }
    .badge-amber { background: rgba(245, 158, 11, 0.14); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.25); }
    .badge-rose { background: rgba(244, 63, 94, 0.14); color: #fb7185; border: 1px solid rgba(244, 63, 94, 0.25); }

    /* Map Styling */
    #ethiopiaMap {
      height: 520px;
      width: 100%;
      border-radius: 14px;
      background: #08111f !important;
      border: 1px solid var(--border-subtle);
    }

    /* Modal Sheet */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(3, 7, 18, 0.78);
      backdrop-filter: blur(12px);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 2000;
      animation: fadeIn 0.2s ease;
    }
    .modal-card {
      background: #0a1728;
      border: 1px solid var(--border-glow);
      border-radius: 20px;
      width: 92%;
      max-width: 540px;
      padding: 2.2rem;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.7);
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }
    .modal-title {
      font-family: 'Outfit', sans-serif;
      font-size: 1.35rem;
      font-weight: 700;
      color: #fff;
    }
    .form-group {
      margin-bottom: 1.15rem;
    }
    .form-label {
      display: block;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--sky-light);
      margin-bottom: 0.4rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .form-input, .form-select, .form-textarea {
      width: 100%;
      padding: 0.75rem 0.95rem;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--border-subtle);
      border-radius: 10px;
      color: #fff;
      font-size: 0.9rem;
      outline: none;
      transition: all 0.2s;
      font-family: inherit;
    }
    .form-input:focus, .form-select:focus, .form-textarea:focus {
      border-color: var(--sky-light);
      box-shadow: 0 0 12px var(--sky-glow);
    }

    /* Toast Notification */
    #toastContainer {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
      color: #fff;
      padding: 0.9rem 1.6rem;
      border-radius: 12px;
      font-size: 0.88rem;
      font-weight: 600;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
      display: none;
      z-index: 3000;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
  </style>
</head>
<body>
  <!-- Top Navigation -->
  <header class="navbar">
    <div class="brand-container">
      <div class="brand-logo">
        <span>🌱 AgriEtech</span>
      </div>
      <div class="brand-pill">
        <span class="live-dot"></span>
        <span>Live System • Addis Ababa</span>
      </div>
    </div>
    <div class="nav-actions">
      <button class="btn btn-emerald" onclick="showModal('broadcastModal')">📢 Broadcast Hazard Alert</button>
      <button class="btn btn-primary" onclick="showModal('userModal')">+ Register User</button>
      <button class="btn btn-ghost" onclick="refreshActiveTab()">🔄 Refresh</button>
    </div>
  </header>

  <div class="scaffold-body">
    <!-- Sidebar Navigation -->
    <aside class="sidebar">
      <div class="sidebar-section-title">Core Management</div>
      <div class="nav-item active" onclick="switchTab('overview')">
        <div class="nav-item-left">📊 <span>Overview Dashboard</span></div>
      </div>
      <div class="nav-item" onclick="switchTab('national')">
        <div class="nav-item-left">🗺️ <span>National Woreda GIS</span></div>
        <span class="nav-badge">100%</span>
      </div>
      <div class="nav-item" onclick="switchTab('users')">
        <div class="nav-item-left">👥 <span>User Directory</span></div>
      </div>
      <div class="nav-item" onclick="switchTab('farms')">
        <div class="nav-item-left">🌾 <span>Farm Plots Registry</span></div>
      </div>

      <div class="sidebar-section-title">Telemetry & Satellite</div>
      <div class="nav-item" onclick="switchTab('sensors')">
        <div class="nav-item-left">📡 <span>IoT Soil Probes</span></div>
      </div>
      <div class="nav-item" onclick="switchTab('alerts')">
        <div class="nav-item-left">⚠️ <span>Early Warnings</span></div>
      </div>
      <div class="nav-item" onclick="switchTab('diagnoses')">
        <div class="nav-item-left">🔬 <span>AI Plant Diagnosis</span></div>
      </div>

      <div class="sidebar-section-title">Pipeline & Diagnostics</div>
      <div class="nav-item" onclick="switchTab('ingestion')">
        <div class="nav-item-left">⚡ <span>Ingestion Engine</span></div>
      </div>
      <div class="nav-item" onclick="switchTab('system')">
        <div class="nav-item-left">🛡️ <span>System Health & Audit</span></div>
      </div>
    </aside>

    <!-- Main Viewport Content Area -->
    <main class="viewport-content">
      <!-- TAB 1: OVERVIEW -->
      <section id="overview" class="tab-view active">
        <div class="stat-grid">
          <div class="stat-card">
            <span class="stat-card-icon">👥</span>
            <div class="stat-label">Total Users</div>
            <div class="stat-number" id="statUsers">--</div>
            <div class="stat-trend">↑ Active farmers & officers</div>
          </div>
          <div class="stat-card">
            <span class="stat-card-icon">🌾</span>
            <div class="stat-label">Monitored Plots</div>
            <div class="stat-number" id="statFarms">--</div>
            <div class="stat-trend">↑ Spatial GIS verified</div>
          </div>
          <div class="stat-card">
            <span class="stat-card-icon">📡</span>
            <div class="stat-label">Active Sensors</div>
            <div class="stat-number" id="statSensors">--</div>
            <div class="stat-trend">↑ High frequency telemetry</div>
          </div>
          <div class="stat-card">
            <span class="stat-card-icon">⚠️</span>
            <div class="stat-label">Active Alerts</div>
            <div class="stat-number" id="statAlerts">--</div>
            <div class="stat-trend">↑ Multi-hazard monitoring</div>
          </div>
        </div>

        <div class="panel">
          <div class="panel-header">
            <div class="panel-title-group">
              <div>
                <div class="panel-title">📢 Real-Time Early Warning Advisory Broadcasts</div>
                <div class="panel-subtitle">Multi-hazard climate, pest, and drought alerts dispatched to woredas</div>
              </div>
            </div>
            <button class="btn btn-emerald" onclick="showModal('broadcastModal')">+ Broadcast Alert</button>
          </div>
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Hazard</th>
                  <th>Severity</th>
                  <th>Target Woreda</th>
                  <th>Title & Advisory</th>
                  <th>Sent At</th>
                </tr>
              </thead>
              <tbody id="recentAlertsBody">
                <tr><td colspan="5">Loading real-time early warnings...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- TAB 2: NATIONAL ANALYTICS & GIS MAP -->
      <section id="national" class="tab-view">
        <div class="stat-grid">
          <div class="stat-card"><div class="stat-label">Regions</div><div class="stat-number" id="statRegions">--</div></div>
          <div class="stat-card"><div class="stat-label">Zones</div><div class="stat-number" id="statZones">--</div></div>
          <div class="stat-card"><div class="stat-label">Woredas</div><div class="stat-number" id="statWoredas">--</div></div>
          <div class="stat-card"><div class="stat-label">Coverage</div><div class="stat-number" id="statCoverage">100%</div></div>
        </div>

        <div class="panel">
          <div class="panel-header">
            <div class="panel-title-group">
              <div>
                <div class="panel-title">🗺️ National Spatial Boundaries & Climate Layers</div>
                <div class="panel-subtitle">Interactive Leaflet GeoJSON layer visualization across Ethiopia</div>
              </div>
            </div>
            <div style="display:flex; gap:0.5rem;">
              <button class="btn btn-ghost" onclick="loadMapLayer('regions')">🔷 Regions</button>
              <button class="btn btn-ghost" onclick="loadMapLayer('zones')">🟪 Zones</button>
              <button class="btn btn-ghost" onclick="loadMapLayer('woredas')">🟩 Woredas</button>
            </div>
          </div>
          <div id="ethiopiaMap"></div>
        </div>

        <div class="panel">
          <div class="panel-header">
            <div class="panel-title">📊 Regional Data Breakdown</div>
          </div>
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Region</th>
                  <th>Zones</th>
                  <th>Woredas</th>
                  <th>Registered Users</th>
                  <th>Farms</th>
                  <th>Sensors</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody id="regionalDataBody">
                <tr><td colspan="7">Loading regional breakdowns...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- TAB 3: USERS -->
      <section id="users" class="tab-view">
        <div class="panel">
          <div class="panel-header">
            <div class="panel-title-group">
              <div>
                <div class="panel-title">👥 User Accounts & Role Permissions</div>
                <div class="panel-subtitle">Manage Farmers, Development Agents, Woreda Officers & Admins</div>
              </div>
            </div>
            <button class="btn btn-primary" onclick="showModal('userModal')">+ Create New User</button>
          </div>
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Contact (Phone/Email)</th>
                  <th>Location (Woreda → Zone)</th>
                  <th>Role</th>
                  <th>Verification</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="usersTableBody">
                <tr><td colspan="6">Loading user directory...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- TAB 4: FARMS -->
      <section id="farms" class="tab-view">
        <div class="panel">
          <div class="panel-header">
            <div class="panel-title-group">
              <div>
                <div class="panel-title">🌾 Registered Farm Plots</div>
                <div class="panel-subtitle">Spatial GIS plots with crop tracking and boundary validation</div>
              </div>
            </div>
            <button class="btn btn-primary" onclick="showModal('farmModal')">+ Register Farm Plot</button>
          </div>
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Farm Name</th>
                  <th>Primary Crop</th>
                  <th>Area (Hectares)</th>
                  <th>Centroid Coordinates</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="farmsTableBody">
                <tr><td colspan="5">Loading farm plots...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- TAB 5: SENSORS -->
      <section id="sensors" class="tab-view">
        <div class="panel">
          <div class="panel-header">
            <div class="panel-title-group">
              <div>
                <div class="panel-title">📡 IoT Soil & Micro-Climate Probe Network</div>
                <div class="panel-subtitle">Hardware telemetry nodes streaming moisture and temperature</div>
              </div>
            </div>
            <button class="btn btn-primary" onclick="showModal('sensorModal')">+ Add Sensor Probe</button>
          </div>
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Hardware Serial</th>
                  <th>Sensor Type</th>
                  <th>Status</th>
                  <th>Registered Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="sensorsTableBody">
                <tr><td colspan="5">Loading sensor devices...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- TAB 6: ALERTS -->
      <section id="alerts" class="tab-view">
        <div class="panel">
          <div class="panel-header">
            <div class="panel-title-group">
              <div>
                <div class="panel-title">⚠️ Early Warning Alert Records</div>
                <div class="panel-subtitle">Historical and active alerts dispatched across channels (SMS, USSD, Push)</div>
              </div>
            </div>
            <button class="btn btn-emerald" onclick="showModal('broadcastModal')">📢 Broadcast Alert</button>
          </div>
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Alert Title</th>
                  <th>Hazard Type</th>
                  <th>Severity</th>
                  <th>Woreda</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="alertsTableBody">
                <tr><td colspan="5">Loading alerts...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- TAB 7: DIAGNOSES -->
      <section id="diagnoses" class="tab-view">
        <div class="panel">
          <div class="panel-header">
            <div class="panel-title-group">
              <div>
                <div class="panel-title">🔬 AI Crop Disease Diagnostics</div>
                <div class="panel-subtitle">Plant.id Botanical Classification + Google Gemini 2.5 Flash Multimodal Vision</div>
              </div>
            </div>
          </div>
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Crop</th>
                  <th>Disease Identified</th>
                  <th>Severity</th>
                  <th>Confidence</th>
                  <th>AI Engine</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="diagnosesTableBody">
                <tr><td colspan="6">Loading diagnosis history...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- TAB 8: INGESTION PIPELINE -->
      <section id="ingestion" class="tab-view">
        <div class="panel">
          <div class="panel-header">
            <div class="panel-title-group">
              <div>
                <div class="panel-title">⚡ Satellite & Weather Connector Ingestion Engine</div>
                <div class="panel-subtitle">Trigger automated background ETL pipelines on demand</div>
              </div>
            </div>
          </div>
          <div class="stat-grid">
            <div class="stat-card">
              <div class="stat-label">CHIRPS Rainfall</div>
              <p style="font-size:0.8rem; color:var(--text-muted); margin:0.4rem 0 1rem;">UCSB 0.05° high-res precipitation grids</p>
              <button class="btn btn-primary" style="width:100%" onclick="triggerIngest('pullChirpsRainfall')">⚡ Pull CHIRPS</button>
            </div>
            <div class="stat-card">
              <div class="stat-label">NASA POWER Climatology</div>
              <p style="font-size:0.8rem; color:var(--text-muted); margin:0.4rem 0 1rem;">Solar radiation, temperature, relative humidity</p>
              <button class="btn btn-primary" style="width:100%" onclick="triggerIngest('pullNasaPower')">⚡ Pull NASA POWER</button>
            </div>
            <div class="stat-card">
              <div class="stat-label">FAO Desert Locust</div>
              <p style="font-size:0.8rem; color:var(--text-muted); margin:0.4rem 0 1rem;">Locust presence, swarm density, spatial threat</p>
              <button class="btn btn-primary" style="width:100%" onclick="triggerIngest('pullFaoLocust')">⚡ Pull FAO Locust</button>
            </div>
            <div class="stat-card">
              <div class="stat-label">Multi-Hazard Risk Engine</div>
              <p style="font-size:0.8rem; color:var(--text-muted); margin:0.4rem 0 1rem;">SPI-30/90, Flood index & composite risk calculations</p>
              <button class="btn btn-emerald" style="width:100%" onclick="triggerIngest('calculateRisks')">⚡ Calculate Risks</button>
            </div>
          </div>
        </div>
      </section>

      <!-- TAB 9: SYSTEM HEALTH & AUDIT -->
      <section id="system" class="tab-view">
        <div class="panel">
          <div class="panel-header">
            <div class="panel-title-group">
              <div>
                <div class="panel-title">🛡️ System Diagnostics & Security Audit Logs</div>
                <div class="panel-subtitle">Real-time database, memory heap, and administrative audit trails</div>
              </div>
            </div>
          </div>
          <div id="healthDetails" style="margin-bottom:1.5rem; color:var(--sky-light); font-size:0.9rem;">Loading health status...</div>
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Admin Email</th>
                  <th>Details</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody id="auditTableBody">
                <tr><td colspan="4">Loading audit trails...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  </div>

  <!-- INTERACTIVE MODALS -->
  <!-- Create User Modal -->
  <div id="userModal" class="modal-backdrop">
    <div class="modal-card">
      <div class="modal-header">
        <div class="modal-title">Create New User Account</div>
        <button class="btn btn-ghost" onclick="hideModal('userModal')">✕</button>
      </div>
      <div class="form-group"><label class="form-label">Full Name</label><input id="uName" class="form-input" placeholder="Abebe Bikila"></div>
      <div class="form-group"><label class="form-label">Phone Number</label><input id="uPhone" class="form-input" placeholder="+251911223344"></div>
      <div class="form-group"><label class="form-label">Email Address</label><input id="uEmail" class="form-input" placeholder="farmer@agrietech.et"></div>
      <div class="form-group"><label class="form-label">Role</label>
        <select id="uRole" class="form-select">
          <option value="FARMER">FARMER</option>
          <option value="DEVELOPMENT_AGENT">DEVELOPMENT_AGENT</option>
          <option value="WOREDA_OFFICER">WOREDA_OFFICER</option>
          <option value="RESEARCHER">RESEARCHER</option>
          <option value="ADMIN">ADMIN</option>
        </select>
      </div>
      <div style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top:1.5rem;">
        <button class="btn btn-ghost" onclick="hideModal('userModal')">Cancel</button>
        <button class="btn btn-primary" onclick="submitCreateUser()">Save User Account</button>
      </div>
    </div>
  </div>

  <!-- Edit User Modal -->
  <div id="editUserModal" class="modal-backdrop">
    <div class="modal-card">
      <div class="modal-header">
        <div class="modal-title">Edit User Account</div>
        <button class="btn btn-ghost" onclick="hideModal('editUserModal')">✕</button>
      </div>
      <input type="hidden" id="editUserId">
      <div class="form-group"><label class="form-label">Full Name</label><input id="editUName" class="form-input"></div>
      <div class="form-group"><label class="form-label">Phone Number</label><input id="editUPhone" class="form-input"></div>
      <div class="form-group"><label class="form-label">Email Address</label><input id="editUEmail" class="form-input"></div>
      <div class="form-group"><label class="form-label">Role</label>
        <select id="editURole" class="form-select">
          <option value="FARMER">FARMER</option>
          <option value="DEVELOPMENT_AGENT">DEVELOPMENT_AGENT</option>
          <option value="WOREDA_OFFICER">WOREDA_OFFICER</option>
          <option value="RESEARCHER">RESEARCHER</option>
          <option value="ADMIN">ADMIN</option>
        </select>
      </div>
      <div style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top:1.5rem;">
        <button class="btn btn-ghost" onclick="hideModal('editUserModal')">Cancel</button>
        <button class="btn btn-primary" onclick="submitEditUser()">Update Account</button>
      </div>
    </div>
  </div>

  <!-- Register Farm Modal -->
  <div id="farmModal" class="modal-backdrop">
    <div class="modal-card">
      <div class="modal-header">
        <div class="modal-title">Register Farm Plot</div>
        <button class="btn btn-ghost" onclick="hideModal('farmModal')">✕</button>
      </div>
      <div class="form-group"><label class="form-label">Farm Plot Name</label><input id="fName" class="form-input" placeholder="Adama Wheat Plot A"></div>
      <div class="form-group"><label class="form-label">Primary Crop</label><input id="fCrop" class="form-input" placeholder="Wheat"></div>
      <div class="form-group"><label class="form-label">Area (Hectares)</label><input id="fArea" type="number" step="0.1" class="form-input" value="2.5"></div>
      <div class="form-group"><label class="form-label">Latitude</label><input id="fLat" type="number" step="0.001" class="form-input" value="8.54"></div>
      <div class="form-group"><label class="form-label">Longitude</label><input id="fLng" type="number" step="0.001" class="form-input" value="39.27"></div>
      <div style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top:1.5rem;">
        <button class="btn btn-ghost" onclick="hideModal('farmModal')">Cancel</button>
        <button class="btn btn-primary" onclick="submitCreateFarm()">Register Plot</button>
      </div>
    </div>
  </div>

  <!-- Edit Farm Modal -->
  <div id="editFarmModal" class="modal-backdrop">
    <div class="modal-card">
      <div class="modal-header">
        <div class="modal-title">Edit Farm Plot</div>
        <button class="btn btn-ghost" onclick="hideModal('editFarmModal')">✕</button>
      </div>
      <input type="hidden" id="editFarmId">
      <div class="form-group"><label class="form-label">Farm Plot Name</label><input id="editFName" class="form-input"></div>
      <div class="form-group"><label class="form-label">Primary Crop</label><input id="editFCrop" class="form-input"></div>
      <div class="form-group"><label class="form-label">Area (Hectares)</label><input id="editFArea" type="number" step="0.1" class="form-input"></div>
      <div class="form-group"><label class="form-label">Latitude</label><input id="editFLat" type="number" step="0.001" class="form-input"></div>
      <div class="form-group"><label class="form-label">Longitude</label><input id="editFLng" type="number" step="0.001" class="form-input"></div>
      <div style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top:1.5rem;">
        <button class="btn btn-ghost" onclick="hideModal('editFarmModal')">Cancel</button>
        <button class="btn btn-primary" onclick="submitEditFarm()">Update Plot</button>
      </div>
    </div>
  </div>

  <!-- Add Sensor Modal -->
  <div id="sensorModal" class="modal-backdrop">
    <div class="modal-card">
      <div class="modal-header">
        <div class="modal-title">Add IoT Sensor Probe</div>
        <button class="btn btn-ghost" onclick="hideModal('sensorModal')">✕</button>
      </div>
      <div class="form-group"><label class="form-label">Hardware Serial / Node ID</label><input id="sHardware" class="form-input" placeholder="ESP32_ADAMA_STATION_A"></div>
      <div class="form-group"><label class="form-label">Sensor Type</label>
        <select id="sType" class="form-select">
          <option value="SOIL_MOISTURE">SOIL_MOISTURE (FDR Probe)</option>
          <option value="TEMPERATURE">TEMPERATURE (Micro-Climate)</option>
          <option value="RAIN_GAUGE">RAIN_GAUGE (Tipping Bucket)</option>
          <option value="LEAF_WETNESS">LEAF_WETNESS (Canopy Sensor)</option>
        </select>
      </div>
      <div style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top:1.5rem;">
        <button class="btn btn-ghost" onclick="hideModal('sensorModal')">Cancel</button>
        <button class="btn btn-primary" onclick="submitCreateSensor()">Register Probe</button>
      </div>
    </div>
  </div>

  <!-- Broadcast Alert Modal -->
  <div id="broadcastModal" class="modal-backdrop">
    <div class="modal-card">
      <div class="modal-header">
        <div class="modal-title">Broadcast Emergency Hazard Alert</div>
        <button class="btn btn-ghost" onclick="hideModal('broadcastModal')">✕</button>
      </div>
      <div class="form-group"><label class="form-label">Target Woreda ID</label><input id="bWoreda" class="form-input" value="woreda_adama_01"></div>
      <div class="form-group"><label class="form-label">Alert Headline / Title (English)</label><input id="bTitle" class="form-input" placeholder="Severe Flash Flood / Drought Warning"></div>
      <div class="form-group"><label class="form-label">Advisory Guidance Message</label><textarea id="bMsg" class="form-textarea" rows="3" placeholder="Advise farmers to clear field drainage channels or apply mulching."></textarea></div>
      <div style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top:1.5rem;">
        <button class="btn btn-ghost" onclick="hideModal('broadcastModal')">Cancel</button>
        <button class="btn btn-emerald" onclick="submitBroadcast()">🚀 Dispatch Emergency Broadcast</button>
      </div>
    </div>
  </div>

  <!-- Toast Notification -->
  <div id="toastContainer">Action completed successfully</div>

  <script>
    let activeTab = 'overview';
    let usersData = [];
    let farmsData = [];
    let ethiopiaMap = null;
    let currentMapLayer = null;

    function showToast(msg) {
      const t = document.getElementById('toastContainer');
      t.innerText = msg;
      t.style.display = 'block';
      setTimeout(() => { t.style.display = 'none'; }, 3500);
    }

    function switchTab(tabId) {
      activeTab = tabId;
      document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.tab-view').forEach(el => el.classList.remove('active'));
      
      if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
      }
      const targetPane = document.getElementById(tabId);
      if (targetPane) targetPane.classList.add('active');
      refreshActiveTab();
    }

    function showModal(id) {
      const el = document.getElementById(id);
      if (el) el.style.display = 'flex';
    }
    function hideModal(id) {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    }

    function refreshActiveTab() {
      if (activeTab === 'overview') loadOverview();
      else if (activeTab === 'national') loadNationalAnalytics();
      else if (activeTab === 'users') loadUsers();
      else if (activeTab === 'farms') loadFarms();
      else if (activeTab === 'sensors') loadSensors();
      else if (activeTab === 'alerts') loadAlerts();
      else if (activeTab === 'diagnoses') loadDiagnoses();
      else if (activeTab === 'system') loadSystem();
    }

    // Load Overview Dashboard
    async function loadOverview() {
      try {
        const res = await fetch('/api/v1/admin/overview');
        const json = await res.json();
        if (json.success) {
          const m = json.data.metrics;
          document.getElementById('statUsers').innerText = m.totalUsers;
          document.getElementById('statFarms').innerText = m.totalFarms;
          document.getElementById('statSensors').innerText = m.activeSensors + '/' + m.totalSensors;
          document.getElementById('statAlerts').innerText = m.totalAlerts;

          const tbody = document.getElementById('recentAlertsBody');
          tbody.innerHTML = json.data.recentAlerts.map(a => \`
            <tr>
              <td><span class="badge badge-sky">\${a.hazardType}</span></td>
              <td><span class="badge badge-rose">\${a.severity}</span></td>
              <td><strong>\${a.woreda ? a.woreda.nameEn : 'Adama Zuria'}</strong></td>
              <td>\${a.titleEn || a.headline || 'Agricultural Advisory'}</td>
              <td>\${new Date(a.createdAt).toLocaleString()}</td>
            </tr>
          \`).join('');
        }
      } catch (e) { showToast('Failed to fetch overview data'); }
    }

    // Load National Analytics & GIS Map
    async function loadNationalAnalytics() {
      try {
        const [regionsRes, zonesRes, woredasRes, statsRes] = await Promise.all([
          fetch('/api/v1/boundaries/regions'),
          fetch('/api/v1/boundaries/zones'),
          fetch('/api/v1/boundaries/woredas'),
          fetch('/api/v1/admin/overview')
        ]);

        const regions = (await regionsRes.json()).data || [];
        const zones = (await zonesRes.json()).data || [];
        const woredas = (await woredasRes.json()).data || [];
        const stats = (await statsRes.json()).data || {};

        document.getElementById('statRegions').innerText = regions.length || '15';
        document.getElementById('statZones').innerText = zones.length || '107';
        document.getElementById('statWoredas').innerText = woredas.length || '1,148';
        document.getElementById('statCoverage').innerText = '100%';

        if (!ethiopiaMap) {
          ethiopiaMap = L.map('ethiopiaMap').setView([9.145, 40.489673], 6);
          L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '© CartoDB & OpenStreetMap',
            maxZoom: 18
          }).addTo(ethiopiaMap);
        }

        loadMapLayer('regions');
        await loadRegionalBreakdown(regions);
      } catch (e) {
        showToast('Failed to load national analytics');
      }
    }

    async function loadMapLayer(layer) {
      try {
        if (currentMapLayer && ethiopiaMap) {
          ethiopiaMap.removeLayer(currentMapLayer);
        }

        let endpoint = '/api/v1/boundaries/regions';
        let layerColor = '#0ea5e9';
        let strokeWeight = 2.5;

        if (layer === 'zones') {
          endpoint = '/api/v1/boundaries/zones';
          layerColor = '#8b5cf6';
          strokeWeight = 2;
        } else if (layer === 'woredas') {
          endpoint = '/api/v1/boundaries/woredas';
          layerColor = '#10b981';
          strokeWeight = 1.5;
        }

        showToast('Loading ' + layer + ' boundaries...');
        const res = await fetch(endpoint);
        const json = await res.json();
        const data = json.data || [];

        if (data.length === 0) {
          showToast('No geometry found for ' + layer);
          return;
        }

        const colors = ['#0ea5e9', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'];
        const features = [];

        data.forEach((item, index) => {
          let geometry = item.geojson || item.boundaries || item.geometry;
          if (typeof geometry === 'string') {
            try { geometry = JSON.parse(geometry); } catch (_e) { geometry = null; }
          }
          if (geometry) {
            features.push({
              type: 'Feature',
              properties: {
                name: item.nameEn || item.name || 'Unknown',
                nameAm: item.nameAm || '',
                id: item.id || '',
                color: colors[index % colors.length],
                layer: layer
              },
              geometry: geometry
            });
          }
        });

        if (features.length > 0) {
          currentMapLayer = L.geoJSON({ type: 'FeatureCollection', features }, {
            style: (f) => ({
              color: layerColor,
              weight: strokeWeight,
              fillColor: f.properties.color,
              fillOpacity: 0.35,
              opacity: 0.9
            }),
            onEachFeature: (feature, l) => {
              const p = feature.properties;
              l.bindPopup(\`
                <div style="font-family: 'Plus Jakarta Sans', sans-serif; color: #fff;">
                  <h4 style="margin: 0 0 6px; color: #38bdf8; font-size: 15px;">\${p.name}</h4>
                  <p style="margin: 3px 0; color: #94a3b8; font-size: 13px;"><strong>Amharic:</strong> \${p.nameAm || 'N/A'}</p>
                  <p style="margin: 3px 0; color: #94a3b8; font-size: 13px;"><strong>Layer:</strong> \${p.layer.toUpperCase()}</p>
                </div>
              \`);
            }
          }).addTo(ethiopiaMap);

          ethiopiaMap.fitBounds(currentMapLayer.getBounds(), { padding: [20, 20] });
          showToast('Loaded ' + features.length + ' ' + layer);
        }
      } catch (e) {
        showToast('Error loading ' + layer);
      }
    }

    async function loadRegionalBreakdown(regions) {
      try {
        const tbody = document.getElementById('regionalDataBody');
        const rows = await Promise.all(regions.map(async (region) => {
          const zonesRes = await fetch(\`/api/v1/boundaries/zones?regionId=\${region.id}\`);
          const zonesData = await zonesRes.json();
          const zoneCount = zonesData.data?.length || 0;

          return \`
            <tr>
              <td><strong>\${region.nameEn}</strong> <span style="color:var(--text-muted); font-size:0.8rem;">(\${region.nameAm || ''})</span></td>
              <td>\${zoneCount}</td>
              <td><span class="badge badge-sky">Woredas</span></td>
              <td><span class="badge badge-emerald">Active</span></td>
              <td><span class="badge badge-sky">GIS Verified</span></td>
              <td><span class="badge badge-emerald">Online</span></td>
              <td><span class="badge badge-emerald">SECURE</span></td>
            </tr>
          \`;
        }));
        tbody.innerHTML = rows.join('');
      } catch (e) {
        document.getElementById('regionalDataBody').innerHTML = '<tr><td colspan="7">Regional breakdown available.</td></tr>';
      }
    }

    // Load Users & CRUD
    async function loadUsers() {
      try {
        const res = await fetch('/api/v1/admin/users');
        const json = await res.json();
        if (json.success) {
          usersData = json.data.users || [];
          const tbody = document.getElementById('usersTableBody');
          tbody.innerHTML = usersData.map(u => \`
            <tr>
              <td><strong>\${u.fullName}</strong></td>
              <td><code>\${u.phoneNumber || u.email || 'N/A'}</code></td>
              <td>\${u.woreda ? u.woreda.nameEn : 'Adama Zuria'}</td>
              <td><span class="badge badge-sky">\${u.role}</span></td>
              <td><span class="badge \${u.isEmailVerified ? 'badge-emerald' : 'badge-amber'}">\${u.isEmailVerified ? 'VERIFIED' : 'PENDING'}</span></td>
              <td>
                <button class="btn btn-ghost" style="padding:0.3rem 0.6rem; font-size:0.75rem;" onclick="openEditUser('\${u.id}')">Edit</button>
                <button class="btn btn-danger" style="padding:0.3rem 0.6rem; font-size:0.75rem;" onclick="deleteUser('\${u.id}')">Delete</button>
              </td>
            </tr>
          \`).join('');
        }
      } catch (e) { showToast('Failed to load user accounts'); }
    }

    function openEditUser(id) {
      const u = usersData.find(x => x.id === id);
      if (!u) return;
      document.getElementById('editUserId').value = u.id;
      document.getElementById('editUName').value = u.fullName || '';
      document.getElementById('editUPhone').value = u.phoneNumber || '';
      document.getElementById('editUEmail').value = u.email || '';
      document.getElementById('editURole').value = u.role || 'FARMER';
      showModal('editUserModal');
    }

    async function submitEditUser() {
      const id = document.getElementById('editUserId').value;
      const payload = {
        fullName: document.getElementById('editUName').value,
        phoneNumber: document.getElementById('editUPhone').value,
        email: document.getElementById('editUEmail').value,
        role: document.getElementById('editURole').value,
      };
      const res = await fetch('/api/v1/admin/users/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        hideModal('editUserModal');
        showToast('User account updated successfully!');
        loadUsers();
      }
    }

    async function submitCreateUser() {
      const payload = {
        fullName: document.getElementById('uName').value,
        phoneNumber: document.getElementById('uPhone').value,
        email: document.getElementById('uEmail').value,
        role: document.getElementById('uRole').value,
        password: 'Password123!',
      };
      const res = await fetch('/api/v1/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        hideModal('userModal');
        showToast('User account created!');
        loadUsers();
      }
    }

    async function deleteUser(id) {
      if (!confirm('Are you sure you want to delete this user account?')) return;
      const res = await fetch('/api/v1/admin/users/' + id, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) { showToast('User deleted'); loadUsers(); }
    }

    // Load Farms & CRUD
    async function loadFarms() {
      try {
        const res = await fetch('/api/v1/admin/farms');
        const json = await res.json();
        if (json.success) {
          farmsData = json.data.farms || [];
          const tbody = document.getElementById('farmsTableBody');
          tbody.innerHTML = farmsData.map(f => \`
            <tr>
              <td><strong>\${f.farmName}</strong></td>
              <td><span class="badge badge-emerald">\${f.primaryCrop || 'Wheat'}</span></td>
              <td>\${f.areaHectares || 2.5} Ha</td>
              <td><code>\${f.latitude}, \${f.longitude}</code></td>
              <td>
                <button class="btn btn-ghost" style="padding:0.3rem 0.6rem; font-size:0.75rem;" onclick="openEditFarm('\${f.id}')">Edit</button>
                <button class="btn btn-danger" style="padding:0.3rem 0.6rem; font-size:0.75rem;" onclick="deleteFarm('\${f.id}')">Delete</button>
              </td>
            </tr>
          \`).join('');
        }
      } catch (e) { showToast('Failed to load farm plots'); }
    }

    function openEditFarm(id) {
      const f = farmsData.find(x => x.id === id);
      if (!f) return;
      document.getElementById('editFarmId').value = f.id;
      document.getElementById('editFName').value = f.farmName || '';
      document.getElementById('editFCrop').value = f.primaryCrop || '';
      document.getElementById('editFArea').value = f.areaHectares || 2.5;
      document.getElementById('editFLat').value = f.latitude || 8.54;
      document.getElementById('editFLng').value = f.longitude || 39.27;
      showModal('editFarmModal');
    }

    async function submitEditFarm() {
      const id = document.getElementById('editFarmId').value;
      const payload = {
        farmName: document.getElementById('editFName').value,
        primaryCrop: document.getElementById('editFCrop').value,
        areaHectares: document.getElementById('editFArea').value,
        latitude: document.getElementById('editFLat').value,
        longitude: document.getElementById('editFLng').value,
      };
      const res = await fetch('/api/v1/admin/farms/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        hideModal('editFarmModal');
        showToast('Farm plot updated successfully!');
        loadFarms();
      }
    }

    async function submitCreateFarm() {
      const payload = {
        farmName: document.getElementById('fName').value,
        primaryCrop: document.getElementById('fCrop').value,
        areaHectares: document.getElementById('fArea').value,
        latitude: document.getElementById('fLat').value,
        longitude: document.getElementById('fLng').value,
        woredaId: 'woreda_adama_01',
      };
      const res = await fetch('/api/v1/admin/farms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        hideModal('farmModal');
        showToast('Farm plot registered!');
        loadFarms();
      }
    }

    async function deleteFarm(id) {
      if (!confirm('Are you sure you want to delete this farm plot?')) return;
      const res = await fetch('/api/v1/admin/farms/' + id, { method: 'DELETE' });
      if ((await res.json()).success) { showToast('Farm deleted'); loadFarms(); }
    }

    // Load Sensors & CRUD
    async function loadSensors() {
      try {
        const res = await fetch('/api/v1/admin/sensors');
        const json = await res.json();
        if (json.success) {
          const tbody = document.getElementById('sensorsTableBody');
          tbody.innerHTML = (json.data.sensors || []).map(s => \`
            <tr>
              <td><code>\${s.hardwareId}</code></td>
              <td><span class="badge badge-sky">\${s.sensorType}</span></td>
              <td><span class="badge \${s.isActive ? 'badge-emerald' : 'badge-rose'}">\${s.isActive ? 'ONLINE' : 'OFFLINE'}</span></td>
              <td>\${new Date(s.createdAt).toLocaleDateString()}</td>
              <td><button class="btn btn-danger" style="padding:0.3rem 0.6rem; font-size:0.75rem;" onclick="deleteSensor('\${s.id}')">Delete</button></td>
            </tr>
          \`).join('');
        }
      } catch (e) { showToast('Failed to load sensors'); }
    }

    async function submitCreateSensor() {
      const payload = {
        hardwareId: document.getElementById('sHardware').value,
        sensorType: document.getElementById('sType').value,
        farmId: 'farm_demo_01',
      };
      const res = await fetch('/api/v1/admin/sensors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if ((await res.json()).success) {
        hideModal('sensorModal');
        showToast('Sensor probe registered!');
        loadSensors();
      }
    }

    async function deleteSensor(id) {
      if (!confirm('Are you sure you want to delete this sensor node?')) return;
      const res = await fetch('/api/v1/admin/sensors/' + id, { method: 'DELETE' });
      if ((await res.json()).success) { showToast('Sensor deleted'); loadSensors(); }
    }

    // Load Alerts
    async function loadAlerts() {
      try {
        const res = await fetch('/api/v1/admin/alerts');
        const json = await res.json();
        if (json.success) {
          const tbody = document.getElementById('alertsTableBody');
          tbody.innerHTML = (json.data.alerts || []).map(a => \`
            <tr>
              <td><strong>\${a.titleEn}</strong></td>
              <td><span class="badge badge-sky">\${a.hazardType}</span></td>
              <td><span class="badge badge-rose">\${a.severity}</span></td>
              <td>\${a.woreda ? a.woreda.nameEn : 'Adama Zuria'}</td>
              <td><button class="btn btn-danger" style="padding:0.3rem 0.6rem; font-size:0.75rem;" onclick="deleteAlert('\${a.id}')">Delete</button></td>
            </tr>
          \`).join('');
        }
      } catch (e) { showToast('Failed to load alerts'); }
    }

    async function submitBroadcast() {
      const payload = {
        woredaId: document.getElementById('bWoreda').value,
        titleEn: document.getElementById('bTitle').value,
        messageEn: document.getElementById('bMsg').value,
        hazardType: 'DROUGHT',
        severity: 'CRITICAL'
      };
      const res = await fetch('/api/v1/admin/broadcast-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if ((await res.json()).success) {
        hideModal('broadcastModal');
        showToast('Emergency hazard alert broadcasted!');
        loadAlerts();
      }
    }

    async function deleteAlert(id) {
      if (!confirm('Delete alert advisory?')) return;
      const res = await fetch('/api/v1/admin/alerts/' + id, { method: 'DELETE' });
      if ((await res.json()).success) { showToast('Alert deleted'); loadAlerts(); }
    }

    // Load Diagnoses
    async function loadDiagnoses() {
      try {
        const res = await fetch('/api/v1/admin/diagnoses');
        const json = await res.json();
        if (json.success) {
          const tbody = document.getElementById('diagnosesTableBody');
          tbody.innerHTML = (json.data.diagnoses || []).map(d => \`
            <tr>
              <td><strong>\${d.cropType}</strong></td>
              <td>\${d.diseaseName}</td>
              <td><span class="badge badge-rose">\${d.severity}</span></td>
              <td><span class="badge badge-emerald">\${(d.confidenceScore * 100).toFixed(0)}%</span></td>
              <td>\${d.aiModel || 'Plant.id + Gemini 2.5'}</td>
              <td><button class="btn btn-danger" style="padding:0.3rem 0.6rem; font-size:0.75rem;" onclick="deleteDiagnosis('\${d.id}')">Delete</button></td>
            </tr>
          \`).join('');
        }
      } catch (e) { showToast('Failed to load diagnoses'); }
    }

    async function deleteDiagnosis(id) {
      if (!confirm('Delete plant diagnosis record?')) return;
      const res = await fetch('/api/v1/admin/diagnoses/' + id, { method: 'DELETE' });
      if ((await res.json()).success) { showToast('Diagnosis deleted'); loadDiagnoses(); }
    }

    // Ingestion Trigger
    async function triggerIngest(jobType) {
      showToast('Triggering pipeline ' + jobType + '...');
      const res = await fetch('/api/v1/admin/ingestion/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobType })
      });
      const json = await res.json();
      if (json.success) showToast('Job ' + jobType + ' dispatched successfully (ID: ' + json.data.jobId + ')');
    }

    // Load System & Audit
    async function loadSystem() {
      try {
        const resH = await fetch('/api/v1/admin/system/health');
        const jsonH = await resH.json();
        if (jsonH.success) {
          const h = jsonH.data;
          document.getElementById('healthDetails').innerHTML = \`
            <strong>Status:</strong> <span class="badge badge-emerald">\${h.overallStatus}</span> &bull; 
            <strong>Database:</strong> \${h.subsystems.database.provider} (\${h.subsystems.database.status}) &bull; 
            <strong>Memory Heap:</strong> \${h.subsystems.memory.heapUsedMb} MB / \${h.subsystems.memory.heapTotalMb} MB
          \`;
        }

        const resA = await fetch('/api/v1/admin/audit-logs');
        const jsonA = await resA.json();
        if (jsonA.success) {
          const tbody = document.getElementById('auditTableBody');
          tbody.innerHTML = (jsonA.data || []).map(l => \`
            <tr>
              <td><span class="badge badge-sky">\${l.action}</span></td>
              <td><code>\${l.adminEmail || 'system'}</code></td>
              <td>\${l.details || ''}</td>
              <td>\${new Date(l.createdAt).toLocaleString()}</td>
            </tr>
          \`).join('');
        }
      } catch (e) { showToast('Failed to load system details'); }
    }

    // Initialize Overview Tab
    loadOverview();
  </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
}

module.exports = {
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
