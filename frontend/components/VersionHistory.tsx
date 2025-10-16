/**
 * Version History Component
 * 
 * WHY: Users need to see a list of previous versions and restore them if needed.
 * This is essential for recovering from mistakes or reverting major changes.
 * 
 * WHAT: A slide-out panel (like Figma's) that displays:
 * - List of all saved versions with timestamps
 * - Restore button for each version
 * - Manual "Save Version" button with optional label
 * 
 * HOW: Fetches versions from backend API, displays in a clean list,
 * and allows one-click restore. When a version is restored, Yjs syncs
 * the change to all connected users in real-time.
 */

'use client'

import { useState, useEffect } from 'react'
import { getVersionHistory, restoreVersion, createVersionSnapshot, deleteAllVersions } from '@/lib/supabase'

/**
 * Type Definition for a Version
 * 
 * WHY: TypeScript ensures we handle version data correctly
 */
interface Version {
  id: string
  label: string | null
  createdAt: string // ISO timestamp from backend
}

/**
 * Component Props
 */
interface VersionHistoryProps {
  documentId: string     // Which document's history to show
  isOpen: boolean         // Whether panel is visible
  onClose: () => void     // Callback to close panel
  onRestore?: () => void  // Optional callback after successful restore
  yjsDoc?: any           // Optional Yjs document to save current state from
}

/**
 * Version History Component
 */
