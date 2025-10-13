/**
 * Backend Type Definitions
 * 
 * WHY: Shared types for the backend codebase.
 * These mirror the frontend types but are defined separately for independence.
 */

// Shape types (matches frontend)
export type ShapeType = 'rect' | 'circle' | 'line' | 'text';

export interface BaseShape {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  rotation?: number;
  locked?: boolean;
  zIndex?: number;
}

export interface RectangleShape extends BaseShape {
  type: 'rect';
  width: number;
  height: number;
  color?: string;
}

export interface CircleShape extends BaseShape {
  type: 'circle';
  radius: number;
  color?: string;
}

export interface LineShape extends BaseShape {
  type: 'line';
  x2: number;
  y2: number;
  strokeWidth?: number;
  color?: string;
}

export interface TextShape extends BaseShape {
  type: 'text';
  text: string;
  fontSize?: number;
  color?: string;
}

export type Shape = RectangleShape | CircleShape | LineShape | TextShape;

// AI operation types
export interface CreateShapeArgs {
  type: ShapeType;
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

// Document types
export interface DocumentData {
  id: string;
  title: string;
  ownerId: string;
  yjsState?: Buffer;
  createdAt: Date;
  updatedAt: Date;
}

// User types
export interface UserData {
  id: string;
  email: string;
  name?: string;
}

