/**
 * Yjs Persistence Service (PR #19)
 * 
 * WHY: This service handles saving and loading Yjs document state to/from PostgreSQL.
 * Without persistence, users would lose their work when they close the browser.
 * 
 * WHAT: This service provides:
 * - Save Yjs document state to database (serialize to bytes)
 * - Load Yjs document state from database (deserialize from bytes)
 * - Handle disconnects (save on WebSocket disconnect)
 * - Version history (save snapshots for undo/restore)
 * - Auto-save (periodic saves every N seconds)
 * 
 * HOW: Yjs documents are serialized to bytes using Y.encodeStateAsUpdate(),
 * stored in PostgreSQL as binary (Bytes type), then deserialized back using
 * Y.applyUpdate() when loading.
 */

import * as Y from 'yjs';
import { prisma } from '../utils/prisma';

/**
 * Save Yjs Document to Database
 * 
 * WHY: Persist canvas state so users don't lose work.
 * 
 * HOW: Serialize the Yjs document to bytes and store in the yjsState column.
 * Update the updatedAt timestamp to track when document was last modified.
 * 
 * @param documentId - Database ID of the document
 * @param ydoc - Yjs document to save
 */
export async function saveYjsDocument(
  documentId: string,
  ydoc: Y.Doc
): Promise<void> {
  try {
    // Serialize Yjs document to bytes
    // This captures the entire state of the document (all shapes, text, etc.)
    const state = Y.encodeStateAsUpdate(ydoc);
    
    // Convert to Buffer for PostgreSQL
    const buffer = Buffer.from(state);
    
    // Save to database
    await prisma.document.update({
      where: { id: documentId },
      data: {
        yjsState: buffer,
        updatedAt: new Date(), // Track last modification time
      },
    });
    
    console.log(`[Persistence] Saved document ${documentId} (${buffer.length} bytes)`);
  } catch (error) {
    console.error(`[Persistence] Error saving document ${documentId}:`, error);
    throw error;
  }
}

/**
 * Load Yjs Document from Database
 * 
 * WHY: Restore saved canvas state when user opens a document.
 * 
 * HOW: Query database for document, deserialize yjsState bytes into Yjs document,
 * return the populated document.
 * 
 * @param documentId - Database ID of the document
 * @returns Yjs document with restored state
 */
export async function loadYjsDocument(documentId: string): Promise<Y.Doc> {
  try {
    // Query database for document
    const doc = await prisma.document.findUnique({
      where: { id: documentId },
    });
    
    if (!doc) {
      throw new Error(`Document ${documentId} not found`);
    }
    
    // Create new Yjs document
    const ydoc = new Y.Doc();
    
    // If document has saved state, restore it
    if (doc.yjsState && doc.yjsState.length > 0) {
      // Deserialize state and apply to document
      const state = new Uint8Array(doc.yjsState);
      Y.applyUpdate(ydoc, state);
      
      console.log(`[Persistence] Loaded document ${documentId} (${doc.yjsState.length} bytes)`);
    } else {
      console.log(`[Persistence] Loaded empty document ${documentId}`);
    }
    
    return ydoc;
  } catch (error) {
    console.error(`[Persistence] Error loading document ${documentId}:`, error);
    throw error;
  }
}

/**
 * Handle Client Disconnect
 * 
 * WHY: Save document immediately when user disconnects to prevent data loss.
 * 
 * HOW: Called from WebSocket server when a client disconnects. Saves the
 * current state of the document. Catches errors to prevent disconnect from failing.
 * 
 * @param documentId - Database ID of the document
 * @param ydoc - Yjs document to save
 */
export async function handleClientDisconnect(
  documentId: string,
  ydoc: Y.Doc
): Promise<void> {
  try {
    console.log(`[Persistence] Client disconnected from ${documentId}, saving...`);
    await saveYjsDocument(documentId, ydoc);
  } catch (error) {
    // Log error but don't throw - disconnect should succeed even if save fails
    console.error(`[Persistence] Error saving on disconnect:`, error);
  }
}

/**
 * Save Version Snapshot
 * 
 * WHY: Keep history of document states so users can restore previous versions.
 * Useful for undoing major changes or recovering from mistakes.
 * 
 * HOW: Save a snapshot to the DocumentVersion table with optional label.
 * Limit to 50 most recent versions to avoid unbounded growth.
 * 
 * @param documentId - Database ID of the document
 * @param ydoc - Yjs document to snapshot
 * @param label - Optional description of this version
 */
