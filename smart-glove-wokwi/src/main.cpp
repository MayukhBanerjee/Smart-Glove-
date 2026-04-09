// ============================================================
//  Smart Weightlifting Glove — ESP32 Firmware v3 (WiFi + HTTP)
//
//  PIPELINE:
//    Sensors (MPU6050 + DHT22)
//      → Serial JSON (Wokwi Serial Monitor — unchanged)
//      → HTTP POST to Node.js /sensor-data  (NEW — WiFi)
//
//  WOKWI WiFi:
//    SSID: "Wokwi-GUEST"  |  Password: ""
//    Host reachable at: BACKEND_HOST below
//
//  I2C PINS: SDA=4, SCL=5  (unchanged)
// ============================================================

#include <Arduino.h>
#include <Wire.h>
#include <math.h>
#include <DHT.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// ── WiFi + HTTP ────────────────────────────────────────────
#include <WiFi.h>
#include <HTTPClient.h>

// ---- WIFI CREDENTIALS (Wokwi simulation WiFi) ----
const char* WIFI_SSID     = "Wokwi-GUEST";
const char* WIFI_PASSWORD = "";

// ---- BACKEND (your PC's LAN IP + port) ----
// Update BACKEND_HOST if your WiFi IP changes.
const char* BACKEND_HOST = "10.238.162.149";
const int   BACKEND_PORT = 4000;

// ------------------- PIN DEFINITIONS -------------------
#define DHTPIN     2
#define DHTTYPE    DHT22
#define LED_PIN    12
#define BUZZER_PIN 14
#define MPU_ADDR   0x68

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET    -1
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

DHT dht(DHTPIN, DHTTYPE);

// ------------------- STATE VARIABLES -------------------
int16_t accelX = 0, accelY = 0, accelZ = 0;
int16_t prevX  = 0, prevY  = 0, prevZ  = 0;

int   repCount   = 0;
unsigned long tick = 0;

bool wifiConnected = false;

// ── WiFi Connect (non-blocking with timeout) ─────────────
void connectWiFi() {
  Serial.print("[WiFi] Connecting to Wokwi-GUEST");
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    Serial.println();
    Serial.print("[WiFi] ✅ Connected! IP: ");
    Serial.println(WiFi.localIP());
  } else {
    wifiConnected = false;
    Serial.println();
    Serial.println("[WiFi] ⚠️  Could not connect — HTTP posting disabled.");
    Serial.println("[WiFi]    Serial JSON output will continue as fallback.");
  }
}

// ── HTTP POST sensor data to Node.js backend ─────────────
void postToBackend(int reps, float tremor, int jerk,
                   float temperature, float imuScore) {
  if (!wifiConnected || WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = String("http://") + BACKEND_HOST + ":" + BACKEND_PORT + "/sensor-data";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(2000); // 2s timeout — don't block the loop

  // Build JSON payload manually (no ArduinoJSON needed)
  String payload = "{";
  payload += "\"reps\":"        + String(reps)          + ",";
  payload += "\"tremor\":"      + String(tremor, 2)     + ",";
  payload += "\"jerk\":"        + String(jerk)          + ",";
  payload += "\"temperature\":" + String(temperature, 1) + ",";
  payload += "\"imu\":"         + String(imuScore, 1);
  payload += "}";

  int httpCode = http.POST(payload);

  if (httpCode == 200) {
    Serial.println("[HTTP] ✅ POST OK → dashboard updated");
  } else if (httpCode < 0) {
    Serial.print("[HTTP] ❌ Error: ");
    Serial.println(http.errorToString(httpCode));
    // Mark WiFi as lost so we stop hammering failed requests
    wifiConnected = false;
  } else {
    Serial.print("[HTTP] ⚠️  Server responded: ");
    Serial.println(httpCode);
  }

  http.end();
}

// ============================================================
void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.println(F("\n[Boot] Smart Glove v3 — WiFi+HTTP mode"));

  pinMode(LED_PIN,    OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(LED_PIN,    LOW);
  digitalWrite(BUZZER_PIN, LOW);

  dht.begin();

  // Custom I2C pins: SDA=4, SCL=5 (unchanged)
  Wire.begin(4, 5);

  // Wake MPU6050
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x6B);
  Wire.write(0x00);
  Wire.endTransmission(true);

  // Initialize OLED
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C, true, false)) {
    Serial.println(F("SSD1306 allocation failed"));
    for (;;);
  }
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println(F("Smart Glove v3"));
  display.println(F("Connecting WiFi..."));
  display.display();

  // Connect to Wokwi simulated WiFi
  connectWiFi();

  display.clearDisplay();
  display.setCursor(0, 0);
  display.println(F("Smart Glove v3"));
  if (wifiConnected) {
    display.println(F("WiFi: OK"));
    display.println(WiFi.localIP().toString().c_str());
  } else {
    display.println(F("WiFi: OFFLINE"));
    display.println(F("Serial mode only"));
  }
  display.display();
  delay(1500);
}

