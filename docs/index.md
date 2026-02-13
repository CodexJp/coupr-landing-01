# Coupr Landing Page — Índice de Documentación

> Generado: 2026-02-12 | Modo: initial_scan | Nivel: exhaustive
> Este es el punto de entrada principal para desarrollo asistido por IA.

## Resumen del Proyecto

| Atributo | Valor |
|---|---|
| **Tipo** | Monolito (landing page estática con infraestructura serverless) |
| **Lenguaje Principal** | HTML / JavaScript |
| **Arquitectura** | Jamstack simplificado (Static HTML + Serverless API) |
| **Stack** | HTML5 + Tailwind CSS (CDN) + AWS (S3/CloudFront/Lambda/API GW/SES) |
| **Dominio** | coupr.io / www.coupr.io |
| **Entry Point** | `index.html` |

## Referencia Rápida

- **Tech Stack**: HTML5, Tailwind CSS (CDN runtime), Swiper.js v11, Vanilla JS, AWS (Terraform)
- **Entry Point Frontend**: `index.html`
- **Entry Point Backend**: `lambdas/contact-form/index.js` (Lambda handler)
- **Infraestructura**: `infra/terraform/` (6 archivos TF)
- **Patrón Arquitectónico**: Static HTML servido por CloudFront + función Lambda serverless para formulario de contacto

## Documentación Generada

### Visión General
- [Resumen del Proyecto](./project-overview.md) — Propósito, stack, y enlaces
- [Estructura del Proyecto](./project-structure.md) — Clasificación, partes, y stack detallado

### Arquitectura
- [Arquitectura](./architecture.md) — Patrón arquitectónico, flujos de datos, seguridad, y decisiones
- [Árbol de Código Fuente](./source-tree-analysis.md) — Directorio completo anotado con estadísticas

### APIs y Datos
- [Contratos de API](./api-contracts.md) — Endpoint POST /contact con request/response schemas

### Componentes y Assets
- [Inventario de Componentes UI](./ui-component-inventory.md) — 13 secciones de la landing page, design tokens, patrones de animación
- [Inventario de Assets](./asset-inventory.md) — 11 assets (video, SVGs, JPGs, logos), oportunidades de optimización

### Guías Operativas
- [Guía de Desarrollo](./development-guide.md) — Setup, comandos, testing manual, convenciones
- [Guía de Despliegue](./deployment-guide.md) — AWS infra, Terraform, deploy a S3, CloudFront, monitoreo

### Metadatos
- [Metadatos del Proyecto](./project-parts-metadata.json) — Clasificación y requisitos en formato JSON
- [Reporte de Escaneo](./project-scan-report.json) — Estado del workflow de documentación

## Documentación Existente

- [CEO Feedback Dev Brief](./../_bmad-output/planning-artifacts/ceo-feedback-dev-brief.md) — 12 cambios del CEO para la landing (Feb 2026)
- [Tech Spec: Infra & Contact Form](./../_bmad-output/implementation-artifacts/tech-spec-landing-infra-contact-form.md) — Especificación técnica de la infraestructura AWS y formulario de contacto

## Cómo Empezar

### Para desarrollo frontend:
1. Abrir `index.html` en un navegador (requiere internet para CDN)
2. Editar el HTML directamente — no hay build step
3. Referir [Inventario de Componentes UI](./ui-component-inventory.md) para entender las secciones
4. Referir [Guía de Desarrollo](./development-guide.md) para convenciones

### Para infraestructura:
1. Referir [Guía de Despliegue](./deployment-guide.md) para requisitos
2. `cd infra/terraform && terraform init`
3. `terraform plan` para ver estado actual
4. Referir [Arquitectura](./architecture.md) para entender el flujo completo

### Para modificar el formulario de contacto:
1. Frontend: Editar sección del modal en `index.html` (línea ~950)
2. Backend: Editar `lambdas/contact-form/index.js`
3. Referir [Contratos de API](./api-contracts.md) para el esquema del endpoint
4. Deploy: `terraform apply` en `infra/terraform/`
