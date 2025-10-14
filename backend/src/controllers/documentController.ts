/**
 * Document Controller (PR #17)
 * 
 * WHY: Controllers contain the business logic for handling HTTP requests.
 * They interact with the database (via Prisma) and return appropriate responses.
 * 
 * WHAT: This controller handles all document CRUD operations:
 * - listDocuments: Get all documents for a user
 * - createDocument: Create a new document
 * - getDocument: Get a single document by ID
 * - deleteDocument: Delete a document
 * 
 * SEPARATION OF CONCERNS: Controllers handle business logic, routes handle HTTP routing,
 * and middleware handles cross-cutting concerns like authentication.
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { prisma } from '../utils/prisma';

/**
 * List all documents for the authenticated user
 * 
 * WHY: Users need to see all their documents to select one to open.
 * 
 * HOW: Query Prisma for all documents where ownerId matches the authenticated user.
 * The user ID comes from req.userId, which is set by the auth middleware.
 */
export async function listDocuments(req: Request, res: Response) {
  try {
    // Get authenticated user ID from middleware
    // Note: In Phase 5, this will come from JWT. For now, it's from x-user-id header.
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Query database for user's documents
    const documents = await prisma.document.findMany({
      where: {
        ownerId: userId,
      },
      // Order by most recently updated first
      orderBy: {
        updatedAt: 'desc',
      },
      // Don't include the large yjsState field in list view (optimization)
      select: {
        id: true,
        title: true,
        ownerId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Return documents array
    res.json({ documents });
  } catch (error) {
    console.error('Error listing documents:', error);
    res.status(500).json({ error: 'Failed to list documents' });
  }
}

/**
 * Create a new document
 * 
 * WHY: Users need to create new canvas documents to start designing.
 * 
 * HOW: Create a new document in the database with the provided title
 * (or default "Untitled"). The yjsState starts as null/empty.
 */
export async function createDocument(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get title from request body (optional)
    const { title } = req.body;

    // Create document in database
    const document = await prisma.document.create({
      data: {
        title: title || 'Untitled', // Use provided title or default
        ownerId: userId,
        yjsState: null, // Start with empty state
      },
    });

    // Return created document with 201 status (Created)
    res.status(201).json({ document });
  } catch (error) {
    console.error('Error creating document:', error);
    res.status(500).json({ error: 'Failed to create document' });
  }
}

/**
 * Get a single document by ID
 * 
 * WHY: Users need to load a specific document to view/edit it.
 * 
 * HOW: Query Prisma for the document by ID. Verify the user owns it
 * before returning it (authorization check).
 */
export async function getDocument(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Find document by ID
    const document = await prisma.document.findUnique({
      where: { id },
    });

    // Check if document exists
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Check if user owns this document (authorization)
    if (document.ownerId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Return document (including yjsState for loading)
    res.json({ document });
  } catch (error) {
    console.error('Error getting document:', error);
    res.status(500).json({ error: 'Failed to get document' });
  }
}

/**
 * Delete a document
 * 
 * WHY: Users need to delete documents they no longer need.
 * 
 * HOW: Query for the document, verify ownership, then delete it.
 * Prisma's cascade delete (defined in schema) will also delete
 * all associated DocumentVersions automatically.
 */
export async function deleteDocument(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Find document first (to check existence and ownership)
    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Check ownership
    if (document.ownerId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete document (cascade will delete versions too)
    await prisma.document.delete({
      where: { id },
    });

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
}

/**
 * Clear all shapes from a document
 * 
 * WHY: Users need a way to delete all shapes at once from the canvas.
 * This is faster than deleting shapes one by one.
 * 
 * WHAT: This endpoint clears the Yjs state for a document, effectively
 * removing all shapes from the canvas for all users.
 * 
 * HOW: 
 * 1. Verify the user is authenticated
 * 2. Check that the document exists
 * 3. Set the yjsState to null (empty state)
 * 4. Update the document's updatedAt timestamp
 * 
 * AUTHORIZATION: ANY authenticated user can clear shapes (no ownership check).
 * This allows collaborative teams to clear the canvas without restrictions.
 * 
 * SYNC: The Yjs WebSocket server will detect this change and broadcast
 * it to all connected users, clearing their canvas in real-time.
 */
export async function clearAllShapes(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Find document first (to check existence)
    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // NO OWNERSHIP CHECK - any authenticated user can clear shapes
    // This allows collaborative editing without restrictions

    // Clear the Yjs state (this effectively removes all shapes)
    await prisma.document.update({
      where: { id },
      data: {
        yjsState: null,
        // updatedAt is automatically set by Prisma
      },
    });

    res.json({ message: 'All shapes cleared successfully' });
  } catch (error) {
    console.error('Error clearing all shapes:', error);
    res.status(500).json({ error: 'Failed to clear shapes' });
  }
}

