# Resumen del Proyecto — Coupr Landing Page

> Generado: 2026-02-12 | Modo: initial_scan | Nivel: exhaustive

## Propósito

**Coupr** es un asistente de compras en tienda impulsado por IA que transforma los carritos de supermercado tradicionales en asistentes inteligentes. Esta landing page es el sitio web principal de producto, orientado a dos audiencias:

1. **Consumidores (B2C)**: Compradores que quieren una experiencia de compra más inteligente
2. **Marcas y retailers (B2B)**: Empresas que quieren anunciar productos en el punto de venta

**Dominio de producción**: [coupr.io](https://coupr.io) / [www.coupr.io](https://www.coupr.io)

## Resumen Ejecutivo

Landing page estática de una sola página (~1230 líneas HTML) que presenta el producto Coupr. Utiliza Tailwind CSS vía CDN (sin pipeline de build), con un formulario de contacto serverless respaldado por AWS Lambda + API Gateway + SES. La infraestructura completa está gestionada como código con Terraform.

## Stack Tecnológico

| Categoría | Tecnología | Detalle |
|---|---|---|
| Frontend | HTML5 + Tailwind CSS | CDN runtime, sin build |
| JS Libraries | Swiper.js v11 | Carruseles (CDN) |
| Tipografía | Google Fonts | Space Grotesk + Inter |
| Iconos | Material Symbols | Outlined variant |
| Infraestructura | Terraform >= 1.0 | AWS Provider ~> 5.0 |
| Hosting | AWS S3 + CloudFront | Static site con SSL |
| API | API Gateway v2 HTTP | POST /contact |
| Serverless | AWS Lambda Node.js 20.x | Contact form handler |
| Email | AWS SES | Notificaciones de demo |
| DNS | AWS Route53 | coupr.io + www |

## Tipo de Arquitectura

**Jamstack simplificado** — Static HTML servido desde CDN con función serverless para el formulario de contacto.

## Estructura del Repositorio

- **Tipo**: Monolito
- **Partes**: 1 (landing page con infraestructura integrada)
- **Archivos fuente**: 8 archivos principales (1 HTML, 1 JS Lambda, 6 TF)

## Enlaces a Documentación Detallada

- [Estructura del Proyecto](./project-structure.md)
- [Arquitectura](./architecture.md)
- [Árbol de Código Fuente](./source-tree-analysis.md)
- [Contratos de API](./api-contracts.md)
- [Inventario de Componentes UI](./ui-component-inventory.md)
- [Inventario de Assets](./asset-inventory.md)
- [Guía de Desarrollo](./development-guide.md)
- [Guía de Despliegue](./deployment-guide.md)
