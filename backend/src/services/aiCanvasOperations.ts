/**
 * AI Canvas Operations Service (PR #32)
 * 
 * WHY: Executes AI commands on the Yjs document.
 * Converts structured AI commands into actual canvas modifications.
 * 
 * WHAT: Takes commands from the AI controller and applies them to the Yjs document.
 * Changes automatically sync to all connected clients via WebSocket.
 * 
 * HOW: 
 * 1. Receives AI commands (from aiController)
 * 2. Validates commands
 * 3. Modifies Yjs document
 * 4. Yjs automatically broadcasts changes to all clients via WebSocket
 */

import * as Y from 'yjs';
import { v4 as uuidv4 } from 'uuid';

// ==================== Type Definitions ====================

export interface AICommand {
  type: string;
  [key: string]: any;
}

export interface ExecutionResult {
  success: boolean;
  shapeIds?: string[];
  error?: string;
  message?: string;
}

// ==================== Helper Functions ====================

/**
 * Generate a unique ID for a new shape
 */
function generateShapeId(): string {
  return 'ai-shape-' + uuidv4();
}

/**
 * Get default dimensions for a shape type
 */
function getDefaultDimensions(shapeType: string): { width: number; height: number } {
  switch (shapeType) {
    case 'rect':
      return { width: 100, height: 100 };
    case 'circle':
      return { width: 100, height: 100 };
    case 'text':
      return { width: 200, height: 60 };
    default:
      return { width: 100, height: 100 };
  }
}

/**
 * Estimate a text box size based on text length and font size
 *
 * WHY: Text shapes need explicit width/height so they don't render oversized
 * dashed boxes. This helper gives us a reasonable bounding box that mimics
 * Tailwind-like padding and line height.
 */
function calculateTextBox(
  text: string,
  fontSize: number,
  options: {
    horizontalPadding?: number;
    verticalPadding?: number;
    minWidth?: number;
    maxWidth?: number;
    lineHeightMultiplier?: number;
  } = {}
): { width: number; height: number } {
  const horizontalPadding = options.horizontalPadding ?? 16; // total padding (left + right)
  const verticalPadding = options.verticalPadding ?? 12; // total padding (top + bottom)
  const minWidth = options.minWidth ?? fontSize * 2;
  const maxWidth = options.maxWidth ?? Infinity;
  const lineHeightMultiplier = options.lineHeightMultiplier ?? 1.2;

  // Approximate character width (works well for sans-serif fonts)
  const approxCharWidth = fontSize * 0.55;
  const rawTextWidth = text.length * approxCharWidth;
  const width = Math.min(
    Math.max(rawTextWidth + horizontalPadding, minWidth),
    maxWidth
  );

  const lineHeight = fontSize * lineHeightMultiplier;
  const height = lineHeight + verticalPadding;

  return {
    width,
    height,
  };
}

/**
 * Convert Y.Map to plain JavaScript object
 * Helper for reading shape properties
 */
function yjsMapToObject(ymap: Y.Map<any>): Record<string, any> {
  const obj: Record<string, any> = {};
  ymap.forEach((value, key) => {
    obj[key] = value;
  });
  return obj;
}

// ==================== Command Executors ====================

/**
 * Execute createShape command
 * 
 * Creates a new shape on the canvas and adds it to the Yjs document
 * 
 * IMPORTANT: Shapes must be stored as Y.Map objects, not plain objects!
 * The frontend expects Y.Map and will convert them using yjsMapToObject()
 * 
 * @param command.zIndex - Optional explicit zIndex. If not provided, uses Date.now()
 */
