# Dev Brief: CEO Landing Page Edits

**Source**: Email from Julian Janna (CEO) - Feb 11, 2026
**Target file**: `index.html`
**Assets folder**: `assets/ceo-feedback/`
**Total changes**: 12
**Priority**: All changes must be implemented. After this, the landing goes to production.

---

## Change 1: Remove underline from "got you."

**Location**: Hero section, line ~379-380
**Current HTML**:
```html
<span class="text-primary italic underline decoration-4 underline-offset-8">got you.</span>
```
**New HTML**:
```html
<span class="text-primary italic">got you.</span>
```
**What to do**: Remove `underline decoration-4 underline-offset-8` classes. Keep `text-primary italic`.

---

## Change 2: Replace hero image with looping video

**Location**: Hero section, right column, line ~408-412
**Current HTML**:
```html
<img alt="Coupr AI Dashboard Interface"
    class="w-full h-auto object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-700"
    src="https://www.coupr.io/assets/svg/illustrations/tablet.svg" />
```
**New HTML**:
```html
<video autoplay loop muted playsinline
    class="w-full h-auto object-contain drop-shadow-2xl"
    src="assets/ceo-feedback/0210(1).mp4">
</video>
```
**Notes**:
- `autoplay loop muted playsinline` are ALL required (autoplay won't work on mobile without `muted` and `playsinline`)
- Remove hover:scale-105 effect (not appropriate for video)
- Video has no sound by design

---

## Change 3: "Trusted by Leading Retailers" -> "Live pilot program" + Milam's logo

**Location**: Marquee/logo rotation section, line ~414-473

**Text change** (line ~417):
- Old: `Trusted by Leading Retailers`
- New: `Live pilot program`

**Marquee content change**: Replace ALL 12 marquee-item divs (6 original + 6 duplicates for seamless loop) with Milam's logo. Use the logo image repeated 3 times per set (so 6 total for the seamless loop, same pattern as before).

**Each marquee-item should become**:
```html
<div class="marquee-item">
    <img src="assets/ceo-feedback/milams-logo.png" alt="Milam's Markets" class="h-10 object-contain cursor-default" style="opacity: 0.6;" />
    <div class="marquee-dot"></div>
</div>
```
**Structure**: 3 logo items in first set + 3 logo items in duplicate set = 6 total (maintains seamless loop).

---

## Change 4: Update "Scan & Identify" description text

**Location**: "Decision Intelligence" section, line ~542-543
**Current text**:
```
Instantly recognize products on the shelf with computer vision technology.
```
**New text**:
```
Instantly recognize products on the shelf using our scanning technology. Full product nutrition breakdown, ready to be compared.
```

---

## Change 5: Update 4 feature cards

**Location**: "Everything you need to shop smarter" section, lines ~603-635

### Card 1 - Smart Navigation (line ~608-609)
- **Title**: Keep "Smart Navigation" (no change)
- **Old text**: "Most efficient route based on your specific list and inventory locations."
- **New text**: "No more wandering the aisles. Ask Coupr for any product and we'll take you directly to it."

### Card 2 - Recipe Integration -> Add Shopping List (line ~615-618)
- **Old title**: "Recipe Integration"
- **New title**: "Add Shopping List"
- **Old icon**: `restaurant_menu`
- **New icon**: `checklist` (more appropriate for shopping list)
- **Old text**: "Add ingredients from digital recipes directly to your assistant cart."
- **New text**: "Seamlessly add your shopping list directly to your Coupr Screen."

### Card 3 - Dietary Filters (no changes)

### Card 4 - Real-time Budgeting -> Deals & Discounts (line ~631-634)
- **Old title**: "Real-time Budgeting"
- **New title**: "Deals & Discounts"
- **Old icon**: `savings`
- **New icon**: `local_offer` (more appropriate for deals)
- **Old text**: "Track total spend live as you shop and stay within your set limits."
- **New text**: "All store deals at your fingertips. Personalized and sorted, just for you."

> **NOTE**: CEO wrote "fingerprints" but almost certainly meant "fingertips". Implement as "fingertips". If Jairo confirms otherwise, change later.

---

## Change 6: "Coupr Brands Program" -> "Coupr Retail Media" + text restructure

**Location**: For Brands & Retailers section, lines ~670-702

### Title change (line ~674):
- Old: `COUPR BRANDS PROGRAM`
- New: `COUPR RETAIL MEDIA`

### Subtitle text change (lines ~675-677):
**Old**:
```html
<p class="text-lg lg:text-xl text-text-muted font-light leading-relaxed mb-12 max-w-2xl mx-auto">
    Retail Media Innovation. Show your products to the right person, at the right time, at the right place.
</p>
```
**New** (each sentence on its own line visually):
```html
<div class="text-lg lg:text-xl text-text-muted font-light leading-relaxed mb-12 max-w-2xl mx-auto space-y-2">
    <p>90% of sales happen in-store, yet 90% of your campaign budget goes online.</p>
    <p>Let's put your money where it counts most.</p>
    <p>Show your products to the right person, at the right time, at the right place.</p>
</div>
```

---

## Change 7: "Higher Traceability" -> "Full-funnel reporting"

**Location**: Brands section, third benefit icon, line ~695
- Old: `Higher<br />Traceability`
- New: `Full-funnel<br />reporting`

---

## Change 8: "Join the Program" -> "Claim your aisle today"

**Location**: Brands section CTA button, line ~699
- Old: `Join the Program`
- New: `Claim your aisle today`

---

## Change 9: Replace carousel images with 4 new screenshots

**Location**: Swiper carousel section, lines ~706-725

**Current**: 3 slides with SVG images from coupr.io
**New**: 4 slides with local JPG images

Replace the swiper-wrapper content with:
```html
<div class="swiper-wrapper">
    <div class="swiper-slide">
        <img src="assets/ceo-feedback/Map Landing.jpg" alt="Coupr Interface - Store Map Navigation" />
    </div>
    <div class="swiper-slide">
        <img src="assets/ceo-feedback/Shop Page Landing.jpg" alt="Coupr Interface - Shopping View" />
    </div>
    <div class="swiper-slide">
        <img src="assets/ceo-feedback/Deals Page Landing.jpg" alt="Coupr Interface - Deals & Discounts" />
    </div>
    <div class="swiper-slide">
        <img src="assets/ceo-feedback/Product Page Landing.jpg" alt="Coupr Interface - Product Details" />
    </div>
</div>
```

---

## Change 10: Redesign Success Stories section

**Location**: Testimonials section, lines ~727-778

**Changes required**:
1. Remove ALL profile photos (`<img>` tags in testimonials)
2. Change names and roles
3. Add 4th testimonial
4. Implement alternating color pattern: white, blue (secondary), white, blue
5. Implement carousel/rotation (use Swiper or CSS-based)

### Testimonial 1 (WHITE card):
- **Name**: Sarah J.
- **Role**: Busy Mom
- **Text**: "Coupr carts completely changed how I shop. I can find gluten-free items for my kids instantly, and I never go over budget anymore."

### Testimonial 2 (BLUE/secondary card):
- **Name**: Diego M.
- **Role**: Dad of 2
- **Text**: "I used to wander the store forever trying to track down the random things my wife texted me. Now I just load the list and the cart walks me aisle by aisle. I'm in and out in half the time - and I actually bring home everything she asked for."

### Testimonial 3 (WHITE card):
- **Name**: Alma P.
- **Role**: Health Adv.
- **Text**: "Being able to compare nutritional facts side-by-side right at the shelf helps me make much better choices without spending hours."

### Testimonial 4 (BLUE/secondary card - NEW):
- **Name**: Linda M.
- **Role**: Weekly Shopper
- **Text**: "I didn't realize how many promotions I was missing until I started using Coupr. Seeing the best deals pop up as I shop makes it easy to switch brands and save without thinking about it. My grocery bill is noticeably lower."

### Implementation notes for rotation:
- Can reuse Swiper (already loaded) or implement CSS carousel
- Show 3 cards visible at a time on desktop, 1 on mobile
- Auto-rotate with pause on hover
- Keep the existing quote styling (large quote mark, border-top separator for name)

---

## Change 11: (Already covered in Change 10)

The Mark Davis testimonial is replaced by Diego M. with the new text. This is handled in Change 10, Testimonial 2.

---

## Change 12: Add Terms & Conditions and Privacy Policy links in footer

**Location**: Footer bottom bar, lines ~856-864

**Current footer bottom**:
```html
<div class="pt-12 border-t border-slate-subtle/30 flex flex-col md:flex-row justify-between items-center gap-8">
    <div class="text-[10px] text-text-muted font-black tracking-[0.3em] uppercase">
        &copy; 2025 Coupr Inc. &mdash; Engineered for Excellence
    </div>
    <button onclick="openModal()" ...>Schedule a Demo</button>
</div>
```

**New footer bottom** (add legal links between copyright and button):
```html
<div class="pt-12 border-t border-slate-subtle/30 flex flex-col md:flex-row justify-between items-center gap-8">
    <div class="text-[10px] text-text-muted font-black tracking-[0.3em] uppercase">
        &copy; 2025 Coupr Inc. &mdash; Engineered for Excellence
    </div>
    <div class="flex items-center gap-6">
        <a href="https://coupr-web.web.app/privacy_policy" target="_blank"
            class="text-[10px] text-text-muted font-black tracking-[0.3em] uppercase hover:text-primary transition-colors">
            Privacy Policy
        </a>
        <a href="#" target="_blank"
            class="text-[10px] text-text-muted font-black tracking-[0.3em] uppercase hover:text-primary transition-colors">
            Terms &amp; Conditions
        </a>
    </div>
    <button onclick="openModal()" ...>Schedule a Demo</button>
</div>
```

**Notes**:
- Privacy Policy link: `https://coupr-web.web.app/privacy_policy`
- Terms & Conditions link: **PENDING** from Jorge. Use `#` as placeholder. PDF backup available at `assets/ceo-feedback/Coupr - Terms & Conditions 8.15.25.pdf`
- Also update copyright year from 2025 to 2026

---

## Asset Mapping Summary

| Asset File | Used In |
|---|---|
| `assets/ceo-feedback/0210(1).mp4` | Change 2 - Hero video |
| `assets/ceo-feedback/milams-logo.png` | Change 3 - Marquee logo |
| `assets/ceo-feedback/Map Landing.jpg` | Change 9 - Carousel slide 1 |
| `assets/ceo-feedback/Shop Page Landing.jpg` | Change 9 - Carousel slide 2 |
| `assets/ceo-feedback/Deals Page Landing.jpg` | Change 9 - Carousel slide 3 |
| `assets/ceo-feedback/Product Page Landing.jpg` | Change 9 - Carousel slide 4 |
| `assets/ceo-feedback/Coupr - Terms & Conditions 8.15.25.pdf` | Change 12 - Backup for T&C |

---

## Pending Items (non-blocking)

1. **Confirm "fingertips" vs "fingerprints"** (Change 5, Card 4) - Implementing as "fingertips"
2. **Get Terms & Conditions URL from Jorge** (Change 12) - Using `#` as placeholder
3. **Copyright year**: Update 2025 -> 2026
