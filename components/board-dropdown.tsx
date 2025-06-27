"use client"

import React, { useRef, useEffect, useState } from "react"
import { Plus, X, Download, Upload, Cloud, CloudOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TitleMarkdownRenderer } from "@/components/title-markdown-renderer"
import { firebaseSync } from "@/lib/firebase-sync"
import type { Board } from "@/lib/default-boards-data"

interface BoardDropdownProps {
  boards: Board[]
  currentBoardId: string
  isDropdownOpen: boolean
  setIsDropdownOpen: (open: boolean) => void
  onSwitchBoard: (boardId: string) => void
  onDeleteBoard: (e: React.MouseEvent, boardId: string) => void
  onAddBoard: () => void
  onExportBoards: () => void
  onImportBoards: () => void
  onEnableFirebaseSync: () => void
  onDisableFirebaseSync: () => void
  boardDeleteConfirming: string | null
  setBoardDeleteConfirming: (boardId: string | null) => void
  isFirebaseConnected: boolean
  isSyncing: boolean
}

export function BoardDropdown({
  boards,
  currentBoardId,
  isDropdownOpen,
  setIsDropdownOpen,
  onSwitchBoard,
  onDeleteBoard,
  onAddBoard,
  onExportBoards,
  onImportBoards,
  onEnableFirebaseSync,
  onDisableFirebaseSync,
  boardDeleteConfirming,
  setBoardDeleteConfirming,
  isFirebaseConnected,
  isSyncing,
}: BoardDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [hoveredBoardId, setHoveredBoardId] = useState<string | null>(null)

  // Add click outside listener for dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
        setBoardDeleteConfirming(null) // Reset any delete confirmation when closing dropdown
      }
    }

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isDropdownOpen, setIsDropdownOpen, setBoardDeleteConfirming])

  if (!isDropdownOpen) return null

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10 py-1 border border-gray-200"
    >
      {boards.map((board) => (
        <div
          key={board.id}
          className={`relative flex items-center w-full px-4 py-2 text-xs ${
            board.id === currentBoardId ? "bg-gray-100" : "hover:bg-gray-50"
          }`}
          onMouseEnter={() => setHoveredBoardId(board.id)}
          onMouseLeave={() => {
            setHoveredBoardId(null)
            if (boardDeleteConfirming === board.id) {
              setBoardDeleteConfirming(null)
            }
          }}
        >
          <button onClick={() => onSwitchBoard(board.id)} className="text-left flex-1 truncate pr-6">
            <TitleMarkdownRenderer content={board.title} />
          </button>
          {hoveredBoardId === board.id && board.id !== currentBoardId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => onDeleteBoard(e, board.id)}
              className={`absolute right-2 h-4 w-4 p-0 transition-colors duration-200 ${
                boardDeleteConfirming === board.id
                  ? "text-red-600 hover:text-red-700 hover:bg-red-100 bg-red-50"
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              }`}
            >
              <X className="h-2 w-2" />
            </Button>
          )}
        </div>
      ))}
      <div className="border-t border-gray-200 my-1"></div>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onAddBoard()
        }}
        className="w-full text-left px-4 py-2 text-xs text-gray-600 hover:bg-gray-50 flex items-center"
      >
        <Plus className="h-3 w-3 mr-1" />
        Add Board
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onExportBoards()
        }}
        className="w-full text-left px-4 py-2 text-xs text-gray-600 hover:bg-gray-50 flex items-center"
      >
        <Download className="h-3 w-3 mr-1" />
        Export Boards
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onImportBoards()
        }}
        className="w-full text-left px-4 py-2 text-xs text-gray-600 hover:bg-gray-50 flex items-center"
      >
        <Upload className="h-3 w-3 mr-1" />
        Import Boards
      </button>
      
      {/* Firebase Sync Options */}
      {firebaseSync.isAvailable() && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            if (isFirebaseConnected) {
              onDisableFirebaseSync()
            } else {
              onEnableFirebaseSync()
            }
          }}
          disabled={isSyncing}
          className="w-full text-left px-4 py-2 text-xs text-gray-600 hover:bg-gray-50 flex items-center disabled:opacity-50"
        >
          {isSyncing ? (
            <div className="h-3 w-3 mr-1 animate-spin border border-gray-400 border-t-transparent rounded-full" />
          ) : isFirebaseConnected ? (
            <CloudOff className="h-3 w-3 mr-1" />
          ) : (
            <Cloud className="h-3 w-3 mr-1" />
          )}
          {isSyncing ? 'Syncing...' : isFirebaseConnected ? 'Disable Sync' : 'Enable Sync'}
        </button>
      )}
    </div>
  )
}