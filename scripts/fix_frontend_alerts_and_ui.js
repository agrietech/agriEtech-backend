const fs = require('fs');
const path = require('path');

// 1. Update home_screen.dart
const homeScreenPath = 'C:/Users/a/Desktop/agrietech-frontend/lib/features/home/screens/home_screen.dart';
let homeScreen = fs.readFileSync(homeScreenPath, 'utf8');

// Ensure import
if (!homeScreen.includes("import '../../alerts/providers/alert_provider.dart';")) {
  homeScreen = "import '../../alerts/providers/alert_provider.dart';\n" + homeScreen;
}

// Replace top bar notification button with dynamic unread badge
homeScreen = homeScreen.replace(
  /IconButton\(\s*icon:\s*const Icon\(Icons\.notifications_active_outlined\),\s*tooltip:\s*'Alerts',\s*onPressed:\s*\(\)\s*=>\s*context\.push\('\/alerts'\),\s*\),/,
  `Consumer(
            builder: (context, ref, _) {
              final alertsAsync = ref.watch(alertListProvider);
              final unreadCount = alertsAsync.maybeWhen(
                data: (list) => list.where((a) => a.isActive && !a.isRead).length,
                orElse: () => 0,
              );
              return IconButton(
                icon: Badge(
                  isLabelVisible: unreadCount > 0,
                  label: Text('$unreadCount', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                  backgroundColor: AppTheme.errorColor,
                  child: const Icon(Icons.notifications_outlined),
                ),
                tooltip: 'Alerts',
                onPressed: () => context.push('/alerts'),
              );
            },
          ),`
);

// Remove duplicate floating action button on margin
homeScreen = homeScreen.replace(
  /floatingActionButton:\s*FloatingActionButton\.extended\([\s\S]*?label:\s*const Text\('Ask Agri-AI'\),\s*\),/,
  '// Duplicate floating button removed: AI Assistant is accessed from the bottom navigation taskbar'
);

fs.writeFileSync(homeScreenPath, homeScreen, 'utf8');
console.log('✅ Updated home_screen.dart');

// 2. Update main_navigation_shell.dart
const shellPath = 'C:/Users/a/Desktop/agrietech-frontend/lib/features/home/screens/main_navigation_shell.dart';
let shell = fs.readFileSync(shellPath, 'utf8');

shell = shell.replace(
  /import '\.\.\/\.\.\/alerts\/providers\/alerts_provider\.dart';/,
  "import '../../alerts/providers/alert_provider.dart';"
);

shell = shell.replace(
  /final alertsState = ref\.watch\(alertsProvider\);\s*final activeAlertsCount = alertsState\.maybeWhen\(\s*data: \(list\) => list\.where\(\(a\) => a\.isActive\)\.length,\s*orElse: \(\) => 0,\s*\);/,
  `final alertsState = ref.watch(alertListProvider);
    final activeAlertsCount = alertsState.maybeWhen(
      data: (list) => list.where((a) => a.isActive && !a.isRead).length,
      orElse: () => 0,
    );`
);

fs.writeFileSync(shellPath, shell, 'utf8');
console.log('✅ Updated main_navigation_shell.dart');

// 3. Update alert_provider.dart with toggleReadStatus
const alertProviderPath = 'C:/Users/a/Desktop/agrietech-frontend/lib/features/alerts/providers/alert_provider.dart';
let alertProvider = fs.readFileSync(alertProviderPath, 'utf8');

