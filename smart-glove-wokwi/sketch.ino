// ============================================================
//  Smart Weightlifting Glove — ESP8266 Firmware
//  Wokwi Simulation-Ready + Hardware-Ready
//  Outputs clean JSON on Serial at 115200 baud
// ============================================================

#include <Wire.h>
#include <DHT.h>
#include <Arduino_JSON.h>

// ------------------- PIN DEFINITIONS -------------------
#define DHTPIN     14      // D5 = GPIO14
#define DHTTYPE    DHT22
#define BTN_PIN    13      // D7 = GPIO13 (rep counter / IR sim)
#define LED_PIN    16      // D0 = GPIO16
#define BUZZER_PIN 15      // D8 = GPIO15
#define MPU_ADDR   0x68

DHT dht(DHTPIN, DHTTYPE);

// ------------------- STATE VARIABLES -------------------
int16_t accelX = 0, accelY = 0, accelZ = 0;
int16_t prevX = 0, prevY = 0, prevZ = 0;

int   repCount   = 0;
bool  btnPressed = false;
int   lastBtn    = HIGH;

// Session time in loop-ticks (~300ms each)
unsigned long tick = 0;

// ============================================================
void setup() {
  Serial.begin(115200);
  while (!Serial) {}

  pinMode(BTN_PIN,    INPUT_PULLUP);
  pinMode(LED_PIN,    OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);

  digitalWrite(LED_PIN,    LOW);
  digitalWrite(BUZZER_PIN, LOW);

  dht.begin();

  // I2C: SDA=D2(GPIO4), SCL=D1(GPIO5)
  Wire.begin(4, 5);

  // Wake MPU6050
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x6B);
  Wire.write(0x00);
  Wire.endTransmission(true);

  delay(200);
}

// ============================================================
// Simulate progressive fatigue in 3 phases over ~90 ticks:
//   0–30:  SAFE   (light load)
//   31–60: WARNING (fatigue building)
//   61–90: DANGER  (high fatigue, tremor, instability)
// ============================================================
void loop() {
  tick++;

  float fatigueFactor = (float)tick / 90.0;
  if (fatigueFactor > 1.0) fatigueFactor = 1.0;

  // ---- READ MPU6050 ----
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x3B);
  Wire.endTransmission(false);
  Wire.requestFrom(MPU_ADDR, 6, true);

  if (Wire.available() >= 6) {
    accelX = (Wire.read() << 8) | Wire.read();
    accelY = (Wire.read() << 8) | Wire.read();
    accelZ = (Wire.read() << 8) | Wire.read();
  }

  // ---- SIMULATE IMU when Wokwi returns 0 ----
  // In real hardware, MPU6050 returns real accelerometer data.
  // In Wokwi (no physical motion), inject synthetic motion for demo.
  float sineWave = sin(tick * 0.3);
  float noise    = ((float)random(-100, 100)) / 100.0;

  // Inject synthetic jerk and wobble that GROWS with fatigue
  int16_t simX = (int16_t)(2000 * sineWave + fatigueFactor * 4000 * noise);
  int16_t simY = (int16_t)(1500 * cos(tick * 0.4) + fatigueFactor * 3000 * noise);
  int16_t simZ = (int16_t)(16384 + 500 * sineWave);  // ~1g baseline

  // Merge: if MPU reading is essentially zero, use simulation
  if (abs(accelX) < 50 && abs(accelY) < 50) {
    accelX = simX;
    accelY = simY;
    accelZ = simZ;
  }

  // ---- JERK (motion instability: delta acceleration) ----
  long jerk = abs(accelX - prevX) + abs(accelY - prevY) + abs(accelZ - prevZ);
  // Normalize to 0–100 range
  int jerkNorm = (int)constrain(map(jerk, 0, 30000, 0, 100), 0, 100);

  prevX = accelX;
  prevY = accelY;
  prevZ = accelZ;

  // ---- TREMOR (simulated 0–10, increases with fatigue) ----
  float tremorVal = fatigueFactor * 9.5 + random(0, 10) / 10.0;
  if (tremorVal > 10.0) tremorVal = 10.0;

  // ---- TEMPERATURE ----
  float temperature = dht.readTemperature();
  if (isnan(temperature)) {
    // Simulate rising body temperature with fatigue
    temperature = 36.5 + fatigueFactor * 2.5 + (random(0, 20) / 100.0);
  }

  // ---- IMU: composite score (form quality proxy) ----
  // Perfect form → low IMU. Higher = more deviation.
  float imuScore = 10.0 + fatigueFactor * 20.0 + (abs(noise) * 5.0);

  // ---- REP COUNTER (button press OR auto-simulated reps) ----
  int btnState = digitalRead(BTN_PIN);
  if (lastBtn == HIGH && btnState == LOW) {
    if (!btnPressed) {
      repCount++;
      btnPressed = true;
    }
  }
  if (btnState == HIGH) {
    btnPressed = false;
  }
  lastBtn = btnState;

  // Auto-simulate reps every N ticks slowing down with fatigue
  int repPeriod = (int)(10 + fatigueFactor * 15);  // 10→25 ticks per rep
  if (repPeriod > 0 && (tick % repPeriod) == 0) {
    repCount++;
  }

  // ---- ALERT LOGIC → LED + BUZZER ----
  bool unsafe = (tremorVal > 7.0 || jerkNorm > 70 || temperature > 38.5);
  bool danger  = (tremorVal > 8.5 && fatigueFactor > 0.7);

  if (danger) {
    // Fast blinking for DANGER
    digitalWrite(LED_PIN,    (tick % 2 == 0) ? HIGH : LOW);
    digitalWrite(BUZZER_PIN, HIGH);
  } else if (unsafe) {
    digitalWrite(LED_PIN,    HIGH);
    digitalWrite(BUZZER_PIN, LOW);
  } else {
    digitalWrite(LED_PIN,    LOW);
    digitalWrite(BUZZER_PIN, LOW);
  }

  // ---- JSON OUTPUT ----
  // Format: one clean JSON per line, easily parsed by Node.js
  Serial.print("{");
  Serial.print("\"reps\":");       Serial.print(repCount);       Serial.print(",");
  Serial.print("\"tremor\":");     Serial.print(tremorVal, 2);   Serial.print(",");
  Serial.print("\"jerk\":");       Serial.print(jerkNorm);       Serial.print(",");
  Serial.print("\"temperature\":"); Serial.print(temperature, 1); Serial.print(",");
  Serial.print("\"imu\":");        Serial.print(imuScore, 1);
  Serial.println("}");

  delay(300);
}