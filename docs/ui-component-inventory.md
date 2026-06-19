# Inventario de Componentes UI — Coupr Landing Page

> Generado: 2026-05-21 | Modo: full_rescan | Nivel: exhaustive

Todos los componentes están en `index.html` (single-file). No hay framework de componentes; cada "sección" es un bloque HTML con clases Tailwind.

## Design Tokens (paleta y tipografía)

Definidos en `tailwind.config` inline (`index.html:18-41`).

### Colores

| Token | Valor | Uso |
|---|---|---|
| `primary` | `#E1701A` | Marca principal — CTAs, acentos, links hover, "Best Choice", bordes activos del modal |
| `secondary` | `#1A4E5E` | Color complementario — cards oscuras (Explore, testimonios alternos, Mission section, "Decision Intelligence" header de email) |
| `off-white` | `#F8F8F8` | Fondo del body, bg de inputs disabled, bg de chips/badges suaves |
| `pure-white` | `#FFFFFF` | Cards principales, modal content, nav backdrop blur |
| `slate-subtle` | `#E5E7EB` | Bordes sutiles |
| `text-main` | `#1F2937` | Texto primario |
| `text-muted` | `#6B7280` | Texto secundario |

### Tipografía

| Familia | Carga | Uso |
|---|---|---|
| Inter | Google Fonts (weights 300/400/500/600/700) | Body, párrafos |
| Space Grotesk | Google Fonts (weights 300/400/500/600/700) | Headings, números grandes, marca "coupr" |

### Border Radius

| Token | Valor | Uso |
|---|---|---|
| `custom` | `1.5rem` | Cards principales, sections con fondo blanco |
| `asymmetric-border` (utility) | `4rem 1.5rem 4rem 1.5rem` | (definida pero no usada en HTML actual) |

### Iconografía

- **Material Symbols Outlined** — todos los iconos del sitio (cart, arrow, qr_code_scanner, compare_arrows, map, checklist, no_food, local_offer, trending_up, payments, visibility, verified, schedule, location_on, mail, close, check_circle, etc.)

## Patrones de Animación

| Patrón | Definición CSS | Aplicación |
|---|---|---|
| `animate-on-scroll` | opacity 0 → 1, translateY 30px → 0 sobre 0.6 s con cubic-bezier(0.16, 1, 0.3, 1) | Disparado por IntersectionObserver al entrar 10% del elemento (`rootMargin: 0px 0px -50px 0px`) |
| `animate-delay-{1,2,3,4}` | `transition-delay: 0.1s-0.4s` | Stagger para cards en grids |
| `animate-from-left` / `animate-from-right` | `translateX(±40px)` | Variantes laterales |
| `animate-scale` | `translateY(30px) scale(0.97)` | Variante con zoom para CTAs grandes |
| `hero-mockup-frame` | keyframe `mockupAppear` (1s ease-out delay 0.5s) | Video del hero |
| Marquee | keyframe `marquee` (20s linear infinite, 35s en md+, mask gradient en bordes) | Logos del programa piloto |
| Hover scale | `hover:scale-105`, `hover:-translate-y-2`, `hover:-translate-y-[10px]` | CTAs y cards |

## Inventario de Secciones (13 + modal)

Por orden de aparición en `index.html`.

### 1. Nav (línea 389)
- **Posición**: `fixed top-0`, full width, z-50.
- **Estilo**: `backdrop-blur-xl bg-pure-white/70` con border bottom sutil.
- **Contenido**: Logo (icono + wordmark "coupr") | Links desktop (Experience, Mission, Brands, Stories) | CTA primario "Get a Demo" (abre modal).
- **Responsive**: links ocultos en mobile (`hidden lg:flex`). CTA siempre visible.

