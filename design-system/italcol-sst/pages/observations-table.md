# Observations Table Page Overrides

> **PROJECT:** Italcol SST
> **Generated:** 2026-04-07 12:26:27
> **Page Type:** Dashboard / Data View

> ⚠️ **IMPORTANT:** Rules in this file **override** the Master file (`design-system/MASTER.md`).
> Only deviations from the Master are documented here. For all other rules, refer to the Master.

---

## Page-Specific Rules

### Layout Overrides

- **Max Width:** 1200px (standard)
- **Layout:** Full-width sections, centered content
- **Sections:** 1. Hero, 2. Problem intro, 3. Comparison table (product vs competitors), 4. Pricing (optional), 5. CTA

### Spacing Overrides

- No overrides — use Master spacing

### Typography Overrides

- No overrides — use Master typography

### Color Overrides

- **Strategy:** Table: Alternating rows (white/light grey). Your product: Highlight #FFFACD (light yellow) or green. Text: Dark

### Component Overrides

- Avoid: Wide tables breaking layout
- Avoid: Desktop-first causing mobile issues
- Avoid: Large blocking CSS files

---

## Page-Specific Components

- No unique components for this page

---

## Recommendations

- Effects: Number animations (count-up), trend direction indicators, percentage change animations, profit/loss color transitions
- Responsive: Use horizontal scroll or card layout
- Responsive: Start with mobile styles then add breakpoints
- Performance: Inline critical CSS defer non-critical
- CTA Placement: Table: Right column. CTA: Below table
