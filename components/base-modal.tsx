/**
 * @file base-modal.tsx
 * @description Base modal component to eliminate duplication across different modals
 */

"use client"

import React from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

/**
 * Props for the BaseModal component
 */
interface BaseModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl" | "7xl"
  maxHeight?: string
  className?: string
  showCloseButton?: boolean
  closeOnBackdrop?: boolean
}

/**
 * Base modal component with common functionality
 */
export function BaseModal({
  isOpen,
  onClose,
  children,
  maxWidth = "4xl",
  maxHeight = "90vh",
  className = "",
  showCloseButton = true,
  closeOnBackdrop = true
}: BaseModalProps) {
  /**
   * Handle escape key to close modal
   */
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      // Prevent background scrolling
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  /**
   * Handle backdrop click to close modal
   */
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" 
      onClick={handleBackdropClick}
    >
      <div 
        className={`relative max-w-${maxWidth} max-h-[${maxHeight}] bg-white overflow-hidden ${className}`}
      >
        {showCloseButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute top-2 right-2 z-10 h-8 w-8 p-0 bg-white/80 hover:bg-white"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        {children}
      </div>
    </div>
  )
}

/**
 * Hook for modal state management
 */
export const useModal = (initialState = false) => {
  const [isOpen, setIsOpen] = React.useState(initialState)

  const openModal = React.useCallback(() => setIsOpen(true), [])
  const closeModal = React.useCallback(() => setIsOpen(false), [])
  const toggleModal = React.useCallback(() => setIsOpen(prev => !prev), [])

  return {
    isOpen,
    openModal,
    closeModal,
    toggleModal
  }
}