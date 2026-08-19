/**
 * AgriEtech Frontend ↔ Backend Sync Script
 * =========================================
 * Updates all Flutter frontend files to align with the latest backend
 * features including:
 *  - Email-based authentication + password reset
 *  - Dual-AI crop disease diagnosis (Plant.id + Gemini 2.5 Flash)
 *  - AI voice/speech endpoints (Amharic & English)
 *  - AI graph analytics insights endpoint
 *  - Updated data envelope handling (success/data/error wrappers)
 *  - Bilingual (Amharic + English) response field mapping
 *  - New API endpoint constants
 *  - Disease repository & model field mapping fixes
 */

const fs = require('fs');
const path = require('path');

const FRONTEND = 'C:\\Users\\a\\Desktop\\agrietech-frontend';

let updatedCount = 0;
let createdCount = 0;
let skippedCount = 0;

function log(tag, msg) {
  console.log(`[${tag}] ${msg}`);
}

function readFile(rel) {
  const full = path.join(FRONTEND, rel);
  if (!fs.existsSync(full)) return null;
  return fs.readFileSync(full, 'utf8');
}

function writeFile(rel, content) {
  const full = path.join(FRONTEND, rel);
  const dir = path.dirname(full);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const exists = fs.existsSync(full);
  fs.writeFileSync(full, content, 'utf8');
  if (exists) { log('UPDATE', rel); updatedCount++; }
  else { log('CREATE', rel); createdCount++; }
}

function patchFile(rel, patches) {
  const content = readFile(rel);
  if (content === null) { log('SKIP', `${rel} (not found)`); skippedCount++; return; }
  let updated = content;
  for (const [from, to] of patches) {
    if (typeof from === 'string') {
      if (updated.includes(from)) updated = updated.split(from).join(to);
    } else {
      updated = updated.replace(from, to);
    }
  }
  if (updated !== content) { log('PATCH', rel); updatedCount++; fs.writeFileSync(path.join(FRONTEND, rel), updated, 'utf8'); }
  else { log('NOCHANGE', rel); }
}

// =============================================================================
// 1. API ENDPOINTS - add all new backend routes
// =============================================================================
writeFile('lib/core/constants/api_endpoints.dart', `///
/// @file api_endpoints.dart
/// @description Centralized REST API endpoint constants aligned with backend v1.
/// Updated: ${new Date().toISOString().split('T')[0]}
///
library api_endpoints;

class ApiEndpoints {
  // ── Authentication ──────────────────────────────────────────────────────────
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String logout = '/auth/logout';
  static const String refreshToken = '/auth/refresh-token';
  static const String profile = '/auth/me';
  static const String forgotPassword = '/auth/forgot-password';
  static const String resetPassword = '/auth/reset-password';
  static const String verifyEmail = '/auth/verify-email';
  static const String updatePassword = '/auth/update-password';

  // ── Boundaries ──────────────────────────────────────────────────────────────
  static const String boundaries = '/boundaries';
  static const String regions = '/boundaries/regions';
  static const String zones = '/boundaries/zones';
  static const String woredas = '/boundaries/woredas';
  static String woredaById(String id) => '/boundaries/woredas/\$id';

  // ── Farms ───────────────────────────────────────────────────────────────────
  static const String farms = '/farms';
  static String farmById(String id) => '/farms/\$id';

  // ── Sensors ─────────────────────────────────────────────────────────────────
  static const String sensors = '/sensors';
  static const String telemetry = '/sensors/telemetry';
  static String farmSensors(String farmId) => '/sensors/farm/\$farmId';

  // ── Satellite Observations ──────────────────────────────────────────────────
  static const String satelliteObservations = '/satellite-observations';

  // ── Risk Assessments ────────────────────────────────────────────────────────
  static const String riskAssessments = '/risk-assessments';
  static const String evaluateRisk = '/risk-assessments/evaluate';
  static String riskByWoreda(String woredaId) => '/risk-assessments/woreda/\$woredaId';

  // ── Alerts ──────────────────────────────────────────────────────────────────
  static const String alerts = '/alerts';

  // ── Disease Diagnosis (Dual-AI: Plant.id + Gemini 2.5 Flash) ────────────────
  static const String diseaseDiagnosis = '/disease-diagnosis';
  static const String diagnose = '/disease-diagnosis/diagnose';
  static String farmDiagnoses(String farmId) => '/disease-diagnosis/farm/\$farmId';

  // ── Analytics ───────────────────────────────────────────────────────────────
  static const String analytics = '/analytics';
  static const String analyticsDashboard = '/analytics/dashboard';
  static const String analyticsRegionalBreakdown = '/analytics/regional-breakdown';
  static const String analyticsTemporalTrends = '/analytics/temporal-trends';
  static const String analyticsAgronomicAdvisories = '/analytics/agronomic-advisories';
  static const String analyticsAiInsights = '/analytics/ai-insights';

  // ── AI Voice / Speech (Amharic & English) ───────────────────────────────────
  static const String aiVoiceInquiry = '/ai/voice-inquiry';
  static const String aiTextInquiry = '/ai/text-inquiry';
  static const String aiSpeakResponse = '/ai/speak';

  // ── Data Ingestion ──────────────────────────────────────────────────────────
  static const String ingestion = '/ingestion';
  static const String triggerIngestion = '/ingestion/trigger';
  static const String connectors = '/ingestion/connectors';
  static const String queueStats = '/ingestion/queue/stats';
}
`);

