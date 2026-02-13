# Inventario de Componentes UI — Coupr Landing Page

> Generado: 2026-02-12 | Modo: initial_scan | Nivel: exhaustive

## Resumen

La landing page es un archivo HTML único sin framework de componentes. Los "componentes" son secciones HTML reutilizables estilizadas con Tailwind CSS. No existe un sistema de diseño formal — los estilos se aplican directamente con clases de utilidad.

## Design Tokens (Tailwind Config)

### Colores

| Token | Valor | Uso |
|---|---|---|
| `primary` | `#E1701A` | Color principal (naranja Coupr) — CTAs, acentos, badges |
| `secondary` | `#1A4E5E` | Color secundario (azul teal) — Fondos oscuros, secciones |
| `off-white` | `#F8F8F8` | Fondo general de la página |
| `pure-white` | `#FFFFFF` | Fondos de tarjetas y paneles |
| `slate-subtle` | `#E5E7EB` | Bordes y separadores sutiles |
| `text-main` | `#1F2937` | Texto principal |
| `text-muted` | `#6B7280` | Texto secundario/muted |

### Tipografía

| Token | Font | Uso |
|---|---|---|
| `font-display` | Space Grotesk | Headings (h1-h4), logo, títulos |
| `font-sans` | Inter | Body text, párrafos, labels |

### Border Radius

| Token | Valor | Uso |
|---|---|---|
| `rounded-custom` | `1.5rem` | Tarjetas y secciones principales |
| `rounded-full` | — | Botones CTA, badges |
| `rounded-2xl` | — | Iconos, sub-componentes |

## Secciones de la Landing Page

### 1. Navegación (`<nav>`)
- **Tipo**: Layout — Header fijo
- **Posición**: `fixed top-0 w-full z-50`
- **Estilo**: Glass panel (`backdrop-blur-xl bg-pure-white/70`)
- **Contenido**: Logo Coupr + 4 links de navegación + CTA "Get a Demo"
- **Responsive**: Links ocultos en mobile (`hidden lg:flex`)

### 2. Hero Section (`<header>`)
- **Tipo**: Layout — Hero split
- **Layout**: 2 columnas (texto izquierda, video derecha)
- **Elementos**:
  - Badge "Innovation in Retail" con punto animado (`animate-ping`)
  - Heading principal (`text-4xl lg:text-6xl xl:text-7xl`)
  - Subtítulo descriptivo
  - 2 CTAs: "Get Your Free Demo" (primary) + "View Features" (secondary)
  - Nota de confianza con ícono verificado
  - Video mockup con tarjetas decorativas apiladas rotadas

### 3. Marquee de Partners (`<section>`)
- **Tipo**: Display — Logo marquee
- **Estilo**: Fondo blanco con bordes, animación CSS infinita
- **Contenido**: Logo de Milam's Markets repetido (12 items para loop seamless)
- **Label**: "Live pilot program"
- **Animación**: `marquee 20s linear infinite` (35s en desktop)

### 4. Feature Cards — Ask/Explore/Discover (`<section>`)
- **Tipo**: Display — Grid de tarjetas
- **Layout**: Grid 12 columnas (4 col texto + 8 col tarjetas)
- **Tarjetas**: 3 tarjetas con ilustraciones SVG
  - **Ask** (blanca) — Buscar productos, precios, ingredientes
  - **Explore** (secondary/azul) — Comprar según necesidades
  - **Discover** (blanca) — Recomendaciones personalizadas
- **Hover**: Border primary + translate-y

### 5. Decision Intelligence (`<section id="process">`)
- **Tipo**: Layout — Split section
- **Layout**: Grid 12 columnas (7 col info + 5 col demo)
- **Elementos**:
  - 2 sub-features: "Scan & Identify" + "Side-by-Side"
  - Demo interactiva: comparación de producto simulada (Brand A vs Brand B)
  - Badge "Best Choice" en tarjeta ganadora

### 6. Powerful Features Grid (`<section>`)
- **Tipo**: Display — Feature grid
- **Layout**: Grid 4 columnas (12 col mobile)
- **Tarjetas**: 4 feature cards con iconos
  - Smart Navigation (map)
  - Add Shopping List (checklist)
  - Dietary Filters (no_food)
  - Deals & Discounts (local_offer)
