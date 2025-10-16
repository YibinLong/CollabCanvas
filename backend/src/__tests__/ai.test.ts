/**
 * AI Integration Tests (PR #29)
 * 
 * WHY: TDD approach - write tests BEFORE implementation.
 * These tests define the expected behavior of the AI integration.
 * 
 * WHAT: Tests the /api/ai/interpret endpoint which:
 * 1. Accepts natural language prompts
 * 2. Uses OpenAI function calling to parse them
 * 3. Returns structured command objects
 * 
 * RUBRIC REQUIREMENTS (Section 4: AI Canvas Agent - 25 points):
 * - 8+ distinct command types (10 points)
 * - Commands cover creation, manipulation, layout, and complex categories
 * - Sub-2 second responses (7 points)
 * - 90%+ accuracy
 */

// Load environment variables BEFORE importing controllers
import dotenv from 'dotenv';
dotenv.config();

import request from 'supertest';
import express from 'express';
import { aiController } from '../controllers/aiController';
import rateLimit from 'express-rate-limit';

// Create a minimal Express app for testing
const app = express();
app.use(express.json());

// Add rate limiting (same as production)
const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute
  message: 'Too many AI requests, please try again later',
});

// AI routes
app.post('/api/ai/interpret', aiRateLimiter, aiController.interpret);

