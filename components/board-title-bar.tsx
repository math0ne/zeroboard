"use client"

import React, { useState, useEffect } from "react"
import { Plus, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TitleMarkdownRenderer } from "@/components/title-markdown-renderer"
import { BoardDropdown } from "@/components/board-dropdown"
import type { Board } from "@/lib/default-boards-data"

interface BoardTitleBarProps {
  currentBoardTitle: string
  boardTitleValue: string
  setBoardTitleValue: (value: string) => void
  isEditingBoardTitle: boolean
  setIsEditingBoardTitle: (editing: boolean) => void
  onBoardTitleSave: () => void
  onBoardTitleKeyDown: (e: React.KeyboardEvent) => void
  columnsWidth: number
  isMobile: boolean
  boards: Board[]
  currentBoardId: string
  onAddColumn: () => void
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

export function BoardTitleBar({
  currentBoardTitle,
  boardTitleValue,
  setBoardTitleValue,
  isEditingBoardTitle,
  setIsEditingBoardTitle,
  onBoardTitleSave,
  onBoardTitleKeyDown,
  columnsWidth,
  isMobile,
  boards,
  currentBoardId,
  onAddColumn,
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
}: BoardTitleBarProps) {
  const [isTitleBarHovering, setIsTitleBarHovering] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [showMobileTitleButtons, setShowMobileTitleButtons] = useState(false)

  // Hide mobile title buttons when clicking outside
  useEffect(() => {
    if (isMobile && showMobileTitleButtons) {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as HTMLElement
        if (!target.closest('.mobile-title-bar')) {
          setShowMobileTitleButtons(false)
        }
      }

      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isMobile, showMobileTitleButtons])

  const handleTitleBarClick = (e: React.MouseEvent) => {
    // Only trigger edit if we're not clicking on buttons
    const target = e.target as HTMLElement
    if (target.closest("button") || target.closest('[role="button"]')) {
      return
    }

    // Mobile behavior: first click shows buttons, second click edits
    if (isMobile) {
      if (!showMobileTitleButtons) {
        // First click: show buttons
        setShowMobileTitleButtons(true)
        return
      } else {
        // Second click: hide buttons and start editing
        setShowMobileTitleButtons(false)
        if (!isEditingBoardTitle) {
          setIsEditingBoardTitle(true)
        }
        return
      }
    }

    // Desktop behavior: immediate edit
    if (!isEditingBoardTitle) {
      setIsEditingBoardTitle(true)
    }
  }

  return (
    <div
      className="bg-gray-100 p-2 shadow-sm mb-2 flex items-center cursor-pointer mobile-title-bar"
      style={{ 
        width: `${columnsWidth}px`, 
        height: "36px"
      }}
      onMouseEnter={() => !isMobile && !isEditingBoardTitle && setIsTitleBarHovering(true)}
      onMouseLeave={() => {
        if (!isMobile && !isDropdownOpen) {
          setIsTitleBarHovering(false)
        }
        // Don't hide mobile buttons on mouse leave since mouse events can be unreliable on mobile
      }}
      onClick={handleTitleBarClick}
    >
      <div className="flex-1 min-w-0">
        {isEditingBoardTitle ? (
          <Input
            value={boardTitleValue}
            onChange={(e) => setBoardTitleValue(e.target.value)}
            onBlur={onBoardTitleSave}
            onKeyDown={onBoardTitleKeyDown}
            className="text-xs font-normal h-6 px-1 py-0 border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent text-gray-900 w-full my-1"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <h1 className="font-normal hover:bg-gray-200 px-1 rounded text-sm text-zinc-700 h-6 flex items-center my-1" style={{ paddingTop: '4px', paddingBottom: '2px' }}>
            <TitleMarkdownRenderer content={currentBoardTitle} />
          </h1>
        )}
      </div>

      {(isTitleBarHovering || isDropdownOpen || (isMobile && showMobileTitleButtons)) && !isEditingBoardTitle && (
        <div className="flex items-center gap-1 ml-2 h-8">
          {/* Add Column Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onAddColumn()
            }}
            className="h-6 w-6 p-0 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded flex items-center justify-center"
          >
            <Plus className="h-3 w-3" />
          </Button>

          {/* Custom Board Selector Dropdown */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                setIsDropdownOpen(!isDropdownOpen)
              }}
              className="h-6 w-6 p-0 text-gray-600 hover:text-gray-900 hover:bg-gray-200 text-xs rounded flex items-center justify-center"
            >
              <ChevronDown className="h-3 w-3" />
            </Button>

            <BoardDropdown
              boards={boards}
              currentBoardId={currentBoardId}
              isDropdownOpen={isDropdownOpen}
              setIsDropdownOpen={setIsDropdownOpen}
              onSwitchBoard={onSwitchBoard}
              onDeleteBoard={onDeleteBoard}
              onAddBoard={onAddBoard}
              onExportBoards={onExportBoards}
              onImportBoards={onImportBoards}
              onEnableFirebaseSync={onEnableFirebaseSync}
              onDisableFirebaseSync={onDisableFirebaseSync}
              boardDeleteConfirming={boardDeleteConfirming}
              setBoardDeleteConfirming={setBoardDeleteConfirming}
              isFirebaseConnected={isFirebaseConnected}
              isSyncing={isSyncing}
            />
          </div>
        </div>
      )}
    </div>
  )
}