export default function VersionHistory({ documentId, isOpen, onClose, onRestore, yjsDoc }: VersionHistoryProps) {
  const [versions, setVersions] = useState<Version[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [restoringId, setRestoringId] = useState<string | null>(null)
  const [showLabelInput, setShowLabelInput] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [saving, setSaving] = useState(false)
  const [clearing, setClearing] = useState(false)
  
  // New state for inline confirmations
  const [confirmRestoreId, setConfirmRestoreId] = useState<string | null>(null) // Which version is pending restore confirmation
  const [confirmDelete, setConfirmDelete] = useState(false) // Is delete all history pending confirmation
  const [justSaved, setJustSaved] = useState(false) // Show success state briefly after saving

  /**
   * Load Version History
   * 
   * WHY: Fetch versions when panel opens or after changes
   */
  const loadVersions = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await getVersionHistory(documentId)
      
      if (result.success) {
        setVersions(result.versions)
      } else {
        setError(result.error || 'Failed to load version history')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Handle Restore Version - Inline Confirmation Pattern
   * 
   * WHY: User clicks "Restore" button to roll back to a previous version
   * 
   * HOW IT WORKS NOW:
   * - First click: Button turns green "Confirm?" → sets confirmRestoreId
   * - Second click: Actually restores → calls API and reloads page
   * - Click away: Clicking any other version cancels confirmation
   * 
   * WHAT IT DOES:
   * 1. Calls backend API to restore the version
   * 2. Backend updates the document's Yjs state in database
   * 3. Reloads the page to sync with the restored state
   * 
   * NOTE: We reload the page because Yjs keeps the document in memory.
   * Simply updating the database doesn't automatically sync to connected clients.
   * Reloading forces a fresh connection and loads the restored state.
   */
  const handleRestoreClick = async (versionId: string) => {
    // Clear any other pending confirmations
    setConfirmDelete(false)
    
    // If this version is NOT already in confirmation state, enter confirmation
    if (confirmRestoreId !== versionId) {
      setConfirmRestoreId(versionId)
      return
    }

    // If we're here, user clicked "Confirm?" - actually restore now
    setRestoringId(versionId)
    setConfirmRestoreId(null) // Clear confirmation state
    setError(null)

    try {
      const result = await restoreVersion(documentId, versionId)
      
      if (result.success) {
        // Call the onRestore callback if provided (parent will handle reload)
        if (onRestore) {
          onRestore()
        } else {
          // Fallback: reload page if no callback provided
          window.location.reload()
        }
      } else {
        setError(result.error || 'Failed to restore version')
        setRestoringId(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setRestoringId(null)
    }
    // Don't reset restoringId here - page will reload anyway
  }

  /**
   * Handle Manual Save Version
   * 
   * WHY: User wants to manually save a snapshot at an important milestone
   * 
   * IMPORTANT: We pass the Yjs document so we save the actual current canvas state,
   * not whatever might be stale in the database.
   * 
   * SUCCESS FEEDBACK: Instead of alert, button briefly shows "Saved!" with check mark
   */
  const handleSaveVersion = async () => {
    setSaving(true)
    setError(null)

    try {
      // Pass the Yjs doc to ensure we save the current canvas state
      const result = await createVersionSnapshot(documentId, newLabel || undefined, yjsDoc)
      
      if (result.success) {
        setNewLabel('')
        setShowLabelInput(false)
        
        // Show success state briefly
        setJustSaved(true)
        setTimeout(() => setJustSaved(false), 2000) // Hide after 2 seconds
        
        await loadVersions()
      } else {
        setError(result.error || 'Failed to save version')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSaving(false)
    }
  }

  /**
   * Handle Delete All Versions - Inline Confirmation Pattern
   * 
   * WHY: User clicks "Delete All History" to clear every version snapshot.
   * 
   * HOW IT WORKS NOW:
   * - First click: Button turns red "Confirm Delete?" → sets confirmDelete
   * - Second click: Actually deletes → calls API
   * - No alert popup needed, action happens inline
   */
  const handleDeleteAllClick = async () => {
    // Clear any other pending confirmations
    setConfirmRestoreId(null)
    
    // If not in confirmation state, enter confirmation
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }

    // If we're here, user clicked "Confirm Delete?" - actually delete now
    setClearing(true)
    setConfirmDelete(false) // Clear confirmation state
    setError(null)

    try {
      const result = await deleteAllVersions(documentId)

      if (result.success) {
        // Reload versions - list should now be empty
        await loadVersions()
      } else {
        setError(result.error || 'Failed to delete version history')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setClearing(false)
    }
  }

  /**
   * Load versions when panel opens
   * Also clear any pending confirmations when opening/closing
   */
  useEffect(() => {
    if (isOpen) {
      loadVersions()
      // Clear any stale confirmation states when opening
      setConfirmRestoreId(null)
      setConfirmDelete(false)
    } else {
      // Clear confirmations when closing too
      setConfirmRestoreId(null)
      setConfirmDelete(false)
    }
  }, [isOpen, documentId])

  /**
   * Format Timestamp
   * 
   * WHY: Convert ISO timestamp to human-readable format
   * Example: "2 hours ago" or "March 15 at 3:45 PM"
   */
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    // Recent times: "2 minutes ago", "3 hours ago"
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`

    // Older times: "March 15 at 3:45 PM"
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  /**
   * Get Badge Color for Version Number
   * 
   * WHY: Each version gets a unique color badge so users can easily
   * identify which version they're looking at or restoring from.
   * 
   * WHAT: Cycles through a palette of distinct colors
   */
  const getBadgeColor = (index: number): string => {
    const colors = [
      'bg-blue-500',    // Blue
      'bg-purple-500',  // Purple
      'bg-pink-500',    // Pink
      'bg-green-500',   // Green
      'bg-yellow-500',  // Yellow
      'bg-orange-500',  // Orange
      'bg-red-500',     // Red
      'bg-teal-500',    // Teal
      'bg-indigo-500',  // Indigo
      'bg-cyan-500',    // Cyan
    ]
    return colors[index % colors.length]
  }

  // Don't render if panel is closed
  if (!isOpen) return null

  return (
    <>
      {/* Backdrop Overlay - Click to close */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-40 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Slide-out Panel - Figma Style */}
      <div className="fixed right-0 top-0 bottom-0 w-80 bg-gray-800 border-l border-gray-700 z-50 flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-white font-semibold text-sm">Version History</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            title="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Save Version Button */}
        <div className="px-4 py-3 border-b border-gray-700 space-y-2">
          {!showLabelInput ? (
            <button
              onClick={() => {
                setShowLabelInput(true)
                // Clear any pending confirmations when starting a new action
                setConfirmRestoreId(null)
                setConfirmDelete(false)
              }}
              disabled={justSaved}
              className={`w-full px-3 py-2 text-white text-sm font-medium rounded transition-colors flex items-center justify-center gap-2 ${
                justSaved 
                  ? 'bg-green-600 cursor-default' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {justSaved ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Saved!
                </>
              ) : (
                '+ Save Current Version'
              )}
            </button>
          ) : (
            <div className="space-y-2">
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Label (optional)"
                className="w-full px-3 py-2 bg-gray-700 text-white text-sm border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveVersion()
                  if (e.key === 'Escape') {
                    setShowLabelInput(false)
                    setNewLabel('')
                  }
                }}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveVersion}
                  disabled={saving}
                  className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-sm rounded transition-colors"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => {
                    setShowLabelInput(false)
                    setNewLabel('')
                  }}
                  className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Delete All History Button - Changes to red "Confirm Delete?" on first click */}
          <button
            onClick={handleDeleteAllClick}
            disabled={clearing || versions.length === 0}
            className={`w-full px-3 py-2 disabled:bg-gray-800 disabled:text-gray-500 text-white text-sm font-medium rounded transition-colors flex items-center justify-center gap-2 ${
              confirmDelete
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            {clearing ? (
              'Deleting...'
            ) : confirmDelete ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Confirm Delete?
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete All History
              </>
            )}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="px-4 py-2 bg-red-900 bg-opacity-50 border-b border-red-700">
            <p className="text-red-300 text-xs">{error}</p>
          </div>
        )}

        {/* Version List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-400 text-sm">Loading versions...</div>
            </div>
          ) : versions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <svg className="w-12 h-12 text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-400 text-sm mb-1">No versions yet</p>
              <p className="text-gray-500 text-xs">Click "Save Current Version" to create your first snapshot</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-700">
              {versions.map((version, index) => {
                // Check if this version is in confirmation state
                const isConfirming = confirmRestoreId === version.id
                const isRestoring = restoringId === version.id
                
                // Version number: oldest = #1, newest = highest number
                // Since versions array is newest first, we reverse the numbering
                const versionNumber = versions.length - index
                const badgeColor = getBadgeColor(versions.length - index - 1) // Color still based on age
                
                return (
                  <div
                    key={version.id}
                    className="px-4 py-3 hover:bg-gray-750 transition-colors group"
                  >
                    <div className="flex items-start gap-3">
                      {/* Numbered Badge - Colorful ID on the left with text stroke for readability */}
                      <div 
                        className={`flex-shrink-0 w-8 h-8 ${badgeColor} rounded-full flex items-center justify-center shadow-md`}
                        title={`Version #${versionNumber}`}
                        style={{
                          textShadow: '0 0 2px black, 0 0 2px black, 0 0 2px black, 0 0 2px black'
                        }}
                      >
                        <span className="text-white text-xs font-bold">{versionNumber}</span>
                      </div>

                      {/* Version Info */}
                      <div className="flex-1 min-w-0">
                        {/* Label or default text - with text wrapping */}
                        {/* Special rendering for "Restored from #X" labels */}
                        {version.label && version.label.startsWith('Restored from #') ? (
                          <div className="flex items-center gap-1.5 flex-wrap leading-tight">
                            <span className="text-white text-sm font-medium">Restored from</span>
                            {(() => {
                              // Extract the version number from "Restored from #5 (label)" or "Restored from #5 (date)"
                              const match = version.label.match(/Restored from #(\d+) \((.+)\)/)
                              if (match) {
                                const restoredVersionNum = parseInt(match[1])
                                const restoredLabel = match[2]
                                const restoredBadgeColor = getBadgeColor(restoredVersionNum - 1)
                                
                                return (
                                  <>
                                    {/* Mini colored badge for the restored version - no shadow */}
                                    <div 
                                      className={`flex-shrink-0 w-5 h-5 ${restoredBadgeColor} rounded-full flex items-center justify-center`}
                                      title={`Version #${restoredVersionNum}`}
                                      style={{
                                        textShadow: '0 0 2px black, 0 0 2px black, 0 0 2px black, 0 0 2px black'
                                      }}
                                    >
                                      <span className="text-white text-[10px] font-bold leading-none">{restoredVersionNum}</span>
                                    </div>
                                    <span className="text-white text-sm font-medium break-words">
                                      ({restoredLabel})
                                    </span>
                                  </>
                                )
                              }
                              return <span className="text-white text-sm font-medium break-words">{version.label}</span>
                            })()}
                          </div>
                        ) : (
                          <p className="text-white text-sm font-medium break-words leading-tight">
                            {version.label || 'Untitled version'}
                          </p>
                        )}
                        
                        {/* Timestamp */}
                        <p className="text-gray-400 text-xs mt-0.5">
                          {formatTime(version.createdAt)}
                        </p>
                      </div>

                      {/* Restore Button - Changes to green "Confirm?" on first click */}
                      <button
                        onClick={() => handleRestoreClick(version.id)}
                        disabled={isRestoring}
                        className={`flex-shrink-0 px-2.5 py-1 text-white text-xs rounded transition-colors disabled:opacity-50 ${
                          isConfirming
                            ? 'bg-green-600 hover:bg-green-700 opacity-100' // Green and always visible when confirming
                            : 'bg-gray-700 hover:bg-gray-600 opacity-0 group-hover:opacity-100' // Normal gray, shows on hover
                        }`}
                        title={isConfirming ? 'Click to confirm restore' : 'Restore this version'}
                      >
                        {isRestoring ? 'Restoring...' : isConfirming ? 'Confirm?' : 'Restore'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="px-4 py-2 border-t border-gray-700 bg-gray-850">
          <p className="text-gray-500 text-xs text-center">
            Up to 50 versions are kept automatically
          </p>
        </div>
      </div>
    </>
  )
}

