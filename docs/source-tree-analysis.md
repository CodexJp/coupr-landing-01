# Análisis de Árbol de Código Fuente — Coupr Landing Page

> Generado: 2026-05-21 | Modo: full_rescan | Nivel: exhaustive

Análisis exhaustivo archivo por archivo. Cada entrada incluye propósito, tamaño aproximado, y relaciones con otros archivos.

## Vista General

```text
landingpage/
├── index.html               ← Frontend completo (single file)
├── README.md                ← Doc principal del proyecto
├── .gitignore
├── assets/
│   ├── brand/               ← Identidad (logo + favicon)
│   └── media/               ← Video, ilustraciones, screenshots, logos retailer
├── lambdas/
│   └── contact-form/
│       └── index.js         ← Lambda handler (Node.js 20.x)
├── infra/
│   └── terraform/           ← IaC completa (AWS)
├── _bmad-output/            ← Artefactos BMAD (planning + impl)
└── docs/                    ← Esta documentación
```

## Entry Points

| Capa | Archivo | Línea / Símbolo | Activación |
|---|---|---|---|
| Frontend | `index.html` | Documento completo | Servido por CloudFront como `default_root_object` |
| JS Cliente | `index.html` | `<script>` en líneas 1017-1229 | Carga al final del `<body>` |
| Backend | `lambdas/contact-form/index.js` | `exports.handler` (línea 15) | Invocado por API Gateway v2 (POST /contact) |
| Infra | `infra/terraform/main.tf` + `provider.tf` | — | `terraform init → plan → apply` |

## Archivos Críticos en Detalle

### 1. `index.html` — Frontend completo

**Tamaño**: 1231 líneas, ~65 KB.

**Estructura interna (rangos de línea aproximados)**:

