"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Droppable, Draggable } from "@hello-pangea/dnd"
import { Plus, X, ArrowUp, ArrowDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { NoteCard } from "./note-card"
import type { Column, Card } from "../app/page"
import { TitleMarkdownRenderer } from "@/components/title-markdown-renderer"

interface KanbanColumnProps {
  column: Column
  onUpdateColumn: (columnId: string, updates: Partial<Column>) => void
  onDeleteColumn: (columnId: string) => void
  onAddCard: (columnId: string, card: Omit<Card, "id" | "createdAt" | "updatedAt">) => void
  onUpdateCard: (columnId: string, cardId: string, updates: Partial<Card>) => void
  onDeleteCard: (columnId: string, cardId: string) => void
  onMoveCardUp?: (columnId: string, cardId: string) => void
  onMoveCardDown?: (columnId: string, cardId: string) => void
  onMoveColumnUp?: () => void
  onMoveColumnDown?: () => void
  canMoveUp?: boolean
  canMoveDown?: boolean
  dragHandleProps?: any
  isMobile: boolean
}

export function KanbanColumn({
  column,
  onUpdateColumn,
  onDeleteColumn,
  onAddCard,
  onUpdateCard,
  onDeleteCard,
  onMoveCardUp,
  onMoveCardDown,
  onMoveColumnUp,
  onMoveColumnDown,
  canMoveUp,
  canMoveDown,
  dragHandleProps,
  isMobile,
}: KanbanColumnProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState(column.title)
  const [isHovering, setIsHovering] = useState(false)
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false)
  const [showMobileButtons, setShowMobileButtons] = useState(false)

  // Hide mobile buttons when clicking outside
  useEffect(() => {
    if (isMobile && showMobileButtons) {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as HTMLElement
        if (!target.closest(`[data-column-id="${column.id}"]`)) {
          setShowMobileButtons(false)
        }
      }

      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isMobile, showMobileButtons, column.id])

  const handleAddCard = () => {
    // Create a new blank card that will be in edit mode
    const newCard: Omit<Card, "id" | "createdAt" | "updatedAt"> = {
      title: "New Card",
      content: "",
      color: "white",
      tags: [],
      collapsed: false,
      plain: false,
    }

    onAddCard(column.id, newCard)
  }

  const handleTitleSave = () => {
    if (titleValue.trim()) {
      onUpdateColumn(column.id, { title: titleValue.trim() })
    } else {
      setTitleValue(column.title) // Reset if empty
    }
    setIsEditingTitle(false)
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTitleSave()
    } else if (e.key === "Escape") {
      setTitleValue(column.title)
      setIsEditingTitle(false)
    }
  }

  const handleTitleClick = () => {
    // Mobile behavior: first click shows buttons, second click edits
    if (isMobile) {
      if (!showMobileButtons) {
        // First click: show buttons
        setShowMobileButtons(true)
        return
      } else {
        // Second click: hide buttons and start editing
        setShowMobileButtons(false)
        setIsEditingTitle(true)
        return
      }
    }

    // Desktop behavior: immediate edit
    setIsEditingTitle(true)
  }

  const handleDeleteClick = () => {
    if (isDeleteConfirming) {
      // Second click - actually delete the column
      onDeleteColumn(column.id)
    } else {
      // First click - enter confirmation mode
      setIsDeleteConfirming(true)
      // Reset confirmation after 3 seconds if not clicked again
      setTimeout(() => {
        setIsDeleteConfirming(false)
      }, 3000)
    }
  }

  const handleMouseLeave = () => {
    setIsHovering(false)
    // Reset delete confirmation when mouse leaves the column
    setIsDeleteConfirming(false)
    // Note: Don't hide mobile buttons on mouse leave since mouse events can be unreliable on mobile
  }

  return (
    <div className="flex-shrink-0 w-72 min-w-[18rem] mobile-column">
      <div className="bg-gray-100 p-2 shadow-sm">
        <div
          className="flex items-center justify-between mb-2"
          data-column-id={column.id}
          onMouseEnter={() => !isMobile && setIsHovering(true)}
          onMouseLeave={() => !isMobile && handleMouseLeave()}
        >
          {isEditingTitle ? (
            <Input
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={handleTitleKeyDown}
              className="text-sm font-normal h-6 px-1 py-0.5 border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
              autoFocus
            />
          ) : (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center flex-1">
                <h2
                  {...dragHandleProps}
                  className="font-normal text-gray-700 cursor-pointer hover:bg-gray-200 px-1 py-0.5 rounded flex-1 text-sm h-6 flex items-center"
                  onClick={handleTitleClick}
                >
                  <TitleMarkdownRenderer content={column.title} />
                </h2>
              </div>
              {(isHovering || (isMobile && showMobileButtons)) && (
                <div className="flex">
                  {/* Mobile column movement buttons - show to the left of add/delete */}
                  {isMobile && (onMoveColumnUp || onMoveColumnDown) && (
                    <>
                      {onMoveColumnUp && canMoveUp && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            onMoveColumnUp()
                          }}
                          className="h-4 w-4 p-0 text-gray-600 hover:text-gray-900 hover:bg-gray-200 mr-1"
                          title="Move column up"
                        >
                          <ArrowUp className="h-2 w-2" />
                        </Button>
                      )}
                      {onMoveColumnDown && canMoveDown && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            onMoveColumnDown()
                          }}
                          className="h-4 w-4 p-0 text-gray-600 hover:text-gray-900 hover:bg-gray-200 mr-1"
                          title="Move column down"
                        >
                          <ArrowDown className="h-2 w-2" />
                        </Button>
                      )}
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleAddCard}
                    className="h-4 w-4 p-0 text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                  >
                    <Plus className="h-2 w-2" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDeleteClick}
                    className={`h-4 w-4 p-0 ml-1 transition-colors duration-200 ${
                      isDeleteConfirming
                        ? "text-red-600 hover:text-red-700 hover:bg-red-100 bg-red-50"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                    }`}
                  >
                    <X className="h-2 w-2" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {isMobile ? (
          // Mobile: No drag and drop - use up/down buttons instead
          <div className="space-y-2 min-h-[200px]">
            {column.cards.map((card, index) => (
              <div key={card.id}>
                <NoteCard
                  card={card}
                  onUpdate={(updates) => onUpdateCard(column.id, card.id, updates)}
                  onDelete={() => onDeleteCard(column.id, card.id)}
                  onMoveUp={onMoveCardUp ? () => onMoveCardUp(column.id, card.id) : undefined}
                  onMoveDown={onMoveCardDown ? () => onMoveCardDown(column.id, card.id) : undefined}
                  canMoveUp={index > 0}
                  canMoveDown={index < column.cards.length - 1}
                  isNew={card.id === `card-${Date.now()}`}
                />
              </div>
            ))}
          </div>
        ) : (
          // Desktop: Full drag and drop functionality
          <Droppable droppableId={column.id}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`space-y-2 min-h-[200px] ${snapshot.isDraggingOver ? "bg-gray-200 rounded p-1" : ""}`}
              >
                {column.cards.map((card, index) => (
                  <Draggable key={card.id} draggableId={card.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={snapshot.isDragging ? "opacity-70" : ""}
                      >
                        <NoteCard
                          card={card}
                          onUpdate={(updates) => onUpdateCard(column.id, card.id, updates)}
                          onDelete={() => onDeleteCard(column.id, card.id)}
                          isNew={card.id === `card-${Date.now()}`}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        )}
      </div>
    </div>
  )
}
