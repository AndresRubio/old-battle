import type { CapacitorConfig } from '@capacitor/cli'

// Wraps the built Vite web app (dist/) into a native Android project.
// The app is fully offline (localStorage), so the web assets ship inside the
// APK/AAB — no server or internet permission required.
const config: CapacitorConfig = {
  appId: 'com.oldbattle.armybuilder', // ← change to your own reverse-domain id before publishing
  appName: 'Old Battle', // visible app name (non-infringing; rename freely)
  webDir: 'dist',
}

export default config
