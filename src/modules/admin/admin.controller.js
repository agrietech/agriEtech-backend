const adminService = require('./admin.service');

/**
 * Admin Controller with Full CRUD Operations & Sky Blue Dashboard
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
  <title>AgriEtech | Enterprise Admin & Operations Center (Sky-Blue Theme)</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --sky-50: #f0f9ff;
      --sky-100: #e0f2fe;
      --sky-200: #bae6fd;
      --sky-300: #7dd3fc;
      --sky-400: #38bdf8;
      --sky-500: #0ea5e9;
      --sky-600: #0284c7;
      --sky-700: #0369a1;
      --bg-dark: #070f1e;
      --bg-card: rgba(12, 25, 46, 0.75);
      --border-sky: rgba(56, 189, 248, 0.22);
      --text-main: #f0f9ff;
      --text-muted: #94a3b8;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: radial-gradient(circle at 50% 0%, #0c2340 0%, #070f1e 100%);
      color: var(--text-main);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    /* Sky Blue Top Navbar */
    .navbar {
      height: 70px;
      background: rgba(7, 15, 30, 0.9);
      backdrop-filter: blur(16px);
      border-bottom: 1px solid var(--border-sky);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 2rem;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-family: 'Outfit', sans-serif;
      font-size: 1.35rem;
      font-weight: 700;
      color: #fff;
    }
    .brand-badge {
      background: linear-gradient(135deg, var(--sky-500), var(--sky-700));
      color: #fff;
      padding: 0.2rem 0.6rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 1px;
    }
    .nav-actions { display: flex; align-items: center; gap: 1rem; }
    .btn-sky {
      background: linear-gradient(135deg, var(--sky-500), var(--sky-600));
      color: #fff;
      border: none;
      padding: 0.55rem 1.2rem;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(14, 165, 233, 0.35);
      transition: all 0.2s ease;
    }
    .btn-sky:hover {
      background: linear-gradient(135deg, var(--sky-400), var(--sky-500));
      transform: translateY(-1px);
    }
    .btn-danger {
      background: #ef4444;
      color: #fff;
      border: none;
      padding: 0.4rem 0.8rem;
      border-radius: 6px;
      font-size: 0.8rem;
      cursor: pointer;
    }
    .btn-secondary {
      background: rgba(224, 242, 254, 0.1);
      border: 1px solid var(--border-sky);
      color: var(--sky-300);
      padding: 0.4rem 0.8rem;
      border-radius: 6px;
      cursor: pointer;
    }

    /* Layout Main Grid */
    .app-container { display: flex; flex: 1; }

    /* Sidebar Navigation */
    .sidebar {
      width: 260px;
      background: rgba(7, 15, 30, 0.6);
      border-right: 1px solid var(--border-sky);
      padding: 1.5rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      padding: 0.75rem 1rem;
      border-radius: 10px;
      color: var(--text-muted);
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    .nav-item:hover, .nav-item.active {
      background: rgba(56, 189, 248, 0.12);
      color: var(--sky-300);
      border-left: 4px solid var(--sky-400);
    }

    /* Main Content Area */
    .content-area { flex: 1; padding: 2rem; overflow-y: auto; }
    .tab-pane { display: none; }
    .tab-pane.active { display: block; }

    /* Cards & Stats */
    .card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.25rem;
      margin-bottom: 2rem;
    }
    .stat-card {
      background: var(--bg-card);
      border: 1px solid var(--border-sky);
      border-radius: 14px;
      padding: 1.25rem;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      position: relative;
      overflow: hidden;
    }
    .stat-card::after {
      content: '';
      position: absolute;
      top: 0; right: 0; width: 60px; height: 60px;
      background: radial-gradient(circle, var(--sky-400) 0%, transparent 70%);
      opacity: 0.15;
    }
    .stat-title { font-size: 0.85rem; color: var(--text-muted); font-weight: 500; }
    .stat-value { font-family: 'Outfit', sans-serif; font-size: 2rem; font-weight: 700; color: var(--sky-300); margin: 0.4rem 0; }

    /* Tables & Controls */
    .panel-card {
      background: var(--bg-card);
      border: 1px solid var(--border-sky);
      border-radius: 14px;
      padding: 1.5rem;
      margin-bottom: 2rem;
    }
    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
    }
    .panel-title { font-family: 'Outfit', sans-serif; font-size: 1.25rem; font-weight: 600; color: #fff; }
    
    .table-container { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
    th { text-align: left; padding: 0.85rem 1rem; color: var(--sky-300); border-bottom: 1px solid var(--border-sky); font-weight: 600; }
    td { padding: 0.85rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); color: var(--text-main); }
    tr:hover { background: rgba(56, 189, 248, 0.05); }

    /* Status Badges */
    .badge {
      display: inline-block;
      padding: 0.25rem 0.65rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .badge-sky { background: rgba(56, 189, 248, 0.15); color: var(--sky-300); border: 1px solid var(--border-sky); }
    .badge-green { background: rgba(34, 197, 94, 0.15); color: #4ade80; }
    .badge-red { background: rgba(239, 68, 68, 0.15); color: #f87171; }

    /* Modal Overlay */
    .modal-overlay {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.7); backdrop-filter: blur(8px);
      display: none; align-items: center; justify-content: center;
      z-index: 1000;
    }
    .modal-box {
      background: #0f1c30; border: 1px solid var(--sky-400);
      border-radius: 16px; width: 90%; max-width: 520px;
      padding: 2rem; box-shadow: 0 20px 50px rgba(2, 132, 199, 0.3);
    }
    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; font-size: 0.85rem; color: var(--sky-300); margin-bottom: 0.4rem; }
    .form-control {
      width: 100%; padding: 0.65rem; background: rgba(255,255,255,0.05);
      border: 1px solid var(--border-sky); border-radius: 8px; color: #fff;
    }

    /* Toast */
    #toast {
      position: fixed; bottom: 20px; right: 20px;
      background: var(--sky-600); color: #fff;
      padding: 0.85rem 1.5rem; border-radius: 10px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5); display: none; z-index: 2000;
    }
  </style>
