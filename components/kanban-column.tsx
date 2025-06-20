"use client"

import type React from "react"

import { useState } from "react"
import { Droppable, Draggable } from "@hello-pangea/dnd"
import { Plus, X } from "lucide-react"
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
  dragHandleProps?: any
}

export function KanbanColumn({
  column,
  onUpdateColumn,
  onDeleteColumn,
  onAddCard,
  onUpdateCard,
  onDeleteCard,
  dragHandleProps,
}: KanbanColumnProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState(column.title)
  const [isHovering, setIsHovering] = useState(false)
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false)

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
  }

  return (
    <div className="flex-shrink-0 w-72 min-w-[18rem]">
      <div className="bg-gray-100 p-2 shadow-sm">
        <div
          className="flex items-center justify-between mb-2"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={handleMouseLeave}
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
                  onClick={() => setIsEditingTitle(true)}
                >
                  <TitleMarkdownRenderer content={column.title} />
                </h2>
              </div>
              {isHovering && (
                <div className="flex">
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
      </div>
    </div>
  )
}
