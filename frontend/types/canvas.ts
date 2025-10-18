/**
 * Canvas Type Definitions
 * 
 * WHY: TypeScript types help catch bugs early and make the code self-documenting.
 * These types define the shape of data for our canvas objects.
 * 
 * WHAT: These will be used throughout the app for shapes, documents, and canvas state.
 */

// Supported shape types in the canvas
export type ShapeType = 'rect' | 'circle' | 'line' | 'text';

// Base shape interface - all shapes share these properties
export interface BaseShape {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  rotation?: number;
  locked?: boolean;
  zIndex?: number;
  // Conflict resolution fields - tracks which user is currently editing this shape
  lockedBy?: string | null;  // User ID of who's editing it
  lockedAt?: number | null;   // Timestamp when locked (for timeout detection)
}

// Rectangle shape
export interface RectangleShape extends BaseShape {
  type: 'rect';
  width: number;
  height: number;
  color?: string;
  // Canvas currently renders rectangles as plain SVG <rect> without radius support.
  // If you need rounded rectangles, consider using a separate shape type.
}

// Circle shape
// WHY: Circles use a bounding box (x, y, width, height) just like rectangles.
// The actual circle is drawn inscribed within this bounding box.
// This makes boundary checking consistent and prevents circles from going out of bounds.
export interface CircleShape extends BaseShape {
  type: 'circle';
  width: number;  // Width of the bounding box
  height: number; // Height of the bounding box
  color?: string;
}

// Line shape
export interface LineShape extends BaseShape {
  type: 'line';
  x2: number;
  y2: number;
  strokeWidth?: number;
  color?: string;
}

// Text shape
export interface TextShape extends BaseShape {
  type: 'text';
  text: string;
  fontSize?: number;
  color?: string;
  width: number;  // Width of the text box (for editing and resizing)
  height: number; // Height of the text box (for editing and resizing)
  fontWeight?: number | string;
  fontStyle?: 'normal' | 'italic';
  fontFamily?: string;
  lineHeight?: number;
  padding?: number;
  paddingX?: number;
  paddingY?: number;
  textAlign?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'center' | 'bottom';
  showBoundingBox?: boolean;
}

// Union type for all shapes
export type Shape = RectangleShape | CircleShape | LineShape | TextShape;

// Viewport state (pan and zoom)
export interface ViewportState {
  x: number;
  y: number;
  zoom: number;
}

// Canvas state
export interface CanvasState {
  shapes: Map<string, Shape>;
  selectedIds: string[];
  viewport: ViewportState;
}

