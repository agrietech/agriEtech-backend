# ESP32 IoT Sensor Integration Guide

**Version:** 1.0.0  
**Last Updated:** August 2026  
**Purpose:** Complete guide for integrating ESP32-based agricultural sensors with AgriEtech backend

---

## Table of Contents

1. [Overview](#overview)
2. [Hardware Requirements](#hardware-requirements)
3. [Sensors Supported](#sensors-supported)
4. [Communication Architecture](#communication-architecture)
5. [ESP32 Firmware Setup](#esp32-firmware-setup)
6. [Backend API Integration](#backend-api-integration)
7. [MQTT Configuration](#mqtt-configuration)
8. [LoRaWAN Setup (Alternative)](#lorawan-setup-alternative)
9. [Data Flow Pipeline](#data-flow-pipeline)
10. [Calibration & Validation](#calibration--validation)
11. [Power Management](#power-management)
12. [Troubleshooting](#troubleshooting)

---

## 1. Overview

### What This Integration Provides

- **Real-Time Soil Monitoring**: Moisture, temperature, pH
- **Weather Micro-Climate**: Air temp, humidity, rainfall
- **Farm Automation**: Irrigation triggers based on thresholds
- **Satellite Validation**: Ground truth for MODIS/Sentinel-2 data
- **Predictive Alerts**: Combine IoT + satellite for early warnings

### System Architecture

```
┌─────────────┐      WiFi/LoRa       ┌──────────────┐      HTTPS
│   ESP32     │ ───────────────────> │   Gateway    │ ──────────────> AgriEtech
│  + Sensors  │    MQTT/CoAP         │  (MQTT/HTTP) │     REST API    Backend
└─────────────┘                      └──────────────┘
     Farm Plot                       On-Premise/Cloud              PostgreSQL
```

---

## 2. Hardware Requirements

### ESP32 Development Board

**Recommended Models:**
- **ESP32-WROOM-32D** (WiFi + Bluetooth, $4-6)
- **ESP32-S3** (WiFi 6, USB-OTG, $6-8)
- **Heltec WiFi LoRa 32 V3** (ESP32 + LoRa 868MHz, $15-20)

**Specifications:**
- 240MHz dual-core processor
- 520KB SRAM, 4MB Flash
- WiFi 802.11 b/g/n (2.4GHz)
- Bluetooth 4.2 BLE
- 34 GPIO pins
- 12-bit ADC (18 channels)
- Operating: 2.2V - 3.6V

### Sensors Compatible with ESP32

| Sensor | Purpose | Interface | Price | Link |
|--------|---------|-----------|-------|------|
| **Capacitive Soil Moisture v1.2** | Soil water content | Analog (0-3V) | $2 | [DFRobot](https://www.dfrobot.com/product-1385.html) |
| **DS18B20** | Soil/water temperature | 1-Wire digital | $1.50 | [Adafruit](https://www.adafruit.com/product/381) |
| **DHT22 (AM2302)** | Air temp + humidity | Digital (1-wire) | $5 | [Adafruit](https://www.adafruit.com/product/385) |
| **Tipping Bucket Rain Gauge** | Rainfall (mm) | Digital pulse | $10 | [SparkFun](https://www.sparkfun.com/products/8942) |
| **Gravity pH Sensor** | Soil pH | Analog (0-3V) | $30 | [DFRobot](https://www.dfrobot.com/product-1782.html) |
| **BH1750** | Light intensity (lux) | I2C | $3 | [Adafruit](https://www.adafruit.com/product/4681) |

### Power Supply Options

**Option 1: Solar + Battery (Recommended for Farms)**
- 5W Solar Panel (6V output) - $8
- TP4056 Li-ion Charger Module - $1
- 18650 Li-ion Battery (3000mAh) - $3
- MT3608 Step-up Booster (3.7V → 5V) - $1
- **Total Cost:** ~$13
- **Battery Life:** 7-14 days (deep sleep mode)

**Option 2: Mains Power (Development/Testing)**
- USB Micro/Type-C cable
- 5V 2A adapter

### Additional Components

```
- Waterproof Enclosure (IP65): $10-15
- Jumper Wires (F-F, M-F, M-M): $3
- Breadboard (for prototyping): $2
- PCB Terminal Blocks: $5
- Silica Gel Packs (moisture absorber): $2
```

**Total Hardware Cost per Node:** $50-70 (excluding solar)

---

## 3. Sensors Supported

### 3.1 Capacitive Soil Moisture Sensor

**Why Capacitive (Not Resistive)?**
- No metal corrosion (doesn't touch soil directly)
- Accurate in all soil types (clay, sand, loam)
- Long lifespan (5+ years)

**Wiring:**
```
Sensor VCC  →  ESP32 3.3V
Sensor GND  →  ESP32 GND
Sensor AOUT →  ESP32 GPIO34 (ADC1_CH6)
```

**Calibration:**
```cpp
// Air (dry): ~3000 ADC value
// Water (wet): ~1500 ADC value
int rawValue = analogRead(34);
float moisture = map(rawValue, 3000, 1500, 0, 100); // 0-100%
```

### 3.2 DS18B20 Temperature Sensor

**Features:**
- Waterproof probe (6mm diameter, 1m cable)
- -55°C to +125°C range (±0.5°C accuracy)
- Digital output (no ADC noise)

**Wiring:**
```
DS18B20 VCC (Red)    →  ESP32 3.3V
DS18B20 GND (Black)  →  ESP32 GND
DS18B20 Data (Yellow)→  ESP32 GPIO4 + 4.7kΩ pull-up to 3.3V
```

**Arduino Library:**
```cpp
#include <OneWire.h>
#include <DallasTemperature.h>

OneWire oneWire(4); // GPIO4
DallasTemperature sensors(&oneWire);

void setup() {
  sensors.begin();
}

float readSoilTemp() {
  sensors.requestTemperatures();
  return sensors.getTempCByIndex(0); // Celsius
}
```

### 3.3 DHT22 (Air Temperature + Humidity)

**Specifications:**
- Humidity: 0-100% RH (±2% accuracy)
- Temperature: -40°C to +80°C (±0.5°C)
- Sampling rate: 0.5Hz (once per 2 seconds)

**Wiring:**
```
DHT22 VCC  →  ESP32 5V
DHT22 GND  →  ESP32 GND
DHT22 Data →  ESP32 GPIO5 + 10kΩ pull-up to 5V
```

**Arduino Library:**
```cpp
#include <DHT.h>

#define DHTPIN 5
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

void setup() {
  dht.begin();
}

float readAirTemp() {
  return dht.readTemperature(); // Celsius
}

float readHumidity() {
  return dht.readHumidity(); // Percentage
}
```

### 3.4 Tipping Bucket Rain Gauge

**Mechanism:**
- Each tip = 0.2794mm rainfall (0.011 inches)
- Reed switch triggers on tip
- Count tips via interrupt

**Wiring:**
```
Rain Gauge Wire 1 →  ESP32 GPIO23
Rain Gauge Wire 2 →  ESP32 GND
```

**Arduino Code:**
```cpp
volatile int tipCount = 0;
const float MM_PER_TIP = 0.2794;

void IRAM_ATTR rainTipISR() {
  tipCount++;
}

void setup() {
  pinMode(23, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(23), rainTipISR, FALLING);
}

float getRainfallMm() {
  float rainfall = tipCount * MM_PER_TIP;
  tipCount = 0; // Reset counter
  return rainfall;
}
```

---


## 4. Communication Architecture

### WiFi vs LoRaWAN Comparison

| Factor | WiFi (ESP32) | LoRaWAN (Heltec) |
|--------|--------------|------------------|
| **Range** | 50-100m | 2-10km |
| **Power** | 80mA active, 10µA deep sleep | 40mA TX, 0.2µA sleep |
| **Data Rate** | 150 Mbps | 0.3-50 kbps |
| **Cost** | $4 (ESP32 only) | $15 (ESP32 + LoRa) |
| **Infrastructure** | WiFi router ($30) | LoRa gateway ($300) |
| **Best For** | Small farms (<1 hectare) | Large farms (10+ hectares) |

**Recommendation:** WiFi for pilot deployment, LoRaWAN for scale (100+ farms)

---

## 5. ESP32 Firmware Setup

### 5.1 Install Arduino IDE

**Download:** https://www.arduino.cc/en/software

**Install ESP32 Board Support:**
1. Open Arduino IDE
2. File → Preferences
3. Add to "Additional Board Manager URLs":
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
4. Tools → Board → Boards Manager → Search "ESP32" → Install

### 5.2 Install Required Libraries

**Via Arduino Library Manager (Tools → Manage Libraries):**
```
- WiFi (built-in)
- PubSubClient (MQTT client) by Nick O'Leary
- ArduinoJson by Benoit Blanchon (v6.21+)
- DHT sensor library by Adafruit
- DallasTemperature by Miles Burton
- OneWire by Paul Stoffregen
```

### 5.3 Complete ESP32 Firmware Code

**File:** `agrietech_sensor_node.ino`

```cpp
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <OneWire.h>
#include <DallasTemperature.h>

// ============ CONFIGURATION ============
// WiFi Credentials
const char* WIFI_SSID = "YourFarmWiFi";
const char* WIFI_PASSWORD = "YourPassword";

// MQTT Broker (AgriEtech Backend)
const char* MQTT_BROKER = "mqtt.agrietech.et"; // Or your server IP
const int MQTT_PORT = 1883;
const char* MQTT_USER = "agrietech_device";
const char* MQTT_PASSWORD = "your_mqtt_password"; // From backend .env

// Device Identification
const char* HARDWARE_ID = "SENSOR_ETH_001"; // Unique per device
const char* FARM_ID = "farm-uuid-from-backend";

// MQTT Topics
String TELEMETRY_TOPIC = "agrietech/sensors/" + String(HARDWARE_ID) + "/telemetry";
String COMMAND_TOPIC = "agrietech/sensors/" + String(HARDWARE_ID) + "/command";

// Sensor Pins
#define SOIL_MOISTURE_PIN 34  // ADC1_CH6
#define DHT_PIN 5
#define DS18B20_PIN 4
#define RAIN_GAUGE_PIN 23

// Sensor Configuration
#define DHTTYPE DHT22
DHT dht(DHT_PIN, DHTTYPE);
OneWire oneWire(DS18B20_PIN);
DallasTemperature ds18b20(&oneWire);

// Timing
const unsigned long SEND_INTERVAL = 600000; // 10 minutes (600,000 ms)
const unsigned long DEEP_SLEEP_DURATION = 600e6; // 10 minutes (microseconds)

// Rain gauge
volatile int rainTipCount = 0;
const float MM_PER_TIP = 0.2794;

// WiFi & MQTT Clients
WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

// ============ INTERRUPT HANDLER ============
void IRAM_ATTR rainTipISR() {
  rainTipCount++;
}

// ============ SETUP ============
void setup() {
  Serial.begin(115200);
  Serial.println("\n\n=== AgriEtech Sensor Node Starting ===");
  
  // Initialize sensors
  dht.begin();
  ds18b20.begin();
  pinMode(RAIN_GAUGE_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(RAIN_GAUGE_PIN), rainTipISR, FALLING);
  
  // Connect WiFi
  connectWiFi();
  
  // Connect MQTT
  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  mqttClient.setCallback(mqttCallback);
  connectMQTT();
  
  Serial.println("=== Setup Complete ===\n");
}

// ============ MAIN LOOP ============
void loop() {
  // Maintain MQTT connection
  if (!mqttClient.connected()) {
    connectMQTT();
  }
  mqttClient.loop();
  
  // Read and send telemetry
  sendTelemetry();
  
  // Sleep for 10 minutes (comment out for continuous operation)
  // Serial.println("Entering deep sleep for 10 minutes...");
  // ESP.deepSleep(DEEP_SLEEP_DURATION);
  
  delay(SEND_INTERVAL); // Alternative: stay awake, delay 10 min
}

// ============ WiFi CONNECTION ============
void connectWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);
  
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi Connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("Signal Strength: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    Serial.println("\nWiFi Connection FAILED!");
  }
}

// ============ MQTT CONNECTION ============
void connectMQTT() {
  while (!mqttClient.connected()) {
    Serial.print("Connecting to MQTT broker: ");
    Serial.println(MQTT_BROKER);
    
    if (mqttClient.connect(HARDWARE_ID, MQTT_USER, MQTT_PASSWORD)) {
      Serial.println("MQTT Connected!");
      mqttClient.subscribe(COMMAND_TOPIC.c_str());
      Serial.print("Subscribed to: ");
      Serial.println(COMMAND_TOPIC);
    } else {
      Serial.print("MQTT Connection FAILED, rc=");
      Serial.println(mqttClient.state());
      delay(5000);
    }
  }
}

// ============ MQTT CALLBACK (Commands from Backend) ============
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message received on topic: ");
  Serial.println(topic);
  
  // Parse JSON command
  StaticJsonDocument<256> doc;
  deserializeJson(doc, payload, length);
  
  String command = doc["command"];
  
  if (command == "ping") {
    Serial.println("Ping received, responding...");
    mqttClient.publish(TELEMETRY_TOPIC.c_str(), "{\"status\":\"online\"}");
  } else if (command == "calibrate") {
    Serial.println("Calibration command received");
    // Implement calibration logic
  }
}

// ============ READ SENSORS ============
float readSoilMoisture() {
  int rawValue = analogRead(SOIL_MOISTURE_PIN);
  // Calibration: Air = 3000, Water = 1500
  float moisture = map(rawValue, 3000, 1500, 0, 100);
  moisture = constrain(moisture, 0, 100);
  return moisture;
}

float readSoilTemperature() {
  ds18b20.requestTemperatures();
  float temp = ds18b20.getTempCByIndex(0);
  if (temp == DEVICE_DISCONNECTED_C) {
    Serial.println("DS18B20 Error: Device disconnected");
    return -999;
  }
  return temp;
}

float readAirTemperature() {
  float temp = dht.readTemperature();
  if (isnan(temp)) {
    Serial.println("DHT22 Error: Failed to read temperature");
    return -999;
  }
  return temp;
}

float readHumidity() {
  float humidity = dht.readHumidity();
  if (isnan(humidity)) {
    Serial.println("DHT22 Error: Failed to read humidity");
    return -999;
  }
  return humidity;
}

float readRainfall() {
  float rainfall = rainTipCount * MM_PER_TIP;
  rainTipCount = 0; // Reset counter
  return rainfall;
}

int readBatteryLevel() {
  // Read battery voltage via voltage divider on GPIO35
  // Example: 3.7V battery → 2.0V via divider → ADC
  int adcValue = analogRead(35);
  float voltage = (adcValue / 4095.0) * 3.3 * 2; // Assumes 2:1 divider
  int percentage = map(voltage * 100, 300, 420, 0, 100); // 3.0V-4.2V range
  return constrain(percentage, 0, 100);
}

// ============ SEND TELEMETRY ============
void sendTelemetry() {
  Serial.println("\n--- Reading Sensors ---");
  
  // Read all sensors
  float soilMoisture = readSoilMoisture();
  float soilTemp = readSoilTemperature();
  float airTemp = readAirTemperature();
  float humidity = readHumidity();
  float rainfall = readRainfall();
  int battery = readBatteryLevel();
  
  // Print to serial
  Serial.print("Soil Moisture: "); Serial.print(soilMoisture); Serial.println("%");
  Serial.print("Soil Temperature: "); Serial.print(soilTemp); Serial.println("°C");
  Serial.print("Air Temperature: "); Serial.print(airTemp); Serial.println("°C");
  Serial.print("Humidity: "); Serial.print(humidity); Serial.println("%");
  Serial.print("Rainfall: "); Serial.print(rainfall); Serial.println(" mm");
  Serial.print("Battery: "); Serial.print(battery); Serial.println("%");
  
  // Create JSON payload
  StaticJsonDocument<512> doc;
  doc["hardwareId"] = HARDWARE_ID;
  doc["farmId"] = FARM_ID;
  doc["timestamp"] = getISO8601Timestamp();
  doc["soilMoisture"] = round(soilMoisture * 10) / 10.0; // 1 decimal
  doc["soilTemp"] = round(soilTemp * 10) / 10.0;
  doc["ambientTemp"] = round(airTemp * 10) / 10.0;
  doc["humidity"] = round(humidity * 10) / 10.0;
  doc["rainfallMm"] = round(rainfall * 100) / 100.0; // 2 decimals
  doc["batteryLevel"] = battery;
  doc["rssi"] = WiFi.RSSI();
  
  // Serialize to JSON string
  char jsonBuffer[512];
  serializeJson(doc, jsonBuffer);
  
  // Publish to MQTT
  Serial.println("\n--- Publishing to MQTT ---");
  Serial.println(jsonBuffer);
  
  if (mqttClient.publish(TELEMETRY_TOPIC.c_str(), jsonBuffer)) {
    Serial.println("✓ Telemetry published successfully!");
  } else {
    Serial.println("✗ Telemetry publish FAILED!");
  }
  
  Serial.println("------------------------\n");
}

// ============ UTILITY FUNCTIONS ============
String getISO8601Timestamp() {
  // Note: ESP32 doesn't have RTC by default
  // In production, sync time via NTP
  // For now, return placeholder
  return "2026-08-19T08:30:00Z"; // Backend should use server time instead
}
```

### 5.4 Upload to ESP32

1. **Select Board:** Tools → Board → ESP32 Arduino → ESP32 Dev Module
2. **Select Port:** Tools → Port → COM3 (Windows) or /dev/ttyUSB0 (Linux)
3. **Upload:** Sketch → Upload (Ctrl+U)
4. **Monitor:** Tools → Serial Monitor (115200 baud)

**Expected Output:**
```
=== AgriEtech Sensor Node Starting ===
Connecting to WiFi: YourFarmWiFi
...........
WiFi Connected!
IP Address: 192.168.1.105
Signal Strength: -45 dBm
Connecting to MQTT broker: mqtt.agrietech.et
MQTT Connected!
Subscribed to: agrietech/sensors/SENSOR_ETH_001/command
=== Setup Complete ===

--- Reading Sensors ---
Soil Moisture: 45.2%
Soil Temperature: 22.3°C
Air Temperature: 26.1°C
Humidity: 65.2%
Rainfall: 0.0 mm
Battery: 87%

--- Publishing to MQTT ---
{"hardwareId":"SENSOR_ETH_001","farmId":"farm-uuid","timestamp":"2026-08-19T08:30:00Z",...}
✓ Telemetry published successfully!
```

---


## 6. Backend API Integration

### 6.1 Install MQTT Broker (Mosquitto)

**On Ubuntu Server:**
```bash
# Install Mosquitto
sudo apt update
sudo apt install mosquitto mosquitto-clients

# Enable service
sudo systemctl enable mosquitto
sudo systemctl start mosquitto

# Check status
sudo systemctl status mosquitto
```

**Configure Authentication:**
```bash
# Create password file
sudo mosquitto_passwd -c /etc/mosquitto/passwd agrietech_device

# Edit config
sudo nano /etc/mosquitto/mosquitto.conf
```

**Add to config:**
```
listener 1883
allow_anonymous false
password_file /etc/mosquitto/passwd

# Optional: TLS for production
# listener 8883
# cafile /etc/mosquitto/ca_certificates/ca.crt
# certfile /etc/mosquitto/certs/server.crt
# keyfile /etc/mosquitto/certs/server.key
```

**Restart Mosquitto:**
```bash
sudo systemctl restart mosquitto
```

### 6.2 Backend MQTT Subscriber (Node.js)

**File:** `src/ingestion/iotMqttSubscriber.js`

```javascript
const mqtt = require('mqtt');
const prisma = require('../config/db');
const logger = require('../utils/logger');

class IoTMqttSubscriber {
  constructor() {
    this.client = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
  }

  connect() {
    const options = {
      host: process.env.MQTT_BROKER_HOST || 'localhost',
      port: parseInt(process.env.MQTT_BROKER_PORT) || 1883,
      username: process.env.MQTT_USERNAME || 'agrietech_device',
      password: process.env.MQTT_PASSWORD || 'your_mqtt_password',
      clientId: `agrietech_backend_${Math.random().toString(16).slice(3)}`,
      clean: true,
      reconnectPeriod: 5000, // 5 seconds
      connectTimeout: 30000 // 30 seconds
    };

    logger.info('Connecting to MQTT broker...', { 
      host: options.host, 
      port: options.port 
    });

    this.client = mqtt.connect(options);

    // Connection successful
    this.client.on('connect', () => {
      logger.info('MQTT broker connected successfully');
      this.reconnectAttempts = 0;

      // Subscribe to all sensor telemetry topics
      const topic = 'agrietech/sensors/+/telemetry';
      this.client.subscribe(topic, (err) => {
        if (err) {
          logger.error('MQTT subscription failed', { topic, error: err.message });
        } else {
          logger.info('MQTT subscribed to topic', { topic });
        }
      });
    });

    // Message received
    this.client.on('message', async (topic, message) => {
      try {
        await this.handleTelemetry(topic, message);
      } catch (error) {
        logger.error('Error processing MQTT message', { 
          topic, 
          error: error.message 
        });
      }
    });

    // Connection error
    this.client.on('error', (error) => {
      logger.error('MQTT connection error', { error: error.message });
    });

    // Reconnecting
    this.client.on('reconnect', () => {
      this.reconnectAttempts++;
      logger.warn('MQTT reconnecting...', { 
        attempt: this.reconnectAttempts 
      });

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        logger.error('MQTT max reconnect attempts reached');
        this.client.end();
      }
    });

    // Disconnected
    this.client.on('close', () => {
      logger.warn('MQTT connection closed');
    });
  }

  async handleTelemetry(topic, message) {
    const payload = JSON.parse(message.toString());
    
    logger.info('Telemetry received', { 
      hardwareId: payload.hardwareId,
      topic 
    });

    // Validate payload
    if (!payload.hardwareId || !payload.farmId) {
      throw new Error('Invalid telemetry payload: missing hardwareId or farmId');
    }

    // Store in database
    const telemetry = await prisma.sensorTelemetry.create({
      data: {
        hardwareId: payload.hardwareId,
        farmId: payload.farmId,
        timestamp: new Date(payload.timestamp || Date.now()),
        soilMoisture: payload.soilMoisture,
        soilTemp: payload.soilTemp,
        ambientTemp: payload.ambientTemp,
        humidity: payload.humidity,
        rainfallMm: payload.rainfallMm,
        batteryLevel: payload.batteryLevel,
        rssi: payload.rssi,
        raw: payload // Store full JSON for debugging
      }
    });

    logger.info('Telemetry stored in database', { 
      id: telemetry.id,
      hardwareId: payload.hardwareId 
    });

    // Trigger alerts if thresholds exceeded
    await this.checkAlertThresholds(payload);

    return telemetry;
  }

  async checkAlertThresholds(payload) {
    const alerts = [];

    // Low soil moisture (drought stress)
    if (payload.soilMoisture < 20) {
      alerts.push({
        type: 'LOW_SOIL_MOISTURE',
        message: `Critical: Soil moisture at ${payload.soilMoisture}%. Irrigation needed.`
      });
    }

    // High soil temperature (heat stress)
    if (payload.soilTemp > 35) {
      alerts.push({
        type: 'HIGH_SOIL_TEMP',
        message: `Warning: Soil temperature at ${payload.soilTemp}°C. Root damage risk.`
      });
    }

    // Low battery
    if (payload.batteryLevel < 20) {
      alerts.push({
        type: 'LOW_BATTERY',
        message: `Sensor battery at ${payload.batteryLevel}%. Maintenance required.`
      });
    }

    // Create alerts in database
    for (const alert of alerts) {
      await prisma.sensorAlert.create({
        data: {
          hardwareId: payload.hardwareId,
          farmId: payload.farmId,
          alertType: alert.type,
          message: alert.message,
          severity: 'HIGH',
          timestamp: new Date()
        }
      });

      logger.warn('Sensor alert triggered', { 
        hardwareId: payload.hardwareId,
        type: alert.type 
      });
    }
  }

  disconnect() {
    if (this.client) {
      this.client.end();
      logger.info('MQTT client disconnected');
    }
  }
}

// Singleton instance
const mqttSubscriber = new IoTMqttSubscriber();

module.exports = mqttSubscriber;
```

### 6.3 Start MQTT Subscriber in Server

**File:** `src/server.js` (modify existing)

```javascript
const mqttSubscriber = require('./ingestion/iotMqttSubscriber');

// After database connection
prisma.$connect()
  .then(() => {
    logger.info('Database connected');
    
    // Start MQTT subscriber
    mqttSubscriber.connect();
  })
  .catch((err) => {
    logger.error('Database connection failed', err);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', () => {
  mqttSubscriber.disconnect();
  prisma.$disconnect();
});
```

### 6.4 REST API Endpoints

**File:** `src/modules/sensors/sensors.routes.js` (already exists)

**Available Endpoints:**

```
POST   /api/v1/sensors/register
  Body: { hardwareId, farmId, sensorType, location }
  Response: { success: true, sensor: {...} }

POST   /api/v1/sensors/telemetry
  Body: { hardwareId, farmId, soilMoisture, soilTemp, ... }
  Response: { success: true, telemetry: {...} }

GET    /api/v1/sensors/farm/:farmId
  Response: { success: true, sensors: [...] }

GET    /api/v1/sensors/:hardwareId/telemetry
  Query: ?from=2026-08-01&to=2026-08-19&limit=100
  Response: { success: true, telemetry: [...] }

GET    /api/v1/sensors/:hardwareId/latest
  Response: { success: true, telemetry: {...} }
```

**Test with curl:**
```bash
# Register new sensor
curl -X POST http://localhost:5000/api/v1/sensors/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "hardwareId": "SENSOR_ETH_001",
    "farmId": "farm-uuid-here",
    "sensorType": "SOIL_MOISTURE",
    "location": { "lat": 9.0320, "lng": 38.7469 }
  }'

# Get latest telemetry
curl http://localhost:5000/api/v1/sensors/SENSOR_ETH_001/latest \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 7. MQTT Configuration

### 7.1 Environment Variables

**Add to `.env`:**
```bash
# MQTT Broker
MQTT_BROKER_HOST=localhost      # Or mqtt.agrietech.et for production
MQTT_BROKER_PORT=1883
MQTT_USERNAME=agrietech_device
MQTT_PASSWORD=your_secure_mqtt_password_here

# MQTT TLS (Production)
MQTT_USE_TLS=false
MQTT_CA_CERT=/etc/mosquitto/ca_certificates/ca.crt
MQTT_CLIENT_CERT=/etc/mosquitto/certs/client.crt
MQTT_CLIENT_KEY=/etc/mosquitto/certs/client.key
```

### 7.2 MQTT Topics Structure

```
agrietech/
├── sensors/
│   ├── {hardwareId}/
│   │   ├── telemetry          (ESP32 → Backend)
│   │   ├── command            (Backend → ESP32)
│   │   ├── status             (ESP32 → Backend)
│   │   └── config             (Backend → ESP32)
│   └── alerts/
│       └── {farmId}           (Backend → Mobile App)
└── system/
    ├── health                 (All devices)
    └── logs                   (Debug messages)
```

### 7.3 MQTT Quality of Service (QoS)

| Level | Guarantee | Use Case |
|-------|-----------|----------|
| **QoS 0** | At most once (fire & forget) | Non-critical data (status updates) |
| **QoS 1** | At least once (may duplicate) | **Telemetry (recommended)** |
| **QoS 2** | Exactly once (slowest) | Critical commands (irrigation control) |

**ESP32 Configuration:**
```cpp
// Publish with QoS 1 (guaranteed delivery)
mqttClient.publish(TELEMETRY_TOPIC.c_str(), jsonBuffer, false); // retained=false
```

---

## 8. LoRaWAN Setup (Alternative)

### 8.1 Hardware Requirements

**ESP32 + LoRa Board:**
- **Heltec WiFi LoRa 32 V3** ($18) - https://heltec.org/project/wifi-lora-32-v3/
- Antenna: 868MHz (EU/Africa) or 915MHz (US)
- Range: 2-10km (line of sight)

**LoRaWAN Gateway:**
- **RAK7268 WisGate Edge** ($300) - https://store.rakwireless.com/products/rak7268-8-channel-indoor-lorawan-gateway
- Connects to internet via Ethernet/WiFi
- Forwards LoRa packets to backend

### 8.2 LoRaWAN Network Setup

**Option 1: The Things Network (Free, Cloud-Based)**

1. Register at https://www.thethingsnetwork.org/
2. Create application: "AgriEtech Sensors"
3. Add device (OTAA):
   - DevEUI: Auto-generated or from ESP32 MAC
   - AppEUI: From TTN console
   - AppKey: From TTN console
4. Configure webhook to forward to AgriEtech backend:
   ```
   POST https://api.agrietech.et/api/v1/sensors/lora-webhook
   Headers: Authorization: Bearer YOUR_WEBHOOK_TOKEN
   ```

**Option 2: ChirpStack (Self-Hosted)**

```bash
# Install ChirpStack on Ubuntu
sudo apt install chirpstack chirpstack-gateway-bridge

# Configure PostgreSQL
sudo -u postgres psql
CREATE DATABASE chirpstack;
\q

# Start services
sudo systemctl start chirpstack
sudo systemctl start chirpstack-gateway-bridge
```

Access web UI: http://localhost:8080 (admin/admin)

### 8.3 ESP32 LoRaWAN Firmware

**Library:** MCCI LoRaWAN LMIC - https://github.com/mcci-catena/arduino-lmic

```cpp
#include <lmic.h>
#include <hal/hal.h>
#include <SPI.h>

// LoRaWAN Credentials (from TTN or ChirpStack)
static const u1_t PROGMEM APPEUI[8] = { 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 };
static const u1_t PROGMEM DEVEUI[8] = { 0x01, 0x23, 0x45, 0x67, 0x89, 0xAB, 0xCD, 0xEF };
static const u1_t PROGMEM APPKEY[16] = { 0x00, 0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 
                                          0x88, 0x99, 0xAA, 0xBB, 0xCC, 0xDD, 0xEE, 0xFF };

// Pin mapping for Heltec LoRa 32 V3
const lmic_pinmap lmic_pins = {
  .nss = 8,
  .rxtx = LMIC_UNUSED_PIN,
  .rst = 12,
  .dio = {14, 13, LMIC_UNUSED_PIN},
};

void onEvent(ev_t ev) {
  if (ev == EV_TXCOMPLETE) {
    Serial.println("Transmission complete");
    // Enter deep sleep
    ESP.deepSleep(600e6); // 10 minutes
  }
}

void setup() {
  Serial.begin(115200);
  
  // LMIC init
  os_init();
  LMIC_reset();
  LMIC_setClockError(MAX_CLOCK_ERROR * 1 / 100);
  
  // Start joining network
  LMIC_startJoining();
}

void loop() {
  os_runloop_once();
}

void sendTelemetry() {
  // Read sensors (same as WiFi version)
  float soilMoisture = readSoilMoisture();
  float soilTemp = readSoilTemperature();
  
  // Pack into byte array (LoRa payload limit: 51 bytes)
  uint8_t payload[12];
  payload[0] = (uint8_t)(soilMoisture * 10); // 0-255 (0-25.5%)
  payload[1] = (uint8_t)((soilTemp + 50) * 10); // -50°C to +50°C
  // ... add other sensors
  
  // Send via LoRaWAN
  LMIC_setTxData2(1, payload, sizeof(payload), 0);
}
```

---


## 9. Data Flow Pipeline

### 9.1 End-to-End Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: Sensor Reading (ESP32)                                  │
├─────────────────────────────────────────────────────────────────┤
│ • ESP32 wakes from deep sleep (every 10 minutes)               │
│ • Reads 6 sensors: soil moisture, soil temp, air temp, etc.    │
│ • Connects to WiFi (takes ~3 seconds)                          │
│ • Creates JSON payload (512 bytes)                             │
│ • Time: ~5 seconds                                             │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: MQTT Transmission (ESP32 → Mosquitto)                  │
├─────────────────────────────────────────────────────────────────┤
│ • Connects to MQTT broker (mqtt.agrietech.et:1883)            │
│ • Publishes to: agrietech/sensors/SENSOR_ETH_001/telemetry    │
│ • QoS 1 (guaranteed delivery, may retry)                       │
│ • Time: ~1 second                                              │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: Backend Subscriber (Node.js)                           │
├─────────────────────────────────────────────────────────────────┤
│ • IoTMqttSubscriber receives message                           │
│ • Parses JSON payload                                          │
│ • Validates hardwareId, farmId                                 │
│ • Time: <10ms                                                  │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: Database Storage (PostgreSQL)                          │
├─────────────────────────────────────────────────────────────────┤
│ • Insert into SensorTelemetry table                            │
│ • Indexed by (hardwareId, timestamp)                           │
│ • Time-series data available for queries                       │
│ • Time: ~20ms                                                  │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: Alert Threshold Check (Node.js)                        │
├─────────────────────────────────────────────────────────────────┤
│ • IF soilMoisture < 20% → Create drought alert                │
│ • IF soilTemp > 35°C → Create heat stress alert               │
│ • IF batteryLevel < 20% → Create maintenance alert            │
│ • Time: ~5ms per check                                         │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 6: Farmer Notification (Multi-Channel)                    │
├─────────────────────────────────────────────────────────────────┤
│ • SMS via Africa's Talking (if critical)                       │
│ • Push notification via Firebase FCM (if app installed)        │
│ • WebSocket broadcast to mobile app (real-time)                │
│ • Time: ~1 second (SMS), <100ms (FCM/WebSocket)               │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 7: Deep Sleep (ESP32)                                     │
├─────────────────────────────────────────────────────────────────┤
│ • ESP32 enters deep sleep for 10 minutes                       │
│ • Power consumption: 10µA (battery lasts 7-14 days)           │
│ • Next wake: 10 minutes later                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 9.2 Database Schema

**Prisma Schema Addition:**

```prisma
// Add to prisma/schema.prisma

model Sensor {
  id           String   @id @default(uuid())
  hardwareId   String   @unique
  farmId       String
  farm         Farm     @relation(fields: [farmId], references: [id])
  sensorType   String   // SOIL_MOISTURE, AIR_TEMP, etc.
  status       String   @default("ACTIVE") // ACTIVE, INACTIVE, MAINTENANCE
  location     Json?    // { lat, lng }
  metadata     Json?    // Calibration data, firmware version
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  telemetry    SensorTelemetry[]
  alerts       SensorAlert[]
}

model SensorTelemetry {
  id            String   @id @default(uuid())
  hardwareId    String
  sensor        Sensor   @relation(fields: [hardwareId], references: [hardwareId])
  farmId        String
  timestamp     DateTime @default(now())
  
  // Sensor readings
  soilMoisture  Float?   // Percentage (0-100)
  soilTemp      Float?   // Celsius
  ambientTemp   Float?   // Celsius
  humidity      Float?   // Percentage (0-100)
  rainfallMm    Float?   // Millimeters
  batteryLevel  Int?     // Percentage (0-100)
  rssi          Int?     // WiFi signal strength (dBm)
  
  // Raw data
  raw           Json?    // Full JSON payload for debugging
  
  createdAt     DateTime @default(now())
  
  @@index([hardwareId, timestamp])
  @@index([farmId, timestamp])
}

model SensorAlert {
  id          String   @id @default(uuid())
  hardwareId  String
  sensor      Sensor   @relation(fields: [hardwareId], references: [hardwareId])
  farmId      String
  alertType   String   // LOW_SOIL_MOISTURE, HIGH_SOIL_TEMP, LOW_BATTERY
  message     String
  severity    String   // LOW, MODERATE, HIGH, CRITICAL
  timestamp   DateTime @default(now())
  resolved    Boolean  @default(false)
  resolvedAt  DateTime?
  
  @@index([farmId, resolved, timestamp])
}
```

**Run Migration:**
```bash
npx prisma migrate dev --name add_iot_sensors
npx prisma generate
```

---

## 10. Calibration & Validation

### 10.1 Soil Moisture Sensor Calibration

**Why Calibration is Critical:**
- Sensors vary ±10% out of box
- Soil type affects capacitance (clay ≠ sand)
- Deployment depth changes readings

**Calibration Procedure:**

```cpp
// Step 1: Air Calibration (0% moisture)
// Suspend sensor in air for 5 minutes
int airValue = analogRead(34);
Serial.print("Air Value (0%): ");
Serial.println(airValue); // Example: 3000

// Step 2: Water Calibration (100% moisture)
// Submerge sensor in water for 5 minutes
int waterValue = analogRead(34);
Serial.print("Water Value (100%): ");
Serial.println(waterValue); // Example: 1500

// Step 3: Update firmware with calibrated values
const int SOIL_MOISTURE_DRY = 3000;   // Your air reading
const int SOIL_MOISTURE_WET = 1500;   // Your water reading

float readSoilMoisture() {
  int rawValue = analogRead(34);
  float moisture = map(rawValue, SOIL_MOISTURE_DRY, SOIL_MOISTURE_WET, 0, 100);
  return constrain(moisture, 0, 100);
}
```

**Store Calibration in Backend:**
```javascript
await prisma.sensor.update({
  where: { hardwareId: 'SENSOR_ETH_001' },
  data: {
    metadata: {
      calibration: {
        soilMoisture: { dry: 3000, wet: 1500 },
        calibratedAt: new Date(),
        soilType: 'clay_loam'
      }
    }
  }
});
```

### 10.2 Validation Against Satellite Data

**Compare IoT Soil Moisture with SMAP Satellite:**

```javascript
// src/processing/sensorSatelliteCalibrator.js (already exists)

async function validateSensorAgainstSMAP(farmId) {
  // Get last 7 days IoT readings
  const iotData = await prisma.sensorTelemetry.findMany({
    where: {
      farmId,
      timestamp: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    },
    select: { timestamp: true, soilMoisture: true }
  });

  // Get SMAP satellite data for same location
  const smapData = await fetchSMAPData(farmId);

  // Calculate correlation
  const correlation = calculatePearsonCorrelation(
    iotData.map(d => d.soilMoisture),
    smapData.map(d => d.soilMoisture)
  );

  if (correlation < 0.7) {
    logger.warn('Low correlation between IoT and satellite', {
      farmId,
      correlation,
      recommendation: 'Recalibrate soil moisture sensor'
    });
  }

  return { correlation, iotData, smapData };
}
```

---

## 11. Power Management

### 11.1 Deep Sleep Implementation

**Battery Life Calculation:**

```
Battery Capacity: 3000mAh (18650 Li-ion)
Deep Sleep Current: 10µA (0.01mA)
Active Current: 80mA (WiFi + sensors)
Active Time per Cycle: 10 seconds
Sleep Time per Cycle: 600 seconds (10 minutes)

Average Current = (80mA × 10s + 0.01mA × 590s) / 600s
                = (800 + 5.9) / 600
                = 1.34mA

Battery Life = 3000mAh / 1.34mA
             = 2,239 hours
             = 93 days (3 months)
```

**Deep Sleep Code:**
```cpp
void setup() {
  // Configure wake-up timer (10 minutes)
  esp_sleep_enable_timer_wakeup(600 * 1000000); // Microseconds
  
  // Disable WiFi/Bluetooth during sleep
  WiFi.mode(WIFI_OFF);
  btStop();
}

void loop() {
  // Read sensors, send data
  sendTelemetry();
  
  // Enter deep sleep
  Serial.println("Entering deep sleep for 10 minutes...");
  Serial.flush(); // Wait for serial to finish
  esp_deep_sleep_start();
  
  // Execution stops here, ESP32 wakes and restarts setup()
}
```

### 11.2 Solar Charging Circuit

**Components:**
```
Solar Panel (5W, 6V) → TP4056 Charger → 18650 Battery → MT3608 Booster → ESP32 (5V)
                           ↓
                    Overcharge Protection
                    Overdischarge Protection
```

**TP4056 Wiring:**
```
Solar Panel (+) → TP4056 IN+
Solar Panel (-) → TP4056 IN-
Battery (+)     → TP4056 B+
Battery (-)     → TP4056 B-
ESP32 5V        → TP4056 OUT+ (or via MT3608 booster)
ESP32 GND       → TP4056 OUT-
```

**Battery Voltage Monitoring:**
```cpp
// Add voltage divider: Battery+ → 100kΩ → GPIO35 → 100kΩ → GND

float readBatteryVoltage() {
  int adcValue = analogRead(35);
  float voltage = (adcValue / 4095.0) * 3.3 * 2.0; // 2:1 divider
  return voltage;
}

int readBatteryPercentage() {
  float voltage = readBatteryVoltage();
  
  // Li-ion discharge curve
  if (voltage >= 4.2) return 100;
  if (voltage >= 4.0) return 80;
  if (voltage >= 3.8) return 60;
  if (voltage >= 3.7) return 40;
  if (voltage >= 3.5) return 20;
  if (voltage >= 3.3) return 10;
  return 0;
}
```

---

## 12. Troubleshooting

### Common Issues & Solutions

| Problem | Cause | Solution |
|---------|-------|----------|
| **ESP32 won't connect to WiFi** | Wrong SSID/password, weak signal | Check credentials, move closer to router, add external antenna |
| **MQTT connection fails** | Broker unreachable, wrong credentials | Verify broker IP/port with `telnet mqtt.agrietech.et 1883` |
| **Soil moisture reads 0%** | Sensor not powered, broken wire | Check VCC=3.3V with multimeter, test continuity |
| **DS18B20 returns -127°C** | Missing pull-up resistor, loose connection | Add 4.7kΩ resistor between Data and VCC |
| **DHT22 reads NaN** | Read too fast (< 2 seconds) | Add 2-second delay between reads |
| **Battery drains in 2 days** | Not entering deep sleep, WiFi always on | Verify `esp_deep_sleep_start()` is called |
| **Telemetry not in database** | MQTT topic mismatch, JSON parse error | Check MQTT logs, validate JSON with online parser |
| **High false alerts** | Wrong threshold values | Adjust thresholds in `checkAlertThresholds()` |

### Debug Commands

**Test MQTT locally:**
```bash
# Subscribe to all topics
mosquitto_sub -h mqtt.agrietech.et -p 1883 -u agrietech_device -P password -t '#' -v

# Publish test message
mosquitto_pub -h mqtt.agrietech.et -p 1883 -u agrietech_device -P password \
  -t 'agrietech/sensors/TEST/telemetry' \
  -m '{"hardwareId":"TEST","soilMoisture":45.2}'
```

**Check backend MQTT logs:**
```bash
tail -f logs/combined.log | grep MQTT
```

**Prisma Studio (view database):**
```bash
npx prisma studio
# Open http://localhost:5555
# Navigate to SensorTelemetry table
```

---

## Summary: API Keys & Links

### Required API Keys

| Service | Purpose | Get API Key | Cost |
|---------|---------|-------------|------|
| **MQTT Broker** | IoT telemetry transport | Self-hosted (Mosquitto) or CloudMQTT | Free (self) / $5/mo (cloud) |
| **OpenRouter** | Gemini AI analytics | https://openrouter.ai/keys | $0.075/1M tokens |
| **Plant.id** | Crop disease diagnosis | https://web.plant.id/api-access | $0.02/image |
| **Africa's Talking** | SMS alerts | https://account.africastalking.com | $0.01/SMS |
| **Firebase FCM** | Push notifications | https://console.firebase.google.com | Free |

### Hardware Purchase Links

- **ESP32-WROOM-32**: https://www.aliexpress.com (search "ESP32 devkit")
- **Heltec LoRa 32 V3**: https://heltec.org/project/wifi-lora-32-v3/
- **Sensors**: https://www.dfrobot.com, https://www.adafruit.com, https://www.sparkfun.com
- **Solar Components**: https://www.aliexpress.com (search "TP4056 solar")

### Documentation Resources

- **ESP32 Arduino Core**: https://docs.espressif.com/projects/arduino-esp32/en/latest/
- **MQTT Protocol**: https://mqtt.org/mqtt-specification/
- **PubSubClient Library**: https://pubsubclient.knolleary.net/
- **ArduinoJson**: https://arduinojson.org/
- **LoRaWAN**: https://lora-alliance.org/

---

**Next Steps:**
1. Order ESP32 + sensors ($50-70 per node)
2. Set up Mosquitto MQTT broker
3. Upload firmware to ESP32
4. Test telemetry in Prisma Studio
5. Deploy to 5-10 pilot farms in one woreda
6. Validate against satellite data (SMAP, MODIS)
7. Scale to 100+ farms

---

*End of ESP32 IoT Integration Guide*
