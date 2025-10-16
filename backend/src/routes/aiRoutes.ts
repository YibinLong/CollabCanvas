/**
 * AI Routes
 * 
 * WHY: Defines the API endpoints for AI command interpretation.
 * 
 * WHAT: Routes for the AI assistant to interpret natural language commands.
 */

import { Router } from 'express';
import { aiController } from '../controllers/aiController';
import { aiCanvasController } from '../controllers/aiCanvasController';
import rateLimit from 'express-rate-limit';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

/**
 * Rate Limiter for AI Endpoint
 * 
 * WHY: AI calls are expensive (OpenAI API costs money) and can be slow.
 * We limit to 20 requests per minute per IP to prevent abuse.
 * 
 * WHAT: If user exceeds 20 requests in 60 seconds, they get a 429 error.
 */
const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute
  message: 'Too many AI requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * POST /api/ai/interpret
 * 
 * WHY: Converts natural language prompts into structured canvas commands.
 * 
 * WHAT: 
 * - Receives a prompt (e.g., "create a red rectangle")
 * - Uses OpenAI function calling to parse it
 * - Returns structured commands (e.g., { type: 'createShape', ... })
 * 
 * PROTECTED: Requires authentication (logged-in user)
 * RATE LIMITED: Max 20 requests per minute
 */
router.post('/interpret', aiRateLimiter, authenticateJWT, aiController.interpret);

/**
 * POST /api/ai/execute
 * 
 * WHY: Main endpoint for AI canvas operations.
 * Interprets prompt AND executes commands on the canvas in one request.
 * 
 * WHAT:
 * - Receives prompt and documentId
 * - Uses OpenAI to parse the prompt
 * - Executes commands on the Yjs document
 * - Changes automatically sync to all connected clients via WebSocket
 * 
 * PROTECTED: Requires authentication
 * RATE LIMITED: Max 20 requests per minute
 */
router.post('/execute', aiRateLimiter, authenticateJWT, aiCanvasController.executeCommand);

export default router;