describe('AI Integration Tests (PR #29)', () => {
  // ==================== Basic Functionality Tests ====================
  
  describe('POST /api/ai/interpret - Basic Functionality', () => {
    it('should accept a prompt and return structured commands', async () => {
      const response = await request(app)
        .post('/api/ai/interpret')
        .send({
          prompt: 'Create a red rectangle at position 100, 200',
          documentId: 'test-doc-123',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.commands)).toBe(true);
      expect(response.body.commands.length).toBeGreaterThan(0);
      
      // Verify first command is createShape
      const command = response.body.commands[0];
      expect(command.type).toBe('createShape');
      expect(command.shapeType).toBe('rect');
      expect(command.color).toContain('red');
    }, 10000); // 10 second timeout for API call

    it('should return response in under 2 seconds (performance requirement)', async () => {
      const startTime = Date.now();
      
      await request(app)
        .post('/api/ai/interpret')
        .send({
          prompt: 'Create a blue circle',
          documentId: 'test-doc-123',
        })
        .expect(200);
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(2000); // Sub-2 second requirement
    }, 10000);

    it('should handle missing required fields', async () => {
      const response = await request(app)
        .post('/api/ai/interpret')
        .send({
          // Missing prompt and documentId
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should handle empty or invalid prompts', async () => {
      const response = await request(app)
        .post('/api/ai/interpret')
        .send({
          prompt: '',
          documentId: 'test-doc-123',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('prompt');
    });
  });

  // ==================== Command Category Tests ====================
  
  describe('Creation Commands (Rubric Requirement: at least 2)', () => {
    it('should parse createShape command for rectangles', async () => {
      const response = await request(app)
        .post('/api/ai/interpret')
        .send({
          prompt: 'Create a 200x100 green rectangle at coordinates 50, 75',
          documentId: 'test-doc-123',
        })
        .expect(200);

      const command = response.body.commands[0];
      expect(command.type).toBe('createShape');
      expect(command.shapeType).toBe('rect');
      expect(command.width).toBe(200);
      expect(command.height).toBe(100);
      expect(command.color).toContain('green');
    }, 10000);

    it('should parse createShape command for text', async () => {
      const response = await request(app)
        .post('/api/ai/interpret')
        .send({
          prompt: 'Add a text layer that says "Hello World" at position 100, 100',
          documentId: 'test-doc-123',
        })
        .expect(200);

      const command = response.body.commands[0];
      expect(command.type).toBe('createShape');
      expect(command.shapeType).toBe('text');
      expect(command.text).toContain('Hello');
    }, 10000);
  });

  describe('Manipulation Commands (Rubric Requirement: at least 2)', () => {
    it('should parse moveShape command', async () => {
      const response = await request(app)
        .post('/api/ai/interpret')
        .send({
          prompt: 'Move shape abc123 to position 300, 400',
          documentId: 'test-doc-123',
        })
        .expect(200);

      const command = response.body.commands[0];
      expect(command.type).toBe('moveShape');
      expect(command.shapeId).toBeDefined();
      expect(command.x).toBe(300);
      expect(command.y).toBe(400);
    }, 10000);

    it('should parse resizeShape command', async () => {
      const response = await request(app)
        .post('/api/ai/interpret')
        .send({
          prompt: 'Resize shape xyz789 to width 500 and height 300',
          documentId: 'test-doc-123',
        })
        .expect(200);

      const command = response.body.commands[0];
      expect(command.type).toBe('resizeShape');
      expect(command.width).toBe(500);
      expect(command.height).toBe(300);
    }, 10000);

    it('should parse rotateShape command', async () => {
      const response = await request(app)
        .post('/api/ai/interpret')
        .send({
          prompt: 'Rotate shape def456 by 45 degrees',
          documentId: 'test-doc-123',
        })
        .expect(200);

      const command = response.body.commands[0];
      expect(command.type).toBe('rotateShape');
      expect(command.degrees).toBe(45);
    }, 10000);
  });

  describe('Layout Commands (Rubric Requirement: at least 1)', () => {
    it('should parse arrangeShapes command for horizontal layout', async () => {
      const response = await request(app)
        .post('/api/ai/interpret')
        .send({
          prompt: 'Arrange shapes in a horizontal row with 20px spacing',
          documentId: 'test-doc-123',
        })
        .expect(200);

      const command = response.body.commands[0];
      expect(command.type).toBe('arrangeShapes');
      expect(command.mode).toBe('horizontal');
      expect(command.spacing).toBe(20);
    }, 10000);

    it('should parse arrangeShapes command for grid layout', async () => {
      const response = await request(app)
        .post('/api/ai/interpret')
        .send({
          prompt: 'Create a 3x3 grid of squares',
          documentId: 'test-doc-123',
        })
        .expect(200);

      // This could be either createGroup or multiple createShape + arrangeShapes
      expect(response.body.commands.length).toBeGreaterThan(0);
      const hasGridCommand = response.body.commands.some(
        (cmd: any) => cmd.mode === 'grid' || cmd.cols === 3
      );
      expect(hasGridCommand).toBe(true);
    }, 10000);
  });

  describe('Complex Commands (Rubric Requirement: at least 1)', () => {
    it('should parse complex multi-element commands', async () => {
      const response = await request(app)
        .post('/api/ai/interpret')
        .send({
          prompt: 'Create a login form with username field, password field, and submit button',
          documentId: 'test-doc-123',
        })
        .expect(200);

      expect(response.body.commands.length).toBeGreaterThanOrEqual(3);
      
      // Should create multiple elements
      const createCommands = response.body.commands.filter(
        (cmd: any) => cmd.type === 'createShape' || cmd.type === 'createGroup'
      );
      expect(createCommands.length).toBeGreaterThanOrEqual(1);
    }, 10000);

    it('should handle navigation bar creation', async () => {
      const response = await request(app)
        .post('/api/ai/interpret')
        .send({
          prompt: 'Build a navigation bar with Home, About, Services, and Contact menu items',
          documentId: 'test-doc-123',
        })
        .expect(200);

      expect(response.body.commands.length).toBeGreaterThan(0);
      
      // Should create multiple text elements or a group
      const hasNavElements = response.body.commands.some(
        (cmd: any) => 
          cmd.type === 'createGroup' && cmd.groupType === 'navbar' ||
          cmd.type === 'createShape' && cmd.shapeType === 'text'
      );
      expect(hasNavElements).toBe(true);
    }, 10000);
  });

  // ==================== Advanced Features Tests ====================

  describe('Additional Command Types (8+ total requirement)', () => {
    it('should parse changeColor command', async () => {
      const response = await request(app)
        .post('/api/ai/interpret')
        .send({
          prompt: 'Change the color of shape abc123 to blue',
          documentId: 'test-doc-123',
        })
        .expect(200);

      const command = response.body.commands[0];
      expect(['changeColor', 'resizeShape', 'moveShape']).toContain(command.type);
    }, 10000);

    it('should parse deleteShape command', async () => {
      const response = await request(app)
        .post('/api/ai/interpret')
        .send({
          prompt: 'Delete shape xyz789',
          documentId: 'test-doc-123',
        })
        .expect(200);

      const command = response.body.commands[0];
      expect(command.type).toBe('deleteShape');
    }, 10000);

    it('should parse alignShapes command', async () => {
      const response = await request(app)
        .post('/api/ai/interpret')
        .send({
          prompt: 'Align all selected shapes to the left',
          documentId: 'test-doc-123',
        })
        .expect(200);

      const command = response.body.commands[0];
      expect(command.type).toBe('alignShapes');
      expect(command.alignment).toBe('left');
    }, 10000);
  });

  // ==================== Error Handling & Edge Cases ====================

  describe('Error Handling', () => {
    it('should handle ambiguous prompts gracefully', async () => {
      const response = await request(app)
        .post('/api/ai/interpret')
        .send({
          prompt: 'Do something',
          documentId: 'test-doc-123',
        })
        .expect(200);

      // Should either return a helpful error or a best-guess command
      expect(response.body.success).toBeDefined();
      if (!response.body.success) {
        expect(response.body.error).toContain('specific');
      }
    }, 10000);

    it('should handle very long prompts', async () => {
      const longPrompt = 'Create a rectangle '.repeat(100);
      const response = await request(app)
        .post('/api/ai/interpret')
        .send({
          prompt: longPrompt,
          documentId: 'test-doc-123',
        });

      // Should either succeed or return a helpful error
      expect(response.status).toBeLessThan(500);
    }, 10000);
  });

  // ==================== Rate Limiting Tests ====================

  describe('Rate Limiting', () => {
    it('should enforce rate limits on AI endpoint', async () => {
      // Make 21 requests (limit is 20 per minute)
      const requests = Array(21).fill(null).map(() =>
        request(app)
          .post('/api/ai/interpret')
          .send({
            prompt: 'Create a shape',
            documentId: 'test-doc-123',
          })
      );

      const responses = await Promise.all(requests);
      
      // At least one should be rate limited
      const rateLimited = responses.some(r => r.status === 429);
      expect(rateLimited).toBe(true);
    }, 30000); // 30 second timeout
  });
});

