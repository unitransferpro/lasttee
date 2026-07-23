# 라스트티 — 모바일 앱 빌드 (Android / iOS)

Capacitor로 웹앱을 네이티브로 감쌉니다. 웹 소스(루트)가 진실의 원천이고, `www/`는 빌드 시 자동 생성됩니다.

- appId: `kr.lasttee.app` · appName: `라스트티`
- 웹 자산 → `www/` 복사 → Capacitor가 네이티브에 번들
- 플러그인: App(하드웨어 뒤로가기), StatusBar(다크그린), SplashScreen

## 사전 준비
- Node 18+ (`npm install`)
- **Android:** JDK 17 + Android SDK (platform-tools, platforms;android-34, build-tools;34.0.0)
- **iOS:** macOS + Xcode + CocoaPods (`sudo gem install cocoapods`)

## Android APK 빌드
```bash
npm install
npm run build:www           # 웹 자산 → www/
npx cap sync android        # www + 플러그인 → 네이티브
npx capacitor-assets generate --android   # 아이콘/스플래시 (assets/ 기반, 최초 1회)

cd android
export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
export ANDROID_HOME=$HOME/Library/Android/sdk   # 또는 /opt/homebrew/share/android-commandlinetools
./gradlew assembleDebug
# 산출물: android/app/build/outputs/apk/debug/app-debug.apk
```
한 줄 스크립트: `npm run apk:debug`

### 폰에 설치
```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```
또는 APK 파일을 폰으로 전송 → "출처를 알 수 없는 앱 설치" 허용 후 실행.

## 릴리즈(서명) APK / Play Store AAB
1. 키스토어 생성(최초 1회, 안전하게 보관 · 절대 커밋 금지):
   ```bash
   keytool -genkey -v -keystore lasttee-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias lasttee
   ```
2. `android/keystore.properties` (gitignore됨) 작성:
   ```
   storeFile=../../lasttee-release.jks
   storePassword=...
   keyAlias=lasttee
   keyPassword=...
   ```
3. `android/app/build.gradle`의 `signingConfigs`/`release`에 연결 후:
   ```bash
   ./gradlew assembleRelease   # APK
   ./gradlew bundleRelease     # Play Store용 .aab
   ```

## iOS (Mac + Xcode 필요)
```bash
npm run build:www
npx cap add ios             # 최초 1회 (CocoaPods 필요)
npx cap sync ios
npx capacitor-assets generate --ios
npx cap open ios            # Xcode에서 서명(팀 선택) 후 Run / Archive
```
공유 설정(appId, 이름, 플러그인, 웹앱)은 이미 iOS에도 적용됩니다.

## 버전 올리기
- 네이티브: `android/app/build.gradle`의 `versionCode`(정수 증가) + `versionName`.
- 웹: `index.html`/`sw.js`의 `?v=` + `sw.js`의 `VER` 동시 증가.

## 참고
- 네이티브에서는 서비스워커를 등록하지 않습니다(로컬 자산 직접 서빙). 웹(PWA)에서만 SW 동작.
- 폰트·아이콘·위성타일·백엔드 API는 인터넷 연결 시 로드됩니다(INTERNET 권한 포함). 오프라인이면 폰트는 시스템 폴백.
