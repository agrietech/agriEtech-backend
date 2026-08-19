/**
 * Fix remaining warnings in frontend:
 * 1. Replace old '/disease-diagnosis' string references with ApiEndpoints.diagnose
 * 2. Implement login_screen.dart
 * 3. Fix analytics_repository missing fetchAiInsights
 */
const fs = require('fs');
const path = require('path');
const FRONTEND = 'C:/Users/a/Desktop/agrietech-frontend/lib';

function r(rel) { return path.join(FRONTEND, rel); }
function read(rel) { try { return fs.readFileSync(r(rel), 'utf8'); } catch (_) { return null; } }
function write(rel, content) { fs.writeFileSync(r(rel), content, 'utf8'); console.log('[FIX] ' + rel); }
function patch(rel, from, to) {
  const content = read(rel);
  if (!content) { console.log('[SKIP] ' + rel + ' not found'); return; }
  if (!content.includes(from)) { console.log('[NOCHANGE] ' + rel + ' - pattern not found'); return; }
  write(rel, content.split(from).join(to));
}

// ── 1. Fix diagnosis_repository.dart old endpoint string ─────────────────────
patch(
  'features/diagnosis/repositories/diagnosis_repository.dart',
  "'/disease-diagnosis/diagnose'",
  "ApiEndpoints.diagnose"
);
// Also add import if needed
const diagRepoContent = read('features/diagnosis/repositories/diagnosis_repository.dart');
if (diagRepoContent && !diagRepoContent.includes('api_endpoints') && !diagRepoContent.includes('api_constants')) {
  const lines = diagRepoContent.split('\n');
  const importIdx = lines.findIndex(l => l.startsWith('import'));
  if (importIdx >= 0) {
    lines.splice(importIdx + 1, 0, "import '../../../core/constants/api_endpoints.dart';");
    write('features/diagnosis/repositories/diagnosis_repository.dart', lines.join('\n'));
  }
}

// ── 2. Fix dashboard_screen.dart old /disease-diagnosis string ─────────────────
const dashboardContent = read('features/dashboard/screens/dashboard_screen.dart');
if (dashboardContent && dashboardContent.includes("'/disease-diagnosis'")) {
  write('features/dashboard/screens/dashboard_screen.dart',
    dashboardContent.split("'/disease-diagnosis'").join("ApiEndpoints.diseaseDiagnosis")
  );
} else {
  console.log('[NOCHANGE] dashboard_screen.dart - pattern not found (may use const)');
}

// ── 3. Fix api_constants.dart old '/disease-diagnosis' ref ──────────────────────
// The warning was about a string literal match - api_constants.dart has the const defined correctly
// The warning is a false positive from the audit - the file defines the route correctly
// Just ensure the constant name is `diagnose` not `diseaseDiagnosis`
console.log('[SKIP] api_constants.dart - warning is false positive from route definition itself');
console.log('[SKIP] api_endpoints.dart - warning is false positive from route definition itself');

// ── 4. Fix analytics_repository.dart missing fetchAiInsights method ────────────
const analyticsRepo = read('core/repositories/analytics_repository.dart');
if (analyticsRepo && !analyticsRepo.includes('fetchAiInsights')) {
  // Add before the last closing brace of the class
  const insertBefore = '\n/// Provider for AnalyticsRepository';
  const aiMethod = `
  /// Fetch Gemini 2.5 Flash AI graph insights for a woreda
  Future<Map<String, dynamic>> fetchAiInsights({
    required String woredaId,
    String timeframe = 'MONTHLY',
    String language = 'am',
  }) async {
    try {
      final response = await _dioClient.post(
        ApiConstants.analyticsAiInsights,
        data: {'woredaId': woredaId, 'timeframe': timeframe, 'language': language},
      );
      final rawData = response.data is Map && response.data['data'] != null
          ? response.data['data'] as Map<String, dynamic>
          : response.data as Map<String, dynamic>;
      return rawData;
    } on DioException catch (e) {
      AppLogger.error('AI insights fetch failed', e);
      throw NetworkError.fromDioException(e);
    } catch (e, stack) {
      AppLogger.error('Unexpected AI insights error', e, stack);
      throw UnknownError(message: 'Failed to fetch AI insights: \${e.toString()}');
    }
  }

`;
  if (analyticsRepo.includes(insertBefore)) {
    write('core/repositories/analytics_repository.dart',
      analyticsRepo.split(insertBefore).join(aiMethod + insertBefore)
    );
  } else {
    // Find last method closing brace before provider
    const lines = analyticsRepo.split('\n');
    const providerIdx = lines.findLastIndex ? lines.findLastIndex(l => l.includes('Provider<')) :
      lines.reduce((acc, l, i) => l.includes('Provider<') ? i : acc, -1);
    if (providerIdx > 0) {
      lines.splice(providerIdx, 0, aiMethod);
      write('core/repositories/analytics_repository.dart', lines.join('\n'));
    }
  }
}