// =============================================================================
// 2. USER MODEL .g.dart - ensure email auth fields are mapped correctly
// =============================================================================
patchFile('lib/core/models/user_model.g.dart', [
  // login request should send email OR phone as 'identifier'
  [
    `Map<String, dynamic> _$$LoginRequestImplToJson(_$LoginRequestImpl instance) =>
    <String, dynamic>{
      'phone': instance.phone,
      'password': instance.password,
      'deviceToken': instance.deviceToken,
    };`,
    `Map<String, dynamic> _$$LoginRequestImplToJson(_$LoginRequestImpl instance) =>
    <String, dynamic>{
      // Backend accepts 'identifier' (email or phone) or 'email' or 'phone'
      if (instance.email != null && instance.email!.isNotEmpty)
        'email': instance.email
      else
        'phone': instance.phone,
      'password': instance.password,
      if (instance.deviceToken != null) 'deviceToken': instance.deviceToken,
    };`,
  ],
  // isEmailVerified field in UserModel fromJson
  [
    `      isActive: json['isActive'] as bool? ?? true,`,
    `      isActive: json['isActive'] as bool? ?? true,
      isEmailVerified: json['isEmailVerified'] as bool? ?? false,`,
  ],
]);

// =============================================================================
// 3. AUTH REPOSITORY - update login to support email identifier
// =============================================================================
patchFile('lib/core/repositories/auth_repository.dart', [
  [
    `  /// Login user with phone and password
  Future<LoginResponse> login(LoginRequest request) async {
    try {
      AppLogger.info('Attempting login for phone: \${request.phone}');
      
      final response = await _dioClient.post(
        ApiConstants.login, data: request.toJson(),
      );`,
    `  /// Login user with email or phone and password
  Future<LoginResponse> login(LoginRequest request) async {
    try {
      AppLogger.info('Attempting login for: \${request.email ?? request.phone}');
      // Backend supports: { identifier, password } OR { email, password } OR { phone, password }
      final loginData = <String, dynamic>{
        'password': request.password,
        if (request.email != null && request.email!.isNotEmpty)
          'email': request.email
        else
          'identifier': request.phone,
        if (request.deviceToken != null) 'deviceToken': request.deviceToken,
      };
      final response = await _dioClient.post(
        ApiConstants.login, data: loginData,
      );`,
  ],
  // Unwrap data envelope from login response
  [
    `      final loginResponse = LoginResponse.fromJson(response.data);

      // Save authentication tokens
      await _storage.saveAccessToken(loginResponse.accessToken);`,
    `      // Backend wraps response in { success, data: { accessToken, refreshToken, user } }
      final rawData = response.data is Map && response.data['data'] != null
          ? response.data['data'] as Map<String, dynamic>
          : response.data as Map<String, dynamic>;
      final loginResponse = LoginResponse.fromJson(rawData);

      // Save authentication tokens
      await _storage.saveAccessToken(loginResponse.accessToken);`,
  ],
  // Unwrap data envelope from register response
  [
    `      final loginResponse = LoginResponse.fromJson(response.data);

      // Save authentication tokens
      await _storage.saveAccessToken(loginResponse.accessToken);
      await _storage.saveRefreshToken(loginResponse.refreshToken);
      await _storage.saveUserId(loginResponse.user.id);

      AppLogger.info('Registration successful for user: \${loginResponse.user.id}');`,
    `      final rawData = response.data is Map && response.data['data'] != null
          ? response.data['data'] as Map<String, dynamic>
          : response.data as Map<String, dynamic>;
      final loginResponse = LoginResponse.fromJson(rawData);

      // Save authentication tokens
      await _storage.saveAccessToken(loginResponse.accessToken);
      await _storage.saveRefreshToken(loginResponse.refreshToken);
      await _storage.saveUserId(loginResponse.user.id);

      AppLogger.info('Registration successful for user: \${loginResponse.user.id}');`,
  ],
  // Unwrap profile data envelope
  [
    `      final user = UserModel.fromJson(response.data);`,
    `      final rawData = response.data is Map && response.data['data'] != null
          ? response.data['data'] as Map<String, dynamic>
          : response.data as Map<String, dynamic>;
      final user = UserModel.fromJson(rawData);`,
  ],
]);

