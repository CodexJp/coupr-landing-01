# Coupr Landing Page — Índice de Documentación

> Generado: 2026-05-21 | Modo: full_rescan | Nivel: exhaustive
> Este es el punto de entrada principal para desarrollo asistido por IA.

## Resumen del Proyecto

| Atributo | Valor |
|---|---|
| **Tipo** | Monolito (1 parte: `landing`) — sitio estático + backend serverless |
| **Project Type ID** | `web` |
| **Lenguaje Principal** | HTML / JavaScript (Vanilla) / Node.js 20.x (Lambda) / Terraform |
| **Arquitectura** | Jamstack simplificado (CloudFront + S3 + API Gateway + Lambda + SES) |
| **Stack Frontend** | HTML5 + Tailwind CSS (CDN) + Swiper.js v11 + Vanilla JS |
| **Stack Backend** | Node.js 20.x + `@aws-sdk/client-ses` |
| **IaC** | Terraform `>= 1.0` + AWS Provider `~> 5.0` |
| **Dominio** | `coupr.io` + `www.coupr.io` |
| **Región AWS** | `us-east-1` (cuenta dev `009160036798`) |
| **Entry Point Frontend** | `index.html` |
| **Entry Point Backend** | `lambdas/contact-form/index.js#handler` |
| **Build Pipeline** | Ninguno |
| **CI/CD** | Ninguno (deploy manual) |
| **Tests Automatizados** | Ninguno (testing manual + curl) |

## Referencia Rápida

- **Endpoint contacto (en uso)**: `https://vo29nu6c83.execute-api.us-east-1.amazonaws.com/contact` (definido en `index.html:1158`)
- **Servicios AWS**: S3, CloudFront, Route53, API Gateway v2 HTTP, Lambda, SES, IAM, CloudWatch Logs, ACM
- **Patrón Arquitectónico**: Static HTML servido por CloudFront + función Lambda serverless para formulario de contacto
- **Identidad SES sender**: `contact@coupr.io` (verificada en us-east-1)

## Documentación Generada

### Visión General
- [Resumen del Proyecto](./project-overview.md) — Propósito, stack, audiencias, estado actual
- [Estructura del Proyecto](./project-structure.md) — Clasificación, stack por capa, layout de carpetas, entry points

### Arquitectura
- [Arquitectura](./architecture.md) — Patrón Jamstack, diagramas, decisiones, seguridad, performance, DR
- [Árbol de Código Fuente](./source-tree-analysis.md) — Análisis archivo por archivo con rangos de líneas

### APIs
- [Contratos de API](./api-contracts.md) — Endpoint `POST /contact`: request/response, validación, CORS, testing

### Frontend
- [Inventario de Componentes UI](./ui-component-inventory.md) — 13 secciones + modal de demo, design tokens, animaciones
- [Inventario de Assets](./asset-inventory.md) — 11 archivos (~32 MB), oportunidades de optimización

### Operaciones
- [Guía de Desarrollo](./development-guide.md) — Setup, comandos, convenciones, testing manual, troubleshooting
- [Guía de Despliegue](./deployment-guide.md) — Terraform, S3 sync, CloudFront invalidation, monitoreo, costos

### Metadatos
- [Metadatos del Proyecto](./project-parts-metadata.json) — Clasificación e integration points en JSON
- [Reporte de Escaneo](./project-scan-report.json) — Estado del workflow de documentación

## Documentación Existente (Referenciada)

- [README.md](../README.md) — Documentación operativa principal con quickstart, troubleshooting y referencia rápida
- [CEO Feedback Dev Brief](../_bmad-output/planning-artifacts/ceo-feedback-dev-brief.md) — 12 cambios solicitados por el CEO (Feb 2026)
- [Tech Spec: Infra & Contact Form](../_bmad-output/implementation-artifacts/tech-spec-landing-infra-contact-form.md) — Especificación técnica original de la infraestructura del contact form

## Cómo Empezar

### Para desarrollo frontend
1. Abre `index.html` directamente o usa `python3 -m http.server 8000`.
2. Edita el HTML — no hay build step. Tailwind compila en navegador.
3. Lee [Inventario de Componentes UI](./ui-component-inventory.md) para entender las secciones.
4. Lee [Guía de Desarrollo](./development-guide.md) para convenciones.

### Para infraestructura
1. Asegúrate de estar en cuenta AWS `009160036798` (`aws sts get-caller-identity`).
2. `cd infra/terraform && terraform init`.
3. `terraform plan` para revisar el estado actual.
4. Lee [Arquitectura](./architecture.md) para entender el sistema completo.
5. Lee [Guía de Despliegue](./deployment-guide.md) para procedimientos paso a paso.

### Para modificar el formulario de contacto
1. **Frontend**: edita el modal `<form id="demoForm">` en `index.html:982-1010` y/o el handler en `index.html:1161-1228`.
2. **Backend**: edita `lambdas/contact-form/index.js` (validación, template del email, headers).
3. Lee [Contratos de API](./api-contracts.md) para el esquema del endpoint.
4. Deploy: `cd infra/terraform && terraform apply` (re-empaqueta y publica la Lambda).

### Para deploy de cambios en frontend
```bash
# Desde la raíz del repo
aws s3 sync . s3://$(terraform -chdir=infra/terraform output -raw s3_bucket_name) \
  --exclude ".git/*" --exclude "_bmad/*" --exclude "_bmad-output/*" \
  --exclude "infra/*" --exclude "lambdas/*" --exclude "docs/*" \
  --exclude ".claude/*" --exclude ".playwright-mcp/*" \
  --exclude ".DS_Store" --exclude "*.md" --exclude ".gitignore"

aws cloudfront create-invalidation \
  --distribution-id $(terraform -chdir=infra/terraform output -raw cloudfront_distribution_id) \
  --paths "/*"
```

## Hallazgos Notables del Escaneo

⚠️ **Discrepancia de endpoint**: el README.md y `index.html:1158` apuntan a distintos API Gateways. La fuente de verdad operacional es `index.html`. Recomendación: alinear el README o usar un mecanismo de inyección para evitar drift futuro.

⚠️ **Assets pesados**: `discover.svg` (7.4 MB), `explore.svg` (5.9 MB) y `ask.svg` (2 MB) son anómalamente grandes — probablemente contienen bitmaps embedidos. Re-exportar como WebP/AVIF puede reducir 15 MB a < 1 MB. Ver [`asset-inventory.md`](./asset-inventory.md) para plan completo.

⚠️ **State Terraform local**: el backend Terraform está en `local` (`terraform.tfstate` en disco). Migrar a S3 + DynamoDB lock antes de incorporar más colaboradores.

⚠️ **Sin tests ni CI/CD**: cualquier deploy es manual. Sin alarms en CloudWatch.

⚠️ **CORS `*` y sin rate limiting**: el endpoint puede invocarse desde cualquier origen sin throttling. Riesgo de abuso por bots/spam.
