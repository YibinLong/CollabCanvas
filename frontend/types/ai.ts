/**
 * AI Type Definitions
 * 
 * WHY: These types define the structure of AI commands and responses.
 * They ensure type safety when communicating with the AI backend.
 * 
 * WHAT: Based on the rubric requirements (Section 4: AI Canvas Agent - 25 points)
 * We need 8+ distinct command types covering creation, manipulation, layout, and complex commands.
 */

import { ShapeType } from './canvas';

// ==================== AI Command Types ====================

/**
 * CreateShape Command
 * Category: CREATION
 * Creates a new shape on the canvas
 */
export interface CreateShapeCommand {
  type: 'createShape';
  shapeType: ShapeType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number;
  color?: string;
  text?: string;
  fontSize?: number;
  id?: string;
}

/**
 * MoveShape Command
 * Category: MANIPULATION
 * Moves an existing shape to a new position
 */
export interface MoveShapeCommand {
  type: 'moveShape';
  shapeId: string;
  x: number;
  y: number;
  relative?: boolean; // If true, x/y are offsets from current position
}

/**
 * ResizeShape Command
 * Category: MANIPULATION
 * Resizes an existing shape
 */
export interface ResizeShapeCommand {
  type: 'resizeShape';
  shapeId: string;
  width: number;
  height: number;
}

/**
 * RotateShape Command
 * Category: MANIPULATION
 * Rotates an existing shape
 */
export interface RotateShapeCommand {
  type: 'rotateShape';
  shapeId: string;
  degrees: number;
  relative?: boolean; // If true, degrees is added to current rotation
}

/**
 * ChangeColor Command
 * Category: MANIPULATION
 * Changes the color of existing shapes
 */
export interface ChangeColorCommand {
  type: 'changeColor';
  shapeIds: string[];
  color: string;
}

/**
 * DeleteShape Command
 * Category: MANIPULATION
 * Deletes shapes from the canvas
 */
export interface DeleteShapeCommand {
  type: 'deleteShape';
  shapeIds: string[];
}

/**
 * ArrangeShapes Command
 * Category: LAYOUT
 * Arranges multiple shapes in a pattern
 */
export interface ArrangeShapesCommand {
  type: 'arrangeShapes';
  shapeIds: string[];
  mode: 'horizontal' | 'vertical' | 'grid';
  cols?: number; // For grid mode
  spacing?: number; // Space between shapes
}

/**
 * AlignShapes Command
 * Category: LAYOUT
 * Aligns multiple shapes
 */
export interface AlignShapesCommand {
  type: 'alignShapes';
  shapeIds: string[];
  alignment: 'left' | 'right' | 'top' | 'bottom' | 'center-horizontal' | 'center-vertical';
}

/**
 * CreateGroup Command
 * Category: COMPLEX
 * Creates a group of related shapes (e.g., button, card, form)
 */
export interface CreateGroupCommand {
  type: 'createGroup';
  groupType: 'button' | 'card' | 'form' | 'navbar' | 'custom';
  x: number;
  y: number;
  options?: Record<string, any>; // Group-specific options
}

/**
 * DuplicateShape Command
 * Category: CREATION
 * Duplicates existing shapes
 */
export interface DuplicateShapeCommand {
  type: 'duplicateShape';
  shapeIds: string[];
  offsetX?: number;
  offsetY?: number;
}

// Union type of all AI commands
export type AICommand =
  | CreateShapeCommand
  | MoveShapeCommand
  | ResizeShapeCommand
  | RotateShapeCommand
  | ChangeColorCommand
  | DeleteShapeCommand
  | ArrangeShapesCommand
  | AlignShapesCommand
  | CreateGroupCommand
  | DuplicateShapeCommand;

// ==================== AI API Types ====================

/**
 * Request to the AI interpret endpoint
 */
export interface AIInterpretRequest {
  prompt: string;
  documentId: string;
  userId?: string;
}

/**
 * Response from the AI interpret endpoint
 */
export interface AIInterpretResponse {
  success: boolean;
  commands: AICommand[];
  message?: string;
  error?: string;
  executionTimeMs?: number;
}

/**
 * AI Chat Message
 * Used in the UI to display conversation history
 */
export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  commands?: AICommand[];
}
