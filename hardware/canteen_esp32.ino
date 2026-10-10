#include <ArduinoJson.h>
#include <DHT.h>
#include <HTTPClient.h>
#include <LiquidCrystal_I2C.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <Wire.h>

// Set these values for the network where the API server is running.
const char *WIFI_SSID = "YOUR_WIFI_NAME";
const char *WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char *HARDWARE_API_KEY = "SET_THE_SAME_KEY_AS_SERVER_ENV";
const char *API_BASE_URL = "https://YOUR_PROJECT.vercel.app/api";
const char *API_ROOT_CA_CERT = "PASTE_THE_ROOT_CA_CERTIFICATE_FOR_YOUR_VERCEL_HOST";

#define BUZZER_PIN 25
#define LED_PIN 26
#define DHT_PIN 33
#define DHT_TYPE DHT11
#define LCD_SDA_PIN 21
#define LCD_SCL_PIN 22

const uint32_t TEMPERATURE_INTERVAL_MS = 5000;
const uint32_t ORDER_INTERVAL_MS = 3000;
const uint8_t MAX_READY_ORDERS = 5;

DHT dht(DHT_PIN, DHT_TYPE);
LiquidCrystal_I2C lcd(0x27, 16, 2);
WiFiClientSecure wifiClient;
uint32_t lastTemperaturePost = 0;
uint32_t lastOrderPoll = 0;
String previousReadyIds[MAX_READY_ORDERS];

void showLine(uint8_t row, String text)
{
    if (text.length() > 16)
        text = text.substring(0, 16);
    while (text.length() < 16)
        text += ' ';
    lcd.setCursor(0, row);
    lcd.print(text);
}

void connectWifi()
{
    if (WiFi.status() == WL_CONNECTED)
        return;
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    showLine(0, "Connecting WiFi");
    while (WiFi.status() != WL_CONNECTED)
        delay(500);
    showLine(0, "Campus Canteen");
    showLine(1, "Connected");
}

void postTemperature()
{
    const float celsius = dht.readTemperature();
    const float humidity = dht.readHumidity();
    if (isnan(celsius))
        return;

    DynamicJsonDocument payload(128);
    payload["celsius"] = celsius;
    if (!isnan(humidity))
        payload["humidity"] = humidity;
    String body;
    serializeJson(payload, body);

    HTTPClient http;
    http.begin(wifiClient, String(API_BASE_URL) + "/hardware/temperature");
    http.addHeader("Content-Type", "application/json");
    http.addHeader("x-hardware-key", HARDWARE_API_KEY);
    http.POST(body);
    http.end();
}

bool wasReady(const String &orderId)
{
    for (const String &previousId : previousReadyIds)
    {
        if (previousId == orderId)
            return true;
    }
    return false;
}

void pollReadyOrders()
{
    HTTPClient http;
    http.begin(wifiClient, String(API_BASE_URL) + "/hardware/orders");
    http.addHeader("x-hardware-key", HARDWARE_API_KEY);
    const int responseCode = http.GET();
    if (responseCode != HTTP_CODE_OK)
    {
        http.end();
        return;
    }

    DynamicJsonDocument response(4096);
    const DeserializationError error = deserializeJson(response, http.getString());
    http.end();
    if (error)
        return;

    JsonArray orders = response["orders"].as<JsonArray>();
    String currentReadyIds[MAX_READY_ORDERS];
    uint8_t count = 0;
    bool newReadyOrder = false;

    for (JsonObject order : orders)
    {
        if (count >= MAX_READY_ORDERS)
            break;
        currentReadyIds[count] = order["id"].as<String>();
        if (!wasReady(currentReadyIds[count]))
            newReadyOrder = true;
        count++;
    }

    digitalWrite(LED_PIN, count > 0 ? HIGH : LOW);
    if (newReadyOrder)
    {
        digitalWrite(BUZZER_PIN, HIGH);
        delay(250);
        digitalWrite(BUZZER_PIN, LOW);
    }

    if (count > 0)
    {
        JsonObject newestOrder = orders[0];
        showLine(0, "READY " + newestOrder["id"].as<String>());
        showLine(1, newestOrder["items"].as<String>());
    }
    else
    {
        showLine(0, "Campus Canteen");
        showLine(1, "No ready orders");
    }

    for (uint8_t i = 0; i < MAX_READY_ORDERS; i++)
    {
        previousReadyIds[i] = currentReadyIds[i];
    }
}

void setup()
{
    Serial.begin(115200);
    wifiClient.setCACert(API_ROOT_CA_CERT);
    pinMode(LED_PIN, OUTPUT);
    pinMode(BUZZER_PIN, OUTPUT);
    digitalWrite(LED_PIN, LOW);
    digitalWrite(BUZZER_PIN, LOW);

    dht.begin();
    Wire.begin(LCD_SDA_PIN, LCD_SCL_PIN);
    lcd.init();
    lcd.backlight();
    showLine(0, "Campus Canteen");
    showLine(1, "Starting...");
    connectWifi();
}

void loop()
{
    connectWifi();
    const uint32_t now = millis();

    if (now - lastTemperaturePost >= TEMPERATURE_INTERVAL_MS)
    {
        lastTemperaturePost = now;
        postTemperature();
    }
    if (now - lastOrderPoll >= ORDER_INTERVAL_MS)
    {
        lastOrderPoll = now;
        pollReadyOrders();
    }
    delay(20);
}