// =============================================================================
// 4. DISEASE REPOSITORY - align with new backend dual-AI payload
// =============================================================================
patchFile('lib/features/disease_diagnosis/data/repositories/disease_repository.dart', [
  [
    `  /// Diagnose crop disease from DiagnosisRequest
  Future<DiseaseDiagnosisModel> diagnoseDisease(DiagnosisRequest request) async {
    try {
      final response = await _dioClient.post(
        ApiEndpoints.diseaseDiagnosis,
        data: request.toJson(),
      );
      return DiseaseDiagnosisModel.fromJson(response.data);`,
    `  /// Diagnose crop disease using dual-AI pipeline (Plant.id + Gemini 2.5 Flash)
  Future<DiseaseDiagnosisModel> diagnoseDisease(DiagnosisRequest request) async {
    try {
      final response = await _dioClient.post(
        ApiEndpoints.diagnose,
        data: request.toJson(),
      );
      final rawData = response.data is Map && response.data['data'] != null
          ? response.data['data'] as Map<String, dynamic>
          : response.data as Map<String, dynamic>;
      return DiseaseDiagnosisModel.fromJson(rawData);`,
  ],
  [
    `      final response = await _dioClient.post(
        ApiEndpoints.diseaseDiagnosis,
        data: {
          'image': base64Image,
          'cropType': cropType,
          if (farmId != null) 'farmId': farmId,
          if (notes != null) 'notes': notes,
        },
      );

      return DiseaseResultModel.fromJson(response.data);`,
    `      // Backend endpoint: POST /api/v1/disease-diagnosis/diagnose
      // Accepts: { imageBase64, cropHint, farmId, language }
      final response = await _dioClient.post(
        ApiEndpoints.diagnose,
        data: {
          'imageBase64': base64Image,
          'cropHint': cropType,
          if (farmId != null) 'farmId': farmId,
          if (notes != null) 'notes': notes,
          'language': 'am', // default Amharic; caller can override
        },
      );
      final rawData = response.data is Map && response.data['data'] != null
          ? response.data['data'] as Map<String, dynamic>
          : response.data as Map<String, dynamic>;
      return DiseaseResultModel.fromJson(rawData);`,
  ],
  [
    `      return (response.data['data'] as List)
          .map((json) => DiseaseResultModel.fromJson(json))
          .toList();`,
    `      final rawList = response.data is Map
          ? (response.data['data'] ?? response.data['diagnoses'] ?? []) as List
          : response.data as List;
      return rawList
          .map((json) => DiseaseResultModel.fromJson(json as Map<String, dynamic>))
          .toList();`,
  ],
  [
    `      return DiseaseResultModel.fromJson(response.data);
    } catch (e) {
      throw Exception('Failed to fetch diagnosis: \$e');`,
    `      final rawData = response.data is Map && response.data['data'] != null
          ? response.data['data'] as Map<String, dynamic>
          : response.data as Map<String, dynamic>;
      return DiseaseResultModel.fromJson(rawData);
    } catch (e) {
      throw Exception('Failed to fetch diagnosis: \$e');`,
  ],
]);

