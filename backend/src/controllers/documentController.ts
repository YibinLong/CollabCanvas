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
import { getVersionHistory, loadVersion, saveVersion } from '../services/yjsPersistence';
import * as Y from 'yjs';

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

/**
 * Get Version History for a Document
 * 
 * WHY: Users need to see a list of all available versions to choose which one to restore.
 * 
 * WHAT: Returns metadata about all saved versions (id, label, timestamp) but NOT
 * the full Yjs state (that would be too heavy for a list view).
 * 
 * HOW: Call the persistence service's getVersionHistory function, which queries
 * the DocumentVersion table and returns only the metadata fields.
 * 
 * AUTHORIZATION: ANY authenticated user can view version history.
 * This allows collaborative editing without restrictions.
 */
export async function getVersions(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Find document to verify it exists
    const document = await prisma.document.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // NO OWNERSHIP CHECK - any authenticated user can view versions
    // This allows collaborative teams to see and restore versions

    // Get version history from persistence service
    const versions = await getVersionHistory(id);

    res.json({ versions });
  } catch (error) {
    console.error('Error getting version history:', error);
    res.status(500).json({ error: 'Failed to get version history' });
  }
}

/**
 * Restore a Previous Version
 * 
 * WHY: Users need to be able to restore their document to a previous state.
 * This is useful for undoing major changes or recovering from mistakes.
 * 
 * WHAT: Loads the specified version's Yjs state and applies it to the current
 * document, effectively "rolling back" to that point in time.
 * 
 * HOW:
 * 1. Load the version from DocumentVersion table
 * 2. Update the main Document's yjsState with the version's state
 * 3. Create a new version snapshot labeled "Restored from [date]"
 * 4. Return success
 * 
 * SYNC: The Yjs WebSocket will detect the state change and broadcast it to
 * all connected users, so everyone sees the restored version in real-time.
 * 
 * AUTHORIZATION: ANY authenticated user can restore versions.
 * This allows collaborative teams to restore without restrictions.
 */
