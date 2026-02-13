output "api_endpoint" {
  description = "API Gateway endpoint URL"
  value       = aws_apigatewayv2_api.landing.api_endpoint
}

output "contact_form_url" {
  description = "Full URL for the contact form endpoint"
  value       = "${aws_apigatewayv2_api.landing.api_endpoint}/contact"
}

output "lambda_function_name" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.contact_form.function_name
}

output "lambda_function_arn" {
  description = "ARN of the Lambda function"
  value       = aws_lambda_function.contact_form.arn
}

output "cloudfront_domain" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.static_site.domain_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID (for cache invalidation)"
  value       = aws_cloudfront_distribution.static_site.id
}

output "s3_bucket_name" {
  description = "S3 bucket name for static site"
  value       = aws_s3_bucket.static_site.id
}

output "landing_url" {
  description = "Landing page URL"
  value       = "https://${aws_cloudfront_distribution.static_site.domain_name}"
}