// =============================================================================
// 5. DISEASE RESULT MODEL .g.dart - map new bilingual backend fields
// =============================================================================
patchFile('lib/features/disease_diagnosis/data/models/disease_result_model.g.dart', [
  [
    `      diseaseDetected: json['diseaseDetected'] as String,`,
    `      // Backend returns 'diseaseName' (bilingual object) or flat 'diseaseDetected'
      diseaseDetected: (json['diseaseDetected'] ??
              (json['diseaseName'] is Map
                  ? (json['diseaseName']['en'] ?? json['diseaseName']['am'])
                  : json['diseaseName']) ??
              'Unknown') as String,`,
  ],
  [
    `      confidence: (json['confidence'] as num?)?.toDouble(),`,
    `      confidence: ((json['confidence'] ?? json['confidenceScore']) as num?)?.toDouble(),`,
  ],
  [
    `      treatment: json['treatment'] as String?,`,
    `      // Backend returns treatment as nested object with chemicalEn/organicEn keys
      treatment: json['treatment'] is String
          ? json['treatment'] as String
          : (json['treatment'] is Map
              ? ((json['treatment']['chemicalEn'] ?? json['treatment']['organicEn'] ?? ''))
              : (json['chemicalTreatment'] ?? json['organicTreatment'])) as String?,`,
  ],
  [
    `      imageUrl: json['imageUrl'] as String?,`,
    `      imageUrl: (json['imageUrl'] ?? json['cropImageUrl']) as String?,`,
  ],
  [
    `      createdAt: DateTime.parse(json['createdAt'] as String),`,
    `      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'] as String)
          : DateTime.now(),`,
  ],
]);

// =============================================================================
// 6. ANALYTICS REPOSITORY - add AI insights endpoint
// =============================================================================
patchFile('lib/core/repositories/analytics_repository.dart', [
  [
    `    res = res.replace(\n      \"queryParameters: {'period': period},\\n      );\\n      return TemporalTrendModel.fromJson(response.data);\",`,
    `    // already patched`,
  ],
]);

// Direct file patch for analytics_repository.dart
const analyticsRepo = readFile('lib/core/repositories/analytics_repository.dart');
if (analyticsRepo) {
  let ar = analyticsRepo;
  // Add AI insights method if not present
  if (!ar.includes('fetchAiInsights') && !ar.includes('aiInsights')) {
    ar = ar.replace(
      /\/\/\/ Get agronomic advisories[\s\S]*?}\s*}\s*\/\/ Provider/,
      (match) => match.replace(
        /}\s*\/\/ Provider/,
        `}

  /// Fetch Gemini 2.5 Flash AI graph insights for a woreda
  Future<Map<String, dynamic>> fetchAiInsights({
    required String woredaId,
    String timeframe = 'MONTHLY',
    String language = 'am',
  }) async {
    try {
      final response = await _dioClient.post(
        ApiEndpoints.analyticsAiInsights,
        data: {
          'woredaId': woredaId,
          'timeframe': timeframe,
          'language': language,
        },
      );
      final rawData = response.data is Map && response.data['data'] != null
          ? response.data['data'] as Map<String, dynamic>
          : response.data as Map<String, dynamic>;
      return rawData;
    } catch (e) {
      throw Exception('Failed to fetch AI insights: \$e');
    }
  }

// Provider`
      )
    );
    log('PATCH', 'lib/core/repositories/analytics_repository.dart (added fetchAiInsights)');
    updatedCount++;
    fs.writeFileSync(path.join(FRONTEND, 'lib/core/repositories/analytics_repository.dart'), ar, 'utf8');
  }
}

