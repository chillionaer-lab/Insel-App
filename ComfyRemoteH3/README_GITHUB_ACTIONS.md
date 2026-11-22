# ComfyRemote H3 Android — APK automatisch auf GitHub bauen

Dieses Projekt ist eine Android-WebView für
`https://chillioneer.pythonanywhere.com/comfy/` und unterstützt den
Android-Dateidialog für Bild- und Videouploads (Workflows 2/3/5).

## GitHub-Build

Im eigenstaendigen Projekt baut `.github/workflows/build-apk.yml` bei Aenderungen
an `main`. Innerhalb des bestehenden Repositories `chillionaer-lab/Insel-App`
liegt die aktive GitHub-Actions-Datei auf Repository-Ebene unter
`.github/workflows/comfyremote-h3-android.yml`; Android-Quellen liegen dort
separat in `ComfyRemoteH3/`.

Die APK laesst sich außerdem manuell über **Actions → Build ComfyRemote H3
Android APK → Run workflow** bauen. Unter dem erfolgreichen Lauf in **Artifacts** liegt die
ZIP-Datei `ComfyRemote-H3-Android-debug`, die die `app-debug.apk` enthält.

GitHub installiert in der Build-Umgebung JDK 17, Android SDK 35 und Gradle 8.9.
Eine lokal installierte Android-SDK-Umgebung ist nicht notwendig.

## Wichtige Einschränkungen

- Die APK ist ein **Debug-Build**, kein signiertes Play-Store-Release.
- Dieses Projekt stammt aus einer älteren bereitgestellten WebView-Quelle.
  Es kann sich von der aktuell installierten App "Mittelmeer" unterscheiden.
- Eine vorhandene App mit abweichender Signatur kann damit nicht überinstalliert
  werden. Vorher bestehende Android-App-Daten bleiben deshalb möglicherweise
  unzugänglich. Die alte APK **nicht ohne Sicherung deinstallieren**.
- Beim ersten Start ist der vorhandene APP_TOKEN erneut in der Weboberfläche
  einzugeben. Weder Agent-Token noch App-Token liegen im Repository.
- Die eigentliche H3-GPU-Verarbeitung bleibt auf dem Windows-PC;
  diese APK ist nur die Bedienoberfläche.
