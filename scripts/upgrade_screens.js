const fs = require('fs');
const path = require('path');

const FRONTEND = 'C:/Users/a/Desktop/agrietech-frontend/lib';

function write(rel, content) {
  const full = path.join(FRONTEND, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf8');
  console.log('[UPGRADE SCREEN] ' + rel);
}

// 1. Alerts Inbox Screen
write('features/alerts/presentation/screens/alerts_inbox_screen.dart', `import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../../data/models/alert_model.dart';
import '../providers/alerts_provider.dart';

class AlertsInboxScreen extends ConsumerStatefulWidget {
  const AlertsInboxScreen({super.key});

  @override
  ConsumerState<AlertsInboxScreen> createState() => _AlertsInboxScreenState();
}

class _AlertsInboxScreenState extends ConsumerState<AlertsInboxScreen> {
  String? _selectedSeverity;

  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(alertsProvider.notifier).loadAlerts());
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(alertsProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FBF8),
      appBar: AppBar(
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Early Warning Alerts', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
            Text('የቅድመ ማስጠንቀቂያ መልእክቶች', style: TextStyle(fontSize: 12, color: Colors.grey)),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.read(alertsProvider.notifier).loadAlerts(severity: _selectedSeverity),
          ),
        ],
      ),
      body: Column(
        children: [
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                _buildFilterChip('ALL', 'ሁሉም', null),
                const SizedBox(width: 8),
                _buildFilterChip('CRITICAL', 'ከፍተኛ አደጋ', 'CRITICAL'),
                const SizedBox(width: 8),
                _buildFilterChip('HIGH', 'ከፍተኛ', 'HIGH'),
                const SizedBox(width: 8),
                _buildFilterChip('MEDIUM', 'መካከለኛ', 'MEDIUM'),
                const SizedBox(width: 8),
                _buildFilterChip('LOW', 'ዝቅተኛ', 'LOW'),
              ],
            ),
          ),
          Expanded(
            child: state.isLoading
                ? const Center(child: CircularProgressIndicator())
                : state.alerts.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.check_circle_outline, size: 64, color: AppTheme.primaryColor.withOpacity(0.5)),
                            const SizedBox(height: 16),
                            const Text('No active hazard alerts in your area', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                            const Text('በአካባቢዎ ምንም አይነት ንቁ ማስጠንቀቂያ የለም', style: TextStyle(color: Colors.grey)),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: () => ref.read(alertsProvider.notifier).loadAlerts(severity: _selectedSeverity),
                        child: ListView.separated(
                          padding: const EdgeInsets.all(16),
                          itemCount: state.alerts.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 12),
                          itemBuilder: (context, index) {
                            final alert = state.alerts[index];
                            final severityColor = AppTheme.getRiskColor(alert.severity);

                            return Card(
                              elevation: 2,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16),
                                side: BorderSide(color: severityColor.withOpacity(0.3), width: 1.5),
                              ),
                              child: Padding(
                                padding: const EdgeInsets.all(16),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                          decoration: BoxDecoration(
                                            color: severityColor.withOpacity(0.15),
                                            borderRadius: BorderRadius.circular(8),
                                          ),
                                          child: Row(
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
                                              Icon(Icons.warning_amber_rounded, size: 16, color: severityColor),
                                              const SizedBox(width: 4),
                                              Text(alert.severity, style: TextStyle(color: severityColor, fontWeight: FontWeight.bold, fontSize: 12)),
                                            ],
                                          ),
                                        ),
                                        const Spacer(),
                                        Text(alert.hazardType, style: const TextStyle(fontWeight: FontWeight.w600, color: Colors.blueGrey, fontSize: 12)),
                                      ],
                                    ),
                                    const SizedBox(height: 10),
                                    Text(alert.titleEn, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                                    if (alert.titleAm.isNotEmpty) ...[
                                      const SizedBox(height: 2),
                                      Text(alert.titleAm, style: const TextStyle(color: Color(0xFF2E7D32), fontSize: 14)),
                                    ],
                                    const SizedBox(height: 8),
                                    Text(alert.messageEn, style: TextStyle(color: Colors.grey.shade800, fontSize: 13, height: 1.3)),
                                    if (alert.messageAm.isNotEmpty) ...[
                                      const SizedBox(height: 4),
                                      Text(alert.messageAm, style: TextStyle(color: Colors.grey.shade700, fontSize: 13, height: 1.3)),
                                    ],
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String labelEn, String labelAm, String? value) {
    final isSelected = _selectedSeverity == value;
    return ChoiceChip(
      label: Text('$labelEn ($labelAm)', style: TextStyle(color: isSelected ? Colors.white : Colors.black89, fontSize: 12, fontWeight: isSelected ? FontWeight.bold : FontWeight.normal)),
      selected: isSelected,
      selectedColor: AppTheme.primaryColor,
      onSelected: (_) {
        setState(() => _selectedSeverity = value);
        ref.read(alertsProvider.notifier).loadAlerts(severity: value);
      },
    );
  }
}
`);

// 2. Drought Risk Screen
write('features/drought/presentation/screens/drought_risk_screen.dart', `import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../../data/repositories/drought_repository.dart';

class DroughtRiskScreen extends ConsumerWidget {
  const DroughtRiskScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final droughtAsync = ref.watch(droughtRiskProvider('woreda_adama_01'));

    return Scaffold(
      backgroundColor: const Color(0xFFF8FBF8),
      appBar: AppBar(
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Drought & SPI Index', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
            Text('የድርቅና የዝናብ እጥረት ክትትል', style: TextStyle(fontSize: 12, color: Colors.grey)),
          ],
        ),
      ),
      body: droughtAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(child: Text('Error: ' + err.toString())),
        data: (drought) {
          final riskColor = AppTheme.getRiskColor(drought.riskLevel);
          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [riskColor.withOpacity(0.85), riskColor],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(color: riskColor.withOpacity(0.3), blurRadius: 10, offset: const Offset(0, 4)),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.wb_sunny_rounded, color: Colors.white, size: 28),
                          const SizedBox(width: 8),
                          Text('Drought Risk: ' + drought.riskLevel, style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text('Classification: ' + drought.droughtClass, style: const TextStyle(color: Colors.white, fontSize: 14)),
                      const SizedBox(height: 4),
                      Text('Standardized Precipitation Index (SPI): ' + drought.spiValue.toStringAsFixed(2), style: const TextStyle(color: Colors.white70, fontSize: 13)),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                const Text('Agronomic Indicators', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: _buildMetricCard(
                        'SPI-30 Value',
                        drought.spiValue.toStringAsFixed(2),
                        drought.spiValue < -1.0 ? 'Dry Spell' : 'Normal',
                        Icons.water_drop_outlined,
                        Colors.blue,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildMetricCard(
                        'NDVI Anomaly',
                        (drought.ndviAnomaly * 100).toStringAsFixed(1) + '%',
                        drought.ndviAnomaly < 0 ? 'Stress' : 'Vigorous',
                        Icons.grass,
                        Colors.green,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                Card(
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  child: const Padding(
                    padding: EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Actionable Farmer Recommendations', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                        SizedBox(height: 8),
                        Text('• Apply surface mulching to conserve root-zone soil moisture.'),
                        SizedBox(height: 4),
                        Text('• Schedule night irrigation to minimize midday evapotranspiration.'),
                        SizedBox(height: 4),
                        Text('• የደረቀ ገለባ በማጎዝጎዝ የአፈር እርጥበትን ይጠብቁ፤ መስኖን ማታ ወይም ማለዳ ላይ ያጠጡ።', style: TextStyle(color: Color(0xFF2E7D32))),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildMetricCard(String title, String value, String sub, IconData icon, Color color) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: color, size: 24),
            const SizedBox(height: 12),
            Text(value, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            Text(title, style: const TextStyle(fontSize: 12, color: Colors.grey)),
            Text(sub, style: TextStyle(fontSize: 11, color: color, fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }
}
`);

// 3. Flood Risk Screen
write('features/flood/presentation/screens/flood_risk_screen.dart', `import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../../data/repositories/flood_repository.dart';

class FloodRiskScreen extends ConsumerWidget {
  const FloodRiskScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final floodAsync = ref.watch(floodRiskProvider('woreda_adama_01'));

    return Scaffold(
      backgroundColor: const Color(0xFFF8FBF8),
      appBar: AppBar(
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Flood Hazard Monitoring', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
            Text('የጎርፍ አደጋ ቅድመ-ማስጠንቀቂያ', style: TextStyle(fontSize: 12, color: Colors.grey)),
          ],
        ),
      ),
      body: floodAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(child: Text('Error: ' + err.toString())),
        data: (flood) {
          final riskColor = AppTheme.getRiskColor(flood.riskLevel);
          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [riskColor.withOpacity(0.85), riskColor],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.flood_outlined, color: Colors.white, size: 28),
                          const SizedBox(width: 8),
                          Text('Flood Status: ' + flood.riskLevel, style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text('River Basin Discharge: ' + flood.glofasDischargeM3s.toStringAsFixed(1) + ' m³/s', style: const TextStyle(color: Colors.white, fontSize: 14)),
                      Text('Estimated Inundation Risk: ' + (flood.inundationRiskScore * 100).toStringAsFixed(0) + '%', style: const TextStyle(color: Colors.white70, fontSize: 13)),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                const Text('Catchment Readings', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: Card(
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Icon(Icons.water, color: Colors.blue, size: 24),
                              const SizedBox(height: 8),
                              Text(flood.glofasDischargeM3s.toStringAsFixed(1) + ' m³/s', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                              const Text('Discharge Rate', style: TextStyle(fontSize: 12, color: Colors.grey)),
                            ],
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Card(
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Icon(Icons.speed, color: Colors.teal, size: 24),
                              const SizedBox(height: 8),
                              Text((flood.inundationRiskScore * 100).toStringAsFixed(0) + '%', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                              const Text('Inundation Risk', style: TextStyle(fontSize: 12, color: Colors.grey)),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
`);

// 4. Locust Pest Screen
write('features/locust_pest/presentation/screens/locust_alerts_screen.dart', `import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../../data/repositories/locust_repository.dart';

class LocustAlertsScreen extends ConsumerWidget {
  const LocustAlertsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final locustAsync = ref.watch(locustAlertProvider('woreda_adama_01'));

    return Scaffold(
      backgroundColor: const Color(0xFFF8FBF8),
      appBar: AppBar(
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Desert Locust Surveillance', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
            Text('የበረሃ አንበጣ ክትትልና ቅኝት', style: TextStyle(fontSize: 12, color: Colors.grey)),
          ],
        ),
      ),
      body: locustAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(child: Text('Error: ' + err.toString())),
        data: (locust) {
          final riskColor = locust.presenceDetected ? AppTheme.criticalRiskColor : AppTheme.lowRiskColor;
          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [riskColor.withOpacity(0.85), riskColor],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.bug_report, color: Colors.white, size: 28),
                          const SizedBox(width: 8),
                          Text(locust.presenceDetected ? 'SWARM DETECTED' : 'NO ACTIVE SWARM', style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text('Swarm Density: ' + locust.swarmDensity, style: const TextStyle(color: Colors.white, fontSize: 14)),
                      Text('Breeding Probability: ' + (locust.breedingProbability * 100).toStringAsFixed(0) + '%', style: const TextStyle(color: Colors.white70, fontSize: 13)),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                Card(
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  child: const Padding(
                    padding: EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('FAO Locust Hub Field Protocol', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                        SizedBox(height: 8),
                        Text('• Immediately report hopper bands to the Woreda Agriculture Office.'),
                        SizedBox(height: 4),
                        Text('• Maintain early morning surveillance in green vegetation corridors.'),
                        SizedBox(height: 4),
                        Text('• የአንበጣ መንጋ ከተመለከቱ ወዲያውኑ ለወረዳው ግብርና ጽሕፈት ቤት ሪፖርት ያድርጉ።', style: TextStyle(color: Color(0xFF2E7D32))),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
`);

// 5. Soil Profile Screen
write('features/soil/presentation/screens/soil_profile_screen.dart', `import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../../data/repositories/soil_repository.dart';

class SoilProfileScreen extends ConsumerWidget {
  const SoilProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final soilAsync = ref.watch(soilProfileProvider('farm_01'));

    return Scaffold(
      backgroundColor: const Color(0xFFF8FBF8),
      appBar: AppBar(
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Soil & Telemetry Profile', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
            Text('የአፈር እርጥበትና ንጥረ-ነገር ሁኔታ', style: TextStyle(fontSize: 12, color: Colors.grey)),
          ],
        ),
      ),
      body: soilAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(child: Text('Error: ' + err.toString())),
        data: (soil) {
          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF5D4037), Color(0xFF8D6E63)],
                    ),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.terrain, color: Colors.white, size: 28),
                          SizedBox(width: 8),
                          Text('Soil Moisture Status', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(soil.moisturePercent.toStringAsFixed(1) + '% Volumetric Water Content', style: const TextStyle(color: Colors.white, fontSize: 15)),
                      Text('Soil Temperature: ' + soil.temperatureC.toStringAsFixed(1) + '°C | pH: ' + soil.ph.toStringAsFixed(1), style: const TextStyle(color: Colors.white70, fontSize: 13)),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                const Text('Nutrient & Texture Metrics', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: Card(
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Icon(Icons.eco, color: Colors.green, size: 24),
                              const SizedBox(height: 8),
                              Text(soil.organicCarbonPercent.toStringAsFixed(1) + '%', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                              const Text('Organic Carbon', style: TextStyle(fontSize: 12, color: Colors.grey)),
                            ],
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Card(
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Icon(Icons.grain, color: Colors.brown, size: 24),
                              const SizedBox(height: 8),
                              Text(soil.ph.toStringAsFixed(1), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                              const Text('Soil pH Level', style: TextStyle(fontSize: 12, color: Colors.grey)),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
`);

// 6. Vegetation Health Screen (NDVI)
write('features/vegetation/presentation/screens/vegetation_health_screen.dart', `import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../../data/repositories/vegetation_repository.dart';

class VegetationHealthScreen extends ConsumerWidget {
  const VegetationHealthScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final vegAsync = ref.watch(vegetationProvider('woreda_adama_01'));

    return Scaffold(
      backgroundColor: const Color(0xFFF8FBF8),
      appBar: AppBar(
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('NDVI Vegetation Health', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
            Text('የሰብልና እፅዋት ጤንነት (ሳተላይት)', style: TextStyle(fontSize: 12, color: Colors.grey)),
          ],
        ),
      ),
      body: vegAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(child: Text('Error: ' + err.toString())),
        data: (veg) {
          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF2E7D32), Color(0xFF4CAF50)],
                    ),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.satellite_alt, color: Colors.white, size: 28),
                          SizedBox(width: 8),
                          Text('Sentinel-2 / MODIS NDVI', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text('NDVI Index: ' + veg.ndviValue.toStringAsFixed(2) + ' (' + veg.vigorClass + ')', style: const TextStyle(color: Colors.white, fontSize: 15)),
                      Text('Vegetation Condition Index (VCI): ' + veg.vciValue.toStringAsFixed(1) + '%', style: const TextStyle(color: Colors.white70, fontSize: 13)),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                Card(
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Canopy Vigor Classification', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                        const SizedBox(height: 8),
                        LinearProgressIndicator(
                          value: veg.ndviValue.clamp(0.0, 1.0),
                          backgroundColor: Colors.grey.shade200,
                          color: AppTheme.primaryColor,
                          minHeight: 10,
                          borderRadius: BorderRadius.circular(5),
                        ),
                        const SizedBox(height: 8),
                        Text('Current Vigor: ' + veg.vigorClass, style: const TextStyle(fontWeight: FontWeight.w600, color: Color(0xFF2E7D32))),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
`);

// 7. Weather Screen
write('features/weather/presentation/screens/weather_screen.dart', `import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../../data/repositories/weather_repository.dart';

class WeatherScreen extends ConsumerWidget {
  const WeatherScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final weatherAsync = ref.watch(weatherProvider('woreda_adama_01'));

    return Scaffold(
      backgroundColor: const Color(0xFFF8FBF8),
      appBar: AppBar(
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Weather & Agro-Climatology', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
            Text('የአየር ሁኔታና ዝናብ መረጃ', style: TextStyle(fontSize: 12, color: Colors.grey)),
          ],
        ),
      ),
      body: weatherAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(child: Text('Error: ' + err.toString())),
        data: (forecasts) {
          if (forecasts.isEmpty) {
            return const Center(child: Text('No forecast available.'));
          }
          final current = forecasts.first;
          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF0288D1), Color(0xFF26C6DA)],
                    ),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(current.temperatureC.toStringAsFixed(1) + '°C', style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold)),
                              Text(current.condition, style: const TextStyle(color: Colors.white, fontSize: 16)),
                            ],
                          ),
                          const Icon(Icons.cloud_queue, color: Colors.white, size: 48),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text('Precipitation: ' + current.rainfallMm.toStringAsFixed(1) + ' mm | Humidity: ' + current.humidityPercent.toStringAsFixed(0) + '%', style: const TextStyle(color: Colors.white70, fontSize: 13)),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                const Text('7-Day Agricultural Forecast', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                const SizedBox(height: 12),
                ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: forecasts.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (context, idx) {
                    final f = forecasts[idx];
                    return Card(
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      child: ListTile(
                        leading: const Icon(Icons.wb_sunny_outlined, color: Colors.orange),
                        title: Text(f.date, style: const TextStyle(fontWeight: FontWeight.w600)),
                        subtitle: Text(f.condition),
                        trailing: Text(f.temperatureC.toStringAsFixed(0) + '°C / ' + f.rainfallMm.toStringAsFixed(1) + 'mm', style: const TextStyle(fontWeight: FontWeight.bold)),
                      ),
                    );
                  },
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
`);

console.log('');
console.log('All screens upgraded to expert, international-standard UI components.');
