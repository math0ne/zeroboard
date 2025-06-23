/**
 * @file note-card.tsx
 * @description Implements a card component for displaying and editing notes with markdown support.
 * This component handles different card types (standard, image-only, table-only),
 * supports editing, collapsing, and various display modes.
 */

"use client"

import React, { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { MarkdownRenderer } from "./markdown-renderer"
import { ImageModal } from "./image-modal"
import { ImageUploadModal } from "./image-upload-modal"
import { CardModal } from "./card-modal"
import { useKeyboardHandler } from "../hooks/use-card-state"
import type { Card as CardType } from "../app/page"
import {
  isImageOnlyContent,
  isTableOnlyContent,
  isCodeOnlyContent,
  startsWithImage,
  createImageErrorElement,
  getImageUrlFromMarkdown,
  getCacheVersion,
} from "@/lib/image-utils"
import { ChevronDown, ChevronUp, Hash, Square, X, ImageIcon, Expand, Type, Maximize2, ArrowUp, ArrowDown } from "lucide-react"
import { Button } from "@/components/ui/button"

/**
 * Props for the NoteCard component
 * @interface NoteCardProps
 * @property {CardType} card - The card data to display
 * @property {function} onUpdate - Callback when card is updated
 * @property {function} onDelete - Callback when card is deleted
 * @property {boolean} [isNew] - Whether this is a newly created card
 */
interface NoteCardProps {
  card: CardType
  onUpdate: (updates: Partial<CardType>) => void
  onDelete: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  canMoveUp?: boolean
  canMoveDown?: boolean
  isNew?: boolean
}

/**
 * NoteCard component for displaying and editing notes
 * @param {NoteCardProps} props - Component props
 * @returns {JSX.Element} Note card component
 */
export function NoteCard({ card, onUpdate, onDelete, onMoveUp, onMoveDown, canMoveUp, canMoveDown, isNew = false }: NoteCardProps) {
  // State for card display and editing
  const [isCollapsed, setIsCollapsed] = useState(card.collapsed || false)
  const [isPlain, setIsPlain] = useState(card.plain || false)
  const [isEditingTitle, setIsEditingTitle] = useState(isNew)
  const [isEditingContent, setIsEditingContent] = useState(isNew)
  const [titleValue, setTitleValue] = useState(card.title)
  const [contentValue, setContentValue] = useState(card.content)
  const [isHovering, setIsHovering] = useState(false)
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const [isLightBackground, setIsLightBackground] = useState(card.lightBackground || false)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [imageUrl, setImageUrl] = useState("")
  const [isImageUploadOpen, setIsImageUploadOpen] = useState(false)
  const [isCardModalOpen, setIsCardModalOpen] = useState(false)
  const [isTitleHidden, setIsTitleHidden] = useState(card.titleHidden || false)
  const [showMobileButtons, setShowMobileButtons] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Use utility functions to determine card type
  const isImageOnlyCard = isImageOnlyContent(card.content)
  const isTableOnlyCard = isTableOnlyContent(card.content)
  const isCodeOnlyCard = isCodeOnlyContent(card.content)
  const cardStartsWithImage = startsWithImage(card.content)
  const isEmptyContent = !card.content || card.content.trim() === ""

  // Determine card styling based on mode - add extra padding for DEFAULT (non-plain) collapsed cards with visible titles
  const shouldAddExtraPadding = !isPlain && isCollapsed && !isTitleHidden
  // Show background when editing, even if card is in plain mode
  const shouldShowBackground = !isPlain || isEditingTitle || isEditingContent
  // Adjust padding based on whether title is hidden and background visibility
  const isCodeOnlyFullWidth = isCodeOnlyCard && isTitleHidden && isPlain
  const topPadding = isCodeOnlyFullWidth ? "pt-0" : (isPlain ? "pt-1" : (isTitleHidden ? "pt-1" : "pt-2"))
  const bottomPaddingWithBg = isTitleHidden ? "pb-1" : "pb-2"
  const bottomPaddingNoBg = isCodeOnlyFullWidth ? "pb-0" : (isCollapsed ? "pb-2" : (isTitleHidden ? "pb-1" : "pb-1"))
  const cardClasses = shouldShowBackground
    ? `${isLightBackground ? "bg-gray-50" : "bg-white"} border border-gray-200 ${topPadding} pl-2 pr-2 ${bottomPaddingWithBg} shadow-[2px_2px_4px_rgba(0,0,0,0.1)]`
    : `${topPadding} pl-2 pr-2 ${bottomPaddingNoBg}`

  /**
   * Handle image click to open modal
   * @param {string} url - Image URL to display in modal
   */
  const handleImageClick = (url: string) => {
    if (!url) {
      return
    }
    setImageUrl(url)
    setIsImageModalOpen(true)
  }

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 459)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // If this is a new card, start in edit mode
  useEffect(() => {
    if (isNew) {
      setIsEditingTitle(true)
      setIsEditingContent(true)
    }
  }, [isNew])

  // Fix invalid state combinations on card load
  useEffect(() => {
    // Check for invalid combination: collapsed + hidden title
    if (card.collapsed && card.titleHidden) {
      // Reset both states to safe defaults
      const updates: Partial<CardType> = {
        collapsed: false,
        titleHidden: false
      }
      
      // Update local state
      setIsCollapsed(false)
      setIsTitleHidden(false)
      
      // Update parent component
      onUpdate(updates)
    }
  }, [card.collapsed, card.titleHidden, onUpdate])

  // Update contentValue when card.content changes (including checkbox updates)
  useEffect(() => {
    setContentValue(card.content)
  }, [card.content])

  // Update titleValue when card.title changes
  useEffect(() => {
    setTitleValue(card.title)
  }, [card.title])

  // Auto-resize textarea and sync highlighting
  useEffect(() => {
    if (textareaRef.current && isEditingContent) {
      const textarea = textareaRef.current
      textarea.style.height = "auto"
      textarea.style.height = `${Math.max(100, textarea.scrollHeight)}px`
    }
  }, [contentValue, isEditingContent])

  // Add click outside listener to save content when clicking outside
  useEffect(() => {
    if (isEditingContent) {
      const handleClickOutside = (event: MouseEvent) => {
        if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
          handleContentSave()
        }
      }

      document.addEventListener("mousedown", handleClickOutside)
      return () => {
        document.removeEventListener("mousedown", handleClickOutside)
      }
    }
  }, [isEditingContent, contentValue])

  // Hide mobile buttons when clicking outside the card
  useEffect(() => {
    if (isMobile && showMobileButtons) {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as HTMLElement
        // Check if click is outside this specific card by using card ID
        const clickedCard = target.closest(`[data-card-id="${card.id}"]`)
        if (!clickedCard) {
          setShowMobileButtons(false)
        }
      }

      document.addEventListener("mousedown", handleClickOutside)
      return () => {
        document.removeEventListener("mousedown", handleClickOutside)
      }
    }
  }, [isMobile, showMobileButtons, card.id])

  // Document-level mouse tracking to catch stuck hover states
  useEffect(() => {
    if (!isHovering) return

    const handleDocumentMouseMove = (e: MouseEvent) => {
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect()
        const isMouseInCard = 
          e.clientX >= rect.left && 
          e.clientX <= rect.right && 
          e.clientY >= rect.top && 
          e.clientY <= rect.bottom

        if (!isMouseInCard) {
          setIsHovering(false)
          setIsDeleteConfirming(false)
        }
      }
    }

    // Add listener with a small delay to avoid immediate firing
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousemove', handleDocumentMouseMove)
    }, 50)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousemove', handleDocumentMouseMove)
    }
  }, [isHovering])

  /**
   * Save card title after editing
   */
  const handleTitleSave = () => {
    if (titleValue.trim()) {
      onUpdate({ title: titleValue.trim() })
    } else {
      setTitleValue(card.title) // Reset if empty
    }
    setIsEditingTitle(false)
  }

  /**
   * Save card content after editing
   */
  const handleContentSave = () => {
    onUpdate({ content: contentValue })
    setIsEditingContent(false)
  }

  /**
   * Format selected text with markdown
   * @param {string} wrapper - The markdown wrapper to add around selected text
   */
  const formatSelectedText = (wrapper: string) => {
    if (!textareaRef.current) return

    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = contentValue.substring(start, end)
    
    // If text is already wrapped, unwrap it
    const beforeSelection = contentValue.substring(Math.max(0, start - wrapper.length), start)
    const afterSelection = contentValue.substring(end, Math.min(contentValue.length, end + wrapper.length))
    
    if (beforeSelection === wrapper && afterSelection === wrapper) {
      // Unwrap the text
      const newText = contentValue.substring(0, start - wrapper.length) + 
                     selectedText + 
                     contentValue.substring(end + wrapper.length)
      setContentValue(newText)
      
      // Restore selection
      setTimeout(() => {
        textarea.setSelectionRange(start - wrapper.length, end - wrapper.length)
        textarea.focus()
      }, 0)
    } else {
      // Wrap the text
      const newText = contentValue.substring(0, start) + 
                     wrapper + selectedText + wrapper + 
                     contentValue.substring(end)
      setContentValue(newText)
      
      // Restore selection
      setTimeout(() => {
        textarea.setSelectionRange(start + wrapper.length, end + wrapper.length)
        textarea.focus()
      }, 0)
    }
  }

  // Keyboard handlers using unified utility
  const handleTitleKeyDown = useKeyboardHandler({
    onEnter: handleTitleSave,
    onEscape: () => {
      setTitleValue(card.title)
      setIsEditingTitle(false)
    }
  })

  const handleContentKeyDown = (e: React.KeyboardEvent) => {
    // Handle formatting shortcuts
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault()
      formatSelectedText('**')
      return
    }
    
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
      e.preventDefault()
      formatSelectedText('*')
      return
    }

    // Handle other shortcuts
    if (e.key === "Escape") {
      setContentValue(card.content)
      setIsEditingContent(false)
    } else if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      handleContentSave()
    }
  }

  // Toggle functions
  const toggleCollapse = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    
    // Prevent collapsing if title is hidden (no title to show in collapsed state)
    if (!isCollapsed && isTitleHidden) {
      return
    }
    
    const newValue = !isCollapsed
    setIsCollapsed(newValue)
    onUpdate({ collapsed: newValue })
  }

  const togglePlain = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const newValue = !isPlain
    setIsPlain(newValue)
    onUpdate({ plain: newValue })
  }

  const toggleLightBackground = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const newValue = !isLightBackground
    setIsLightBackground(newValue)
    onUpdate({ lightBackground: newValue })
  }

  const toggleTitleVisibility = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    
    // Prevent hiding title if card is collapsed (need title visible in collapsed state)
    if (!isTitleHidden && isCollapsed) {
      return
    }
    
    const newValue = !isTitleHidden
    setIsTitleHidden(newValue)
    onUpdate({ titleHidden: newValue })
  }

  /**
   * Start editing card title
   * @param {React.MouseEvent} e - Mouse event
   */
  const startEditingTitle = (e: React.MouseEvent) => {
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

  /**
   * Start editing card content
   * @param {React.MouseEvent} e - Mouse event
   */
  const startEditingContent = (e: React.MouseEvent) => {
    // Don't start editing if we're clicking a checkbox or input
    const target = e.target as HTMLElement
    if (target.tagName === "INPUT" || (target as HTMLInputElement).type === "checkbox") {
      return
    }

    // Mobile behavior: first click shows buttons, second click edits
    if (isMobile) {
      if (!showMobileButtons) {
        // First click: show buttons
        setShowMobileButtons(true)
        return
      } else {
        // Second click: hide buttons and start editing
        setShowMobileButtons(false)
        if (!isCollapsed) {
          setIsEditingContent(true)
        }
        return
      }
    }

    // Desktop behavior: immediate edit
    if (!isCollapsed) {
      setIsEditingContent(true)
    }
  }

  /**
   * Handle delete button click with confirmation
   * @param {React.MouseEvent} e - Mouse event
   */
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isDeleteConfirming) {
      // Second click - actually delete the card
      onDelete()
    } else {
      // First click - enter confirmation mode
      setIsDeleteConfirming(true)
      // Reset confirmation after 3 seconds if not clicked again
      setTimeout(() => {
        setIsDeleteConfirming(false)
      }, 3000)
    }
  }

  /**
   * Handle mouse leave event
   */
  const handleMouseLeave = () => {
    setIsHovering(false)
    // Reset delete confirmation when mouse leaves the card
    setIsDeleteConfirming(false)
    // Note: Don't hide mobile buttons on mouse leave since mouse events can be unreliable on mobile
  }

  /**
   * Force hide hover state (for drag events and other cases)
   */
  const forceHideHover = () => {
    setIsHovering(false)
    setIsDeleteConfirming(false)
  }

  /**
   * Toggle checkbox in markdown content
   * @param {number} index - Index of checkbox to toggle
   */
  const handleCheckboxToggle = (index: number) => {
    // Regex to match checkbox patterns: "- [ ]" or "- [x]"
    const checkboxRegex = /^(\s*)- \[([ xX])\]/
    const lines = card.content.split("\n")
    let checkboxCount = 0

    const newLines = lines.map((line) => {
      const match = line.match(checkboxRegex)
      if (match) {
        if (checkboxCount === index) {
          // Toggle ONLY this specific checkbox
          const isChecked = match[2] === "x" || match[2] === "X"
          const newLine = line.replace(checkboxRegex, `${match[1]}- [${isChecked ? " " : "x"}]`)
          checkboxCount++
          return newLine
        }
        checkboxCount++
      }
      return line
    })

    const newContent = newLines.join("\n")
    onUpdate({ content: newContent })
  }

  /**
   * Open image modal for the card's image
   * @param {React.MouseEvent} e - Mouse event
   */
  const openImageModal = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const { url } = await getImageUrlFromMarkdown(card.content)
    if (url) {
      handleImageClick(url)
    }
  }

  /**
   * Handle image selection from image upload modal
   * @param {string} imageId - ID of selected image
   * @param {string} filename - Filename of selected image
   */
  const handleImageSelected = (imageId: string, filename: string) => {
    const imageMarkdown = `![${filename}](local:${imageId})`
    const newContent = contentValue + "\n\n" + imageMarkdown
    setContentValue(newContent)
    onUpdate({ content: newContent })
  }

  

  /**
   * Render control buttons for the card
   * @returns {JSX.Element} Control buttons
   */
  const renderControlButtons = () => (
    <div className="absolute top-2 right-2 flex z-10 bg-white/95 rounded p-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation()
          togglePlain()
        }}
        className={`h-4 w-4 p-0 ${isPlain ? 'text-black' : 'text-gray-400'}`}
        title="Toggle border"
      >
        <Square className="h-2 w-2" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation()
          toggleLightBackground()
        }}
        className={`h-4 w-4 p-0 ml-1 ${isLightBackground ? 'text-black' : 'text-gray-400'}`}
        title={isLightBackground ? "Remove highlight" : "Highlight card"}
      >
        <Hash className="h-2 w-2" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation()
          toggleTitleVisibility()
        }}
        className={`h-4 w-4 p-0 ml-1 ${isTitleHidden ? 'text-black' : (isCollapsed ? 'text-gray-200 cursor-not-allowed' : 'text-gray-400')}`}
        title={isCollapsed ? "Cannot hide title when collapsed" : "Toggle title"}
        disabled={isCollapsed}
      >
        <Type className="h-2 w-2" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation()
          toggleCollapse()
        }}
        className={`h-4 w-4 p-0 ml-1 ${isCollapsed ? 'text-black' : (isTitleHidden ? 'text-gray-200 cursor-not-allowed' : 'text-gray-400')}`}
        title={isTitleHidden && !isCollapsed ? "Cannot collapse when title is hidden" : (isCollapsed ? "Expand card" : "Collapse card")}
        disabled={!isCollapsed && isTitleHidden}
      >
        {isCollapsed ? <ChevronDown className="h-2.5 w-2.5" /> : <ChevronUp className="h-2.5 w-2.5" />}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation()
          setIsImageUploadOpen(true)
        }}
        className="h-4 w-4 p-0 ml-1 text-gray-600"
        title="Add image"
      >
        <ImageIcon className="h-1.5 w-1.5" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation()
          setIsCardModalOpen(true)
        }}
        className="h-4 w-4 p-0 ml-1 text-gray-600"
        title="Expand card"
      >
        <Expand style={{ width: '13px', height: '13px' }} />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDeleteClick}
        className={`h-4 w-4 p-0 ml-1 transition-colors duration-200 ${
          isDeleteConfirming
            ? "text-red-600 hover:text-red-700 hover:bg-red-100 bg-red-50"
            : "text-gray-600 hover:bg-gray-200"
        }`}
        title={isDeleteConfirming ? "Click again to delete" : "Delete card"}
      >
        <X className="h-2 w-2" />
      </Button>
    </div>
  )

  /**
   * Render control buttons for image-only cards (only delete)
   * @returns {JSX.Element} Control buttons
   */
  const renderImageOnlyControlButtons = () => (
    <div className="absolute top-2 right-2 flex z-10 bg-white/95 rounded p-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDeleteClick}
        className={`h-4 w-4 p-0 transition-colors duration-200 ${
          isDeleteConfirming
            ? "text-red-600 hover:text-red-700 hover:bg-red-100 bg-red-50"
            : "text-gray-600 hover:bg-gray-200"
        }`}
        title={isDeleteConfirming ? "Click again to delete" : "Delete card"}
      >
        <X className="h-2 w-2" />
      </Button>
    </div>
  )

  /**
   * Render control buttons for collapsed image cards (only delete and collapse)
   * @returns {JSX.Element} Control buttons
   */
  const renderCollapsedImageControlButtons = () => (
    <div className="absolute top-2 right-2 flex z-10 bg-white/95 rounded p-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation()
          toggleCollapse()
        }}
        className={`h-4 w-4 p-0 ${isCollapsed ? 'text-black' : 'text-gray-400'}`}
        title={isCollapsed ? "Expand card" : "Collapse card"}
      >
        {isCollapsed ? <ChevronDown className="h-2.5 w-2.5" /> : <ChevronUp className="h-2.5 w-2.5" />}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDeleteClick}
        className={`h-4 w-4 p-0 ml-1 transition-colors duration-200 ${
          isDeleteConfirming
            ? "text-red-600 hover:text-red-700 hover:bg-red-100 bg-red-50"
            : "text-gray-600 hover:bg-gray-200"
        }`}
        title={isDeleteConfirming ? "Click again to delete" : "Delete card"}
      >
        <X className="h-2 w-2" />
      </Button>
    </div>
  )

  // For image-only cards - completely different rendering
  if (isImageOnlyCard && !isEditingTitle && !isEditingContent) {
    return (
      <AsyncImageOnlyCard 
        card={card}
        isHovering={isHovering}
        isImageModalOpen={isImageModalOpen}
        isImageUploadOpen={isImageUploadOpen}
        imageUrl={imageUrl}
        onMouseEnter={() => !isMobile && setIsHovering(true)}
        onMouseLeave={() => !isMobile && handleMouseLeave()}
        onClick={(e: React.MouseEvent) => startEditingContent(e)}
        onImageClick={handleImageClick}
        onImageModalClose={() => setIsImageModalOpen(false)}
        onImageUploadClose={() => setIsImageUploadOpen(false)}
        onImageSelect={handleImageSelected}
        renderControlButtons={renderImageOnlyControlButtons}
        isPlain={isPlain}
        isLightBackground={isLightBackground}
        onDragStart={forceHideHover}
        onDragEnd={forceHideHover}
        isEditingTitle={isEditingTitle}
        isEditingContent={isEditingContent}
        shouldShowBackground={shouldShowBackground}
        isMobile={isMobile}
        showMobileButtons={showMobileButtons}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        canMoveUp={canMoveUp}
        canMoveDown={canMoveDown}
      />
    )
  }

  // For table-only cards - completely different rendering
  if (isTableOnlyCard && !isEditingTitle && !isEditingContent) {
    return (
      <div
        className={`${shouldShowBackground ? `${isLightBackground ? "bg-gray-50" : "bg-white"} border border-gray-200 shadow-[2px_2px_4px_rgba(0,0,0,0.1)]` : ""} overflow-hidden relative cursor-pointer`}
        data-card-id={card.id}
        onMouseEnter={() => !isMobile && setIsHovering(true)}
        onMouseLeave={() => !isMobile && handleMouseLeave()}
        onClick={startEditingContent}
        onDragStart={forceHideHover}
        onDragEnd={forceHideHover}
      >
        {(isHovering && !isEditingTitle && !isEditingContent || (isMobile && showMobileButtons && !isEditingTitle && !isEditingContent)) && renderControlButtons()}
        <MarkdownRenderer content={card.content} tableOnly={true} onImageClick={handleImageClick} />
      </div>
    )
  }

  // For collapsed cards that start with an image - special rendering
  if (isCollapsed && cardStartsWithImage && !isEditingTitle && !isEditingContent) {
    return (
      <AsyncCollapsedImageCard 
        card={card}
        isHovering={isHovering}
        isImageModalOpen={isImageModalOpen}
        isImageUploadOpen={isImageUploadOpen}
        imageUrl={imageUrl}
        onMouseEnter={() => !isMobile && setIsHovering(true)}
        onMouseLeave={() => !isMobile && handleMouseLeave()}
        onClick={(e: React.MouseEvent) => startEditingContent(e)}
        onImageClick={handleImageClick}
        onImageModalClose={() => setIsImageModalOpen(false)}
        onImageUploadClose={() => setIsImageUploadOpen(false)}
        onImageSelect={handleImageSelected}
        renderControlButtons={renderCollapsedImageControlButtons}
        isPlain={isPlain}
        isLightBackground={isLightBackground}
        onDragStart={forceHideHover}
        onDragEnd={forceHideHover}
        isEditingTitle={isEditingTitle}
        isEditingContent={isEditingContent}
        shouldShowBackground={shouldShowBackground}
        isMobile={isMobile}
        showMobileButtons={showMobileButtons}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        canMoveUp={canMoveUp}
        canMoveDown={canMoveDown}
      />
    )
  }

  // Standard card rendering
  return (
    <>
      <div 
        className={`${cardClasses} relative`} 
        ref={cardRef}
        data-card-id={card.id}
        onMouseEnter={() => !isMobile && setIsHovering(true)}
        onMouseLeave={() => !isMobile && handleMouseLeave()}
        onDragStart={forceHideHover}
        onDragEnd={forceHideHover}
      >
        {/* Mobile move buttons - positioned top left */}
        {isMobile && showMobileButtons && !isEditingTitle && !isEditingContent && (onMoveUp || onMoveDown) && (
          <div className="absolute top-2 left-2 flex z-10 bg-white/95 rounded p-1">
            {onMoveUp && canMoveUp && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onMoveUp()
                }}
                className="h-4 w-4 p-0 text-gray-600 hover:text-gray-900 hover:bg-gray-200 mr-0.5"
                title="Move card up"
              >
                <ArrowUp className="h-2 w-2" />
              </Button>
            )}
            {onMoveDown && canMoveDown && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onMoveDown()
                }}
                className="h-4 w-4 p-0 text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                title="Move card down"
              >
                <ArrowDown className="h-2 w-2" />
              </Button>
            )}
          </div>
        )}
        
        {/* Standard controls - positioned top right */}
        {(isHovering && !isEditingTitle && !isEditingContent || (isMobile && showMobileButtons && !isEditingTitle && !isEditingContent)) && (
          <div className="absolute top-2 right-2 flex z-10 bg-white/95 rounded p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePlain}
              className={`h-4 w-4 p-0 ${isPlain ? 'text-black' : 'text-gray-400'}`}
              title="Toggle border"
            >
              <Square className="h-2 w-2" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLightBackground}
              className={`h-4 w-4 p-0 ml-1 ${isLightBackground ? 'text-black' : 'text-gray-400'}`}
              title={isLightBackground ? "Remove highlight" : "Highlight card"}
            >
              <Hash className="h-2 w-2" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTitleVisibility}
              className={`h-4 w-4 p-0 ml-1 ${isTitleHidden ? 'text-black' : (isCollapsed ? 'text-gray-200 cursor-not-allowed' : 'text-gray-400')}`}
              title={isCollapsed ? "Cannot hide title when collapsed" : "Toggle title"}
              disabled={isCollapsed}
            >
              <Type className="h-2 w-2" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleCollapse}
              className={`h-4 w-4 p-0 ml-1 ${isCollapsed ? 'text-black' : (isTitleHidden ? 'text-gray-200 cursor-not-allowed' : 'text-gray-400')}`}
              title={isTitleHidden && !isCollapsed ? "Cannot collapse when title is hidden" : (isCollapsed ? "Expand card" : "Collapse card")}
              disabled={!isCollapsed && isTitleHidden}
            >
              {isCollapsed ? <ChevronDown className="h-2.5 w-2.5" /> : <ChevronUp className="h-2.5 w-2.5" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                setIsImageUploadOpen(true)
              }}
              className="h-4 w-4 p-0 ml-1 text-gray-600"
              title="Add image"
            >
              <ImageIcon className="h-1.5 w-1.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                setIsCardModalOpen(true)
              }}
              className="h-4 w-4 p-0 ml-1 text-gray-600"
              title="Expand card"
            >
              <Expand style={{ width: '13px', height: '13px' }} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeleteClick}
              className={`h-4 w-4 p-0 ml-1 transition-colors duration-200 ${
                isDeleteConfirming
                  ? "text-red-600 hover:text-red-700 hover:bg-red-100 bg-red-50"
                  : "text-gray-600 hover:bg-gray-200"
              }`}
              title={isDeleteConfirming ? "Click again to delete" : "Delete card"}
            >
              <X className="h-2 w-2" />
            </Button>
          </div>
        )}
        
        {!isTitleHidden && (
          <div style={isCollapsed ? { marginBottom: '0.3rem' } : {}}>
            {isEditingTitle ? (
              <Input
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={handleTitleKeyDown}
                className="text-xs font-semibold h-5 px-1 py-0 border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent text-gray-800"
                autoFocus
              />
            ) : (
              <h3
                className={`text-xs font-semibold text-gray-800 cursor-pointer hover:bg-gray-50 px-1 rounded leading-tight pr-8 ${isCollapsed ? 'py-1' : 'py-0.5'}`}
                onClick={startEditingTitle}
              >
                {card.title}
              </h3>
            )}
          </div>
        )}

        {!isCollapsed && (
          <div className={`text-xs leading-tight ${isCodeOnlyFullWidth ? 'pt-0' : (isPlain ? 'pt-0.5' : 'pt-2')}`}>
            {isEditingContent ? (
              <Textarea
                ref={textareaRef}
                value={contentValue}
                onChange={(e) => setContentValue(e.target.value)}
                onKeyDown={handleContentKeyDown}
                className="text-xs font-mono resize-none border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent p-1 text-xs"
                autoFocus
                style={{ minHeight: "100px", fontSize: "12px" }}
              />
            ) : (
              <div
                className={`prose prose-sm max-w-none cursor-pointer rounded py-0 prose-a:text-inherit prose-a:no-underline hover:prose-a:underline ${
                  isEmptyContent 
                    ? "min-h-[60px] bg-gray-50/50 hover:bg-gray-100/50 flex items-center justify-center p-1" 
                    : (isCodeOnlyCard && isTitleHidden && isPlain) 
                      ? "p-0" 
                      : "p-1"
                }`}
                onClick={startEditingContent}
              >
                {isEmptyContent ? (
                  <span className="text-gray-400 text-xs">Click to add content</span>
                ) : (
                  <MarkdownRenderer
                    content={card.content}
                    onCheckboxToggle={handleCheckboxToggle}
                    onImageClick={handleImageClick}
                    codeOnlyFullWidth={isCodeOnlyCard && isTitleHidden && isPlain}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>
      {isImageModalOpen && <ImageModal imageUrl={imageUrl} onClose={() => setIsImageModalOpen(false)} />}
      {isImageUploadOpen && (
        <ImageUploadModal
          isOpen={isImageUploadOpen}
          onClose={() => setIsImageUploadOpen(false)}
          onImageSelect={handleImageSelected}
        />
      )}
      {isCardModalOpen && (
        <CardModal
          card={card}
          onClose={() => setIsCardModalOpen(false)}
          onUpdate={onUpdate}
          onCheckboxToggle={handleCheckboxToggle}
          onImageClick={handleImageClick}
        />
      )}
    </>
  )
}

/**
 * Async component for image-only cards that handles IndexedDB image loading
 */
function AsyncImageOnlyCard({ 
  card, 
  isHovering, 
  isImageModalOpen, 
  isImageUploadOpen, 
  imageUrl, 
  onMouseEnter, 
  onMouseLeave, 
  onClick, 
  onImageClick, 
  onImageModalClose, 
  onImageUploadClose, 
  onImageSelect, 
  renderControlButtons, 
  isPlain, 
  isLightBackground,
  onDragStart,
  onDragEnd,
  isEditingTitle,
  isEditingContent,
  shouldShowBackground,
  isMobile,
  showMobileButtons,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown
}: {
  card: CardType
  isHovering: boolean
  isImageModalOpen: boolean
  isImageUploadOpen: boolean
  imageUrl: string
  onMouseEnter: () => void
  onMouseLeave: () => void
  onClick: (e: React.MouseEvent) => void
  onImageClick: (url: string) => void
  onImageModalClose: () => void
  onImageUploadClose: () => void
  onImageSelect: (imageId: string, filename: string) => void
  renderControlButtons: () => React.ReactNode
  isPlain: boolean
  isLightBackground: boolean
  onDragStart?: () => void
  onDragEnd?: () => void
  isEditingTitle: boolean
  isEditingContent: boolean
  shouldShowBackground: boolean
  isMobile: boolean
  showMobileButtons: boolean
  onMoveUp?: () => void
  onMoveDown?: () => void
  canMoveUp?: boolean
  canMoveDown?: boolean
}) {
  const [imageData, setImageData] = useState<{ url: string; alt: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const cacheVersion = getCacheVersion()

  useEffect(() => {
    const loadImage = async () => {
      try {
        const { url, alt } = await getImageUrlFromMarkdown(card.content)
        setImageData({ url, alt })
      } catch (error) {
        setImageData(null)
      }
      setIsLoading(false)
    }

    loadImage()
  }, [card.content, cacheVersion])

  const openImageModal = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (imageData?.url) {
      onImageClick(imageData.url)
    }
  }

  if (isLoading) {
    return (
      <div className={`${shouldShowBackground ? `${isLightBackground ? "bg-gray-50" : "bg-white"} border border-gray-200 shadow-[2px_2px_4px_rgba(0,0,0,0.1)]` : ""} overflow-hidden relative cursor-pointer h-32 flex items-center justify-center`}>
        <span className="text-gray-400 text-xs">Loading image...</span>
      </div>
    )
  }

  if (!imageData || !imageData.url) {
    return (
      <div className={`${shouldShowBackground ? `${isLightBackground ? "bg-gray-50" : "bg-white"} border border-gray-200 shadow-[2px_2px_4px_rgba(0,0,0,0.1)]` : ""} overflow-hidden relative cursor-pointer h-32 flex items-center justify-center`}>
        <span className="text-gray-400 text-xs">Image not available</span>
      </div>
    )
  }

  return (
    <>
      <div
        className={`${shouldShowBackground ? `${isLightBackground ? "bg-gray-50" : "bg-white"} border border-gray-200 shadow-[2px_2px_4px_rgba(0,0,0,0.1)]` : ""} overflow-hidden relative cursor-pointer`}
        data-card-id={card.id}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onClick={onClick}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        {/* Mobile move buttons - positioned top left */}
        {isMobile && showMobileButtons && !isEditingTitle && !isEditingContent && (onMoveUp || onMoveDown) && (
          <div className="absolute top-2 left-2 flex z-10 bg-white/95 rounded p-1">
            {onMoveUp && canMoveUp && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onMoveUp()
                }}
                className="h-4 w-4 p-0 text-gray-600 hover:text-gray-900 hover:bg-gray-200 mr-0.5"
                title="Move card up"
              >
                <ArrowUp className="h-2 w-2" />
              </Button>
            )}
            {onMoveDown && canMoveDown && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onMoveDown()
                }}
                className="h-4 w-4 p-0 text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                title="Move card down"
              >
                <ArrowDown className="h-2 w-2" />
              </Button>
            )}
          </div>
        )}
        
        {(isHovering && !isEditingTitle && !isEditingContent || (isMobile && showMobileButtons && !isEditingTitle && !isEditingContent)) && (
          <>
            {renderControlButtons()}
            <Button
              variant="ghost"
              size="sm"
              onClick={openImageModal}
              className="absolute bottom-2 right-2 z-10 h-6 w-6 p-0 bg-white/95 hover:bg-white/100 rounded-full"
              title="View full size"
            >
              <Maximize2 className="h-2.5 w-2.5" />
            </Button>
          </>
        )}
        <img
          src={imageData.url}
          alt={imageData.alt}
          className="w-full object-cover"
          style={{ height: "auto" }}
          onError={(e) => {
            e.currentTarget.style.display = "none"
            const errorDiv = createImageErrorElement()
            e.currentTarget.parentElement?.appendChild(errorDiv)
          }}
        />
      </div>
      {isImageModalOpen && <ImageModal imageUrl={imageUrl} onClose={onImageModalClose} />}
      {isImageUploadOpen && (
        <ImageUploadModal
          isOpen={isImageUploadOpen}
          onClose={onImageUploadClose}
          onImageSelect={onImageSelect}
        />
      )}
    </>
  )
}