- **Hover**: Border primary + shadow + translate-y + icon scale

### 7. Mission Section (`<section id="mission">`)
- **Tipo**: Display — Full-width statement
- **Estilo**: Fondo secondary con grid decorativo
- **Contenido**: Heading grande (120px desktop), cita, descripción
- **Texto clave**: "In-store shopping hasn't had its upgrade yet."

### 8. Coupr Retail Media (`<section id="retailer">`)
- **Tipo**: Display — CTA section (B2B)
- **Estilo**: Fondo blanco con bordes
- **Contenido**:
  - 3 benefit icons (Higher Conversion, Higher ROI, Full-funnel reporting)
  - CTA "Claim your aisle today"
- **Target**: Marcas y retailers

### 9. Screenshot Carousel (`<section>`)
- **Tipo**: Display — Swiper carousel
- **Library**: Swiper.js v11
- **Slides**: 4 screenshots del producto (JPG)
- **Features**: Navegación, paginación, autoplay (4s), keyboard, responsive breakpoints
- **Efecto**: Slides no activos con opacity 0.4 y scale 0.85

### 10. Success Stories / Testimonios (`<section id="testimonials">`)
- **Tipo**: Display — Swiper carousel de testimonios
- **Testimonios**: 4 tarjetas (alternando blanco/azul)
  - Sarah J. (Busy Mom)
  - Diego M. (Dad of 2) — azul
  - Alma P. (Health Adv.)
  - Linda M. (Weekly Shopper) — azul
- **Features**: Loop, autoplay (5s), responsive (1-3 slides visibles)

### 11. CTA Final (`<section>`)
- **Tipo**: Display — Full-width CTA
- **Estilo**: Fondo primary con texto watermark "COUPR"
- **Contenido**: Heading "Ready to upgrade your store?" + CTA + nota de tiempo
- **Scale**: Heading 100px en desktop

### 12. Footer (`<footer>`)
- **Tipo**: Layout — Footer multi-columna
- **Layout**: Grid 12 columnas (5 col brand + 7 col links)
- **Columnas**: Product, Company, Connect (Instagram + LinkedIn)
- **Bottom bar**: Copyright + Privacy Policy + Terms & Conditions + Schedule Demo

### 13. Modal de Demo Request
- **Tipo**: Feedback — Modal overlay
- **Trigger**: Múltiples botones `onclick="openModal()"`
- **Campos**: fullName, email, organization, role, mobile, message
- **Submit**: POST a API Gateway → success message → auto-close 3s
- **Estilos**: Glass overlay + slide-up animation + rounded corners
- **Cierre**: Click overlay, botón X, tecla Escape

## Patrones de Animación

| Patrón | Clase CSS | Comportamiento |
|---|---|---|
| Scroll reveal | `.animate-on-scroll` | Fade-in + translate-y con Intersection Observer |
| Stagger | `.animate-delay-1..4` | Delay incremental 0.1-0.4s |
| Slide from left | `.animate-from-left` | translateX(-40px) → 0 |
| Slide from right | `.animate-from-right` | translateX(40px) → 0 |
| Scale | `.animate-scale` | scale(0.97) → 1 |
| Hero mockup | `.hero-mockup-frame` | Keyframe: translateY(40px) + scale(0.96) → normal |
| Marquee | `.marquee-content` | translateX(0) → translateX(-50%) infinite |
| Modal | `.modal-overlay.active` | opacity 0→1, content translateY(20px)→0 |

## Componentes Reutilizables (Patrones CSS)

| Clase | Descripción |
|---|---|
| `.glass-panel` | `backdrop-blur-md bg-pure-white/90 border border-slate-subtle/50` |
| `.floating-element` | `shadow-2xl transition-all duration-500 hover:-translate-y-2` |
| `.modular-grid` | Grid 12 columnas con gap 1.5rem |
| `.asymmetric-border` | `border-radius: 4rem 1.5rem 4rem 1.5rem` |
| `.feature-image-container` | Container con hover scale + shadow para imágenes |