export async function saveVersion(
  documentId: string,
  ydoc: Y.Doc,
  label?: string
): Promise<void> {
  try {
    // Serialize document state
    const state = Y.encodeStateAsUpdate(ydoc);
    const buffer = Buffer.from(state);
    
    // Save version
    await prisma.documentVersion.create({
      data: {
        documentId,
        yjsState: buffer,
        label: label || undefined,
      },
    });
    
    console.log(`[Persistence] Saved version for ${documentId}: ${label || '(unlabeled)'}`);
    
    // Clean up old versions (keep only last 50)
    await cleanupOldVersions(documentId);
  } catch (error) {
    console.error(`[Persistence] Error saving version:`, error);
    throw error;
  }
}

/**
 * Clean Up Old Versions
 * 
 * WHY: Prevent unbounded growth of version history. Keep only 50 most recent.
 * 
 * HOW: Query all versions, if more than 50, delete oldest ones.
 * 
 * @param documentId - Database ID of the document
 */
async function cleanupOldVersions(documentId: string): Promise<void> {
  try {
    // Get all versions ordered by date (newest first)
    const versions = await prisma.documentVersion.findMany({
      where: { documentId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, createdAt: true },
    });
    
    // Defensive check
    if (!versions || !Array.isArray(versions)) {
      return;
    }
    
    // If more than 50 versions, delete oldest ones
    if (versions.length > 50) {
      const versionsToDelete = versions.slice(50); // Everything after 50th
      const idsToDelete = versionsToDelete.map(v => v.id);
      
      await prisma.documentVersion.deleteMany({
        where: {
          id: { in: idsToDelete },
        },
      });
      
      console.log(`[Persistence] Cleaned up ${idsToDelete.length} old versions for ${documentId}`);
    }
  } catch (error) {
    console.error(`[Persistence] Error cleaning up versions:`, error);
    // Don't throw - this is a background cleanup operation
  }
}

/**
 * Load Specific Version
 * 
 * WHY: Allow users to restore a previous version of their document.
 * 
 * HOW: Query DocumentVersion by ID, deserialize and return Yjs document.
 * 
 * @param versionId - Database ID of the version
 * @returns Yjs document with that version's state
 */
export async function loadVersion(versionId: string): Promise<Y.Doc> {
  try {
    // Query for specific version
    const version = await prisma.documentVersion.findUnique({
      where: { id: versionId },
    });
    
    if (!version) {
      throw new Error(`Version ${versionId} not found`);
    }
    
    // Create Yjs document and restore state
    const ydoc = new Y.Doc();
    const state = new Uint8Array(version.yjsState);
    Y.applyUpdate(ydoc, state);
    
    console.log(`[Persistence] Loaded version ${versionId}`);
    
    return ydoc;
  } catch (error) {
    console.error(`[Persistence] Error loading version:`, error);
    throw error;
  }
}

/**
 * Start Auto-Save
 * 
 * WHY: Automatically save document at regular intervals to minimize data loss.
 * 
 * HOW: Set up an interval timer that calls saveYjsDocument periodically.
 * Return the interval handle so it can be stopped later.
 * 
 * @param documentId - Database ID of the document
 * @param ydoc - Yjs document to save
 * @param intervalMs - How often to save (in milliseconds)
 * @returns Interval handle (pass to stopAutoSave to stop)
 */
export function startAutoSave(
  documentId: string,
  ydoc: Y.Doc,
  intervalMs: number = 10000 // Default: 10 seconds
): NodeJS.Timeout {
  console.log(`[Persistence] Starting auto-save for ${documentId} every ${intervalMs}ms`);
  
  const interval = setInterval(async () => {
    try {
      await saveYjsDocument(documentId, ydoc);
    } catch (error) {
      console.error(`[Persistence] Auto-save error:`, error);
      // Don't stop auto-save on error, just log and continue
    }
  }, intervalMs);
  
  return interval;
}

/**
 * Stop Auto-Save
 * 
 * WHY: Clean up interval timer when document is closed or user disconnects.
 * 
 * HOW: Clear the interval using the handle returned by startAutoSave.
 * 
 * @param interval - Interval handle from startAutoSave
 */
export function stopAutoSave(interval: NodeJS.Timeout): void {
  clearInterval(interval);
  console.log(`[Persistence] Stopped auto-save`);
}

/**
 * Get Version History
 * 
 * WHY: Show users a list of available versions they can restore.
 * 
 * HOW: Query all versions for a document, return metadata (not full state).
 * 
 * @param documentId - Database ID of the document
 * @returns Array of version metadata
 */
export async function getVersionHistory(documentId: string) {
  try {
    const versions = await prisma.documentVersion.findMany({
      where: { documentId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        label: true,
        createdAt: true,
      },
    });
    
    return versions;
  } catch (error) {
    console.error(`[Persistence] Error getting version history:`, error);
    throw error;
  }
}