// ── 5. Implement login_screen.dart ────────────────────────────────────────────
write('features/auth/presentation/screens/login_screen.dart', `/// AgriEtech Login Screen — email or phone authentication
library login_screen;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/auth_provider.dart';
import '../../../../core/utils/validators.dart';
import '../../../auth/screens/forgot_password_dialog.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _identifierCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _obscure = true;
  bool _isEmail = true; // toggle between email / phone

  @override
  void dispose() {
    _identifierCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final success = await ref.read(authProvider.notifier).login(
      identifier: _identifierCtrl.text.trim(),
      password: _passwordCtrl.text,
    );
    if (success && mounted) {
      context.go('/dashboard');
    } else if (mounted) {
      final error = ref.read(authProvider).error;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error ?? 'Login failed'), backgroundColor: Colors.red),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(authProvider);
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 24),
            child: Form(
              key: _formKey,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Logo / Brand
                  Icon(Icons.eco, size: 72, color: theme.primaryColor),
                  const SizedBox(height: 8),
                  Text(
                    'AgriEtech',
                    textAlign: TextAlign.center,
                    style: theme.textTheme.headlineMedium?.copyWith(
                      fontWeight: FontWeight.bold, color: theme.primaryColor,
                    ),
                  ),
                  Text(
                    'Early Warning System',
                    textAlign: TextAlign.center,
                    style: theme.textTheme.bodySmall?.copyWith(color: Colors.grey),
                  ),
                  const SizedBox(height: 36),

                  // Email / Phone toggle
                  ToggleButtons(
                    isSelected: [_isEmail, !_isEmail],
                    onPressed: (i) => setState(() {
                      _isEmail = i == 0;
                      _identifierCtrl.clear();
                    }),
                    borderRadius: BorderRadius.circular(8),
                    selectedColor: Colors.white,
                    fillColor: theme.primaryColor,
                    children: const [
                      Padding(padding: EdgeInsets.symmetric(horizontal: 20), child: Text('Email')),
                      Padding(padding: EdgeInsets.symmetric(horizontal: 20), child: Text('Phone')),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Identifier field
                  TextFormField(
                    controller: _identifierCtrl,
                    keyboardType: _isEmail ? TextInputType.emailAddress : TextInputType.phone,
                    decoration: InputDecoration(
                      labelText: _isEmail ? 'Email address' : 'Phone number (+251...)',
                      prefixIcon: Icon(_isEmail ? Icons.email_outlined : Icons.phone_outlined),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    validator: (v) {
                      if (v == null || v.isEmpty) return 'Required';
                      if (_isEmail && !v.contains('@')) return 'Enter a valid email';
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),

                  // Password field
                  TextFormField(
                    controller: _passwordCtrl,
                    obscureText: _obscure,
                    decoration: InputDecoration(
                      labelText: 'Password',
                      prefixIcon: const Icon(Icons.lock_outlined),
                      suffixIcon: IconButton(
                        icon: Icon(_obscure ? Icons.visibility_off : Icons.visibility),
                        onPressed: () => setState(() => _obscure = !_obscure),
                      ),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    validator: (v) => (v == null || v.length < 6) ? 'Min 6 characters' : null,
                  ),
                  const SizedBox(height: 8),

                  // Forgot password
                  Align(
                    alignment: Alignment.centerRight,
                    child: TextButton(
                      onPressed: () => ForgotPasswordDialog.show(context),
                      child: const Text('Forgot password?'),
                    ),
                  ),
                  const SizedBox(height: 8),

                  // Login button
                  SizedBox(
                    height: 52,
                    child: ElevatedButton(
                      onPressed: state.isLoading ? null : _submit,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: theme.primaryColor,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: state.isLoading
                          ? const CircularProgressIndicator(color: Colors.white)
                          : const Text('Sign In', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Register link
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text("Don't have an account?"),
                      TextButton(
                        onPressed: () => context.push('/register'),
                        child: const Text('Register'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
`);

console.log('\n════════════════════════════════════════════════════');
console.log('  Remaining fixes applied!');
console.log('════════════════════════════════════════════════════');
