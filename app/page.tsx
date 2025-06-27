"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { flushSync } from "react-dom"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { KanbanColumn } from "@/components/kanban-column"
import { BoardTitleBar } from "@/components/board-title-bar"
import { ensureBoardOrder } from "@/lib/board-utils"
import { useFirebaseSync } from "@/hooks/use-firebase-sync"
import { useImportExport } from "@/hooks/use-import-export"
import { defaultBoards, type Card, type Column, type Board } from "@/lib/default-boards-data"



export default function KanbanBoard() {
  const [isLoading, setIsLoading] = useState(true)
  const [boards, setBoards] = useState<Board[]>([])
  const [currentBoardId, _setCurrentBoardId] = useState("zeroboard-showcase")
  
  // Wrap setCurrentBoardId with debugging
  const setCurrentBoardId = useCallback((newId: string) => {
    console.log(`🔥 setCurrentBoardId called: ${currentBoardId} -> ${newId}`)
    console.trace('Call stack:')
    _setCurrentBoardId(newId)
  }, [currentBoardId])
  const [currentBoardTitle, setCurrentBoardTitle] = useState("**Personal** *Kanban* Notes")
  const [isEditingBoardTitle, setIsEditingBoardTitle] = useState(false)
  const [boardTitleValue, setBoardTitleValue] = useState("")
  const [boardDeleteConfirming, setBoardDeleteConfirming] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  // Firebase sync hook - optional cloud sync
  const {
    isFirebaseConnected,
    isSyncing,
    isEnablingSync,
    showSyncDataModal,
    syncModalData,
    enableFirebaseSync,
    disableFirebaseSync,
    setShowSyncDataModal
  } = useFirebaseSync(
    boards,
    setBoards,
    currentBoardId,
    setCurrentBoardId,
    setCurrentBoardTitle,
    isLoading
  )

  // Import/Export hook
  const {
    fileInputRef,
    exportBoards,
    handleImportFile,
    triggerImport
  } = useImportExport(
    boards,
    currentBoardId,
    setBoards,
    setCurrentBoardId,
    setCurrentBoardTitle
  )


  const currentBoard = (() => {
    const found = boards.find((board) => board.id === currentBoardId)
    const fallback = boards[0] || defaultBoards[0]
    const result = found || fallback
    
    if (!found && boards.length > 0) {
      console.log(`⚠️ Current board '${currentBoardId}' not found in boards:`, boards.map(b => b.id))
      console.log(`Using fallback board: ${result?.id}`)
    }
    
    return result
  })()

  // Load data from localStorage on mount
  useEffect(() => {
    console.log('🚀 localStorage loading useEffect triggered')
    const saved = localStorage.getItem("kanban-notes")
    if (saved) {
      try {
        const data = JSON.parse(saved)
        const loadedBoards = ensureBoardOrder(data.boards || defaultBoards)
        const loadedBoardId = data.currentBoardId || "personal"
        const loadedBoard = loadedBoards.find((board: Board) => board.id === loadedBoardId) || loadedBoards[0]
        
        console.log('📦 Loading from localStorage:', {
          boardCount: loadedBoards.length,
          loadedBoardId,
          currentTitle: loadedBoard.title
        })
        setBoards(loadedBoards)
        setCurrentBoardId(loadedBoardId)
        setCurrentBoardTitle(loadedBoard.title)
      } catch (error) {
        console.log('❌ Failed to load from localStorage, using default boards')
        setBoards(ensureBoardOrder(defaultBoards))
      }
    } else {
      console.log('📭 No localStorage data found, using default boards')
      setBoards(ensureBoardOrder(defaultBoards))
    }
    // Always set loading to false after checking localStorage
    setIsLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Save to localStorage whenever boards or current board change
  useEffect(() => {
    // Only save if we have boards and we're not in loading state
    if (!isLoading && boards.length > 0) {
      console.log('Auto-saving to localStorage:', {
        boardCount: boards.length, 
        boardIds: boards.map(b => b.id),
        currentBoardId
      })
      localStorage.setItem("kanban-notes", JSON.stringify({ boards, currentBoardId }))
    } else {
      console.log('Skipping localStorage save:', { 
        isLoading, 
        boardsLength: boards.length 
      })
    }
  }, [boards, currentBoardId, isLoading])


  // Update board title value when current board title changes
  useEffect(() => {
    setBoardTitleValue(currentBoardTitle)
  }, [currentBoardTitle])

  // Update document title when current board title changes
  useEffect(() => {
    // Strip markdown formatting and special characters from title for browser tab
    const stripMarkdown = (text: string) => {
      return text
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold **text**
        .replace(/\*(.*?)\*/g, '$1')     // Remove italic *text*
        .replace(/`(.*?)`/g, '$1')       // Remove inline code `text`
        .replace(/#{1,6}\s?/g, '')       // Remove headers # text
        .replace(/[^\w\s]/g, '')         // Remove all special characters except letters, numbers, and spaces
        .replace(/\s+/g, ' ')            // Replace multiple spaces with single space
        .trim()
    }
    
    const cleanTitle = stripMarkdown(currentBoardTitle)
    document.title = `zeroboard - ${cleanTitle}`
  }, [currentBoardTitle])


  // Track currentBoardId changes for debugging
  useEffect(() => {
    console.log(`📍 currentBoardId changed to: ${currentBoardId}`)
    console.trace('currentBoardId change stack trace:')
  }, [currentBoardId])

  // Detect and fix React state vs localStorage mismatches
  useEffect(() => {
    if (!isLoading) {
      const saved = localStorage.getItem("kanban-notes")
      if (saved) {
        try {
          const data = JSON.parse(saved)
          const savedCurrentBoardId = data.currentBoardId
          
          if (savedCurrentBoardId && savedCurrentBoardId !== currentBoardId) {
            console.log(`🔧 MISMATCH DETECTED! React state: ${currentBoardId}, localStorage: ${savedCurrentBoardId}`)
            console.log('🔧 Fixing by reloading from localStorage...')
            
            // Fix the mismatch by updating React state to match localStorage
            setCurrentBoardId(savedCurrentBoardId)
            
            // Also update boards and title if needed
            if (data.boards) {
              const savedBoard = data.boards.find((b: Board) => b.id === savedCurrentBoardId)
              if (savedBoard) {
                setCurrentBoardTitle(savedBoard.title)
              }
            }
          }
        } catch (error) {
          console.log('🔧 Error checking localStorage mismatch:', error)
        }
      }
    }
  }, [currentBoardId, isLoading, setCurrentBoardId])

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 459)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])


  const handleBoardTitleSave = () => {
    if (boardTitleValue.trim()) {
      const newTitle = boardTitleValue.trim()
      setBoards(
        boards.map((board) => (board.id === currentBoardId ? { ...board, title: newTitle } : board)),
      )
      setCurrentBoardTitle(newTitle) // Update the dedicated title state
    } else {
      setBoardTitleValue(currentBoardTitle) // Reset if empty
    }
    setIsEditingBoardTitle(false)
  }

  const handleBoardTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleBoardTitleSave()
    } else if (e.key === "Escape") {
      setBoardTitleValue(currentBoardTitle)
      setIsEditingBoardTitle(false)
    }
  }

  const addBoard = () => {
    const timestamp = Date.now()
    const newBoard: Board = {
      id: `board-${timestamp}`,
      title: `New Board ${boards.length + 1}`,
      order: boards.length,
      columns: [
        {
          id: `column-${timestamp}-1`,
          title: "To Do",
          color: "bg-gray-100",
          cards: [],
        },
        {
          id: `column-${timestamp}-2`,
          title: "In Progress",
          color: "bg-gray-100",
          cards: [],
        },
        {
          id: `column-${timestamp}-3`,
          title: "Done",
          color: "bg-gray-100",
          cards: [],
        },
      ],
    }

    setBoards([...boards, newBoard])
    setCurrentBoardId(newBoard.id)
    setCurrentBoardTitle(newBoard.title)
  }




  const switchBoard = (boardId: string) => {
    const targetBoard = boards.find((board) => board.id === boardId) || boards[0]
    setCurrentBoardId(boardId)
    setCurrentBoardTitle(targetBoard.title)
    setBoardDeleteConfirming(null)
  }

  const handleDeleteBoardClick = (e: React.MouseEvent, boardId: string) => {
    e.stopPropagation() // Prevent switching to the board when clicking delete

    if (boardDeleteConfirming === boardId) {
      // Second click - actually delete the board
      if (boards.length > 1) {
        const newBoards = boards.filter((board) => board.id !== boardId)
        setBoards(newBoards)

        // If we're deleting the current board, switch to another one
        if (boardId === currentBoardId) {
          setCurrentBoardId(newBoards[0].id)
          setCurrentBoardTitle(newBoards[0].title)
        }
      } else {
        // Don't allow deleting the last board
        alert("Cannot delete the last board")
      }
      setBoardDeleteConfirming(null)
    } else {
      // First click - enter confirmation mode
      setBoardDeleteConfirming(boardId)
      // Reset confirmation after 3 seconds if not clicked again
      setTimeout(() => {
        setBoardDeleteConfirming(null)
      }, 3000)
    }
  }

  const handleDragEnd = (result: any) => {
    if (!result.destination) return

    const { source, destination, type } = result

    // Handle column reordering
    if (type === 'COLUMN') {
      const newColumns = Array.from(currentBoard.columns)
      const [reorderedColumn] = newColumns.splice(source.index, 1)
      newColumns.splice(destination.index, 0, reorderedColumn)

      setBoards(boards.map((board) => 
        board.id === currentBoardId ? { ...board, columns: newColumns } : board
      ))
      return
    }

    // Handle card reordering/moving (existing logic)
    if (source.droppableId === destination.droppableId) {
      // Reordering within the same column
      const column = currentBoard.columns.find((col) => col.id === source.droppableId)
      if (!column) return

      const newCards = Array.from(column.cards)
      const [reorderedCard] = newCards.splice(source.index, 1)
      newCards.splice(destination.index, 0, reorderedCard)

      const newColumns = currentBoard.columns.map((col) =>
        col.id === source.droppableId ? { ...col, cards: newCards } : col,
      )

      setBoards(boards.map((board) => (board.id === currentBoardId ? { ...board, columns: newColumns } : board)))
    } else {
      // Moving between columns
      const sourceColumn = currentBoard.columns.find((col) => col.id === source.droppableId)
      const destColumn = currentBoard.columns.find((col) => col.id === destination.droppableId)

      if (!sourceColumn || !destColumn) return

      const sourceCards = Array.from(sourceColumn.cards)
      const destCards = Array.from(destColumn.cards)
      const [movedCard] = sourceCards.splice(source.index, 1)
      destCards.splice(destination.index, 0, movedCard)

      const newColumns = currentBoard.columns.map((col) => {
        if (col.id === source.droppableId) {
          return { ...col, cards: sourceCards }
        }
        if (col.id === destination.droppableId) {
          return { ...col, cards: destCards }
        }
        return col
      })

      setBoards(boards.map((board) => (board.id === currentBoardId ? { ...board, columns: newColumns } : board)))
    }
  }

  const addColumn = () => {
    const newColumn: Column = {
      id: `column-${Date.now()}`,
      title: `Column ${currentBoard.columns.length + 1}`,
      color: "bg-gray-100",
      cards: [],
    }

    const newColumns = [...currentBoard.columns, newColumn]
    setBoards(boards.map((board) => (board.id === currentBoardId ? { ...board, columns: newColumns } : board)))
  }

  const updateColumn = (columnId: string, updates: Partial<Column>) => {
    const newColumns = currentBoard.columns.map((col) => (col.id === columnId ? { ...col, ...updates } : col))
    setBoards(boards.map((board) => (board.id === currentBoardId ? { ...board, columns: newColumns } : board)))
  }

  const deleteColumn = (columnId: string) => {
    const newColumns = currentBoard.columns.filter((col) => col.id !== columnId)
    setBoards(boards.map((board) => (board.id === currentBoardId ? { ...board, columns: newColumns } : board)))
  }

  const addCard = (columnId: string, card: Omit<Card, "id" | "createdAt" | "updatedAt">) => {
    const newCard: Card = {
      ...card,
      id: `card-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const newColumns = currentBoard.columns.map((col) =>
      col.id === columnId ? { ...col, cards: [...col.cards, newCard] } : col,
    )
    setBoards(boards.map((board) => (board.id === currentBoardId ? { ...board, columns: newColumns } : board)))
  }

  const moveCard = (columnId: string, cardId: string, direction: 'up' | 'down') => {
    const newColumns = currentBoard.columns.map((col) => {
      if (col.id === columnId) {
        const cardIndex = col.cards.findIndex((card) => card.id === cardId)
        if (cardIndex === -1) return col
        
        const newCards = [...col.cards]
        
        if (direction === 'up' && cardIndex > 0) {
          // Move card up (swap with previous card)
          [newCards[cardIndex], newCards[cardIndex - 1]] = [newCards[cardIndex - 1], newCards[cardIndex]]
        } else if (direction === 'down' && cardIndex < newCards.length - 1) {
          // Move card down (swap with next card)
          [newCards[cardIndex], newCards[cardIndex + 1]] = [newCards[cardIndex + 1], newCards[cardIndex]]
        }
        
        return { ...col, cards: newCards }
      }
      return col
    })
    
    setBoards(boards.map((board) => (board.id === currentBoardId ? { ...board, columns: newColumns } : board)))
  }

  const moveColumn = (columnId: string, direction: 'up' | 'down') => {
    const columnIndex = currentBoard.columns.findIndex((col) => col.id === columnId)
    if (columnIndex === -1) return
    
    const newColumns = [...currentBoard.columns]
    
    if (direction === 'up' && columnIndex > 0) {
      // Move column up (swap with previous column)
      [newColumns[columnIndex], newColumns[columnIndex - 1]] = [newColumns[columnIndex - 1], newColumns[columnIndex]]
    } else if (direction === 'down' && columnIndex < newColumns.length - 1) {
      // Move column down (swap with next column)
      [newColumns[columnIndex], newColumns[columnIndex + 1]] = [newColumns[columnIndex + 1], newColumns[columnIndex]]
    }
    
    setBoards(boards.map((board) => (board.id === currentBoardId ? { ...board, columns: newColumns } : board)))
  }

  const updateCard = (columnId: string, cardId: string, updates: Partial<Card>) => {
    const newColumns = currentBoard.columns.map((col) =>
      col.id === columnId
        ? {
            ...col,
            cards: col.cards.map((card) =>
              card.id === cardId ? { ...card, ...updates, updatedAt: new Date().toISOString() } : card,
            ),
          }
        : col,
    )
    setBoards(boards.map((board) => (board.id === currentBoardId ? { ...board, columns: newColumns } : board)))
  }

  const deleteCard = (columnId: string, cardId: string) => {
    const newColumns = currentBoard.columns.map((col) =>
      col.id === columnId ? { ...col, cards: col.cards.filter((card) => card.id !== cardId) } : col,
    )
    setBoards(boards.map((board) => (board.id === currentBoardId ? { ...board, columns: newColumns } : board)))
  }


  // Calculate the total width of all columns - recalculated on every render
  const columnsWidth = currentBoard.columns.length * 288 + (currentBoard.columns.length - 1) * 8 // 288px per column (w-72) + 8px gap between columns

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  // Show empty state if no boards available
  if (!boards || boards.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-500">Initializing boards...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white p-4 mobile-container">
      {/* Hidden file input for import */}
      <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportFile} style={{ display: "none" }} />

      <div className="flex justify-center overflow-x-auto mobile-wrapper">
        <div className="inline-block mobile-wrapper">
          {/* Board Title Bar - Width matches columns */}
          <BoardTitleBar
            currentBoardTitle={currentBoardTitle}
            boardTitleValue={boardTitleValue}
            setBoardTitleValue={setBoardTitleValue}
            isEditingBoardTitle={isEditingBoardTitle}
            setIsEditingBoardTitle={setIsEditingBoardTitle}
            onBoardTitleSave={handleBoardTitleSave}
            onBoardTitleKeyDown={handleBoardTitleKeyDown}
            columnsWidth={columnsWidth}
            isMobile={isMobile}
            boards={boards}
            currentBoardId={currentBoardId}
            onAddColumn={addColumn}
            onSwitchBoard={switchBoard}
            onDeleteBoard={handleDeleteBoardClick}
            onAddBoard={addBoard}
            onExportBoards={exportBoards}
            onImportBoards={triggerImport}
            onEnableFirebaseSync={enableFirebaseSync}
            onDisableFirebaseSync={disableFirebaseSync}
            boardDeleteConfirming={boardDeleteConfirming}
            setBoardDeleteConfirming={setBoardDeleteConfirming}
            isFirebaseConnected={isFirebaseConnected}
            isSyncing={isSyncing}
          />

          {isMobile ? (
            // Mobile: No drag and drop - use up/down buttons instead
            <div className="flex gap-2 pb-4 min-w-fit mobile-columns-container">
              {currentBoard.columns.map((column, index) => (
                <div key={column.id} className="flex-shrink-0 w-72 min-w-[18rem] mobile-column">
                  <KanbanColumn
                    column={column}
                    onUpdateColumn={updateColumn}
                    onDeleteColumn={deleteColumn}
                    onAddCard={addCard}
                    onUpdateCard={updateCard}
                    onDeleteCard={deleteCard}
                    onMoveCardUp={(columnId, cardId) => moveCard(columnId, cardId, 'up')}
                    onMoveCardDown={(columnId, cardId) => moveCard(columnId, cardId, 'down')}
                    onMoveColumnUp={index > 0 ? () => moveColumn(column.id, 'up') : undefined}
                    onMoveColumnDown={index < currentBoard.columns.length - 1 ? () => moveColumn(column.id, 'down') : undefined}
                    canMoveUp={index > 0}
                    canMoveDown={index < currentBoard.columns.length - 1}
                    dragHandleProps={null}
                    isMobile={isMobile}
                  />
                </div>
              ))}
            </div>
          ) : (
            // Desktop: Full drag and drop functionality
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="columns" direction="horizontal" type="COLUMN">
                {(provided) => (
                  <div 
                    className="flex gap-2 pb-4 min-w-fit mobile-columns-container"
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    {currentBoard.columns.map((column, index) => (
                      <Draggable key={column.id} draggableId={column.id} index={index}>
                        {(provided, snapshot) => (
                          <div 
                            key={column.id} 
                            className={`flex-shrink-0 w-72 min-w-[18rem] mobile-column ${snapshot.isDragging ? 'opacity-70 rotate-2' : ''}`}
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                          >
                            <KanbanColumn
                              column={column}
                              onUpdateColumn={updateColumn}
                              onDeleteColumn={deleteColumn}
                              onAddCard={addCard}
                              onUpdateCard={updateCard}
                              onDeleteCard={deleteCard}
                              dragHandleProps={provided.dragHandleProps}
                              isMobile={isMobile}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </div>
      </div>

      {/* Sync Data Selection Modal */}
      <Dialog open={showSyncDataModal} onOpenChange={setShowSyncDataModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Cloud Data Found</DialogTitle>
            <DialogDescription>
              We found existing data in the cloud. Choose which data to keep:
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {syncModalData?.cloudBoards || 0}
                </div>
                <div className="text-sm text-gray-600">Cloud Boards</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {syncModalData?.localBoards || 0}
                </div>
                <div className="text-sm text-gray-600">Local Boards</div>
              </div>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => syncModalData?.onConfirm(false)}
            >
              Keep Local Data
              <span className="text-xs text-gray-500 block">(Replace cloud)</span>
            </Button>
            <Button
              onClick={() => syncModalData?.onConfirm(true)}
            >
              Use Cloud Data
              <span className="text-xs text-gray-500 block">(Replace local)</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