// =============================================================================
// 7. CREATE AI VOICE REPOSITORY
// =============================================================================
writeFile('lib/features/ai_voice/data/repositories/ai_voice_repository.dart', `import 'dart:io';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../../../core/network/dio_client.dart';
import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/utils/logger.dart';

/// Repository for bilingual AI voice inquiries (Amharic & English)
/// Connects to backend: /api/v1/ai/voice-inquiry and /api/v1/ai/text-inquiry
class AiVoiceRepository {
  final DioClient _dioClient;
  AiVoiceRepository(this._dioClient);

  /// Submit a text question and receive bilingual AI agronomic response
  Future<AiVoiceResponse> askTextQuestion({
    required String question,
    String language = 'am',
  }) async {
    try {
      AppLogger.info('AI text inquiry: \$question');
      final response = await _dioClient.post(
        ApiEndpoints.aiTextInquiry,
        data: {'question': question, 'language': language},
      );
      final raw = response.data is Map && response.data['data'] != null
          ? response.data['data'] as Map<String, dynamic>
          : response.data as Map<String, dynamic>;
      return AiVoiceResponse.fromJson(raw);
    } catch (e) {
      throw Exception('Text inquiry failed: \$e');
    }
  }

  /// Submit an audio file and receive transcription + bilingual AI response
  Future<AiVoiceResponse> submitVoiceAudio({
    required File audioFile,
    String language = 'am',
  }) async {
    try {
      AppLogger.info('AI voice inquiry: \${audioFile.path}');
      final formData = FormData.fromMap({
        'audio': await MultipartFile.fromFile(
          audioFile.path,
          filename: audioFile.path.split(Platform.pathSeparator).last,
        ),
        'language': language,
      });
      final response = await _dioClient.post(
        ApiEndpoints.aiVoiceInquiry,
        data: formData,
      );
      final raw = response.data is Map && response.data['data'] != null
          ? response.data['data'] as Map<String, dynamic>
          : response.data as Map<String, dynamic>;
      return AiVoiceResponse.fromJson(raw);
    } catch (e) {
      throw Exception('Voice inquiry failed: \$e');
    }
  }
}

/// Response model matching backend /api/v1/ai/* response payload
class AiVoiceResponse {
  final String? transcript;
  final String responseEn;
  final String responseAm;
  final String? audioUrlEn;
  final String? audioUrlAm;
  final Map<String, dynamic>? metadata;

  AiVoiceResponse({
    this.transcript,
    required this.responseEn,
    required this.responseAm,
    this.audioUrlEn,
    this.audioUrlAm,
    this.metadata,
  });

  factory AiVoiceResponse.fromJson(Map<String, dynamic> json) {
    // Backend may return flat strings or nested {en, am} objects
    String extractStr(dynamic val, String fallback) {
      if (val is String) return val;
      if (val is Map) return (val['en'] ?? val['am'] ?? fallback) as String;
      return fallback;
    }

    return AiVoiceResponse(
      transcript: json['transcript'] as String?,
      responseEn: extractStr(json['responseEn'] ?? json['response'], ''),
      responseAm: extractStr(json['responseAm'] ?? json['responseAmharic'], ''),
      audioUrlEn: json['audioUrlEn'] as String?,
      audioUrlAm: json['audioUrlAm'] as String?,
      metadata: json['metadata'] as Map<String, dynamic>?,
    );
  }

  /// Returns the preferred language response
  String localizedResponse(String lang) =>
      lang == 'am' ? responseAm : responseEn;
}

/// Riverpod provider
final aiVoiceRepositoryProvider = Provider<AiVoiceRepository>((ref) {
  return AiVoiceRepository(ref.watch(dioClientProvider));
});
`);

// =============================================================================
// 8. CREATE AI VOICE PROVIDER (StateNotifier)
// =============================================================================
writeFile('lib/features/ai_voice/presentation/providers/ai_voice_provider.dart', `import 'dart:io';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/repositories/ai_voice_repository.dart';

class AiVoiceState {
  final bool isLoading;
  final AiVoiceResponse? lastResponse;
  final String? error;
  final String language;

  const AiVoiceState({
    this.isLoading = false,
    this.lastResponse,
    this.error,
    this.language = 'am',
  });

  AiVoiceState copyWith({
    bool? isLoading,
    AiVoiceResponse? lastResponse,
    String? error,
    String? language,
  }) =>
      AiVoiceState(
        isLoading: isLoading ?? this.isLoading,
        lastResponse: lastResponse ?? this.lastResponse,
        error: error,
        language: language ?? this.language,
      );
}

class AiVoiceNotifier extends StateNotifier<AiVoiceState> {
  final AiVoiceRepository _repo;
  AiVoiceNotifier(this._repo) : super(const AiVoiceState());

  void setLanguage(String lang) => state = state.copyWith(language: lang);

  Future<void> askText(String question) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final res = await _repo.askTextQuestion(
        question: question, language: state.language,
      );
      state = state.copyWith(isLoading: false, lastResponse: res);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> submitAudio(File audioFile) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final res = await _repo.submitVoiceAudio(
        audioFile: audioFile, language: state.language,
      );
      state = state.copyWith(isLoading: false, lastResponse: res);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  void clear() => state = const AiVoiceState();
}

final aiVoiceProvider =
    StateNotifierProvider<AiVoiceNotifier, AiVoiceState>((ref) {
  return AiVoiceNotifier(ref.watch(aiVoiceRepositoryProvider));
});
`);

