/**
 * Document Type Definitions
 * 
 * WHY: Defines the structure of documents stored in the database.
 * 
 * WHAT: Documents represent saved canvas states that users can open and edit.
 */

export interface Document {
  id: string;
  title: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  snapshot: Uint8Array; // Serialized Yjs document state
  createdAt: Date;
}

