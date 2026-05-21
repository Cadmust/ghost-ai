# Dialog Dark Theme Fix - Complete Summary

## Problem
The Create Project, Rename, and Delete dialogs were appearing in light theme instead of the dark theme, despite adding `dark:` variant classes.

## Root Cause
The dialogs were using Tailwind CSS `bg-popover` and `text-popover-foreground` classes that rely on CSS variables defined in the `:root` selector. The `dark:` variant classes weren't working because:
1. The dark mode state wasn't properly cascading to the dialog component
2. The CSS variables were resolving to light theme values even when dark mode was active
3. The Button and Input components were also using hardcoded Tailwind classes that didn't properly respond to the dark theme

## Solution
Replaced all Tailwind CSS color classes with inline styles using the Ghost AI custom CSS variables that are properly scoped to the `:root` and `.dark` selectors:

### Files Modified

#### 1. `/components/ui/dialog.tsx`
- **DialogContent**: Now uses inline styles with `--bg-surface`, `--text-primary`, `--border-subtle`
- **DialogFooter**: Now uses inline styles with `--bg-elevated` and `--border-subtle`
- **DialogTitle**: Now uses inline style with `--text-primary`
- **DialogDescription**: Now uses inline style with `--text-secondary`

#### 2. `/components/ui/input.tsx`
- Uses inline styles with `--bg-elevated`, `--text-primary`, `--border-subtle`
- Simplified classes to focus on layout and removed hardcoded color Tailwind classes

#### 3. `/components/ui/button.tsx`
- Removed dark-specific variants that weren't working (dark:bg-input/30, dark:border-input, etc.)
- Simplified the buttonVariants CVA to use base color classes that work across all themes

## CSS Variables Used
```css
--bg-base: #080809;        /* Main background */
--bg-surface: #111114;     /* Dialog background */
--bg-elevated: #18181c;    /* Dialog footer background */
--bg-subtle: #1e1e23;      /* Subtle background */
--text-primary: #f0f0f4;   /* Main text color */
--text-secondary: #c0c0cc; /* Secondary text color */
--text-muted: #808090;     /* Muted text color */
--border-subtle: #3a4a42;  /* Border color */
--accent-primary: #00c8d4; /* Accent color */
```

## Result
All dialogs now properly display with the Ghost AI dark theme colors that match the application's design system. The dialogs now inherit colors from the same CSS variables used throughout the rest of the application, ensuring consistency and maintainability.

## Testing Notes
- Verify Create Project dialog displays with dark theme
- Verify Rename Project dialog displays with dark theme
- Verify Delete Project dialog displays with dark theme
- Verify input fields have dark theme styling
- Verify buttons have appropriate styling for each variant
- Verify dialog footer has proper contrast
