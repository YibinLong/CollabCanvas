/**
 * AI Canvas Controller (PR #32)
 * 
 * WHY: Integrates AI interpretation with canvas operations.
 * This is the bridge between AI commands and actual canvas modifications.
 * 
 * WHAT: Endpoint that:
 * 1. Receives prompt from frontend
 * 2. Uses OpenAI to parse prompt into commands  
 * 3. Executes commands on the Yjs document
 * 4. Changes automatically sync to all connected clients
 */

import { Request, Response } from 'express';
import { aiController } from './aiController';
import { executeAICommands } from '../services/aiCanvasOperations';
import { getYjsDocumentForRoom } from '../services/websocketServer';

/**
 * Execute AI command on canvas
 * 
 * This is the main endpoint the frontend UI will call.
 * It combines interpretation + execution in one request.
 * 
 * Flow:
 * 1. Frontend sends: { prompt: "create a red rectangle", documentId: "doc-123" }
 * 2. We use OpenAI to parse the prompt into commands
 * 3. We execute those commands on the Yjs document
 * 4. Yjs automatically broadcasts changes to all connected WebSocket clients
 * 5. All users see the changes in real-time!
 */
export const executeCommand = async (req: Request, res: Response) => {
  try {
    const { prompt, documentId, userId, selectedShapeIds } = req.body;

    // Validation
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

    // Step 1: Interpret the prompt using OpenAI
    const interpretRequest = { body: { prompt, documentId, userId, selectedShapeIds }, params: {} } as Request;
    const interpretResponse = {
      status: (code: number) => ({
        json: (data: any) => data,
      }),
      json: (data: any) => data,
    } as any;

    // Call the AI controller interpret function
    const interpretResult: any = await new Promise((resolve) => {
      const mockResponse = {
        status: (code: number) => ({
          json: (data: any) => {
            resolve({ status: code, data });
            return mockResponse;
          },
        }),
        json: (data: any) => {
          resolve({ status: 200, data });
          return mockResponse;
        },
      };

      aiController.interpret(interpretRequest, mockResponse as any);
    });

    if (!interpretResult.data.success || !interpretResult.data.commands) {
      return res.status(200).json({
        success: false,
        error: interpretResult.data.error || 'Failed to interpret prompt',
        executionTimeMs: interpretResult.data.executionTimeMs,
      });
    }

    const commands = interpretResult.data.commands;

    // Step 2: Get the Yjs document for this canvas
    const ydoc = getYjsDocumentForRoom(documentId);
    
    if (!ydoc) {
      return res.status(404).json({
        success: false,
        error: 'Document not found or not connected',
      });
    }

    // Step 3: Execute the commands on the Yjs document
    const executionResults = executeAICommands(ydoc, commands);

    // Collect all affected shape IDs
    const allShapeIds: string[] = [];
    const errors: string[] = [];

    executionResults.forEach((result, index) => {
      if (result.success && result.shapeIds) {
        allShapeIds.push(...result.shapeIds);
      } else if (!result.success && result.error) {
        errors.push(`Command ${index + 1}: ${result.error}`);
      }
    });

    // Log the operation
    console.log(`✓ AI Canvas Operation: "${prompt}"`);
    console.log(`  Document: ${documentId}`);
    console.log(`  Commands executed: ${commands.length}`);
    console.log(`  Shapes affected: ${allShapeIds.length}`);
    if (errors.length > 0) {
      console.log(`  Errors: ${errors.length}`);
    }

    // Step 4: Return success (Yjs automatically syncs to all clients via WebSocket)
    return res.status(200).json({
      success: true,
      commands: commands.length,
      shapeIds: allShapeIds,
      errors: errors.length > 0 ? errors : undefined,
      message: `Executed ${commands.length} command(s), affected ${allShapeIds.length} shape(s)`,
      interpretTimeMs: interpretResult.data.executionTimeMs,
    });

  } catch (error: any) {
    console.error('AI Canvas execute error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error executing AI command',
    });
  }
};

export const aiCanvasController = {
  executeCommand,
};

