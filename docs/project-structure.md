# Estructura del Proyecto — Coupr Landing Page

> Generado: 2026-02-12 | Modo: initial_scan | Nivel: exhaustive

## Resumen

| Atributo | Valor |
|---|---|
| **Nombre** | Coupr Landing Page |
| **Tipo de repositorio** | Monolito |
| **Tipo de proyecto** | `web` (landing page estática) |
| **Producto** | Coupr — Asistente de compras en tienda con IA |
| **Dominio de producción** | coupr.io / www.coupr.io |
| **Región AWS** | us-east-1 |

## Clasificación de Partes

### Parte Única: Landing Page Web

- **Ruta raíz**: `/` (raíz del repositorio)
- **project_type_id**: `web`
- **Descripción**: Landing page estática de producto B2B/B2C para Coupr, un asistente de compras en tienda impulsado por IA. Incluye formulario de contacto serverless e infraestructura AWS completa (S3 + CloudFront + Lambda + API Gateway).

## Stack Tecnológico

| Categoría | Tecnología | Versión/Detalle | Justificación |
|---|---|---|---|
| Markup | HTML5 | Estándar | Single-page estática, sin framework SPA |
| Estilos | Tailwind CSS | CDN (runtime) | Utility-first, sin build pipeline |
| Carrusel | Swiper.js | v11 (CDN) | Carruseles de screenshots y testimonios |
| Tipografía | Google Fonts | Space Grotesk + Inter | Brand typography |
| Iconos | Material Symbols Outlined | CDN | Iconografía de UI |
| JavaScript | Vanilla JS | ES2020+ (async/await) | Modal, formulario, animaciones, Intersection Observer |
| IaC | Terraform | >= 1.0, AWS Provider ~> 5.0 | Infraestructura completa como código |
| Cloud | AWS | Multi-servicio | Hosting, CDN, serverless, DNS, email |
| CDN | CloudFront | TLSv1.2_2021 | SSL, compresión, caché |
| Storage | S3 | Private bucket + OAC | Hosting estático seguro |
| DNS | Route53 | A record + CNAME | coupr.io + www.coupr.io |
| API | API Gateway v2 HTTP | Auto-deploy | Endpoint POST /contact |
| Serverless | Lambda | Node.js 20.x, 128MB, 10s timeout | Contact form handler |
| Email | AWS SES | SendEmail | Notificaciones de demo requests |
| Logging | CloudWatch Logs | 14 días retención | Lambda execution logs |

## Patrón Arquitectónico

**Tipo**: Jamstack simplificado (Static HTML + Serverless API)

- **Frontend**: Archivo HTML único con Tailwind CSS vía CDN (sin build step)
- **Backend**: Lambda serverless para procesamiento de formulario de contacto
- **Infraestructura**: Terraform IaC para aprovisionamiento completo de AWS
- **Flujo de datos**: Browser → CloudFront → S3 (estático) | Browser → API Gateway → Lambda → SES (formulario)