</head>
<body>
  <!-- Navbar -->
  <nav class="navbar">
    <div class="brand">
      <span>🌿 AgriEtech</span>
      <span class="brand-badge">SKY-BLUE ADMIN</span>
    </div>
    <div class="nav-actions">
      <button class="btn-sky" onclick="showModal('broadcastModal')">📢 Broadcast Alert</button>
      <button class="btn-secondary" onclick="refreshActiveTab()">🔄 Refresh</button>
    </div>
  </nav>

  <div class="app-container">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="nav-item active" onclick="switchTab('overview')">📊 Overview & Metrics</div>
      <div class="nav-item" onclick="switchTab('users')">👥 Users (CRUD)</div>
      <div class="nav-item" onclick="switchTab('farms')">🌾 Farm Plots (CRUD)</div>
      <div class="nav-item" onclick="switchTab('sensors')">📡 IoT Sensors (CRUD)</div>
      <div class="nav-item" onclick="switchTab('alerts')">⚠️ Alerts & Broadcasts</div>
      <div class="nav-item" onclick="switchTab('diagnoses')">🔬 Crop Diagnoses</div>
      <div class="nav-item" onclick="switchTab('ingestion')">⚡ Data Pipelines</div>
      <div class="nav-item" onclick="switchTab('system')">🛡️ Health & Audit Logs</div>
    </aside>

    <!-- Content -->
    <main class="content-area">
      <!-- TAB 1: OVERVIEW -->
      <div id="overview" class="tab-pane active">
        <div class="card-grid" id="metricsGrid">
          <div class="stat-card"><div class="stat-title">Total Registered Users</div><div class="stat-value" id="statUsers">--</div></div>
          <div class="stat-card"><div class="stat-title">Monitored Farm Plots</div><div class="stat-value" id="statFarms">--</div></div>
          <div class="stat-card"><div class="stat-title">Active IoT Sensors</div><div class="stat-value" id="statSensors">--</div></div>
          <div class="stat-card"><div class="stat-title">Early Warning Alerts</div><div class="stat-value" id="statAlerts">--</div></div>
        </div>

        <div class="panel-card">
          <div class="panel-header"><div class="panel-title">📢 Recent Early Warning Alerts</div></div>
          <div class="table-container">
            <table>
              <thead><tr><th>Hazard</th><th>Severity</th><th>Woreda</th><th>Date</th></tr></thead>
              <tbody id="recentAlertsBody"><tr><td colspan="4">Loading overview...</td></tr></tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB 2: USERS CRUD -->
      <div id="users" class="tab-pane">
        <div class="panel-card">
          <div class="panel-header">
            <div class="panel-title">👥 User Directory & Role Control</div>
            <button class="btn-sky" onclick="showModal('userModal')">➕ Create User</button>
          </div>
          <div class="table-container">
            <table>
              <thead><tr><th>Name</th><th>Phone / Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody id="usersTableBody"><tr><td colspan="5">Loading users...</td></tr></tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB 3: FARMS CRUD -->
      <div id="farms" class="tab-pane">
        <div class="panel-card">
          <div class="panel-header">
            <div class="panel-title">🌾 Registered Farm Plots</div>
            <button class="btn-sky" onclick="showModal('farmModal')">➕ Register Farm</button>
          </div>
          <div class="table-container">
            <table>
              <thead><tr><th>Farm Name</th><th>Crop</th><th>Area (Ha)</th><th>Location (Lat/Lng)</th><th>Actions</th></tr></thead>
              <tbody id="farmsTableBody"><tr><td colspan="5">Loading farms...</td></tr></tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB 4: SENSORS CRUD -->
      <div id="sensors" class="tab-pane">
        <div class="panel-card">
          <div class="panel-header">
            <div class="panel-title">📡 IoT Sensor Network</div>
            <button class="btn-sky" onclick="showModal('sensorModal')">➕ Add Sensor Device</button>
          </div>
          <div class="table-container">
            <table>
              <thead><tr><th>Hardware ID</th><th>Type</th><th>Status</th><th>Registered</th><th>Actions</th></tr></thead>
              <tbody id="sensorsTableBody"><tr><td colspan="5">Loading sensors...</td></tr></tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB 5: ALERTS -->
      <div id="alerts" class="tab-pane">
        <div class="panel-card">
          <div class="panel-header">
            <div class="panel-title">⚠️ Dispatched Early Warnings</div>
            <button class="btn-sky" onclick="showModal('broadcastModal')">📢 Broadcast Alert</button>
          </div>
          <div class="table-container">
            <table>
              <thead><tr><th>Title</th><th>Hazard</th><th>Severity</th><th>Woreda</th><th>Actions</th></tr></thead>
              <tbody id="alertsTableBody"><tr><td colspan="5">Loading alerts...</td></tr></tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB 6: DIAGNOSES -->
      <div id="diagnoses" class="tab-pane">
        <div class="panel-card">
          <div class="panel-header"><div class="panel-title">🔬 Crop Disease Diagnosis Records</div></div>
          <div class="table-container">
            <table>
              <thead><tr><th>Crop</th><th>Disease Identified</th><th>Severity</th><th>Confidence</th><th>AI Model</th><th>Actions</th></tr></thead>
              <tbody id="diagnosesTableBody"><tr><td colspan="6">Loading diagnoses...</td></tr></tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB 7: INGESTION PIPELINE -->
      <div id="ingestion" class="tab-pane">
        <div class="panel-card">
          <div class="panel-header"><div class="panel-title">⚡ Live Ingestion Pipeline Control</div></div>
          <div class="card-grid">
            <div class="stat-card">
              <div class="stat-title">CHIRPS Rainfall</div>
              <button class="btn-sky" style="margin-top:0.75rem; width:100%" onclick="triggerIngest('pullChirpsRainfall')">⚡ Pull CHIRPS</button>
            </div>
            <div class="stat-card">
              <div class="stat-title">NASA POWER Solar</div>
              <button class="btn-sky" style="margin-top:0.75rem; width:100%" onclick="triggerIngest('pullNasaPower')">⚡ Pull NASA POWER</button>
            </div>
            <div class="stat-card">
              <div class="stat-title">FAO Desert Locust</div>
              <button class="btn-sky" style="margin-top:0.75rem; width:100%" onclick="triggerIngest('pullFaoLocust')">⚡ Pull FAO Locust</button>
            </div>
            <div class="stat-card">
              <div class="stat-title">Risk Engine Evaluator</div>
              <button class="btn-sky" style="margin-top:0.75rem; width:100%" onclick="triggerIngest('calculateRisks')">⚡ Calculate Risks</button>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 8: SYSTEM HEALTH & AUDIT -->
      <div id="system" class="tab-pane">
        <div class="panel-card">
          <div class="panel-header"><div class="panel-title">🛡️ System Diagnostic & Audit Trail</div></div>
          <div id="healthDetails" style="margin-bottom:1.5rem; color:var(--sky-300);">Loading system status...</div>
          <div class="table-container">
            <table>
              <thead><tr><th>Action</th><th>Admin</th><th>Details</th><th>Timestamp</th></tr></thead>
              <tbody id="auditTableBody"><tr><td colspan="4">Loading audit logs...</td></tr></tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  </div>

  <!-- MODALS -->
  <!-- User Modal -->
  <div id="userModal" class="modal-overlay">
    <div class="modal-box">
      <h3 style="margin-bottom:1rem; color:var(--sky-300)">➕ Create New User</h3>
      <div class="form-group"><label>Full Name</label><input id="uName" class="form-control" placeholder="Abebe Bikila"></div>
      <div class="form-group"><label>Phone Number</label><input id="uPhone" class="form-control" placeholder="+251911223344"></div>
      <div class="form-group"><label>Email</label><input id="uEmail" class="form-control" placeholder="farmer@agrietech.et"></div>
      <div class="form-group"><label>Role</label>
        <select id="uRole" class="form-control">
          <option value="FARMER">FARMER</option>
          <option value="DEVELOPMENT_AGENT">DEVELOPMENT_AGENT</option>
          <option value="WOREDA_OFFICER">WOREDA_OFFICER</option>
          <option value="RESEARCHER">RESEARCHER</option>
          <option value="ADMIN">ADMIN</option>
        </select>
      </div>
      <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-top:1rem;">
        <button class="btn-secondary" onclick="hideModal('userModal')">Cancel</button>
        <button class="btn-sky" onclick="submitCreateUser()">Save User</button>
      </div>
    </div>
  </div>

  <!-- Farm Modal -->
  <div id="farmModal" class="modal-overlay">
    <div class="modal-box">
      <h3 style="margin-bottom:1rem; color:var(--sky-300)">🌾 Register Farm Plot</h3>
      <div class="form-group"><label>Farm Plot Name</label><input id="fName" class="form-control" placeholder="Adama Wheat Plot A"></div>
      <div class="form-group"><label>Primary Crop</label><input id="fCrop" class="form-control" placeholder="Wheat"></div>
      <div class="form-group"><label>Area (Hectares)</label><input id="fArea" type="number" step="0.1" class="form-control" value="2.5"></div>
      <div class="form-group"><label>Latitude</label><input id="fLat" type="number" step="0.001" class="form-control" value="8.54"></div>
      <div class="form-group"><label>Longitude</label><input id="fLng" type="number" step="0.001" class="form-control" value="39.27"></div>
      <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-top:1rem;">
        <button class="btn-secondary" onclick="hideModal('farmModal')">Cancel</button>
        <button class="btn-sky" onclick="submitCreateFarm()">Save Farm</button>
      </div>
    </div>
  </div>

  <!-- Sensor Modal -->
  <div id="sensorModal" class="modal-overlay">
    <div class="modal-box">
      <h3 style="margin-bottom:1rem; color:var(--sky-300)">📡 Add Sensor Hardware</h3>
      <div class="form-group"><label>Hardware ID</label><input id="sHardware" class="form-control" placeholder="ESP32_ADAMA_STATION_A"></div>
      <div class="form-group"><label>Sensor Type</label><input id="sType" class="form-control" value="SOIL_MOISTURE_STATION"></div>
      <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-top:1rem;">
        <button class="btn-secondary" onclick="hideModal('sensorModal')">Cancel</button>
        <button class="btn-sky" onclick="submitCreateSensor()">Save Sensor</button>
      </div>
    </div>
  </div>

  <!-- Broadcast Modal -->
  <div id="broadcastModal" class="modal-overlay">
    <div class="modal-box">
      <h3 style="margin-bottom:1rem; color:var(--sky-300)">📢 Broadcast Emergency Early Warning</h3>
      <div class="form-group"><label>Woreda ID</label><input id="bWoreda" class="form-control" value="woreda_adama_01"></div>
      <div class="form-group"><label>Title (English)</label><input id="bTitle" class="form-control" placeholder="Severe Drought Warning"></div>
      <div class="form-group"><label>Message (English)</label><textarea id="bMsg" class="form-control" rows="3" placeholder="Prepare supplemental irrigation."></textarea></div>
      <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-top:1rem;">
        <button class="btn-secondary" onclick="hideModal('broadcastModal')">Cancel</button>
        <button class="btn-sky" onclick="submitBroadcast()">Broadcast Alert</button>
      </div>
    </div>
  </div>

  <!-- Toast Container -->
  <div id="toast">Action completed successfully</div>

  <script>
    let activeTab = 'overview';

    function showToast(msg) {
      const t = document.getElementById('toast');
      t.innerText = msg;
      t.style.display = 'block';
      setTimeout(() => { t.style.display = 'none'; }, 3000);
    }

    function switchTab(tabId) {
      activeTab = tabId;
      document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(el => el.classList.remove('active'));
      
      if (event && event.target) event.target.classList.add('active');
      document.getElementById(tabId).classList.add('active');
      refreshActiveTab();
    }

    function showModal(id) { document.getElementById(id).style.display = 'flex'; }
    function hideModal(id) { document.getElementById(id).style.display = 'none'; }

    function refreshActiveTab() {
      if (activeTab === 'overview') loadOverview();
      else if (activeTab === 'users') loadUsers();
      else if (activeTab === 'farms') loadFarms();
      else if (activeTab === 'sensors') loadSensors();
      else if (activeTab === 'alerts') loadAlerts();
      else if (activeTab === 'diagnoses') loadDiagnoses();
      else if (activeTab === 'system') loadSystem();
    }

    // Load Overview
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
              <td><span class="badge badge-red">\${a.severity}</span></td>
              <td>\${a.woreda ? a.woreda.nameEn : 'Woreda'}</td>
              <td>\${new Date(a.createdAt).toLocaleDateString()}</td>
            </tr>
          \`).join('');
        }
      } catch (e) { showToast('Failed to fetch overview data'); }
    }

    // Load Users & CRUD
    async function loadUsers() {
      try {
        const res = await fetch('/api/v1/admin/users');
        const json = await res.json();
        if (json.success) {
          const tbody = document.getElementById('usersTableBody');
          tbody.innerHTML = json.data.users.map(u => \`
            <tr>
              <td><strong>\${u.fullName}</strong></td>
              <td>\${u.phoneNumber || u.email || 'N/A'}</td>
              <td><span class="badge badge-sky">\${u.role}</span></td>
              <td><span class="badge \${u.isEmailVerified ? 'badge-green' : 'badge-red'}">\${u.isEmailVerified ? 'VERIFIED' : 'PENDING'}</span></td>
              <td>
                <button class="btn-danger" onclick="deleteUser('\${u.id}')">🗑️ Delete</button>
              </td>
            </tr>
          \`).join('');
        }
      } catch (e) { showToast('Failed to load users'); }
    }

    async function submitCreateUser() {
      const payload = {
        fullName: document.getElementById('uName').value,
        phoneNumber: document.getElementById('uPhone').value,
        email: document.getElementById('uEmail').value,
        role: document.getElementById('uRole').value,
      };
      const res = await fetch('/api/v1/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        hideModal('userModal');
        showToast('User created successfully!');
        loadUsers();
      }
    }

    async function deleteUser(id) {
      if (!confirm('Are you sure you want to delete this user?')) return;
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
          const tbody = document.getElementById('farmsTableBody');
          tbody.innerHTML = json.data.farms.map(f => \`
            <tr>
              <td><strong>\${f.farmName}</strong></td>
              <td>\${f.primaryCrop}</td>
              <td>\${f.areaHectares} Ha</td>
              <td>\${f.latitude}, \${f.longitude}</td>
              <td><button class="btn-danger" onclick="deleteFarm('\${f.id}')">🗑️ Delete</button></td>
            </tr>
          \`).join('');
        }
      } catch (e) { showToast('Failed to load farms'); }
    }

    async function submitCreateFarm() {
      const payload = {
        farmName: document.getElementById('fName').value,
        primaryCrop: document.getElementById('fCrop').value,
        areaHectares: document.getElementById('fArea').value,
        latitude: document.getElementById('fLat').value,
        longitude: document.getElementById('fLng').value,
      };
      const res = await fetch('/api/v1/admin/farms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) { hideModal('farmModal'); showToast('Farm created!'); loadFarms(); }
    }

    async function deleteFarm(id) {
      if (!confirm('Delete farm plot?')) return;
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
          tbody.innerHTML = json.data.sensors.map(s => \`
            <tr>
              <td><code>\${s.hardwareId}</code></td>
              <td>\${s.sensorType}</td>
              <td><span class="badge \${s.isActive ? 'badge-green' : 'badge-red'}">\${s.isActive ? 'ACTIVE' : 'OFFLINE'}</span></td>
              <td>\${new Date(s.createdAt).toLocaleDateString()}</td>
              <td><button class="btn-danger" onclick="deleteSensor('\${s.id}')">🗑️ Delete</button></td>
            </tr>
          \`).join('');
        }
      } catch (e) { showToast('Failed to load sensors'); }
    }

    async function submitCreateSensor() {
      const payload = {
        hardwareId: document.getElementById('sHardware').value,
        sensorType: document.getElementById('sType').value,
      };
      const res = await fetch('/api/v1/admin/sensors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if ((await res.json()).success) { hideModal('sensorModal'); showToast('Sensor registered!'); loadSensors(); }
    }

    async function deleteSensor(id) {
      if (!confirm('Delete sensor device?')) return;
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
          tbody.innerHTML = json.data.alerts.map(a => \`
            <tr>
              <td><strong>\${a.titleEn}</strong></td>
              <td><span class="badge badge-sky">\${a.hazardType}</span></td>
              <td><span class="badge badge-red">\${a.severity}</span></td>
              <td>\${a.woreda ? a.woreda.nameEn : 'Woreda'}</td>
              <td><button class="btn-danger" onclick="deleteAlert('\${a.id}')">🗑️ Delete</button></td>
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
      };
      const res = await fetch('/api/v1/admin/broadcast-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if ((await res.json()).success) { hideModal('broadcastModal'); showToast('Alert broadcasted!'); loadAlerts(); }
    }

    async function deleteAlert(id) {
      if (!confirm('Delete alert?')) return;
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
          tbody.innerHTML = json.data.diagnoses.map(d => \`
            <tr>
              <td><strong>\${d.cropType}</strong></td>
              <td>\${d.diseaseName}</td>
              <td><span class="badge badge-red">\${d.severity}</span></td>
              <td>\${(d.confidenceScore * 100).toFixed(0)}%</td>
              <td>\${d.aiModel || 'Gemini 2.5'}</td>
              <td><button class="btn-danger" onclick="deleteDiagnosis('\${d.id}')">🗑️ Delete</button></td>
            </tr>
          \`).join('');
        }
      } catch (e) { showToast('Failed to load diagnoses'); }
    }

    async function deleteDiagnosis(id) {
      if (!confirm('Delete diagnosis record?')) return;
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
      if (json.success) showToast('Job ' + jobType + ' dispatched (ID: ' + json.data.jobId + ')');
    }

    // Load System & Audit
    async function loadSystem() {
      try {
        const resH = await fetch('/api/v1/admin/system/health');
        const jsonH = await resH.json();
        if (jsonH.success) {
          const h = jsonH.data;
          document.getElementById('healthDetails').innerHTML = \`
            <strong>Status:</strong> <span class="badge badge-green">\${h.overallStatus}</span> | 
            <strong>Database:</strong> \${h.subsystems.database.provider} (\${h.subsystems.database.status}) | 
            <strong>Memory Heap:</strong> \${h.subsystems.memory.heapUsedMb} MB / \${h.subsystems.memory.heapTotalMb} MB
          \`;
        }

        const resA = await fetch('/api/v1/admin/audit-logs');
        const jsonA = await resA.json();
        if (jsonA.success) {
          const tbody = document.getElementById('auditTableBody');
          tbody.innerHTML = jsonA.data.map(l => \`
            <tr>
              <td><span class="badge badge-sky">\${l.action}</span></td>
              <td>\${l.adminEmail || 'system'}</td>
              <td>\${l.details || ''}</td>
              <td>\${new Date(l.createdAt).toLocaleString()}</td>
            </tr>
          \`).join('');
        }
      } catch (e) { showToast('Failed to load system details'); }
    }

    // Auto-init
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
