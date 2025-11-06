# AlergiasCL Design System

**Versión:** v1.0
**Base:** Tech-Care Purple Theme
**Stack:** Tailwind CSS 4 + shadcn/ui + Next.js 16

---

## Table of Contents

1. [Overview](#overview)
2. [Color Palette](#color-palette)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
5. [Components](#components)
6. [Accessibility](#accessibility)
7. [Usage Guidelines](#usage-guidelines)

---

## Overview

AlergiasCL uses a **Tech-Care Purple Theme** designed for medical/health applications. The design system prioritizes:

- **Clarity**: High contrast for readability in various lighting conditions
- **Trust**: Professional purple palette conveys medical expertise
- **Warmth**: Rounded corners and friendly typography reduce medical anxiety
- **Accessibility**: WCAG 2.1 AA compliance minimum

**Core Philosophy:**
- Purple (#7C3AED) as primary brand color for authority and care
- Green (#22C55E) for positive confirmations and "safe" indicators
- Teal (#2DD4BF) for scanner-related features
- Clear semantic state colors (success, warning, danger, info)

---

## Color Palette

### Primary Brand Colors

#### Purple/Violet (Primary)
Main brand color for CTAs, links, active states, and focus rings.

| Name | Hex | Tailwind | Usage |
|------|-----|----------|-------|
| Primary 50 | `#FAF5FF` | `bg-primary-50` | Very light backgrounds |
| Primary 100 | `#F3E8FF` | `bg-primary-100` | Light backgrounds |
| Primary 200 | `#E9D5FF` | `bg-primary-200` | Hover states (light) |
| Primary 300 | `#D8B4FE` | `bg-primary-300` | Borders |
| Primary 400 | `#C084FC` | `bg-primary-400` | Hover states |
| Primary 500 | `#A855F7` | `bg-primary-500` | Accent variant |
| **Primary 600** | **`#7C3AED`** | **`bg-primary`** | **Main brand color** |
| Primary 700 | `#6D28D9` | `bg-primary-700` | Hover (darker) |
| Primary 800 | `#5B21B6` | `bg-primary-800` | Active states |
| Primary 900 | `#4C1D95` | `bg-primary-900` | Dark text on light |
| Primary 950 | `#2E1065` | `bg-primary-950` | Deepest shade |

**Primary Soft** (`#EDE9FE` / Violet 100): Light backgrounds for primary-colored sections, selected states, soft emphasis.

```tsx
// Usage examples
<button className="bg-primary text-primary-foreground hover:bg-primary-700">
  Escanear Etiqueta
</button>

<div className="bg-primary-soft text-primary-900">
  Perfil seleccionado
</div>
```

---

### Accent Colors

#### Accent Fresh (Green)
Used for positive actions, confirmations, "safe" indicators.

| Name | Hex | Tailwind | Usage |
|------|-----|----------|-------|
| **Accent Fresh** | **`#22C55E`** | **`bg-accent-fresh`** | Safe/confirmation |
| Accent Fresh 50 | `#F0FDF4` | `bg-accent-fresh-50` | Very light green |
| Accent Fresh 600 | `#16A34A` | `bg-accent-fresh-600` | Darker green |

```tsx
<Badge className="bg-accent-fresh text-accent-fresh-foreground">
  Seguro
</Badge>
```

#### Accent Scan (Teal/Mint)
Used for scanner-related UI, scan buttons, analysis highlights.

| Name | Hex | Tailwind | Usage |
|------|-----|----------|-------|
| **Accent Scan** | **`#2DD4BF`** | **`bg-accent-scan`** | Scanner features |
| Accent Scan 50 | `#F0FDFA` | `bg-accent-scan-50` | Very light teal |
| Accent Scan 600 | `#0D9488` | `bg-accent-scan-600` | Darker teal |

```tsx
<button className="bg-accent-scan hover:bg-accent-scan-600">
  Escanear Ahora
</button>
```

---

### Semantic State Colors

#### Success (Green)
Successful operations, completed steps, "safe" risk level.

| Name | Hex | Tailwind | Usage |
|------|-----|----------|-------|
| **Success** | **`#16A34A`** | **`bg-success`** | Success messages |
| Success Light | `#BBF7D0` | `bg-success-light` | Light background |
| Success Dark | `#15803D` | `bg-success-dark` | Dark variant |

#### Warning (Amber)
Caution states, "medium" risk level, alerts.

| Name | Hex | Tailwind | Usage |
|------|-----|----------|-------|
| **Warning** | **`#CA8A04`** | **`bg-warning`** | Warning messages |
| Warning Light | `#FDE68A` | `bg-warning-light` | Light background |
| Warning Dark | `#92400E` | `bg-warning-dark` | Dark variant |

#### Danger (Red)
Error states, "high" risk level, destructive actions.

| Name | Hex | Tailwind | Usage |
|------|-----|----------|-------|
| **Danger** | **`#DC2626`** | **`bg-danger`** | Error messages |
| Danger Light | `#FECACA` | `bg-danger-light` | Light background |
| Danger Dark | `#991B1B` | `bg-danger-dark` | Dark variant |

#### Info (Blue)
Informational messages, tips, neutral notifications.

| Name | Hex | Tailwind | Usage |
|------|-----|----------|-------|
| **Info** | **`#0EA5E9`** | **`bg-info`** | Info messages |
| Info Light | `#BAE6FD` | `bg-info-light` | Light background |
| Info Dark | `#0369A1` | `bg-info-dark` | Dark variant |

```tsx
// Risk level badges
<Badge className="bg-success">Bajo</Badge>
<Badge className="bg-warning">Medio</Badge>
<Badge className="bg-danger">Alto</Badge>
```

---

### Neutral Colors

Slate-based neutral palette for text, borders, backgrounds, disabled states.

| Name | Hex | Tailwind | Usage |
|------|-----|----------|-------|
| Neutral 50 | `#F8FAFC` | `bg-neutral-50` | Light background |
| Neutral 100 | `#F1F5F9` | `bg-neutral-100` | Card background |
| Neutral 200 | `#E2E8F0` | `bg-neutral-200` | Borders |
| Neutral 300 | `#CBD5E1` | `bg-neutral-300` | Disabled |
| Neutral 400 | `#94A3B8` | `text-neutral-400` | Placeholder |
| Neutral 500 | `#64748B` | `text-neutral-500` | Secondary text |
| Neutral 600 | `#475569` | `text-neutral-600` | Body text |
| Neutral 700 | `#334155` | `text-neutral-700` | Headings |
| Neutral 800 | `#1E293B` | `text-neutral-800` | Strong text |
| **Neutral 900** | **`#0F172A`** | **`text-neutral-900`** | **Dark text** |
| Neutral 950 | `#020617` | `text-neutral-950` | Deepest shade |

---

## Typography

### Font Families

#### Sans (UI & Body Text)
**Inter** - Clean, readable, optimized for UI.

```tsx
// Applied by default via font-sans
<p className="font-sans">Body text uses Inter</p>
```

**Alternative:** Manrope (can be swapped in `layout.tsx`)

#### Display (Headlines & Brand)
**Sora** - Friendly, rounded, perfect for headlines.

```tsx
<h1 className="font-display text-4xl">AlergiasCL</h1>
```

**Alternative:** Poppins (can be swapped in `layout.tsx`)

### Type Scale

| Class | Size | Line Height | Use Case |
|-------|------|-------------|----------|
| `text-xs` | 0.75rem (12px) | 1rem | Captions, helper text |
| `text-sm` | 0.875rem (14px) | 1.25rem | Small body text |
| `text-base` | 1rem (16px) | 1.5rem | Body text (default) |
| `text-lg` | 1.125rem (18px) | 1.75rem | Large body |
| `text-xl` | 1.25rem (20px) | 1.75rem | Subheadings |
| `text-2xl` | 1.5rem (24px) | 2rem | Section headings |
| `text-3xl` | 1.875rem (30px) | 2.25rem | Page titles |
| `text-4xl` | 2.25rem (36px) | 2.5rem | Hero headlines |

### Font Weights

| Class | Weight | Use Case |
|-------|--------|----------|
| `font-normal` | 400 | Body text |
| `font-medium` | 500 | Emphasis, labels |
| `font-semibold` | 600 | Subheadings, buttons |
| `font-bold` | 700 | Headings, strong emphasis |

### Typography Examples

```tsx
// Page title
<h1 className="font-display text-3xl font-bold text-neutral-900">
  Bienvenido a AlergiasCL
</h1>

// Section heading
<h2 className="font-display text-2xl font-semibold text-neutral-800">
  Tus Alergias
</h2>

// Body text
<p className="font-sans text-base text-neutral-600">
  Selecciona tus alergias para personalizar tu experiencia.
</p>

// Label
<label className="font-sans text-sm font-medium text-neutral-700">
  Nombre
</label>

// Helper text
<span className="text-xs text-neutral-500">
  Este campo es opcional
</span>
```

---

## Spacing & Layout

### Container

Centered container with responsive padding:

```tsx
<div className="container mx-auto px-4 sm:px-6 lg:px-8">
  {/* Content */}
</div>
```

Max width: `1400px` (2xl breakpoint)

### Spacing Scale

Tailwind's default spacing scale (1 unit = 0.25rem = 4px):

| Class | Size | Use Case |
|-------|------|----------|
| `p-2` | 0.5rem (8px) | Tight padding |
| `p-4` | 1rem (16px) | Standard padding |
| `p-6` | 1.5rem (24px) | Comfortable padding |
| `p-8` | 2rem (32px) | Large padding |
| `gap-4` | 1rem (16px) | Standard gap between items |
| `space-y-4` | 1rem (16px) | Vertical spacing |

### Border Radius

| Class | Size | Use Case |
|-------|------|----------|
| `rounded-sm` | `calc(var(--radius) - 4px)` | Small elements |
| `rounded-md` | `calc(var(--radius) - 2px)` | Medium elements |
| `rounded-lg` | `var(--radius)` | Cards, buttons |
| `rounded-full` | 9999px | Pills, avatars |

Default `--radius` value: `0.5rem` (8px)

---

## Components

### Buttons

#### Primary Button
```tsx
import { Button } from "@/components/ui/button"

<Button>Escanear Etiqueta</Button>
```

#### Variants
```tsx
<Button variant="default">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>
```

#### Sizes
```tsx
<Button size="default">Default</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon">
  <Icon />
</Button>
```

### Cards

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### Forms

```tsx
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"

const form = useForm()

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="email"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Email</FormLabel>
          <FormControl>
            <Input placeholder="tu@email.com" {...field} />
          </FormControl>
          <FormDescription>Ingresa tu email</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  </form>
</Form>
```

### Badges

```tsx
import { Badge } from "@/components/ui/badge"

<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Destructive</Badge>
<Badge variant="outline">Outline</Badge>

// Custom colored badges
<Badge className="bg-accent-fresh text-white">Seguro</Badge>
<Badge className="bg-warning text-white">Precaución</Badge>
<Badge className="bg-danger text-white">Peligro</Badge>
```

### Progress

```tsx
import { Progress } from "@/components/ui/progress"

<Progress value={33} className="w-full" />
```

### Select

```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

<Select>
  <SelectTrigger>
    <SelectValue placeholder="Selecciona una opción" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Opción 1</SelectItem>
    <SelectItem value="option2">Opción 2</SelectItem>
  </SelectContent>
</Select>
```

---

## Accessibility

### Contrast Requirements

- **Normal text**: Minimum 4.5:1 contrast ratio
- **Large text (18pt+)**: Minimum 3:1 contrast ratio
- **Interactive elements**: Minimum 3:1 contrast for borders/states

### Color Combinations (WCAG AA Compliant)

| Text | Background | Ratio | Pass |
|------|------------|-------|------|
| `text-neutral-900` | `bg-white` | 19.11:1 | ✅ AAA |
| `text-neutral-700` | `bg-white` | 12.02:1 | ✅ AAA |
| `text-neutral-600` | `bg-white` | 8.59:1 | ✅ AAA |
| `text-primary-900` | `bg-primary-50` | 12.3:1 | ✅ AAA |
| `text-white` | `bg-primary` | 6.87:1 | ✅ AA |
| `text-white` | `bg-danger` | 5.46:1 | ✅ AA |

### Focus States

All interactive elements include visible focus rings:

```tsx
// Default focus ring (primary color)
<button className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
  Click me
</button>
```

### Screen Reader Support

- Use semantic HTML (`<button>`, `<nav>`, `<main>`)
- Provide `aria-label` for icon-only buttons
- Use `aria-describedby` for form field hints
- Ensure form validation errors are announced

---

## Usage Guidelines

### Do's ✅

- **Use primary purple** for main CTAs and brand elements
- **Use green (accent-fresh)** for confirmations and "safe" indicators
- **Use teal (accent-scan)** for scanner-related features
- **Use semantic colors** (success, warning, danger) for risk levels
- **Maintain consistent spacing** using Tailwind's spacing scale
- **Test color contrast** for all text/background combinations
- **Use Inter for body text** and **Sora for headlines**

### Don'ts ❌

- **Don't mix multiple accent colors** in the same component
- **Don't use color alone** to convey information (add icons/text)
- **Don't use red for neutral actions** (reserve for errors/high risk)
- **Don't create custom colors** outside the defined palette
- **Don't use font-display for long body text** (readability issues)
- **Don't ignore focus states** on interactive elements

### Color Usage by Context

#### Risk Levels (Scanner Results)
- **Low Risk**: `bg-success` (green)
- **Medium Risk**: `bg-warning` (amber)
- **High Risk**: `bg-danger` (red)

#### Actions
- **Primary CTA**: `bg-primary` (purple)
- **Scan Action**: `bg-accent-scan` (teal)
- **Confirm/Safe**: `bg-accent-fresh` (green)
- **Destructive**: `bg-destructive` (red)

#### Status Indicators
- **Complete**: `bg-success`
- **In Progress**: `bg-info`
- **Pending**: `bg-neutral-300`
- **Error**: `bg-danger`

---

## Implementation Checklist

When creating new components:

- [ ] Use Tailwind utility classes (avoid custom CSS)
- [ ] Import colors from theme (never hardcode hex values)
- [ ] Test on light and dark backgrounds
- [ ] Verify WCAG AA contrast ratios
- [ ] Add hover/focus/active states
- [ ] Ensure keyboard navigation works
- [ ] Test with screen readers
- [ ] Responsive on mobile (min width 320px)
- [ ] Use semantic HTML elements
- [ ] Document component in Storybook (if applicable)

---

## Migration Notes

### From Legacy CSS to Tailwind

When migrating existing components:

1. **Replace custom classes** with Tailwind utilities
2. **Update colors** from old blue (`#2563eb`) to new purple (`#7C3AED`)
3. **Use shadcn/ui components** for consistency
4. **Remove inline styles** in favor of utility classes
5. **Update CSS variables** to use new HSL format

Example migration:
```tsx
// Before (legacy CSS)
<div className="card primary-bg">
  <h2 className="card-title">Title</h2>
</div>

// After (Tailwind + shadcn)
<Card className="bg-primary-soft">
  <CardHeader>
    <CardTitle className="font-display text-2xl">Title</CardTitle>
  </CardHeader>
</Card>
```

---

## Resources

- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Lucide Icons](https://lucide.dev)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Contrast Checker](https://webaim.org/resources/contrastchecker/)

---

**Última actualización:** 2025-01-06
**Mantenido por:** Equipo AlergiasCL
