# Resumen del Proyecto — Coupr Landing Page

> Generado: 2026-05-21 | Modo: full_rescan | Nivel: exhaustive

## Propósito

**Coupr** transforma los carritos de supermercado en asistentes inteligentes de compras. Esta landing page es el sitio web principal del producto en [coupr.io](https://coupr.io), orientado a dos audiencias:

- **Consumidores (B2C)**: compradores que buscan una experiencia de compra más inteligente.
- **Marcas y retailers (B2B)**: empresas que quieren anunciar en el punto de venta (sección "COUPR RETAIL MEDIA").

El objetivo principal de la landing es capturar solicitudes de demo a través del formulario modal "Get a Demo", que dispara un email transaccional al equipo comercial.

## Resumen Ejecutivo

| Atributo | Valor |
|---|---|
| **Repositorio** | Monolito (1 parte: `landing`) |
| **Tipo de Proyecto** | `web` (sitio estático + Lambda contact form) |
| **Arquitectura** | Jamstack simplificado (static HTML + serverless API) |
| **Stack Frontend** | HTML5 + Tailwind CSS (CDN) + Swiper.js 11 + Vanilla JS |
| **Stack Backend** | Node.js 20.x Lambda + AWS SDK v3 (`@aws-sdk/client-ses`) |
| **Infraestructura** | Terraform `>= 1.0` + AWS Provider `~> 5.0` |
| **Servicios AWS** | S3, CloudFront, Route53, API Gateway v2 HTTP, Lambda, SES, IAM, CloudWatch, ACM |
| **Región** | `us-east-1` |
| **Cuenta AWS** | dev `009160036798` (única) |
| **Dominio** | `coupr.io` + `www.coupr.io` (CNAME) |
| **Entry Point Frontend** | `index.html` (1231 líneas, todo inline) |
| **Entry Point Backend** | `lambdas/contact-form/index.js` → `exports.handler` |
| **Build Pipeline** | Ninguno (HTML se sirve verbatim) |
| **CI/CD** | Ninguno (deploy manual con AWS CLI + Terraform) |
| **Tests Automatizados** | Ninguno (testing manual + smoke con `curl`) |

## Arquitectura de Alto Nivel

```text
                  ┌──────────────────────────────┐
                  │     Navegador (HTTPS)        │
                  └──────────────┬───────────────┘
                                 │
                 ┌───────────────┼───────────────┐
                 ▼                               ▼
        ┌────────────────┐               ┌────────────────────┐
        │  CloudFront    │               │  API Gateway v2    │
        │  (SSL + Cache) │               │  POST /contact     │
        │  + Route53     │               │  CORS habilitado   │
        └────────┬───────┘               └─────────┬──────────┘
                 │                                  │
                 ▼                                  ▼
        ┌────────────────┐               ┌────────────────────┐
        │  S3 Bucket     │               │   Lambda           │
        │  (static site) │               │   contact-form     │
        │  OAC privado   │               │   Node.js 20.x     │
        └────────────────┘               └─────────┬──────────┘
                                                    │
                                                    ▼
                                          ┌────────────────────┐
                                          │   Amazon SES       │
                                          │   contact@coupr.io │
                                          └────────────────────┘
```

> Diagrama detallado y flujos de datos: ver [architecture.md](./architecture.md).

## Documentación

| Documento | Contenido |
|---|---|
| [Estructura del Proyecto](./project-structure.md) | Layout de carpetas, stack por capa, entry points |
| [Arquitectura](./architecture.md) | Patrón arquitectónico, diagramas, decisiones, seguridad |
| [Árbol de Código Fuente](./source-tree-analysis.md) | Análisis archivo por archivo con anotaciones |
| [Contratos de API](./api-contracts.md) | Endpoint `POST /contact`: request/response, validación, CORS |
| [Componentes UI](./ui-component-inventory.md) | 13 secciones de la landing + modal de demo |
| [Inventario de Assets](./asset-inventory.md) | 11 assets multimedia (~32 MB total), oportunidades de optimización |
| [Guía de Desarrollo](./development-guide.md) | Setup, comandos, convenciones, testing manual |
| [Guía de Despliegue](./deployment-guide.md) | Terraform + S3 sync + CloudFront invalidation |

## Documentación Existente Referenciada

- [README.md](../README.md) — Documentación principal con quickstart, troubleshooting y referencia rápida.
- [CEO Feedback Dev Brief](../_bmad-output/planning-artifacts/ceo-feedback-dev-brief.md) — Brief con los 12 cambios solicitados por el CEO en febrero 2026.
- [Tech Spec: Infra & Contact Form](../_bmad-output/implementation-artifacts/tech-spec-landing-infra-contact-form.md) — Especificación técnica original de la infraestructura AWS.

## Estado Actual y Notas

- Sitio en producción servido por CloudFront sobre `coupr.io`.
- Formulario de contacto **funcional** (Lambda + SES). Verificado mediante envío real al endpoint en `index.html`.
- ⚠️ El endpoint de contacto documentado en el `README.md` (`s04r3s9ik7…`) **difiere** del usado en producción por `index.html:1158` (`vo29nu6c83…`). La fuente de verdad operativa es `index.html`.
- ⚠️ No existen tests automatizados, ni CI/CD. Todo deploy es manual.
- ⚠️ State de Terraform está en backend `local` — riesgo si se trabaja desde múltiples máquinas o hay rotación de equipo.
