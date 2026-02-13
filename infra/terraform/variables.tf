variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "recipient_email" {
  description = "Email address to receive demo request notifications"
  type        = string
  sensitive   = true
}

variable "sender_email" {
  description = "Email address used as sender for notifications"
  type        = string
  default     = "contact@coupr.io"
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "coupr-landing"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "dev"
}

variable "acm_certificate_arn" {
  description = "ACM certificate ARN for CloudFront custom domain (must be in us-east-1)"
  type        = string
  default     = "arn:aws:acm:us-east-1:009160036798:certificate/5c736fb1-454a-4eef-af89-e68295830431"
}
