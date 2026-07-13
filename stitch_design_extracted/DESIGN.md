---
name: Precision Engineering System
colors:
  surface: '#fcf8fa'
  surface-dim: '#dcd9db'
  surface-bright: '#fcf8fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f5'
  surface-container: '#f0edef'
  surface-container-high: '#eae7e9'
  surface-container-highest: '#e4e2e4'
  on-surface: '#1b1b1d'
  on-surface-variant: '#45464d'
  inverse-surface: '#303032'
  inverse-on-surface: '#f3f0f2'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#00687a'
  on-secondary: '#ffffff'
  secondary-container: '#57dffe'
  on-secondary-container: '#006172'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#271901'
  on-tertiary-container: '#98805d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#acedff'
  secondary-fixed-dim: '#4cd7f6'
  on-secondary-fixed: '#001f26'
  on-secondary-fixed-variant: '#004e5c'
  tertiary-fixed: '#fcdeb5'
  tertiary-fixed-dim: '#dec29a'
  on-tertiary-fixed: '#271901'
  on-tertiary-fixed-variant: '#574425'
  background: '#fcf8fa'
  on-background: '#1b1b1d'
  surface-variant: '#e4e2e4'
  slate-surface: '#F8FAFC'
  zinc-border: '#E4E4E7'
  engineering-navy: '#0F172A'
  electric-cyan: '#06B6D4'
  data-green: '#10B981'
typography:
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-sm:
    fontFamily: Space Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: '1.4'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  data-label:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: 0.05em
  data-value:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.2'
  caption:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '1.4'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 24px
  margin: 32px
  container-max: 1280px
---

## Brand & Style

The design system is anchored in **Corporate Modernism** with a heavy lean toward **Industrial Precision**. It is designed to evoke a sense of engineering excellence, technical authority, and unwavering reliability. The aesthetic prioritizes clarity and information density, reflecting the disciplined world of mechatronics and manufacturing.

The visual narrative is "High-Tech Workshop": clean, structured, and utilitarian, yet elevated by sophisticated color choices and refined typography. It targets professional engineers and procurement officers who require data-driven interfaces that remain performant and legible under heavy use. Whitespace is used strategically to separate complex datasets, ensuring the UI feels organized rather than overwhelming.

## Colors

The palette shifts away from generic aesthetics toward a **Deep Tech** profile. 
- **Engineering Navy (#0F172A)**: Acts as the primary anchor for headers, text, and high-emphasis surfaces, providing a grounded, professional foundation.
- **Electric Cyan (#06B6D4)**: A high-vibrancy accent used for primary actions, status indicators, and critical highlights, symbolizing innovation and energy.
- **Neutral Scale (Slate/Zinc)**: Utilized for background surfaces and structural borders. Slate provides a cool, industrial undertone to the environment, while Zinc handles the subtle delineation of UI containers.
- **Data Green (#10B981)**: Specifically reserved for trust signals, such as "ISO 9001:2015 compliant" badges and success states.

## Typography

The typographic system utilizes three distinct typefaces to separate hierarchy and function:
- **Space Grotesk**: Used for headings and branding. Its geometric, slightly technical character provides a modern architectural feel.
- **Inter**: The workhorse for all body copy and descriptions, chosen for its exceptional legibility at small sizes.
- **JetBrains Mono**: Specifically for data points, technical specifications, and part numbers. This monospaced font reinforces the engineering nature of the product, making technical values easy to compare vertically in lists or tables.

Mobile scaling: `headline-lg` reduces to 24px on mobile devices, while `data-label` remains constant to ensure technical readability across all breakpoints.

## Layout & Spacing

This design system employs a **structured 12-column grid** with a focus on generous whitespace to mitigate information density. 
- **Desktop**: 1280px max width with 32px side margins and 24px gutters.
- **Tablet**: 8-column grid with 24px margins.
- **Mobile**: 4-column grid with 16px margins.

Spacing follows a strict 4px modular scale. Component padding should lean toward "Spacious" for product cards (24px internal padding) to allow technical specs room to breathe.

## Elevation & Depth

Visual hierarchy is achieved through **low-contrast outlines** and **tonal layering** rather than heavy shadows. 
- **Surfaces**: Use Tiered backgrounds (`#F8FAFC` for page, `#FFFFFF` for primary cards).
- **Outlines**: Components use 1px borders in Zinc-200.
- **Shadows**: Only applied to floating elements like dropdowns or active product cards using an ambient, low-opacity (4%) navy-tinted shadow to prevent the UI from feeling "heavy."
- **Depth**: Active states utilize a subtle inner-shadow or a 2px Cyan border-left to indicate focus without breaking the grid.

## Shapes

The shape language is **Soft (0.25rem)**. This provides a subtle modern touch while maintaining the "boxy" industrial feel appropriate for mechatronics components. 
- **Standard UI elements**: 4px radius (buttons, inputs).
- **Cards**: 8px radius (rounded-lg) to create a distinct container look.
- **Status Badges**: 2px radius or sharp corners to denote a more technical, label-like appearance.

## Components

- **Product Cards**: Feature a 1px Zinc border. The header of the card should use a subtle background tint (Slate) to categorize the part type. Technical specs must be aligned using a two-column definition list with JetBrains Mono values.
- **Buttons**: Primary buttons are solid Engineering Navy with Electric Cyan hover states. Micro-interactions should include a subtle scale-down (0.98) on click and a smooth transition for background-color changes.
- **Input Fields**: Minimalist style with a 1px border. Focus state replaces the border color with Electric Cyan and adds a 2px outer glow of the same color at 10% opacity.
- **Chips/Category Filters**: Use a ghost-button style (outline only). When active, they fill with Engineering Navy and white text.
- **Status Badges**: Small, uppercase labels (e.g., "CAD AVAILABLE") using `data-label` typography, paired with a small icon.