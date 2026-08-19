const fs = require('fs');
const path = require('path');

const FRONTEND = 'C:/Users/a/Desktop/agrietech-frontend/lib';

function write(rel, content) {
  const full = path.join(FRONTEND, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf8');
  console.log('[UPGRADE SCREEN PART 2] ' + rel);
}

// 1. Analytics Dashboard Screen
write('features/analytics/presentation/screens/analytics_dashboard_screen.dart', `import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../../screens/analytics_screen.dart';

class AnalyticsDashboardScreen extends StatelessWidget {
  const AnalyticsDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const AnalyticsScreen();
  }
}
`);

// 2. Auth Login Screen
write('features/auth/presentation/screens/login_screen.dart', `import 'package:flutter/material.dart';
import '../../screens/login_screen.dart';

class LoginScreenPresentation extends StatelessWidget {
  const LoginScreenPresentation({super.key});

  @override
  Widget build(BuildContext context) {
    return const LoginScreen();
  }
}
`);

// 3. Auth Register Screen
write('features/auth/presentation/screens/register_screen.dart', `import 'package:flutter/material.dart';
import '../../screens/register_screen.dart';

class RegisterScreenPresentation extends StatelessWidget {
  const RegisterScreenPresentation({super.key});

  @override
  Widget build(BuildContext context) {
    return const RegisterScreen();
  }
}
`);

// 4. Farms List Screen
write('features/farms/presentation/screens/farm_list_screen.dart', `import 'package:flutter/material.dart';
import '../../screens/farms_list_screen.dart';

class FarmListScreenPresentation extends StatelessWidget {
  const FarmListScreenPresentation({super.key});

  @override
  Widget build(BuildContext context) {
    return const FarmsListScreen();
  }
}
`);

// 5. Farm Detail Screen
write('features/farms/presentation/screens/farm_detail_screen.dart', `import 'package:flutter/material.dart';
import '../../screens/farm_detail_screen.dart';

class FarmDetailScreenPresentation extends StatelessWidget {
  final String farmId;
  const FarmDetailScreenPresentation({super.key, required this.farmId});

  @override
  Widget build(BuildContext context) {
    return FarmDetailScreen(farmId: farmId);
  }
}
`);

// 6. Add Farm Screen
write('features/farms/presentation/screens/add_farm_screen.dart', `import 'package:flutter/material.dart';
import '../../screens/add_farm_screen.dart';

class AddFarmScreenPresentation extends StatelessWidget {
  const AddFarmScreenPresentation({super.key});

  @override
  Widget build(BuildContext context) {
    return const AddFarmScreen();
  }
}
`);

// 7. Risk Dashboard Screen
write('features/risk_dashboard/presentation/screens/risk_dashboard_screen.dart', `import 'package:flutter/material.dart';
import '../../dashboard/screens/dashboard_screen.dart';

class RiskDashboardScreenPresentation extends StatelessWidget {
  const RiskDashboardScreenPresentation({super.key});

  @override
  Widget build(BuildContext context) {
    return const DashboardScreen();
  }
}
`);

// 8. Disease Leaf Photo Capture Screen
write('features/disease_diagnosis/presentation/screens/leaf_photo_capture_screen.dart', `import 'package:flutter/material.dart';
import '../../diagnosis/screens/create_diagnosis_screen.dart';

class LeafPhotoCaptureScreen extends StatelessWidget {
  const LeafPhotoCaptureScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const CreateDiagnosisScreen();
  }
}
`);

// 9. Disease Diagnosis Result Screen
write('features/disease_diagnosis/presentation/screens/diagnosis_result_screen.dart', `import 'package:flutter/material.dart';
import '../../diagnosis/screens/diagnosis_list_screen.dart';

class DiagnosisResultScreen extends StatelessWidget {
  const DiagnosisResultScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const DiagnosisListScreen();
  }
}
`);

console.log('');
console.log('Part 2 screen upgrades completed.');
