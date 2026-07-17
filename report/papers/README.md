# Report PDF — source & regeneration

The methodology-paper PDF emailed to every lead lives **only in S3/CloudFront**
(it is not committed as a binary). This folder holds its reproducible source.

- **Public URL:** https://coupr.io/report/papers/coupr-report.pdf
- **S3 key:** `s3://coupr-landing-static-009160036798/report/papers/coupr-report.pdf`
- **Referenced by:** `lambdas/contact-form/index.js` → `PAPER_PDFS["consideration-moment"]`
  (the autoresponder emails this URL; the mapping never needs to change).
- **Source of truth:** [`coupr-report.source.html`](./coupr-report.source.html) —
  the unbranded, data-rich version of the paper (brand table, retailer named).
  This is intentionally the *fuller* document vs. the public gated page at
  `/report/consideration-moment.html`, which shows the generic teaser version.

> Note: the source came from an email export. Any Resend tracking pixel
> (`resend-clicks…`) must be stripped before publishing — the committed copy is clean.

## Regenerate the PDF

```bash
# 1. Edit coupr-report.source.html (numbers, addendum, etc.)

# 2. Render to PDF (macOS Chrome, no header/footer)
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --disable-gpu --no-pdf-header-footer \
  --print-to-pdf=coupr-report.pdf \
  "file://$PWD/report/papers/coupr-report.source.html"

# 3. Upload to the same S3 key (overwrites in place)
AWS_PROFILE=coupr-dev aws s3 cp coupr-report.pdf \
  s3://coupr-landing-static-009160036798/report/papers/coupr-report.pdf \
  --content-type application/pdf --cache-control "public, max-age=300"

# 4. Invalidate CloudFront so the CDN serves the new file
AWS_PROFILE=coupr-dev aws cloudfront create-invalidation \
  --distribution-id E25SNPVUCTQRJA \
  --paths "/report/papers/coupr-report.pdf"
```

Keep the public page (`/report/consideration-moment.html`) numbers in sync with
this source whenever the figures change.
