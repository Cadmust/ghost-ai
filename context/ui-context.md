# UI Context

## Theme

Dark only. No light mode. The design language is a dark technical
workspace — near-black backgrounds, layered surfaces,
and vivid accent colors for interactive elements.

## Colors

All components must use these tokens — no hardcoded hex values.

| Role            | CSS Variable       | Value    |
| --------------- | ------------------ | -------- |
| Page background | `--bg-base`        | `#080809` |
| Surface         | `--bg-surface`     | `#111114` |
| Elevated surface| `--bg-elevated`    | `#18181c` |
| Subtle surface  | `--bg-subtle`      | `#1e1e23` |
| Primary text    | `--text-primary`   | `#f0f0f4` |
| Secondary text  | `--text-secondary` | `#c0c0cc` |
| Muted text      | `--text-muted`     | `#808090` |
| Faint text      | `--text-faint`     | `#505060` |
| Brand accent    | `--accent-primary` | `#00c8d4` |
| Brand dim       | `--accent-primary-dim` | `rgba(0,200,212,0.12)` |
| Default border  | `--border-subtle`  | `#3a4a42` |
| Error           | `--state-error`    | `#ff4d4f` |
| Success         | `--state-success`  | `#34d399` |

## Typography

| Role      | Font              | Variable      |
| --------- | ----------------- | ------------- |
| UI text   | Geist Sans | `--font-sans` |
| Code/mono | Geist Mono | `--font-mono` |

## Border Radius

| Context           | Class            |
| ----------------- | ---------------- |
| Inline / small UI | `rounded-xl` |
| Cards / panels    | `rounded-2xl` |
| Modals / overlays | `rounded-3xl` |

## Component Library

shadcn/ui on top of Tailwind. Components live
in components/ui/. Use the CLI to add new components
rather than writing from scratch.

## Layout Patterns

- Editor: full-viewport split with left sidebar, center canvas, right sidebar
- Sidebars: fixed width with border separator
- Modals: centered overlay with backdrop blur
- Navbar: top bar with bottom border

## Icons

Lucide React. Stroke-based icons only. Sizes:
h-4 w-4 for inline, h-5 w-5 for buttons.
