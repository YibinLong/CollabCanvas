/**
 * AI Agent Type Definitions
 * 
 * WHY: Defines the structure of AI commands and responses.
 * 
 * WHAT: These types match the AI function schemas defined in the PRD.
 */

export interface CreateShapeArgs {
  type: 'rect' | 'circle' | 'line' | 'text';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  rotation?: number;
  color?: string;
  text?: string;
  fontSize?: number;
  id?: string;
}

export interface MoveShapeArgs {
  shapeId: string;
  x: number;
  y: number;
}

export interface ResizeShapeArgs {
  shapeId: string;
  width: number;
  height: number;
}

export interface RotateShapeArgs {
  shapeId: string;
  degrees: number;
}

export interface ArrangeShapesArgs {
  shapeIds: string[];
  mode: 'horizontal' | 'vertical' | 'grid';
  cols?: number;
  spacing?: number;
}

export interface GroupShapesArgs {
  shapeIds: string[];
}

// Union type for all AI operations
export type AIOperation =
  | { type: 'createShape'; args: CreateShapeArgs }
  | { type: 'moveShape'; args: MoveShapeArgs }
  | { type: 'resizeShape'; args: ResizeShapeArgs }
  | { type: 'rotateShape'; args: RotateShapeArgs }
  | { type: 'arrangeShapes'; args: ArrangeShapesArgs }
  | { type: 'groupShapes'; args: GroupShapesArgs };

// AI API response
export interface AIResponse {
  success: boolean;
  operations: AIOperation[];
  message?: string;
}