| Rango | Contenido |
|---|---|
| 1-15 | `<head>`: meta, favicon, Tailwind CDN, Google Fonts (Inter + Space Grotesk), Material Symbols, Swiper CSS |
| 18-41 | Config inline de Tailwind (extends: colors, fontFamily, borderRadius) |
| 42-385 | Estilos inline (`<style type="text/tailwindcss">`): swiper, modal, marquee, scroll animations |
| 389-417 | `<nav>` fijo top con logo, navegación desktop y CTA "Get a Demo" |
| 419-473 | `<header>` hero con título "Ask anything. Your cart's got you." + video mockup |
| 474-522 | `<section>` "Live pilot program" — marquee de logos (Milam's repetidos) |
| 523-571 | `<section>` "Shop smarter, not harder." — 3 cards (Ask/Explore/Discover) |
| 572-644 | `<section id="process">` "Decision Intelligence" — Scan & Identify + Side-by-side |
| 645-684 | `<section>` "Powerful Features" — 4 cards (Smart Navigation, Add Shopping List, Dietary Filters, Deals) |
| 685-717 | `<section id="mission">` "Our Mission" — texto grande con afirmación |
| 718-753 | `<section id="retailer">` "COUPR RETAIL MEDIA" — pitch B2B con 3 beneficios |
| 756-778 | `<section>` Carrusel Swiper de screenshots (Map, Shop, Deals, Product) |
| 780-849 | `<section id="testimonials">` Carrusel Swiper de testimonios (4 cards) |
| 850-869 | `<section>` CTA final "Ready to upgrade your store?" |
| 871-947 | `<footer>` con Product/Company/Connect + redes + privacidad/términos |
| 949-1013 | Modal de demo (`#demoModal`) con form de 6 campos |
| 1016-1229 | `<script>`: Swiper init, IntersectionObserver, smooth scroll, modal, form submit con fetch() |

**Dependencias externas (cargadas en runtime)**:
- `cdn.tailwindcss.com?plugins=forms,typography,container-queries`
- `fonts.googleapis.com` (Space Grotesk + Inter)
- `fonts.googleapis.com/css2?family=Material+Symbols+Outlined`
- `cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.{css,js}`

**Dependencia interna crítica**:
- `index.html:1158` define `CONTACT_ENDPOINT = 'https://vo29nu6c83.execute-api.us-east-1.amazonaws.com/contact'` — debe actualizarse manualmente tras cada `terraform apply` que cambie el API Gateway.

### 2. `lambdas/contact-form/index.js` — Handler de contacto

**Tamaño**: 167 líneas, ~7.6 KB.

**Símbolos exportados**:
- `exports.handler` (async) — entry point

**Flujo del handler**:
1. Detecta método OPTIONS → responde 200 con CORS headers (preflight).
2. Parsea `event.body` (JSON string o objeto).
3. Valida campos requeridos: `fullName`, `email`, `organization`, `role`, `mobile` → 400 si faltan.
4. Valida formato de email con regex `^[^\s@]+@[^\s@]+\.[^\s@]+$` → 400 si inválido.
5. Trunca todos los campos a 500 caracteres (anti-abuso).
6. Construye HTML body de email (template inline, con tabla bonita y logo).
7. Envía via `SESClient.send(SendEmailCommand)` (AWS SDK v3 incluido en runtime).
8. Responde 200 con `{ message: 'Email sent successfully' }` o 500 si error.

**Función auxiliar**:
- `escapeHtml(str)` (línea 159-167) — escapa `&<>"'` para evitar HTML injection en el email.

**Variables de entorno requeridas** (set por Terraform):
- `SENDER_EMAIL` (default: `contact@coupr.io`)
- `RECIPIENT_EMAIL` (configurado vía `terraform.tfvars`)

### 3. `infra/terraform/` — Infraestructura completa

| Archivo | LOC | Recursos definidos |
|---|---|---|
| `provider.tf` | 27 | `terraform` block (provider AWS ~> 5.0, backend local) + `provider "aws"` con default_tags (Environment, Terraform, Project, Owner) |
| `variables.tf` | 35 | `aws_region` (default `us-east-1`), `recipient_email` (sensitive), `sender_email`, `project_name` (default `coupr-landing`), `environment` (default `dev`), `acm_certificate_arn` (default hardcoded a un cert en cuenta dev) |
| `main.tf` | 29 | `aws_apigatewayv2_api.landing` (HTTP), `aws_apigatewayv2_stage.default` (auto_deploy), `aws_apigatewayv2_integration.contact_form` (AWS_PROXY, payload v2.0), `aws_apigatewayv2_route.post_contact` (POST /contact) |
| `lambda.tf` | 82 | `data.aws_caller_identity.current`, `data.archive_file.contact_form` (zip de `lambdas/contact-form/`), `aws_iam_role.contact_form_lambda` (assume role lambda), `aws_iam_role_policy.contact_form_ses` (ses:SendEmail/SendRawEmail), `aws_iam_role_policy_attachment.lambda_basic` (AWSLambdaBasicExecutionRole), `aws_lambda_function.contact_form` (Node.js 20.x, 128MB, 10s timeout, env RECIPIENT_EMAIL/SENDER_EMAIL), `aws_lambda_permission.apigw`, `aws_cloudwatch_log_group.contact_form` (retention 14 días) |
| `cloudfront.tf` | 117 | `aws_s3_bucket.static_site`, `aws_s3_bucket_public_access_block.static_site` (todo bloqueado), `aws_cloudfront_origin_access_control.static_site` (sigv4), `aws_cloudfront_distribution.static_site` (aliases coupr.io + www.coupr.io, default_root_object index.html, redirect-to-https, custom error 403→200 /index.html, TLSv1.2_2021), `data.aws_route53_zone.coupr`, `aws_route53_record.root` (A alias), `aws_route53_record.www` (CNAME), `aws_s3_bucket_policy.static_site` (permite GetObject solo a CloudFront via SourceArn) |
| `outputs.tf` | 39 | `api_endpoint`, `contact_form_url`, `lambda_function_name`, `lambda_function_arn`, `cloudfront_domain`, `cloudfront_distribution_id`, `s3_bucket_name`, `landing_url` |
| `terraform.tfvars.example` | (43 B) | Template para inputs |
| `terraform.tfvars` | (36 B, gitignored) | Valor real de `recipient_email` |
| `terraform.tfstate{.backup}` | (gitignored) | Estado local (~30 KB) |
| `contact-form.zip` | (gitignored) | Artefacto generado por `archive_file` |
| `.terraform.lock.hcl` | (gitignored) | Lock de versiones de providers |

### 4. `assets/`

#### `assets/brand/`
- `coupr-logo.png` (7 KB) — logo principal usado en emails de SES.
- `favicon.svg` (652 B) — favicon vectorial.

#### `assets/media/`
- `hero-video.mp4` (13 MB) — video del hero (autoplay/loop/muted).
- `ask.svg` (2 MB), `explore.svg` (5.9 MB), `discover.svg` (7.4 MB) — ilustraciones de feature cards. ⚠️ Pesadas para SVG (probablemente contienen rasterizados).
- `milams-logo.png` (24 KB) — logo del retailer del programa piloto, usado en marquee (repetido 12 veces).
- `Map Landing.jpg`, `Shop Page Landing.jpg`, `Deals Page Landing.jpg`, `Product Page Landing.jpg` (383-666 KB c/u) — screenshots de la app, mostrados en el Swiper.

### 5. `_bmad-output/`

#### `planning-artifacts/ceo-feedback-dev-brief.md`
12 cambios solicitados por el CEO en febrero 2026 (hero text/video, marquee, feature cards, etc.). Referencia histórica.

#### `implementation-artifacts/tech-spec-landing-infra-contact-form.md`
Especificación técnica original de la infraestructura del contact form. Útil como documentación de las decisiones de diseño (provider version, identity SES, runtime Node, etc.).

#### `test-artifacts/`
Vacía actualmente. Reservada para artefactos de QA.

### 6. `README.md`

391 líneas. Quickstart, comandos útiles, troubleshooting. Es la guía operativa principal. **Atención**: el endpoint que documenta para el contact form (`s04r3s9ik7…`) está desactualizado respecto a `index.html:1158` (`vo29nu6c83…`).

## Carpetas Críticas (resumen)

| Carpeta | Propósito | Modificación frecuente |
|---|---|---|
| `assets/media/` | Multimedia del sitio | Baja — cambia con rebrand o release de features |
| `lambdas/contact-form/` | Lógica del backend | Baja — handler estable |
| `infra/terraform/` | Infraestructura AWS | Media — cambios cuando se agrega/quita recursos |
| `_bmad-output/` | Planning + implementación | Alta durante fases de planning, baja en mantenimiento |
| `docs/` | Documentación del proyecto | Regenerable via `/bmad-document-project` |

## Archivos NO Versionados (gitignored)

- `infra/terraform/.terraform/` (providers descargados)
- `infra/terraform/terraform.tfstate{,.backup}` (state local)
- `infra/terraform/terraform.tfvars` (datos sensibles)
- `infra/terraform/.terraform.lock.hcl`
- `infra/terraform/*.zip` (artefactos de empaquetado Lambda)
- `.claude/`, `.cursor/`, `.vscode/`, `.idea/` (config de IDEs/agents)
- `.playwright-mcp/` (capturas)
- `node_modules/` (si llegan a existir)
- `.env*`, `*.log`, `.DS_Store`
