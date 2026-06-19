# Estructura del Proyecto — Coupr Landing Page

> Generado: 2026-05-21 | Modo: full_rescan | Nivel: exhaustive

## Clasificación

| Atributo | Valor |
|---|---|
| **Tipo de Repositorio** | Monolito |
| **Partes (parts)** | 1 — `landing` |
| **Project Type ID** | `web` |
| **Sistema de Build** | Ninguno (HTML estático servido tal cual) |
| **Sistema de Paquetes** | Ninguno en raíz (no hay `package.json`) |
| **Runtime Lambda** | Node.js 20.x (AWS SDK v3 incluido) |
| **IaC** | Terraform `>= 1.0` |

## Stack Detallado por Capa

### Frontend (en `index.html` único, 1231 líneas)

| Categoría | Tecnología | Versión / Carga |
|---|---|---|
| Markup | HTML5 | Single-page, sin frameworks |
| CSS | Tailwind CSS | CDN runtime (`cdn.tailwindcss.com`) con plugins `forms`, `typography`, `container-queries` |
| CSS adicional | Tailwind directives | Inline `<style type="text/tailwindcss">` con `@layer base` y custom utilities |
| Carruseles | Swiper.js | v11 (CDN: `cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.{js,css}`) |
| Iconos | Material Symbols | Outlined (Google Fonts API) |
| Tipografía | Inter + Space Grotesk | Google Fonts |
| JavaScript | Vanilla JS | Inline en `<script>` al final del `<body>` |

### Backend (Lambda)

| Categoría | Tecnología | Detalle |
|---|---|---|
| Runtime | Node.js 20.x | Provisto por AWS, sin `package.json` propio |
| SDK | `@aws-sdk/client-ses` | Incluido en runtime AWS Lambda Node.js 20.x |
| Handler | `index.handler` | En `lambdas/contact-form/index.js` (167 líneas) |
| Memoria | 128 MB | Configurado en Terraform |
| Timeout | 10 s | Configurado en Terraform |

### Infraestructura (Terraform)

| Categoría | Tecnología | Detalle |
|---|---|---|
| Provider AWS | hashicorp/aws | `~> 5.0` |
| Backend | local | `terraform.tfstate` en disco (`infra/terraform/terraform.tfstate`) |
| Región | `us-east-1` | Definida en `var.aws_region` |
| Cuenta | dev `009160036798` | Hardcoded en `acm_certificate_arn` default |

## Layout de Carpetas

```text
landingpage/
├── index.html                # ÚNICO entry point del frontend (HTML + CSS + JS inline)
├── README.md                 # Documentación principal del proyecto (con quickstart)
├── .gitignore                # Excluye .terraform/, terraform.tfstate, .env, etc.
│
├── assets/                   # Recursos estáticos (servidos directamente desde S3)
│   ├── brand/                # Identidad: logo y favicon
│   │   ├── coupr-logo.png    # 7 KB
│   │   └── favicon.svg       # 652 B
│   └── media/                # Multimedia de la landing
│       ├── hero-video.mp4    # 13 MB (video del hero)
│       ├── ask.svg           # 2 MB
│       ├── discover.svg      # 7.4 MB ⚠️
│       ├── explore.svg       # 5.9 MB ⚠️
│       ├── milams-logo.png   # 24 KB (logo del retailer en marquee)
│       ├── Map Landing.jpg          # 383 KB
│       ├── Shop Page Landing.jpg    # 666 KB
│       ├── Deals Page Landing.jpg   # 639 KB
│       └── Product Page Landing.jpg # 662 KB
│
├── lambdas/
│   └── contact-form/
│       └── index.js          # Handler: parse → valida → SES → response (167 líneas)
│
├── infra/
│   └── terraform/
│       ├── provider.tf       # AWS provider ~> 5.0 + backend local + default_tags
│       ├── main.tf           # API Gateway v2 HTTP + route POST /contact + CORS
│       ├── cloudfront.tf     # S3 + CloudFront + OAC + Route53 (coupr.io, www)
│       ├── lambda.tf         # Lambda + IAM role + SES policy + CloudWatch log group
│       ├── variables.tf      # aws_region, recipient_email, sender_email, project_name, etc.
│       ├── outputs.tf        # api_endpoint, lambda_*, cloudfront_*, s3_bucket_name, landing_url
│       └── terraform.tfvars.example  # Template para inputs sensibles
│
├── _bmad-output/             # Artefactos del flujo BMAD (planificación/implementación)
│   ├── planning-artifacts/
│   │   └── ceo-feedback-dev-brief.md   # 12 cambios del CEO (Feb 2026)
│   ├── implementation-artifacts/
│   │   └── tech-spec-landing-infra-contact-form.md  # Spec técnico de la infra
│   └── test-artifacts/       # (vacío actualmente)
│
└── docs/                     # ESTA documentación (regenerada por bmad-document-project)
```

## Entry Points

| Capa | Archivo | Activación |
|---|---|---|
| Frontend | `index.html` | Servido por CloudFront como `default_root_object` |
| Backend | `lambdas/contact-form/index.js` (`exports.handler`) | Invocada por API Gateway `POST /contact` |
| Infra | `infra/terraform/main.tf` (+ `provider.tf`) | `terraform init/plan/apply` |

## Decisiones Estructurales Notables

- **Sin build pipeline**: el HTML se sirve verbatim. Tailwind se compila en el navegador via CDN runtime.
- **JS inline**: todo el JavaScript del cliente está en un `<script>` al final del `<body>` (Swiper init, IntersectionObserver, modal, form submit).
- **State Terraform local**: el `terraform.tfstate` vive en disco junto al código (no en S3). Está gitignored.
- **Cuenta única**: todo desplegado en cuenta dev `009160036798`, región `us-east-1`. No hay separación prod/staging.
- **Discrepancia detectada en endpoint de contacto**:
  - README documenta `s04r3s9ik7.execute-api.us-east-1.amazonaws.com`
  - `index.html:1158` usa `vo29nu6c83.execute-api.us-east-1.amazonaws.com`
  - La fuente de verdad es `index.html` (el deploy actual). El README está desactualizado.