### 2. Hero / Header (línea 419)
- **Layout**: 2 columnas en lg+ (texto izq, video der).
- **Texto izquierda**:
  - Pill animada "Innovation in Retail" con ping verde.
  - H1: "Ask anything. Your cart's got you." (got you. en `text-primary italic`).
  - Párrafo + 2 CTAs ("Get Your Free Demo" abre modal, "View Features" scroll a #process).
  - Subtitle: "No commitment required • 15-minute personalized walkthrough".
- **Video derecha**: `<video autoplay loop muted playsinline>` con `assets/media/hero-video.mp4`, rotado -2deg con cards decorativas detrás (`rotate-3` y `rotate-6`).

### 3. Live Pilot Program / Marquee (línea 474)
- **Header**: dos líneas finas + "Live pilot program".
- **Marquee**: 12 instancias del logo de Milam's Markets (`assets/media/milams-logo.png`) — 6 + 6 duplicado para loop continuo. Opacity 0.5, h-12.
- **Mask gradient**: lateral fade en bordes.

### 4. Features Intro — Ask / Explore / Discover (línea 523)
- **Layout**: 12-col grid, 4 col texto + 8 col grid de 3 cards.
- **Texto**: "Shop smarter, not harder." + descripción + barrita primary.
- **3 cards**:
  - **Ask** (blanca): ilustración `assets/media/ask.svg` + título uppercase + descripción.
  - **Explore** (secondary, oscura, con hover lift): ilustración `assets/media/explore.svg`.
  - **Discover** (blanca): ilustración `assets/media/discover.svg`.

### 5. Decision Intelligence / Process (línea 572) — `#process`
- **Layout**: 12-col grid, 7 col contenido + 5 col mockup.
- **Contenido izquierda**:
  - Tagline "DECISION INTELLIGENCE".
  - H2: "Make better choices in seconds."
  - 2 sub-features con iconos: **Scan & Identify** (`qr_code_scanner`) y **Side-by-Side** (`compare_arrows`).
- **Mockup derecha**: card blanca con "Side-by-side comparison" mostrando Brand A vs Brand B (badge "REAL-TIME", "Best Choice" + verified icon).

### 6. Powerful Features (línea 645)
- **Header centrado**: tagline + H2 "Everything you need to shop smarter".
- **Grid**: 4 cards en lg, 2 en md, 1 en mobile. Cada card con icono gradient + título uppercase + descripción.
- **Cards**:
  1. **Smart Navigation** (`map`)
  2. **Add Shopping List** (`checklist`)
  3. **Dietary Filters** (`no_food`)
  4. **Deals & Discounts** (`local_offer`)
- Hover: `hover:-translate-y-2`, `hover:shadow-2xl`, icon `scale-110`.

### 7. Mission (línea 685) — `#mission`
- **Estilo**: bg `secondary` (oscuro), padding grande, grid background sutil.
- **Tagline**: "OUR MISSION".
- **H2 enorme**: "In-store shopping hasn't had its **upgrade** yet." (upgrade en primary).
- **Dos párrafos en grid**: cita italic + bullet point.

### 8. Coupr Retail Media (línea 718) — `#retailer`
- **Audiencia**: B2B (brands & retailers).
- **Header**: tagline "FOR BRANDS & RETAILERS" + H2 "COUPR RETAIL MEDIA".
- **Pitch**: 3 párrafos sobre 90/10 split entre in-store vs online.
- **Grid 3 beneficios**: Higher Conversion (`trending_up`), Higher ROI (`payments`), Full-funnel reporting (`visibility`).
- **CTA**: "Claim your aisle today" (bg `secondary`, abre modal).

### 9. Screenshots Carousel (línea 756)
- **Implementación**: Swiper.js v11 (`.swiper-carousel`).
- **Config** (`index.html:1019-1060`): horizontal, centered, 1 slide visible (1.1/1.2/1.3 en breakpoints), autoplay 4s, pause on hover, navigation arrows, pagination, rewind, keyboard.
- **Slides**: 4 screenshots (`Map Landing.jpg`, `Shop Page Landing.jpg`, `Deals Page Landing.jpg`, `Product Page Landing.jpg`).
- **Estilo**: slides inactivos al 40% opacidad y scale 0.85; activo full opacity y scale 1. Drop shadow.

### 10. Testimonials (línea 780) — `#testimonials`
- **Header**: "Success Stories".
- **Implementación**: Swiper.js v11 (`.swiper-testimonials`).
- **Config** (`index.html:1063-1093`): 1 slide en mobile, 1.5 en sm, 2 en md, 3 en lg+. Autoplay 5s, loop continuo, paginación.
- **4 testimonios** con alternancia de color:
  1. **Sarah J.** (Busy Mom) — blanca
  2. **Diego M.** (Dad of 2) — secondary oscura
  3. **Alma P.** (Health Adv.) — blanca
  4. **Linda M.** (Weekly Shopper) — secondary oscura

### 11. CTA Final — "Ready to upgrade your store?" (línea 850)
- **Estilo**: bg `primary` naranja, rounded `[3rem]`, watermark "COUPR" gigante al fondo (5% opacity).
- **Contenido**: H2 grande + párrafo + botón blanco "Get Your Free Demo" (abre modal) + footer "15-minute call • No commitment • See results in action".

### 12. Footer (línea 871)
- **Grid 12-col**: 5 col brand + 7 col en 3 sub-cols.
- **Brand**: logo + descripción + chips (location_on New York NY, mail contact@coupr.io).
- **Columnas**:
  - **Product**: Experience, Brands Program.
  - **Company**: Mission, Success Stories.
  - **Connect**: Instagram (SVG inline), LinkedIn (SVG inline).
- **Bottom bar**: copyright "© 2026 Coupr Inc. — Engineered for Excellence" + Privacy Policy (link a coupr-web.web.app) + Terms & Conditions (link a coupr-web.web.app) + CTA secundario "Schedule a Demo".

### 13. Demo Modal (línea 949-1013) — `#demoModal`
- **Estructura**: overlay + container + content separados para animaciones (overlay `position: fixed inset-0`, container con `pointer-events: none` excepto el `.modal-content`).
- **Activación**: cualquier botón con `onclick="openModal()"`. Cerrado por click en overlay, click en X, o tecla Escape.
- **Animación de entrada**: opacity 0→1 y `translateY(20px) scale(0.95)` → `translateY(0) scale(1)` sobre 0.4s cubic-bezier.
- **Body lock**: clase `modal-open` agrega `overflow: hidden` al body.
- **Encabezado**: H3 "Let's work together" + subtitle "We'd love to show you around." + botón close (`close` icon).
- **Contact info**: 3 chips (location_on, phone "(1) 857 498 0040", mail "contact@coupr.io").
- **Form** (`#demoForm`):
  - 5 inputs requeridos: fullName, email, organization, role, mobile.
  - 1 textarea opcional: message (rows=3).
  - Botón submit "Request a Demo" (full width, `bg-text-main` con hover a `bg-primary`).
- **Comportamiento submit** (`index.html:1161-1228`):
  1. Previene default.
  2. `FormData` → `Object.fromEntries`.
  3. Disable button, "Sending..." state, opacity 70%.
  4. `fetch(CONTACT_ENDPOINT, POST, JSON)`.
  5. Si OK: replace form HTML con success state (check_circle icon + "Thank you! We'll be in touch within 24 hours.") → cierra modal a los 3s → restaura form HTML 400ms después.
  6. Si error: muestra mensaje rojo "Something went wrong. Please try again." debajo del botón por 5s, re-habilita botón.

## JavaScript Inline (index.html:1017-1229)

| Bloque | Responsabilidad |
|---|---|
| 1019-1060 | Init Swiper screenshots (`new Swiper('.swiper-carousel', {...})`) |
| 1063-1093 | Init Swiper testimonials (`new Swiper('.swiper-testimonials', {...})`) |
| 1095-1113 | `IntersectionObserver` para `.animate-on-scroll` (threshold 0.1, rootMargin top -50px) |
| 1116-1132 | Smooth scroll para `a[href^="#"]` con offset de 100px (alto de nav) |
| 1134-1155 | `openModal()` / `closeModal()` + listeners (click overlay, tecla Escape) |
| 1157-1228 | Submit del form: fetch al `CONTACT_ENDPOINT`, estados de loading/success/error |

## Patrones Reutilizables

| Patrón | Lugares donde aparece |
|---|---|
| **CTA primary pill**: `bg-primary text-white font-black py-3 px-5 md:py-4 md:px-8 rounded-full text-[10px] md:text-xs tracking-widest uppercase` | Nav, hero, retailer, CTA final, modal submit (variante) |
| **Card hover lift**: `hover:border-primary/50 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500` | Features grid, Ask/Explore/Discover (variantes) |
| **Tagline label**: `text-primary font-black tracking-[0.4em] uppercase text-[10px]` | Antes de cada H2 |
| **Pill icon round**: `w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/25` | Iconos en Powerful Features |
| **Section large**: `mb-24 rounded-custom border border-slate-subtle/30 p-12 lg:p-20` | Mission, Retailer, Decision Intelligence |
| **Container max-width**: `max-w-[1600px] mx-auto px-8` | Nav, main, footer |

## Accesibilidad — Estado actual

- ✅ `<html lang="en">` declarado.
- ✅ Semántica: `<nav>`, `<header>`, `<main>`, `<section>`, `<footer>`, headings jerárquicos H1→H4.
- ✅ Imágenes con `alt` (incluyendo el marquee y los screenshots del Swiper).
- ✅ Modal con focus management básico (Escape para cerrar).
- ⚠️ El modal no tiene `role="dialog"` ni `aria-modal="true"` ni `aria-labelledby` apuntando al H3.
- ⚠️ Los botones `<button onclick>` no tienen `aria-label` explícitos para CTAs con iconos.
- ⚠️ Los Swiper carousels no anuncian cambio de slide a screen readers.
- ⚠️ Contrast ratio del texto `text-text-muted` (#6B7280) sobre fondos `off-white` cumple WCAG AA para tamaños grandes pero hay que verificar en cuerpo pequeño.
- ⚠️ El video del hero no tiene `<track>` con captions/descripción.

## Convenciones Observadas

- **Mobile-first responsive**: `text-3xl lg:text-7xl`, `py-3 md:py-4`, `hidden lg:flex`, etc.
- **Espaciado**: secciones separadas por `mb-24` (96px). Paddings internos `p-12 lg:p-20`.
- **Letter spacing**: `tracking-[0.2em]` a `tracking-[0.5em]` para taglines pequeños uppercase; `tracking-tight`/`tracking-tighter` para headings grandes.
- **Container query plugin** está cargado pero no se observa uso de `@container`.
