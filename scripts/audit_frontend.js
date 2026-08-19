/**
 * AgriEtech Frontend Bug Audit Script
 * Scans all Dart files for:
 *  - Stub/TODO-only files
 *  - Broken package imports
 *  - Missing feature implementations
 *  - Endpoint mismatches vs backend
 *  - Missing AI voice / email auth integration
 */
const fs = require('fs');
const path = require('path');

const FRONTEND = 'C:/Users/a/Desktop/agrietech-frontend/lib';
const PUBSPEC = 'C:/Users/a/Desktop/agrietech-frontend/pubspec.yaml';
const issues = [];
const info = [];

function readF(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch (_) { return ''; }
}

function walk(dir) {
  let res = [];
  try {
    for (const f of fs.readdirSync(dir)) {
      const p = path.join(dir, f);
      try {
        const stat = fs.statSync(p);
        const skip = ['build', '.dart_tool', '.git', 'android', 'ios', 'web', 'linux', 'macos', 'windows'];
        if (stat.isDirectory() && !skip.includes(f)) res = res.concat(walk(p));
        else if (f.endsWith('.dart')) res.push(p);
      } catch (_) {}
    }
  } catch (_) {}
  return res;
}

function flag(file, severity, msg) {
  issues.push({ file: file.replace(FRONTEND + '/', '').replace(FRONTEND + '\\', ''), severity, msg });
}

const allDartFiles = walk(FRONTEND);
const pubspec = readF(PUBSPEC);

// ── 1. Detect stub/TODO-only files ────────────────────────────────────────────
const stubPatterns = [
  'TODO: Implement',
  'TODO: Define',
  'Pending Team Assignment',
  '// TODO',
];
allDartFiles.forEach(fp => {
  const content = readF(fp);
  const lines = content.split('\n').filter(l => l.trim().length > 0);
  const isStub = stubPatterns.some(pat => content.includes(pat)) && lines.length < 15;
  if (isStub) flag(fp, 'ERROR', 'Stub file — not implemented');
});

// ── 2. Check specific critical files exist ─────────────────────────────────────
const criticalFiles = [
  'features/ai_voice/data/repositories/ai_voice_repository.dart',
  'features/ai_voice/presentation/providers/ai_voice_provider.dart',
  'features/auth/presentation/providers/auth_provider.dart',
  'features/auth/screens/forgot_password_dialog.dart',
  'core/constants/api_endpoints.dart',
  'core/constants/api_constants.dart',
  'core/repositories/auth_repository.dart',
  'core/repositories/analytics_repository.dart',
  'features/disease_diagnosis/data/repositories/disease_repository.dart',
  'features/disease_diagnosis/presentation/providers/disease_provider.dart',
];
criticalFiles.forEach(rel => {
  const full = path.join(FRONTEND, rel);
  if (!fs.existsSync(full)) flag(rel, 'ERROR', 'MISSING critical file');
  else info.push('OK: ' + rel);
});

// ── 3. Check API endpoints file has all required routes ───────────────────────
const endpointsFile = readF(path.join(FRONTEND, 'core/constants/api_endpoints.dart'));
const requiredEndpoints = [
  ['forgotPassword', 'Auth: forgot password'],
  ['resetPassword', 'Auth: reset password'],
  ['verifyEmail', 'Auth: verify email'],
  ['diagnose', 'Disease: diagnose route'],
  ['analyticsAiInsights', 'Analytics: AI insights'],
  ['aiVoiceInquiry', 'AI Voice: voice inquiry'],
  ['aiTextInquiry', 'AI Voice: text inquiry'],
  ['farmDiagnoses', 'Disease: farm diagnoses history'],
];
requiredEndpoints.forEach(([key, label]) => {
  if (!endpointsFile.includes(key)) flag('api_endpoints.dart', 'ERROR', 'Missing endpoint: ' + label + ' (' + key + ')');
});

// ── 4. Check auth_repository.dart has email login + password reset ─────────────
const authRepo = readF(path.join(FRONTEND, 'core/repositories/auth_repository.dart'));
const authChecks = [
  ['requestPasswordReset', 'requestPasswordReset method'],
  ['resetPassword', 'resetPassword method'],
  ['forgotPassword', 'forgotPassword endpoint constant usage'],
  ['email', 'email field in login'],
];
authChecks.forEach(([key, label]) => {
  if (!authRepo.includes(key)) flag('auth_repository.dart', 'WARN', 'Missing: ' + label);
});

// ── 5. Check disease repository uses correct POST endpoint ─────────────────────
const diseaseRepo = readF(path.join(FRONTEND, 'features/disease_diagnosis/data/repositories/disease_repository.dart'));
if (!diseaseRepo.includes('diagnose') && !diseaseRepo.includes('/disease-diagnosis/diagnose')) {
  flag('disease_repository.dart', 'ERROR', 'Not pointing to /diagnose endpoint');
}
if (!diseaseRepo.includes('imageBase64') && !diseaseRepo.includes('image')) {
  flag('disease_repository.dart', 'ERROR', 'Missing image field in POST body');
}
if (!diseaseRepo.includes('cropHint') && !diseaseRepo.includes('cropType')) {
  flag('disease_repository.dart', 'ERROR', 'Missing crop type/hint in POST body');
}

