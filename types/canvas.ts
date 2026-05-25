import type { Node, Edge } from '@xyflow/react';

export type Shape = 'rectangle' | 'diamond' | 'circle' | 'pill' | 'cylinder' | 'hexagon';

export const SHAPE_DEFAULT_SIZES: Record<Shape, { width: number; height: number }> = {
  rectangle: { width: 160, height: 80 },
  diamond: { width: 120, height: 120 },
  circle: { width: 80, height: 80 },
  pill: { width: 140, height: 70 },
  cylinder: { width: 120, height: 80 },
  hexagon: { width: 100, height: 90 },
};

export interface CanvasNodeData {
  label: string;
  color: string;
  shape: Shape;
  [key: string]: unknown;
}

export type CanvasNode = Node<CanvasNodeData, 'canvasNode'>;
export type CanvasEdge = Edge<Record<string, never>, 'canvasEdge'>;

export interface ShapeDragPayload {
  shape: Shape;
  width: number;
  height: number;
}