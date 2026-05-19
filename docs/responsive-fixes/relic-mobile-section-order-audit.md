# Mobile Section Order / Overflow Fix

## Scope
Frontend-only responsive changes.

Changed files:
- `frontend/src/app/components/StorytellingSection.tsx`
- `frontend/src/app/components/FeaturedRelics.tsx`
- `frontend/src/styles/theme.css`

## Issue 1: Mobile story section order did not match desktop rhythm

**Problem:**  
The storytelling/about section used a two-column alternating layout on desktop, but on mobile every feature stacked in the same top-to-bottom order: photo first, content second.

**Why it happened:**  
The alternating order was controlled only with `lg:` Tailwind classes, so the reverse layout existed only at large desktop breakpoints. Below `lg`, all items returned to DOM order.

**Fix:**  
Added targeted classes to the storytelling section and a mobile-only media query. On screens below `768px`, normal cards stay photo/content, while reversed cards become content/photo. Desktop and tablet layout are unchanged.

```css
@media (max-width: 767px) {
  .landing-storytelling-feature-card--reverse .landing-storytelling-feature-copy {
    order: 1;
  }

  .landing-storytelling-feature-card--reverse .landing-storytelling-feature-media {
    order: 2;
  }
}
```

**Affected screen sizes:**  
Mobile only: `320px` to `767px`.

## Issue 2: Visible right-side overflow on small screens

**Problem:**  
Some decorative/glow elements and wide section content could visually extend outside the mobile viewport, creating a visible right-side overflow/scope issue.

**Why it happened:**  
The section contained absolute decorative elements and wide responsive content. Even if the main grid was responsive, decorative elements could still paint outside the section.

**Fix:**  
Added scoped overflow containment only to the landing featured/storytelling areas.

```css
.landing-featured-section,
.landing-storytelling-section {
  max-width: 100%;
  overflow-x: hidden;
}

@media (max-width: 767px) {
  .landing-storytelling-section {
    overflow: hidden;
    isolation: isolate;
    contain: paint;
  }
}
```

**Affected screen sizes:**  
All sizes receive safer horizontal containment, with stronger clipping on mobile.

## Issue 3: Scroll/carousel buttons looked unprofessional

**Problem:**  
Scroll/carousel buttons could appear inside the featured section and look like broken UI controls on responsive/zoomed layouts.

**Why it happened:**  
Previous carousel-style controls were visually exposed when the section overflowed.

**Fix:**  
Added scoped selectors to hide scroll/carousel controls only inside Featured Collections.

```css
.landing-featured-section [data-slot="carousel-previous"],
.landing-featured-section [data-slot="carousel-next"],
.landing-featured-section [data-carousel-control],
.landing-featured-section .carousel-button,
.landing-featured-section .slick-arrow,
.landing-featured-section .featured-scroll-button {
  display: none !important;
}
```

**Affected screen sizes:**  
All screen sizes, but scoped only to the featured section.

## Summary

- Desktop/tablet layout preserved.
- Mobile order now alternates like the desktop layout.
- Featured/storytelling overflow is contained.
- Featured scroll/carousel controls are hidden.
- Other sections are not targeted by the new CSS.
