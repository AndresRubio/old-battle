# Publicar en Google Play (app Android)

Esta app es una web (Vite + React) **100 % offline** (usa `localStorage`, sin servidor).
La envolvemos en un proyecto Android nativo con **Capacitor**: los archivos web van
**dentro** del APK/AAB, así que no necesita internet ni permisos especiales.

Ya está preparado en el repo:
- `base: './'` en `vite.config.ts` (rutas relativas, necesarias dentro del WebView).
- `capacitor.config.ts` (id de app, nombre, `webDir: dist`).
- scripts en `package.json`: `cap:sync`, `cap:open`, `android`.

---

## 0) Requisitos (una vez)

1. **Node.js 18+** (ya lo tienes).
2. **Android Studio** (incluye el SDK de Android y la JDK): https://developer.android.com/studio
3. **Cuenta de Google Play Developer** — pago único de **25 USD**: https://play.google.com/console/signup
4. **Icono y splash ya generados**: `resources/icon.png` (1024×1024, espadas
   cruzadas) y `resources/splash.png` (2732×2732). Sustitúyelos si quieres otro arte.

> ⚠️ **Marca registrada**: «Warhammer» es marca de Games Workshop. Para evitar la
> retirada de la app, el **nombre visible ya se cambió a «Old Battle»** (no infractor) en
> todo el código: `appName`/`appId` en `capacitor.config.ts`, el título del header
> (`appTitle` en `src/i18n/lang.ts`), `index.html`, `package.json`, la exportación de
> listas y la página de privacidad. Se mantiene el aviso “fan-made, no oficial, sin
> relación con Games Workshop”.
>
> **Lo que aún debes hacer tú**: en la **ficha de Play** (título, descripción, capturas)
> usa también «Old Battle» — no escribas «Warhammer» ahí. Puedes renombrar «Old Battle»
> por otro nombre si prefieres; cámbialo en esos mismos sitios.
>
> Nota: los nombres de las tropas/ejércitos del juego (Skaven, Bretonnia, etc.) son
> referencias al contenido del reglamento, no el nombre/logo de la app.

---

## 1) Instalar Capacitor y crear el proyecto Android (una vez)

```bash
cd /Users/andresr/Desktop/projects/warhammer
npm install                 # instala @capacitor/core, /android, /cli, /assets
npm run build               # genera dist/
npx cap add android         # crea la carpeta android/ (proyecto nativo)
```

### Iconos y splash (opcional pero recomendado)

```bash
# con resources/icon.png (1024×1024) y resources/splash.png presentes:
npx @capacitor/assets generate --android
```

---

## 2) Ciclo de desarrollo: cada vez que cambies la app

```bash
npm run android       # = build + cap sync android + abre Android Studio
# o por separado:
npm run cap:sync      # build + copia dist/ al proyecto android
npm run cap:open      # abre Android Studio
```

Para probar en un móvil: conéctalo por USB (con *Depuración USB* activada) y pulsa
▶ **Run** en Android Studio, o usa un emulador.

---

## 3) Configurar la app en Android Studio (una vez)

1. **Nombre e id**: el id (`com.armybuilder.wfb5e`) viene de `capacitor.config.ts`.
   Cámbialo por el tuyo **antes** del primer `cap add` si quieres otro
   (formato dominio-inverso, p. ej. `com.tunombre.armybuilder`).
2. **Versión**: en `android/app/build.gradle`:
   - `versionCode 1` (entero, **súbelo +1 en cada publicación**)
   - `versionName "1.0.0"` (texto visible)
3. **minSdk**: Capacitor 6 usa `minSdkVersion 22` por defecto (Android 5.1+). OK.

---

## 4) Firmar y generar el AAB (formato que pide Play)

1. En Android Studio: **Build → Generate Signed Bundle / APK → Android App Bundle**.
2. **Create new… (keystore)** la primera vez:
   - Guarda el archivo `.jks` en lugar **seguro** y **NO lo pierdas** (sin él no podrás
     volver a actualizar la app). Apunta las contraseñas y el *alias*.
3. Variante **release** → genera `app-release.aab` en
   `android/app/release/`.

> Play usa **Play App Signing**: tu `.jks` es la *upload key*; Google re-firma la app.
> Aun así, conserva tu keystore para siempre.

---

## 5) Subir a Google Play Console

1. Entra en https://play.google.com/console → **Crear app**.
   - Nombre, idioma por defecto (Español), tipo *App*, gratuita.
2. Completa el panel **“Configura tu app”**:
   - **Política de privacidad** (URL). Como no recogemos datos, basta una página simple
     que diga que la app guarda las listas **solo en el dispositivo** y no envía nada.
   - **Acceso a la app** (no requiere login).
   - **Clasificación de contenido** (cuestionario; apta para todos).
   - **Público objetivo** y **anuncios** (no hay anuncios).
   - **Seguridad de los datos**: marca *“no se recopilan datos”*.
3. **Ficha de Play Store** (Crecimiento → Presencia en la tienda):
   - Título (≤30), descripción corta (≤80), descripción larga.
   - **Icono 512×512**, **gráfico de funciones 1024×500**, y **≥2 capturas**
     de teléfono (puedes usar las del modo móvil de la app).
4. **Producción → Crear nueva versión**:
   - Sube `app-release.aab`.
   - Notas de la versión.
   - **Revisar y publicar**.
5. Primera publicación: Google revisa (de horas a varios días). Para depurar antes,
   usa el carril **Testing interno** (subes el mismo AAB y lo pruebas con tu cuenta).

---

## 6) Actualizaciones futuras

```bash
# 1. sube versionCode (+1) y versionName en android/app/build.gradle
# 2.
npm run cap:sync
# 3. Android Studio → Generate Signed Bundle (mismo keystore) → nuevo .aab
# 4. Play Console → Producción → Nueva versión → subir AAB → publicar
```

---

## Política de privacidad (URL obligatoria para Play) — ya redactada ✅

Play Console **exige una URL pública** con la política de privacidad. Ya está lista en
`privacy/index.html` (bilingüe ES/EN, dice que la app **no recoge datos** y guarda las
listas **solo en el dispositivo**). Solo falta publicarla en una URL. La forma más fácil
y gratuita es **GitHub Pages**:

1. Crea un repo en GitHub (puede ser privado o público) y sube al menos el archivo
   `privacy/index.html`. Por ejemplo, dentro de una carpeta `docs/`:
   ```bash
   mkdir -p docs
   cp privacy/index.html docs/index.html
   git add docs/index.html && git commit -m "Add privacy policy page"
   git push
   ```
2. En GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch**,
   elige la rama `main` y la carpeta `/docs`. Guarda.
3. A los pocos minutos tu URL será algo como:
   `https://TU-USUARIO.github.io/TU-REPO/`
4. Pega esa URL en Play Console → **Política de privacidad** (paso 5.2 de arriba).

> Alternativas igual de válidas: Netlify Drop (arrastra la carpeta), Cloudflare Pages,
> Vercel, o cualquier hosting estático. Solo necesitas que el HTML quede accesible por
> una URL pública (https).

**Antes de publicar**, revisa el correo de contacto en `privacy/index.html`
(ahora `andres.rubio@teneo.ai`) y el nombre de la app si lo cambias por el de marca.

---

## Fuentes (tema retro) — ya autoalojadas ✅

Las fuentes **Cinzel, Cinzel Decorative y Spectral** están autoalojadas en
`src/fonts/*.woff2` con `@font-face` en `src/styles/fonts.css`. Vite las empaqueta
como assets relativos dentro de `dist/`, así que el look retro funciona **offline**
dentro del APK (sin depender de Google Fonts ni de internet).
