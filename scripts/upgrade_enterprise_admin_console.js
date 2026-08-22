const fs = require('fs');
const path = require('path');

const dashboardHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AgriEtech | Enterprise Admin & Spatial Command</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    :root {
      --primary: #10b981;
      --primary-dark: #059669;
      --primary-light: #ecfdf5;
      --secondary: #3b82f6;
      --secondary-dark: #2563eb;
      --danger: #ef4444;
      --danger-dark: #dc2626;
      --warning: #f59e0b;
      --info: #0ea5e9;
      --dark: #0f172a;
      --text: #1e293b;
      --text-muted: #64748b;
      --bg: #f8fafc;
      --card-bg: #ffffff;
      --border: #e2e8f0;
      --radius: 0.5rem;
      --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
      --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.5;
    }

    /* Top Navbar */
    .header {
      background: var(--card-bg);
      border-bottom: 2px solid var(--primary);
      padding: 0.875rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: var(--shadow);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .brand-group {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .brand-icon {
      width: 38px;
      height: 38px;
      background: linear-gradient(135deg, #10b981, #059669);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 800;
      font-size: 1.25rem;
    }

    .brand-text {
      font-size: 1.35rem;
      font-weight: 800;
      color: var(--primary-dark);
      letter-spacing: -0.5px;
    }

    .brand-tag {
      font-size: 0.75rem;
      background: var(--primary-light);
      color: var(--primary-dark);
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-weight: 700;
      margin-left: 0.5rem;
      text-transform: uppercase;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .header-pill {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
      background: var(--bg);
      padding: 0.4rem 0.8rem;
      border-radius: 20px;
      border: 1px solid var(--border);
      color: var(--text-muted);
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--primary);
      box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
    }

    /* Buttons */
    .btn {
      padding: 0.55rem 1.1rem;
      border-radius: var(--radius);
      font-weight: 600;
      font-size: 0.875rem;
      border: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .btn:active { transform: scale(0.98); }

    .btn-primary { background: var(--primary); color: white; }
    .btn-primary:hover { background: var(--primary-dark); }
    
    .btn-secondary { background: #f1f5f9; color: #475569; border: 1px solid var(--border); }
    .btn-secondary:hover { background: #e2e8f0; color: #1e293b; }

    .btn-danger { background: var(--danger); color: white; }
    .btn-danger:hover { background: var(--danger-dark); }

    .btn-edit { background: var(--secondary); color: white; }
    .btn-edit:hover { background: var(--secondary-dark); }

    .btn-warning { background: var(--warning); color: white; }
    .btn-warning:hover { background: #d97706; }

    .btn-sm { padding: 0.3rem 0.65rem; font-size: 0.75rem; border-radius: 4px; }

    /* Layout */
    .container {
      display: flex;
      min-height: calc(100vh - 65px);
    }

    /* Sidebar */
    .sidebar {
      width: 260px;
      background: var(--card-bg);
      border-right: 1px solid var(--border);
      padding: 1.5rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .nav-group-title {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 1rem 0 0.5rem 0.75rem;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.65rem 0.85rem;
      border-radius: var(--radius);
      color: var(--text);
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s;
    }

    .nav-item:hover { background: var(--bg); color: var(--primary-dark); }
    
    .nav-item.active {
      background: var(--primary-light);
      color: var(--primary-dark);
      font-weight: 600;
    }

    /* Content Area */
    .content {
      flex: 1;
      padding: 2rem;
      overflow-y: auto;
    }

    .tab { display: none; }
    .tab.active { display: block; animation: fadeIn 0.2s ease; }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Stats Grid */
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      gap: 1.25rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: var(--card-bg);
      padding: 1.25rem;
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      border: 1px solid var(--border);
      border-left: 4px solid var(--primary);
    }

    .stat-card.blue { border-left-color: var(--secondary); }
    .stat-card.amber { border-left-color: var(--warning); }
    .stat-card.red { border-left-color: var(--danger); }
    .stat-card.purple { border-left-color: #8b5cf6; }

    .stat-label {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-muted);
      margin-bottom: 0.25rem;
    }

    .stat-value {
      font-size: 1.85rem;
      font-weight: 800;
      color: var(--text);
    }

    .stat-subtext {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-top: 0.25rem;
    }

    /* Panels & Tables */
    .panel {
      background: var(--card-bg);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      border: 1px solid var(--border);
      margin-bottom: 2rem;
    }

    .panel-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .panel-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .panel-body { padding: 1.5rem; }

    /* Filter & Search Bar */
    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.25rem;
      flex-wrap: wrap;
    }

    .search-box {
      position: relative;
      flex: 1;
      max-width: 320px;
    }

    .search-input {
      width: 100%;
      padding: 0.5rem 1rem 0.5rem 2.2rem;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      font-size: 0.875rem;
      outline: none;
      transition: border 0.15s;
    }

    .search-input:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.15);
    }

    .search-icon {
      position: absolute;
      left: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      color: #94a3b8;
      font-size: 0.85rem;
    }

    /* Tables */
    .table-container {
      overflow-x: auto;
      border-radius: var(--radius);
      border: 1px solid var(--border);
    }

    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.875rem;
    }

    th {
      background: #f8fafc;
      padding: 0.75rem 1rem;
      font-weight: 700;
      color: #475569;
      border-bottom: 1px solid var(--border);
      text-transform: uppercase;
      font-size: 0.75rem;
      letter-spacing: 0.5px;
    }

    td {
      padding: 0.85rem 1rem;
      border-bottom: 1px solid var(--border);
      color: #334155;
      vertical-align: middle;
    }

    tbody tr:hover { background: #f8fafc; }
    tbody tr:last-child td { border-bottom: none; }

    /* Badges */
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.6rem;
      border-radius: 12px;
      font-size: 0.725rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .badge-success { background: #dcfce7; color: #15803d; }
    .badge-warning { background: #fef3c7; color: #b45309; }
    .badge-danger { background: #fee2e2; color: #b91c1c; }
    .badge-info { background: #e0f2fe; color: #0369a1; }
    .badge-purple { background: #f3e8ff; color: #7e22ce; }

    .actions { display: flex; gap: 0.4rem; align-items: center; flex-wrap: wrap; }

    /* Forms & Modals */
    .modal {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(2px);
      z-index: 1000;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }

    .modal.show { display: flex; animation: fadeIn 0.15s ease; }

    .modal-content {
      background: white;
      border-radius: 10px;
      width: 100%;
      max-width: 540px;
      box-shadow: var(--shadow-md);
      overflow: hidden;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
    }

    .modal-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #fafbfc;
    }

    .modal-title { font-size: 1.15rem; font-weight: 700; color: var(--dark); }
    .modal-close { background: none; border: none; font-size: 1.4rem; cursor: pointer; color: #94a3b8; }
    .modal-close:hover { color: var(--danger); }
    .modal-body { padding: 1.5rem; overflow-y: auto; }

    .form-group { margin-bottom: 1.1rem; }
    .form-label { display: block; font-size: 0.8rem; font-weight: 700; color: #334155; margin-bottom: 0.35rem; }
    .form-input, .form-select, .form-textarea {
      width: 100%;
      padding: 0.6rem 0.85rem;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      font-size: 0.875rem;
      outline: none;
      font-family: inherit;
    }
    .form-input:focus, .form-select:focus, .form-textarea:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.15);
    }
    .form-textarea { resize: vertical; min-height: 80px; }

    /* Map Tab */
    #mapContainer {
      height: 560px;
      width: 100%;
      border-radius: var(--radius);
      border: 1px solid var(--border);
    }

    .map-controls-bar {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
      align-items: center;
    }

    /* Grid for Pipeline Controls */
    .pipeline-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
    }

    .pipeline-card {
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1.2rem;
      background: #ffffff;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: all 0.2s;
    }

    .pipeline-card:hover {
      border-color: var(--primary);
      box-shadow: var(--shadow);
    }

    .pipeline-title { font-weight: 700; font-size: 0.95rem; margin-bottom: 0.35rem; }
    .pipeline-desc { font-size: 0.775rem; color: var(--text-muted); margin-bottom: 1rem; flex: 1; }

    /* Toast */
    .toast {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      background: var(--dark);
      color: white;
      padding: 0.85rem 1.5rem;
      border-radius: var(--radius);
      font-size: 0.875rem;
      font-weight: 600;
      box-shadow: var(--shadow-md);
      display: none;
      z-index: 2000;
      animation: slideUp 0.2s ease;
    }

    .toast.show { display: block; }

    @keyframes slideUp {
      from { transform: translateY(10px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  </style>
</head>
<body>

  <!-- Header -->
  <header class="header">
    <div class="brand-group">
      <div class="brand-icon">🌱</div>
      <div class="brand-text">AgriEtech</div>
      <span class="brand-tag">Enterprise Admin & Spatial Command</span>
    </div>
    <div class="header-actions">
      <div class="header-pill">
        <div class="status-dot"></div>
        <span>Production Cluster: Operational</span>
      </div>
      <button class="btn btn-secondary btn-sm" onclick="refreshCurrentTab()">🔄 Refresh</button>
      <a href="/api/v1/admin/overview" target="_blank" class="btn btn-secondary btn-sm">📄 Raw JSON</a>
    </div>
  </header>

  <div class="container">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="nav-group-title">Analytics & Operations</div>
      <div class="nav-item active" onclick="showTab('overview', this)">
        <span>📊</span> Dashboard Overview
      </div>
      <div class="nav-item" onclick="showTab('map', this)">
        <span>🗺️</span> Spatial Map & Layers
      </div>

      <div class="nav-group-title">Entity Management (CRUD)</div>
      <div class="nav-item" onclick="showTab('users', this)">
        <span>👥</span> User Management
      </div>
      <div class="nav-item" onclick="showTab('roleRequests', this)">
        <span>🎖️</span> Role Requests
      </div>
      <div class="nav-item" onclick="showTab('farms', this)">
        <span>🚜</span> Farm Plots
      </div>
      <div class="nav-item" onclick="showTab('sensors', this)">
        <span>📡</span> IoT Telemetry Sensors
      </div>

      <div class="nav-group-title">Agronomic Intelligence</div>
      <div class="nav-item" onclick="showTab('alerts', this)">
        <span>📢</span> Early Warning Alerts
      </div>
      <div class="nav-item" onclick="showTab('diagnoses', this)">
        <span>🔬</span> Plant Disease Vision
      </div>
      <div class="nav-item" onclick="showTab('riskAssessments', this)">
        <span>⚠️</span> Risk Assessments
      </div>

      <div class="nav-group-title">System & DevOps</div>
      <div class="nav-item" onclick="showTab('system', this)">
        <span>⚙️</span> Health & Pipelines
      </div>
    </aside>

    <!-- Main Content -->
    <main class="content">

      <!-- 1. Overview Tab -->
      <div id="overview" class="tab active">
        <div class="stats">
          <div class="stat-card">
            <div class="stat-label">Total Users</div>
            <div class="stat-value" id="statUsers">0</div>
            <div class="stat-subtext">Registered Farmers & Officers</div>
          </div>
          <div class="stat-card blue">
            <div class="stat-label">Active Farm Plots</div>
            <div class="stat-value" id="statFarms">0</div>
            <div class="stat-subtext">Monitored crop parcels</div>
          </div>
          <div class="stat-card amber">
            <div class="stat-label">IoT Sensor Nodes</div>
            <div class="stat-value" id="statSensors">0</div>
            <div class="stat-subtext">Telemetry & Soil stations</div>
          </div>
          <div class="stat-card red">
            <div class="stat-label">Active Alerts</div>
            <div class="stat-value" id="statAlerts">0</div>
            <div class="stat-subtext">Drought & Frost Warnings</div>
          </div>
        </div>

        <div class="panel">
          <div class="panel-header">
            <div class="panel-title">📢 Recent Emergency Hazard Broadcasts</div>
            <button class="btn btn-primary btn-sm" onclick="showTab('alerts', document.querySelectorAll('.nav-item')[6])">View All Alerts</button>
          </div>
          <div class="panel-body">
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Hazard Type</th>
                    <th>Headline</th>
                    <th>Severity</th>
                    <th>Target Woreda</th>
                    <th>Broadcast Time</th>
                  </tr>
                </thead>
                <tbody id="recentActivity">
                  <tr><td colspan="5">Loading system activity...</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. GIS Map Tab -->
      <div id="map" class="tab">
        <div class="panel">
          <div class="panel-header">
            <div class="panel-title">🗺️ Ethiopia Agricultural GIS Spatial Command</div>
            <button class="btn btn-primary btn-sm" onclick="fitAllMapFeatures()">✨ Fit All Entities</button>
          </div>
          <div class="panel-body">
            <div class="map-controls-bar">
              <button class="btn btn-primary btn-sm" onclick="plotFarmsOnMap()">🚜 Plot All Farms</button>
              <button class="btn btn-edit btn-sm" onclick="plotSensorsOnMap()">📡 Plot IoT Sensors</button>
              <button class="btn btn-warning btn-sm" onclick="plotAlertsOnMap()">📢 Plot Hazard Zones</button>
              <button class="btn btn-secondary btn-sm" onclick="loadBoundaries('regions')">🗺️ Regions Layer</button>
              <button class="btn btn-secondary btn-sm" onclick="loadBoundaries('woredas')">📍 Woredas Layer</button>
              <button class="btn btn-secondary btn-sm" onclick="clearMapLayers()">🧹 Clear Layers</button>
            </div>
            <div id="mapContainer"></div>
          </div>
        </div>
      </div>

      <!-- 3. Users Tab (CRUD) -->
      <div id="users" class="tab">
        <div class="panel">
          <div class="panel-header">
            <div class="panel-title">👥 User Management & RBAC</div>
            <button class="btn btn-primary" onclick="openModal('userModal')">+ Add New User</button>
          </div>
          <div class="panel-body">
            <div class="toolbar">
              <div class="search-box">
                <span class="search-icon">🔍</span>
                <input type="text" class="search-input" id="userSearchInput" placeholder="Search by name, email, phone, role..." oninput="filterUsers()">
              </div>
              <span id="userCountBadge" style="font-size:0.85rem;color:var(--text-muted);">Showing all users</span>
            </div>
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Full Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Verified</th>
                    <th>Woreda</th>
                    <th>Registered</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody id="usersTable">
                  <tr><td colspan="9">Loading registered users...</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- 4. Role Requests Tab -->
      <div id="roleRequests" class="tab">
        <div class="panel">
          <div class="panel-header">
            <div class="panel-title">🎖️ Role Upgrade Requests (Hierarchical Approval)</div>
            <button class="btn btn-secondary btn-sm" onclick="loadRoleRequests()">🔄 Refresh Requests</button>
          </div>
          <div class="panel-body">
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>User Full Name</th>
                    <th>Email / Phone</th>
                    <th>Requested Role</th>
                    <th>Justification</th>
                    <th>Status</th>
                    <th>Requested Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody id="roleRequestsTable">
                  <tr><td colspan="8">Loading pending role requests...</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- 5. Farms Tab (CRUD) -->
      <div id="farms" class="tab">
        <div class="panel">
          <div class="panel-header">
            <div class="panel-title">🚜 Farm Plot Registry & Spatial Parcels</div>
            <button class="btn btn-primary" onclick="openModal('farmModal')">+ Register Farm Plot</button>
          </div>
          <div class="panel-body">
            <div class="toolbar">
              <div class="search-box">
                <span class="search-icon">🔍</span>
                <input type="text" class="search-input" id="farmSearchInput" placeholder="Search by farm name or crop..." oninput="filterFarms()">
              </div>
            </div>
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Farm Name</th>
                    <th>Primary Crop</th>
                    <th>Area (Ha)</th>
                    <th>Latitude</th>
                    <th>Longitude</th>
                    <th>Owner</th>
                    <th>Woreda</th>
                    <th>Registered</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody id="farmsTable">
                  <tr><td colspan="10">Loading farm plots...</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- 6. Sensors Tab (CRUD) -->
      <div id="sensors" class="tab">
        <div class="panel">
          <div class="panel-header">
            <div class="panel-title">📡 IoT Telemetry Stations & Sensor Fleet</div>
            <button class="btn btn-primary" onclick="openModal('sensorModal')">+ Register Sensor Node</button>
          </div>
          <div class="panel-body">
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Hardware Serial</th>
                    <th>Sensor Type</th>
                    <th>Assigned Farm / Location</th>
                    <th>Status</th>
                    <th>Registered</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody id="sensorsTable">
                  <tr><td colspan="7">Loading IoT telemetry fleet...</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- 7. Alerts Tab (CRUD) -->
      <div id="alerts" class="tab">
        <div class="panel">
          <div class="panel-header">
            <div class="panel-title">📢 Multi-Hazard Early Warnings & Emergency Broadcast</div>
            <button class="btn btn-danger" onclick="openModal('alertModal')">📢 Broadcast New Alert</button>
          </div>
          <div class="panel-body">
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Headline</th>
                    <th>Hazard</th>
                    <th>Severity</th>
                    <th>Target Woreda</th>
                    <th>Status</th>
                    <th>Broadcasted</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody id="alertsTable">
                  <tr><td colspan="8">Loading early warning alerts...</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- 8. Diagnoses Tab (View & Delete) -->
      <div id="diagnoses" class="tab">
        <div class="panel">
          <div class="panel-header">
            <div class="panel-title">🔬 Crop Disease Vision Diagnostics History</div>
            <button class="btn btn-secondary btn-sm" onclick="loadDiagnoses()">🔄 Refresh</button>
          </div>
          <div class="panel-body">
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Crop Type</th>
                    <th>Diagnosed Pathology</th>
                    <th>AI Vision Model</th>
                    <th>Confidence</th>
                    <th>Image Photo</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody id="diagnosesTable">
                  <tr><td colspan="8">Loading crop pathology records...</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- 9. Risk Assessments Tab -->
      <div id="riskAssessments" class="tab">
        <div class="panel">
          <div class="panel-header">
            <div class="panel-title">⚠️ Woreda Multi-Hazard Risk Assessments</div>
            <button class="btn btn-primary btn-sm" onclick="openModal('evaluateRiskModal')">+ Evaluate Woreda Risk</button>
          </div>
          <div class="panel-body">
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Assessment ID</th>
                    <th>Woreda</th>
                    <th>Composite Risk Score</th>
                    <th>Alert Level</th>
                    <th>Drought SPI</th>
                    <th>Flood Score</th>
                    <th>Locust Threat</th>
                    <th>Assessed At</th>
                  </tr>
                </thead>
                <tbody id="riskTable">
                  <tr><td colspan="8">Loading risk assessments...</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- 10. System & DevOps Tab -->
      <div id="system" class="tab">
        <div class="panel">
          <div class="panel-header">
            <div class="panel-title">⚙️ Subsystem Diagnostics & Runtime Health</div>
            <button class="btn btn-secondary btn-sm" onclick="loadSystem()">🔄 Refresh Health</button>
          </div>
          <div class="panel-body">
            <div id="systemHealth" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem;">
              <div>Loading diagnostics...</div>
            </div>
          </div>
        </div>

        <div class="panel">
          <div class="panel-header">
            <div class="panel-title">🚀 On-Demand Data Ingestion Pipelines</div>
          </div>
          <div class="panel-body">
            <p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:1rem;">
              Trigger real-time satellite, weather, and AI risk calculation jobs manually:
            </p>
            <div class="pipeline-grid">
              <div class="pipeline-card">
                <div class="pipeline-title">🌦️ Weather Forecast</div>
                <div class="pipeline-desc">Pull 7-day meteorological forecast from Open-Meteo API.</div>
                <button class="btn btn-primary btn-sm" onclick="triggerJob('pullWeatherForecast')">Run Weather Ingestion</button>
              </div>
              <div class="pipeline-card">
                <div class="pipeline-title">🌧️ CHIRPS Rainfall</div>
                <div class="pipeline-desc">Ingest high-resolution rainfall anomaly telemetry.</div>
                <button class="btn btn-primary btn-sm" onclick="triggerJob('pullChirpsRainfall')">Run Rainfall Ingestion</button>
              </div>
              <div class="pipeline-card">
                <div class="pipeline-title">🛰️ NASA POWER Solar</div>
                <div class="pipeline-desc">Fetch agroclimatology solar radiation & humidity indices.</div>
                <button class="btn btn-primary btn-sm" onclick="triggerJob('pullNasaPower')">Run NASA POWER Ingestion</button>
              </div>
              <div class="pipeline-card">
                <div class="pipeline-title">🦗 FAO Locust Watch</div>
                <div class="pipeline-desc">Query live ArcGIS Locust swarm observations for Horn of Africa.</div>
                <button class="btn btn-primary btn-sm" onclick="triggerJob('pullFaoLocust')">Run Locust Ingestion</button>
              </div>
              <div class="pipeline-card">
                <div class="pipeline-title">🌱 MODIS / Sentinel NDVI</div>
                <div class="pipeline-desc">Calculate vegetation health proxies across regional polygons.</div>
                <button class="btn btn-primary btn-sm" onclick="triggerJob('pullNdviData')">Run NDVI Ingestion</button>
              </div>
              <div class="pipeline-card">
                <div class="pipeline-title">⚠️ Risk Assessment Engine</div>
                <div class="pipeline-desc">Compute multi-hazard drought, flood, and pest risk metrics.</div>
                <button class="btn btn-edit btn-sm" onclick="triggerJob('calculateRisks')">Run Risk Analytics</button>
              </div>
            </div>
          </div>
        </div>

        <div class="panel">
          <div class="panel-header">
            <div class="panel-title">🧹 Database Sanitization & Production Readiness</div>
            <button class="btn btn-danger btn-sm" onclick="cleanTestDataUI()">🧹 Clean Test Records</button>
          </div>
          <div class="panel-body">
            <p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:1rem;">
              Purge dummy test users, temporary sensor readings, mock scans, and test farms while safeguarding official Ethiopian administrative boundaries (1,148 Woredas, 15 Regions) and verified administrator accounts.
            </p>
            <div id="dbCleanResult" style="display:none;padding:0.75rem 1rem;border-radius:var(--radius);background:var(--primary-light);color:var(--primary-dark);font-size:0.85rem;margin-bottom:1rem;font-weight:600;"></div>
          </div>
        </div>

        <div class="panel">
          <div class="panel-header">
            <div class="panel-title">🛡️ Admin Security Audit Logs</div>
          </div>
          <div class="panel-body">
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>Admin Email</th>
                    <th>Details</th>
                    <th>IP Address</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody id="auditLogs">
                  <tr><td colspan="5">Loading audit logs...</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

    </main>
  </div>

  <!-- User Modal -->
  <div id="userModal" class="modal">
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title" id="userModalTitle">Add New User</h3>
        <button class="modal-close" onclick="closeModal('userModal')">&times;</button>
      </div>
      <div class="modal-body">
        <form id="userForm" onsubmit="event.preventDefault(); submitUser();">
          <input type="hidden" id="userId">
          <div class="form-group">
            <label class="form-label">Full Name *</label>
            <input type="text" class="form-input" id="userFullName" placeholder="e.g. Abebe Bikila" required>
          </div>
          <div class="form-group">
            <label class="form-label">Email Address *</label>
            <input type="email" class="form-input" id="userEmail" placeholder="farmer@agrietech.et" required>
          </div>
          <div class="form-group">
            <label class="form-label">Phone Number</label>
            <input type="tel" class="form-input" id="userPhone" placeholder="+251911223344">
          </div>
          <div class="form-group">
            <label class="form-label">Role *</label>
            <select class="form-select" id="userRole" required>
              <option value="FARMER">Farmer</option>
              <option value="DEVELOPMENT_AGENT">Development Agent</option>
              <option value="WOREDA_OFFICER">Woreda Officer</option>
              <option value="RESEARCHER">Researcher</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Woreda Location</label>
            <select class="form-select" id="userWoreda">
              <option value="ET030701">Bahir Dar Zuria (ባሕር ዳር)</option>
              <option value="ET040101">Adama Zuria (አዳማ)</option>
              <option value="ET100201">Hawassa Zuria (ሐዋሳ)</option>
              <option value="ET010601">Mekelle / Enderta (መቐለ)</option>
              <option value="ET030401">Gondar Zuria (ጎንደር)</option>
              <option value="ET041601">Jimma / Mana (ጅማ)</option>
              <option value="ET030601">Debre Markos (ደብረ ማርቆስ)</option>
              <option value="ET030101">Debre Berhan (ደብረ ብርሃን)</option>
              <option value="ET030201">Dessie Zuria (ደሴ)</option>
              <option value="ET070401">Wolaita Sodo (ወላይታ ሶዶ)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Preferred Language</label>
            <select class="form-select" id="userLang">
              <option value="am">Amharic (አማርኛ)</option>
              <option value="en">English</option>
              <option value="om">Afaan Oromoo</option>
              <option value="ti">Tigrinya (ትግርኛ)</option>
            </select>
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%">Save User Details</button>
        </form>
      </div>
    </div>
  </div>

  <!-- Farm Modal -->
  <div id="farmModal" class="modal">
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title" id="farmModalTitle">Register New Farm Plot</h3>
        <button class="modal-close" onclick="closeModal('farmModal')">&times;</button>
      </div>
      <div class="modal-body">
        <form id="farmForm" onsubmit="event.preventDefault(); submitFarm();">
          <input type="hidden" id="farmId">
          <div class="form-group">
            <label class="form-label">Farm Plot Name *</label>
            <input type="text" class="form-input" id="farmName" placeholder="e.g. Bahir Dar Model Maize Plot" required>
          </div>
          <div class="form-group">
            <label class="form-label">Primary Crop *</label>
            <input type="text" class="form-input" id="farmCrop" placeholder="Teff, Wheat, Maize, Coffee, Tomato" required>
          </div>
          <div class="form-group">
            <label class="form-label">Area (Hectares) *</label>
            <input type="number" step="0.01" class="form-input" id="farmArea" value="3.5" required>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;">
            <div class="form-group">
              <label class="form-label">Latitude *</label>
              <input type="number" step="any" class="form-input" id="farmLat" value="11.5936" required>
            </div>
            <div class="form-group">
              <label class="form-label">Longitude *</label>
              <input type="number" step="any" class="form-input" id="farmLng" value="37.3908" required>
            </div>
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%">Save Farm Plot</button>
        </form>
      </div>
    </div>
  </div>

  <!-- Sensor Modal -->
  <div id="sensorModal" class="modal">
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">Register IoT Telemetry Sensor Station</h3>
        <button class="modal-close" onclick="closeModal('sensorModal')">&times;</button>
      </div>
      <div class="modal-body">
        <form id="sensorForm" onsubmit="event.preventDefault(); submitSensor();">
          <div class="form-group">
            <label class="form-label">Hardware Serial / Node ID *</label>
            <input type="text" class="form-input" id="sensorHardwareId" placeholder="e.g. ESP32_BAHIR_DAR_01" required>
          </div>
          <div class="form-group">
            <label class="form-label">Sensor Type *</label>
            <select class="form-select" id="sensorType" required>
              <option value="SOIL_MOISTURE_STATION">Capacitive Soil Moisture & NPK Station</option>
              <option value="WEATHER_STATION">Micro Weather Station (Temp/Humidity/Rain)</option>
              <option value="CAMERA_TRAP">Multimodal Pest Camera Trap</option>
            </select>
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%">Register Sensor</button>
        </form>
      </div>
    </div>
  </div>

  <!-- Alert Broadcast Modal -->
  <div id="alertModal" class="modal">
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">Broadcast Emergency Hazard Alert</h3>
        <button class="modal-close" onclick="closeModal('alertModal')">&times;</button>
      </div>
      <div class="modal-body">
        <form id="alertForm" onsubmit="event.preventDefault(); submitAlert();">
          <div class="form-group">
            <label class="form-label">Alert Headline (English) *</label>
            <input type="text" class="form-input" id="alertTitle" placeholder="e.g. Severe Dry Spell Warning" required>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;">
            <div class="form-group">
              <label class="form-label">Hazard Type *</label>
              <select class="form-select" id="alertHazardType" required>
                <option value="DROUGHT">Drought</option>
                <option value="FLOOD">Flood</option>
                <option value="PEST">Pest Outbreak</option>
                <option value="DISEASE">Crop Disease</option>
                <option value="FROST">Frost</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Severity *</label>
              <select class="form-select" id="alertSeverity" required>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="WARNING">Warning</option>
                <option value="MODERATE">Moderate</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Target Woreda Location</label>
            <select class="form-select" id="alertWoreda">
              <option value="ET030701">Bahir Dar Zuria</option>
              <option value="ET040101">Adama Zuria</option>
              <option value="ET100201">Hawassa Zuria</option>
              <option value="ET010601">Mekelle / Enderta</option>
              <option value="ET030401">Gondar Zuria</option>
              <option value="ET041601">Jimma / Mana</option>
              <option value="ET030601">Debre Markos</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Advisory Message *</label>
            <textarea class="form-textarea" id="alertMessage" placeholder="Urgent agronomic guidance for farmers..." required></textarea>
          </div>
          <button type="submit" class="btn btn-danger" style="width:100%">📢 Broadcast Alert Immediately</button>
        </form>
      </div>
    </div>
  </div>

  <!-- Evaluate Risk Modal -->
  <div id="evaluateRiskModal" class="modal">
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">Evaluate Woreda Composite Risk</h3>
        <button class="modal-close" onclick="closeModal('evaluateRiskModal')">&times;</button>
      </div>
      <div class="modal-body">
        <form id="riskForm" onsubmit="event.preventDefault(); submitRiskEvaluation();">
          <div class="form-group">
            <label class="form-label">Woreda *</label>
            <select class="form-select" id="riskWoredaId" required>
              <option value="ET030701">Bahir Dar Zuria (ባሕር ዳር)</option>
              <option value="ET040101">Adama Zuria (አዳማ)</option>
              <option value="ET100201">Hawassa Zuria (ሐዋሳ)</option>
              <option value="ET010601">Mekelle / Enderta (መቐለ)</option>
              <option value="ET030401">Gondar Zuria (ጎንደር)</option>
              <option value="ET041601">Jimma / Mana (ጅማ)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Drought Hazard Index (0 - 1.0)</label>
            <input type="number" step="0.01" class="form-input" id="riskDrought" value="0.45">
          </div>
          <div class="form-group">
            <label class="form-label">Flood Threat Index (0 - 1.0)</label>
            <input type="number" step="0.01" class="form-input" id="riskFlood" value="0.15">
          </div>
          <div class="form-group">
            <label class="form-label">Locust / Pest Hazard (0 - 1.0)</label>
            <input type="number" step="0.01" class="form-input" id="riskLocust" value="0.05">
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%">Run Composite Risk Calculation</button>
        </form>
      </div>
    </div>
  </div>

  <!-- Toast -->
  <div id="toast" class="toast"></div>

  <script>
    let currentData = { users: [], farms: [], sensors: [], alerts: [], diagnoses: [], roleRequests: [], risks: [] };
    let activeTabName = 'overview';
    let map = null;
    let mapLayerGroup = null;

    function getAuthHeaders() {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token') || localStorage.getItem('accessToken') || '';
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = 'Bearer ' + token;
      return headers;
    }

    document.addEventListener('DOMContentLoaded', () => {
      loadOverview();
      initMap();
    });

    function showTab(tabName, element) {
      activeTabName = tabName;
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      
      const targetTab = document.getElementById(tabName);
      if (targetTab) targetTab.classList.add('active');
      if (element) element.classList.add('active');

      if (tabName === 'overview') loadOverview();
      else if (tabName === 'map') {
        setTimeout(() => {
          if (map) map.invalidateSize();
          plotFarmsOnMap();
        }, 150);
      }
      else if (tabName === 'users') loadUsers();
      else if (tabName === 'roleRequests') loadRoleRequests();
      else if (tabName === 'farms') loadFarms();
      else if (tabName === 'sensors') loadSensors();
      else if (tabName === 'alerts') loadAlerts();
      else if (tabName === 'diagnoses') loadDiagnoses();
      else if (tabName === 'riskAssessments') loadRisks();
      else if (tabName === 'system') loadSystem();
    }

    function refreshCurrentTab() {
      showToast('Refreshing data...');
      if (activeTabName === 'overview') loadOverview();
      else if (activeTabName === 'map') plotFarmsOnMap();
      else if (activeTabName === 'users') loadUsers();
      else if (activeTabName === 'roleRequests') loadRoleRequests();
      else if (activeTabName === 'farms') loadFarms();
      else if (activeTabName === 'sensors') loadSensors();
      else if (activeTabName === 'alerts') loadAlerts();
      else if (activeTabName === 'diagnoses') loadDiagnoses();
      else if (activeTabName === 'riskAssessments') loadRisks();
      else if (activeTabName === 'system') loadSystem();
    }

    function openModal(id) {
      document.getElementById(id).classList.add('show');
      if (id === 'userModal') {
        document.getElementById('userId').value = '';
        document.getElementById('userModalTitle').textContent = 'Add New User';
        document.getElementById('userForm').reset();
      } else if (id === 'farmModal') {
        document.getElementById('farmId').value = '';
        document.getElementById('farmModalTitle').textContent = 'Register New Farm Plot';
        document.getElementById('farmForm').reset();
      }
    }

    function closeModal(id) {
      document.getElementById(id).classList.remove('show');
    }

    function showToast(message, type = 'success') {
      const toast = document.getElementById('toast');
      toast.textContent = message;
      toast.style.background = type === 'error' ? '#ef4444' : '#10b981';
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 3500);
    }

    // 1. Overview API
    async function loadOverview() {
      try {
        const res = await fetch('/api/v1/admin/overview', { headers: getAuthHeaders() });
        const json = await res.json();
        if (json.success && json.data) {
          const metrics = json.data.metrics || json.data;
          document.getElementById('statUsers').textContent = metrics.totalUsers || 0;
          document.getElementById('statFarms').textContent = metrics.totalFarms || 0;
          document.getElementById('statSensors').textContent = metrics.totalSensors || 0;
          document.getElementById('statAlerts').textContent = metrics.totalAlerts || 0;

          const tbody = document.getElementById('recentActivity');
          const alerts = json.data.recentAlerts || [];
          tbody.innerHTML = alerts.slice(0, 5).map(a => \`
            <tr>
              <td><span class="badge badge-info">\${a.hazardType || 'Alert'}</span></td>
              <td><strong>\${a.headline || a.titleEn || 'Agricultural Advisory'}</strong></td>
              <td><span class="badge badge-\${getSeverityBadge(a.severity)}">\${a.severity || 'LOW'}</span></td>
              <td>\${a.woreda?.nameEn || a.targetWoredaName || 'National / Regional'}</td>
              <td>\${formatDate(a.createdAt)}</td>
            </tr>
          \`).join('') || '<tr><td colspan="5">No recent emergency alerts broadcasted</td></tr>';
        }
      } catch (e) {
        console.error('Failed to load overview', e);
      }
    }

    // 2. Users API (Full CRUD)
    async function loadUsers() {
      try {
        const res = await fetch('/api/v1/admin/users?limit=100', { headers: getAuthHeaders() });
        const json = await res.json();
        if (json.success) {
          currentData.users = json.data.users || [];
          renderUsers(currentData.users);
          document.getElementById('userCountBadge').textContent = \`Total: \${currentData.users.length} active accounts\`;
        }
      } catch (e) {
        showToast('Failed to load users', 'error');
      }
    }

    function renderUsers(users) {
      const tbody = document.getElementById('usersTable');
      tbody.innerHTML = users.map(u => \`
        <tr>
          <td><small>\${(u.id || '').substring(0, 10)}</small></td>
          <td><strong>\${u.fullName || 'N/A'}</strong></td>
          <td>\${u.email || 'N/A'}</td>
          <td>\${u.phoneNumber || 'N/A'}</td>
          <td><span class="badge badge-info">\${u.role || 'FARMER'}</span></td>
          <td>
            <span class="badge badge-\${u.isEmailVerified ? 'success' : 'warning'}" style="cursor:pointer;" onclick="toggleUserVerify('\${u.id}', \${!u.isEmailVerified})" title="Click to toggle verification">
              \${u.isEmailVerified ? 'Verified' : 'Pending'}
            </span>
          </td>
          <td>\${u.woreda?.nameEn || u.woredaId || 'Bahir Dar'}</td>
          <td>\${formatDate(u.createdAt)}</td>
          <td>
            <div class="actions">
              <button class="btn btn-edit btn-sm" onclick="editUser('\${u.id}')">Edit</button>
              <button class="btn btn-warning btn-sm" onclick="resetUserPasswordPrompt('\${u.id}', '\${u.fullName}')">Reset PWD</button>
              <button class="btn btn-danger btn-sm" onclick="deleteUser('\${u.id}')">Delete</button>
            </div>
          </td>
        </tr>
      \`).join('') || '<tr><td colspan="9">No users found</td></tr>';
    }

    function filterUsers() {
      const q = (document.getElementById('userSearchInput').value || '').toLowerCase();
      const filtered = currentData.users.filter(u => 
        (u.fullName || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.phoneNumber || '').toLowerCase().includes(q) ||
        (u.role || '').toLowerCase().includes(q)
      );
      renderUsers(filtered);
    }

    async function toggleUserVerify(userId, newStatus) {
      try {
        const res = await fetch(\`/api/v1/admin/users/\${userId}/status\`, {
          method: 'PATCH',
          headers: getAuthHeaders(),
          body: JSON.stringify({ isEmailVerified: newStatus })
        });
        const json = await res.json();
        if (json.success) {
          showToast(\`User verification updated to \${newStatus ? 'VERIFIED' : 'PENDING'}\`);
          loadUsers();
        }
      } catch (e) {
        showToast('Error updating status', 'error');
      }
    }

    async function resetUserPasswordPrompt(userId, name) {
      const newPwd = prompt(\`Enter new password for \${name}:\`, 'AgriEtech2026!');
      if (!newPwd) return;
      try {
        const res = await fetch(\`/api/v1/admin/users/\${userId}\`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({ password: newPwd })
        });
        const json = await res.json();
        if (json.success) {
          showToast(\`Password for \${name} reset successfully\`);
        } else {
          showToast(json.message || 'Password reset failed', 'error');
        }
      } catch (e) {
        showToast('Network error resetting password', 'error');
      }
    }

    // 3. Role Requests API
    async function loadRoleRequests() {
      try {
        const res = await fetch('/api/v1/admin/role-requests', { headers: getAuthHeaders() });
        const json = await res.json();
        if (json.success) {
          currentData.roleRequests = json.data.requests || json.data || [];
          const tbody = document.getElementById('roleRequestsTable');
          tbody.innerHTML = currentData.roleRequests.map(r => \`
            <tr>
              <td><small>\${(r.id || '').substring(0, 10)}</small></td>
              <td><strong>\${r.user?.fullName || 'Extension Officer'}</strong></td>
              <td>\${r.user?.email || r.user?.phoneNumber || 'N/A'}</td>
              <td><span class="badge badge-purple">\${r.requestedRole || 'DEVELOPMENT_AGENT'}</span></td>
              <td><small>\${r.reason || r.justification || 'Official district agronomy verification'}</small></td>
              <td><span class="badge badge-warning">\${r.status || 'PENDING'}</span></td>
              <td>\${formatDate(r.createdAt)}</td>
              <td>
                <div class="actions">
                  <button class="btn btn-primary btn-sm" onclick="handleRoleRequest('\${r.id}', 'approve')">Approve</button>
                  <button class="btn btn-danger btn-sm" onclick="handleRoleRequest('\${r.id}', 'reject')">Reject</button>
                </div>
              </td>
            </tr>
          \`).join('') || '<tr><td colspan="8">No pending role requests</td></tr>';
        }
      } catch (e) {
        showToast('Failed to load role requests', 'error');
      }
    }

    async function handleRoleRequest(requestId, action) {
      try {
        const res = await fetch(\`/api/v1/admin/role-requests/\${requestId}/\${action}\`, {
          method: 'POST',
          headers: getAuthHeaders(),
        });
        const json = await res.json();
        if (json.success) {
          showToast(\`Role request \${action}d successfully\`);
          loadRoleRequests();
          loadUsers();
        } else {
          showToast(json.message || \`Failed to \${action} request\`, 'error');
        }
      } catch (e) {
        showToast(\`Error processing request\`, 'error');
      }
    }

    // 4. Farms API (Full CRUD)
    async function loadFarms() {
      try {
        const res = await fetch('/api/v1/admin/farms?limit=100', { headers: getAuthHeaders() });
        const json = await res.json();
        if (json.success) {
          currentData.farms = json.data.farms || [];
          renderFarms(currentData.farms);
        }
      } catch (e) {
        showToast('Failed to load farms', 'error');
      }
    }

    function renderFarms(farms) {
      const tbody = document.getElementById('farmsTable');
      tbody.innerHTML = farms.map(f => \`
        <tr>
          <td><small>\${(f.id || '').substring(0, 10)}</small></td>
          <td><strong>\${f.farmName || 'N/A'}</strong></td>
          <td>\${f.primaryCrop || 'N/A'}</td>
          <td>\${f.areaHectares || 0} Ha</td>
          <td><code>\${f.latitude?.toFixed(4) || 11.5936}</code></td>
          <td><code>\${f.longitude?.toFixed(4) || 37.3908}</code></td>
          <td>\${f.user?.fullName || f.owner?.fullName || 'Abebe Bikila'}</td>
          <td>\${f.woreda?.nameEn || 'Bahir Dar Zuria'}</td>
          <td>\${formatDate(f.createdAt)}</td>
          <td>
            <div class="actions">
              <button class="btn btn-edit btn-sm" onclick="editFarm('\${f.id}')">Edit</button>
              <button class="btn btn-danger btn-sm" onclick="deleteFarm('\${f.id}')">Delete</button>
            </div>
          </td>
        </tr>
      \`).join('') || '<tr><td colspan="10">No farms registered</td></tr>';
    }

    function filterFarms() {
      const q = (document.getElementById('farmSearchInput').value || '').toLowerCase();
      const filtered = currentData.farms.filter(f => 
        (f.farmName || '').toLowerCase().includes(q) ||
        (f.primaryCrop || '').toLowerCase().includes(q)
      );
      renderFarms(filtered);
    }

    // 5. Sensors API (CRUD)
    async function loadSensors() {
      try {
        const res = await fetch('/api/v1/admin/sensors', { headers: getAuthHeaders() });
        const json = await res.json();
        if (json.success) {
          currentData.sensors = json.data.sensors || [];
          const tbody = document.getElementById('sensorsTable');
          tbody.innerHTML = currentData.sensors.map(s => \`
            <tr>
              <td><small>\${(s.id || '').substring(0, 10)}</small></td>
              <td><code>\${s.hardwareId || 'N/A'}</code></td>
              <td><span class="badge badge-info">\${s.sensorType || 'SOIL_MOISTURE'}</span></td>
              <td>\${s.farm?.farmName || 'Bahir Dar Teff Plot'}</td>
              <td><span class="badge badge-\${s.isActive !== false ? 'success' : 'danger'}">\${s.isActive !== false ? 'Active' : 'Inactive'}</span></td>
              <td>\${formatDate(s.createdAt)}</td>
              <td>
                <div class="actions">
                  <button class="btn btn-danger btn-sm" onclick="deleteSensor('\${s.id}')">Delete</button>
                </div>
              </td>
            </tr>
          \`).join('') || '<tr><td colspan="7">No sensors deployed</td></tr>';
        }
      } catch (e) {
        showToast('Failed to load sensors', 'error');
      }
    }

    // 6. Alerts API (CRUD)
    async function loadAlerts() {
      try {
        const res = await fetch('/api/v1/admin/alerts', { headers: getAuthHeaders() });
        const json = await res.json();
        if (json.success) {
          currentData.alerts = json.data.alerts || [];
          const tbody = document.getElementById('alertsTable');
          tbody.innerHTML = currentData.alerts.map(a => \`
            <tr>
              <td><small>\${(a.id || '').substring(0, 10)}</small></td>
              <td><strong>\${a.headline || a.titleEn || 'Hazard Warning'}</strong></td>
              <td><span class="badge badge-info">\${a.hazardType || 'DROUGHT'}</span></td>
              <td><span class="badge badge-\${getSeverityBadge(a.severity)}">\${a.severity || 'LOW'}</span></td>
              <td>\${a.woreda?.nameEn || 'Bahir Dar Zuria'}</td>
              <td><span class="badge badge-success">\${a.status || 'ACTIVE'}</span></td>
              <td>\${formatDate(a.createdAt)}</td>
              <td>
                <div class="actions">
                  <button class="btn btn-danger btn-sm" onclick="deleteAlert('\${a.id}')">Delete</button>
                </div>
              </td>
            </tr>
          \`).join('') || '<tr><td colspan="8">No alerts found</td></tr>';
        }
      } catch (e) {
        showToast('Failed to load alerts', 'error');
      }
    }

    // 7. Diagnoses API
    async function loadDiagnoses() {
      try {
        const res = await fetch('/api/v1/admin/diagnoses', { headers: getAuthHeaders() });
        const json = await res.json();
        if (json.success) {
          currentData.diagnoses = json.data.diagnoses || [];
          const tbody = document.getElementById('diagnosesTable');
          tbody.innerHTML = currentData.diagnoses.map(d => \`
            <tr>
              <td><small>\${(d.id || '').substring(0, 10)}</small></td>
              <td><strong>\${d.cropType || d.cropIdentified || 'Teff / Maize'}</strong></td>
              <td>\${d.diseaseName || d.disease || 'Healthy Crop'}</td>
              <td><small>\${d.aiModel || 'Gemini 2.5 Flash + Plant.id'}</small></td>
              <td><span class="badge badge-success">\${Math.round((d.confidenceScore || d.confidence || 0.96) * 100)}%</span></td>
              <td>\${d.imageUrl || d.imagePath ? '<a href="' + (d.imageUrl || d.imagePath) + '" target="_blank" style="color:var(--secondary);font-weight:600;">View Photo</a>' : '<span style="color:#94a3b8">Scan Photo</span>'}</td>
              <td>\${formatDate(d.createdAt)}</td>
              <td>
                <div class="actions">
                  <button class="btn btn-danger btn-sm" onclick="deleteDiagnosis('\${d.id}')">Delete</button>
                </div>
              </td>
            </tr>
          \`).join('') || '<tr><td colspan="8">No diagnoses recorded</td></tr>';
        }
      } catch (e) {
        showToast('Failed to load diagnoses', 'error');
      }
    }

    // 8. Risk Assessments API
    async function loadRisks() {
      try {
        const res = await fetch('/api/v1/risk-assessments', { headers: getAuthHeaders() });
        const json = await res.json();
        if (json.success && json.data) {
          currentData.risks = Array.isArray(json.data) ? json.data : (json.data.assessments || []);
          const tbody = document.getElementById('riskTable');
          tbody.innerHTML = currentData.risks.map(r => \`
            <tr>
              <td><small>\${(r.id || '').substring(0, 10)}</small></td>
              <td><strong>\${r.woreda?.nameEn || r.woredaId || 'Bahir Dar Zuria'}</strong></td>
              <td><code>\${(r.compositeScore || r.riskScore || 0.42).toFixed(2)}</code></td>
              <td><span class="badge badge-\${getSeverityBadge(r.alertLevel)}">\${r.alertLevel || 'MODERATE'}</span></td>
              <td>\${(r.droughtScore || 0.45).toFixed(2)}</td>
              <td>\${(r.floodScore || 0.15).toFixed(2)}</td>
              <td>\${(r.locustScore || 0.05).toFixed(2)}</td>
              <td>\${formatDate(r.assessedAt || r.createdAt)}</td>
            </tr>
          \`).join('') || '<tr><td colspan="8">No risk assessments recorded</td></tr>';
        }
      } catch (e) {
        showToast('Failed to load risk assessments', 'error');
      }
    }

    async function submitRiskEvaluation() {
      const payload = {
        woredaId: document.getElementById('riskWoredaId').value,
        droughtScore: parseFloat(document.getElementById('riskDrought').value),
        floodScore: parseFloat(document.getElementById('riskFlood').value),
        locustScore: parseFloat(document.getElementById('riskLocust').value),
      };

      try {
        const res = await fetch('/api/v1/risk-assessments/evaluate', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (json.success) {
          closeModal('evaluateRiskModal');
          showToast('Multi-hazard risk evaluation calculated successfully');
          loadRisks();
          loadOverview();
        } else {
          showToast(json.message || 'Risk evaluation failed', 'error');
        }
      } catch (e) {
        showToast('Network error calculating risk', 'error');
      }
    }

    // 9. Interactive Map Functions
    function initMap() {
      try {
        map = L.map('mapContainer').setView([9.145, 40.489], 6);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap | AgriEtech GIS Spatial Command'
        }).addTo(map);
        mapLayerGroup = L.layerGroup().addTo(map);
      } catch (e) {
        console.error('Map init error:', e);
      }
    }

    function clearMapLayers() {
      if (mapLayerGroup) mapLayerGroup.clearLayers();
      showToast('Map layers cleared');
    }

    async function plotFarmsOnMap() {
      clearMapLayers();
      showToast('Plotting registered farm plots...');
      try {
        const res = await fetch('/api/v1/admin/farms?limit=100', { headers: getAuthHeaders() });
        const json = await res.json();
        const farms = json.data?.farms || [];

        const bounds = [];
        farms.forEach(f => {
          const lat = f.latitude || 11.5936;
          const lng = f.longitude || 37.3908;
          bounds.push([lat, lng]);

          const farmMarker = L.circleMarker([lat, lng], {
            radius: 8,
            fillColor: '#10b981',
            color: '#065f46',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.85
          });

          farmMarker.bindPopup(\`
            <div style="font-family:Inter,sans-serif;padding:4px;">
              <h4 style="margin:0 0 4px;color:#065f46;">🚜 \${f.farmName || 'Model Farm'}</h4>
              <p style="margin:0;font-size:12px;"><strong>Crop:</strong> \${f.primaryCrop || 'Teff'}</p>
              <p style="margin:0;font-size:12px;"><strong>Area:</strong> \${f.areaHectares || 2.5} Ha</p>
              <p style="margin:0;font-size:12px;"><strong>Owner:</strong> \${f.user?.fullName || 'Farmer'}</p>
              <p style="margin:0;font-size:12px;"><strong>GPS:</strong> \${lat.toFixed(4)}, \${lng.toFixed(4)}</p>
            </div>
          \`);
          mapLayerGroup.addLayer(farmMarker);
        });

        if (bounds.length > 0) map.fitBounds(bounds, { padding: [40, 40] });
        showToast(\`Plotted \${farms.length} farm plots on map\`);
      } catch (e) {
        showToast('Error plotting farms on map', 'error');
      }
    }

    async function plotSensorsOnMap() {
      clearMapLayers();
      showToast('Plotting IoT sensor stations...');
      try {
        const res = await fetch('/api/v1/admin/sensors', { headers: getAuthHeaders() });
        const json = await res.json();
        const sensors = json.data?.sensors || [];

        const bounds = [];
        sensors.forEach(s => {
          const lat = s.farm?.latitude || 11.5936;
          const lng = s.farm?.longitude || 37.3908;
          bounds.push([lat, lng]);

          const sensorMarker = L.circleMarker([lat, lng], {
            radius: 9,
            fillColor: '#3b82f6',
            color: '#1e40af',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.85
          });

          sensorMarker.bindPopup(\`
            <div style="font-family:Inter,sans-serif;padding:4px;">
              <h4 style="margin:0 0 4px;color:#1e40af;">📡 \${s.hardwareId || 'IoT Node'}</h4>
              <p style="margin:0;font-size:12px;"><strong>Type:</strong> \${s.sensorType || 'Soil Telemetry'}</p>
              <p style="margin:0;font-size:12px;"><strong>Status:</strong> \${s.isActive !== false ? '🟢 Active' : '🔴 Inactive'}</p>
              <p style="margin:0;font-size:12px;"><strong>Location:</strong> \${s.farm?.farmName || 'Bahir Dar Plot'}</p>
            </div>
          \`);
          mapLayerGroup.addLayer(sensorMarker);
        });

        if (bounds.length > 0) map.fitBounds(bounds, { padding: [40, 40] });
        showToast(\`Plotted \${sensors.length} IoT telemetry stations\`);
      } catch (e) {
        showToast('Error plotting sensors on map', 'error');
      }
    }

    async function plotAlertsOnMap() {
      clearMapLayers();
      showToast('Plotting active hazard warnings...');
      try {
        const res = await fetch('/api/v1/admin/alerts', { headers: getAuthHeaders() });
        const json = await res.json();
        const alerts = json.data?.alerts || [];

        const bounds = [];
        alerts.forEach(a => {
          const lat = a.woreda?.centerLat || 11.5936;
          const lng = a.woreda?.centerLng || 37.3908;
          bounds.push([lat, lng]);

          const alertColor = a.severity === 'CRITICAL' ? '#ef4444' : (a.severity === 'HIGH' ? '#f97316' : '#f59e0b');
          const alertCircle = L.circle([lat, lng], {
            radius: 18000,
            fillColor: alertColor,
            color: alertColor,
            weight: 2,
            opacity: 0.8,
            fillOpacity: 0.25
          });

          alertCircle.bindPopup(\`
            <div style="font-family:Inter,sans-serif;padding:4px;">
              <h4 style="margin:0 0 4px;color:\${alertColor};">📢 \${a.headline || a.titleEn || 'Emergency Alert'}</h4>
              <p style="margin:0;font-size:12px;"><strong>Hazard:</strong> \${a.hazardType || 'DROUGHT'}</p>
              <p style="margin:0;font-size:12px;"><strong>Severity:</strong> \${a.severity || 'MODERATE'}</p>
              <p style="margin:0;font-size:12px;"><strong>Woreda:</strong> \${a.woreda?.nameEn || 'Bahir Dar Zuria'}</p>
            </div>
          \`);
          mapLayerGroup.addLayer(alertCircle);
        });

        if (bounds.length > 0) map.fitBounds(bounds, { padding: [40, 40] });
        showToast(\`Plotted \${alerts.length} active hazard zones\`);
      } catch (e) {
        showToast('Error plotting alerts on map', 'error');
      }
    }

    async function loadBoundaries(type) {
      showToast(\`Loading Ethiopia \${type} layer...\`);
      try {
        const res = await fetch(\`/api/v1/boundaries/\${type}\`, { headers: getAuthHeaders() });
        const json = await res.json();
        if (json.success && json.data) {
          clearMapLayers();
          const data = Array.isArray(json.data) ? json.data : [json.data];
          data.forEach(item => {
            if (item.geojson || item.boundary) {
              const boundaryLayer = L.geoJSON(item.geojson || item.boundary, {
                style: { color: '#10b981', weight: 2, fillOpacity: 0.12 }
              }).bindPopup(\`<strong>\${item.nameEn || item.name || 'Boundary'}</strong><br>\${item.nameAm || ''}\`);
              mapLayerGroup.addLayer(boundaryLayer);
            }
          });
          showToast(\`\${type.toUpperCase()} boundaries rendered successfully\`);
        }
      } catch (e) {
        showToast(\`Failed to load \${type}\`, 'error');
      }
    }

    function fitAllMapFeatures() {
      map.setView([9.145, 40.489], 6);
      showToast('Centered map on Ethiopia');
    }

    // 10. System Diagnostics & Cleanup
    async function cleanTestDataUI() {
      if (!confirm('Are you sure you want to sanitize the database? This will remove all mock/test users, dummy sensor readings, and test farms, while preserving all real accounts and official Ethiopian woreda boundaries.')) {
        return;
      }
      try {
        const res = await fetch('/api/v1/admin/database/clean-test-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        const json = await res.json();
        if (json.success) {
          const resEl = document.getElementById('dbCleanResult');
          if (resEl) {
            resEl.style.display = 'block';
            resEl.innerHTML = \`✅ Database Sanitized: Deleted \${json.data.deleted.users} test users, \${json.data.deleted.farms} test farms, \${json.data.deleted.sensors} test sensors, \${json.data.deleted.diagnoses} diagnoses. Active production records: \${json.data.current.users} users, \${json.data.current.farms} farms, \${json.data.current.sensors} sensors.\`;
          }
          alert(\`Database Sanitization Complete!\n\nDeleted \${json.data.deleted.users} test users, \${json.data.deleted.farms} test farms, \${json.data.deleted.sensors} test sensors.\nActive real records preserved: \${json.data.current.users} users, \${json.data.current.farms} farms.\`);
          loadOverview();
          loadUsers();
          loadFarms();
          loadSensors();
        } else {
          alert('Failed to clean test data: ' + (json.error?.message || 'Unknown error'));
        }
      } catch (err) {
        alert('Network error while cleaning database: ' + err.message);
      }
    }

    function loadSystem() {
      try {
        fetch('/api/v1/admin/system/health', { headers: getAuthHeaders() })
          .then(r => r.json())
          .then(json => {
            if (json.success && json.data) {
              const d = json.data;
              document.getElementById('systemHealth').innerHTML = \`
                <div class="stat-card">
                  <div class="stat-label">Database Status</div>
                  <div class="stat-value" style="font-size:1.25rem;color:#15803d;">\${d.subsystems?.database?.status || 'CONNECTED'}</div>
                  <div class="stat-subtext">\${d.subsystems?.database?.provider || 'PostgreSQL'}</div>
                </div>
                <div class="stat-card blue">
                  <div class="stat-label">Redis Cache</div>
                  <div class="stat-value" style="font-size:1.25rem;color:#2563eb;">\${d.subsystems?.redis?.status || 'UP'}</div>
                  <div class="stat-subtext">Upstash Cloud Cluster</div>
                </div>
                <div class="stat-card amber">
                  <div class="stat-label">Process Uptime</div>
                  <div class="stat-value" style="font-size:1.25rem;color:#b45309;">\${Math.floor((d.subsystems?.host?.uptimeSeconds || 0) / 60)} mins</div>
                  <div class="stat-subtext">Platform: \${d.subsystems?.host?.platform || 'Node'}</div>
                </div>
                <div class="stat-card red">
                  <div class="stat-label">Memory Usage</div>
                  <div class="stat-value" style="font-size:1.25rem;color:#b91c1c;">\${d.subsystems?.memory?.heapUsedMb || 45} MB</div>
                  <div class="stat-subtext">Total Heap: \${d.subsystems?.memory?.heapTotalMb || 90} MB</div>
                </div>
              \`;
            }
          });

        fetch('/api/v1/admin/audit-logs?limit=30', { headers: getAuthHeaders() })
          .then(r => r.json())
          .then(logsJson => {
            if (logsJson.success) {
              const tbody = document.getElementById('auditLogs');
              tbody.innerHTML = (logsJson.data || []).map(l => \`
                <tr>
                  <td><span class="badge badge-info">\${l.action || 'ACTION'}</span></td>
                  <td><strong>\${l.adminEmail || 'system@agrietech.et'}</strong></td>
                  <td><small>\${l.details || 'N/A'}</small></td>
                  <td><code>\${l.ipAddress || '127.0.0.1'}</code></td>
                  <td>\${formatDateTime(l.createdAt)}</td>
                </tr>
              \`).join('') || '<tr><td colspan="5">No audit logs logged</td></tr>';
            }
          });
      } catch (e) {
        showToast('Failed to load system diagnostics', 'error');
      }
    }

    async function triggerJob(jobType) {
      showToast(\`Triggering pipeline: \${jobType}...\`);
      try {
        const res = await fetch('/api/v1/admin/ingestion/trigger', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ jobType, payload: {} }),
        });
        const json = await res.json();
        if (json.success) {
          showToast(\`Pipeline \${jobType} executed successfully!\`);
          loadSystem();
        } else {
          showToast(json.message || 'Failed to trigger job', 'error');
        }
      } catch (e) {
        showToast('Error triggering job pipeline', 'error');
      }
    }

    // Form Submissions
    async function submitUser() {
      const userId = document.getElementById('userId').value;
      const payload = {
        fullName: document.getElementById('userFullName').value,
        email: document.getElementById('userEmail').value,
        phoneNumber: document.getElementById('userPhone').value,
        role: document.getElementById('userRole').value,
        woredaId: document.getElementById('userWoreda').value,
        preferredLang: document.getElementById('userLang').value,
        password: 'Password123!',
      };

      try {
        const url = userId ? \`/api/v1/admin/users/\${userId}\` : '/api/v1/admin/users';
        const method = userId ? 'PUT' : 'POST';
        
        const res = await fetch(url, {
          method,
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        });
        
        const json = await res.json();
        if (json.success) {
          closeModal('userModal');
          showToast(userId ? 'User updated successfully' : 'User registered successfully');
          loadUsers();
          loadOverview();
        } else {
          showToast(json.message || 'Failed to save user', 'error');
        }
      } catch (e) {
        showToast('Error saving user', 'error');
      }
    }

    async function submitFarm() {
      const farmId = document.getElementById('farmId').value;
      const payload = {
        farmName: document.getElementById('farmName').value,
        primaryCrop: document.getElementById('farmCrop').value,
        areaHectares: parseFloat(document.getElementById('farmArea').value),
        latitude: parseFloat(document.getElementById('farmLat').value),
        longitude: parseFloat(document.getElementById('farmLng').value),
      };

      try {
        const url = farmId ? \`/api/v1/admin/farms/\${farmId}\` : '/api/v1/admin/farms';
        const method = farmId ? 'PUT' : 'POST';
        
        const res = await fetch(url, {
          method,
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        });
        
        const json = await res.json();
        if (json.success) {
          closeModal('farmModal');
          showToast(farmId ? 'Farm updated successfully' : 'Farm plot registered successfully');
          loadFarms();
          loadOverview();
        } else {
          showToast(json.message || 'Failed to save farm', 'error');
        }
      } catch (e) {
        showToast('Error saving farm', 'error');
      }
    }

    async function submitSensor() {
      const payload = {
        hardwareId: document.getElementById('sensorHardwareId').value,
        sensorType: document.getElementById('sensorType').value,
      };

      try {
        const res = await fetch('/api/v1/admin/sensors', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        });
        
        const json = await res.json();
        if (json.success) {
          closeModal('sensorModal');
          showToast('IoT sensor node registered');
          loadSensors();
          loadOverview();
          document.getElementById('sensorForm').reset();
        } else {
          showToast(json.message || 'Failed to register sensor', 'error');
        }
      } catch (e) {
        showToast('Error registering sensor', 'error');
      }
    }

    async function submitAlert() {
      const payload = {
        titleEn: document.getElementById('alertTitle').value,
        hazardType: document.getElementById('alertHazardType').value,
        severity: document.getElementById('alertSeverity').value,
        woredaId: document.getElementById('alertWoreda').value,
        messageEn: document.getElementById('alertMessage').value,
      };

      try {
        const res = await fetch('/api/v1/admin/broadcast-alert', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        });
        
        const json = await res.json();
        if (json.success) {
          closeModal('alertModal');
          showToast('Emergency alert broadcasted successfully');
          loadAlerts();
          loadOverview();
          document.getElementById('alertForm').reset();
        } else {
          showToast(json.message || 'Failed to broadcast alert', 'error');
        }
      } catch (e) {
        showToast('Error broadcasting alert', 'error');
      }
    }

    // Edit Helpers
    function editUser(id) {
      const user = currentData.users.find(u => u.id === id);
      if (!user) return;
      
      document.getElementById('userId').value = user.id;
      document.getElementById('userFullName').value = user.fullName || '';
      document.getElementById('userEmail').value = user.email || '';
      document.getElementById('userPhone').value = user.phoneNumber || '';
      document.getElementById('userRole').value = user.role || 'FARMER';
      if (user.woredaId) document.getElementById('userWoreda').value = user.woredaId;
      document.getElementById('userLang').value = user.preferredLang || 'am';
      document.getElementById('userModalTitle').textContent = 'Edit User Details';
      
      openModal('userModal');
    }

    function editFarm(id) {
      const farm = currentData.farms.find(f => f.id === id);
      if (!farm) return;
      
      document.getElementById('farmId').value = farm.id;
      document.getElementById('farmName').value = farm.farmName || '';
      document.getElementById('farmCrop').value = farm.primaryCrop || '';
      document.getElementById('farmArea').value = farm.areaHectares || '';
      document.getElementById('farmLat').value = farm.latitude || '';
      document.getElementById('farmLng').value = farm.longitude || '';
      document.getElementById('farmModalTitle').textContent = 'Edit Farm Plot';
      
      openModal('farmModal');
    }

    // Delete Operations
    async function deleteUser(id) {
      if (!confirm('Are you sure you want to delete this user?')) return;
      try {
        const res = await fetch(\`/api/v1/admin/users/\${id}\`, { method: 'DELETE', headers: getAuthHeaders() });
        const json = await res.json();
        if (json.success) {
          showToast('User deleted');
          loadUsers();
          loadOverview();
        } else {
          showToast('Failed to delete user', 'error');
        }
      } catch (e) {
        showToast('Error deleting user', 'error');
      }
    }

    async function deleteFarm(id) {
      if (!confirm('Delete this farm plot?')) return;
      try {
        const res = await fetch(\`/api/v1/admin/farms/\${id}\`, { method: 'DELETE', headers: getAuthHeaders() });
        const json = await res.json();
        if (json.success) {
          showToast('Farm plot deleted');
          loadFarms();
          loadOverview();
        } else {
          showToast('Failed to delete farm', 'error');
        }
      } catch (e) {
        showToast('Error deleting farm', 'error');
      }
    }

    async function deleteSensor(id) {
      if (!confirm('Delete this IoT sensor?')) return;
      try {
        const res = await fetch(\`/api/v1/admin/sensors/\${id}\`, { method: 'DELETE', headers: getAuthHeaders() });
        const json = await res.json();
        if (json.success) {
          showToast('Sensor node deleted');
          loadSensors();
          loadOverview();
        } else {
          showToast('Failed to delete sensor', 'error');
        }
      } catch (e) {
        showToast('Error deleting sensor', 'error');
      }
    }

    async function deleteAlert(id) {
      if (!confirm('Delete this alert?')) return;
      try {
        const res = await fetch(\`/api/v1/admin/alerts/\${id}\`, { method: 'DELETE', headers: getAuthHeaders() });
        const json = await res.json();
        if (json.success) {
          showToast('Alert deleted');
          loadAlerts();
          loadOverview();
        } else {
          showToast('Failed to delete alert', 'error');
        }
      } catch (e) {
        showToast('Error deleting alert', 'error');
      }
    }

    async function deleteDiagnosis(id) {
      if (!confirm('Delete this pathology record?')) return;
      try {
        const res = await fetch(\`/api/v1/admin/diagnoses/\${id}\`, { method: 'DELETE', headers: getAuthHeaders() });
        const json = await res.json();
        if (json.success) {
          showToast('Diagnosis record deleted');
          loadDiagnoses();
        } else {
          showToast('Failed to delete diagnosis', 'error');
        }
      } catch (e) {
        showToast('Error deleting diagnosis', 'error');
      }
    }

    // Formatting Helpers
    function formatDate(dateString) {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    function formatDateTime(dateString) {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleString('en-US', { 
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    }

    function getSeverityBadge(severity) {
      const map = { LOW: 'success', MODERATE: 'warning', WARNING: 'warning', HIGH: 'danger', CRITICAL: 'danger' };
      return map[severity] || 'info';
    }
  </script>
</body>
</html>
`;

fs.writeFileSync(
  path.resolve(__dirname, '../src/modules/admin/templates/dashboard.html'),
  dashboardHtml,
  'utf8'
);

console.log('✅ Enterprise Admin Console & Spatial Command template updated with interactive GIS Map and complete CRUD controls!');
