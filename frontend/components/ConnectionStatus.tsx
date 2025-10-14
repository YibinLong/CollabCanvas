/**
 * Connection Status Component
 * 
 * WHY: Users need visual feedback about their connection to the collaboration server.
 * If disconnected, they should know their changes won't sync to other users.
 * 
 * WHAT IT SHOWS:
 * - Green dot: Connected and syncing
 * - Yellow dot: Connecting...
 * - Red dot: Disconnected or error
 * 
 * WHERE TO USE: Display in the top toolbar or corner of the canvas
 */

'use client'

import { ConnectionStatus as ConnectionStatusType } from '@/lib/useYjsSync'

interface ConnectionStatusProps {
  status: ConnectionStatusType
  error?: string | null
}

/**
 * ConnectionStatus Component
 * 
 * @param status - Current connection status from useYjsSync hook
 * @param error - Optional error message to display
 */
export default function ConnectionStatus({ status, error }: ConnectionStatusProps) {
  /**
   * Get color based on status
   * 
   * WHY: Visual color coding helps users quickly understand the state.
   * - Green = good to go
   * - Yellow = wait a moment
   * - Red = problem
   */
  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'bg-green-500'
      case 'connecting':
        return 'bg-yellow-500'
      case 'disconnected':
      case 'error':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  /**
   * Get status text
   * 
   * WHY: Clear text helps users understand what's happening
   */
  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'Connected'
      case 'connecting':
        return 'Connecting...'
      case 'disconnected':
        return 'Disconnected'
      case 'error':
        return error || 'Connection Error'
      default:
        return 'Unknown'
    }
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Status indicator dot */}
      <div className={`w-2 h-2 rounded-full ${getStatusColor()} ${status === 'connecting' ? 'animate-pulse' : ''}`} />
      
      {/* Status text */}
      <span className="text-xs font-medium text-gray-700">
        {getStatusText()}
      </span>
    </div>
  )
}

