# Guía de Despliegue — Coupr Landing Page

> Generado: 2026-05-21 | Modo: full_rescan | Nivel: exhaustive

## Prerrequisitos

| Item | Detalle |
|---|---|
| Cuenta AWS | dev `009160036798` (única; no hay separación prod/staging) |
| Región | `us-east-1` |
| Terraform | `>= 1.0` instalado localmente |
| AWS CLI | v2 con credenciales válidas |
| ACM Certificate | Pre-existente en `us-east-1` (referenciado en `var.acm_certificate_arn`) |
| SES Identity | `contact@coupr.io` verificada en SES de `us-east-1` |
| Route53 Zone | `coupr.io` pública (zone ID `Z0763905XREAJRPN21B0`) |

## Inventario de Infraestructura (recursos AWS)

| Recurso | Nombre / ARN | Propósito |
|---|---|---|
| S3 Bucket | `coupr-landing-static-009160036798` | Archivos estáticos |
| Bucket Policy | OAC-only | Solo CloudFront vía SourceArn |
| CloudFront Distribution | `coupr-landing landing page` | SSL + cache + alias `coupr.io`/`www.coupr.io` |
| OAC | `coupr-landing-oac` | sigv4 origin auth |
| ACM Cert | `arn:aws:acm:us-east-1:009160036798:certificate/5c736fb1-454a-4eef-af89-e68295830431` | TLS para CloudFront |
| Route53 A record | `coupr.io` → CloudFront alias | DNS |
| Route53 CNAME | `www.coupr.io` → CloudFront domain | DNS |
| API Gateway v2 HTTP | `coupr-landing-api` | POST /contact con CORS |
| Lambda | `coupr-landing-contact-form` (Node.js 20.x, 128 MB, 10 s) | Handler del formulario |
| IAM Role | `coupr-landing-contact-form-role` | Assume role para Lambda |
| IAM Policy | `coupr-landing-contact-form-ses` (ses:SendEmail, ses:SendRawEmail) | Permisos para SES |
| CloudWatch Log Group | `/aws/lambda/coupr-landing-contact-form` (retention 14 días) | Logs |
| SES identity | `contact@coupr.io` | Sender verificado |

## Workflow de Despliegue

### A. Deploy completo (infra + frontend) — primera vez

```bash
# 1. Configurar variables sensibles
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars
# Editar terraform.tfvars con recipient_email

# 2. Inicializar providers
terraform init

# 3. Crear recursos
terraform plan         # revisar lo que se va a crear
terraform apply        # confirmar con "yes"

# 4. Capturar outputs
terraform output      # apunta: api_endpoint, s3_bucket_name, cloudfront_distribution_id, landing_url

# 5. Actualizar el endpoint en index.html
# Editar index.html:1158 → CONTACT_ENDPOINT con el contact_form_url

# 6. Sincronizar archivos estáticos a S3
cd ../..
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
  --exclude "*.md" \
  --exclude ".gitignore"

# 7. Invalidar caché de CloudFront
aws cloudfront create-invalidation \
  --distribution-id $(terraform -chdir=infra/terraform output -raw cloudfront_distribution_id) \
  --paths "/*"
```

### B. Deploy de cambios en el frontend (HTML/CSS/JS)

```bash
# 1. Sync a S3 (excluye lo que no debe estar en producción)
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
  --exclude "*.md" \
  --exclude ".gitignore"

# 2. Invalidar caché
aws cloudfront create-invalidation \
  --distribution-id $(terraform -chdir=infra/terraform output -raw cloudfront_distribution_id) \
  --paths "/*"
```

### C. Deploy de cambios en la Lambda

```bash
cd infra/terraform
terraform apply       # detecta cambios en lambdas/contact-form/* via source_code_hash
```

> No es necesario empaquetar manualmente. `data "archive_file"` en `lambda.tf` re-zipea el directorio cada vez.

### D. Deploy de cambios en infraestructura

```bash
cd infra/terraform
terraform plan        # revisar diff
terraform apply       # aplicar
```

## Verificación post-deploy

```bash
# 1. Frontend live
curl -s -o /dev/null -w "%{http_code}\n" https://coupr.io
# Esperado: 200

# 2. Endpoint contact form preflight
curl -s -o /dev/null -w "%{http_code}\n" -X OPTIONS \
  https://vo29nu6c83.execute-api.us-east-1.amazonaws.com/contact
# Esperado: 200

# 3. Estado de invalidación
aws cloudfront list-invalidations \
  --distribution-id $(terraform -chdir=infra/terraform output -raw cloudfront_distribution_id) \
  --query "InvalidationList.Items[0]"
# Esperado: Status: Completed

# 4. Lambda activa
aws lambda get-function --function-name coupr-landing-contact-form \
  --query "Configuration.[State,LastUpdateStatus]"
# Esperado: ["Active","Successful"]
```

