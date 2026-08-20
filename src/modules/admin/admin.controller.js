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
 * Render Glassmorphic Interactive Admin Web Console
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
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-primary: #0a0f0d;
      --bg-surface: #111a16;
      --bg-card: rgba(18, 28, 23, 0.75);
      --border-color: rgba(46, 125, 50, 0.25);
      --accent-green: #22c55e;
      --accent-emerald: #10b981;
      --accent-gold: #f59e0b;
      --accent-red: #ef4444;
      --accent-blue: #06b6d4;
      --text-main: #f3f4f6;
      --text-muted: #9ca3af;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Plus Jakarta Sans', sans-serif; }
    body { background: var(--bg-primary); color: var(--text-main); min-height: 100vh; display: flex; flex-direction: column; }
    
    header {
      background: rgba(10, 15, 13, 0.85);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border-color);
      padding: 16px 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .logo-container { display: flex; align-items: center; gap: 12px; }
    .logo-icon { width: 36px; height: 36px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: bold; color: white; }
    .brand-title { font-family: 'Outfit', sans-serif; font-size: 20px; font-weight: 700; letter-spacing: -0.5px; }
    .badge-admin { background: rgba(34, 197, 94, 0.15); color: var(--accent-green); border: 1px solid rgba(34, 197, 94, 0.3); font-size: 11px; padding: 4px 10px; border-radius: 20px; font-weight: 600; text-transform: uppercase; }
    
    .main-container { padding: 32px; max-width: 1440px; margin: 0 auto; width: 100%; display: flex; flex-direction: column; gap: 28px; }
    
    .grid-kpi { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; }
    .card-kpi {
      background: var(--bg-card);
      backdrop-filter: blur(16px);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 20px;
      position: relative;
      overflow: hidden;
      transition: transform 0.2s, border-color 0.2s;
    }
    .card-kpi:hover { transform: translateY(-2px); border-color: var(--accent-green); }
    .kpi-title { font-size: 13px; color: var(--text-muted); font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
    .kpi-value { font-family: 'Outfit', sans-serif; font-size: 32px; font-weight: 700; margin-top: 8px; color: #fff; }
    .kpi-sub { font-size: 12px; color: var(--accent-green); margin-top: 4px; font-weight: 600; }
    
    .grid-sections { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; }
    @media (max-width: 1024px) { .grid-sections { grid-template-columns: 1fr; } }
    
    .panel {
      background: var(--bg-card);
      backdrop-filter: blur(16px);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }
    .panel-header { display: flex; justify-content: space-between; align-items: center; }
    .panel-title { font-family: 'Outfit', sans-serif; font-size: 18px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
    
    .table-container { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; }
    th { padding: 12px 14px; background: rgba(0,0,0,0.3); color: var(--text-muted); font-weight: 600; border-bottom: 1px solid rgba(255,255,255,0.08); }
    td { padding: 14px; border-bottom: 1px solid rgba(255,255,255,0.04); vertical-align: middle; }
    tr:hover { background: rgba(255,255,255,0.02); }
    
    .badge { padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; display: inline-block; }
    .badge-role-ADMIN { background: rgba(239, 68, 68, 0.2); color: #fca5a5; }
    .badge-role-FARMER { background: rgba(34, 197, 94, 0.2); color: #86efac; }
    .badge-role-DEVELOPMENT_AGENT { background: rgba(59, 130, 246, 0.2); color: #93c5fd; }
    .badge-role-WOREDA_OFFICER { background: rgba(245, 158, 11, 0.2); color: #fde68a; }
    .badge-role-RESEARCHER { background: rgba(168, 85, 247, 0.2); color: #d8b4fe; }
    
    .btn-action {
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.15);
      color: white;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s;
      font-weight: 500;
    }
    .btn-action:hover { background: var(--accent-green); color: black; border-color: var(--accent-green); }
    
    .btn-primary {
      background: linear-gradient(135deg, #10b981, #059669);
      border: none;
      color: white;
      padding: 10px 18px;
      border-radius: 10px;
      font-weight: 600;
      cursor: pointer;
      font-size: 13px;
      transition: transform 0.1s, opacity 0.2s;
    }
    .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
    
    .btn-danger {
      background: linear-gradient(135deg, #ef4444, #dc2626);
      border: none;
      color: white;
      padding: 10px 18px;
      border-radius: 10px;
      font-weight: 600;
      cursor: pointer;
      font-size: 13px;
    }
    
    .input-field, select {
      background: rgba(0,0,0,0.4);
      border: 1px solid rgba(255,255,255,0.12);
      color: white;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 13px;
      width: 100%;
      outline: none;
    }
    .input-field:focus, select:focus { border-color: var(--accent-green); }
    
    .status-pill { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; }
    .dot { width: 8px; height: 8px; border-radius: 50%; }
    .dot-green { background: #22c55e; box-shadow: 0 0 8px #22c55e; }
    .dot-amber { background: #f59e0b; box-shadow: 0 0 8px #f59e0b; }
    
    .toast-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      z-index: 1000;
    }
    .toast {
      padding: 12px 20px;
      border-radius: 10px;
      color: white;
      font-size: 13px;
      font-weight: 600;
      backdrop-filter: blur(12px);
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
      animation: slideIn 0.3s ease;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .toast-success { background: rgba(34, 197, 94, 0.9); border: 1px solid #22c55e; }
    .toast-error { background: rgba(239, 68, 68, 0.9); border: 1px solid #ef4444; }
    @keyframes slideIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  </style>
</head>
<body>

  <header>
    <div class="logo-container">
      <div class="logo-icon">🌿</div>
      <div>
        <div class="brand-title">AgriEtech Multi-Hazard Platform</div>
        <div style="font-size: 11px; color: var(--text-muted);">Enterprise Early Warning & Operations Center</div>
      </div>
    </div>
    <div style="display: flex; align-items: center; gap: 14px;">
      <div class="status-pill"><div class="dot dot-green"></div> System Live</div>
      <button class="btn-action" onclick="promptToken()" id="btn-token" title="Set or update your Admin JWT Token">🔑 Set Token</button>
      <span class="badge-admin">Admin Portal</span>
    </div>
  </header>

  <div class="main-container">
    
    <!-- Top KPI Grid -->
    <div class="grid-kpi">
      <div class="card-kpi">
        <div class="kpi-title">Registered Farmers & Agents</div>
        <div class="kpi-value" id="kpi-users">--</div>
        <div class="kpi-sub">Across 5 administrative tiers</div>
      </div>
      <div class="card-kpi">
        <div class="kpi-title">Active Farm Plots</div>
        <div class="kpi-value" id="kpi-farms">--</div>
        <div class="kpi-sub">GeoJSON Spatial Polygon boundaries</div>
      </div>
      <div class="card-kpi">
        <div class="kpi-title">IoT Telemetry Nodes</div>
        <div class="kpi-value" id="kpi-sensors">--</div>
        <div class="kpi-sub">Real-time Soil & Climate Probes</div>
      </div>
      <div class="card-kpi">
        <div class="kpi-title">Early Warning Alerts</div>
        <div class="kpi-value" id="kpi-alerts">--</div>
        <div class="kpi-sub">SMS / USSD / Push Multi-Channel</div>
      </div>
      <div class="card-kpi">
        <div class="kpi-title">AI Crop Diagnostics</div>
        <div class="kpi-value" id="kpi-diagnoses">--</div>
        <div class="kpi-sub">Plant.id + Gemini 2.5 Flash</div>
      </div>
    </div>

    <!-- Main Grid Sections -->
    <div class="grid-sections">
      
      <!-- Left Column: User Management -->
      <div class="panel">
        <div class="panel-header" style="flex-wrap: wrap; gap: 10px;">
          <div class="panel-title">👥 User Management & Access Control</div>
          <div style="display: flex; gap: 8px;">
            <input type="text" id="user-search" placeholder="Search user..." class="input-field" style="width: 160px; padding: 6px 10px; font-size: 12px;" oninput="fetchUsers()" />
            <select id="user-role-filter" class="input-field" style="width: 130px; padding: 6px 10px; font-size: 12px;" onchange="fetchUsers()">
              <option value="">All Roles</option>
              <option value="FARMER">FARMER</option>
              <option value="DEVELOPMENT_AGENT">DEV AGENT</option>
              <option value="WOREDA_OFFICER">OFFICER</option>
              <option value="RESEARCHER">RESEARCHER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
            <button class="btn-action" onclick="fetchUsers()">🔄 Refresh</button>
          </div>
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Phone / Email</th>
                <th>Role</th>
                <th>Verification</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="users-table-body">
              <tr><td colspan="5" style="text-align: center; color: var(--text-muted);">Loading user directory...</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Right Column: Ingestion & Subsystems -->
      <div style="display: flex; flex-direction: column; gap: 24px;">
        
        <!-- Ingestion Control -->
        <div class="panel">
          <div class="panel-header">
            <div class="panel-title">⚡ Ingestion Pipeline Triggers</div>
          </div>
          <p style="font-size: 12px; color: var(--text-muted);">Manually queue satellite & agro-meteorological sync jobs into BullMQ.</p>
          <div class="sync-btn-grid">
            <button class="btn-action" onclick="triggerJob('pullChirpsRainfall')">🌧️ Sync CHIRPS</button>
            <button class="btn-action" onclick="triggerJob('pullWeatherForecast')">☀️ Sync Weather</button>
            <button class="btn-action" onclick="triggerJob('pullNasaPower')">🛰️ NASA POWER</button>
            <button class="btn-action" onclick="triggerJob('pullFaoLocust')">🦗 FAO Locust</button>
            <button class="btn-action" onclick="triggerJob('pullNdviData')">🌱 Sentinel NDVI</button>
            <button class="btn-action" onclick="triggerJob('calculateRisks')">📊 Calculate SPI</button>
          </div>
          <div id="job-status-msg" style="font-size: 12px; margin-top: 8px; color: var(--accent-green); min-height: 18px;"></div>
        </div>

        <!-- Emergency Broadcast -->
        <div class="panel">
          <div class="panel-header">
            <div class="panel-title">📢 Emergency Alert Broadcast</div>
          </div>
          <form onsubmit="broadcastAlert(event)" style="display: flex; flex-direction: column; gap: 10px;">
            <input class="input-field" id="alert-title-en" placeholder="Alert Title (English)" required />
            <input class="input-field" id="alert-title-am" placeholder="የማስጠንቀቂያ ርዕስ (አማርኛ)" />
            <textarea class="input-field" id="alert-msg-en" rows="2" placeholder="Message Body (English)" required></textarea>
            <select id="alert-severity" class="input-field">
              <option value="CRITICAL">CRITICAL (ከፍተኛ አደጋ)</option>
              <option value="HIGH">HIGH (ከፍተኛ)</option>
              <option value="MODERATE">MODERATE (መካከለኛ)</option>
            </select>
            <button type="submit" class="btn-danger">🚨 Broadcast to Regional Delivery</button>
          </form>
        </div>

      </div>

    </div>

    <!-- Audit Logs Panel -->
    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">📜 Operational Audit Trail</div>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Action</th>
              <th>Admin Operator</th>
              <th>Details</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody id="audit-table-body">
            <tr><td colspan="4" style="text-align: center; color: var(--text-muted);">Loading audit logs...</td></tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>

  <div class="toast-container" id="toast-container"></div>

  <script>
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
      t.innerText = (isError ? '❌ ' : '✅ ') + message;
      c.appendChild(t);
      setTimeout(() => t.remove(), 4000);
    }

    function promptToken() {
      const current = localStorage.getItem('agrietech_admin_token') || '';
      const input = prompt('Enter your Admin JWT Bearer Token (optional for local dev):', current);
      if (input !== null) {
        if (input.trim()) {
          localStorage.setItem('agrietech_admin_token', input.trim());
          showToast('Admin Token saved!');
        } else {
          localStorage.removeItem('agrietech_admin_token');
          showToast('Admin Token cleared');
        }
        loadOverview();
        fetchUsers();
      }
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

          const auditBody = document.getElementById('audit-table-body');
          if (json.data.recentAuditLogs && json.data.recentAuditLogs.length > 0) {
            auditBody.innerHTML = json.data.recentAuditLogs.map(a => \`
              <tr>
                <td><strong>\${a.action}</strong></td>
                <td>\${a.adminEmail || 'admin@agrietech.et'}</td>
                <td>\${a.details}</td>
                <td style="color: var(--text-muted);">\${new Date(a.timestamp).toLocaleString()}</td>
              </tr>
            \`).join('');
          }
        }
      } catch (err) {
        console.error('Failed to load overview', err);
      }
    }

    async function fetchUsers() {
      try {
        const search = document.getElementById('user-search').value.trim();
        const role = document.getElementById('user-role-filter').value;
        const queryParams = new URLSearchParams();
        if (search) queryParams.set('search', search);
        if (role) queryParams.set('role', role);

        const res = await fetch('/api/v1/admin/users?' + queryParams.toString(), { headers: getAuthHeaders() });
        const json = await res.json();
        if (json.success) {
          const tbody = document.getElementById('users-table-body');
          if (!json.data.users || json.data.users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No users found.</td></tr>';
            return;
          }
          tbody.innerHTML = json.data.users.map(u => \`
            <tr>
              <td><strong>\${u.fullName}</strong></td>
              <td>\${u.phoneNumber || u.email || 'N/A'}</td>
              <td><span class="badge badge-role-\${u.role}">\${u.role}</span></td>
              <td>
                <button onclick="toggleVerification('\${u.id}', \${!u.isEmailVerified})" class="btn-action" style="font-size: 11px; padding: 3px 8px;">
                  \${u.isEmailVerified ? '✅ Verified' : '⏳ Pending'}
                </button>
              </td>
              <td>
                <select onchange="changeRole('\${u.id}', this.value)" style="padding: 4px; font-size: 11px; width: auto; background: #1a2721; border-color: rgba(255,255,255,0.2);">
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
        }
      } catch (err) {
        console.error('Failed to load users', err);
      }
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
      const msg = document.getElementById('job-status-msg');
      msg.innerText = 'Triggering ' + jobType + '...';
      try {
        const res = await fetch('/api/v1/admin/ingestion/trigger', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ jobType })
        });
        const json = await res.json();
        if (json.success) {
          msg.innerText = '✅ Job ' + jobType + ' scheduled! (ID: ' + json.data.jobId + ')';
          showToast('Job ' + jobType + ' dispatched successfully');
          loadOverview();
        } else {
          msg.innerText = '❌ Failed: ' + (json.error?.message || json.message);
          showToast(json.error?.message || 'Job trigger failed', true);
        }
      } catch (e) {
        msg.innerText = '❌ Request failed';
        showToast('Request failed', true);
      }
    }

    async function broadcastAlert(e) {
      e.preventDefault();
      const titleEn = document.getElementById('alert-title-en').value;
      const titleAm = document.getElementById('alert-title-am').value;
      const messageEn = document.getElementById('alert-msg-en').value;
      const severity = document.getElementById('alert-severity').value;

      try {
        const res = await fetch('/api/v1/admin/broadcast-alert', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ titleEn, titleAm, messageEn, severity })
        });
        const json = await res.json();
        if (json.success) {
          showToast('🚨 Emergency Alert broadcasted to all channels!');
          loadOverview();
          e.target.reset();
        } else {
          showToast(json.error?.message || 'Broadcast failed', true);
        }
      } catch (err) {
        showToast('Broadcast failed', true);
      }
    }

    // Auto-load on startup
    loadOverview();
    fetchUsers();
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
