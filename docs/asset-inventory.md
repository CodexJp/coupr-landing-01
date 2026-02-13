# Inventario de Assets — Coupr Landing Page

> Generado: 2026-02-12 | Modo: initial_scan | Nivel: exhaustive

## Resumen

| Categoría | Cantidad | Tamaño Total |
|---|---|---|
| Brand (logos, favicon) | 2 | ~7.7KB |
| Media (video) | 1 | 13.6MB |
| Media (ilustraciones SVG) | 3 | 16MB |
| Media (screenshots JPG) | 4 | 2.4MB |
| Media (logos partners) | 1 | 24KB |
| **Total** | **11** | **~32MB** |

## Assets de Marca

| Archivo | Formato | Tamaño | Dimensiones | Uso |
|---|---|---|---|---|
| `assets/brand/coupr-logo.png` | PNG | 7KB | — | Logo principal, header de emails |
| `assets/brand/favicon.svg` | SVG | 652B | — | Favicon del sitio |

## Assets de Media

### Video

| Archivo | Formato | Tamaño | Uso | Notas |
|---|---|---|---|---|
| `assets/media/hero-video.mp4` | MP4 | 13.6MB | Hero section (autoplay loop muted) | Optimizado de 49MB (92% reducción). 1080p CRF 23 |

### Ilustraciones

| Archivo | Formato | Tamaño | Uso | Notas |
|---|---|---|---|---|
| `assets/media/ask.svg` | SVG | 2.0MB | Feature card "Ask" | Ilustración grande |
| `assets/media/explore.svg` | SVG | 6.2MB | Feature card "Explore" | Ilustración grande |
| `assets/media/discover.svg` | SVG | 7.7MB | Feature card "Discover" | Ilustración grande |

> **Nota**: Los SVGs son inusualmente grandes (2-7.7MB). Podrían beneficiarse de optimización con herramientas como SVGO.

### Screenshots de Producto

| Archivo | Formato | Tamaño | Uso |
|---|---|---|---|
| `assets/media/Map Landing.jpg` | JPEG | 393KB | Carousel slide — Mapa de tienda |
| `assets/media/Shop Page Landing.jpg` | JPEG | 682KB | Carousel slide — Página de compras |
| `assets/media/Deals Page Landing.jpg` | JPEG | 655KB | Carousel slide — Ofertas |
| `assets/media/Product Page Landing.jpg` | JPEG | 677KB | Carousel slide — Detalle de producto |

### Logos de Partners

| Archivo | Formato | Tamaño | Uso |
|---|---|---|---|
| `assets/media/milams-logo.png` | PNG | 24KB | Marquee de partners (repetido 12x) |

## Assets Externos (CDN)

| Recurso | CDN | Versión | Uso |
|---|---|---|---|
| Tailwind CSS | cdn.tailwindcss.com | Latest (runtime) | Framework CSS |
| Swiper.js CSS | cdn.jsdelivr.net | v11 | Estilos de carrusel |
| Swiper.js JS | cdn.jsdelivr.net | v11 | Lógica de carrusel |
| Google Fonts (Space Grotesk) | fonts.googleapis.com | Weights 300-700 | Tipografía display |
| Google Fonts (Inter) | fonts.googleapis.com | Weights 300-700 | Tipografía body |
| Material Symbols Outlined | fonts.googleapis.com | Weights 100-700 | Iconografía |

## Oportunidades de Optimización

| Asset | Problema | Solución Sugerida | Ahorro Estimado |
|---|---|---|---|
| SVGs (ask, explore, discover) | 2-7.7MB cada uno, extremadamente grandes | Optimizar con SVGO o convertir a WebP/PNG | 80-95% |
| hero-video.mp4 | 13.6MB (ya optimizado) | Considerar formato WebM como alternativa | 10-30% |
| JPGs del carousel | Sin nombres URL-friendly (espacios) | Renombrar sin espacios | — |
| CDN dependencies | 6 recursos externos sin control de versión fija | Considerar self-hosting o pin de versiones | — |
