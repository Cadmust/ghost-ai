'use client';

import type { Shape } from '@/types/canvas';

interface ShapeRendererProps {
  shape: Shape;
  width: number;
  height: number;
  color: string;
  borderColor: string;
  borderWidth: number;
  label?: string;
  textColor?: string;
}

export function ShapeRenderer({
  shape,
  width,
  height,
  color,
  borderColor,
  borderWidth,
  label,
  textColor,
}: ShapeRendererProps) {
  if (shape === 'rectangle' || shape === 'pill' || shape === 'circle') {
    const borderRadius = shape === 'rectangle' ? '8px' : '9999px';

    return (
      <div
        style={{
          width,
          height,
          border: `${borderWidth}px solid ${borderColor}`,
          borderRadius,
          backgroundColor: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 12px',
        }}
      >
        {label && (
          <span
            style={{ color: textColor ?? 'var(--text-primary)' }}
            className="text-xs font-medium truncate"
          >
            {label}
          </span>
        )}
      </div>
    );
  }

  const vw = width;
  const vh = height;

  const renderSvgContent = () => {
    switch (shape) {
      case 'diamond': {
        const d = `M ${vw / 2} 0 L ${vw} ${vh / 2} L ${vw / 2} ${vh} L 0 ${vh / 2} Z`;
        return (
          <path
            d={d}
            fill={color}
            stroke={borderColor}
            strokeWidth={borderWidth}
          />
        );
      }
      case 'hexagon': {
        const d = `M ${vw * 0.5} 0 L ${vw} ${vh * 0.25} L ${vw} ${vh * 0.75} L ${vw * 0.5} ${vh} L 0 ${vh * 0.75} L 0 ${vh * 0.25} Z`;
        return (
          <path
            d={d}
            fill={color}
            stroke={borderColor}
            strokeWidth={borderWidth}
          />
        );
      }
      case 'cylinder': {
        const ry = vh * 0.12;
        return (
          <>
            <ellipse
              cx={vw / 2}
              cy={ry}
              rx={vw / 2 - 1}
              ry={ry}
              fill={color}
              stroke={borderColor}
              strokeWidth={borderWidth}
            />
            <line
              x1={1}
              y1={ry}
              x2={1}
              y2={vh - ry}
              stroke={borderColor}
              strokeWidth={borderWidth}
            />
            <line
              x1={vw - 1}
              y1={ry}
              x2={vw - 1}
              y2={vh - ry}
              stroke={borderColor}
              strokeWidth={borderWidth}
            />
            <ellipse
              cx={vw / 2}
              cy={vh - ry}
              rx={vw / 2 - 1}
              ry={ry}
              fill={color}
              stroke={borderColor}
              strokeWidth={borderWidth}
            />
          </>
        );
      }
    }
  };

  return (
    <div style={{ width, height, position: 'relative' }}>
      <svg
        viewBox={`0 0 ${vw} ${vh}`}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
        }}
      >
        {renderSvgContent()}
      </svg>
      {label && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 12px',
            pointerEvents: 'none',
          }}
        >
          <span
            style={{ color: textColor ?? 'var(--text-primary)' }}
            className="text-xs font-medium truncate"
          >
            {label}
          </span>
        </div>
      )}
    </div>
  );
}