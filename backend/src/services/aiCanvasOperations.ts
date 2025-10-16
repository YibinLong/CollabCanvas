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
      return { width: 200, height: 50 };
    default:
      return { width: 100, height: 100 };
  }
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
      zIndex: Date.now(), // New shapes on top
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
 * Creates multiple related shapes for common UI patterns
 */
function executeCreateGroup(ydoc: Y.Doc, command: any): ExecutionResult {
  try {
    const groupType = command.groupType;
    const x = command.x || 100;
    const y = command.y || 100;
    const createdIds: string[] = [];

    if (groupType === 'button') {
      // Create a simple button (rectangle + text)
      const bgResult = executeCreateShape(ydoc, {
        shapeType: 'rect',
        x,
        y,
        width: 120,
        height: 40,
        color: '#4F46E5',
      });
      
      const textResult = executeCreateShape(ydoc, {
        shapeType: 'text',
        x: x + 10,
        y: y + 10,
        text: 'Button',
        fontSize: 16,
        color: '#FFFFFF',
      });

      if (bgResult.shapeIds) createdIds.push(...bgResult.shapeIds);
      if (textResult.shapeIds) createdIds.push(...textResult.shapeIds);

    } else if (groupType === 'card') {
      // Create a card (background + title + content area)
      const bgResult = executeCreateShape(ydoc, {
        shapeType: 'rect',
        x,
        y,
        width: 250,
        height: 150,
        color: '#FFFFFF',
      });

      const titleResult = executeCreateShape(ydoc, {
        shapeType: 'text',
        x: x + 20,
        y: y + 20,
        text: 'Card Title',
        fontSize: 18,
        color: '#000000',
      });

      if (bgResult.shapeIds) createdIds.push(...bgResult.shapeIds);
      if (titleResult.shapeIds) createdIds.push(...titleResult.shapeIds);

    } else if (groupType === 'form') {
      // Create a simple form layout
      const fields = ['Username', 'Password'];
      let currentY = y;

      fields.forEach((label, index) => {
        // Label
        const labelResult = executeCreateShape(ydoc, {
          shapeType: 'text',
          x: x,
          y: currentY,
          text: label,
          fontSize: 14,
          color: '#000000',
        });

        // Input field
        const inputResult = executeCreateShape(ydoc, {
          shapeType: 'rect',
          x,
          y: currentY + 25,
          width: 200,
          height: 30,
          color: '#F3F4F6',
        });

        if (labelResult.shapeIds) createdIds.push(...labelResult.shapeIds);
        if (inputResult.shapeIds) createdIds.push(...inputResult.shapeIds);

        currentY += 75;
      });

      // Submit button
      const buttonResult = executeCreateShape(ydoc, {
        shapeType: 'rect',
        x,
        y: currentY,
        width: 100,
        height: 35,
        color: '#10B981',
      });

      const buttonTextResult = executeCreateShape(ydoc, {
        shapeType: 'text',
        x: x + 20,
        y: currentY + 8,
        text: 'Submit',
        fontSize: 16,
        color: '#FFFFFF',
      });

      if (buttonResult.shapeIds) createdIds.push(...buttonResult.shapeIds);
      if (buttonTextResult.shapeIds) createdIds.push(...buttonTextResult.shapeIds);

    } else if (groupType === 'navbar') {
      // Create a navigation bar
      const items = ['Home', 'About', 'Services', 'Contact'];
      let currentX = x;

      items.forEach((item) => {
        const textResult = executeCreateShape(ydoc, {
          shapeType: 'text',
          x: currentX,
          y: y,
          text: item,
          fontSize: 16,
          color: '#000000',
        });

        if (textResult.shapeIds) createdIds.push(...textResult.shapeIds);
        currentX += 100;
      });
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