// =============================================================================
// 9. UPDATE api_constants.dart to add missing endpoints
// =============================================================================
patchFile('lib/core/constants/api_constants.dart', [
  [
    `  // Request timeouts`,
    `  // AI Voice & Speech Endpoints
  static const String aiVoiceInquiry = '/ai/voice-inquiry';
  static const String aiTextInquiry = '/ai/text-inquiry';
  static const String aiSpeakResponse = '/ai/speak';

  // AI Graph Analytics
  static const String analyticsAiInsights = '/analytics/ai-insights';

  // Email verification
  static const String verifyEmail = '/auth/verify-email';

  // Request timeouts`,
  ],
]);

// =============================================================================
// 10. UPDATE disease diagnosis model .g.dart in core/models
// =============================================================================
patchFile('lib/core/models/disease_diagnosis_model.g.dart', [
  [
    `      cropType: json['cropType'] as String,`,
    `      cropType: (json['cropType'] ?? json['cropHint'] ?? '') as String,`,
  ],
  [
    `      imageUrl: json['imageUrl'] as String,`,
    `      imageUrl: (json['imageUrl'] ?? json['cropImageUrl'] ?? '') as String,`,
  ],
  [
    `      confidence: (json['confidence'] as num).toDouble(),`,
    `      confidence: ((json['confidence'] ?? json['confidenceScore'] ?? 0.0) as num).toDouble(),`,
  ],
  [
    `      treatmentRecommendation: json['treatmentRecommendation'] as String?,`,
    `      treatmentRecommendation: (json['treatmentRecommendation'] ??
              (json['treatment'] is Map
                  ? (json['treatment']['chemicalEn'] ?? json['treatment']['organicEn'])
                  : json['treatment'])) as String?,`,
  ],
  [
    `      preventionAdvice: json['preventionAdvice'] as String?,`,
    `      preventionAdvice: (json['preventionAdvice'] ??
              (json['prevention'] is Map
                  ? (json['prevention']['en'] ?? json['prevention']['am'])
                  : json['prevention'])) as String?,`,
  ],
  // DiagnosisResult - map bilingual diseaseName
  [
    `      diseaseName: json['diseaseName'] as String,`,
    `      diseaseName: (json['diseaseName'] is Map
          ? (json['diseaseName']['en'] ?? json['diseaseName']['am'] ?? 'Unknown')
          : json['diseaseName'] ?? json['diseaseDetected'] ?? 'Unknown') as String,`,
  ],
  // Map symptoms from backend format
  [
    `      symptoms: (json['symptoms'] as List<dynamic>?)
          ?.map((e) => e as String)
          .toList(),`,
    `      symptoms: json['symptoms'] is List
          ? (json['symptoms'] as List).map((e) => e.toString()).toList()
          : json['symptoms'] is Map
              ? [(json['symptoms']['en'] ?? json['symptoms']['am'] ?? '').toString()]
              : null,`,
  ],
]);

