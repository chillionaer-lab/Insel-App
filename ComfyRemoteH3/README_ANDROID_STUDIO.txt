OPTIONALES ANDROID STUDIO QUELLPROJEKT - H3 2/3/5 (22.11.2026)
==============================================================

Dieses Projekt wurde aus einem aelteren, in den vorhandenen Dateien
gefundenen ComfyRemote-H3-WebView-Quellstand abgeleitet. Es ist KEIN
Nachweis, dass dies exakt der Quellcode der momentan installierten APK ist.

AENDERUNGEN
- Startadresse: https://chillioneer.pythonanywhere.com/comfy/
- Android-Dateiauswahl fuer Bilder UND Videos (bisher schon unterstuetzt).
- Build-Kennung dieser optionalen Quellvariante: 2.0.1-H3-235.
- APP_TOKEN wird NICHT in der APK gespeichert oder mitgeliefert.

INSTALLATION / BUILD
1. Zuerst PythonAnywhere WebUI und Windows-H3-Agent aktualisieren.
2. In Android Studio diesen Ordner als Gradle-Projekt oeffnen.
3. Android SDK 35 / JDK 17 bereitstellen und Gradle synchronisieren.
4. Build > Build APK(s) ausfuehren und die APK lokal testen.
5. Nur bei identischem Application-ID und passender Signatur kann die
   neue APK die bereits installierte Variante ersetzen. Andernfalls ist
   eine neue Installation erforderlich.

WICHTIG
- Keine fertige, signierte APK enthalten; in dieser Umgebung wurde
  kein Android-SDK-Build durchgefuehrt.
- Bei deiner gegenwaertig installierten Android-App koennen abweichende
  Quellen, URLs, Identitaeten oder Signierschluessel gelten.
- Eine bereits auf /comfy/ verweisende WebView benoetigt keinen APK-Umbau;
  die neuen Workflows erscheinen nach Agent- und Webserver-Aktualisierung.
- Die Android-App fuehrt das Modell nicht lokal aus; sie ist nur die
  Bedienoberflaeche fuer die Windows-/ComfyUI-Installation.