if (!alertProvider.includes('toggleReadStatus')) {
  alertProvider = alertProvider.replace(
    /Future<void> fetchAlerts\(\) async {/,
    `Future<void> toggleReadStatus(String alertId) async {
    state.whenData((alerts) {
      final updated = alerts.map((a) {
        if (a.id == alertId) {
          final newIsRead = !a.isRead;
          return AlertModel(
            id: a.id,
            woredaId: a.woredaId,
            userId: a.userId,
            hazardType: a.hazardType,
            severity: a.severity,
            title: a.title,
            message: a.message,
            actionItems: a.actionItems,
            priority: a.priority,
            validUntil: a.validUntil,
            isActive: a.isActive,
            isRead: newIsRead,
            readAt: newIsRead ? DateTime.now() : null,
            sentAt: a.sentAt,
            deliveryLogs: a.deliveryLogs,
            createdAt: a.createdAt,
            updatedAt: DateTime.now().toIso8601String(),
            woreda: a.woreda,
          );
        }
        return a;
      }).toList();
      state = AsyncValue.data(updated);
    });

    try {
      await _repository.markAsRead(alertId);
    } catch (_) {}
  }

  Future<void> fetchAlerts() async {`
  );
  fs.writeFileSync(alertProviderPath, alertProvider, 'utf8');
  console.log('✅ Updated alert_provider.dart with toggleReadStatus');
}

// 4. Update alert_card.dart with Read/Unread badge and toggle action
const alertCardPath = 'C:/Users/a/Desktop/agrietech-frontend/lib/features/alerts/widgets/alert_card.dart';
let alertCard = fs.readFileSync(alertCardPath, 'utf8');

if (!alertCard.includes('onToggleRead')) {
  alertCard = alertCard.replace(
    /final VoidCallback\? onTap;\s*const AlertCard\(\{/m,
    `final VoidCallback? onTap;
  final VoidCallback? onToggleRead;

  const AlertCard({`
  );
  alertCard = alertCard.replace(
    /this\.onTap,\s*\}\);/m,
    `this.onTap,
    this.onToggleRead,
  });`
  );

  // Add Read/Unread toggle chip in footer row
  alertCard = alertCard.replace(
    /\/\/ Time\s*Text\(\s*DateFormatter\.formatRelativeTime\(alert\.sentDate\),/,
    `// Time
                    Text(
                      DateFormatter.formatRelativeTime(alert.sentDate),`
  );

  alertCard = alertCard.replace(
    /const Icon\(\s*Icons\.arrow_forward_ios,\s*size: 16,\s*color: Colors\.grey,\s*\),/,
    `Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (onToggleRead != null)
                          TextButton.icon(
                            onPressed: onToggleRead,
                            icon: Icon(
                              alert.isRead ? Icons.mark_email_read_outlined : Icons.mark_email_unread_rounded,
                              size: 16,
                              color: alert.isRead ? Colors.grey.shade600 : const Color(0xFF2E7D32),
                            ),
                            label: Text(
                              alert.isRead ? 'Read' : 'Mark Read',
                              style: TextStyle(
                                fontSize: 12,
                                color: alert.isRead ? Colors.grey.shade600 : const Color(0xFF2E7D32),
                                fontWeight: alert.isRead ? FontWeight.normal : FontWeight.bold,
                              ),
                            ),
                            style: TextButton.styleFrom(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              minimumSize: Size.zero,
                              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                            ),
                          ),
                        const SizedBox(width: 4),
                        const Icon(
                          Icons.arrow_forward_ios,
                          size: 14,
                          color: Colors.grey,
                        ),
                      ],
                    ),`
  );

  fs.writeFileSync(alertCardPath, alertCard, 'utf8');
  console.log('✅ Updated alert_card.dart with Read/Unread toggle');
}

// 5. Update alerts_list_screen.dart to pass onToggleRead
const alertsListScreenPath = 'C:/Users/a/Desktop/agrietech-frontend/lib/features/alerts/screens/alerts_list_screen.dart';
let alertsListScreen = fs.readFileSync(alertsListScreenPath, 'utf8');

alertsListScreen = alertsListScreen.replace(
  /return AlertCard\(\s*alert: alert,\s*onTap: \(\) => _showAlertDetails\(context, alert\),\s*\);/g,
  `return AlertCard(
                      alert: alert,
                      onTap: () => _showAlertDetails(context, alert),
                      onToggleRead: () => ref.read(alertListProvider.notifier).toggleReadStatus(alert.id),
                    );`
);

fs.writeFileSync(alertsListScreenPath, alertsListScreen, 'utf8');
console.log('✅ Updated alerts_list_screen.dart');