function executeCreateShape(ydoc: Y.Doc, command: any): ExecutionResult {
  try {
    const shapes = ydoc.getMap('shapes');
    const shapeId = command.id || generateShapeId();
    const defaults = getDefaultDimensions(command.shapeType);

    // Build shape object based on type
    const shapeData: any = {
      id: shapeId,
      type: command.shapeType,
      x: command.x || 0,
      y: command.y || 0,
      color: command.color || '#000000',
      zIndex: command.zIndex !== undefined ? command.zIndex : Date.now(), // Use explicit zIndex if provided, otherwise Date.now()
    };

    // Add type-specific properties
    if (command.shapeType === 'rect' || command.shapeType === 'circle') {
      shapeData.width = command.width || defaults.width;
      shapeData.height = command.height || defaults.height;
    } else if (command.shapeType === 'line') {
      shapeData.x2 = command.x2 || (command.x + 100);
      shapeData.y2 = command.y2 || (command.y + 100);
      shapeData.strokeWidth = command.strokeWidth || 2;
    } else if (command.shapeType === 'text') {
      shapeData.text = command.text || 'Text';
      shapeData.fontSize = command.fontSize || 16;
      shapeData.width = command.width || defaults.width;
      shapeData.height = command.height || defaults.height;
    }

    if (command.rotation) {
      shapeData.rotation = command.rotation;
    }

    // Convert plain object to Y.Map (required for Yjs sync!)
    const yjsShape = new Y.Map();
    Object.entries(shapeData).forEach(([key, value]) => {
      yjsShape.set(key, value);
    });

    // Add shape to Yjs document
    shapes.set(shapeId, yjsShape);

    return {
      success: true,
      shapeIds: [shapeId],
      message: `Created ${command.shapeType} shape`,
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Failed to create shape: ${error.message}`,
    };
  }
}

/**
 * Execute moveShape command
 * 
 * Moves an existing shape to a new position
 */
function executeMoveShape(ydoc: Y.Doc, command: any): ExecutionResult {
  try {
    const shapes = ydoc.getMap('shapes');
    const shapeId = command.shapeId;

    if (!shapes.has(shapeId)) {
      return {
        success: false,
        error: `Shape ${shapeId} not found`,
      };
    }

    const yjsShape = shapes.get(shapeId) as Y.Map<any>;
    
    if (command.relative) {
      // Relative movement (offset from current position)
      const currentX = yjsShape.get('x') || 0;
      const currentY = yjsShape.get('y') || 0;
      yjsShape.set('x', currentX + command.x);
      yjsShape.set('y', currentY + command.y);
    } else {
      // Absolute movement
      yjsShape.set('x', command.x);
      yjsShape.set('y', command.y);
    }

    return {
      success: true,
      shapeIds: [shapeId],
      message: 'Moved shape',
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Failed to move shape: ${error.message}`,
    };
  }
}

/**
 * Execute resizeShape command
 */
function executeResizeShape(ydoc: Y.Doc, command: any): ExecutionResult {
  try {
    const shapes = ydoc.getMap('shapes');
    const shapeId = command.shapeId;

    if (!shapes.has(shapeId)) {
      return {
        success: false,
        error: `Shape ${shapeId} not found`,
      };
    }

    const yjsShape = shapes.get(shapeId) as Y.Map<any>;
    yjsShape.set('width', command.width);
    yjsShape.set('height', command.height);

    return {
      success: true,
      shapeIds: [shapeId],
      message: 'Resized shape',
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Failed to resize shape: ${error.message}`,
    };
  }
}

/**
 * Execute rotateShape command
 */
function executeRotateShape(ydoc: Y.Doc, command: any): ExecutionResult {
  try {
    const shapes = ydoc.getMap('shapes');
    const shapeId = command.shapeId;

    if (!shapes.has(shapeId)) {
      return {
        success: false,
        error: `Shape ${shapeId} not found`,
      };
    }

    const yjsShape = shapes.get(shapeId) as Y.Map<any>;
    
    if (command.relative) {
      const currentRotation = yjsShape.get('rotation') || 0;
      yjsShape.set('rotation', currentRotation + command.degrees);
    } else {
      yjsShape.set('rotation', command.degrees);
    }

    return {
      success: true,
      shapeIds: [shapeId],
      message: 'Rotated shape',
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Failed to rotate shape: ${error.message}`,
    };
  }
}

/**
 * Execute changeColor command
 */
function executeChangeColor(ydoc: Y.Doc, command: any): ExecutionResult {
  try {
    const shapes = ydoc.getMap('shapes');
    const shapeIds = command.shapeIds;
    const color = command.color;

    const updatedIds: string[] = [];

    for (const shapeId of shapeIds) {
      if (shapes.has(shapeId)) {
        const yjsShape = shapes.get(shapeId) as Y.Map<any>;
        yjsShape.set('color', color);
        updatedIds.push(shapeId);
      }
    }

    return {
      success: true,
      shapeIds: updatedIds,
      message: `Changed color of ${updatedIds.length} shape(s)`,
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Failed to change color: ${error.message}`,
    };
  }
}

/**
 * Execute deleteShape command
 */
function executeDeleteShape(ydoc: Y.Doc, command: any): ExecutionResult {
  try {
    const shapes = ydoc.getMap('shapes');
    const shapeIds = command.shapeIds;

    const deletedIds: string[] = [];

    for (const shapeId of shapeIds) {
      if (shapes.has(shapeId)) {
        shapes.delete(shapeId);
        deletedIds.push(shapeId);
      }
    }

    return {
      success: true,
      shapeIds: deletedIds,
      message: `Deleted ${deletedIds.length} shape(s)`,
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Failed to delete shapes: ${error.message}`,
    };
  }
}