export async function restoreVersion(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const { id, versionId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Find document to verify it exists
    const document = await prisma.document.findUnique({
      where: { id },
      select: { id: true, yjsState: true },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // NO OWNERSHIP CHECK - any authenticated user can restore versions
    // This allows collaborative editing without restrictions

    // Ensure the version belongs to this document and load its data
    const versionData = await prisma.documentVersion.findFirst({
      where: {
        id: versionId,
        documentId: id,
      },
      select: {
        yjsState: true,
        createdAt: true,
        label: true,
      },
    });

    if (!versionData) {
      return res.status(404).json({ error: 'Version not found for this document' });
    }

    // Load the version state into a new Yjs document
    const versionDoc = new Y.Doc();
    const versionState = new Uint8Array(versionData.yjsState);
    Y.applyUpdate(versionDoc, versionState);

    // Serialize it back to bytes for saving on the main document
    const state = Y.encodeStateAsUpdate(versionDoc);
    const buffer = Buffer.from(state);

    // Update the document's state to match this version
    await prisma.document.update({
      where: { id },
      data: {
        yjsState: buffer,
      },
    });

    // CRITICAL: Update the in-memory Yjs document on the WebSocket server
    // WHY: If we don't do this, when the user disconnects (during page reload),
    // the WebSocket will save the OLD in-memory state and overwrite our restore!
    try {
      // Import the docs map from y-websocket (with type assertion for no types)
      // @ts-ignore - y-websocket doesn't have TypeScript definitions
      const { docs } = await import('y-websocket/bin/utils');
      const activeDoc = docs.get(id) as Y.Doc | undefined;
      
      if (activeDoc) {
        // Clear the in-memory document and apply the restored state
        activeDoc.transact(() => {
          const shapesMap = activeDoc.getMap('shapes');
          
          // Clear existing shapes
          const existingShapes = Array.from(shapesMap.keys());
          existingShapes.forEach(key => shapesMap.delete(key));
          
          // Copy shapes from restored version
          // IMPORTANT: Can't directly copy Y.Map between documents!
          // Must create new Y.Map instances and copy properties
          const restoredShapesMap = versionDoc.getMap('shapes');
          restoredShapesMap.forEach((shape, shapeId) => {
            const shapeData = shape as Y.Map<any>;
            const newShape = new Y.Map();
            
            // Copy each property from restored shape to new shape
            shapeData.forEach((value, key) => {
              newShape.set(key, value);
            });
            
            shapesMap.set(shapeId, newShape);
          });
        });
      }
    } catch (error) {
      console.error(`[VERSION RESTORE] Failed to update in-memory document:`, error);
    }

    // Create a new version snapshot marking this restore point
    // Get all versions to determine the version number (oldest = #1)
    const allVersions = await prisma.documentVersion.findMany({
      where: { documentId: id },
      orderBy: { createdAt: 'asc' },
      select: { id: true, label: true },
    });
    
    // Find the index of the version we're restoring from
    const versionIndex = allVersions.findIndex(v => v.id === versionId);
    const versionNumber = versionIndex + 1;
    
    // Build the restore label
    let restoreLabel: string;
    if (versionData.label && !versionData.label.startsWith('Restored from')) {
      restoreLabel = `Restored from #${versionNumber} (${versionData.label})`;
    } else {
      const date = versionData.createdAt;
      const shortDate = date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      restoreLabel = `Restored from #${versionNumber} (${shortDate})`;
    }
    
    await saveVersion(id, versionDoc, restoreLabel);

    res.json({ message: 'Version restored successfully' });
  } catch (error) {
    console.error('[VERSION RESTORE] Error:', error);
    res.status(500).json({ error: 'Failed to restore version' });
  }
}

/**
 * Manually Save a Version Snapshot
 * 
 * WHY: Users may want to manually save a snapshot at important milestones
 * (e.g., "Before redesign", "Final version for review").
 * 
 * WHAT: Creates a new version snapshot with an optional user-provided label.
 * 
 * HOW:
 * 1. Load the current document's Yjs state
 * 2. Call saveVersion() with the optional label
 * 3. Return success
 * 
 * AUTHORIZATION: ANY authenticated user can save versions.
 * This allows collaborative teams to save snapshots without restrictions.
 */
export async function createVersionSnapshot(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const { label, yjsStateBase64 } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Find document to verify it exists
    const document = await prisma.document.findUnique({
      where: { id },
      select: { id: true, yjsState: true },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // NO OWNERSHIP CHECK - any authenticated user can save versions
    // This allows collaborative editing without restrictions

    let ydoc: Y.Doc;
    
    // PRIORITY 1: Use state from request body if provided (most up-to-date)
    if (yjsStateBase64) {
      const stateBuffer = Buffer.from(yjsStateBase64, 'base64');
      ydoc = new Y.Doc();
      const state = new Uint8Array(stateBuffer);
      Y.applyUpdate(ydoc, state);
    } 
    // FALLBACK: Use database state (might be stale)
    else {
      ydoc = new Y.Doc();
      if (document.yjsState && document.yjsState.length > 0) {
        const state = new Uint8Array(document.yjsState);
        Y.applyUpdate(ydoc, state);
      }
    }
    
    // Save version with optional label
    await saveVersion(id, ydoc, label);

    res.status(201).json({ message: 'Version snapshot created successfully' });
  } catch (error) {
    console.error('Error creating version snapshot:', error);
    res.status(500).json({ error: 'Failed to create version snapshot' });
  }
}

/**
 * Delete All Versions for a Document
 *
 * WHY: Teams may want to clear the entire version history (cleanup, privacy, etc.).
 *
 * WHAT: Removes every DocumentVersion row associated with the document.
 *
 * AUTHORIZATION: ANY authenticated user can clear history (matches collaborative model).
 */
export async function deleteAllVersions(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Ensure document exists so we provide a meaningful error if it doesn't
    const document = await prisma.document.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Delete all version rows for this document
    const result = await prisma.documentVersion.deleteMany({
      where: { documentId: id },
    });

    res.json({
      message: 'Version history cleared successfully',
      deletedCount: result.count ?? 0,
    });
  } catch (error) {
    console.error('Error deleting version history:', error);
    res.status(500).json({ error: 'Failed to delete version history' });
  }
}

