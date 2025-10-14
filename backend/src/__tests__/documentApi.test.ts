/**
 * Document API Tests (PR #16, Updated in PR #23)
 * 
 * WHY: These tests define the expected behavior of our document management API
 * before we write any implementation code. This is Test-Driven Development (TDD).
 * 
 * WHAT: These tests cover the 4 core CRUD operations:
 * - GET /api/documents - List all documents for a user
 * - POST /api/documents - Create a new document
 * - GET /api/documents/:id - Load a specific document
 * - DELETE /api/documents/:id - Delete a document
 * 
 * PHASE 5: Updated to use JWT authentication instead of mockAuth
 */

import request from 'supertest';
import express from 'express';

/**
 * Test Setup
 * 
 * WHY: We'll set up an Express app before tests run.
 * We mock Prisma and Supabase for testing without real services.
 */
let app: express.Application;
let testUserId: string;

// Mock Supabase
jest.mock('../utils/supabase', () => ({
  verifyToken: jest.fn(),
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
  },
}));

// Mock Prisma client
jest.mock('../utils/prisma', () => {
  const mockPrisma = {
    document: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    documentVersion: {
      findMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };
  return { prisma: mockPrisma };
});

beforeAll(() => {
  // Import document routes (will be created in PR #17)
  const documentRoutes = require('../routes/documentRoutes');
  
  // Create a minimal Express app for testing
  app = express();
  app.use(express.json()); // Parse JSON request bodies
  app.use('/api/documents', documentRoutes.default);
});

beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks();
  
  testUserId = 'test-user-1';
  
  // Mock JWT verification to return test user
  const { verifyToken } = require('../utils/supabase');
  verifyToken.mockResolvedValue({
    id: testUserId,
    email: 'test@example.com',
  });
});

// Helper to get mocked prisma
const getMockPrisma = () => {
  const { prisma } = require('../utils/prisma');
  return prisma;
};

/**
 * Test Suite: GET /api/documents
 * 
 * WHY: Users need to see a list of their documents to open/edit them.
 * This endpoint returns all documents owned by the authenticated user.
 */