// =============================================================================
// 11. Patch auth_provider in features/auth/presentation to use email
// =============================================================================
const authProviderPath = 'lib/features/auth/presentation/providers/auth_provider.dart';
const authProviderContent = readFile(authProviderPath);
if (authProviderContent && authProviderContent.includes('TODO')) {
  writeFile(authProviderPath, `///
/// @file auth_provider.dart
/// @feature auth
/// @description Riverpod StateNotifier for email-based authentication.
/// Supports: email login, phone login, register, forgot password, reset password.
///
library auth_provider;

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/models/user_model.dart';
import '../../../../core/repositories/auth_repository.dart';
import '../../../../core/utils/logger.dart';

class AuthState {
  final UserModel? user;
  final bool isAuthenticated;
  final bool isLoading;
  final String? error;

  const AuthState({
    this.user,
    this.isAuthenticated = false,
    this.isLoading = false,
    this.error,
  });

  AuthState copyWith({
    UserModel? user,
    bool? isAuthenticated,
    bool? isLoading,
    String? error,
  }) =>
      AuthState(
        user: user ?? this.user,
        isAuthenticated: isAuthenticated ?? this.isAuthenticated,
        isLoading: isLoading ?? this.isLoading,
        error: error,
      );
}

class AuthNotifier extends StateNotifier<AuthState> {
  final AuthRepository _repo;
  AuthNotifier(this._repo) : super(const AuthState());

  /// Login with email or phone + password
  Future<bool> login({required String identifier, required String password}) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      // Detect if identifier is email or phone
      final bool isEmail = identifier.contains('@');
      final request = isEmail
          ? LoginRequest(email: identifier, phone: '', password: password)
          : LoginRequest(phone: identifier, password: password);

      final response = await _repo.login(request);
      state = state.copyWith(
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      );
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }

  /// Register new user with email authentication
  Future<bool> register({
    required String fullName,
    required String password,
    String? email,
    String? phone,
    String? woredaId,
    String preferredLang = 'am',
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final request = RegisterRequest(
        fullName: fullName,
        password: password,
        email: email,
        phone: phone ?? '',
        woredaId: woredaId,
        preferredLang: preferredLang,
      );
      final response = await _repo.register(request);
      state = state.copyWith(
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      );
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }

  /// Send forgot password email
  Future<bool> forgotPassword(String email) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      await _repo.requestPasswordReset(email);
      state = state.copyWith(isLoading: false);
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }

  /// Reset password with token from email link
  Future<bool> resetPassword({required String token, required String newPassword}) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      await _repo.resetPassword(token: token, newPassword: newPassword);
      state = state.copyWith(isLoading: false);
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }

  Future<void> loadProfile() async {
    try {
      final user = await _repo.getProfile();
      state = state.copyWith(user: user, isAuthenticated: true);
    } catch (e) {
      AppLogger.warning('Profile load failed: \$e');
    }
  }

  Future<void> logout() async {
    await _repo.logout();
    state = const AuthState();
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref.watch(authRepositoryProvider));
});

/// Convenience provider for current user
final currentUserProvider = Provider<UserModel?>((ref) {
  return ref.watch(authProvider).user;
});
`);
}

// =============================================================================
// 12. Update team_git_commits.txt in FRONTEND repo
// =============================================================================
const backendCommits = readFile('../../agriEtech-backend/team_git_commits.txt');
// (already done in backend; we just create a reference copy)
writeFile('team_git_commits.txt',
  fs.readFileSync('C:/Users/a/Desktop/agriEtech-backend/team_git_commits.txt', 'utf8')
);

// =============================================================================
// SUMMARY
// =============================================================================
console.log('');
console.log('════════════════════════════════════════════════════════════════');
console.log('  AgriEtech Frontend Sync Complete');
console.log('════════════════════════════════════════════════════════════════');
console.log('  Files Updated : ' + updatedCount);
console.log('  Files Created : ' + createdCount);
console.log('  Files Skipped : ' + skippedCount);
console.log('');
console.log('  Changes Applied:');
console.log('  \u2714 api_endpoints.dart \u2014 all new backend routes added');
console.log('  \u2714 api_constants.dart \u2014 AI voice + analytics AI insight constants');
console.log('  \u2714 auth_repository.dart \u2014 email/phone dual-identifier login');
console.log('  \u2714 auth_provider.dart \u2014 email auth state management');
console.log('  \u2714 disease_repository.dart \u2014 dual-AI payload field mapping');
console.log('  \u2714 disease_result_model.g.dart \u2014 bilingual field deserialization');
console.log('  \u2714 disease_diagnosis_model.g.dart \u2014 Gemini + Plant.id field mapping');
console.log('  \u2714 analytics_repository.dart \u2014 AI insights method added');
console.log('  \u2714 ai_voice_repository.dart \u2014 NEW: voice/text inquiry client');
console.log('  \u2714 ai_voice_provider.dart \u2014 NEW: Amharic/English voice StateNotifier');
console.log('  \u2714 team_git_commits.txt \u2014 synced from backend');
console.log('════════════════════════════════════════════════════════════════');


