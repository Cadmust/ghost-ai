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
  textColor?: string;
  [key: string]: unknown;
}

export interface NodeColorTheme {
  name: string;
  bg: string;
  text: string;
}

export const NODE_COLOR_THEMES: NodeColorTheme[] = [
  { name: 'Slate',   bg: '#1e1e23', text: '#f0f0f4' },
  { name: 'Cyan',    bg: 'rgba(0,200,212,0.15)', text: '#00c8d4' },
  { name: 'Emerald', bg: 'rgba(52,211,153,0.15)', text: '#34d399' },
  { name: 'Amber',   bg: 'rgba(251,191,36,0.15)', text: '#fbbf24' },
  { name: 'Rose',    bg: 'rgba(255,77,79,0.12)', text: '#ff4d4f' },
  { name: 'Violet',  bg: 'rgba(139,92,246,0.15)', text: '#8b5cf6' },
];

export type CanvasNode = Node<CanvasNodeData, 'canvasNode'>;
export interface CanvasEdgeData {
  label?: string;
  [key: string]: unknown;
}

export type CanvasEdge = Edge<CanvasEdgeData, 'canvasEdge'>;

export interface ShapeDragPayload {
  shape: Shape;
  width: number;
  height: number;
}