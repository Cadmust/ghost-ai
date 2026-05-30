import type { CanvasNode, CanvasEdge } from '@/types/canvas';
import type { Shape } from '@/types/canvas';

export interface CanvasTemplate {
  id: string;
  name: string;
  description: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

function t(
  id: string,
  label: string,
  shape: Shape,
  x: number,
  y: number,
  color: string,
  textColor: string,
): CanvasNode {
  return {
    id,
    type: 'canvasNode',
    position: { x, y },
    data: { label, color, shape, textColor },
  };
}

function e(id: string, source: string, target: string, label?: string): CanvasEdge {
  return {
    id,
    source,
    target,
    type: 'canvasEdge',
    data: label ? { label } : {},
  };
}

export const CANVAS_TEMPLATES: CanvasTemplate[] = [
  {
    id: 'microservices',
    name: 'Microservices Architecture',
    description:
      'A typical microservices layout with API Gateway, backend services, databases, and a message queue.',
    nodes: [
      t('ms-1', 'API Gateway', 'pill', 280, 20, 'rgba(0,200,212,0.15)', '#00c8d4'),
      t('ms-2', 'User Service', 'rectangle', 40, 140, 'rgba(139,92,246,0.15)', '#8b5cf6'),
      t('ms-3', 'Order Service', 'rectangle', 220, 140, 'rgba(52,211,153,0.15)', '#34d399'),
      t('ms-4', 'Payment Service', 'rectangle', 420, 140, 'rgba(251,191,36,0.15)', '#fbbf24'),
      t('ms-5', 'User DB', 'cylinder', 40, 280, '#1e1e23', '#f0f0f4'),
      t('ms-6', 'Order DB', 'cylinder', 220, 280, '#1e1e23', '#f0f0f4'),
      t('ms-7', 'Payment DB', 'cylinder', 420, 280, '#1e1e23', '#f0f0f4'),
      t('ms-8', 'Message Queue', 'hexagon', 580, 140, 'rgba(255,77,79,0.12)', '#ff4d4f'),
    ],
    edges: [
      e('ms-e1', 'ms-1', 'ms-2'),
      e('ms-e2', 'ms-1', 'ms-3'),
      e('ms-e3', 'ms-1', 'ms-4'),
      e('ms-e4', 'ms-1', 'ms-8'),
      e('ms-e5', 'ms-2', 'ms-5'),
      e('ms-e6', 'ms-3', 'ms-6'),
      e('ms-e7', 'ms-4', 'ms-7'),
      e('ms-e8', 'ms-3', 'ms-8'),
      e('ms-e9', 'ms-8', 'ms-4'),
    ],
  },
  {
    id: 'ci-cd',
    name: 'CI/CD Pipeline',
    description:
      'A continuous integration and deployment pipeline from source control through to production.',
    nodes: [
      t('cd-1', 'Source\nControl', 'rectangle', 20, 100, 'rgba(0,200,212,0.15)', '#00c8d4'),
      t('cd-2', 'Build', 'diamond', 200, 100, 'rgba(139,92,246,0.15)', '#8b5cf6'),
      t('cd-3', 'Unit Tests', 'circle', 380, 100, 'rgba(52,211,153,0.15)', '#34d399'),
      t('cd-4', 'Integration\nTests', 'hexagon', 380, 220, 'rgba(251,191,36,0.15)', '#fbbf24'),
      t('cd-5', 'Package\n& Publish', 'cylinder', 560, 100, 'rgba(255,77,79,0.12)', '#ff4d4f'),
      t('cd-6', 'Deploy', 'pill', 720, 100, 'rgba(52,211,153,0.15)', '#34d399'),
    ],
    edges: [
      e('cd-e1', 'cd-1', 'cd-2'),
      e('cd-e2', 'cd-2', 'cd-3'),
      e('cd-e3', 'cd-3', 'cd-4'),
      e('cd-e4', 'cd-3', 'cd-5'),
      e('cd-e5', 'cd-4', 'cd-5'),
      e('cd-e6', 'cd-5', 'cd-6'),
    ],
  },
  {
    id: 'event-driven',
    name: 'Event-Driven System',
    description:
      'An event-driven architecture with producers, an event bus, consumers, and data stores.',
    nodes: [
      t('ed-1', 'Web App', 'pill', 20, 20, 'rgba(0,200,212,0.15)', '#00c8d4'),
      t('ed-2', 'Mobile App', 'pill', 20, 180, 'rgba(139,92,246,0.15)', '#8b5cf6'),
      t('ed-3', 'Event Bus\n(Kafka)', 'hexagon', 280, 100, 'rgba(52,211,153,0.15)', '#34d399'),
      t('ed-4', 'Analytics\nService', 'rectangle', 520, 20, 'rgba(251,191,36,0.15)', '#fbbf24'),
      t('ed-5', 'Notification\nService', 'rectangle', 520, 180, 'rgba(255,77,79,0.12)', '#ff4d4f'),
      t('ed-6', 'Analytics\nDB', 'cylinder', 720, 20, '#1e1e23', '#f0f0f4'),
      t('ed-7', 'Audit Log', 'cylinder', 720, 180, '#1e1e23', '#f0f0f4'),
    ],
    edges: [
      e('ed-e1', 'ed-1', 'ed-3'),
      e('ed-e2', 'ed-2', 'ed-3'),
      e('ed-e3', 'ed-3', 'ed-4'),
      e('ed-e4', 'ed-3', 'ed-5'),
      e('ed-e5', 'ed-4', 'ed-6'),
      e('ed-e6', 'ed-5', 'ed-7'),
    ],
  },
];