describe('GET /api/documents', () => {
  it('should return an empty array when user has no documents', async () => {
    // Mock empty documents array
    const mockPrisma = getMockPrisma();
    mockPrisma.document.findMany.mockResolvedValue([]);

    // Make request to the API
    const response = await request(app)
      .get('/api/documents')
      .set('Authorization', 'Bearer fake-jwt-token'); // Mock auth - real auth will be added in Phase 5
    
    // Verify response
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      documents: [],
    });
    
    // Verify Prisma was called with correct filter
    expect(mockPrisma.document.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { ownerId: testUserId },
      })
    );
  });

  it('should return list of user documents', async () => {
    // Mock documents
    const mockDocs = [
      {
        id: 'doc-1',
        title: 'My First Document',
        ownerId: testUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'doc-2',
        title: 'My Second Document',
        ownerId: testUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    
    const mockPrisma = getMockPrisma();
    mockPrisma.document.findMany.mockResolvedValue(mockDocs);

    // Make request
    const response = await request(app)
      .get('/api/documents')
      .set('Authorization', 'Bearer fake-jwt-token');
    
    // Verify response
    expect(response.status).toBe(200);
    expect(response.body.documents).toHaveLength(2);
    expect(response.body.documents[0]).toMatchObject({
      id: expect.any(String),
      title: expect.any(String),
      ownerId: testUserId,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
  });

  it('should not return documents from other users', async () => {
    // Mock only test user's document
    const mockDocs = [
      {
        id: 'doc-1',
        title: 'My Document',
        ownerId: testUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    
    const mockPrisma = getMockPrisma();
    mockPrisma.document.findMany.mockResolvedValue(mockDocs);

    // Request as test user
    const response = await request(app)
      .get('/api/documents')
      .set('Authorization', 'Bearer fake-jwt-token');
    
    // Should only see own documents
    expect(response.status).toBe(200);
    expect(response.body.documents).toHaveLength(1);
    expect(response.body.documents[0].title).toBe('My Document');
    
    // Verify Prisma was called with userId filter
    expect(mockPrisma.document.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { ownerId: testUserId },
      })
    );
  });
});

/**
 * Test Suite: POST /api/documents
 * 
 * WHY: Users need to create new canvas documents.
 * This endpoint creates a new document and returns its ID.
 */
describe('POST /api/documents', () => {
  it('should create a new document with default title', async () => {
    // Mock created document
    const mockDoc = {
      id: 'new-doc-1',
      title: 'Untitled',
      ownerId: testUserId,
      yjsState: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const mockPrisma = getMockPrisma();
    mockPrisma.document.create.mockResolvedValue(mockDoc);

    // Make request without title
    const response = await request(app)
      .post('/api/documents')
      .set('Authorization', 'Bearer fake-jwt-token')
      .send({});
    
    // Verify response
    expect(response.status).toBe(201);
    expect(response.body.document).toMatchObject({
      id: expect.any(String),
      title: 'Untitled', // Default title from schema
      ownerId: testUserId,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
    
    // Verify Prisma was called correctly
    expect(mockPrisma.document.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: 'Untitled',
          ownerId: testUserId,
        }),
      })
    );
  });

  it('should create a new document with custom title', async () => {
    // Mock created document
    const mockDoc = {
      id: 'new-doc-2',
      title: 'My Design Project',
      ownerId: testUserId,
      yjsState: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const mockPrisma = getMockPrisma();
    mockPrisma.document.create.mockResolvedValue(mockDoc);

    // Make request with custom title
    const response = await request(app)
      .post('/api/documents')
      .set('Authorization', 'Bearer fake-jwt-token')
      .send({ title: 'My Design Project' });
    
    // Verify response
    expect(response.status).toBe(201);
    expect(response.body.document.title).toBe('My Design Project');
    
    // Verify Prisma was called with custom title
    expect(mockPrisma.document.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: 'My Design Project',
        }),
      })
    );
  });

  it('should initialize document with empty Yjs state', async () => {
    // Mock created document with null yjsState
    const mockDoc = {
      id: 'new-doc-3',
      title: 'Test Doc',
      ownerId: testUserId,
      yjsState: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const mockPrisma = getMockPrisma();
    mockPrisma.document.create.mockResolvedValue(mockDoc);

    const response = await request(app)
      .post('/api/documents')
      .set('Authorization', 'Bearer fake-jwt-token')
      .send({ title: 'Test Doc' });
    
    // Verify yjsState is null
    expect(response.body.document.yjsState).toBeNull();
    
    // Verify Prisma was called with null yjsState
    expect(mockPrisma.document.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          yjsState: null,
        }),
      })
    );
  });
});

/**
 * Test Suite: GET /api/documents/:id
 * 
 * WHY: Users need to load a specific document to view/edit it.
 * This endpoint returns complete document data including Yjs state.
 */
describe('GET /api/documents/:id', () => {
  it('should return document by ID', async () => {
    // Mock document
    const mockDoc = {
      id: 'doc-123',
      title: 'Test Document',
      ownerId: testUserId,
      yjsState: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const mockPrisma = getMockPrisma();
    mockPrisma.document.findUnique.mockResolvedValue(mockDoc);

    // Make request
    const response = await request(app)
      .get(`/api/documents/${mockDoc.id}`)
      .set('Authorization', 'Bearer fake-jwt-token');
    
    // Verify response
    expect(response.status).toBe(200);
    expect(response.body.document).toMatchObject({
      id: mockDoc.id,
      title: 'Test Document',
      ownerId: testUserId,
    });
    
    // Verify Prisma was called with correct ID
    expect(mockPrisma.document.findUnique).toHaveBeenCalledWith({
      where: { id: mockDoc.id },
    });
  });

  it('should return 404 for non-existent document', async () => {
    // Mock no document found
    const mockPrisma = getMockPrisma();
    mockPrisma.document.findUnique.mockResolvedValue(null);

    const response = await request(app)
      .get('/api/documents/non-existent-id')
      .set('Authorization', 'Bearer fake-jwt-token');
    
    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      error: expect.any(String),
    });
  });

  it('should return 403 when accessing another user\'s document', async () => {
    // Mock document owned by different user
    const mockDoc = {
      id: 'other-doc',
      title: 'Private Document',
      ownerId: 'other-user-id', // Different owner
      yjsState: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const mockPrisma = getMockPrisma();
    mockPrisma.document.findUnique.mockResolvedValue(mockDoc);

    // Try to access as test user
    const response = await request(app)
      .get(`/api/documents/${mockDoc.id}`)
      .set('Authorization', 'Bearer fake-jwt-token');
    
    // Should be forbidden
    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({
      error: expect.any(String),
    });
  });
});

