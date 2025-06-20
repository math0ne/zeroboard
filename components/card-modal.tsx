"use client"

import React, { useState, useEffect, useRef } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { MarkdownRenderer } from "./markdown-renderer"
import { TitleMarkdownRenderer } from "./title-markdown-renderer"
import type { Card as CardType } from "../app/page"

interface CardModalProps {
  card: CardType
  onClose: () => void
  onUpdate: (updates: Partial<CardType>) => void
  onCheckboxToggle?: (index: number) => void
  onImageClick?: (url: string) => void
}

export function CardModal({ card, onClose, onUpdate, onCheckboxToggle, onImageClick }: CardModalProps) {
  const [isEditingContent, setIsEditingContent] = useState(false)
  const [contentValue, setContentValue] = useState(card.content)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Update contentValue when card.content changes
  useEffect(() => {
    setContentValue(card.content)
  }, [card.content])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current && isEditingContent) {
      const textarea = textareaRef.current
      textarea.style.height = "auto"
      textarea.style.height = `${Math.max(200, textarea.scrollHeight)}px`
    }
  }, [contentValue, isEditingContent])

  // Handle click outside to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      if (isEditingContent) {
        handleContentSave()
      }
      onClose()
    }
  }

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isEditingContent) {
          setContentValue(card.content)
          setIsEditingContent(false)
        } else {
          onClose()
        }
      }
    }

    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [onClose, isEditingContent, card.content])

  const handleContentSave = () => {
    onUpdate({ content: contentValue })
    setIsEditingContent(false)
  }

  const handleContentKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setContentValue(card.content)
      setIsEditingContent(false)
    }
    // Ctrl/Cmd + Enter to save
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      handleContentSave()
    }
  }

  const startEditingContent = (e: React.MouseEvent) => {
    // Don't start editing if we're clicking a checkbox or input
    const target = e.target as HTMLElement
    if (target.tagName === "INPUT" || target.type === "checkbox") {
      return
    }
    setIsEditingContent(true)
  }

  return (
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" 
      onClick={handleBackdropClick}
    >
      <div className="relative max-w-4xl max-h-[90vh] bg-white overflow-hidden shadow-xl">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute top-3 right-3 z-10 h-8 w-8 p-0 bg-white/80 hover:bg-white"
        >
          <X className="h-4 w-4" />
        </Button>

        <div className="p-6 overflow-y-auto max-h-[90vh]">
          {/* Card Title */}
          <div className="mb-4">
            <TitleMarkdownRenderer 
              content={card.title} 
              className="text-2xl font-bold text-gray-900"
            />
          </div>

          {/* Card Content */}
          <div className="prose prose-lg max-w-none prose-a:text-inherit prose-a:no-underline hover:prose-a:underline">
            {isEditingContent ? (
              <Textarea
                ref={textareaRef}
                value={contentValue}
                onChange={(e) => setContentValue(e.target.value)}
                onKeyDown={handleContentKeyDown}
                onBlur={handleContentSave}
                className="text-sm font-mono resize-none border-gray-300 focus-visible:ring-2 focus-visible:ring-blue-500 min-h-[200px]"
                autoFocus
                placeholder="Enter your markdown content..."
              />
            ) : (
              <div
                className="cursor-pointer hover:bg-gray-50 p-2 rounded min-h-[100px]"
                onClick={startEditingContent}
              >
                {card.content ? (
                  <MarkdownRenderer
                    content={card.content}
                    onCheckboxToggle={onCheckboxToggle}
                    onImageClick={onImageClick}
                  />
                ) : (
                  <div className="text-gray-400 italic flex items-center justify-center h-20">
                    Click to add content
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}