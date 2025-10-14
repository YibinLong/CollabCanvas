/**
 * Yjs Persistence Tests (PR #18)
 * 
 * WHY: These tests define how Yjs documents should be saved to and loaded from
 * the database. This ensures that canvas state persists across sessions.
 * 
 * WHAT: These tests cover the 3 core persistence operations:
 * - Save Yjs document state to database
 * - Load Yjs document state from database
 * - Persist document on disconnect
 * 
 * HOW: We use Yjs to create documents with shapes, serialize them, and verify
 * they can be saved to PostgreSQL and loaded back correctly.
 * 
 * NOTE: These tests will FAIL initially (TDD approach). We'll implement the
 * persistence service in PR #19 to make them pass.
 */

import * as Y from 'yjs';
import {
  createTestYDoc,
  createTestYDocWithShapes,
  serializeYDoc,
  deserializeYDoc,
} from './utils/mockYjs';

/**
 * Test Setup
 * 
 * WHY: Mock Prisma client for database operations.
 * We'll test the persistence logic without needing a real database.
 */

// Mock Prisma client
jest.mock('../utils/prisma', () => {
  const mockPrisma = {
    document: {
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    documentVersion: {
      create: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };
  return { prisma: mockPrisma };
});

// Helper to get mocked prisma
const getMockPrisma = () => {
  const { prisma } = require('../utils/prisma');
  return prisma;
};

beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks();
  
  // Set default return values
  const mockPrisma = getMockPrisma();
  mockPrisma.documentVersion.findMany.mockResolvedValue([]); // Default: no versions
});

/**
 * Test Suite: Save Yjs Document to Database
 * 
 * WHY: Canvas state needs to be periodically saved to the database
 * so users don't lose their work if they close the browser.
 * 
 * HOW: Serialize Yjs document to bytes and store in PostgreSQL.
 */
describe('Save Yjs Document to Database', () => {
  it('should serialize and save Yjs document state', async () => {
    // Import persistence service (will be created in PR #19)
    const { saveYjsDocument } = require('../services/yjsPersistence');
    
    // Create a test document with some shapes
    const ydoc = createTestYDocWithShapes([
      { id: 'shape1', type: 'rect', x: 0, y: 0, width: 100, height: 50 },
      { id: 'shape2', type: 'circle', x: 200, y: 200, radius: 75 },
    ]);
    
    const documentId = 'test-doc-123';
    const mockPrisma = getMockPrisma();
    
    // Mock successful update
    mockPrisma.document.update.mockResolvedValue({
      id: documentId,
      yjsState: Buffer.from(serializeYDoc(ydoc)),
      updatedAt: new Date(),
    });
    
    // Save the document
    await saveYjsDocument(documentId, ydoc);
    
    // Verify Prisma was called with serialized state
    expect(mockPrisma.document.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: documentId },
        data: expect.objectContaining({
          yjsState: expect.any(Buffer),
        }),
      })
    );
  });

  it('should handle empty Yjs documents', async () => {
    const { saveYjsDocument } = require('../services/yjsPersistence');
    
    // Create an empty document
    const ydoc = createTestYDoc();
    const documentId = 'empty-doc';
    
    const mockPrisma = getMockPrisma();
    mockPrisma.document.update.mockResolvedValue({
      id: documentId,
      yjsState: Buffer.from(serializeYDoc(ydoc)),
      updatedAt: new Date(),
    });
    
    // Should save successfully even with no shapes
    await saveYjsDocument(documentId, ydoc);
    
    expect(mockPrisma.document.update).toHaveBeenCalled();
  });

  it('should update updatedAt timestamp when saving', async () => {
    const { saveYjsDocument } = require('../services/yjsPersistence');
    
    const ydoc = createTestYDoc();
    const documentId = 'test-doc';
    const beforeSave = new Date();
    
    const mockPrisma = getMockPrisma();
    mockPrisma.document.update.mockResolvedValue({
      id: documentId,
      yjsState: Buffer.from([]),
      updatedAt: new Date(),
    });
    
    await saveYjsDocument(documentId, ydoc);
    
    // Verify updatedAt is included in update
    const updateCall = mockPrisma.document.update.mock.calls[0][0];
    expect(updateCall.data).toHaveProperty('updatedAt');
  });
});

/**
 * Test Suite: Load Yjs Document from Database
 * 
 * WHY: When a user opens a document, we need to load the saved canvas state
 * from the database and restore it into a Yjs document.
 * 
 * HOW: Retrieve serialized bytes from PostgreSQL and deserialize into Yjs document.
 */
