# Análisis de Árbol de Código Fuente — Coupr Landing Page

> Generado: 2026-02-12 | Modo: initial_scan | Nivel: exhaustive

## Árbol Completo Anotado

```
landingpage/                        # Raíz del repositorio
├── index.html                      # ★ ENTRY POINT — Landing page completa (~1230 líneas)
│                                   #   HTML + Tailwind CSS inline + Vanilla JS
│                                   #   Secciones: Nav, Hero, Marquee, Features,
│                                   #   Mission, Brands, Carousel, Testimonials,
│                                   #   CTA, Footer, Modal de contacto
│
├── README.md                       # Documentación del proyecto (vacío)
├── .gitignore                      # Exclusiones: Terraform state, .env, IDE, node_modules
│
├── assets/                         # Assets estáticos
│   ├── brand/                      # Identidad de marca
│   │   ├── coupr-logo.png          # Logo principal (7KB, PNG)
│   │   └── favicon.svg             # Favicon del sitio (652B, SVG)
│   │
│   └── media/                      # Assets multimedia
│       ├── hero-video.mp4          # ★ Video hero autoplay (13.6MB, optimizado)
│       ├── ask.svg                 # Ilustración feature "Ask" (2MB)
│       ├── explore.svg             # Ilustración feature "Explore" (6.2MB)
│       ├── discover.svg            # Ilustración feature "Discover" (7.7MB)
│       ├── milams-logo.png         # Logo partner Milam's Markets (24KB)
│       ├── Map Landing.jpg         # Screenshot UI: mapa de tienda (393KB)
│       ├── Shop Page Landing.jpg   # Screenshot UI: página de compras (682KB)
│       ├── Deals Page Landing.jpg  # Screenshot UI: ofertas (655KB)
│       └── Product Page Landing.jpg # Screenshot UI: detalle de producto (677KB)
│
├── infra/                          # Infraestructura como código
│   └── terraform/                  # Terraform IaC (AWS)
│       ├── provider.tf             # Provider AWS ~> 5.0, backend local
│       ├── main.tf                 # API Gateway HTTP + Route POST /contact
│       ├── cloudfront.tf           # S3 + CloudFront + Route53 + OAC
│       ├── lambda.tf               # Lambda + IAM + CloudWatch
│       ├── variables.tf            # 6 variables (region, emails, project_name, etc.)
│       ├── outputs.tf              # 8 outputs (URLs, ARNs, IDs)
│       ├── terraform.tfvars.example # Ejemplo de variables (sin datos sensibles)
│       ├── terraform.tfvars        # ⚠️ Variables sensibles (no en git)
│       ├── terraform.tfstate       # ⚠️ State local (no en git)
│       └── .terraform/             # ⚠️ Provider cache (no en git)
│
├── lambdas/                        # Funciones serverless
│   └── contact-form/               # Handler de formulario de contacto
│       └── index.js                # ★ Lambda handler: validar → HTML email → SES
│                                   #   Node.js 20.x, AWS SDK v3 (built-in)
│                                   #   Fields: fullName, email, org, role, mobile, message
│
├── _bmad/                          # BMAD framework (herramientas de desarrollo)
│   ├── core/                       # Core del framework
│   ├── bmm/                        # Módulo BMM (workflows, config)
│   └── _memory/                    # Memoria persistente
│
├── _bmad-output/                   # Artefactos generados por BMAD
│   ├── planning-artifacts/         # Briefs y planificación
│   │   └── ceo-feedback-dev-brief.md  # 12 cambios del CEO (Feb 2026)
│   └── implementation-artifacts/   # Specs técnicas
│       └── tech-spec-landing-infra-contact-form.md  # Spec de infra + contacto
│
└── docs/                           # Documentación del proyecto (generada)
    └── ...                         # Archivos generados por este workflow
```

## Carpetas Críticas

| Carpeta | Propósito | Criticidad |
|---|---|---|
| `/` (raíz) | Entry point `index.html` | **Alta** — Todo el frontend |
| `assets/brand/` | Logo y favicon | **Media** — Identidad visual |
| `assets/media/` | Video, ilustraciones, screenshots | **Alta** — Contenido visual de la landing |
| `infra/terraform/` | Toda la infraestructura AWS | **Alta** — Hosting, CDN, API, Lambda |
| `lambdas/contact-form/` | Handler del formulario | **Alta** — Único endpoint de backend |

## Entry Points

| Entry Point | Tipo | Descripción |
|---|---|---|
| `index.html` | Frontend | Página principal, cargada por CloudFront |
| `lambdas/contact-form/index.js:handler` | Backend | Lambda handler, invocada por API Gateway |
| `infra/terraform/main.tf` | IaC | Punto de entrada de Terraform |

## Estadísticas del Código

| Archivo | Líneas | Tamaño | Tipo |
|---|---|---|---|
| `index.html` | ~1230 | 65.5KB | HTML + CSS + JS |
| `lambdas/contact-form/index.js` | 168 | 7.6KB | JavaScript (Node.js) |
| `infra/terraform/cloudfront.tf` | 117 | 3.1KB | HCL |
| `infra/terraform/lambda.tf` | 83 | 2.4KB | HCL |
| `infra/terraform/main.tf` | 30 | 860B | HCL |
| `infra/terraform/variables.tf` | 36 | 923B | HCL |
| `infra/terraform/outputs.tf` | 40 | 1.2KB | HCL |
| `infra/terraform/provider.tf` | 27 | 410B | HCL |
| **Total código** | **~1731** | **~81KB** | — |
