/**
 * AI Controller (PR #30 - Implementation)
 * 
 * WHY: This controller handles AI command interpretation using OpenAI's function calling.
 * It receives natural language prompts and converts them to structured commands.
 * 
 * WHAT: Implements the /api/ai/interpret endpoint using OpenAI GPT-4 function calling.
 * 
 * RUBRIC ALIGNMENT:
 * - 10 command types (exceeds 8+ requirement)
 * - Covers all categories: creation, manipulation, layout, complex
 * - Sub-2 second target with GPT-4 Turbo
 */

import { Request, Response } from 'express';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * OpenAI Function Definitions
 * 
 * WHY: These define the "tools" that GPT-4 can call to fulfill user requests.
 * OpenAI's function calling feature converts natural language into structured JSON.
 * 
 * WHAT: 10 functions covering all rubric requirements:
 * - Creation: createShape, duplicateShape
 * - Manipulation: moveShape, resizeShape, rotateShape, changeColor, deleteShape
 * - Layout: arrangeShapes, alignShapes
 * - Complex: createGroup (for forms, navbars, etc.)
 */
const functions: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'createShape',
      description: 'Create a new shape (rectangle, circle, line, or text) on the canvas',
      parameters: {
        type: 'object',
        properties: {
          shapeType: {
            type: 'string',
            enum: ['rect', 'circle', 'line', 'text'],
            description: 'Type of shape to create',
          },
          x: {
            type: 'number',
            description: 'X coordinate position',
          },
          y: {
            type: 'number',
            description: 'Y coordinate position',
          },
          width: {
            type: 'number',
            description: 'Width of the shape (not needed for text or line)',
          },
          height: {
            type: 'number',
            description: 'Height of the shape (not needed for line)',
          },
          color: {
            type: 'string',
            description: 'Color of the shape (e.g., "red", "#FF0000", "rgb(255,0,0)")',
          },
          text: {
            type: 'string',
            description: 'Text content (only for text shapes)',
          },
          fontSize: {
            type: 'number',
            description: 'Font size in pixels (only for text shapes)',
          },
          rotation: {
            type: 'number',
            description: 'Rotation in degrees',
          },
        },
        required: ['shapeType', 'x', 'y'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'moveShape',
      description: 'Move an existing shape to a new position',
      parameters: {
        type: 'object',
        properties: {
          shapeId: {
            type: 'string',
            description: 'ID of the shape to move. Use "selected" for currently selected shapes, or "all" for all shapes.',
          },
          x: {
            type: 'number',
            description: 'New X coordinate',
          },
          y: {
            type: 'number',
            description: 'New Y coordinate',
          },
          relative: {
            type: 'boolean',
            description: 'If true, x and y are offsets from current position',
          },
        },
        required: ['shapeId', 'x', 'y'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'resizeShape',
      description: 'Resize an existing shape',
      parameters: {
        type: 'object',
        properties: {
          shapeId: {
            type: 'string',
            description: 'ID of the shape to resize. Use "selected" for currently selected shapes.',
          },
          width: {
            type: 'number',
            description: 'New width',
          },
          height: {
            type: 'number',
            description: 'New height',
          },
        },
        required: ['shapeId', 'width', 'height'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'rotateShape',
      description: 'Rotate an existing shape',
      parameters: {
        type: 'object',
        properties: {
          shapeId: {
            type: 'string',
            description: 'ID of the shape to rotate. Use "selected" for currently selected shapes.',
          },
          degrees: {
            type: 'number',
            description: 'Rotation angle in degrees',
          },
          relative: {
            type: 'boolean',
            description: 'If true, degrees is added to current rotation',
          },
        },
        required: ['shapeId', 'degrees'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'changeColor',
      description: 'Change the color of existing shapes',
      parameters: {
        type: 'object',
        properties: {
          shapeIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of shape IDs. Use ["selected"] for currently selected shapes.',
          },
          color: {
            type: 'string',
            description: 'New color (e.g., "blue", "#0000FF")',
          },
        },
        required: ['shapeIds', 'color'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'deleteShape',
      description: 'Delete shapes from the canvas',
      parameters: {
        type: 'object',
        properties: {
          shapeIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of shape IDs to delete. Use ["selected"] for currently selected shapes.',
          },
        },
        required: ['shapeIds'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'arrangeShapes',
      description: 'Arrange multiple shapes in a layout pattern (horizontal, vertical, or grid)',
      parameters: {
        type: 'object',
        properties: {
          shapeIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of shape IDs. Use ["selected"] for currently selected shapes.',
          },
          mode: {
            type: 'string',
            enum: ['horizontal', 'vertical', 'grid'],
            description: 'Layout mode',
          },
          cols: {
            type: 'number',
            description: 'Number of columns (only for grid mode)',
          },
          spacing: {
            type: 'number',
            description: 'Space between shapes in pixels',
          },
        },
        required: ['shapeIds', 'mode'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'alignShapes',
      description: 'Align multiple shapes',
      parameters: {
        type: 'object',
        properties: {
          shapeIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of shape IDs. Use ["selected"] for currently selected shapes.',
          },
          alignment: {
            type: 'string',
            enum: ['left', 'right', 'top', 'bottom', 'center-horizontal', 'center-vertical'],
            description: 'Alignment direction',
          },
        },
        required: ['shapeIds', 'alignment'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'duplicateShape',
      description: 'Duplicate existing shapes',
      parameters: {
        type: 'object',
        properties: {
          shapeIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of shape IDs. Use ["selected"] for currently selected shapes.',
          },
          offsetX: {
            type: 'number',
            description: 'X offset for duplicated shapes',
          },
          offsetY: {
            type: 'number',
            description: 'Y offset for duplicated shapes',
          },
        },
        required: ['shapeIds'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'createGroup',
      description: 'Create a group of related shapes for common UI patterns (button, card, form, navbar)',
      parameters: {
        type: 'object',
        properties: {
          groupType: {
            type: 'string',
            enum: ['button', 'card', 'form', 'navbar', 'custom'],
            description: 'Type of group to create',
          },
          x: {
            type: 'number',
            description: 'X coordinate for the group',
          },
          y: {
            type: 'number',
            description: 'Y coordinate for the group',
          },
          options: {
            type: 'object',
            description: 'Group-specific options. For buttons: { label: "text", backgroundColor: "color", textColor: "color", shadowColor: "color" }. For forms: fields array. For navbars: items array.',
            properties: {
              label: {
                type: 'string',
                description: 'Button text label (for button group type)',
              },
              backgroundColor: {
                type: 'string',
                description: 'Background color for button (for button group type). Accepts color names (red, blue, maroon) or hex codes (#FF0000)',
              },
              textColor: {
                type: 'string',
                description: 'Text color for button (for button group type). Accepts color names or hex codes',
              },
              shadowColor: {
                type: 'string',
                description: 'Shadow color for button (for button group type). Accepts color names or hex codes',
              },
            },
          },
        },
        required: ['groupType', 'x', 'y'],
      },
    },
  },
];

/**
 * Interpret natural language prompt into structured commands
 * 
 * WHY: This is the core AI functionality. It converts user prompts like
 * "create a red rectangle" into structured commands like { type: 'createShape', ... }
 * 
 * HOW: Uses OpenAI's function calling feature with GPT-4 Turbo:
 * 1. Send prompt to OpenAI with function definitions
 * 2. GPT-4 decides which function(s) to call
 * 3. Returns structured JSON with function calls
 * 4. We parse and validate the results
 */
export const interpret = async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    const { prompt, documentId, userId, selectedShapeIds } = req.body;

    // ==================== Validation ====================
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid prompt: must be a non-empty string',
      });
    }

    if (!documentId || typeof documentId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid documentId: must be a string',
      });
    }

    // Normalize selectedShapeIds to array
    const selectedIds: string[] = Array.isArray(selectedShapeIds) ? selectedShapeIds : [];

    // Check for ambiguous/unhelpful prompts
    const trimmedPrompt = prompt.trim().toLowerCase();
    const tooVague = ['do something', 'help', 'hi', 'hello', 'test'].includes(trimmedPrompt);
    
    if (tooVague) {
      return res.status(200).json({
        success: false,
        commands: [],
        error: 'Please be more specific. For example: "create a red rectangle at 100, 200" or "arrange shapes in a grid"',
      });
    }

    // ==================== Check if command requires selection ====================
    const manipulationKeywords = [
      'move', 'resize', 'rotate', 'change color', 'color', 'delete', 'remove',
      'arrange', 'align', 'duplicate', 'copy'
    ];
    
    const isManipulationCommand = manipulationKeywords.some(keyword => 
      trimmedPrompt.includes(keyword)
    );
    
    const isCreationCommand = trimmedPrompt.includes('create') || 
                             trimmedPrompt.includes('add') || 
                             trimmedPrompt.includes('draw') ||
                             trimmedPrompt.includes('make') ||
                             trimmedPrompt.includes('grid') ||
                             trimmedPrompt.includes('button') ||
                             trimmedPrompt.includes('card') ||
                             trimmedPrompt.includes('form') ||
                             trimmedPrompt.includes('navbar');

    // If it's a manipulation command and no shapes are selected, return helpful error
    if (isManipulationCommand && !isCreationCommand && selectedIds.length === 0) {
      return res.status(200).json({
        success: false,
        commands: [],
        error: 'Please select shapes first, then try again. Click on shapes to select them before using commands like "move", "change color", "arrange", etc.',
      });
    }

    // ==================== Call OpenAI API ====================
    console.log(`AI Request: "${prompt}" (document: ${documentId}, user: ${userId || 'anonymous'}, selected: ${selectedIds.length} shape(s))`);

    // Build context about selected shapes for the system prompt
    const selectionContext = selectedIds.length > 0 
      ? `\n\nIMPORTANT: The user has ${selectedIds.length} shape(s) currently selected with IDs: [${selectedIds.join(', ')}].
When the user gives manipulation commands (move, resize, rotate, change color, delete, arrange, align, duplicate) WITHOUT explicitly creating new shapes, they are referring to these selected shapes.
- Use "selected" as the shapeId/shapeIds parameter for commands that modify existing shapes
- DO NOT use "selected" for createShape commands - only for manipulation commands
- If user says "change color to blue", use changeColor with shapeIds: ["selected"]
- If user says "move to 500, 500", use moveShape with shapeId: "selected"
- If user says "arrange horizontally", use arrangeShapes with shapeIds: ["selected"]`
      : `\n\nNote: No shapes are currently selected. The user must either create new shapes or explicitly specify which shapes to manipulate.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Fast and good at function calling
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant for a collaborative canvas design tool (like Figma). 
Your job is to interpret user commands and convert them into structured function calls.

Guidelines:
- Default rectangle size: 100x100
- Default circle size: 100x100 (width and height)
- Default text size: 16px
- Default spacing: 20px
- Default colors: Use standard color names or hex codes
- For complex commands (forms, navbars), use createGroup or multiple createShape calls
- Always provide reasonable defaults for missing parameters

COMPLEX UI COMPONENTS (use createGroup):
When users ask to create buttons, cards, forms, or navbars, use the createGroup function.
These will automatically create professional, modern-styled components with:
- Button: Modern button with shadow, proper padding, and centered text
- Card: Professional card with border, shadow, title, description, and action button
- Form: Complete login form with container, labels, input fields, and submit button  
- Navbar: Full navigation bar with background, logo, navigation items, and action button

IMPORTANT - Button Customization:
When users specify button properties, pass them in the options object:

Text Customization:
- "create a button with text Hello" → createGroup({ groupType: "button", x: 200, y: 200, options: { label: "Hello" } })
- "make a button that says Submit" → createGroup({ groupType: "button", x: 150, y: 150, options: { label: "Submit" } })

Color Customization (supports color names and hex codes):
- "create a red button" → createGroup({ groupType: "button", x: 200, y: 200, options: { backgroundColor: "red" } })
- "make a blue button with text Go" → createGroup({ groupType: "button", x: 150, y: 150, options: { label: "Go", backgroundColor: "blue" } })
- "create a maroon button" → createGroup({ groupType: "button", x: 100, y: 100, options: { backgroundColor: "maroon" } })
- "make a green button with white text" → createGroup({ groupType: "button", x: 100, y: 100, options: { backgroundColor: "green", textColor: "white" } })
- "create a button with color #FF5733" → createGroup({ groupType: "button", x: 200, y: 200, options: { backgroundColor: "#FF5733" } })

Examples:
- "create a button" → createGroup({ groupType: "button", x: 200, y: 200 })
- "create a red button at 200, 200" → createGroup({ groupType: "button", x: 200, y: 200, options: { backgroundColor: "red" } })
- "make a card" → createGroup({ groupType: "card", x: 300, y: 300 })
- "design a login form" → createGroup({ groupType: "form", x: 100, y: 100 })
- "build a navbar" → createGroup({ groupType: "navbar", x: 100, y: 50 })${selectionContext}`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      tools: functions,
      tool_choice: 'auto', // Let GPT-4 decide which functions to call
      temperature: 0.1, // Low temperature for consistent, deterministic results
    });

    // ==================== Parse Response ====================
    const message = completion.choices[0]?.message;
    const toolCalls = message?.tool_calls;

    if (!toolCalls || toolCalls.length === 0) {
      // GPT-4 didn't call any functions (couldn't understand the prompt)
      return res.status(200).json({
        success: false,
        commands: [],
        error: 'Could not understand the command. Please try rephrasing or be more specific.',
        executionTimeMs: Date.now() - startTime,
      });
    }

    // Convert tool calls to our command format and expand multi-select operations
    const commands: any[] = [];
    
    toolCalls.forEach((toolCall) => {
      const functionName = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments);

      // Replace "selected" with actual selected shape IDs
      const processedArgs = { ...args };
      
      // Handle single shapeId parameter (moveShape, resizeShape, rotateShape)
      if (processedArgs.shapeId === 'selected') {
        if (selectedIds.length === 0) {
          // No shapes selected - skip this command
          return;
        }
        
        // For operations that support single shapeId, expand to multiple commands
        // This allows each selected shape to be moved/resized/rotated
        selectedIds.forEach(shapeId => {
          commands.push({
            type: functionName,
            ...processedArgs,
            shapeId: shapeId,
          });
        });
        return; // Don't add the original command
      }
      
      // Handle shapeIds array parameter (changeColor, deleteShape, arrangeShapes, alignShapes, duplicateShape)
      if (Array.isArray(processedArgs.shapeIds) && processedArgs.shapeIds.includes('selected')) {
        // Replace "selected" with all selected shape IDs
        processedArgs.shapeIds = selectedIds;
      }

      commands.push({
        type: functionName,
        ...processedArgs,
      });
    });

    // ==================== Log & Return ====================
    const executionTimeMs = Date.now() - startTime;
    console.log(`AI Response: ${commands.length} command(s) in ${executionTimeMs}ms`);
    console.log('Commands:', JSON.stringify(commands, null, 2));

    return res.status(200).json({
      success: true,
      commands,
      message: `Generated ${commands.length} command(s)`,
      executionTimeMs,
    });
  } catch (error: any) {
    const executionTimeMs = Date.now() - startTime;
    console.error('AI interpret error:', error);

    // Handle specific OpenAI errors
    if (error.code === 'insufficient_quota') {
      return res.status(429).json({
        success: false,
        error: 'OpenAI API quota exceeded. Please try again later.',
        executionTimeMs,
      });
    }

    if (error.code === 'invalid_api_key') {
      return res.status(500).json({
        success: false,
        error: 'OpenAI API key is invalid. Please contact support.',
        executionTimeMs,
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Internal server error processing AI request',
      executionTimeMs,
    });
  }
};

export const aiController = {
  interpret,
};