describe('Load Yjs Document from Database', () => {
  it('should load and deserialize Yjs document state', async () => {
    const { loadYjsDocument } = require('../services/yjsPersistence');
    
    // Create and serialize a document with shapes
    const originalDoc = createTestYDocWithShapes([
      { id: 'shape1', type: 'rect', x: 10, y: 20, width: 100, height: 50 },
    ]);
    const serialized = serializeYDoc(originalDoc);
    
    // Mock database returning the serialized state
    const mockPrisma = getMockPrisma();
    mockPrisma.document.findUnique.mockResolvedValue({
      id: 'test-doc-123',
      yjsState: Buffer.from(serialized),
      title: 'Test Document',
      ownerId: 'user-123',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    // Load the document
    const loadedDoc = await loadYjsDocument('test-doc-123');
    
    // Verify document was loaded correctly
    expect(loadedDoc).toBeDefined();
    
    // Verify shapes were restored
    const shapesMap = loadedDoc.getMap('shapes');
    expect(shapesMap.size).toBe(1);
    
    const shape1 = shapesMap.get('shape1') as Y.Map<any>;
    expect(shape1.get('type')).toBe('rect');
    expect(shape1.get('x')).toBe(10);
    expect(shape1.get('y')).toBe(20);
  });

  it('should return empty document if no state exists', async () => {
    const { loadYjsDocument } = require('../services/yjsPersistence');
    
    // Mock database returning null yjsState (new document)
    const mockPrisma = getMockPrisma();
    mockPrisma.document.findUnique.mockResolvedValue({
      id: 'new-doc',
      yjsState: null,
      title: 'New Document',
      ownerId: 'user-123',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    // Load should return empty document
    const loadedDoc = await loadYjsDocument('new-doc');
    
    expect(loadedDoc).toBeDefined();
    expect(loadedDoc.getMap('shapes').size).toBe(0);
  });

  it('should throw error if document not found', async () => {
    const { loadYjsDocument } = require('../services/yjsPersistence');
    
    // Mock database returning null (document doesn't exist)
    const mockPrisma = getMockPrisma();
    mockPrisma.document.findUnique.mockResolvedValue(null);
    
    // Should throw error
    await expect(loadYjsDocument('non-existent-doc')).rejects.toThrow();
  });
});

/**
 * Test Suite: Document Persists on Disconnect
 * 
 * WHY: When users disconnect from the WebSocket (close browser, lose connection),
 * we need to save their work immediately so nothing is lost.
 * 
 * HOW: Listen for WebSocket disconnect events and trigger save operation.
 */
describe('Document Persistence on Disconnect', () => {
  it('should save document when client disconnects', async () => {
    const { saveYjsDocument } = require('../services/yjsPersistence');
    const { handleClientDisconnect } = require('../services/yjsPersistence');
    
    // Create a document with changes
    const ydoc = createTestYDocWithShapes([
      { id: 'shape1', type: 'rect', x: 0, y: 0 },
    ]);
    
    const documentId = 'test-doc';
    
    const mockPrisma = getMockPrisma();
    mockPrisma.document.update.mockResolvedValue({
      id: documentId,
      yjsState: Buffer.from(serializeYDoc(ydoc)),
      updatedAt: new Date(),
    });
    
    // Simulate client disconnect
    await handleClientDisconnect(documentId, ydoc);
    
    // Verify document was saved
    expect(mockPrisma.document.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: documentId },
      })
    );
  });

  it('should handle disconnect even if save fails', async () => {
    const { handleClientDisconnect } = require('../services/yjsPersistence');
    
    const ydoc = createTestYDoc();
    const documentId = 'test-doc';
    
    const mockPrisma = getMockPrisma();
    mockPrisma.document.update.mockRejectedValue(new Error('Database error'));
    
    // Should not throw - just log error
    await expect(
      handleClientDisconnect(documentId, ydoc)
    ).resolves.not.toThrow();
  });
});

/**
 * Test Suite: Version History
 * 
 * WHY: Users may want to restore previous versions of their document
 * (undo major changes, recover from mistakes).
 * 
 * HOW: Save snapshots to DocumentVersion table periodically.
 */
describe('Version History', () => {
  it('should save version snapshot', async () => {
    const { saveVersion } = require('../services/yjsPersistence');
    
    const ydoc = createTestYDocWithShapes([
      { id: 'shape1', type: 'rect', x: 0, y: 0 },
    ]);
    
    const documentId = 'test-doc';
    const label = 'Before AI changes';
    
    const mockPrisma = getMockPrisma();
    mockPrisma.documentVersion.create.mockResolvedValue({
      id: 'version-1',
      documentId,
      yjsState: Buffer.from(serializeYDoc(ydoc)),
      label,
      createdAt: new Date(),
    });
    
    // Save a version snapshot
    await saveVersion(documentId, ydoc, label);
    
    // Verify version was saved
    expect(mockPrisma.documentVersion.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          documentId,
          yjsState: expect.any(Buffer),
          label,
        }),
      })
    );
  });

  it('should limit version history to last 50 versions', async () => {
    const { saveVersion } = require('../services/yjsPersistence');
    
    const ydoc = createTestYDoc();
    const documentId = 'test-doc';
    
    const mockPrisma = getMockPrisma();
    
    // Mock 51 existing versions (more than the limit of 50)
    // This simulates the state AFTER a new version has been created
    mockPrisma.documentVersion.findMany.mockResolvedValue(
      Array(51).fill(null).map((_, i) => ({
        id: `version-${i}`,
        createdAt: new Date(Date.now() - i * 1000),
      }))
    );
    
    mockPrisma.documentVersion.create.mockResolvedValue({
      id: 'version-51',
      documentId,
      yjsState: Buffer.from([]),
      createdAt: new Date(),
    });
    
    mockPrisma.documentVersion.deleteMany.mockResolvedValue({ count: 1 });
    
    // Save new version (should trigger cleanup)
    await saveVersion(documentId, ydoc);
    
    // Should delete oldest version(s)
    expect(mockPrisma.documentVersion.deleteMany).toHaveBeenCalled();
  });

  it('should load specific version by ID', async () => {
    const { loadVersion } = require('../services/yjsPersistence');
    
    // Create a version
    const originalDoc = createTestYDocWithShapes([
      { id: 'old-shape', type: 'circle', x: 50, y: 50 },
    ]);
    const serialized = serializeYDoc(originalDoc);
    
    const mockPrisma = getMockPrisma();
    mockPrisma.documentVersion.findUnique = jest.fn().mockResolvedValue({
      id: 'version-1',
      documentId: 'test-doc',
      yjsState: Buffer.from(serialized),
      label: 'Old version',
      createdAt: new Date(),
    });
    
    // Load the version
    const loadedDoc = await loadVersion('version-1');
    
    // Verify shapes were restored
    const shapesMap = loadedDoc.getMap('shapes');
    expect(shapesMap.size).toBe(1);
    expect(shapesMap.has('old-shape')).toBe(true);
  });
});