/**
 * Test Suite: DELETE /api/documents/:id
 * 
 * WHY: Users need to delete documents they no longer need.
 * This endpoint removes the document and all its versions.
 */
describe('DELETE /api/documents/:id', () => {
  it('should delete a document', async () => {
    // Mock document to be deleted
    const mockDoc = {
      id: 'doc-to-delete',
      title: 'To Be Deleted',
      ownerId: testUserId,
      yjsState: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const mockPrisma = getMockPrisma();
    mockPrisma.document.findUnique.mockResolvedValue(mockDoc);
    mockPrisma.document.delete.mockResolvedValue(mockDoc);

    // Make request
    const response = await request(app)
      .delete(`/api/documents/${mockDoc.id}`)
      .set('Authorization', 'Bearer fake-jwt-token');
    
    // Verify response
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      message: expect.any(String),
    });
    
    // Verify Prisma delete was called
    expect(mockPrisma.document.delete).toHaveBeenCalledWith({
      where: { id: mockDoc.id },
    });
  });

  it('should return 404 when deleting non-existent document', async () => {
    // Mock no document found
    const mockPrisma = getMockPrisma();
    mockPrisma.document.findUnique.mockResolvedValue(null);

    const response = await request(app)
      .delete('/api/documents/non-existent-id')
      .set('Authorization', 'Bearer fake-jwt-token');
    
    expect(response.status).toBe(404);
    
    // Delete should not be called
    expect(mockPrisma.document.delete).not.toHaveBeenCalled();
  });

  it('should return 403 when deleting another user\'s document', async () => {
    // Mock document owned by different user
    const mockDoc = {
      id: 'other-doc',
      title: 'Private Document',
      ownerId: 'other-user-id',
      yjsState: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const mockPrisma = getMockPrisma();
    mockPrisma.document.findUnique.mockResolvedValue(mockDoc);

    // Try to delete as test user
    const response = await request(app)
      .delete(`/api/documents/${mockDoc.id}`)
      .set('Authorization', 'Bearer fake-jwt-token');
    
    // Should be forbidden
    expect(response.status).toBe(403);
    
    // Delete should not be called
    expect(mockPrisma.document.delete).not.toHaveBeenCalled();
  });

  it('should cascade delete document versions', async () => {
    // Mock document
    const mockDoc = {
      id: 'doc-with-versions',
      title: 'Document',
      ownerId: testUserId,
      yjsState: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const mockPrisma = getMockPrisma();
    mockPrisma.document.findUnique.mockResolvedValue(mockDoc);
    mockPrisma.document.delete.mockResolvedValue(mockDoc);

    // Delete document
    const response = await request(app)
      .delete(`/api/documents/${mockDoc.id}`)
      .set('Authorization', 'Bearer fake-jwt-token');
    
    expect(response.status).toBe(200);
    
    // Verify delete was called (cascade is handled by Prisma schema)
    expect(mockPrisma.document.delete).toHaveBeenCalledWith({
      where: { id: mockDoc.id },
    });
  });
});