/**
 * Execute arrangeShapes command
 */
function executeArrangeShapes(ydoc: Y.Doc, command: any): ExecutionResult {
  try {
    const shapes = ydoc.getMap('shapes');
    const shapeIds = command.shapeIds;
    const mode = command.mode;
    const spacing = command.spacing || 20;
    const cols = command.cols || 3;

    const arrangedIds: string[] = [];
    let currentX = 100;
    let currentY = 100;

    if (mode === 'horizontal') {
      shapeIds.forEach((shapeId: string) => {
        if (shapes.has(shapeId)) {
          const yjsShape = shapes.get(shapeId) as Y.Map<any>;
          yjsShape.set('x', currentX);
          yjsShape.set('y', currentY);
          
          const width = yjsShape.get('width') || 100;
          currentX += width + spacing;
          arrangedIds.push(shapeId);
        }
      });
    } else if (mode === 'vertical') {
      shapeIds.forEach((shapeId: string) => {
        if (shapes.has(shapeId)) {
          const yjsShape = shapes.get(shapeId) as Y.Map<any>;
          yjsShape.set('x', currentX);
          yjsShape.set('y', currentY);
          
          const height = yjsShape.get('height') || 100;
          currentY += height + spacing;
          arrangedIds.push(shapeId);
        }
      });
    } else if (mode === 'grid') {
      let col = 0;
      let row = 0;

      shapeIds.forEach((shapeId: string) => {
        if (shapes.has(shapeId)) {
          const yjsShape = shapes.get(shapeId) as Y.Map<any>;
          const width = yjsShape.get('width') || 100;
          const height = yjsShape.get('height') || 100;
          
          yjsShape.set('x', currentX + col * (width + spacing));
          yjsShape.set('y', currentY + row * (height + spacing));
          
          arrangedIds.push(shapeId);
          col++;
          if (col >= cols) {
            col = 0;
            row++;
          }
        }
      });
    }

    return {
      success: true,
      shapeIds: arrangedIds,
      message: `Arranged ${arrangedIds.length} shape(s) in ${mode} layout`,
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Failed to arrange shapes: ${error.message}`,
    };
  }
}

/**
 * Execute alignShapes command
 */
function executeAlignShapes(ydoc: Y.Doc, command: any): ExecutionResult {
  try {
    const shapes = ydoc.getMap('shapes');
    const shapeIds = command.shapeIds;
    const alignment = command.alignment;

    const alignedIds: string[] = [];
    
    // Get all shapes and find bounds
    const shapeData: Array<{ id: string; ymap: Y.Map<any>; x: number; y: number; width: number; height: number }> = [];
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

    shapeIds.forEach((shapeId: string) => {
      if (shapes.has(shapeId)) {
        const yjsShape = shapes.get(shapeId) as Y.Map<any>;
        const x = yjsShape.get('x') || 0;
        const y = yjsShape.get('y') || 0;
        const width = yjsShape.get('width') || 0;
        const height = yjsShape.get('height') || 0;
        
        shapeData.push({ id: shapeId, ymap: yjsShape, x, y, width, height });

        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x + width);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y + height);
      }
    });

    // Apply alignment
    shapeData.forEach(({ id, ymap, width, height }) => {
      if (alignment === 'left') {
        ymap.set('x', minX);
      } else if (alignment === 'right') {
        ymap.set('x', maxX - width);
      } else if (alignment === 'top') {
        ymap.set('y', minY);
      } else if (alignment === 'bottom') {
        ymap.set('y', maxY - height);
      } else if (alignment === 'center-horizontal') {
        const centerX = (minX + maxX) / 2;
        ymap.set('x', centerX - width / 2);
      } else if (alignment === 'center-vertical') {
        const centerY = (minY + maxY) / 2;
        ymap.set('y', centerY - height / 2);
      }

      alignedIds.push(id);
    });

    return {
      success: true,
      shapeIds: alignedIds,
      message: `Aligned ${alignedIds.length} shape(s) to ${alignment}`,
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Failed to align shapes: ${error.message}`,
    };
  }
}