/**
 * Test Suite: Periodic Auto-Save
 * 
 * WHY: Documents should auto-save periodically (e.g., every 10 seconds)
 * to minimize data loss.
 * 
 * HOW: Set up interval timer that saves document state.
 */
describe('Periodic Auto-Save', () => {
  it('should schedule periodic saves', () => {
    const { startAutoSave, stopAutoSave } = require('../services/yjsPersistence');
    
    const ydoc = createTestYDoc();
    const documentId = 'test-doc';
    
    // Start auto-save with short interval for testing
    const interval = startAutoSave(documentId, ydoc, 1000); // 1 second
    
    expect(interval).toBeDefined();
    
    // Clean up
    stopAutoSave(interval);
  });

  it('should save document at specified intervals', async () => {
    // This test uses fake timers to avoid actually waiting
    jest.useFakeTimers();
    
    const { startAutoSave, stopAutoSave } = require('../services/yjsPersistence');
    
    const ydoc = createTestYDoc();
    const documentId = 'test-doc';
    
    const mockPrisma = getMockPrisma();
    mockPrisma.document.update.mockResolvedValue({
      id: documentId,
      yjsState: Buffer.from([]),
      updatedAt: new Date(),
    });
    
    // Start auto-save every 10 seconds
    const interval = startAutoSave(documentId, ydoc, 10000);
    
    // Fast-forward 10 seconds
    jest.advanceTimersByTime(10000);
    
    // Should have saved once
    expect(mockPrisma.document.update).toHaveBeenCalledTimes(1);
    
    // Fast-forward another 10 seconds
    jest.advanceTimersByTime(10000);
    
    // Should have saved twice
    expect(mockPrisma.document.update).toHaveBeenCalledTimes(2);
    
    // Clean up
    stopAutoSave(interval);
    jest.useRealTimers();
  });
});

