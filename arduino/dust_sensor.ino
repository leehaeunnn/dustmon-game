/*
 * 더스트몬 (DustMon) - 미세먼지 센서 아두이노 코드
 * GP2Y1010AU0F 미세먼지 센서 사용
 * 
 * 연결:
 * - V-LED: 아두이노 5V
 * - LED-GND: 아두이노 GND
 * - LED: 아두이노 디지털 핀 2
 * - S-GND: 아두이노 GND
 * - Vo: 아두이노 아날로그 핀 A0
 * - Vcc: 아두이노 5V
 */

// 센서 핀 정의
const int LED_PIN = 2;      // LED 제어 핀
const int DUST_PIN = A0;    // 미세먼지 센서 아날로그 핀

// 측정 변수
unsigned long samplingTime = 280;  // LED 켜진 시간 (마이크로초)
unsigned long deltaTime = 40;      // 대기 시간 (마이크로초)
unsigned long sleepTime = 9680;    // LED 꺼진 시간 (마이크로초)

// 센서 보정값 (실제 환경에 맞게 조정 필요)
float voMeasured = 0;
float calcVoltage = 0;
float dustDensity = 0;
float pm25 = 0;
float pm10 = 0;

// 필터링을 위한 변수
const int SAMPLE_SIZE = 10;
float pm25_samples[SAMPLE_SIZE];
float pm10_samples[SAMPLE_SIZE];
int sample_index = 0;

void setup() {
  Serial.begin(9600);
  pinMode(LED_PIN, OUTPUT);
  
  // 배열 초기화
  for (int i = 0; i < SAMPLE_SIZE; i++) {
    pm25_samples[i] = 0;
    pm10_samples[i] = 0;
  }
  
  delay(2000);  // 센서 안정화 대기
}

void loop() {
  // LED 켜기
  digitalWrite(LED_PIN, LOW);
  delayMicroseconds(samplingTime);
  
  // 센서 값 읽기
  voMeasured = analogRead(DUST_PIN);
  
  delayMicroseconds(deltaTime);
  
  // LED 끄기
  digitalWrite(LED_PIN, HIGH);
  delayMicroseconds(sleepTime);
  
  // 전압 계산 (0-5V, 1024 단계)
  calcVoltage = voMeasured * (5.0 / 1024.0);
  
  // 미세먼지 농도 계산 (GP2Y1010AU0F 특성 곡선 기반)
  // 실제 센서에 맞게 보정값 조정 필요
  if (calcVoltage >= 0.6) {
    dustDensity = (calcVoltage - 0.6) / 0.005;  // 0.6V 이상일 때만 유효
    if (dustDensity < 0) dustDensity = 0;
  } else {
    dustDensity = 0;
  }
  
  // PM2.5와 PM10 추정 (GP2Y1010AU0F는 총 먼지량만 측정)
  // 일반적인 비율로 추정 (실제로는 별도 센서 필요)
  pm25 = dustDensity * 0.6;  // PM2.5는 총 먼지의 약 60%
  pm10 = dustDensity;        // PM10은 총 먼지량과 유사
  
  // 이동 평균 필터 적용 (노이즈 제거)
  pm25_samples[sample_index] = pm25;
  pm10_samples[sample_index] = pm10;
  sample_index = (sample_index + 1) % SAMPLE_SIZE;
  
  // 평균 계산
  float pm25_avg = 0;
  float pm10_avg = 0;
  for (int i = 0; i < SAMPLE_SIZE; i++) {
    pm25_avg += pm25_samples[i];
    pm10_avg += pm10_samples[i];
  }
  pm25_avg /= SAMPLE_SIZE;
  pm10_avg /= SAMPLE_SIZE;
  
  // 이상값 필터링 (0-1000 범위 제한)
  if (pm25_avg < 0) pm25_avg = 0;
  if (pm25_avg > 1000) pm25_avg = 1000;
  if (pm10_avg < 0) pm10_avg = 0;
  if (pm10_avg > 1000) pm10_avg = 1000;
  
  // JSON 형식으로 시리얼 전송
  Serial.print("{\"pm25\":");
  Serial.print(pm25_avg, 1);
  Serial.print(",\"pm10\":");
  Serial.print(pm10_avg, 1);
  Serial.println("}");
  
  delay(500);  // 0.5초마다 전송
}