// ── 6. Check AI voice repository exists and has correct methods ────────────────
const voiceRepo = readF(path.join(FRONTEND, 'features/ai_voice/data/repositories/ai_voice_repository.dart'));
if (!voiceRepo) {
  flag('ai_voice_repository.dart', 'ERROR', 'File missing');
} else {
  if (!voiceRepo.includes('askTextQuestion')) flag('ai_voice_repository.dart', 'WARN', 'Missing askTextQuestion method');
  if (!voiceRepo.includes('submitVoiceAudio')) flag('ai_voice_repository.dart', 'WARN', 'Missing submitVoiceAudio method');
  if (!voiceRepo.includes('MultipartFile')) flag('ai_voice_repository.dart', 'WARN', 'Missing MultipartFile for audio upload');
  if (!voiceRepo.includes('responseEn') && !voiceRepo.includes('responseAm')) {
    flag('ai_voice_repository.dart', 'WARN', 'Missing bilingual response fields (responseEn/responseAm)');
  }
}

// ── 7. Check analytics repository has AI insights method ──────────────────────
const analyticsRepo = readF(path.join(FRONTEND, 'core/repositories/analytics_repository.dart'));
if (!analyticsRepo.includes('fetchAiInsights') && !analyticsRepo.includes('aiInsights')) {
  flag('analytics_repository.dart', 'WARN', 'Missing fetchAiInsights method');
}

// ── 8. Check dio_client.dart handles data envelope ────────────────────────────
const dioClient = readF(path.join(FRONTEND, 'core/network/dio_client.dart'));
if (!dioClient.includes("data['data']") && !dioClient.includes("raw['data']")) {
  flag('dio_client.dart', 'WARN', 'No data envelope unwrapping found');
}

// ── 9. Check auth provider has email auth methods ─────────────────────────────
const authProvider = readF(path.join(FRONTEND, 'features/auth/presentation/providers/auth_provider.dart'));
if (!authProvider.includes('forgotPassword') && !authProvider.includes('requestPasswordReset')) {
  flag('auth_provider.dart', 'WARN', 'Missing forgotPassword action');
}
if (!authProvider.includes('email')) {
  flag('auth_provider.dart', 'WARN', 'Missing email-based login support');
}

// ── 10. Scan all files for old wrong endpoint references ──────────────────────
const oldEndpoints = [
  ['/auth/phone-login', 'Old phone-only login endpoint'],
];
allDartFiles.forEach(fp => {
  const c = readF(fp);
  const rel = fp.replace(FRONTEND, '').replace(/\\/g, '/').replace(/^\//, '');
  if (rel.endsWith('api_constants.dart') || rel.endsWith('api_endpoints.dart')) return;
  oldEndpoints.forEach(([pattern, label]) => {
    if (c.includes(pattern)) {
      flag(rel, 'WARN', 'Old endpoint ref: ' + label);
    }
  });
});

// ── 11. Check pubspec.yaml has required packages ───────────────────────────────
const requiredPubPackages = [
  ['dio', 'HTTP client'],
  ['flutter_riverpod', 'State management'],
  ['freezed', 'Code generation'],
  ['json_annotation', 'JSON serialization'],
  ['flutter_secure_storage', 'Secure token storage'],
  ['socket_io_client', 'WebSocket real-time'],
];
requiredPubPackages.forEach(([pkg, label]) => {
  if (!pubspec.includes(pkg)) {
    flag('pubspec.yaml', 'WARN', 'Missing package: ' + pkg + ' (' + label + ')');
  }
});

// ── 12. Check login_screen.dart is not a stub ─────────────────────────────────
const loginScreen = readF(path.join(FRONTEND, 'features/auth/presentation/screens/login_screen.dart'));
if (loginScreen.includes('Pending Team Assignment') || loginScreen.trim().split('\n').length < 15) {
  flag('features/auth/presentation/screens/login_screen.dart', 'ERROR', 'Login screen is still a placeholder stub');
}

// ── Print results ──────────────────────────────────────────────────────────────
const errors = issues.filter(i => i.severity === 'ERROR');
const warnings = issues.filter(i => i.severity === 'WARN');

console.log('\n══════════════════════════════════════════════════════════════════');
console.log('  AgriEtech Frontend Bug Audit Report');
console.log('══════════════════════════════════════════════════════════════════');
console.log('  Dart files scanned : ' + allDartFiles.length);
console.log('  Critical files OK  : ' + info.length);
console.log('  Errors found       : ' + errors.length);
console.log('  Warnings found     : ' + warnings.length);
console.log('══════════════════════════════════════════════════════════════════\n');

if (errors.length > 0) {
  console.log('── ERRORS (must fix) ──────────────────────────────────────────────');
  errors.forEach((e, i) => console.log('  [' + (i+1) + '] ' + e.file + '\n      ' + e.msg));
  console.log('');
}
if (warnings.length > 0) {
  console.log('── WARNINGS (should fix) ──────────────────────────────────────────');
  warnings.forEach((w, i) => console.log('  [' + (i+1) + '] ' + w.file + '\n      ' + w.msg));
  console.log('');
}
if (errors.length === 0 && warnings.length === 0) {
  console.log('  All checks passed! Frontend is aligned with backend.');
}