/**
 * Async component for collapsed image cards that handles IndexedDB image loading
 */
function AsyncCollapsedImageCard({ 
  card, 
  isHovering, 
  isImageModalOpen, 
  isImageUploadOpen, 
  imageUrl, 
  onMouseEnter, 
  onMouseLeave, 
  onClick, 
  onImageClick, 
  onImageModalClose, 
  onImageUploadClose, 
  onImageSelect, 
  renderControlButtons, 
  isPlain, 
  isLightBackground,
  onDragStart,
  onDragEnd,
  isEditingTitle,
  isEditingContent,
  shouldShowBackground,
  isMobile,
  showMobileButtons,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown
}: {
  card: CardType
  isHovering: boolean
  isImageModalOpen: boolean
  isImageUploadOpen: boolean
  imageUrl: string
  onMouseEnter: () => void
  onMouseLeave: () => void
  onClick: (e: React.MouseEvent) => void
  onImageClick: (url: string) => void
  onImageModalClose: () => void
  onImageUploadClose: () => void
  onImageSelect: (imageId: string, filename: string) => void
  renderControlButtons: () => React.ReactNode
  isPlain: boolean
  isLightBackground: boolean
  onDragStart?: () => void
  onDragEnd?: () => void
  isEditingTitle: boolean
  isEditingContent: boolean
  shouldShowBackground: boolean
  isMobile: boolean
  showMobileButtons: boolean
  onMoveUp?: () => void
  onMoveDown?: () => void
  canMoveUp?: boolean
  canMoveDown?: boolean
}) {
  const [imageData, setImageData] = useState<{ url: string; alt: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const cacheVersion = getCacheVersion()

  useEffect(() => {
    const loadImage = async () => {
      try {
        const { url, alt } = await getImageUrlFromMarkdown(card.content)
        setImageData({ url, alt })
      } catch (error) {
        setImageData(null)
      }
      setIsLoading(false)
    }

    loadImage()
  }, [card.content, cacheVersion])

  if (isLoading) {
    return (
      <div className={`${isPlain ? "" : `${isLightBackground ? "bg-gray-50" : "bg-white"} border border-gray-200 shadow-[2px_2px_4px_rgba(0,0,0,0.1)]`} overflow-hidden relative cursor-pointer`} style={{ height: "45px" }}>
        <div className="flex items-center justify-center h-full">
          <span className="text-gray-400 text-xs">Loading...</span>
        </div>
      </div>
    )
  }

  if (!imageData || !imageData.url) {
    return (
      <div className={`${isPlain ? "" : `${isLightBackground ? "bg-gray-50" : "bg-white"} border border-gray-200 shadow-[2px_2px_4px_rgba(0,0,0,0.1)]`} overflow-hidden relative cursor-pointer`} style={{ height: "45px" }}>
        <div className="flex items-center justify-center h-full">
          <span className="text-gray-400 text-xs">Image not available</span>
        </div>
      </div>
    )
  }

  return (
    <>
      <div
        className={`${shouldShowBackground ? `${isLightBackground ? "bg-gray-50" : "bg-white"} border border-gray-200 shadow-[2px_2px_4px_rgba(0,0,0,0.1)]` : ""} overflow-hidden relative cursor-pointer`}
        data-card-id={card.id}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onClick={onClick}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        {/* Mobile move buttons - positioned top left */}
        {isMobile && showMobileButtons && !isEditingTitle && !isEditingContent && (onMoveUp || onMoveDown) && (
          <div className="absolute top-2 left-2 flex z-10 bg-white/95 rounded p-1">
            {onMoveUp && canMoveUp && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onMoveUp()
                }}
                className="h-4 w-4 p-0 text-gray-600 hover:text-gray-900 hover:bg-gray-200 mr-0.5"
                title="Move card up"
              >
                <ArrowUp className="h-2 w-2" />
              </Button>
            )}
            {onMoveDown && canMoveDown && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onMoveDown()
                }}
                className="h-4 w-4 p-0 text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                title="Move card down"
              >
                <ArrowDown className="h-2 w-2" />
              </Button>
            )}
          </div>
        )}
        
        {(isHovering && !isEditingTitle && !isEditingContent || (isMobile && showMobileButtons && !isEditingTitle && !isEditingContent)) && renderControlButtons()}
        <img
          src={imageData.url}
          alt={imageData.alt}
          className="w-full object-cover"
          style={{ height: "45px", objectPosition: "center" }}
          onError={(e) => {
            e.currentTarget.style.display = "none"
            const errorDiv = createImageErrorElement()
            e.currentTarget.parentElement?.appendChild(errorDiv)
          }}
        />
      </div>
      {isImageModalOpen && <ImageModal imageUrl={imageUrl} onClose={onImageModalClose} />}
      {isImageUploadOpen && (
        <ImageUploadModal
          isOpen={isImageUploadOpen}
          onClose={onImageUploadClose}
          onImageSelect={onImageSelect}
        />
      )}
    </>
  )
}
