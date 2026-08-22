const fs = require('fs');

const homeScreenPath = 'C:/Users/a/Desktop/agrietech-frontend/lib/features/home/screens/home_screen.dart';
let home = fs.readFileSync(homeScreenPath, 'utf8');

// Ensure url_launcher import
if (!home.includes('url_launcher_string.dart')) {
  home = "import 'package:url_launcher/url_launcher_string.dart';\n" + home;
}

// Add Admin Console Quick Card for ADMIN users
const adminCard = `
                      if (user?.role == 'ADMIN')
                        _buildTechMenuCard(
                          context,
                          ref,
                          title: 'Admin Console',
                          subtitle: 'Users, CRUD & system fleet',
                          badgeText: 'ADMIN',
                          badgeColor: const Color(0xFFDC2626),
                          icon: Icons.admin_panel_settings_outlined,
                          route: 'admin_web_console',
                          accentColor: const Color(0xFFDC2626),
                        ),`;

if (!home.includes('Admin Console')) {
  home = home.replace(
    /if \(RoleUtils\.canViewAnalytics\(user\?\.role\)\)[\s\S]*?accentColor:\s*const Color\(0xFF4338CA\),\s*\),/,
    (match) => match + adminCard
  );
}

// Handle route click for admin_web_console
home = home.replace(
  /if \(route == '\/alerts'\) \{/,
  `if (route == 'admin_web_console') {
              launchUrlString('http://localhost:3000/admin/dashboard', mode: LaunchMode.externalApplication);
              return;
            }
            if (route == '/alerts') {`
);

// Remove floatingActionButton completely
home = home.replace(
  /floatingActionButton:\s*FloatingActionButton\.extended\([\s\S]*?\),\s*\);/m,
  ');'
);

fs.writeFileSync(homeScreenPath, home, 'utf8');
console.log('✅ Updated home_screen.dart with Admin Console Quick Card and clean navigation');
