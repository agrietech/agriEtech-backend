const fs = require('fs');

// 1. Update features alert_repository.dart with markAsRead
const repoPath = 'C:/Users/a/Desktop/agrietech-frontend/lib/features/alerts/repositories/alert_repository.dart';
let repo = fs.readFileSync(repoPath, 'utf8');

if (!repo.includes('Future<void> markAsRead')) {
  repo = repo.replace(
    /class AlertRepository \{[\s\S]*?final DioClient _dioClient;\s*AlertRepository\(this\._dioClient\);/m,
    `class AlertRepository {
  final DioClient _dioClient;

  AlertRepository(this._dioClient);

  /// Mark alert as read
  Future<void> markAsRead(String id) async {
    try {
      await _dioClient.patch('/alerts/$id/read');
    } catch (_) {}
  }`
  );
  fs.writeFileSync(repoPath, repo, 'utf8');
  console.log('✅ Added markAsRead to features alert_repository.dart');
}

// 2. Fix home_screen.dart role check
const homePath = 'C:/Users/a/Desktop/agrietech-frontend/lib/features/home/screens/home_screen.dart';
let home = fs.readFileSync(homePath, 'utf8');

home = home.replace(
  /if \(user\?\.role == 'ADMIN'\)/g,
  "if (user?.role?.name.toUpperCase() == 'ADMIN' || RoleUtils.getRoleDisplayName(user?.role).toUpperCase() == 'ADMIN')"
);

fs.writeFileSync(homePath, home, 'utf8');
console.log('✅ Fixed home_screen.dart role check');
