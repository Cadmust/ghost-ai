'use client';

import { memo } from 'react';
import type { NodeColorTheme } from '@/types/canvas';
import { NODE_COLOR_THEMES } from '@/types/canvas';

interface ColorToolbarProps {
  currentColor: string;
  currentTextColor: string;
  onColorSelect: (theme: NodeColorTheme) => void;
}

function isActive(
  theme: NodeColorTheme,
  currentColor: string,
  currentTextColor: string,
): boolean {
  return theme.bg === currentColor && theme.text === currentTextColor;
}

export const ColorToolbar = memo(function ColorToolbar({
  currentColor,
  currentTextColor,
  onColorSelect,
}: ColorToolbarProps) {
  return (
    <div
      className="flex items-center gap-1 px-2 py-1.5 rounded-lg"
      style={{
        position: 'absolute',
        bottom: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        marginBottom: 8,
        backgroundColor: 'var(--bg-elevated)',
        border: '1px solid var(--border-subtle)',
        zIndex: 100,
        pointerEvents: 'auto',
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {NODE_COLOR_THEMES.map((theme) => {
        const active = isActive(theme, currentColor, currentTextColor);
        return (
          <button
            key={theme.name}
            title={theme.name}
            onClick={() => onColorSelect(theme)}
            style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              backgroundColor: theme.bg,
              border: active
                ? `2px solid ${theme.text}`
                : '2px solid transparent',
              outline: active ? `1px solid ${theme.text}` : 'none',
              cursor: 'pointer',
              padding: 0,
              transition: 'border-color 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = `0 0 6px 1px ${theme.text}`;
            }}
            onMouseLeave={(e) => {
              if (active) {
                e.currentTarget.style.boxShadow = 'none';
              } else {
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
          />
        );
      })}
    </div>
  );
});