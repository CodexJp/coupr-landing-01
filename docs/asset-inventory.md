# Inventario de Assets — Coupr Landing Page

> Generado: 2026-05-21 | Modo: full_rescan | Nivel: exhaustive

## Resumen

| Métrica | Valor |
|---|---|
| **Total de archivos** | 11 |
| **Peso total** | ~32 MB |
| **Distribución por tipo** | 1 video MP4 (13 MB), 3 SVG (15 MB ⚠️), 4 JPG (2.3 MB), 2 PNG (31 KB), 1 favicon SVG (652 B) |
| **Bottleneck principal** | SVGs de feature illustrations (`ask.svg`, `discover.svg`, `explore.svg`) que pesan **15 MB en conjunto** — sospecha de bitmaps embedidos |

## Listado Completo

### `assets/brand/`

| Archivo | Tamaño | Tipo | Uso en código |
|---|---|---|---|
| `coupr-logo.png` | 7.0 KB | PNG | Email HTML enviado por Lambda (`logoUrl = https://coupr.io/assets/brand/coupr-logo.png` en `lambdas/contact-form/index.js:54`) |
| `favicon.svg` | 652 B | SVG | `<link rel="icon" type="image/svg+xml" href="assets/brand/favicon.svg">` en `index.html:8` |

### `assets/media/`

| Archivo | Tamaño | Tipo | Uso |
|---|---|---|---|
| `hero-video.mp4` | 13.0 MB | MP4 | Video del hero — `<video autoplay loop muted playsinline src="assets/media/hero-video.mp4">` en `index.html:467` |
| `discover.svg` | 7.4 MB ⚠️ | SVG | Card "Discover" — `<img src="assets/media/discover.svg">` en `index.html:561` |
| `explore.svg` | 5.9 MB ⚠️ | SVG | Card "Explore" — `<img src="assets/media/explore.svg">` en `index.html:548` |
| `ask.svg` | 2.0 MB ⚠️ | SVG | Card "Ask" — `<img src="assets/media/ask.svg">` en `index.html:535` |
| `Shop Page Landing.jpg` | 666 KB | JPG | Slide 2 del Swiper screenshots (`index.html:763`) |
| `Product Page Landing.jpg` | 662 KB | JPG | Slide 4 del Swiper screenshots (`index.html:769`) |
| `Deals Page Landing.jpg` | 639 KB | JPG | Slide 3 del Swiper screenshots (`index.html:766`) |
| `Map Landing.jpg` | 383 KB | JPG | Slide 1 del Swiper screenshots (`index.html:760`) |
| `milams-logo.png` | 24 KB | PNG | Marquee "Live pilot program" — repetido 12 veces (6+6) en `index.html:484-518` |

## Análisis de Carga

### Total Above-The-Fold (visible al cargar)

| Asset | Peso | Crítico para LCP |
|---|---|---|
| `index.html` | 65 KB | ✅ |
| Tailwind CDN runtime | ~100 KB (gzipped) | ✅ |
| Swiper CSS | ~25 KB | ❌ (defer-able) |
| Google Fonts Inter + Space Grotesk | ~50 KB | ✅ (texto del hero) |
| Material Symbols | ~50 KB+ | ❌ (lazy candidate) |
| `hero-video.mp4` | 13 MB ⚠️ | ✅ (visible en hero) |

> El video del hero pesa 13 MB y se descarga inmediatamente por `autoplay`. Es el mayor contribuyente al tiempo total de carga y al consumo de datos del usuario.

### Below-The-Fold

| Asset | Peso | Cargado por |
|---|---|---|
| `ask.svg` + `explore.svg` + `discover.svg` | **15 MB** ⚠️ | `<img>` sin `loading="lazy"` — se descargan inmediatamente |
| `milams-logo.png` | 24 KB | Pero hay 12 referencias `<img>` al mismo archivo (el navegador debería cachear tras la 1ª) |
| 4 screenshots JPG | 2.3 MB total | Slides del Swiper, sin `loading="lazy"` |
| Swiper JS | ~150 KB | `<script src=...>` al final del body |

## Oportunidades de Optimización

### Alto Impacto (prioridad 1)

1. **`hero-video.mp4` (13 MB)**:
   - Generar una versión 720p más ligera (~4-6 MB) y servir condicional por viewport via `<source media="">`.
   - Considerar `preload="metadata"` en lugar de descarga completa.
   - Evaluar formato AV1 o WebM como alternativa (potencial reducción del 30-50%).
   - Considerar usar `poster` con imagen WebP para LCP.

2. **`discover.svg` (7.4 MB), `explore.svg` (5.9 MB), `ask.svg` (2 MB)**:
   - 15 MB en SVG es **anómalo**. Casi seguro tienen bitmaps embedidos (data URI base64). Sospechar: exportados desde Figma sin "Outline strokes" o con efectos rasterizados.
   - **Acción recomendada**: re-exportar como WebP o AVIF a 800×800 px (~30-100 KB c/u) o limpiar el SVG con SVGO en modo agresivo.
   - Agregar `loading="lazy"` a esos `<img>`.

### Medio Impacto (prioridad 2)

3. **Screenshots JPG (`Map`, `Shop`, `Deals`, `Product` Landing.jpg)**:
   - Convertir a WebP/AVIF (reducción del 30-50%).
   - Agregar `loading="lazy"` (están below-the-fold).
   - Considerar `srcset` con variantes responsive.

4. **`milams-logo.png` (24 KB × 12 referencias)**:
   - El navegador cachea la primera, pero el HTML pesa más al tener 12 `<img>` idénticos. Considerar reemplazar por una sola `<img>` posicionada con CSS `background-image` y `background-repeat` (o usar un sprite/SVG inline).

### Bajo Impacto (prioridad 3)

5. **`coupr-logo.png`** (7 KB): aceptable, pero podría ser SVG si está disponible para soportar emails con alto DPI.

## Convenciones de Naming Observadas

- `assets/brand/*` — identidad corporativa estable.
- `assets/media/*` — multimedia variable.
- Filenames con espacios en screenshots (`Map Landing.jpg`). Funciona, pero genera URLs con `%20` (`Map%20Landing.jpg`) — preferir `map-landing.jpg` para limpieza.

## Estrategia de Servido

Todos los assets se sirven directamente desde **S3 + CloudFront** vía sync del repo:

```bash
aws s3 sync . s3://<bucket> --exclude "..."
```

CloudFront cachea con:
- `min_ttl = 0`
- `default_ttl = 300` (5 min)
- `max_ttl = 86400` (24 h)

> ⚠️ Los TTLs cortos significan que tras un deploy de assets, hay que invalidar la caché de CloudFront (`/* `) para que se vea inmediatamente.

## Assets Externos (CDN)

| Recurso | Origen | Peso aprox |
|---|---|---|
| Tailwind CSS | `cdn.tailwindcss.com` | ~100 KB gzipped (compile en navegador) |
| Swiper CSS + JS | `cdn.jsdelivr.net/npm/swiper@11/...` | ~175 KB total |
| Google Fonts (Inter + Space Grotesk) | `fonts.googleapis.com` | ~50 KB |
| Material Symbols | `fonts.googleapis.com` (Material Symbols Outlined) | ~50 KB+ (variable font axes) |

## Política de Versionado de Assets

- No hay hashing en filenames (`assets/media/hero-video.mp4` sin `?v=`).
- CloudFront usa `default_ttl=300` (5 min), así que cualquier cambio se propaga rápido pero requiere invalidación para garantía.
- Para reemplazar un asset: subir con el mismo nombre + `aws cloudfront create-invalidation --paths "/assets/*"`.
