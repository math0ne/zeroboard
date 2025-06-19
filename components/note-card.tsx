/**
 * @file note-card.tsx
 * @description Implements a card component for displaying and editing notes with markdown support.
 * This component handles different card types (standard, image-only, table-only),
 * supports editing, collapsing, and various display modes.
 */

"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { ChevronDown, ChevronUp, Hash, Maximize2, Minus, X, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { MarkdownRenderer } from "./markdown-renderer"
import { ImageModal } from "./image-modal"
import { ImageUploadModal } from "./image-upload-modal"
import type { Card as CardType } from "../page"
import {
  getImageUrlFromMarkdown,
  isImageOnlyContent,
  isTableOnlyContent,
  startsWithImage,
  createImageErrorElement,
  getCacheVersion,
} from "@/lib/image-utils"

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
  isNew?: boolean
}

/**
 * NoteCard component for displaying and editing notes
 * @param {NoteCardProps} props - Component props
 * @returns {JSX.Element} Note card component
 */
export function NoteCard({ card, onUpdate, onDelete, isNew = false }: NoteCardProps) {
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

  // Use utility functions to determine card type
  const isImageOnlyCard = isImageOnlyContent(card.content)
  const isTableOnlyCard = isTableOnlyContent(card.content)
  const cardStartsWithImage = startsWithImage(card.content)
  const isEmptyContent = !card.content || card.content.trim() === ""

  /**
   * Handle image click to open modal
   * @param {string} url - Image URL to display in modal
   */
  const handleImageClick = (url: string) => {
    console.log("handleImageClick called with:", url ? "Valid URL" : "Empty URL")
    if (!url) {
      console.error("Attempted to open image modal with empty URL")
      return
    }
    setImageUrl(url)
    setIsImageModalOpen(true)
  }

  // If this is a new card, start in edit mode
  useEffect(() => {
    if (isNew) {
      setIsEditingTitle(true)
      setIsEditingContent(true)
    }
  }, [isNew])

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

  /**
   * Toggle card collapsed state
   */
  const toggleCollapse = () => {
    const newCollapsedState = !isCollapsed
    setIsCollapsed(newCollapsedState)
    onUpdate({ collapsed: newCollapsedState })
  }

  /**
   * Toggle card plain mode (no border/shadow)
   */
  const togglePlain = () => {
    const newPlainState = !isPlain
    setIsPlain(newPlainState)
    onUpdate({ plain: newPlainState })
  }

  /**
   * Toggle card light background
   */
  const toggleLightBackground = () => {
    const newLightBackgroundState = !isLightBackground
    setIsLightBackground(newLightBackgroundState)
    onUpdate({ lightBackground: newLightBackgroundState })
  }

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
   * Handle keyboard events in title input
   * @param {React.KeyboardEvent} e - Keyboard event
   */
  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTitleSave()
    } else if (e.key === "Escape") {
      setTitleValue(card.title)
      setIsEditingTitle(false)
    }
  }

  /**
   * Save card content after editing
   */
  const handleContentSave = () => {
    onUpdate({ content: contentValue })
    setIsEditingContent(false)
  }

  /**
   * Handle keyboard events in content textarea
   * @param {React.KeyboardEvent} e - Keyboard event
   */
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

  /**
   * Start editing card content
   * @param {React.MouseEvent} e - Mouse event
   */
  const startEditingContent = (e: React.MouseEvent) => {
    // Don't start editing if we're clicking a checkbox or input
    const target = e.target as HTMLElement
    if (target.tagName === "INPUT" || target.type === "checkbox") {
      return
    }

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
  const openImageModal = (e: React.MouseEvent) => {
    e.stopPropagation()
    const { url } = getImageUrlFromMarkdown(card.content)
    if (url) {
      handleImageClick(url)
    } else {
      console.error("Failed to extract image URL for modal")
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

  // Determine card styling based on mode
  const cardClasses = isPlain
    ? "p-2"
    : `${isLightBackground ? "bg-gray-50" : "bg-white"} border border-gray-200 pt-2 pl-2 pr-2 pb-0 shadow-[2px_2px_4px_rgba(0,0,0,0.1)]`

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
        className="h-4 w-4 p-0 text-gray-600 hover:text-gray-900 hover:bg-gray-200"
      >
        <Minus className="h-2 w-2" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation()
          toggleLightBackground()
        }}
        className="h-4 w-4 p-0 ml-1 text-gray-600 hover:text-gray-900 hover:bg-gray-200"
      >
        <Hash style={{ width: "10px", height: "10px" }} />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation()
          setIsImageUploadOpen(true)
        }}
        className="h-4 w-4 p-0 ml-1 text-gray-600 hover:text-gray-900 hover:bg-gray-200"
        title="Add image"
      >
        <ImageIcon className="h-2 w-2" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation()
          toggleCollapse()
        }}
        className="h-4 w-4 p-0 ml-1 text-gray-600 hover:text-gray-900 hover:bg-gray-200"
      >
        {isCollapsed ? <ChevronDown className="h-2 w-2" /> : <ChevronUp className="h-2 w-2" />}
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
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={handleMouseLeave}
        onClick={startEditingContent}
        onImageClick={handleImageClick}
        onImageModalClose={() => setIsImageModalOpen(false)}
        onImageUploadClose={() => setIsImageUploadOpen(false)}
        onImageSelect={handleImageSelected}
        renderControlButtons={renderControlButtons}
        isPlain={isPlain}
        isLightBackground={isLightBackground}
      />
    )
  }

  // For table-only cards - completely different rendering
  if (isTableOnlyCard && !isEditingTitle && !isEditingContent) {
    return (
      <div
        className={`${isPlain ? "" : `${isLightBackground ? "bg-gray-50" : "bg-white"} border border-gray-200 shadow-[2px_2px_4px_rgba(0,0,0,0.1)]`} overflow-hidden relative cursor-pointer`}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={handleMouseLeave}
        onClick={startEditingContent}
      >
        {isHovering && renderControlButtons()}
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
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={handleMouseLeave}
        onClick={startEditingContent}
        onImageClick={handleImageClick}
        onImageModalClose={() => setIsImageModalOpen(false)}
        onImageUploadClose={() => setIsImageUploadOpen(false)}
        onImageSelect={handleImageSelected}
        renderControlButtons={renderControlButtons}
        isPlain={isPlain}
        isLightBackground={isLightBackground}
      />
    )
  }

  // Standard card rendering
  return (
    <>
      <div className={cardClasses} ref={cardRef}>
        <div
          className="relative"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={handleMouseLeave}
        >
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
            <>
              <h3
                className="text-xs font-semibold text-gray-800 cursor-pointer hover:bg-gray-50 px-1 py-0.5 rounded leading-tight pr-8"
                onClick={() => setIsEditingTitle(true)}
              >
                {card.title}
              </h3>
              {isHovering && (
                <div className="absolute top-0 right-0 flex z-10 bg-white/95 rounded p-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={togglePlain}
                    className="h-4 w-4 p-0 text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                  >
                    <Minus className="h-2 w-2" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleLightBackground}
                    className="h-4 w-4 p-0 text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                  >
                    <Hash style={{ width: "10px", height: "10px" }} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsImageUploadOpen(true)
                    }}
                    className="h-4 w-4 p-0 text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                    title="Add image"
                  >
                    <ImageIcon className="h-2 w-2" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleCollapse}
                    className="h-4 w-4 p-0 text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                  >
                    {isCollapsed ? <ChevronDown className="h-2 w-2" /> : <ChevronUp className="h-2 w-2" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDeleteClick}
                    className={`h-4 w-4 p-0 transition-colors duration-200 ${
                      isDeleteConfirming
                        ? "text-red-600 hover:text-red-700 hover:bg-red-100 bg-red-50"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                    }`}
                  >
                    <X className="h-2 w-2" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {!isCollapsed && (
          <div className="text-xs leading-tight pt-2">
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
                className={`prose prose-sm max-w-none cursor-pointer p-1 rounded py-0 ${isEmptyContent ? "min-h-[60px] bg-gray-50/50 hover:bg-gray-100/50 flex items-center justify-center" : ""}`}
                onClick={startEditingContent}
              >
                {isEmptyContent ? (
                  <span className="text-gray-400 text-xs">Click to add content</span>
                ) : (
                  <MarkdownRenderer
                    content={card.content}
                    onCheckboxToggle={handleCheckboxToggle}
                    onImageClick={handleImageClick}
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
  isLightBackground 
}: {
  card: CardType
  isHovering: boolean
  isImageModalOpen: boolean
  isImageUploadOpen: boolean
  imageUrl: string
  onMouseEnter: () => void
  onMouseLeave: () => void
  onClick: () => void
  onImageClick: (url: string) => void
  onImageModalClose: () => void
  onImageUploadClose: () => void
  onImageSelect: (imageId: string, filename: string) => void
  renderControlButtons: () => React.ReactNode
  isPlain: boolean
  isLightBackground: boolean
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
        console.error("Error loading image:", error)
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
      <div className={`${isPlain ? "" : `${isLightBackground ? "bg-gray-50" : "bg-white"} border border-gray-200 shadow-[2px_2px_4px_rgba(0,0,0,0.1)]`} overflow-hidden relative cursor-pointer h-32 flex items-center justify-center`}>
        <span className="text-gray-400 text-xs">Loading image...</span>
      </div>
    )
  }

  if (!imageData || !imageData.url) {
    return (
      <div className={`${isPlain ? "" : `${isLightBackground ? "bg-gray-50" : "bg-white"} border border-gray-200 shadow-[2px_2px_4px_rgba(0,0,0,0.1)]`} overflow-hidden relative cursor-pointer h-32 flex items-center justify-center`}>
        <span className="text-gray-400 text-xs">Image not available</span>
      </div>
    )
  }

  return (
    <>
      <div
        className={`${isPlain ? "" : `${isLightBackground ? "bg-gray-50" : "bg-white"} border border-gray-200 shadow-[2px_2px_4px_rgba(0,0,0,0.1)]`} overflow-hidden relative cursor-pointer`}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onClick={onClick}
      >
        {isHovering && (
          <>
            {renderControlButtons()}
            <Button
              variant="ghost"
              size="sm"
              onClick={openImageModal}
              className="absolute bottom-2 right-2 z-10 h-6 w-6 p-0 bg-white/95 hover:bg-white/100 rounded-full"
            >
              <Maximize2 className="h-3 w-3" />
            </Button>
          </>
        )}
        <img
          src={imageData.url}
          alt={imageData.alt}
          className="w-full object-cover"
          style={{ height: "auto" }}
          onError={(e) => {
            console.error(`Failed to load image: ${imageData.url}`)
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
  isLightBackground 
}: {
  card: CardType
  isHovering: boolean
  isImageModalOpen: boolean
  isImageUploadOpen: boolean
  imageUrl: string
  onMouseEnter: () => void
  onMouseLeave: () => void
  onClick: () => void
  onImageClick: (url: string) => void
  onImageModalClose: () => void
  onImageUploadClose: () => void
  onImageSelect: (imageId: string, filename: string) => void
  renderControlButtons: () => React.ReactNode
  isPlain: boolean
  isLightBackground: boolean
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
        console.error("Error loading image:", error)
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
        className={`${isPlain ? "" : `${isLightBackground ? "bg-gray-50" : "bg-white"} border border-gray-200 shadow-[2px_2px_4px_rgba(0,0,0,0.1)]`} overflow-hidden relative cursor-pointer`}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onClick={onClick}
      >
        {isHovering && renderControlButtons()}
        <img
          src={imageData.url}
          alt={imageData.alt}
          className="w-full object-cover"
          style={{ height: "45px", objectPosition: "center top" }}
          onError={(e) => {
            console.error(`Failed to load image: ${imageData.url}`)
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