/**
 * Execute duplicateShape command
 */
function executeDuplicateShape(ydoc: Y.Doc, command: any): ExecutionResult {
  try {
    const shapes = ydoc.getMap('shapes');
    const shapeIds = command.shapeIds;
    const offsetX = command.offsetX || 20;
    const offsetY = command.offsetY || 20;

    const duplicatedIds: string[] = [];

    shapeIds.forEach((shapeId: string) => {
      if (shapes.has(shapeId)) {
        const originalYjsShape = shapes.get(shapeId) as Y.Map<any>;
        const newShapeId = generateShapeId();
        
        // Clone the Y.Map
        const newYjsShape = new Y.Map();
        originalYjsShape.forEach((value, key) => {
          newYjsShape.set(key, value);
        });
        
        // Update ID and offset position
        newYjsShape.set('id', newShapeId);
        newYjsShape.set('x', (originalYjsShape.get('x') || 0) + offsetX);
        newYjsShape.set('y', (originalYjsShape.get('y') || 0) + offsetY);

        // For lines, also offset x2, y2
        if (originalYjsShape.get('type') === 'line') {
          newYjsShape.set('x2', (originalYjsShape.get('x2') || 0) + offsetX);
          newYjsShape.set('y2', (originalYjsShape.get('y2') || 0) + offsetY);
        }

        shapes.set(newShapeId, newYjsShape);
        duplicatedIds.push(newShapeId);
      }
    });

    return {
      success: true,
      shapeIds: duplicatedIds,
      message: `Duplicated ${duplicatedIds.length} shape(s)`,
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Failed to duplicate shapes: ${error.message}`,
    };
  }
}

/**
 * Execute createGroup command (complex)
 * 
 * WHY: Creates professionally-styled UI components with modern design patterns.
 * These components follow current design trends with proper spacing, colors, and hierarchy.
 * 
 * WHAT: Creates polished UI patterns:
 * - Button: Modern button with proper padding and visual hierarchy
 * - Card: Professional card with border, shadow effect simulation, and structured content
 * - Form: Complete form with labels, input fields, and submit button
 * - Navbar: Full navigation bar with background and properly spaced items
 * 
 * LAYERING SYSTEM:
 * - Uses explicit zIndex values to ensure proper stacking order
 * - Base zIndex is current timestamp
 * - Each shape in a group gets baseZ + offset (0, 10, 20, 30, etc.)
 * - This ensures: shadows behind → backgrounds → borders → content → text on top
 */
function executeCreateGroup(ydoc: Y.Doc, command: any): ExecutionResult {
  try {
    const groupType = command.groupType;
    const x = command.x || 100;
    const y = command.y || 100;
    const createdIds: string[] = [];
    
    // Base zIndex for this group - all shapes in the group will use this as starting point
    const baseZ = Date.now();

    const options = command.options || {};

    if (groupType === 'button') {
      // ============ MODERN BUTTON ============
      // Creates a professional-looking button with:
      // - Rounded appearance (simulated with proper dimensions)
      // - Primary color scheme (indigo/purple)
      // - Proper text centering and padding
      // - Visual depth with shadow layer
      //
      // LAYER ORDER (zIndex):
      // baseZ + 0  = Shadow (bottom)
      // baseZ + 10 = Button background (middle)
      // baseZ + 20 = Button text (top)

      const buttonLabel: string = options.label || options.text || command.label || 'Primary Action';
      const hasIcon = Boolean(options.icon && (options.icon.symbol || options.icon.text));
      const iconSide: 'left' | 'right' = options.icon?.position === 'right' ? 'right' : 'left';
      const fontSize = 16;
      const paddingX = 32;
      const paddingY = 14;
      const textBox = calculateTextBox(buttonLabel, fontSize, {
        horizontalPadding: paddingX + (hasIcon ? 32 : 0),
        verticalPadding: paddingY,
        minWidth: 120,
        lineHeightMultiplier: 1.25,
      });
      const buttonWidth = Math.max(120, Math.round(textBox.width));
      const buttonHeight = 48;

      // Clamp width for extremely long labels so it doesn't get ridiculous
      const maxButtonWidth = options.maxWidth || 240;
      const finalButtonWidth = Math.min(buttonWidth, maxButtonWidth);

      // Shadow offset for depth
      const shadowOffset = 4;
      const shadowColor = options.shadowColor || '#1F2937';

      // Shadow layer (creates depth effect) - BOTTOM LAYER
      const shadowResult = executeCreateShape(ydoc, {
        shapeType: 'rect',
        x: x + shadowOffset,
        y: y + shadowOffset,
        width: finalButtonWidth,
        height: buttonHeight,
        color: shadowColor,
        zIndex: baseZ + 0, // Explicit zIndex for shadow (bottom)
      });
      
      // Main button background - MIDDLE LAYER
      const bgResult = executeCreateShape(ydoc, {
        shapeType: 'rect',
        x,
        y,
        width: finalButtonWidth,
        height: buttonHeight,
        color: options.backgroundColor || '#4F46E5',
        zIndex: baseZ + 10, // Explicit zIndex for background (middle)
      });
      
      // Button text (centered with proper padding) - TOP LAYER
      const textResult = executeCreateShape(ydoc, {
        shapeType: 'text',
        x,
        y,
        text: buttonLabel,
        fontSize,
        color: options.textColor || '#FFFFFF',
        width: finalButtonWidth,
        height: buttonHeight,
        fontWeight: options.fontWeight || 600,
        textAlign: 'center',
        verticalAlign: 'center',
        paddingX: hasIcon ? paddingX : paddingX / 2,
        paddingY: paddingY / 2,
        showBoundingBox: false,
        zIndex: baseZ + 20, // Explicit zIndex for text (top)
      });

      if (hasIcon && iconSide === 'left') {
        const iconSize = 20;
        const iconX = x + paddingX / 2 - iconSize;
        const iconY = y + (buttonHeight - iconSize) / 2;

        const iconText = executeCreateShape(ydoc, {
          shapeType: 'text',
          x: iconX,
          y: iconY,
          width: iconSize,
          height: iconSize,
          text: options.icon?.symbol || '↗',
          fontSize: iconSize * 0.7,
          color: options.icon?.color || '#FFFFFF',
          textAlign: 'center',
          verticalAlign: 'center',
          showBoundingBox: false,
          zIndex: baseZ + 40,
        });

        if (iconText.shapeIds) createdIds.push(...iconText.shapeIds);
      }

      if (hasIcon && iconSide === 'right') {
        const badgeWidth = options.icon?.width || 68;
        const badgeHeight = options.icon?.height || 28;
        const badgeX = x + finalButtonWidth - paddingX / 2 - badgeWidth;
        const badgeY = y + (buttonHeight - badgeHeight) / 2;

        const badgeBackground = executeCreateShape(ydoc, {
          shapeType: 'rect',
          x: badgeX,
          y: badgeY,
          width: badgeWidth,
          height: badgeHeight,
          color: options.icon?.badgeColor || '#FACC15',
          zIndex: baseZ + 30,
        });

        const badgeText = executeCreateShape(ydoc, {
          shapeType: 'text',
          x: badgeX,
          y: badgeY,
          width: badgeWidth,
          height: badgeHeight,
          text: options.icon?.text || 'Hire Me',
          fontSize: 13,
          fontWeight: 600,
          color: options.icon?.badgeTextColor || '#0F172A',
          textAlign: 'center',
          verticalAlign: 'center',
          showBoundingBox: false,
          zIndex: baseZ + 40,
        });

        if (badgeBackground.shapeIds) createdIds.push(...badgeBackground.shapeIds);
        if (badgeText.shapeIds) createdIds.push(...badgeText.shapeIds);
      }

      if (shadowResult.shapeIds) createdIds.push(...shadowResult.shapeIds);
      if (bgResult.shapeIds) createdIds.push(...bgResult.shapeIds);
      if (textResult.shapeIds) createdIds.push(...textResult.shapeIds);

    } else if (groupType === 'card') {
      // ============ PROFESSIONAL CARD ============
      // Creates a modern card component with:
      // - White background with border
      // - Shadow for depth
      // - Structured content (title, description, action area)
      // - Proper spacing and hierarchy
      //
      // LAYER ORDER (zIndex):
      // baseZ + 0  = Shadow (bottom)
      // baseZ + 5  = Border
      // baseZ + 10 = White background
      // baseZ + 20 = Divider line
      // baseZ + 30 = Title text
      // baseZ + 35 = Description text
      // baseZ + 40 = Action button background
      // baseZ + 50 = Action button text (top)
      
      // Shadow layer for depth - BOTTOM
      const shadowResult = executeCreateShape(ydoc, {
        shapeType: 'rect',
        x: x + 3,
        y: y + 3,
        width: 328,
        height: 248,
        color: '#E2E8F0', // Extra light shadow
        zIndex: baseZ + 0,
      });
      
      // Border layer (simulates border)
      const borderResult = executeCreateShape(ydoc, {
        shapeType: 'rect',
        x: x,
        y: y,
        width: 320,
        height: 240,
        color: '#E2E8F0', // Light gray border
        zIndex: baseZ + 5,
      });
      
      // Main white background
      const bgResult = executeCreateShape(ydoc, {
        shapeType: 'rect',
        x,
        y,
        width: 320,
        height: 240,
        color: '#FFFFFF',
        zIndex: baseZ + 10,
      });

      // Divider line
      const dividerResult = executeCreateShape(ydoc, {
        shapeType: 'line',
        x: x + 24,
        y: y + 160,
        x2: x + 296,
        y2: y + 160,
        color: '#E2E8F0',
        strokeWidth: 1,
        zIndex: baseZ + 20,
      });

      // Card title (bold, large)
      const titleResult = executeCreateShape(ydoc, {
        shapeType: 'text',
        x: x + 24,
        y: y + 24,
        text: 'Card Title',
        fontSize: 22,
        color: '#0F172A', // Very dark gray/black
        zIndex: baseZ + 30,
      });
      
      // Card description
      const descResult = executeCreateShape(ydoc, {
        shapeType: 'text',
        x: x + 24,
        y: y + 60,
        text: 'This is a description that lives inside the card.',
        fontSize: 14,
        color: '#64748B', // Medium gray
        width: 272,
        height: 48,
        zIndex: baseZ + 35,
      });
      
      // Action button in card
      const actionBgResult = executeCreateShape(ydoc, {
        shapeType: 'rect',
        x: x + 24,
        y: y + 182,
        width: 100,
        height: 38,
        color: '#3B82F6', // Blue
        zIndex: baseZ + 40,
      });
      
      const actionTextResult = executeCreateShape(ydoc, {
        shapeType: 'text',
        x: x + 46,
        y: y + 194,
        text: 'Learn More',
        fontSize: 14,
        color: '#FFFFFF',
        zIndex: baseZ + 50,
      });

      if (shadowResult.shapeIds) createdIds.push(...shadowResult.shapeIds);
      if (borderResult.shapeIds) createdIds.push(...borderResult.shapeIds);
      if (bgResult.shapeIds) createdIds.push(...bgResult.shapeIds);
      if (dividerResult.shapeIds) createdIds.push(...dividerResult.shapeIds);
      if (titleResult.shapeIds) createdIds.push(...titleResult.shapeIds);
      if (descResult.shapeIds) createdIds.push(...descResult.shapeIds);
      if (actionBgResult.shapeIds) createdIds.push(...actionBgResult.shapeIds);
      if (actionTextResult.shapeIds) createdIds.push(...actionTextResult.shapeIds);

    } else if (groupType === 'form') {
      // ============ LOGIN FORM ============
      // Creates a complete, professional login form with:
      // - Form container with border
      // - Two input fields (Username, Password)
      // - Modern input styling with borders
      // - Professional submit button
      // - Proper spacing and alignment
      //
      // LAYER ORDER (zIndex):
      // baseZ + 0   = Form container (bottom)
      // baseZ + 10  = Form title
      // baseZ + 20  = Field borders
      // baseZ + 30  = Field backgrounds
      // baseZ + 40  = Field labels and placeholders
      // baseZ + 100 = Button shadow
      // baseZ + 110 = Button background
      // baseZ + 120 = Button text (top)
      
      // Form container background - BOTTOM
      const containerResult = executeCreateShape(ydoc, {
        shapeType: 'rect',
        x: x - 10,
        y: y - 10,
        width: 340,
        height: 320,
        color: '#F8FAFC', // Very light gray background
        zIndex: baseZ + 0,
      });
      
      // Form title
      const titleResult = executeCreateShape(ydoc, {
        shapeType: 'text',
        x: x + 80,
        y: y + 10,
        text: 'Login Form',
        fontSize: 24,
        color: '#0F172A',
        zIndex: baseZ + 10,
      });

      const fields = [
        { label: 'Username', placeholder: 'Enter username' },
        { label: 'Password', placeholder: '••••••••' }
      ];
      let currentY = y + 60;

      fields.forEach((field, index) => {
        // Input field border (darker to simulate border)
        const borderResult = executeCreateShape(ydoc, {
          shapeType: 'rect',
          x: x - 1,
          y: currentY + 24,
          width: 302,
          height: 42,
          color: '#CBD5E1', // Border color
          zIndex: baseZ + 20,
        });
        
        // Input field background
        const inputResult = executeCreateShape(ydoc, {
          shapeType: 'rect',
          x,
          y: currentY + 25,
          width: 300,
          height: 40,
          color: '#FFFFFF', // White background
          zIndex: baseZ + 30,
        });
        
        // Field label
        const labelResult = executeCreateShape(ydoc, {
          shapeType: 'text',
          x: x,
          y: currentY,
          text: field.label,
          fontSize: 14,
          color: '#334155', // Dark gray
          zIndex: baseZ + 40,
        });
        
        // Placeholder text
        const placeholderResult = executeCreateShape(ydoc, {
          shapeType: 'text',
          x: x + 12,
          y: currentY + 37,
          text: field.placeholder,
          fontSize: 14,
          color: '#94A3B8', // Light gray for placeholder
          zIndex: baseZ + 40,
        });

        if (borderResult.shapeIds) createdIds.push(...borderResult.shapeIds);
        if (inputResult.shapeIds) createdIds.push(...inputResult.shapeIds);
        if (labelResult.shapeIds) createdIds.push(...labelResult.shapeIds);
        if (placeholderResult.shapeIds) createdIds.push(...placeholderResult.shapeIds);

        currentY += 90;
      });

      // Submit button shadow
      const btnShadowResult = executeCreateShape(ydoc, {
        shapeType: 'rect',
        x: x + 2,
        y: currentY + 12,
        width: 300,
        height: 46,
        color: '#0F766E', // Darker teal for shadow
        zIndex: baseZ + 100,
      });
      
      // Submit button background
      const buttonResult = executeCreateShape(ydoc, {
        shapeType: 'rect',
        x,
        y: currentY + 10,
        width: 300,
        height: 46,
        color: '#14B8A6', // Teal/cyan color
        zIndex: baseZ + 110,
      });

      // Submit button text (centered)
      const buttonTextResult = executeCreateShape(ydoc, {
        shapeType: 'text',
        x: x + 110,
        y: currentY + 24,
        text: 'Login',
        fontSize: 16,
        color: '#FFFFFF',
        zIndex: baseZ + 120,
      });

      if (containerResult.shapeIds) createdIds.push(...containerResult.shapeIds);
      if (titleResult.shapeIds) createdIds.push(...titleResult.shapeIds);
      if (btnShadowResult.shapeIds) createdIds.push(...btnShadowResult.shapeIds);
      if (buttonResult.shapeIds) createdIds.push(...buttonResult.shapeIds);
      if (buttonTextResult.shapeIds) createdIds.push(...buttonTextResult.shapeIds);

    } else if (groupType === 'navbar') {
      // ============ MODERN NAVBAR ============
      // Creates a professional navigation bar with:
      // - Full-width background bar
      // - Logo/brand text
      // - Multiple navigation items
      // - Visual separation
      // - Modern color scheme
      //
      // LAYER ORDER (zIndex):
      // baseZ + 0  = Navbar background (bottom)
      // baseZ + 10 = Separator line
      // baseZ + 20 = Active indicators
      // baseZ + 30 = Logo and nav text
      // baseZ + 40 = Action button background
      // baseZ + 50 = Action button text (top)
      
      // Navbar background bar - BOTTOM
      const bgResult = executeCreateShape(ydoc, {
        shapeType: 'rect',
        x: x - 20,
        y: y - 10,
        width: 800,
        height: 60,
        color: '#1E293B', // Dark slate background
        zIndex: baseZ + 0,
      });
      
      // Separator line after logo
      const separatorResult = executeCreateShape(ydoc, {
        shapeType: 'line',
        x: x + 90,
        y: y - 5,
        x2: x + 90,
        y2: y + 45,
        color: '#475569',
        strokeWidth: 2,
        zIndex: baseZ + 10,
      });

      // Navigation items
      const items = [
        { text: 'Home', active: true },
        { text: 'Products', active: false },
        { text: 'About', active: false },
        { text: 'Contact', active: false }
      ];
      let currentX = x + 130;

      items.forEach((item) => {
        // Active indicator (only for active item)
        if (item.active) {
          const activeIndicatorResult = executeCreateShape(ydoc, {
            shapeType: 'rect',
            x: currentX - 5,
            y: y - 8,
            width: 70,
            height: 4,
            color: '#3B82F6', // Blue indicator
            zIndex: baseZ + 20,
          });
          if (activeIndicatorResult.shapeIds) createdIds.push(...activeIndicatorResult.shapeIds);
        }
        
        // Navigation text
        const textResult = executeCreateShape(ydoc, {
          shapeType: 'text',
          x: currentX,
          y: y + 10,
          text: item.text,
          fontSize: 15,
          color: item.active ? '#FFFFFF' : '#94A3B8', // White for active, gray for inactive
          zIndex: baseZ + 30,
        });

        if (textResult.shapeIds) createdIds.push(...textResult.shapeIds);
        currentX += 120;
      });
      
      // Brand/Logo text
      const logoResult = executeCreateShape(ydoc, {
        shapeType: 'text',
        x: x,
        y: y + 10,
        text: 'Brand',
        fontSize: 20,
        color: '#FFFFFF',
        zIndex: baseZ + 30,
      });
      
      // Action button (e.g., "Sign In")
      const actionBtnBg = executeCreateShape(ydoc, {
        shapeType: 'rect',
        x: x + 640,
        y: y,
        width: 90,
        height: 36,
        color: '#3B82F6', // Blue
        zIndex: baseZ + 40,
      });
      
      const actionBtnText = executeCreateShape(ydoc, {
        shapeType: 'text',
        x: x + 660,
        y: y + 11,
        text: 'Sign In',
        fontSize: 14,
        color: '#FFFFFF',
        zIndex: baseZ + 50,
      });

      if (bgResult.shapeIds) createdIds.push(...bgResult.shapeIds);
      if (separatorResult.shapeIds) createdIds.push(...separatorResult.shapeIds);
      if (logoResult.shapeIds) createdIds.push(...logoResult.shapeIds);
      if (actionBtnBg.shapeIds) createdIds.push(...actionBtnBg.shapeIds);
      if (actionBtnText.shapeIds) createdIds.push(...actionBtnText.shapeIds);
    }

    return {
      success: true,
      shapeIds: createdIds,
      message: `Created ${groupType} group with ${createdIds.length} elements`,
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Failed to create group: ${error.message}`,
    };
  }
}

