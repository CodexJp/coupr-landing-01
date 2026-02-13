# Guía de Desarrollo — Coupr Landing Page

> Generado: 2026-02-12 | Modo: initial_scan | Nivel: exhaustive

## Prerrequisitos

| Herramienta | Versión | Propósito |
|---|---|---|
| Navegador moderno | Chrome/Firefox/Safari | Visualización y testing |
| Editor de código | Cualquiera (VS Code recomendado) | Edición de archivos |
| Terraform | >= 1.0 | Gestión de infraestructura |
| AWS CLI | v2 | Interacción con AWS |
| Credenciales AWS | Cuenta dev (009160036798) | Deploy de infraestructura |

> **Nota**: No se requiere Node.js local ni npm — el proyecto no tiene package.json ni dependencias locales. La Lambda usa Node.js 20.x incluido en el runtime de AWS.

## Setup del Entorno

### 1. Clonar el repositorio

```bash
git clone <repo-url>
cd landingpage
```

### 2. Desarrollo local del frontend

No se requiere setup especial. Abrir `index.html` directamente en un navegador:

```bash
# macOS
open index.html

# Linux
xdg-open index.html

# O usar cualquier servidor local:
python3 -m http.server 8000
# Luego visitar http://localhost:8000
```

> **Nota**: Tailwind CSS se carga vía CDN en runtime, por lo que se necesita conexión a internet para ver los estilos correctamente.

### 3. Configurar infraestructura (si es necesario)

```bash
cd infra/terraform

# Crear archivo de variables
cp terraform.tfvars.example terraform.tfvars
# Editar terraform.tfvars con el email del destinatario

# Inicializar Terraform
terraform init

# Verificar plan
terraform plan

# Aplicar cambios
terraform apply
```

## Estructura de Archivos a Modificar

| Archivo | Qué contiene | Cuándo modificar |
|---|---|---|
| `index.html` | Todo el frontend (HTML + CSS + JS) | Cambios de contenido, diseño, o funcionalidad del frontend |
| `lambdas/contact-form/index.js` | Handler del formulario | Cambios en lógica de envío de email o validación |
| `infra/terraform/*.tf` | Infraestructura AWS | Cambios en la infraestructura |
| `assets/brand/*` | Logo y favicon | Cambios de branding |
| `assets/media/*` | Video, ilustraciones, screenshots | Actualización de contenido visual |

## Comandos de Desarrollo

### Frontend

No hay build step. Los cambios en `index.html` son inmediatos al refrescar el navegador.

```bash
# Abrir en navegador
open index.html

# Servir localmente con recarga manual
python3 -m http.server 8000
```

### Infraestructura

```bash
cd infra/terraform

# Ver estado actual
terraform show

# Planificar cambios
terraform plan

# Aplicar cambios
terraform apply

# Ver outputs (URLs, IDs)
terraform output

# Destruir infraestructura (¡cuidado!)
terraform destroy
```

### Lambda

```bash
# Probar endpoint con curl
curl -X POST https://s04r3s9ik7.execute-api.us-east-1.amazonaws.com/contact \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test","email":"test@test.com","organization":"Test Co","role":"Dev","mobile":"555-0000"}'

# Ver logs de Lambda
aws logs tail /aws/lambda/coupr-landing-contact-form --follow
```

### Deploy del frontend a S3

```bash
# Sync de archivos estáticos a S3
aws s3 sync . s3://$(terraform -chdir=infra/terraform output -raw s3_bucket_name) \
  --exclude ".git/*" \
  --exclude "_bmad/*" \
  --exclude "_bmad-output/*" \
  --exclude "infra/*" \
  --exclude "lambdas/*" \
  --exclude "docs/*" \
  --exclude ".claude/*" \
  --exclude ".playwright-mcp/*" \
  --exclude ".DS_Store" \
  --exclude "*.md"

# Invalidar caché de CloudFront
aws cloudfront create-invalidation \
  --distribution-id $(terraform -chdir=infra/terraform output -raw cloudfront_distribution_id) \
  --paths "/*"
```

## Testing

### Testing Manual

No hay tests automatizados. El testing es completamente manual:

1. **Visual**: Abrir `index.html` en navegador, verificar todas las secciones
2. **Responsive**: Probar en diferentes tamaños de pantalla (mobile, tablet, desktop)
3. **Formulario**: Enviar un formulario de prueba y verificar recepción de email
4. **Navegación**: Verificar que los anchor links (#process, #mission, etc.) funcionan
5. **Modal**: Verificar apertura/cierre del modal (click, overlay, Escape)
6. **Carruseles**: Verificar navegación, autoplay, y responsive de Swiper
7. **Animaciones**: Verificar scroll animations con Intersection Observer

### Testing del Endpoint

```bash
# Test exitoso
curl -s -o /dev/null -w "%{http_code}" -X POST \
  https://s04r3s9ik7.execute-api.us-east-1.amazonaws.com/contact \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test","email":"test@test.com","organization":"Co","role":"Dev","mobile":"555"}'
# Esperado: 200

# Test campos faltantes
curl -s -X POST \
  https://s04r3s9ik7.execute-api.us-east-1.amazonaws.com/contact \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test"}'
# Esperado: 400, "Missing required fields: email, organization, role, mobile"

# Test email inválido
curl -s -X POST \
  https://s04r3s9ik7.execute-api.us-east-1.amazonaws.com/contact \
  -H "Content-Type: application/json" \
  -d '{"fullName":"T","email":"invalid","organization":"C","role":"D","mobile":"5"}'
# Esperado: 400, "Invalid email address"
```

## Convenciones del Proyecto

### Estilo de código
- **HTML**: Indentación con 4 espacios
- **Tailwind**: Clases en línea, sin archivos CSS separados
- **JavaScript**: Vanilla JS, funciones globales para modal
- **Terraform**: Convenciones estándar de HCL, naming con `${var.project_name}-`

### Naming de assets
- Brand: lowercase (`coupr-logo.png`, `favicon.svg`)
- Media: Title Case con espacios (screenshots legacy) o lowercase (nuevos SVGs)

### Commits recientes (referencia de estilo)
```
Improve mobile responsiveness: buttons, hero layout, and logo marquee
Improve hero video quality: keep 1080p with CRF 23
Optimize hero video: 49MB → 3.8MB (92% reduction)
Add media assets for hero video, logos, and screenshots
Update hero section to split layout with stacked video mockups
```