## Monitoreo

### Logs de Lambda

```bash
# Tail en tiempo real (última hora)
aws logs tail /aws/lambda/coupr-landing-contact-form --follow --since 1h

# Buscar errores
aws logs filter-log-events \
  --log-group-name /aws/lambda/coupr-landing-contact-form \
  --filter-pattern "ERROR"
```

### Métricas (consola AWS)

- **API Gateway**: `4XXError`, `5XXError`, `Count`, `Latency`, `IntegrationLatency`.
- **Lambda**: `Invocations`, `Errors`, `Duration`, `Throttles`.
- **CloudFront**: `Requests`, `BytesDownloaded`, `4xxErrorRate`, `5xxErrorRate`, `CacheHitRate`.

### Alarmas

⚠️ Actualmente **no hay alarmas de CloudWatch configuradas**. Recomendación pendiente: agregar alarms para:
- Lambda `Errors > 5 / 5 min` → SNS topic
- CloudFront `5xxErrorRate > 1%` → SNS topic

## Seguridad

| Aspecto | Estado |
|---|---|
| HTTPS forzado | ✅ CloudFront `viewer_protocol_policy = "redirect-to-https"` |
| TLS version | ✅ `TLSv1.2_2021` (mínimo) |
| S3 público | ✅ Bloqueado (`block_public_acls`, `block_public_policy`, `ignore_public_acls`, `restrict_public_buckets`) |
| S3 → CloudFront | ✅ OAC sigv4, bucket policy restringe por `AWS:SourceArn` |
| API Gateway auth | ⚠️ Endpoint público sin auth ni rate limit |
| CORS | ⚠️ `Access-Control-Allow-Origin: *` (cualquier origen) |
| Spam protection | ⚠️ Sin CAPTCHA, honeypot ni rate limiting |
| Secrets en código | ✅ Email destinatario via `terraform.tfvars` (gitignored) y env var de Lambda |
| Terraform state | ⚠️ Backend `local`: riesgo si el archivo se pierde o si se trabaja desde múltiples máquinas |

## Costos Estimados (mensual, tráfico bajo)

| Servicio | Costo |
|---|---|
| S3 storage (~32 MB) | < $0.01 |
| CloudFront (1 GB transferred) | ~$0.10 |
| Route53 (zone + 1M queries) | $0.50 + $0.40 |
| API Gateway HTTP (100 req) | < $0.01 |
| Lambda (100 invocations × 100ms × 128MB) | < $0.01 |
| SES (100 emails) | < $0.01 |
| CloudWatch Logs (retention 14d, < 1 GB) | < $0.10 |
| **Total estimado** | **~$1-2/mes** |

> Costos escalan principalmente con: tráfico de CloudFront (GB transferidos), invocaciones Lambda, emails SES.

## Recuperación de Fallos Conocidos

### Si el state de Terraform se corrompe

```bash
cd infra/terraform
terraform init -upgrade           # refrescar providers
terraform refresh                 # reconciliar con AWS
# Si persiste, restaurar desde terraform.tfstate.backup:
cp terraform.tfstate.backup terraform.tfstate
```

### Si se borra accidentalmente el bucket S3

`terraform.tfstate` mantiene la referencia. Re-aplicar:

```bash
terraform apply
```

Después re-sync de los archivos estáticos.

### Si el dominio deja de resolver

1. Confirmar Route53 records: `aws route53 list-resource-record-sets --hosted-zone-id Z0763905XREAJRPN21B0`.
2. Confirmar CloudFront alias activos: `aws cloudfront get-distribution --id <id>`.
3. Confirmar ACM cert válido (no expirado).

### Si SES bloquea los envíos

- Probable causa: identidad fuera del sandbox de SES o bounce rate alto.
- Acción: revisar dashboard de SES y solicitar production access si está en sandbox.

## Notas Operativas

- **Sin CI/CD**: cualquier persona del equipo con credenciales puede aplicar cambios. Coordinar manualmente.
- **State único en máquina local**: si el portátil donde vive `terraform.tfstate` se pierde, se debe importar manualmente el estado de los recursos AWS.
- **Recomendación**: migrar state a S3 backend con DynamoDB lock cuando crezca el equipo, para evitar pisarse cambios.
- **TTL bajo de CloudFront** (5 min) hace que cambios se propaguen rápido sin invalidación, pero el deploy ideal incluye invalidación explícita.
