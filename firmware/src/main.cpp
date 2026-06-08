/*
 * ============================================================
 *  IoMT node firmware — ONE codebase for every node
 *  - ALWAYS posts readings to Supabase  (feeds the Vercel dashboard)
 *  - OPTIONALLY also publishes to AWS IoT Core (feeds your Node-RED)
 *
 *  Per-node config is in secrets.h:
 *     DEVICE_ID   unique per node
 *     ENABLE_AWS  1 on your node, 0 on student nodes
 *
 *  Mapping: DHT11 temperature -> body_temp,  humidity -> heart_rate
 * ============================================================
 */
#include <Arduino.h>
#include <WiFi.h>
#include <WiFiMulti.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include "DHT.h"
#include "secrets.h"

#if ENABLE_AWS
  #include <PubSubClient.h>
  #include <time.h>
  WiFiClientSecure awsNet;
  PubSubClient     awsClient(awsNet);
#endif

#define DHTPIN  4
#define DHTTYPE DHT11
#define SEND_INTERVAL_MS 120000UL
/* 
10 minutes = 10 × 60 × 1000 = 600000 → #define SEND_INTERVAL_MS 600000UL
(Your current 30000UL is 30 seconds: 30 × 1000.)
*/

WiFiMulti     wifiMulti;
DHT           dht(DHTPIN, DHTTYPE);
unsigned long lastSend = 0;

void connectWiFi() {
  Serial.println("Connecting WiFi...");
  WiFi.mode(WIFI_STA);
  unsigned long start = millis();
  while (wifiMulti.run(10000) != WL_CONNECTED && millis() - start < 40000) {
    Serial.print(".");
    delay(500);
  }
  if (WiFi.status() == WL_CONNECTED)
    Serial.printf("\nWiFi OK: \"%s\"  IP=%s\n",
                  WiFi.SSID().c_str(), WiFi.localIP().toString().c_str());
  else
    Serial.println("\nWiFi FAILED (no known network in range)");
}

void postToSupabase(float bodyTemp, float heartRate) {
  WiFiClientSecure client;
  client.setInsecure();                       // prototype: skip TLS cert check
  HTTPClient https;
  https.begin(client, String(SUPABASE_URL) + "/rest/v1/vitals");
  https.addHeader("apikey", SUPABASE_ANON_KEY);
  https.addHeader("Authorization", String("Bearer ") + SUPABASE_ANON_KEY);
  https.addHeader("Content-Type", "application/json");
  https.addHeader("Prefer", "return=minimal");

  char body[160];
  snprintf(body, sizeof(body),
    "{\"device_id\":\"%s\",\"body_temp\":%.1f,\"heart_rate\":%.1f}",
    DEVICE_ID, bodyTemp, heartRate);

  int code = https.POST(String(body));
  Serial.printf("[Supabase] %s -> HTTP %d\n", body, code);
  https.end();
}

#if ENABLE_AWS
void syncTime() {
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  time_t now = time(nullptr);
  int r = 0;
  while (now < 100000 && r < 20) { delay(500); now = time(nullptr); r++; }
}
void connectAWS() {
  awsNet.setCACert(AWS_ROOT_CA);
  awsNet.setCertificate(AWS_DEVICE_CERT);
  awsNet.setPrivateKey(AWS_PRIVATE_KEY);
  awsClient.setServer(MQTT_SERVER, MQTT_PORT);
  awsClient.setBufferSize(512);
  int a = 0;
  while (!awsClient.connected() && a < 5) {
    Serial.printf("[AWS] connect attempt %d\n", a + 1);
    if (awsClient.connect(THING_NAME)) { Serial.println("[AWS] connected"); return; }
    Serial.printf("[AWS] failed state=%d, retrying...\n", awsClient.state());
    delay(3000);
    a++;
  }
}
#endif

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.printf("\n=== IoMT node: %s ===\n", DEVICE_ID);
  dht.begin();

  wifiMulti.addAP(WIFI1_SSID, WIFI1_PASS);
  wifiMulti.addAP(WIFI2_SSID, WIFI2_PASS);
  wifiMulti.addAP(WIFI3_SSID, WIFI3_PASS);
  connectWiFi();

#if ENABLE_AWS
  if (WiFi.status() == WL_CONNECTED) { syncTime(); connectAWS(); }
#endif
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) connectWiFi();

#if ENABLE_AWS
  if (WiFi.status() == WL_CONNECTED && !awsClient.connected()) { syncTime(); connectAWS(); }
  awsClient.loop();
#endif

  if (WiFi.status() == WL_CONNECTED && millis() - lastSend > SEND_INTERVAL_MS) {
    lastSend = millis();
    float bodyTemp  = dht.readTemperature();   // -> body_temp
    float heartRate = dht.readHumidity();      // -> heart_rate (stand-in for HR)
    if (isnan(bodyTemp) || isnan(heartRate)) { Serial.println("DHT read failed"); return; }

    // (1) EVERYONE: send to Supabase -> Vercel dashboard
    postToSupabase(bodyTemp, heartRate);

    // (2) YOUR NODE ONLY: also publish to AWS -> Node-RED
#if ENABLE_AWS
    if (awsClient.connected()) {
      char payload[160];
      snprintf(payload, sizeof(payload),
        "{\"thing\":\"%s\",\"temperature\":%.1f,\"humidity\":%.1f}",
        THING_NAME, bodyTemp, heartRate);
      awsClient.publish(MQTT_TOPIC, payload);
      Serial.printf("[AWS] published: %s\n", payload);
    }
#endif
  }
}