// ==================== Main Executor Function ====================

/**
 * Execute an AI command on a Yjs document
 * 
 * WHY: Central dispatcher for all AI operations.
 * Routes commands to the appropriate executor function.
 * 
 * @param ydoc - The Yjs document representing the canvas
 * @param command - The AI command to execute
 * @returns Execution result with success status and affected shape IDs
 */
export function executeAICommand(ydoc: Y.Doc, command: AICommand): ExecutionResult {
  try {
    switch (command.type) {
      case 'createShape':
        return executeCreateShape(ydoc, command);
      
      case 'moveShape':
        return executeMoveShape(ydoc, command);
      
      case 'resizeShape':
        return executeResizeShape(ydoc, command);
      
      case 'rotateShape':
        return executeRotateShape(ydoc, command);
      
      case 'changeColor':
        return executeChangeColor(ydoc, command);
      
      case 'deleteShape':
        return executeDeleteShape(ydoc, command);
      
      case 'arrangeShapes':
        return executeArrangeShapes(ydoc, command);
      
      case 'alignShapes':
        return executeAlignShapes(ydoc, command);
      
      case 'duplicateShape':
        return executeDuplicateShape(ydoc, command);
      
      case 'createGroup':
        return executeCreateGroup(ydoc, command);
      
      default:
        return {
          success: false,
          error: `Unknown command type: ${command.type}`,
        };
    }
  } catch (error: any) {
    return {
      success: false,
      error: `Failed to execute command: ${error.message}`,
    };
  }
}

/**
 * Execute multiple AI commands in sequence
 * 
 * WHY: AI might return multiple commands for complex operations.
 * This executes them in order and returns combined results.
 */
export function executeAICommands(ydoc: Y.Doc, commands: AICommand[]): ExecutionResult[] {
  return commands.map(command => executeAICommand(ydoc, command));
}

