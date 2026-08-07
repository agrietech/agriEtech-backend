# AgriEtech Frontend (Mobile) Design Document

**Document Version:** 1.0  
**Date:** August 7, 2026  
**Project:** AgriEtech Mobile Application  
**Technology Stack:** Flutter, Dart  

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Aug 7, 2026 | Alen Biruk, Banchamlak Golla | Initial frontend design |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Technology Stack](#2-technology-stack)
3. [Architecture](#3-architecture)
4. [UI/UX Design](#4-uiux-design)
5. [Screen Specifications](#5-screen-specifications)
6. [State Management](#6-state-management)
7. [Data Layer](#7-data-layer)
8. [Offline Functionality](#8-offline-functionality)
9. [Push Notifications](#9-push-notifications)
10. [Localization](#10-localization)
11. [Performance Optimization](#11-performance-optimization)
12. [Testing Strategy](#12-testing-strategy)
13. [Frontend Task Assignment](#13-frontend-task-assignment)

---

## 1. Executive Summary

### 1.1 Purpose

This document provides comprehensive design specifications for the AgriEtech mobile application, including architecture, UI/UX design, component structure, and implementation guidelines.

### 1.2 Design Principles

- **User-Centric**: Simple, intuitive interface for farmers with varying tech literacy
- **Performance-First**: Fast load times, smooth animations, minimal data usage
- **Offline-Capable**: Core features accessible without internet connection
- **Accessibility**: Large touch targets, high contrast, multi-language support
- **Responsive**: Adapts to various screen sizes (4.5" - 7")

### 1.3 Target Platforms

- **Primary**: Android 8.0+ (API 26+)
- **Future**: iOS 12.0+

---

## 2. Technology Stack

### 2.1 Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Flutter** | 3.13+ | Cross-platform UI framework |
| **Dart** | 3.0+ | Programming language |
| **Riverpod** | 2.4+ | State management |
| **Hive** | 2.2+ | Local database (offline storage) |
| **Dio** | 5.3+ | HTTP client |

### 2.2 Key Packages

| Package | Version | Purpose |
|---------|---------|---------|
| **flutter_map** | 5.0+ | OpenStreetMap integration |
| **geolocator** | 10.0+ | GPS location services |
| **firebase_messaging** | 14.7+ | Push notifications |
| **fl_chart** | 0.64+ | Data visualization (graphs) |
| **cached_network_image** | 3.3+ | Image caching |
| **flutter_local_notifications** | 16.0+ | Local notifications |
| **intl** | 0.18+ | Internationalization |
| **connectivity_plus** | 5.0+ | Network connectivity detection |
| **image_picker** | 1.0+ | Camera/gallery access |
| **shared_preferences** | 2.2+ | Simple key-value storage |
| **freezed** | 2.4+ | Immutable models |
| **json_serializable** | 6.7+ | JSON serialization |

### 2.3 Development Tools

| Tool | Purpose |
|------|---------|
| **Flutter DevTools** | Debugging and profiling |
| **Flutter Test** | Widget and unit testing |
| **Mockito** | Mocking for tests |
| **Flutter Launcher Icons** | App icon generation |
| **Flutter Native Splash** | Splash screen generation |

---

## 3. Architecture

### 3.1 Architectural Pattern

**Clean Architecture with Feature-First Structure**

```
┌─────────────────────────────────────────────────────────┐
│                    Presentation Layer                   │
│              (Screens, Widgets, Controllers)            │
├─────────────────────────────────────────────────────────┤
│                    Application Layer                    │
│          (State Management, Use Cases, Providers)       │
├─────────────────────────────────────────────────────────┤
│                      Domain Layer                       │
│              (Entities, Repository Interfaces)          │
├─────────────────────────────────────────────────────────┤
│                       Data Layer                        │
│         (API Client, Local DB, Repository Impl)         │
└─────────────────────────────────────────────────────────┘
```

### 3.2 Project Structure

```
AgriEtech_mobile/
├── lib/
│   ├── core/                       # Shared utilities
│   │   ├── constants/
│   │   │   ├── app_colors.dart
│   │   │   ├── app_sizes.dart
│   │   │   └── api_endpoints.dart
│   │   ├── theme/
│   │   │   ├── app_theme.dart
│   │   │   └── text_styles.dart
│   │   ├── utils/
│   │   │   ├── validators.dart
│   │   │   ├── formatters.dart
│   │   │   └── date_utils.dart
│   │   ├── widgets/
│   │   │   ├── app_button.dart
│   │   │   ├── app_text_field.dart
│   │   │   ├── loading_indicator.dart
│   │   │   └── error_widget.dart
│   │   └── network/
│   │       ├── api_client.dart
│   │       ├── api_interceptor.dart
│   │       └── api_exception.dart
│   ├── features/                   # Feature modules
│   │   ├── auth/
│   │   │   ├── data/
│   │   │   │   ├── models/
│   │   │   │   │   └── user_model.dart
│   │   │   │   ├── datasources/
│   │   │   │   │   ├── auth_remote_datasource.dart
│   │   │   │   │   └── auth_local_datasource.dart
│   │   │   │   └── repositories/
│   │   │   │       └── auth_repository_impl.dart
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   │   └── user.dart
│   │   │   │   └── repositories/
│   │   │   │       └── auth_repository.dart
│   │   │   └── presentation/
│   │   │       ├── providers/
│   │   │       │   └── auth_provider.dart
│   │   │       ├── screens/
│   │   │       │   ├── login_screen.dart
│   │   │       │   ├── register_screen.dart
│   │   │       │   └── otp_verification_screen.dart
│   │   │       └── widgets/
│   │   │           ├── phone_input.dart
│   │   │           └── otp_input.dart
│   │   ├── dashboard/
│   │   │   ├── presentation/
│   │   │   │   ├── screens/
│   │   │   │   │   └── dashboard_screen.dart
│   │   │   │   └── widgets/
│   │   │   │       ├── farm_card.dart
│   │   │   │       ├── alert_banner.dart
│   │   │   │       └── quick_actions.dart
│   │   ├── farms/
│   │   │   ├── data/
│   │   │   │   ├── models/
│   │   │   │   │   ├── farm_model.dart
│   │   │   │   │   └── crop_model.dart
│   │   │   │   └── repositories/
│   │   │   │       └── farm_repository_impl.dart
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   │   ├── farm.dart
│   │   │   │   │   └── crop.dart
│   │   │   │   └── repositories/
│   │   │   │       └── farm_repository.dart
│   │   │   └── presentation/
│   │   │       ├── providers/
│   │   │       │   └── farm_provider.dart
│   │   │       ├── screens/
│   │   │       │   ├── farms_list_screen.dart
│   │   │       │   ├── farm_detail_screen.dart
│   │   │       │   ├── add_farm_screen.dart
│   │   │       │   └── farm_map_screen.dart
│   │   │       └── widgets/
│   │   │           ├── farm_list_item.dart
│   │   │           ├── map_picker.dart
│   │   │           └── crop_selector.dart
│   │   ├── sensors/
│   │   │   ├── data/
│   │   │   │   └── models/
│   │   │   │       └── sensor_reading_model.dart
│   │   │   ├── domain/
│   │   │   │   └── entities/
│   │   │   │       └── sensor_reading.dart
│   │   │   └── presentation/
│   │   │       ├── screens/
│   │   │       │   ├── sensor_dashboard_screen.dart
│   │   │       │   └── sensor_history_screen.dart
│   │   │       └── widgets/
│   │   │           ├── sensor_gauge.dart
│   │   │           ├── sensor_chart.dart
│   │   │           └── reading_card.dart
│   │   ├── weather/
│   │   │   ├── data/
│   │   │   │   └── models/
│   │   │   │       └── weather_model.dart
│   │   │   ├── domain/
│   │   │   │   └── entities/
│   │   │   │       └── weather.dart
│   │   │   └── presentation/
│   │   │       ├── screens/
│   │   │       │   ├── weather_screen.dart
│   │   │       │   └── forecast_screen.dart
│   │   │       └── widgets/
│   │   │           ├── weather_card.dart
│   │   │           ├── forecast_list.dart
│   │   │           └── weather_icon.dart
│   │   ├── disease/
│   │   │   ├── data/
│   │   │   │   └── models/
│   │   │   │       ├── disease_model.dart
│   │   │   │       └── disease_alert_model.dart
│   │   │   ├── domain/
│   │   │   │   └── entities/
│   │   │   │       ├── disease.dart
│   │   │   │       └── disease_alert.dart
│   │   │   └── presentation/
│   │   │       ├── screens/
│   │   │       │   ├── disease_library_screen.dart
│   │   │       │   ├── disease_detail_screen.dart
│   │   │       │   └── disease_alerts_screen.dart
│   │   │       └── widgets/
│   │   │           ├── disease_card.dart
│   │   │           ├── risk_indicator.dart
│   │   │           └── alert_list_item.dart
│   │   ├── recommendations/
│   │   │   ├── data/
│   │   │   │   └── models/
│   │   │   │       └── recommendation_model.dart
│   │   │   ├── domain/
│   │   │   │   └── entities/
│   │   │   │       └── recommendation.dart
│   │   │   └── presentation/
│   │   │       ├── screens/
│   │   │       │   └── recommendations_screen.dart
│   │   │       └── widgets/
│   │   │           ├── recommendation_card.dart
│   │   │           └── priority_badge.dart
│   │   └── notifications/
│   │       ├── data/
│   │       │   └── models/
│   │       │       └── notification_model.dart
│   │       ├── domain/
│   │       │   └── entities/
│   │       │       └── notification.dart
│   │       └── presentation/
│   │           ├── screens/
│   │           │   └── notifications_screen.dart
│   │           └── widgets/
│   │               └── notification_item.dart
│   ├── l10n/                       # Localization
│   │   ├── app_am.arb              # Amharic
│   │   ├── app_om.arb              # Oromo
│   │   └── app_en.arb              # English
│   ├── routes/
│   │   └── app_router.dart
│   └── main.dart
├── assets/
│   ├── images/
│   ├── icons/
│   └── fonts/
├── test/
│   ├── unit/
│   ├── widget/
│   └── integration/
└── pubspec.yaml
```


---

## 4. UI/UX Design

### 4.1 Design System

#### Color Palette

```dart
class AppColors {
  // Primary Colors
  static const primary = Color(0xFF2E7D32);      // Green (agriculture)
  static const primaryDark = Color(0xFF1B5E20);
  static const primaryLight = Color(0xFF4CAF50);
  
  // Accent Colors
  static const accent = Color(0xFFFF9800);        // Orange (alerts)
  
  // Status Colors
  static const success = Color(0xFF4CAF50);       // Green
  static const warning = Color(0xFFFFA726);       // Orange
  static const error = Color(0xFFF44336);         // Red
  static const info = Color(0xFF2196F3);          // Blue
  
  // Neutral Colors
  static const background = Color(0xFFF5F5F5);
  static const surface = Color(0xFFFFFFFF);
  static const text = Color(0xFF212121);
  static const textLight = Color(0xFF757575);
  static const divider = Color(0xFFBDBDBD);
}
```

#### Typography

```dart
class AppTextStyles {
  static const headline1 = TextStyle(
    fontSize: 24,
    fontWeight: FontWeight.bold,
    color: AppColors.text,
  );
  
  static const headline2 = TextStyle(
    fontSize: 20,
    fontWeight: FontWeight.w600,
    color: AppColors.text,
  );
  
  static const body1 = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.normal,
    color: AppColors.text,
  );
  
  static const body2 = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.normal,
    color: AppColors.textLight,
  );
  
  static const caption = TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.normal,
    color: AppColors.textLight,
  );
}
```

#### Spacing & Sizing

```dart
class AppSizes {
  // Spacing
  static const double xs = 4.0;
  static const double sm = 8.0;
  static const double md = 16.0;
  static const double lg = 24.0;
  static const double xl = 32.0;
  
  // Border Radius
  static const double radiusSm = 8.0;
  static const double radiusMd = 12.0;
  static const double radiusLg = 16.0;
  
  // Touch Targets
  static const double minTouchTarget = 48.0;
  
  // Icons
  static const double iconSm = 20.0;
  static const double iconMd = 24.0;
  static const double iconLg = 32.0;
}
```

### 4.2 Navigation Structure

```
┌─────────────────────────────────────────────┐
│          Bottom Navigation Bar              │
├──────┬──────┬──────┬──────┬──────┬─────────┤
│ Home │Farms │Sensor│Weather│ More │
└──────┴──────┴──────┴──────┴──────┴─────────┘
```

**Bottom Navigation Items:**
1. **Home** - Dashboard with overview
2. **Farms** - Farm and crop management
3. **Sensors** - Real-time sensor data
4. **Weather** - Weather forecast and alerts
5. **More** - Profile, settings, disease library, notifications

---

## 5. Screen Specifications

### 5.1 Authentication Screens

#### Login Screen
**Path:** `/login`

**Components:**
- App logo and tagline
- Phone number input (+251 prefix)
- Password input (with show/hide toggle)
- "Login" button
- "Forgot Password?" link
- "Create Account" button

**Validation:**
- Phone: Ethiopian format (+251XXXXXXXXX)
- Password: Non-empty

**State Management:**
```dart
final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref.read(authRepositoryProvider));
});
```



#### Register Screen
**Path:** `/register`

**Components:**
- Full name input
- Phone number input
- Password input (with strength indicator)
- Confirm password input
- Language selection (Amharic, Oromo, English)
- Region dropdown
- Terms & conditions checkbox
- "Register" button

#### OTP Verification Screen
**Path:** `/verify-otp`

**Components:**
- 6-digit OTP input boxes
- Timer countdown (5:00)
- "Resend OTP" button (disabled during countdown)
- "Verify" button

### 5.2 Dashboard Screen
**Path:** `/home`

**Sections:**
1. **Header**
   - User greeting
   - Notification bell icon (with badge count)

2. **Alert Banner** (if active alerts exist)
   - Priority indicator (red/orange/yellow)
   - Alert message
   - "View Details" button

3. **Farm Summary Cards** (horizontal scroll)
   - Farm name
   - Health score (0-100) with color indicator
   - Active alerts count
   - Latest sensor reading
   - Tap to view details

4. **Quick Actions Grid**
   - Add Farm
   - View Weather
   - Disease Library
   - Recommendations

5. **Recent Activity**
   - Last 5 events (alerts, recommendations, actions)

### 5.3 Farms List Screen
**Path:** `/farms`

**Components:**
- Floating Action Button: "Add Farm"
- Farm list items:
  - Farm name and size
  - Crop types (chips)
  - Health score
  - Last updated time
  - Tap to view details

**Empty State:**
- Illustration
- "No farms yet" message
- "Add Your First Farm" button

### 5.4 Add/Edit Farm Screen
**Path:** `/farms/add` or `/farms/:id/edit`

**Form Fields:**
- Farm name (required)
- Size in hectares (number input)
- Location selection:
  - "Use Current Location" button
  - Or "Pick on Map" button
- Boundary drawing (optional)
- Save button

**Map Integration:**
- OpenStreetMap tiles
- Draggable marker
- Boundary polygon drawing tool
- Current location button

### 5.5 Farm Detail Screen
**Path:** `/farms/:id`

**Tabs:**
1. **Overview**
   - Farm info card (name, size, location)
   - Health score gauge
   - Active crops list
   - Registered sensors
   - Quick stats (moisture, temp, NPK)

2. **Crops**
   - Crop list with planting dates
   - Growth stage indicators
   - Add crop button
   - Edit/delete options

3. **History**
   - Past harvests
   - Disease incidents
   - Performance charts

**Actions:**
- Edit farm
- Add crop
- Register sensor
- View on map



### 5.6 Sensor Dashboard Screen
**Path:** `/sensors`

**Components:**
1. **Device Selector** (if multiple sensors)
   - Dropdown or tabs for different devices
   - Device status indicator (online/offline)

2. **Real-Time Readings Cards**
   - Soil Moisture (gauge with percentage)
   - Temperature (thermometer visualization)
   - Humidity (cloud icon with percentage)
   - NPK Levels (bar chart)
   - Color-coded status (green/yellow/red)
   - Last updated timestamp

3. **Quick Stats**
   - 24-hour min/max values
   - Trend indicators (up/down arrows)

4. **Actions**
   - View history button
   - Refresh button
   - Device settings

### 5.7 Sensor History Screen
**Path:** `/sensors/:deviceId/history`

**Components:**
- Date range selector (24h, 7d, 30d, custom)
- Line charts for each parameter
- Zoom and pan functionality
- Threshold lines on graphs
- Export data button

### 5.8 Weather Screen
**Path:** `/weather`

**Sections:**
1. **Current Weather Card**
   - Large weather icon
   - Temperature
   - "Feels like" temperature
   - Humidity, wind speed
   - Rainfall (last 24h)

2. **Hourly Forecast** (horizontal scroll)
   - Next 48 hours
   - Time, icon, temperature, precipitation %

3. **7-Day Forecast**
   - Daily cards with high/low temps
   - Weather condition icon
   - Precipitation probability

4. **Weather Alerts** (if any)
   - Alert type banner
   - Description and recommendations

### 5.9 Disease Library Screen
**Path:** `/diseases`

**Components:**
- Search bar
- Crop filter chips (All, Teff, Maize, etc.)
- Disease cards:
  - Disease name
  - Affected crops
  - Severity indicator
  - Thumbnail image
  - Tap for details

### 5.10 Disease Detail Screen
**Path:** `/diseases/:id`

**Sections:**
- Image gallery (swipeable)
- Disease name and scientific name
- Affected crops
- Symptoms (expandable text)
- Risk conditions
- Prevention measures
- Treatment options
- "Report This Disease" button

### 5.11 Recommendations Screen
**Path:** `/recommendations`

**Components:**
- Priority filter tabs (All, Critical, Warning, Info)
- Recommendation cards:
  - Priority badge (color-coded)
  - Category icon
  - Title and description
  - Action required
  - Estimated time
  - Due by date/time
  - "Mark Complete" checkbox
- Empty state for no recommendations

### 5.12 Notifications Screen
**Path:** `/notifications`

**Components:**
- "Mark All Read" button
- Notification list items:
  - Type icon (alert/info/reminder)
  - Title and body
  - Timestamp
  - Read/unread indicator
  - Tap to view details
- Empty state

### 5.13 Profile Screen
**Path:** `/profile`

**Sections:**
1. **User Info**
   - Profile photo (editable)
   - Name
   - Phone number
   - Edit button

2. **Settings**
   - Language preference
   - Notification settings
   - Theme (future: dark mode)

3. **Statistics**
   - Total farms
   - Total crops
   - Active sensors
   - Member since date

4. **Actions**
   - Help & Support
   - Terms & Privacy
   - Logout

---

## 6. State Management

### 6.1 Riverpod Architecture

**Provider Types:**
- **Provider**: Immutable, read-only values
- **StateProvider**: Simple mutable state
- **StateNotifierProvider**: Complex state with logic
- **FutureProvider**: Async operations
- **StreamProvider**: Real-time data streams

### 6.2 Example: Auth State Management

```dart
// auth_state.dart
@freezed
class AuthState with _$AuthState {
  const factory AuthState.initial() = _Initial;
  const factory AuthState.loading() = _Loading;
  const factory AuthState.authenticated(User user) = _Authenticated;
  const factory AuthState.unauthenticated() = _Unauthenticated;
  const factory AuthState.error(String message) = _Error;
}

// auth_notifier.dart
class AuthNotifier extends StateNotifier<AuthState> {
  final AuthRepository _repository;
  
  AuthNotifier(this._repository) : super(const AuthState.initial()) {
    _checkAuthStatus();
  }
  
  Future<void> _checkAuthStatus() async {
    final token = await _repository.getStoredToken();
    if (token != null) {
      final user = await _repository.getCurrentUser();
      state = AuthState.authenticated(user);
    } else {
      state = const AuthState.unauthenticated();
    }
  }
  
  Future<void> login(String phoneNumber, String password) async {
    state = const AuthState.loading();
    try {
      final user = await _repository.login(phoneNumber, password);
      state = AuthState.authenticated(user);
    } catch (e) {
      state = AuthState.error(e.toString());
    }
  }
  
  Future<void> logout() async {
    await _repository.logout();
    state = const AuthState.unauthenticated();
  }
}

// auth_provider.dart
final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref.read(authRepositoryProvider));
});
```

### 6.3 Example: Farm State Management

```dart
// farms_provider.dart
final farmsProvider = FutureProvider.autoDispose<List<Farm>>((ref) async {
  final repository = ref.read(farmRepositoryProvider);
  return repository.getFarms();
});

final farmDetailProvider = FutureProvider.autoDispose.family<Farm, String>(
  (ref, farmId) async {
    final repository = ref.read(farmRepositoryProvider);
    return repository.getFarmById(farmId);
  },
);

// Sensor readings stream
final sensorReadingsProvider = StreamProvider.autoDispose.family<
  SensorReading,
  String
>((ref, deviceId) {
  final repository = ref.read(sensorRepositoryProvider);
  return repository.getSensorReadingsStream(deviceId);
});
```

---

## 7. Data Layer

### 7.1 API Client

```dart
class ApiClient {
  final Dio _dio;
  final String _baseUrl = 'https://api.AgriEtech.et/api/v1';
  
  ApiClient(this._dio) {
    _dio.options.baseUrl = _baseUrl;
    _dio.interceptors.add(AuthInterceptor());
    _dio.interceptors.add(LoggingInterceptor());
  }
  
  Future<Response> get(String path, {Map<String, dynamic>? queryParameters}) {
    return _dio.get(path, queryParameters: queryParameters);
  }
  
  Future<Response> post(String path, {dynamic data}) {
    return _dio.post(path, data: data);
  }
  
  Future<Response> put(String path, {dynamic data}) {
    return _dio.put(path, data: data);
  }
  
  Future<Response> delete(String path) {
    return _dio.delete(path);
  }
}
```

### 7.2 Auth Interceptor

```dart
class AuthInterceptor extends Interceptor {
  @override
  void onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final token = await _getStoredToken();
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }
  
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401) {
      // Token expired, try to refresh
      final refreshed = await _refreshToken();
      if (refreshed) {
        // Retry original request
        final response = await _retry(err.requestOptions);
        handler.resolve(response);
      } else {
        // Logout user
        handler.next(err);
      }
    } else {
      handler.next(err);
    }
  }
}
```

### 7.3 Repository Pattern

```dart
abstract class FarmRepository {
  Future<List<Farm>> getFarms();
  Future<Farm> getFarmById(String id);
  Future<Farm> createFarm(FarmInput input);
  Future<Farm> updateFarm(String id, FarmInput input);
  Future<void> deleteFarm(String id);
}

class FarmRepositoryImpl implements FarmRepository {
  final ApiClient _apiClient;
  final FarmLocalDataSource _localDataSource;
  final ConnectivityService _connectivity;
  
  FarmRepositoryImpl(
    this._apiClient,
    this._localDataSource,
    this._connectivity,
  );
  
  @override
  Future<List<Farm>> getFarms() async {
    if (await _connectivity.isConnected()) {
      try {
        final response = await _apiClient.get('/farms');
        final farms = (response.data['data'] as List)
            .map((json) => Farm.fromJson(json))
            .toList();
        
        // Cache locally
        await _localDataSource.saveFarms(farms);
        
        return farms;
      } catch (e) {
        // Fallback to cached data
        return await _localDataSource.getFarms();
      }
    } else {
      return await _localDataSource.getFarms();
    }
  }
}
```

---

## 8. Offline Functionality

### 8.1 Local Database (Hive)

```dart
// Models
@HiveType(typeId: 0)
class FarmLocal extends HiveObject {
  @HiveField(0)
  late String id;
  
  @HiveField(1)
  late String name;
  
  @HiveField(2)
  late double latitude;
  
  @HiveField(3)
  late double longitude;
  
  @HiveField(4)
  late double sizeHectares;
  
  @HiveField(5)
  late DateTime syncedAt;
}

// Initialize Hive
Future<void> initHive() async {
  await Hive.initFlutter();
  Hive.registerAdapter(FarmLocalAdapter());
  Hive.registerAdapter(CropLocalAdapter());
  Hive.registerAdapter(SensorReadingLocalAdapter());
  
  await Hive.openBox<FarmLocal>('farms');
  await Hive.openBox<CropLocal>('crops');
  await Hive.openBox<SensorReadingLocal>('sensor_readings');
}
```

### 8.2 Sync Strategy

**Priority Levels:**
1. **Critical**: Sensor alerts, disease risks (sync immediately)
2. **High**: Recommendations, weather updates (sync every 30 min)
3. **Medium**: Farm changes, user actions (sync hourly)
4. **Low**: Historical data, statistics (sync daily)

```dart
class SyncService {
  Future<void> syncAll() async {
    if (!await _connectivity.isConnected()) return;
    
    await Future.wait([
      _syncFarms(),
      _syncSensorReadings(),
      _syncWeatherData(),
      _syncRecommendations(),
    ]);
  }
  
  Future<void> _syncFarms() async {
    // Upload pending changes
    final pendingChanges = await _localDataSource.getPendingChanges();
    for (final change in pendingChanges) {
      await _uploadChange(change);
    }
    
    // Download latest data
    final remoteFarms = await _apiClient.get('/farms');
    await _localDataSource.saveFarms(remoteFarms);
  }
}
```

### 8.3 Offline-First Features

**Available Offline:**
- View cached farms and crops
- View last 7 days sensor readings
- View disease library (pre-cached)
- View cached weather forecast
- View recommendations (last synced)

**Require Connection:**
- Create/edit/delete operations (queued when offline)
- Real-time sensor data updates
- Fresh weather forecasts
- Push notifications

---

## 9. Push Notifications

### 9.1 Firebase Cloud Messaging Setup

```dart
class NotificationService {
  final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  
  Future<void> initialize() async {
    // Request permission
    final settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );
    
    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      // Get FCM token
      final token = await _messaging.getToken();
      await _sendTokenToServer(token);
      
      // Listen for token refresh
      _messaging.onTokenRefresh.listen(_sendTokenToServer);
      
      // Handle foreground messages
      FirebaseMessaging.onMessage.listen(_handleForegroundMessage);
      
      // Handle background messages
      FirebaseMessaging.onBackgroundMessage(_handleBackgroundMessage);
      
      // Handle notification tap
      FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);
    }
  }
  
  void _handleForegroundMessage(RemoteMessage message) {
    // Show local notification
    _showLocalNotification(
      title: message.notification?.title ?? '',
      body: message.notification?.body ?? '',
      payload: message.data,
    );
  }
}
```

### 9.2 Local Notifications

```dart
class LocalNotificationService {
  final FlutterLocalNotificationsPlugin _plugin =
      FlutterLocalNotificationsPlugin();
  
  Future<void> initialize() async {
    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings();
    
    const settings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );
    
    await _plugin.initialize(
      settings,
      onDidReceiveNotificationResponse: _onNotificationTap,
    );
  }
  
  Future<void> showNotification({
    required String title,
    required String body,
    required String payload,
    NotificationPriority priority = NotificationPriority.high,
  }) async {
    final androidDetails = AndroidNotificationDetails(
      'AgriEtech_alerts',
      'Alerts',
      channelDescription: 'Important farm alerts and notifications',
      importance: Importance.high,
      priority: Priority.high,
      sound: priority == NotificationPriority.critical
          ? RawResourceAndroidNotificationSound('alert_sound')
          : null,
    );
    
    final iosDetails = DarwinNotificationDetails(
      sound: priority == NotificationPriority.critical ? 'alert_sound.aiff' : null,
    );
    
    final details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );
    
    await _plugin.show(0, title, body, details, payload: payload);
  }
}
```

---

## 10. Localization

### 10.1 ARB Files Structure

**app_en.arb** (English)
```json
{
  "@@locale": "en",
  "appTitle": "AgriEtech",
  "login": "Login",
  "register": "Register",
  "phoneNumber": "Phone Number",
  "password": "Password",
  "loginButton": "Login",
  "farmName": "Farm Name",
  "addFarm": "Add Farm",
  "soilMoisture": "Soil Moisture",
  "temperature": "Temperature",
  "humidity": "Humidity",
  "critical": "Critical",
  "warning": "Warning",
  "irrigateNow": "Irrigate immediately",
  "lowMoistureAlert": "Soil moisture below {threshold}%",
  "@lowMoistureAlert": {
    "placeholders": {
      "threshold": {
        "type": "int"
      }
    }
  }
}
```

**app_am.arb** (Amharic)
```json
{
  "@@locale": "am",
  "appTitle": "ክሮፕጋርዲያን",
  "login": "ግባ",
  "register": "ተመዝገብ",
  "phoneNumber": "ስልክ ቁጥር",
  "password": "የይለፍ ቃል",
  "loginButton": "ግባ",
  "farmName": "የእርሻ ስም",
  "addFarm": "እርሻ አክል",
  "soilMoisture": "የአፈር እርጥበት",
  "temperature": "የሙቀት መጠን",
  "humidity": "እርጥበት"
}
```

### 10.2 Usage in Code

```dart
import 'package:flutter_gen/gen_l10n/app_localizations.dart';

class LoginScreen extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    
    return Scaffold(
      appBar: AppBar(title: Text(l10n.appTitle)),
      body: Column(
        children: [
          TextField(
            decoration: InputDecoration(
              labelText: l10n.phoneNumber,
            ),
          ),
          TextField(
            decoration: InputDecoration(
              labelText: l10n.password,
            ),
          ),
          ElevatedButton(
            onPressed: _login,
            child: Text(l10n.loginButton),
          ),
        ],
      ),
    );
  }
}
```

---

## 11. Performance Optimization

### 11.1 Image Optimization

```dart
// Cached network images
CachedNetworkImage(
  imageUrl: diseaseImageUrl,
  placeholder: (context, url) => Shimmer.fromColors(
    baseColor: Colors.grey[300]!,
    highlightColor: Colors.grey[100]!,
    child: Container(color: Colors.white),
  ),
  errorWidget: (context, url, error) => Icon(Icons.error),
  memCacheWidth: 500, // Resize in memory
  maxWidthDiskCache: 500, // Resize on disk
);
```

### 11.2 List Performance

```dart
// Use ListView.builder for large lists
ListView.builder(
  itemCount: farms.length,
  itemBuilder: (context, index) {
    return FarmListItem(farm: farms[index]);
  },
);

// Use AutomaticKeepAliveClientMixin for tab views
class SensorTab extends StatefulWidget {
  @override
  _SensorTabState createState() => _SensorTabState();
}

class _SensorTabState extends State<SensorTab>
    with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;
  
  @override
  Widget build(BuildContext context) {
    super.build(context); // Required for keepAlive
    return SensorDashboard();
  }
}
```

### 11.3 Lazy Loading

```dart
// Paginated farm list
class FarmsNotifier extends StateNotifier<AsyncValue<List<Farm>>> {
  int _page = 1;
  final int _limit = 20;
  bool _hasMore = true;
  
  Future<void> loadMore() async {
    if (!_hasMore) return;
    
    final moreFarms = await _repository.getFarms(
      page: _page,
      limit: _limit,
    );
    
    if (moreFarms.length < _limit) {
      _hasMore = false;
    }
    
    state = AsyncValue.data([
      ...state.value ?? [],
      ...moreFarms,
    ]);
    
    _page++;
  }
}
```

### 11.4 Build Optimization

```dart
// Use const constructors
const AppButton({
  Key? key,
  required this.label,
  required this.onPressed,
}) : super(key: key);

// Extract widgets to separate classes
class _SensorCard extends StatelessWidget {
  final SensorReading reading;
  
  const _SensorCard({required this.reading});
  
  @override
  Widget build(BuildContext context) {
    return Card(/* ... */);
  }
}
```

---

## 12. Testing Strategy

### 12.1 Unit Tests

```dart
// test/unit/auth_notifier_test.dart
void main() {
  late AuthNotifier notifier;
  late MockAuthRepository mockRepository;
  
  setUp(() {
    mockRepository = MockAuthRepository();
    notifier = AuthNotifier(mockRepository);
  });
  
  test('login success updates state to authenticated', () async {
    final user = User(id: '1', name: 'Test User');
    when(mockRepository.login(any, any)).thenAnswer((_) async => user);
    
    await notifier.login('+251912345678', 'password');
    
    expect(notifier.state, isA<AuthStateAuthenticated>());
  });
  
  test('login failure updates state to error', () async {
    when(mockRepository.login(any, any))
        .thenThrow(Exception('Invalid credentials'));
    
    await notifier.login('+251912345678', 'wrong');
    
    expect(notifier.state, isA<AuthStateError>());
  });
}
```

### 12.2 Widget Tests

```dart
// test/widget/login_screen_test.dart
void main() {
  testWidgets('Login screen displays correctly', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        child: MaterialApp(home: LoginScreen()),
      ),
    );
    
    expect(find.text('Login'), findsOneWidget);
    expect(find.byType(TextField), findsNWidgets(2));
    expect(find.byType(ElevatedButton), findsOneWidget);
  });
  
  testWidgets('Login button triggers authentication', (tester) async {
    final mockNotifier = MockAuthNotifier();
    
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          authProvider.overrideWith((ref) => mockNotifier),
        ],
        child: MaterialApp(home: LoginScreen()),
      ),
    );
    
    await tester.enterText(find.byKey(Key('phone_input')), '+251912345678');
    await tester.enterText(find.byKey(Key('password_input')), 'password');
    await tester.tap(find.byType(ElevatedButton));
    
    verify(mockNotifier.login('+251912345678', 'password')).called(1);
  });
}
```

### 12.3 Integration Tests

```dart
// test/integration/farm_flow_test.dart
void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();
  
  testWidgets('Complete farm creation flow', (tester) async {
    await tester.pumpWidget(AgriEtechApp());
    
    // Login
    await tester.enterText(find.byKey(Key('phone_input')), '+251912345678');
    await tester.enterText(find.byKey(Key('password_input')), 'password');
    await tester.tap(find.text('Login'));
    await tester.pumpAndSettle();
    
    // Navigate to farms
    await tester.tap(find.text('Farms'));
    await tester.pumpAndSettle();
    
    // Add new farm
    await tester.tap(find.byType(FloatingActionButton));
    await tester.pumpAndSettle();
    
    await tester.enterText(find.byKey(Key('farm_name')), 'Test Farm');
    await tester.enterText(find.byKey(Key('farm_size')), '1.5');
    await tester.tap(find.text('Use Current Location'));
    await tester.pumpAndSettle();
    
    await tester.tap(find.text('Save'));
    await tester.pumpAndSettle();
    
    // Verify farm appears in list
    expect(find.text('Test Farm'), findsOneWidget);
  });
}
```

---

## 13. Frontend Task Assignment

### Alen Biruk (Mobile Developer - Lead)

**Week 1-2:**
- [ ] Setup Flutter project structure and dependencies
- [ ] Configure Riverpod state management
- [ ] Design UI/UX mockups (Figma/Adobe XD)
- [ ] Implement design system (colors, typography, themes)
- [ ] Create reusable widget library (buttons, inputs, cards)

**Week 3-4:**
- [ ] Build authentication screens (login, register, OTP)
- [ ] Implement auth state management
- [ ] Integrate authentication API
- [ ] Build navigation structure (bottom nav, routes)
- [ ] Create dashboard screen layout

**Week 5-6:**
- [ ] Implement farm management screens (list, detail, add/edit)
- [ ] Integrate OpenStreetMap for location selection
- [ ] Build sensor dashboard with real-time data display
- [ ] Create data visualization widgets (gauges, charts)
- [ ] Implement pull-to-refresh and loading states

**Week 7-8:**
- [ ] Build weather screens with forecast display
- [ ] Implement disease library browser
- [ ] Create recommendations screen
- [ ] Setup Firebase Cloud Messaging
- [ ] Implement push notification handling

**Week 9-10:**
- [ ] Build offline functionality with Hive
- [ ] Implement data synchronization logic
- [ ] Add connectivity detection
- [ ] Optimize image loading and caching
- [ ] Performance profiling and optimization

**Week 11-12:**
- [ ] Polish UI/UX based on feedback
- [ ] Add animations and transitions
- [ ] Implement accessibility features
- [ ] Final testing and bug fixes
- [ ] Prepare app for Play Store submission

### Banchamlak Golla (Mobile Developer & QA)

**Week 1-2:**
- [ ] Setup testing framework (Flutter test, Mockito)
- [ ] Create test data generators and mock services
- [ ] Build onboarding screens
- [ ] Implement user profile screen
- [ ] Create settings screen

**Week 3-4:**
- [ ] Build crop management interface
- [ ] Implement crop selection and planting date picker
- [ ] Create notification center UI
- [ ] Build notification preferences screen
- [ ] Write unit tests for auth module

**Week 5-6:**
- [ ] Implement sensor history screen with charts
- [ ] Build disease detail screen with image gallery
- [ ] Create disease reporting functionality
- [ ] Implement photo upload with camera/gallery
- [ ] Write unit tests for farm module

**Week 7-8:**
- [ ] Build recommendation action list UI
- [ ] Implement recommendation completion tracking
- [ ] Create farm statistics and analytics screens
- [ ] Build help and support screens
- [ ] Write widget tests for key screens

**Week 9-10:**
- [ ] Implement multi-language support (Amharic, Oromo, English)
- [ ] Add RTL layout support (if needed)
- [ ] Build error handling and retry mechanisms
- [ ] Create offline mode indicators
- [ ] Write integration tests for main user flows

**Week 11-12:**
- [ ] Conduct comprehensive QA testing
- [ ] User acceptance testing coordination
- [ ] Bug tracking and resolution
- [ ] Accessibility testing (screen reader, contrast)
- [ ] Create user manual and in-app help content
- [ ] Final regression testing

### Shared Responsibilities (Both Mobile Developers)

**Code Review:**
- Daily code reviews of each other's pull requests
- Ensure coding standards and best practices
- Knowledge sharing sessions

**Documentation:**
- Widget documentation (DartDoc comments)
- Screen flow diagrams
- API integration documentation
- Troubleshooting guides

**Testing:**
- Achieve >75% code coverage
- Test on multiple Android devices (different screen sizes)
- Test on various Android versions (8.0, 9.0, 10, 11, 12+)
- Test with different network conditions (2G, 3G, 4G, offline)

---

## Appendix A: Widget Library Components

### Custom Widgets

1. **AppButton** - Primary, secondary, outline variants
2. **AppTextField** - With validation and error states
3. **AppCard** - Elevated card with consistent styling
4. **LoadingIndicator** - Circular progress with optional message
5. **EmptyState** - Illustration + message + action button
6. **ErrorWidget** - Error message with retry button
7. **SensorGauge** - Circular gauge for sensor readings
8. **PriorityBadge** - Color-coded priority indicator
9. **StatusChip** - Farm/crop status chips
10. **WeatherIcon** - Weather condition icons

---

## Appendix B: Performance Benchmarks

| Metric | Target | Measurement |
|--------|--------|-------------|
| App Launch Time | < 3s | Time to interactive |
| Screen Transition | < 300ms | Navigation animation |
| API Response Handling | < 500ms | Data to UI render |
| Image Loading | < 2s | Network to display |
| List Scroll FPS | 60 FPS | Flutter DevTools |
| Memory Usage | < 200MB | Peak usage |
| APK Size | < 50MB | Release build |

---

## Appendix C: Accessibility Checklist

- [ ] Minimum touch target size: 48x48 dp
- [ ] Color contrast ratio: 4.5:1 (text), 3:1 (UI elements)
- [ ] Screen reader support (TalkBack/VoiceOver)
- [ ] Semantic labels for all interactive elements
- [ ] Focus indicators for keyboard navigation
- [ ] Text scaling support (up to 200%)
- [ ] No information conveyed by color alone
- [ ] Alternative text for all images
- [ ] Form field labels and hints
- [ ] Error messages clearly announced

---

**End of Frontend Design Document**

---

**Prepared by:**  
Alen Biruk (CTC-2176-26) - Mobile Lead Developer  
Banchamlak Golla (CTC-2952-26) - Mobile Developer & QA Lead  

**Review Date:** ___________  
**Approval:** ___________



---

## 14. Role-Based User Interface Design

### 14.1 Role Selection During Registration

**Enhanced Registration Flow:**

1. **Role Selection Screen** (after phone verification)
   - Role cards with descriptions:
     - **Farmer**: Manage your own farms and get farming recommendations
     - **Extension Officer**: Support farmers in your kebele
     - **Woreda Expert**: Oversee agricultural activities in your woreda
     - **Regional Specialist**: Coordinate regional agriculture programs
   - Note: Official roles require approval

2. **Location Selection Screen**
   - Cascading dropdowns:
     - Region → Zone → Woreda → Kebele
   - Auto-complete search for easier selection
   - Display in selected language

### 14.2 Extension Officer Interface

#### Dashboard Additions
**Path:** `/officer/dashboard`

**Components:**
- **Assigned Farmers Summary**
  - Total farmers count
  - Active today count
  - Farmers with critical alerts
  
- **Kebele Health Map**
  - Visual map showing all farms
  - Color-coded by health status
  - Tap to view farm details

- **Quick Actions**
  - Send Advisory
  - View Pending Alerts
  - Assign Sensor
  - Generate Report

#### Farmer Management Screen
**Path:** `/officer/farmers`

**Components:**
- Search and filter farmers
- Farmer list with:
  - Name and contact
  - Number of farms
  - Health score
  - Last active
  - Active alerts badge
- Tap to view farmer details

#### Farmer Detail Screen
**Path:** `/officer/farmers/:farmerId`

**Tabs:**
1. **Overview**
   - Contact information
   - Farms list with health scores
   - Recent activity timeline

2. **Farms & Crops**
   - All farmer's farms
   - Sensor data access
   - Recommendations history

3. **Communication**
   - Send individual advisory
   - Call/SMS buttons
   - Message history

#### Send Advisory Screen
**Path:** `/officer/send-advisory`

**Form Fields:**
- Advisory title
- Message body (text area)
- Upload image (optional)
- Priority selector (Normal/Urgent)
- Target audience:
  - All assigned farmers
  - By crop type
  - Individual farmers (multi-select)
- Delivery method (Push/SMS/Both)
- Schedule option (now or future date/time)

### 14.3 Woreda Expert Interface

#### Dashboard
**Path:** `/woreda/dashboard`

**Sections:**
1. **Woreda Overview**
   - Total farmers, farms, kebeles
   - Extension officers count
   - Active sensors
   - System adoption rate

2. **Kebele Comparison**
   - Table/chart comparing all kebeles
   - Metrics: farmers, farms, health score, alerts

3. **Resource Management**
   - Sensor requests (pending/approved)
   - Extension officer assignments
   - Training programs schedule

4. **Disease Outbreak Map**
   - Woreda-wide disease tracking
   - Hotspot indicators
   - Affected crop types

#### Extension Officers Management
**Path:** `/woreda/officers`

**Features:**
- List all extension officers
- View officer's assigned farmers
- Reassign farmers between officers
- Performance metrics per officer
- Approve new officer registrations

#### Analytics & Reports
**Path:** `/woreda/analytics`

**Tabs:**
1. **Performance Metrics**
   - Crop yield trends
   - Water efficiency
   - Disease prevention success rate

2. **Resource Allocation**
   - Sensor distribution map
   - Fertilizer usage
   - Advisory reach

3. **Comparative Analysis**
   - Kebele benchmarking
   - Best practices identification

4. **Export Reports**
   - Select date range
   - Choose metrics
   - Export as PDF/Excel

### 14.4 Regional Specialist Interface

#### Dashboard
**Path:** `/regional/dashboard`

**Components:**
1. **Regional Summary**
   - Total woredas, farmers, farms
   - Regional health score
   - Policy implementation status

2. **Woreda Performance Matrix**
   - Grid showing all woredas
   - Color-coded performance
   - Drill-down to woreda details

3. **Regional Trends**
   - Crop production trends
   - Climate impact analysis
   - Disease outbreak patterns

4. **Training & Development**
   - Training programs calendar
   - Participation rates
   - Impact assessment

#### Policy Management
**Path:** `/regional/policies`

**Features:**
- Create regional policies
- Crop recommendations by zone
- Resource allocation guidelines
- Broadcast to all woredas

### 14.5 National Administrator Interface

#### Dashboard
**Path:** `/admin/dashboard`

**Comprehensive System Overview:**
- National statistics
- Regional comparison
- System health monitoring
- User growth analytics

#### User Management
**Path:** `/admin/users`

**Features:**
- View all users (with filters)
- Approve/reject official role requests
- User activity monitoring
- Role modification
- Deactivate accounts

#### System Configuration
**Path:** `/admin/settings`

**Settings:**
- Manage disease database
- Configure alert thresholds
- Set system-wide notifications
- Manage Ethiopian locations database
- API rate limits
- Maintenance mode

### 14.6 Shared Components Across Roles

#### Location Hierarchy Selector
```dart
class LocationSelector extends StatefulWidget {
  final String? initialRegion;
  final String? initialZone;
  final String? initialWoreda;
  final String? initialKebele;
  final Function(LocationData) onSelected;
  
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        DropdownButton<String>(
          label: 'Region',
          items: regions,
          onChanged: (region) => loadZones(region),
        ),
        if (selectedRegion != null)
          DropdownButton<String>(
            label: 'Zone',
            items: zones,
            onChanged: (zone) => loadWoredas(zone),
          ),
        if (selectedZone != null)
          DropdownButton<String>(
            label: 'Woreda',
            items: woredas,
            onChanged: (woreda) => loadKebeles(woreda),
          ),
        if (selectedWoreda != null && requireKebele)
          DropdownButton<String>(
            label: 'Kebele',
            items: kebeles,
            onChanged: onSelected,
          ),
      ],
    );
  }
}
```

#### Role Badge Widget
```dart
class RoleBadge extends StatelessWidget {
  final String role;
  
  Color _getRoleColor() {
    switch (role) {
      case 'farmer': return Colors.green;
      case 'extension_officer': return Colors.blue;
      case 'woreda_expert': return Colors.orange;
      case 'regional_specialist': return Colors.purple;
      case 'national_admin': return Colors.red;
      default: return Colors.grey;
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: _getRoleColor().withOpacity(0.1),
        border: Border.all(color: _getRoleColor()),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Text(
        role.replaceAll('_', ' ').toUpperCase(),
        style: TextStyle(
          color: _getRoleColor(),
          fontSize: 10,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}
```

### 14.7 Navigation Structure by Role

**Farmer (5 tabs):**
1. Home - Dashboard
2. Farms - Farm management
3. Sensors - Sensor data
4. Weather - Weather forecasts
5. More - Profile, disease library, settings

**Extension Officer (5 tabs):**
1. Home - Officer dashboard
2. Farmers - Assigned farmers
3. Advisories - Send/view advisories
4. Analytics - Kebele analytics
5. More - Profile, reports, settings

**Woreda Expert (5 tabs):**
1. Home - Woreda dashboard
2. Officers - Manage extension officers
3. Analytics - Woreda analytics
4. Resources - Sensor requests, training
5. More - Reports, settings

**Regional Specialist (5 tabs):**
1. Home - Regional dashboard
2. Woredas - Woreda overview
3. Analytics - Regional analytics
4. Policies - Regional policies
5. More - Reports, settings

**National Admin (5 tabs):**
1. Dashboard - System overview
2. Users - User management
3. Analytics - National statistics
4. Settings - System configuration
5. Reports - Comprehensive reports

### 14.8 Additional State Management for Roles

```dart
// providers/role_provider.dart
final currentUserRoleProvider = Provider<UserRole>((ref) {
  final authState = ref.watch(authProvider);
  return authState.maybeWhen(
    authenticated: (user) => user.role,
    orElse: () => UserRole.farmer,
  );
});

final jurisdictionProvider = Provider<Jurisdiction>((ref) {
  final authState = ref.watch(authProvider);
  return authState.maybeWhen(
    authenticated: (user) => Jurisdiction(
      region: user.region,
      zone: user.zone,
      woreda: user.woreda,
      kebele: user.kebele,
    ),
    orElse: () => null,
  );
});

final assignedFarmersProvider = FutureProvider.autoDispose<List<User>>((ref) async {
  final role = ref.watch(currentUserRoleProvider);
  
  if (role != UserRole.extensionOfficer) {
    return [];
  }
  
  final repository = ref.read(userRepositoryProvider);
  return repository.getAssignedFarmers();
});
```

### 14.9 Updated Task Assignments

#### Alen Biruk (Mobile Lead)

**Additional Role-Based Tasks:**
- [ ] Implement role-based navigation (Week 3)
- [ ] Build location hierarchy selector component (Week 3)
- [ ] Create extension officer dashboard (Week 5-6)
- [ ] Develop advisory creation and sending interface (Week 6)
- [ ] Implement farmer management screens (Week 7)
- [ ] Build woreda expert analytics dashboard (Week 8)

#### Banchamlak Golla (Mobile Developer)

**Additional Role-Based Tasks:**
- [ ] Create role selection screens (Week 3)
- [ ] Build approval pending screen (Week 4)
- [ ] Implement regional specialist interface (Week 7)
- [ ] Create national admin dashboard (Week 8)
- [ ] Build user management screens (Week 9)
- [ ] Test role-based access control (Week 10-11)

---

## 15. Final Documentation Summary

### Complete Feature Set

**Core Features:**
✅ Multi-role user system (Farmer, Extension Officer, Woreda Expert, Regional Specialist, National Admin)  
✅ Ethiopian administrative hierarchy (Region → Zone → Woreda → Kebele)  
✅ Role-based access control with jurisdiction filtering  
✅ Farm and crop management  
✅ IoT sensor integration and monitoring  
✅ Real-time weather intelligence  
✅ Disease risk detection and alerts  
✅ Smart recommendation engine  
✅ Advisory system for extension officers  
✅ Multi-level analytics dashboards  
✅ Comprehensive reporting system  
✅ Multi-language support (Amharic, Oromo, English)  
✅ Offline-first architecture  
✅ Push notifications and SMS fallback  

**Out of Scope for MVP:**
❌ USSD access (planned for Phase 2)  
❌ AI-powered yield prediction  
❌ Satellite imagery integration  
❌ Voice interface  
❌ Payment gateway  
❌ Marketplace functionality  

### Documentation Deliverables

1. ✅ **Requirements Specification** (~45 pages)
   - Complete functional and non-functional requirements
   - Role-based access control specifications
   - Ethiopian administrative hierarchy
   - 16-week implementation timeline
   - Detailed task assignments

2. ✅ **Backend Design Document** (~55 pages)
   - Complete API specification with role-based endpoints
   - Database schema with RBAC implementation
   - Location hierarchy database design
   - Advisory system architecture
   - Analytics and reporting services
   - Backend task assignments

3. ✅ **Frontend Design Document** (~50 pages)
   - Complete mobile app architecture
   - Role-specific UI/UX designs
   - Location hierarchy selector components
   - Multi-dashboard implementations
   - State management with roles
   - Frontend task assignments

4. ✅ **Documentation Index**
   - Project overview
   - Team structure
   - Timeline and milestones
   - Success metrics

**Total Documentation:** ~150 pages of professional, implementation-ready specifications

---

**Project:** AgriEtech - Agricultural Decision Support System  
**Team:** Abraham Amogne, Abenezer Endrias, Alen Biruk, Banchamlak Golla, Abinu Mathewos  
**Timeline:** 16 weeks (4 months)  
**Target:** Ethiopian smallholder farmers and agricultural officials  

---

**End of Frontend Design Document**

**Prepared by:**  
Alen Biruk (CTC-2176-26) - Mobile Lead Developer  
Banchamlak Golla (CTC-2952-26) - Mobile Developer & QA Lead  

**Review Date:** ___________  
**Approval:** ___________


---

## 16. AI Analytics & Predictive Intelligence UI

### 16.1 AI-Powered Features Overview

**Farmer Interface:**
- Yield predictions for current crops
- Smart irrigation recommendations (auto-scheduling)
- Historical weather trends visualization
- Soil health trend analysis
- Disease outbreak predictions
- Seasonal planning advisor

**Official Interface (Extension Officers+):**
- Regional trend analysis
- Comparative farm performance
- Predictive outbreak mapping
- Resource optimization recommendations
- Best practices identification

### 16.2 Yield Prediction Screen

**Path:** `/predictions/yield/:cropId`

**Components:**

1. **Prediction Card**
   - Large number: Predicted yield (kg/hectare)
   - Confidence indicator (progress bar + percentage)
   - Comparison: "8% above your average"
   - Target harvest date
   - Last updated timestamp

2. **Prediction Breakdown**
   - Contributing factors (horizontal bar chart)
     - Rainfall: +35%
     - Soil health: +15%
     - Weather forecast: +25%
     - Historical performance: +15%
     - Crop stage: +10%
   
3. **Historical Comparison**
   - Line chart showing past 5 years yields
   - Current prediction overlay
   - Confidence interval (shaded area)

4. **Confidence Interval**
   - Best case: 2,700 kg/hectare
   - Most likely: 2,450 kg/hectare  
   - Worst case: 2,200 kg/hectare

5. **Action Recommendations**
   - "On track for good yield"
   - "Continue current practices"
   - "Monitor nitrogen levels closely"

### 16.3 Smart Irrigation Dashboard

**Path:** `/irrigation/smart-schedule`

**Components:**

1. **Current Status Card**
   - Soil moisture gauge (circular)
   - Status: "Adequate" (green)
   - Next irrigation: "In 2 days"
   - Weather-adjusted schedule

2. **7-Day Irrigation Schedule**
   - Calendar view with irrigation markers
   - Rain forecast overlay
   - Recommended vs actual (if tracking enabled)
   - Water amount per session

3. **Prediction Graph**
   - Line chart: Soil moisture prediction
   - Threshold line (critical level)
   - Rain events (blue bars)
   - Recommended irrigation points (water drop icons)

4. **Water Savings Tracker**
   - This week: 20% savings vs fixed schedule
   - Total savings this season: 1,500 L
   - Cost savings: 45 ETB

5. **Smart Actions**
   - "Set up automatic reminders"
   - "View irrigation history"
   - "Adjust crop water preferences"

### 16.4 Historical Trends Dashboard

**Path:** `/analytics/trends`

**Tabs:**

#### Tab 1: Weather Trends
1. **Rainfall Trends**
   - Multi-year bar chart (annual totals)
   - Trend line with percentage change
   - Seasonal breakdown (Belg vs Kiremt)
   - Next season prediction

2. **Temperature Trends**
   - Line chart (5-year average temperatures)
   - Trend indicator (rising +0.8°C)
   - Extreme events timeline
   - Heat/frost day counts

3. **Season Comparison**
   - Table comparing last 5 seasons:
     - Onset date
     - End date
     - Total rainfall
     - Average temperature

#### Tab 2: Soil Health Trends
1. **NPK Trends**
   - Three line charts (N, P, K over time)
   - Optimal range bands (green zone)
   - Current status indicators
   - Depletion/improvement rates

2. **Soil Moisture Patterns**
   - Heatmap calendar (daily moisture levels)
   - Retention capacity trend
   - Efficiency score

3. **Health Score Evolution**
   - Line chart (overall soil health 0-100)
   - Component breakdown
   - Comparison to regional average

#### Tab 3: Productivity Trends
1. **Yield History**
   - Bar chart (yield per season, per crop)
   - Trend lines
   - Best/worst performing crops
   - Yield gap analysis

2. **Input Efficiency**
   - Fertilizer ROI trend
   - Water use efficiency
   - Cost per kg produced

3. **Success Patterns**
   - "Your best yields came from:"
   - Planting date patterns
   - Weather condition patterns
   - Practice correlation analysis

### 16.5 Predictive Disease Risk Screen

**Path:** `/diseases/forecast`

**Components:**

1. **Risk Timeline (14 days)**
   - Horizontal timeline with risk levels
   - Color-coded days (green/yellow/orange/red)
   - Disease icons on high-risk days
   - Tap day for details

2. **Active Risk Alerts**
   - Card per disease risk
   - Disease name + affected crop
   - Risk level badge
   - Peak risk date
   - Prevention deadline countdown
   
3. **Detailed Risk Card**
   - Risk score: 72/100
   - Risk breakdown (pie chart):
     - Weather suitability: 85%
     - Historical pattern: 75%
     - Crop vulnerability: 65%
     - Regional outbreak: 50%
   
4. **Historical Context**
   - "This disease occurred 2 times last year"
   - "Typical onset: August 10-15"
   - Timeline showing past occurrences

5. **Prevention Plan**
   - Prioritized action list:
     - Critical: "Apply fungicide before Aug 10"
     - High: "Inspect leaves daily starting Aug 8"
   - Estimated cost vs potential loss
   - Shopping list (inputs needed)

6. **Similar Years Comparison**
   - "Conditions similar to 2023, 2021, 2019"
   - "In 2023, early treatment reduced loss by 80%"

### 16.6 Seasonal Planning Advisor

**Path:** `/planning/season/:year`

**Components:**

1. **Season Overview**
   - Selected season: Kiremt 2027
   - Forecast confidence: 82%
   - Overall suitability: Good

2. **Optimal Planting Window**
   - Calendar view with highlighted dates
   - Recommended: June 10-25
   - Confidence band visualization
   - Historical success rate: 85%

3. **Crop Recommendations**
   - Ranked cards:
     - Crop name + image
     - Suitability score (0-100)
     - Expected yield
     - Risk level
     - Market outlook
   - Tap for full analysis

4. **Seasonal Forecast**
   - Rainfall prediction (vs average)
   - Temperature outlook
   - Dry spell risk
   - Season length estimate

5. **Action Timeline**
   - Gantt chart / timeline view
   - Key milestones:
     - May 25: Prepare seedbed
     - June 10: Begin planting
     - July 1: First fertilizer
     - September 20: Watch for harvest
   - Reminders setup option

### 16.7 Comparative Analytics Screen

**Path:** `/analytics/compare`

**Components:**

1. **Your Performance Summary**
   - Overall score: 78/100
   - Percentile: "Top 35% in your woreda"
   - Strengths: Water efficiency, soil health
   - Opportunities: Yield optimization

2. **Performance Comparison Cards**
   - Yield Performance
     - Your farm: 2,450 kg/ha
     - Group average: 2,280 kg/ha
     - Top performer: 2,650 kg/ha
     - Your position: +7.5% above average
     - Percentile indicator (visual scale)
   
   - Water Efficiency
   - Input Costs
   - Soil Health

3. **Best Practices Identified**
   - Practice cards with:
     - Practice name
     - Adoption rate (% of top farms)
     - Impact measurement
     - Your status (adopted/not adopted)
     - "Learn More" button

4. **Improvement Potential**
   - Gap analysis chart
   - "You could gain 200 kg (3,000 ETB)"
   - Top 3 recommended actions
   - Success stories from similar farms

### 16.8 AI Insights Feed

**Location:** Dashboard home screen

**Components:**

1. **Daily AI Insight Card**
   - One key insight per day
   - Examples:
     - "Your soil moisture is declining faster than usual. Check irrigation system."
     - "Weather pattern this week matches your best yields from 2024."
     - "3 farms in your area reported wheat rust. Check your crops."
   - Icon + short text + "Learn More"

2. **Proactive Recommendations**
   - "Based on your data, we recommend:"
   - Time-sensitive actions
   - Prioritized by urgency and impact

3. **Pattern Recognition Alerts**
   - "We noticed a pattern:"
   - Unusual trends detection
   - Comparison to historical norms

### 16.9 Data Visualization Components

#### Multi-Year Trend Chart
```dart
class MultiYearTrendChart extends StatelessWidget {
  final List<YearlyData> data;
  final String metric;
  
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Chart title with trend indicator
        Row(
          children: [
            Text(metric, style: headline2),
            SizedBox(width: 8),
            TrendIndicator(
              direction: data.trendDirection,
              changePercent: data.changePercent,
            ),
          ],
        ),
        
        SizedBox(height: 16),
        
        // Line chart with multiple years
        SizedBox(
          height: 200,
          child: LineChart(
            LineChartData(
              lineBarsData: [
                // Historical data line
                LineChartBarData(
                  spots: data.historical.map((d) => 
                    FlSpot(d.year.toDouble(), d.value)
                  ).toList(),
                  color: Colors.blue,
                  dotData: FlDotData(show: true),
                ),
                // Prediction line (dashed)
                LineChartBarData(
                  spots: data.predictions.map((d) => 
                    FlSpot(d.year.toDouble(), d.value)
                  ).toList(),
                  color: Colors.orange,
                  dashArray: [5, 5],
                  dotData: FlDotData(show: true),
                ),
                // Confidence interval (filled area)
                LineChartBarData(
                  spots: data.confidenceUpper.map((d) => 
                    FlSpot(d.year.toDouble(), d.value)
                  ).toList(),
                  color: Colors.orange.withOpacity(0.1),
                  belowBarData: BarAreaData(
                    show: true,
                    color: Colors.orange.withOpacity(0.1),
                  ),
                ),
              ],
            ),
          ),
        ),
        
        // Legend
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            LegendItem(color: Colors.blue, label: 'Historical'),
            SizedBox(width: 16),
            LegendItem(color: Colors.orange, label: 'Predicted'),
          ],
        ),
      ],
    );
  }
}
```

#### Confidence Indicator Widget
```dart
class ConfidenceIndicator extends StatelessWidget {
  final double confidence; // 0-100
  
  @override
  Widget build(BuildContext context) {
    Color color;
    String label;
    
    if (confidence >= 80) {
      color = Colors.green;
      label = 'High Confidence';
    } else if (confidence >= 60) {
      color = Colors.orange;
      label = 'Medium Confidence';
    } else {
      color = Colors.red;
      label = 'Low Confidence';
    }
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Prediction Confidence', style: caption),
        SizedBox(height: 4),
        Row(
          children: [
            Expanded(
              child: LinearProgressIndicator(
                value: confidence / 100,
                backgroundColor: color.withOpacity(0.2),
                valueColor: AlwaysStoppedAnimation<Color>(color),
                minHeight: 8,
              ),
            ),
            SizedBox(width: 8),
            Text('${confidence.round()}%', style: bodyBold),
          ],
        ),
        SizedBox(height: 4),
        Text(label, style: caption.copyWith(color: color)),
      ],
    );
  }
}
```

### 16.10 State Management for AI Features

```dart
// providers/ai_analytics_provider.dart
final yieldPredictionProvider = FutureProvider.autoDispose.family<
  YieldPrediction,
  String
>((ref, cropId) async {
  final repository = ref.read(aiRepositoryProvider);
  return repository.getYieldPrediction(cropId);
});

final weatherTrendsProvider = FutureProvider.autoDispose.family<
  WeatherTrends,
  TrendQuery
>((ref, query) async {
  final repository = ref.read(aiRepositoryProvider);
  return repository.getWeatherTrends(
    farmId: query.farmId,
    years: query.years,
  );
});

final smartIrrigationProvider = FutureProvider.autoDispose.family<
  IrrigationSchedule,
  String
>((ref, farmId) async {
  final repository = ref.read(aiRepositoryProvider);
  return repository.getSmartIrrigationSchedule(farmId);
});

final diseaseForecostProvider = FutureProvider.autoDispose.family<
  DiseaseForecast,
  String
>((ref, farmId) async {
  final repository = ref.read(aiRepositoryProvider);
  return repository.getDiseaseForecast(farmId);
});

// Refresh provider for real-time updates
final analyticsRefreshProvider = StateProvider<int>((ref) => 0);

// Auto-refresh every 5 minutes for predictions
ref.listen(analyticsRefreshProvider, (previous, next) {
  Timer.periodic(Duration(minutes: 5), (_) {
    ref.invalidate(yieldPredictionProvider);
    ref.invalidate(smartIrrigationProvider);
  });
});
```

### 16.11 Additional Frontend Tasks

#### Alen Biruk (Mobile Lead)
**AI Features Development:**
- [ ] Build yield prediction screen (Week 8)
- [ ] Create smart irrigation dashboard (Week 8-9)
- [ ] Implement historical trends charts (Week 9)
- [ ] Develop disease forecast interface (Week 9-10)
- [ ] Build comparative analytics screens (Week 10)
- [ ] Create seasonal planning advisor (Week 10-11)

#### Banchamlak Golla (Mobile Developer)
**AI UI Components:**
- [ ] Develop trend visualization components (Week 8)
- [ ] Build confidence indicator widgets (Week 8)
- [ ] Create prediction card components (Week 9)
- [ ] Implement interactive charts library integration (Week 9)
- [ ] Build AI insights feed (Week 10)
- [ ] Test AI feature UX with farmers (Week 11)

---

## 17. Final Feature Summary

### Complete Feature Set with AI/ML

**Core Features:**
✅ Multi-role user system (5 roles)  
✅ Ethiopian administrative hierarchy  
✅ Role-based access control  
✅ Farm and crop management  
✅ IoT sensor integration  
✅ Real-time weather intelligence  
✅ Disease detection and alerts  
✅ Smart recommendation engine  
✅ Multi-level analytics dashboards  
✅ Advisory system  
✅ Multi-language support  
✅ Offline-first architecture  

**AI & Predictive Features:**  
✅ **Yield Prediction** - ML-powered harvest forecasting  
✅ **Smart Irrigation** - Predictive watering schedules  
✅ **Weather Trends** - Historical analysis + long-range forecasting  
✅ **Soil Health Trends** - NPK depletion tracking  
✅ **Disease Forecasting** - 14-day outbreak predictions  
✅ **Fertilizer Optimization** - Data-driven nutrient management  
✅ **Seasonal Planning** - AI-powered planting calendar  
✅ **Comparative Analytics** - Benchmarking vs similar farms  
✅ **Pattern Recognition** - Success factor identification  
✅ **Anomaly Detection** - Unusual event alerts  
✅ **Continuous Learning** - Model improvement from outcomes  

---

**End of AI/ML Frontend Design Document**

**Prepared by:**  
Alen Biruk (CTC-2176-26) - Mobile Lead Developer  
Banchamlak Golla (CTC-2952-26) - Mobile Developer & QA Lead  

**AI/ML Features:**  
Abenezer Endrias (CTC-1826-26) - ML Architecture & Data Analytics  

**Review Date:** ___________  
**Approval:** ___________