// ============================================================
void loop() {
  tick++;

  // ── Reconnect WiFi if dropped ──────────────────────────
  if (!wifiConnected && WiFi.status() != WL_CONNECTED && tick % 30 == 0) {
    Serial.println("[WiFi] Attempting reconnect…");
    connectWiFi();
  }

  float fatigueFactor = (float)tick / 180.0f;
  if (fatigueFactor > 1.0f) fatigueFactor = 1.0f;

  // ── READ MPU6050 ──────────────────────────────────────
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x3B);
  Wire.endTransmission(false);
  Wire.requestFrom(MPU_ADDR, 6, true);

  if (Wire.available() >= 6) {
    accelX = (Wire.read() << 8) | Wire.read();
    accelY = (Wire.read() << 8) | Wire.read();
    accelZ = (Wire.read() << 8) | Wire.read();
  }

  // ── Simulate IMU motion when Wokwi returns ~0 values ──
  float sineWave = sinf(tick * 0.3f);
  float noise    = ((float)random(-100, 100)) / 100.0f;

  int16_t simX = (int16_t)(2000 * sineWave + fatigueFactor * 4000 * noise);
  int16_t simY = (int16_t)(1500 * cosf(tick * 0.4f) + fatigueFactor * 3000 * noise);
  int16_t simZ = (int16_t)(16384 + 500 * sineWave);

  if (abs(accelX) < 50 && abs(accelY) < 50) {
    accelX = simX;
    accelY = simY;
    accelZ = simZ;
  }

  // ── JERK ──────────────────────────────────────────────
  long jerk    = abs(accelX - prevX) + abs(accelY - prevY) + abs(accelZ - prevZ);
  int  jerkNorm = (int)constrain(map(jerk, 0, 30000, 0, 100), 0, 100);
  prevX = accelX; prevY = accelY; prevZ = accelZ;

  // ── TREMOR ────────────────────────────────────────────
  float tremorVal = fatigueFactor * 9.5f + random(0, 10) / 10.0f;
  if (tremorVal > 10.0f) tremorVal = 10.0f;

  // ── TEMPERATURE ───────────────────────────────────────
  float temperature = dht.readTemperature();
  if (isnan(temperature)) {
    temperature = 36.5f + fatigueFactor * 2.5f + (random(0, 20) / 100.0f);
  }

  // ── IMU SCORE ──────────────────────────────────────────
  float imuScore = 10.0f + fatigueFactor * 20.0f + (fabsf(noise) * 5.0f);

  // ── REP COUNTER ────────────────────────────────────────
  int repPeriod = (int)(6 + fatigueFactor * 15);
  if (repPeriod > 0 && (tick % repPeriod) == 0) {
    repCount++;
  }

  // ── ALERT LOGIC ─────────────────────────────────────────
  bool unsafe = (tremorVal > 7.0f || jerkNorm > 70 || temperature > 38.5f);
  bool danger = (tremorVal > 8.5f && fatigueFactor > 0.7f);
  String statusStr = "SAFE";

  if (danger) {
    digitalWrite(LED_PIN, (tick % 2 == 0) ? HIGH : LOW);
    digitalWrite(BUZZER_PIN, HIGH);
    statusStr = "DANGER";
  } else if (unsafe) {
    digitalWrite(LED_PIN, HIGH);
    digitalWrite(BUZZER_PIN, LOW);
    statusStr = "WARNING";
  } else {
    digitalWrite(LED_PIN, LOW);
    digitalWrite(BUZZER_PIN, LOW);
  }

  // ── OLED DISPLAY ────────────────────────────────────────
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println(F("Smart Glove v3"));
  display.drawLine(0, 10, 128, 10, SSD1306_WHITE);

  display.setCursor(0, 14);
  display.print(F("Reps: "));
  display.setTextSize(2);
  display.println(repCount);

  display.setTextSize(1);
  display.setCursor(0, 36);
  display.print(F("Temp: "));
  display.print(temperature, 1);
  display.println(F(" C"));

  display.setCursor(0, 46);
  display.print(F("WiFi: "));
  display.println(wifiConnected ? F("OK") : F("--"));

  display.setCursor(0, 56);
  display.print(F("Status: "));
  if (statusStr == "DANGER") {
    display.setTextColor(SSD1306_BLACK, SSD1306_WHITE);
    display.print(statusStr);
    display.setTextColor(SSD1306_WHITE, SSD1306_BLACK);
  } else {
    display.print(statusStr);
  }
  display.display();

  // ── SERIAL DEBUG OUTPUT (unchanged — Wokwi monitor) ────
  Serial.println(F("\n---- SENSOR DATA ----"));
  Serial.print(F("Reps: "));      Serial.println(repCount);
  Serial.print(F("Temp: "));      Serial.println(temperature, 1);
  Serial.print(F("Jerk: "));      Serial.println(jerkNorm);
  Serial.print(F("Tremor: "));    Serial.println(tremorVal, 1);
  Serial.print(F("IMU: "));       Serial.println(imuScore, 1);
  Serial.print(F("WiFi: "));      Serial.println(wifiConnected ? F("OK") : F("OFFLINE"));
  Serial.println(F("-------"));

  // ── STRICT JSON TO SERIAL (unchanged) ──────────────────
  Serial.print(F("{\"reps\":"));       Serial.print(repCount);       Serial.print(F(","));
  Serial.print(F("\"tremor\":"));     Serial.print(tremorVal, 2);   Serial.print(F(","));
  Serial.print(F("\"jerk\":"));       Serial.print(jerkNorm);       Serial.print(F(","));
  Serial.print(F("\"temperature\":")); Serial.print(temperature, 1); Serial.print(F(","));
  Serial.print(F("\"imu\":"));        Serial.print(imuScore, 1);
  Serial.println(F("}"));

  // ── HTTP POST TO DASHBOARD ──────────────────────────────
  postToBackend(repCount, tremorVal, jerkNorm, temperature, imuScore);

  delay(1000);
}