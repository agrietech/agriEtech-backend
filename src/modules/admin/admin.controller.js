const adminService = require('./admin.service');

/**
 * Admin Controller
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

async function updateUserRole(req, res, next) {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const adminContext = {
      id: req.user?.id,
      email: req.user?.email,
      ip: req.ip || req.socket.remoteAddress,
    };
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
    const adminContext = {
      id: req.user?.id,
      email: req.user?.email,
      ip: req.ip || req.socket.remoteAddress,
    };
    const data = await adminService.updateUserStatus(id, { isEmailVerified }, adminContext);
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
    const adminContext = {
      id: req.user?.id,
      email: req.user?.email,
      ip: req.ip || req.socket.remoteAddress,
    };
    const data = await adminService.triggerIngestion(jobType, payload, adminContext);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function broadcastEmergencyAlert(req, res, next) {
  try {
    const adminContext = {
      id: req.user?.id,
      email: req.user?.email,
      ip: req.ip || req.socket.remoteAddress,
    };
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
 * Render Expert-Level Glassmorphic Interactive Admin Console
 */
function renderDashboard(_req, res) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AgriEtech | Enterprise Admin & Operations Center</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-base: #0a1420;
      --bg-surface: #0f1925;
      --bg-surface-elevated: #15202e;
      --bg-card: rgba(20, 32, 48, 0.75);
      --bg-card-hover: rgba(28, 44, 64, 0.85);
      --border-subtle: rgba(56, 189, 248, 0.15);
      --border-focus: #38bdf8;
      --accent-sky: #38bdf8;
      --accent-blue: #0ea5e9;
      --accent-cyan: #06b6d4;
      --accent-amber: #f59e0b;
      --accent-rose: #f43f5e;
      --accent-purple: #a855f7;
      --text-main: #f9fafb;
      --text-secondary: #94a3b8;
      --text-tertiary: #64748b;
      --sidebar-width: 260px;
      --header-height: 68px;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif; }
    body { background: var(--bg-base); color: var(--text-main); min-height: 100vh; display: flex; overflow-x: hidden; }

    /* Scrollbar */
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: var(--bg-base); }
    ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: var(--accent-green); }

    /* App Shell */
    .app-layout { display: flex; width: 100vw; height: 100vh; overflow: hidden; }

    /* Sidebar */
    aside.sidebar {
      width: var(--sidebar-width);
      background: var(--bg-surface);
      border-right: 1px solid var(--border-subtle);
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      z-index: 50;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .sidebar-header {
      height: var(--header-height);
      padding: 0 20px;
      display: flex;
      align-items: center;
      gap: 12px;
      border-bottom: 1px solid var(--border-subtle);
      background: rgba(0,0,0,0.2);
    }
    .brand-icon {
      width: 38px;
      height: 38px;
      background: linear-gradient(135deg, #38bdf8, #0ea5e9);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      box-shadow: 0 0 15px rgba(56, 189, 248, 0.35);
    }
    .brand-name { font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 17px; letter-spacing: -0.3px; color: #fff; }
    .brand-sub { font-size: 10px; color: var(--accent-sky); text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; }

    .sidebar-nav { padding: 16px 12px; display: flex; flex-direction: column; gap: 4px; flex: 1; overflow-y: auto; }
    .nav-section-title { font-size: 10px; font-weight: 700; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; padding: 12px 12px 6px; }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      border-radius: 10px;
      color: var(--text-secondary);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      border: 1px solid transparent;
      user-select: none;
    }
    .nav-item:hover { color: #fff; background: rgba(255,255,255,0.04); }
    .nav-item.active {
      color: #fff;
      background: linear-gradient(90deg, rgba(56, 189, 248, 0.15), rgba(56, 189, 248, 0.03));
      border-color: rgba(56, 189, 248, 0.3);
      font-weight: 600;
    }
    .nav-item.active .nav-icon { color: var(--accent-sky); transform: scale(1.1); }
    .nav-icon { font-size: 16px; transition: transform 0.2s; }
    .nav-badge {
      margin-left: auto;
      font-size: 10px;
      padding: 2px 7px;
      border-radius: 12px;
      background: rgba(255,255,255,0.08);
      color: var(--text-secondary);
      font-weight: 600;
    }
    .nav-item.active .nav-badge { background: rgba(56, 189, 248, 0.25); color: var(--accent-sky); }

    .sidebar-footer {
      padding: 16px;
      border-top: 1px solid var(--border-subtle);
      background: rgba(0,0,0,0.25);
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .admin-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #0ea5e9, #0284c7);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 14px;
      color: white;
    }
    .admin-info { flex: 1; min-width: 0; }
    .admin-name { font-size: 13px; font-weight: 600; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .admin-role { font-size: 11px; color: var(--accent-sky); font-weight: 500; }

    /* Main Content Area */
    main.main-viewport {
      flex: 1;
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow-y: auto;
      background: radial-gradient(circle at 80% 10%, rgba(56, 189, 248, 0.05) 0%, transparent 60%),
                  radial-gradient(circle at 10% 80%, rgba(14, 165, 233, 0.04) 0%, transparent 60%),
                  var(--bg-base);
    }

    /* Top App Bar */
    header.top-bar {
      height: var(--header-height);
      background: rgba(7, 11, 9, 0.85);
      backdrop-filter: blur(16px);
      border-bottom: 1px solid var(--border-subtle);
      padding: 0 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 40;
    }
    .top-bar-left { display: flex; align-items: center; gap: 16px; }
    .page-title { font-family: 'Outfit', sans-serif; font-size: 19px; font-weight: 700; letter-spacing: -0.3px; }
    
    .top-bar-right { display: flex; align-items: center; gap: 14px; }
    .status-pill {
      display: flex;
      align-items: center;
      gap: 7px;
      padding: 5px 12px;
      border-radius: 20px;
      background: rgba(56, 189, 248, 0.1);
      border: 1px solid rgba(56, 189, 248, 0.25);
      font-size: 12px;
      font-weight: 600;
      color: var(--accent-sky);
    }
    .pulse-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--accent-sky);
      box-shadow: 0 0 8px var(--accent-sky);
      animation: pulse 2s infinite;
    }
    @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(1.2); } }

    .btn-top {
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.12);
      color: #fff;
      padding: 7px 14px;
      border-radius: 9px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }
    .btn-top:hover { background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.25); }

    /* Content Container */
    .content-body { padding: 32px; max-width: 1560px; margin: 0 auto; width: 100%; display: flex; flex-direction: column; gap: 28px; }

    /* Tab Sections */
    .tab-pane { display: none; flex-direction: column; gap: 24px; animation: fadeIn 0.25s ease; }
    .tab-pane.active { display: flex; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

    /* Glass Cards & KPI Grids */
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 18px; }
    .kpi-card {
      background: var(--bg-card);
      backdrop-filter: blur(16px);
      border: 1px solid var(--border-subtle);
      border-radius: 16px;
      padding: 22px 20px;
      position: relative;
      overflow: hidden;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .kpi-card:hover { transform: translateY(-3px); border-color: rgba(56, 189, 248, 0.4); box-shadow: 0 12px 28px rgba(0,0,0,0.4); }
    .kpi-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
    .kpi-label { font-size: 12px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }
    .kpi-icon-wrap {
      width: 36px;
      height: 36px;
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 17px;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.08);
    }
    .kpi-value { font-family: 'Outfit', sans-serif; font-size: 32px; font-weight: 700; color: #fff; letter-spacing: -0.5px; }
    .kpi-footnote { font-size: 11px; color: var(--accent-sky); margin-top: 6px; font-weight: 500; display: flex; align-items: center; gap: 4px; }

    /* Panels & Tables */
    .panel {
      background: var(--bg-card);
      backdrop-filter: blur(16px);
      border: 1px solid var(--border-subtle);
      border-radius: 18px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 18px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.25);
    }
    .panel-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
    .panel-title { font-family: 'Outfit', sans-serif; font-size: 17px; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 10px; }
    .panel-desc { font-size: 12px; color: var(--text-secondary); margin-top: 2px; }

    .grid-2col { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; }
    .grid-equal { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    .grid-3col { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px; }
    @media (max-width: 1100px) { .grid-2col, .grid-equal { grid-template-columns: 1fr; } }

    /* Table Component */
    .table-container { overflow-x: auto; border-radius: 12px; border: 1px solid rgba(255,255,255,0.06); }
    table { width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; }
    th {
      padding: 14px 16px;
      background: rgba(0,0,0,0.35);
      color: var(--text-secondary);
      font-weight: 600;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.5px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      white-space: nowrap;
    }
    td { padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.04); vertical-align: middle; }
    tr:hover td { background: rgba(255,255,255,0.02); }

    /* Badges */
    .badge { padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; display: inline-block; letter-spacing: 0.3px; }
    .badge-role-ADMIN { background: rgba(244, 63, 94, 0.15); color: #fda4af; border: 1px solid rgba(244, 63, 94, 0.3); }
    .badge-role-FARMER { background: rgba(34, 197, 94, 0.15); color: #86efac; border: 1px solid rgba(34, 197, 94, 0.3); }
    .badge-role-DEVELOPMENT_AGENT { background: rgba(6, 182, 212, 0.15); color: #67e8f9; border: 1px solid rgba(6, 182, 212, 0.3); }
    .badge-role-WOREDA_OFFICER { background: rgba(245, 158, 11, 0.15); color: #fde68a; border: 1px solid rgba(245, 158, 11, 0.3); }
    .badge-role-RESEARCHER { background: rgba(168, 85, 247, 0.15); color: #d8b4fe; border: 1px solid rgba(168, 85, 247, 0.3); }
    
    .badge-sev-CRITICAL { background: rgba(239, 68, 68, 0.2); color: #fca5a5; border: 1px solid #ef4444; }
    .badge-sev-HIGH { background: rgba(249, 115, 22, 0.2); color: #fdba74; border: 1px solid #f97316; }
    .badge-sev-MODERATE { background: rgba(234, 179, 8, 0.2); color: #fde047; border: 1px solid #eab308; }
    .badge-sev-LOW { background: rgba(34, 197, 94, 0.2); color: #86efac; border: 1px solid #22c55e; }

    /* Form Controls */
    .input-field, select.input-field, textarea.input-field {
      background: rgba(0,0,0,0.4);
      border: 1px solid rgba(255,255,255,0.12);
      color: #fff;
      padding: 10px 14px;
      border-radius: 9px;
      font-size: 13px;
      width: 100%;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .input-field:focus { border-color: var(--accent-sky); box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.15); }
    .input-field::placeholder { color: var(--text-tertiary); }

    /* Action Buttons */
    .btn-primary {
      background: linear-gradient(135deg, #10b981, #059669);
      border: none;
      color: #fff;
      padding: 10px 20px;
      border-radius: 10px;
      font-weight: 600;
      cursor: pointer;
      font-size: 13px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
      box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);
    }
    .btn-primary:hover { opacity: 0.95; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(16, 185, 129, 0.45); }

    .btn-danger {
      background: linear-gradient(135deg, #f43f5e, #dc2626);
      border: none;
      color: #fff;
      padding: 11px 22px;
      border-radius: 10px;
      font-weight: 700;
      cursor: pointer;
      font-size: 13px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.2s;
      box-shadow: 0 4px 14px rgba(244, 63, 94, 0.3);
    }
    .btn-danger:hover { opacity: 0.95; transform: translateY(-1px); }

    .btn-action {
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.12);
      color: #fff;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 12px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .btn-action:hover { background: var(--accent-green); color: #000; border-color: var(--accent-green); }

    /* Ingestion Sync Cards */
    .sync-card {
      background: rgba(0,0,0,0.3);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 14px;
      padding: 18px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      transition: border-color 0.2s;
    }
    .sync-card:hover { border-color: rgba(34, 197, 94, 0.3); }
    .sync-card-title { font-size: 14px; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 8px; }
    .sync-card-desc { font-size: 12px; color: var(--text-secondary); line-height: 1.4; }

    /* Toast Notification Engine */
    .toast-container {
      position: fixed;
      bottom: 28px;
      right: 28px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      z-index: 9999;
      pointer-events: none;
    }
    .toast {
      pointer-events: auto;
      padding: 14px 22px;
      border-radius: 12px;
      color: #fff;
      font-size: 13px;
      font-weight: 600;
      backdrop-filter: blur(16px);
      box-shadow: 0 16px 36px rgba(0,0,0,0.6);
      animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      align-items: center;
      gap: 10px;
      border: 1px solid rgba(255,255,255,0.15);
    }
    .toast-success { background: rgba(16, 185, 129, 0.9); border-color: #10b981; }
    .toast-error { background: rgba(244, 63, 94, 0.9); border-color: #f43f5e; }
    @keyframes slideIn { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

    /* Code & JSON display */
    .code-viewer {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      background: rgba(0,0,0,0.6);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 10px;
      padding: 16px;
      color: #a7f3d0;
      max-height: 380px;
      overflow: auto;
      white-space: pre-wrap;
    }

    /* Modal */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.75);
      backdrop-filter: blur(8px);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 999;
    }
    .modal-backdrop.open { display: flex; }
    .modal-content {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: 20px;
      padding: 28px;
      width: 100%;
      max-width: 540px;
      box-shadow: 0 24px 48px rgba(0,0,0,0.6);
      display: flex;
      flex-direction: column;
      gap: 18px;
    }
  </style>
</head>
<body>

  <div class="app-layout">

    <!-- Left Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="brand-icon">🌿</div>
        <div>
          <div class="brand-name">AgriEtech</div>
          <div class="brand-sub">Enterprise Ops</div>
        </div>
      </div>

      <div class="sidebar-nav">
        <div class="nav-section-title">Core Management</div>
        <div class="nav-item active" onclick="switchTab('overview')">
          <span class="nav-icon">📊</span>
          <span>Overview</span>
          <span class="nav-badge" id="badge-overview-live">Live</span>
        </div>
        <div class="nav-item" onclick="switchTab('users')">
          <span class="nav-icon">👥</span>
          <span>User Directory & RBAC</span>
          <span class="nav-badge" id="badge-users-count">--</span>
        </div>
        <div class="nav-item" onclick="switchTab('alerts')">
          <span class="nav-icon">📢</span>
          <span>Early Warning Broadcast</span>
          <span class="nav-badge" id="badge-alerts-count">--</span>
        </div>

        <div class="nav-section-title">Data & Engineering</div>
        <div class="nav-item" onclick="switchTab('ingestion')">
          <span class="nav-icon">🛰️</span>
          <span>Ingestion Pipelines</span>
          <span class="nav-badge">7 Sources</span>
        </div>
        <div class="nav-item" onclick="switchTab('health')">
          <span class="nav-icon">🩺</span>
          <span>System Diagnostics</span>
          <span class="nav-badge" style="color: var(--accent-green);">100%</span>
        </div>
        <div class="nav-item" onclick="switchTab('audit')">
          <span class="nav-icon">📜</span>
          <span>Audit Logs</span>
        </div>
        <div class="nav-item" onclick="switchTab('api')">
          <span class="nav-icon">🔌</span>
          <span>API Explorer</span>
        </div>
      </div>

      <div class="sidebar-footer">
        <div class="admin-avatar">AD</div>
        <div class="admin-info">
          <div class="admin-name" id="sidebar-admin-email">admin@agrietech.et</div>
          <div class="admin-role">System Administrator</div>
        </div>
        <button class="btn-action" onclick="openTokenModal()" style="padding: 6px 8px;" title="Configure JWT Token">🔑</button>
      </div>
    </aside>

    <!-- Main Viewport -->
    <main class="main-viewport">
      
      <!-- Sticky Top Bar -->
      <header class="top-bar">
        <div class="top-bar-left">
          <div class="page-title" id="page-heading">Executive Overview</div>
        </div>
        <div class="top-bar-right">
          <div class="status-pill">
            <div class="pulse-dot"></div>
            <span id="system-status-text">PostgreSQL & Redis Online</span>
          </div>
          <button class="btn-top" onclick="refreshCurrentTab()">
            <span>🔄</span> Refresh
          </button>
        </div>
      </header>

      <div class="content-body">

        <!-- TAB 1: OVERVIEW -->
        <div id="tab-overview" class="tab-pane active">
          
          <!-- KPI Metrics Row -->
          <div class="kpi-grid">
            <div class="kpi-card">
              <div class="kpi-header">
                <span class="kpi-label">Registered Accounts</span>
                <div class="kpi-icon-wrap">👥</div>
              </div>
              <div class="kpi-value" id="kpi-users">--</div>
              <div class="kpi-footnote"><span>🌱</span> Across 5 administrative tiers</div>
            </div>

            <div class="kpi-card">
              <div class="kpi-header">
                <span class="kpi-label">Monitored Farm Plots</span>
                <div class="kpi-icon-wrap">🌾</div>
              </div>
              <div class="kpi-value" id="kpi-farms">--</div>
              <div class="kpi-footnote"><span>📍</span> GeoJSON PostGIS Polygons</div>
            </div>

            <div class="kpi-card">
              <div class="kpi-header">
                <span class="kpi-label">IoT Sensor Nodes</span>
                <div class="kpi-icon-wrap">📡</div>
              </div>
              <div class="kpi-value" id="kpi-sensors">--</div>
              <div class="kpi-footnote"><span>⚡</span> Real-time telemetry online</div>
            </div>

            <div class="kpi-card">
              <div class="kpi-header">
                <span class="kpi-label">Active Hazard Alerts</span>
                <div class="kpi-icon-wrap">⚠️</div>
              </div>
              <div class="kpi-value" id="kpi-alerts">--</div>
              <div class="kpi-footnote"><span>📢</span> Multi-channel dispatching</div>
            </div>

            <div class="kpi-card">
              <div class="kpi-header">
                <span class="kpi-label">AI Crop Diagnoses</span>
                <div class="kpi-icon-wrap">🔬</div>
              </div>
              <div class="kpi-value" id="kpi-diagnoses">--</div>
              <div class="kpi-footnote"><span>🧠</span> Plant.id + Gemini 2.5 Flash</div>
            </div>

            <div class="kpi-card">
              <div class="kpi-header">
                <span class="kpi-label">Monitored Woredas</span>
                <div class="kpi-icon-wrap">🗺️</div>
              </div>
              <div class="kpi-value" id="kpi-woredas">84</div>
              <div class="kpi-footnote"><span>🇪🇹</span> All major agrarian zones</div>
            </div>
          </div>

          <!-- Section 2: Distribution & Quick Triggers -->
          <div class="grid-2col">
            
            <div class="panel">
              <div class="panel-header">
                <div>
                  <div class="panel-title">👥 User Role Distribution & Tiers</div>
                  <div class="panel-desc">Role-based access matrix across agricultural operators</div>
                </div>
              </div>
              <div id="role-bars-container" style="display: flex; flex-direction: column; gap: 14px; margin-top: 8px;">
                <!-- Populated dynamically -->
              </div>
            </div>

            <div class="panel">
              <div class="panel-header">
                <div>
                  <div class="panel-title">⚡ Quick Ingestion Sync</div>
                  <div class="panel-desc">One-click satellite & meteorological sync</div>
                </div>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <button class="btn-action" onclick="triggerJob('pullChirpsRainfall')">🌧️ Sync CHIRPS</button>
                <button class="btn-action" onclick="triggerJob('pullWeatherForecast')">☀️ Sync Weather</button>
                <button class="btn-action" onclick="triggerJob('pullNdviData')">🌱 Sentinel NDVI</button>
                <button class="btn-action" onclick="triggerJob('pullFaoLocust')">🦗 FAO Locust</button>
                <button class="btn-action" onclick="triggerJob('pullNasaPower')">🛰️ NASA POWER</button>
                <button class="btn-action" onclick="triggerJob('calculateRisks')">📊 Calculate SPI</button>
              </div>
              <div id="quick-job-status" style="font-size: 12px; color: var(--accent-green); min-height: 20px;"></div>
            </div>

          </div>

          <!-- Section 3: Recent Activity -->
          <div class="panel">
            <div class="panel-header">
              <div class="panel-title">📜 Operational Activity Feed</div>
              <button class="btn-action" onclick="switchTab('audit')">View Full Audit Log →</button>
            </div>
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Event Type</th>
                    <th>Operator</th>
                    <th>Details</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody id="overview-audit-body">
                  <tr><td colspan="4" style="text-align: center; color: var(--text-tertiary); padding: 24px;">Loading activity stream...</td></tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>

        <!-- TAB 2: USERS & RBAC -->
        <div id="tab-users" class="tab-pane">
          <div class="panel">
            <div class="panel-header">
              <div>
                <div class="panel-title">👥 User Directory & Role-Based Access Control</div>
                <div class="panel-desc">Manage accounts, verify farmers, and update administrative permissions</div>
              </div>
              <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <input type="text" id="user-search-input" placeholder="🔍 Search by name, phone, email..." class="input-field" style="width: 240px;" oninput="debounceFetchUsers()" />
                <select id="user-role-select" class="input-field" style="width: 160px;" onchange="fetchUsers()">
                  <option value="">All Roles</option>
                  <option value="FARMER">FARMER (ገበሬ)</option>
                  <option value="DEVELOPMENT_AGENT">DEV AGENT (ኤክስቴንሽን)</option>
                  <option value="WOREDA_OFFICER">WOREDA OFFICER</option>
                  <option value="RESEARCHER">RESEARCHER</option>
                  <option value="ADMIN">ADMINISTRATOR</option>
                </select>
                <button class="btn-action" onclick="fetchUsers()">🔄 Refresh</button>
              </div>
            </div>

            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>User & Contact</th>
                    <th>Role (RBAC)</th>
                    <th>Verification</th>
                    <th>Assigned Woreda</th>
                    <th>Created At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody id="users-table-body">
                  <tr><td colspan="6" style="text-align: center; color: var(--text-tertiary); padding: 32px;">Loading user records...</td></tr>
                </tbody>
              </table>
            </div>

            <!-- Pagination Bar -->
            <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 12px;">
              <span style="font-size: 12px; color: var(--text-secondary);" id="user-pagination-info">Showing users</span>
              <div style="display: flex; gap: 8px;">
                <button class="btn-action" id="btn-user-prev" onclick="prevUserPage()">← Previous</button>
                <button class="btn-action" id="btn-user-next" onclick="nextUserPage()">Next →</button>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 3: ALERTS & EMERGENCY BROADCAST -->
        <div id="tab-alerts" class="tab-pane">
          <div class="grid-2col">
            
            <!-- Broadcast Composer -->
            <div class="panel">
              <div class="panel-header">
                <div>
                  <div class="panel-title">🚨 Emergency Hazard Broadcast Composer</div>
                  <div class="panel-desc">Dispatch urgent multi-lingual warnings to farmers and woreda officers</div>
                </div>
              </div>

              <form onsubmit="handleBroadcastSubmit(event)" style="display: flex; flex-direction: column; gap: 14px;">
                <div>
                  <label style="font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px; display: block;">Alert Title (English)</label>
                  <input class="input-field" id="broadcast-title-en" placeholder="e.g. Flash Flood & High River Discharge Warning" required />
                </div>

                <div>
                  <label style="font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px; display: block;">የማስጠንቀቂያ ርዕስ (አማርኛ)</label>
                  <input class="input-field" id="broadcast-title-am" placeholder="ለምሳሌ፡ የጎርፍ መጥለቅለቅ እና የውሃ ሙላት ቅድመ ማስጠንቀቂያ" />
                </div>

                <div>
                  <label style="font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px; display: block;">Message Description (English)</label>
                  <textarea class="input-field" id="broadcast-desc-en" rows="3" placeholder="Actionable guidance: Evacuate livestock from lowlands and prepare drainage..." required></textarea>
                </div>

                <div class="grid-equal">
                  <div>
                    <label style="font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px; display: block;">Severity Level</label>
                    <select id="broadcast-severity" class="input-field">
                      <option value="CRITICAL">🔴 CRITICAL (ከፍተኛ አደጋ)</option>
                      <option value="HIGH">🟠 HIGH (ከፍተኛ)</option>
                      <option value="MODERATE">🟡 MODERATE (መካከለኛ)</option>
                      <option value="LOW">🟢 LOW (ዝቅተኛ)</option>
                    </select>
                  </div>
                  <div>
                    <label style="font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px; display: block;">Target Woreda ID (Optional)</label>
                    <input class="input-field" id="broadcast-woreda" placeholder="e.g. woreda_adama_01 or ALL" />
                  </div>
                </div>

                <button type="submit" class="btn-danger" style="margin-top: 8px;">
                  <span>📢</span> Broadcast Emergency Alert to All Channels
                </button>
              </form>
            </div>

            <!-- Broadcast Channels & Information -->
            <div style="display: flex; flex-direction: column; gap: 20px;">
              <div class="panel">
                <div class="panel-title">📡 Active Delivery Channels</div>
                <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 6px;">
                  <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px; background: rgba(0,0,0,0.25); border-radius: 8px;">
                    <div>
                      <div style="font-weight: 600; font-size: 13px;">📱 SMS Dispatcher (Africa's Talking)</div>
                      <div style="font-size: 11px; color: var(--text-secondary);">Direct telecom SMS to registered farmers</div>
                    </div>
                    <span class="badge badge-role-FARMER">ACTIVE</span>
                  </div>

                  <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px; background: rgba(0,0,0,0.25); border-radius: 8px;">
                    <div>
                      <div style="font-weight: 600; font-size: 13px;">🌐 WebSocket Risk Channel</div>
                      <div style="font-size: 11px; color: var(--text-secondary);">Sub-second live push to Mobile & Web Apps</div>
                    </div>
                    <span class="badge badge-role-FARMER">ACTIVE</span>
                  </div>

                  <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px; background: rgba(0,0,0,0.25); border-radius: 8px;">
                    <div>
                      <div style="font-weight: 600; font-size: 13px;">📞 USSD *844# Gateway</div>
                      <div style="font-size: 11px; color: var(--text-secondary);">Offline feature phone alert access</div>
                    </div>
                    <span class="badge badge-role-FARMER">ACTIVE</span>
                  </div>
                </div>
              </div>

              <div class="panel">
                <div class="panel-title">⚠️ Hazard Matrix Tiers</div>
                <div style="font-size: 12px; color: var(--text-secondary); line-height: 1.6;">
                  Alerts are automatically correlated against CHIRPS 14-day rainfall deficits, MODIS Vegetation Condition Index (VCI), and GloFAS 5-year flood return periods.
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- TAB 4: INGESTION PIPELINES -->
        <div id="tab-ingestion" class="tab-pane">
          <div class="panel">
            <div class="panel-header">
              <div>
                <div class="panel-title">🛰️ Earth Observation & Agro-Climatology Pipelines</div>
                <div class="panel-desc">Orchestrate automated ingestion jobs, data connectors, and BullMQ queue processing</div>
              </div>
            </div>

            <div class="grid-3col">
              
              <div class="sync-card">
                <div class="sync-card-title">🌧️ CHIRPS Rainfall Connector</div>
                <div class="sync-card-desc">Pulls daily 0.05° high-resolution satellite precipitation estimates across Ethiopia.</div>
                <button class="btn-primary" onclick="triggerJob('pullChirpsRainfall')">⚡ Trigger Sync</button>
              </div>

              <div class="sync-card">
                <div class="sync-card-title">☀️ Open-Meteo Weather Forecast</div>
                <div class="sync-card-desc">Fetches 7-day high-resolution hourly temperature, wind, humidity, and precipitation.</div>
                <button class="btn-primary" onclick="triggerJob('pullWeatherForecast')">⚡ Trigger Sync</button>
              </div>

              <div class="sync-card">
                <div class="sync-card-title">🛰️ NASA POWER Solar & Evap</div>
                <div class="sync-card-desc">Solar radiation (ALLSKY_SFC_SW_DWN) and reference evapotranspiration (ET0).</div>
                <button class="btn-primary" onclick="triggerJob('pullNasaPower')">⚡ Trigger Sync</button>
              </div>

              <div class="sync-card">
                <div class="sync-card-title">🌱 Sentinel & MODIS NDVI / VCI</div>
                <div class="sync-card-desc">Vegetation vigor anomaly calculation and drought stress detection.</div>
                <button class="btn-primary" onclick="triggerJob('pullNdviData')">⚡ Trigger Sync</button>
              </div>

              <div class="sync-card">
                <div class="sync-card-title">🦗 FAO Desert Locust Swarms</div>
                <div class="sync-card-desc">Bio-climatic threat modeling and geospatial locust swarm waypoint tracking.</div>
                <button class="btn-primary" onclick="triggerJob('pullFaoLocust')">⚡ Trigger Sync</button>
              </div>

              <div class="sync-card">
                <div class="sync-card-title">🌊 GloFAS River Discharge</div>
                <div class="sync-card-desc">Copernicus Emergency Management Service river basin flood threshold modeling.</div>
                <button class="btn-primary" onclick="triggerJob('pullGlofasFlood')">⚡ Trigger Sync</button>
              </div>

              <div class="sync-card">
                <div class="sync-card-title">📊 SPI & SPEI Drought Engine</div>
                <div class="sync-card-desc">Computes 1-month, 3-month, and 6-month Standardized Precipitation Index.</div>
                <button class="btn-primary" onclick="triggerJob('calculateRisks')">⚡ Calculate SPI</button>
              </div>

            </div>
          </div>
        </div>

        <!-- TAB 5: SYSTEM HEALTH & TELEMETRY -->
        <div id="tab-health" class="tab-pane">
          <div class="grid-2col">
            
            <div class="panel">
              <div class="panel-title">🩺 Infrastructure Subsystems</div>
              <div id="health-subsystems-list" style="display: flex; flex-direction: column; gap: 12px; margin-top: 6px;">
                <!-- Populated dynamically -->
              </div>
            </div>

            <div class="panel">
              <div class="panel-title">🖥️ Server Runtime & Memory</div>
              <div id="health-runtime-details" style="font-size: 13px; color: var(--text-secondary); line-height: 1.8;">
                Loading system metrics...
              </div>
            </div>

          </div>
        </div>

        <!-- TAB 6: AUDIT TRAIL -->
        <div id="tab-audit" class="tab-pane">
          <div class="panel">
            <div class="panel-header">
              <div>
                <div class="panel-title">📜 Operational Security & Audit Trail</div>
                <div class="panel-desc">Immutable log of all administrative actions, role changes, and emergency broadcasts</div>
              </div>
              <button class="btn-action" onclick="fetchAuditLogs()">🔄 Refresh Logs</button>
            </div>

            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>Operator Email</th>
                    <th>Details</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody id="full-audit-table-body">
                  <tr><td colspan="4" style="text-align: center; color: var(--text-tertiary); padding: 32px;">Loading audit logs...</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- TAB 7: API EXPLORER -->
        <div id="tab-api" class="tab-pane">
          <div class="panel">
            <div class="panel-header">
              <div>
                <div class="panel-title">🔌 Interactive Backend API Explorer</div>
                <div class="panel-desc">Test and verify live REST endpoints directly from the console</div>
              </div>
            </div>

            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
              <button class="btn-action" onclick="runApiTest('/health')">GET /health</button>
              <button class="btn-action" onclick="runApiTest('/api/v1/admin/overview')">GET /api/v1/admin/overview</button>
              <button class="btn-action" onclick="runApiTest('/api/v1/boundaries/regions')">GET /api/v1/boundaries/regions</button>
              <button class="btn-action" onclick="runApiTest('/api/v1/analytics/dashboard')">GET /api/v1/analytics/dashboard</button>
              <button class="btn-action" onclick="runApiTest('/api/v1/admin/system/health')">GET /api/v1/admin/system/health</button>
            </div>

            <div style="margin-top: 14px;">
              <div style="font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">Live Response:</div>
              <div class="code-viewer" id="api-response-viewer">// Click any endpoint above to execute request...</div>
            </div>
          </div>
        </div>

      </div>
    </main>

  </div>

  <!-- Token Modal -->
  <div class="modal-backdrop" id="token-modal">
    <div class="modal-content">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div style="font-family: 'Outfit', sans-serif; font-size: 18px; font-weight: 700; color: #fff;">🔑 Set Admin JWT Token</div>
        <button class="btn-action" onclick="closeTokenModal()">✕</button>
      </div>
      <p style="font-size: 13px; color: var(--text-secondary);">
        Paste your JWT Bearer token here. In development mode, mock admin tokens are automatically supported.
      </p>
      <input type="text" id="token-input" class="input-field" placeholder="Bearer eyJhbGciOiJIUzI1Ni..." />
      <div style="display: flex; justify-content: flex-end; gap: 10px;">
        <button class="btn-action" onclick="clearToken()">Clear Token</button>
        <button class="btn-primary" onclick="saveToken()">Save Token</button>
      </div>
    </div>
  </div>

  <div class="toast-container" id="toast-container"></div>

  <script>
    let currentTab = 'overview';
    let userPage = 1;
    let userSearchTimeout = null;

    function getAuthHeaders() {
      const headers = { 'Content-Type': 'application/json' };
      const token = localStorage.getItem('agrietech_admin_token') || localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = 'Bearer ' + token;
      }
      return headers;
    }

    function showToast(message, isError = false) {
      const c = document.getElementById('toast-container');
      const t = document.createElement('div');
      t.className = 'toast ' + (isError ? 'toast-error' : 'toast-success');
      t.innerHTML = '<span>' + (isError ? '❌' : '✅') + '</span><span>' + message + '</span>';
      c.appendChild(t);
      setTimeout(() => t.remove(), 4000);
    }

    function switchTab(tabId) {
      currentTab = tabId;
      document.querySelectorAll('.tab-pane').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

      const targetPane = document.getElementById('tab-' + tabId);
      if (targetPane) targetPane.classList.add('active');

      const navItems = document.querySelectorAll('.nav-item');
      const tabMap = { overview: 0, users: 1, alerts: 2, ingestion: 3, health: 4, audit: 5, api: 6 };
      if (navItems[tabMap[tabId]]) {
        navItems[tabMap[tabId]].classList.add('active');
      }

      const headings = {
        overview: 'Executive Overview',
        users: 'User Directory & Access Control',
        alerts: 'Early Warning & Emergency Broadcast',
        ingestion: 'Ingestion Pipelines & Satellites',
        health: 'System Telemetry & Diagnostics',
        audit: 'Operational Security Audit Trail',
        api: 'Interactive REST API Explorer'
      };
      document.getElementById('page-heading').innerText = headings[tabId] || 'Admin Console';

      if (tabId === 'overview') loadOverview();
      else if (tabId === 'users') fetchUsers();
      else if (tabId === 'health') fetchHealth();
      else if (tabId === 'audit') fetchAuditLogs();
    }

    function refreshCurrentTab() {
      switchTab(currentTab);
      showToast('Data refreshed');
    }

    async function loadOverview() {
      try {
        const res = await fetch('/api/v1/admin/overview', { headers: getAuthHeaders() });
        const json = await res.json();
        if (json.success) {
          const m = json.data.metrics;
          document.getElementById('kpi-users').innerText = m.totalUsers;
          document.getElementById('kpi-farms').innerText = m.totalFarms;
          document.getElementById('kpi-sensors').innerText = m.activeSensors + ' / ' + m.totalSensors;
          document.getElementById('kpi-alerts').innerText = m.totalAlerts;
          document.getElementById('kpi-diagnoses').innerText = m.totalDiagnoses;
          document.getElementById('badge-users-count').innerText = m.totalUsers;
          document.getElementById('badge-alerts-count').innerText = m.totalAlerts;

          // Role Bars
          const roleContainer = document.getElementById('role-bars-container');
          if (m.usersByRole) {
            const roleLabels = {
              FARMER: '🌾 Farmers (ገበሬዎች)',
              DEVELOPMENT_AGENT: '🌱 Development Agents (ኤክስቴንሽን)',
              WOREDA_OFFICER: '🏛️ Woreda Officers',
              RESEARCHER: '🔬 Agronomic Researchers',
              ADMIN: '🛡️ System Administrators'
            };
            const total = m.totalUsers || 1;
            roleContainer.innerHTML = Object.entries(m.usersByRole).map(([role, count]) => {
              const pct = Math.round((count / total) * 100);
              return \`
                <div>
                  <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
                    <span style="font-weight: 600;">\${roleLabels[role] || role}</span>
                    <span style="color: var(--text-secondary);">\${count} (\${pct}%)</span>
                  </div>
                  <div style="width: 100%; height: 8px; background: rgba(255,255,255,0.06); border-radius: 4px; overflow: hidden;">
                    <div style="width: \${pct}%; height: 100%; background: linear-gradient(90deg, #10b981, #06b6d4); border-radius: 4px;"></div>
                  </div>
                </div>
              \`;
            }).join('');
          }

          // Recent Activity Table
          const auditBody = document.getElementById('overview-audit-body');
          if (json.data.recentAuditLogs && json.data.recentAuditLogs.length > 0) {
            auditBody.innerHTML = json.data.recentAuditLogs.slice(0, 6).map(a => \`
              <tr>
                <td><span class="badge badge-role-DEVELOPMENT_AGENT">\${a.action}</span></td>
                <td style="color: #fff; font-weight: 500;">\${a.adminEmail || 'admin@agrietech.et'}</td>
                <td style="color: var(--text-secondary);">\${a.details}</td>
                <td style="color: var(--text-tertiary); font-size: 12px;">\${new Date(a.timestamp).toLocaleTimeString()}</td>
              </tr>
            \`).join('');
          }
        }
      } catch (err) {
        console.error('Failed to load overview', err);
      }
    }

    function debounceFetchUsers() {
      clearTimeout(userSearchTimeout);
      userSearchTimeout = setTimeout(() => {
        userPage = 1;
        fetchUsers();
      }, 300);
    }

    async function fetchUsers() {
      try {
        const search = document.getElementById('user-search-input').value.trim();
        const role = document.getElementById('user-role-select').value;
        const q = new URLSearchParams({ page: userPage, limit: 8 });
        if (search) q.set('search', search);
        if (role) q.set('role', role);

        const res = await fetch('/api/v1/admin/users?' + q.toString(), { headers: getAuthHeaders() });
        const json = await res.json();
        if (json.success) {
          const tbody = document.getElementById('users-table-body');
          const users = json.data.users || [];
          if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-tertiary); padding: 32px;">No matching users found.</td></tr>';
            return;
          }

          tbody.innerHTML = users.map(u => \`
            <tr>
              <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                  <div style="width: 32px; height: 32px; border-radius: 50%; background: rgba(34, 197, 94, 0.2); color: var(--accent-green); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px;">
                    \${(u.fullName || 'U').substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style="font-weight: 600; color: #fff;">\${u.fullName}</div>
                    <div style="font-size: 11px; color: var(--text-secondary);">\${u.phoneNumber || u.email || 'N/A'}</div>
                  </div>
                </div>
              </td>
              <td><span class="badge badge-role-\${u.role}">\${u.role}</span></td>
              <td>
                <button onclick="toggleVerification('\${u.id}', \${!u.isEmailVerified})" class="btn-action" style="font-size: 11px; padding: 3px 8px;">
                  \${u.isEmailVerified ? '✅ Verified' : '⏳ Pending'}
                </button>
              </td>
              <td style="color: var(--text-secondary); font-size: 12px;">\${u.woredaId || '—'}</td>
              <td style="color: var(--text-tertiary); font-size: 11px;">\${new Date(u.createdAt).toLocaleDateString()}</td>
              <td>
                <select onchange="changeRole('\${u.id}', this.value)" style="padding: 4px 8px; font-size: 11px; width: auto; background: #131e18; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; color: white;">
                  <option value="">Switch Role...</option>
                  <option value="FARMER" \${u.role === 'FARMER' ? 'selected' : ''}>FARMER</option>
                  <option value="DEVELOPMENT_AGENT" \${u.role === 'DEVELOPMENT_AGENT' ? 'selected' : ''}>DEV AGENT</option>
                  <option value="WOREDA_OFFICER" \${u.role === 'WOREDA_OFFICER' ? 'selected' : ''}>OFFICER</option>
                  <option value="RESEARCHER" \${u.role === 'RESEARCHER' ? 'selected' : ''}>RESEARCHER</option>
                  <option value="ADMIN" \${u.role === 'ADMIN' ? 'selected' : ''}>ADMIN</option>
                </select>
              </td>
            </tr>
          \`).join('');

          document.getElementById('user-pagination-info').innerText = \`Page \${json.data.pagination.page} of \${json.data.pagination.totalPages} (\${json.data.pagination.totalUsers} total users)\`;
          document.getElementById('btn-user-prev').disabled = json.data.pagination.page <= 1;
          document.getElementById('btn-user-next').disabled = json.data.pagination.page >= json.data.pagination.totalPages;
        }
      } catch (err) {
        console.error('Failed to load users', err);
      }
    }

    function prevUserPage() {
      if (userPage > 1) { userPage--; fetchUsers(); }
    }
    function nextUserPage() {
      userPage++; fetchUsers();
    }

    async function toggleVerification(userId, newStatus) {
      try {
        const res = await fetch(\`/api/v1/admin/users/\${userId}/status\`, {
          method: 'PATCH',
          headers: getAuthHeaders(),
          body: JSON.stringify({ isEmailVerified: newStatus })
        });
        const json = await res.json();
        if (json.success) {
          showToast('Verification status updated');
          fetchUsers();
          loadOverview();
        } else {
          showToast(json.error?.message || 'Update failed', true);
        }
      } catch (e) {
        showToast('Request failed', true);
      }
    }

    async function changeRole(userId, newRole) {
      if (!newRole) return;
      try {
        const res = await fetch(\`/api/v1/admin/users/\${userId}/role\`, {
          method: 'PATCH',
          headers: getAuthHeaders(),
          body: JSON.stringify({ role: newRole })
        });
        const json = await res.json();
        if (json.success) {
          showToast('Role updated to ' + newRole);
          fetchUsers();
          loadOverview();
        } else {
          showToast(json.error?.message || 'Failed to update role', true);
        }
      } catch (e) {
        showToast('Failed to update role', true);
      }
    }

    async function triggerJob(jobType) {
      showToast('Dispatching ' + jobType + '...');
      try {
        const res = await fetch('/api/v1/admin/ingestion/trigger', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ jobType })
        });
        const json = await res.json();
        if (json.success) {
          showToast('Job ' + jobType + ' scheduled! (ID: ' + json.data.jobId + ')');
          const quickMsg = document.getElementById('quick-job-status');
          if (quickMsg) quickMsg.innerText = '✅ Scheduled ' + jobType + ' (' + new Date().toLocaleTimeString() + ')';
        } else {
          showToast(json.error?.message || 'Trigger failed', true);
        }
      } catch (e) {
        showToast('Trigger failed', true);
      }
    }

    async function handleBroadcastSubmit(e) {
      e.preventDefault();
      const titleEn = document.getElementById('broadcast-title-en').value;
      const titleAm = document.getElementById('broadcast-title-am').value;
      const messageEn = document.getElementById('broadcast-desc-en').value;
      const severity = document.getElementById('broadcast-severity').value;
      const woredaId = document.getElementById('broadcast-woreda').value;

      try {
        const res = await fetch('/api/v1/admin/broadcast-alert', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ titleEn, titleAm, messageEn, severity, woredaId })
        });
        const json = await res.json();
        if (json.success) {
          showToast('🚨 Emergency Alert broadcasted to all channels!');
          e.target.reset();
          loadOverview();
        } else {
          showToast(json.error?.message || 'Broadcast failed', true);
        }
      } catch (err) {
        showToast('Broadcast failed', true);
      }
    }

    async function fetchHealth() {
      try {
        const res = await fetch('/api/v1/admin/system/health', { headers: getAuthHeaders() });
        const json = await res.json();
        if (json.success) {
          const d = json.data;
          const subList = document.getElementById('health-subsystems-list');
          subList.innerHTML = \`
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: rgba(0,0,0,0.3); border-radius: 10px;">
              <div><strong>🗄️ PostgreSQL Database</strong><div style="font-size: 11px; color: var(--text-secondary);">\${d.database?.mode || 'Prisma Engine'}</div></div>
              <span class="badge badge-role-FARMER">\${d.database?.status || 'CONNECTED'}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: rgba(0,0,0,0.3); border-radius: 10px;">
              <div><strong>⚡ Redis Cache & Queue</strong><div style="font-size: 11px; color: var(--text-secondary);">Upstash BullMQ Instance</div></div>
              <span class="badge badge-role-FARMER">\${d.redis?.status || 'CONNECTED'}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: rgba(0,0,0,0.3); border-radius: 10px;">
              <div><strong>🧠 Gemini 2.5 Flash / OpenRouter</strong><div style="font-size: 11px; color: var(--text-secondary);">Multimodal Agronomic Vision & Voice</div></div>
              <span class="badge badge-role-RESEARCHER">ONLINE</span>
            </div>
          \`;

          const runDetails = document.getElementById('health-runtime-details');
          runDetails.innerHTML = \`
            <div><strong>Node Environment:</strong> \${d.nodeEnv || 'development'}</div>
            <div><strong>Platform:</strong> \${d.platform || 'linux'} (\${d.arch || 'x64'})</div>
            <div><strong>Uptime:</strong> \${Math.round(d.uptimeSeconds || 0)} seconds</div>
            <div><strong>Memory RSS:</strong> \${d.memoryUsage?.rss || 'N/A'}</div>
            <div><strong>Heap Used:</strong> \${d.memoryUsage?.heapUsed || 'N/A'} / \${d.memoryUsage?.heapTotal || 'N/A'}</div>
          \`;
        }
      } catch (e) {
        console.error('Failed to load health', e);
      }
    }

    async function fetchAuditLogs() {
      try {
        const res = await fetch('/api/v1/admin/audit-logs?limit=25', { headers: getAuthHeaders() });
        const json = await res.json();
        if (json.success) {
          const tbody = document.getElementById('full-audit-table-body');
          if (!json.data || json.data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-tertiary); padding: 32px;">No audit records available.</td></tr>';
            return;
          }
          tbody.innerHTML = json.data.map(a => \`
            <tr>
              <td><span class="badge badge-role-DEVELOPMENT_AGENT">\${a.action}</span></td>
              <td style="color: #fff; font-weight: 500;">\${a.adminEmail || 'admin@agrietech.et'}</td>
              <td style="color: var(--text-secondary);">\${a.details}</td>
              <td style="color: var(--text-tertiary); font-size: 12px;">\${new Date(a.timestamp).toLocaleString()}</td>
            </tr>
          \`).join('');
        }
      } catch (e) {
        console.error('Failed to load audit logs', e);
      }
    }

    async function runApiTest(endpoint) {
      const viewer = document.getElementById('api-response-viewer');
      viewer.innerText = 'Sending request to ' + endpoint + '...';
      try {
        const res = await fetch(endpoint, { headers: getAuthHeaders() });
        const json = await res.json();
        viewer.innerText = JSON.stringify(json, null, 2);
      } catch (err) {
        viewer.innerText = 'Request error: ' + err.message;
      }
    }

    function openTokenModal() {
      document.getElementById('token-input').value = localStorage.getItem('agrietech_admin_token') || '';
      document.getElementById('token-modal').classList.add('open');
    }
    function closeTokenModal() {
      document.getElementById('token-modal').classList.remove('open');
    }
    function saveToken() {
      const t = document.getElementById('token-input').value.trim();
      if (t) localStorage.setItem('agrietech_admin_token', t);
      else localStorage.removeItem('agrietech_admin_token');
      closeTokenModal();
      showToast('Admin Token updated');
      refreshCurrentTab();
    }
    function clearToken() {
      localStorage.removeItem('agrietech_admin_token');
      document.getElementById('token-input').value = '';
      closeTokenModal();
      showToast('Admin Token cleared');
      refreshCurrentTab();
    }

    // Auto-initialize on DOM ready
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
  updateUserRole,
  updateUserStatus,
  getSystemHealth,
  triggerIngestion,
  broadcastEmergencyAlert,
  getAuditLogs,
  renderDashboard,
};
