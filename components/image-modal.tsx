"use client"

import type React from "react"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

interface ImageModalProps {
  imageUrl: string
  onClose: () => void
}

export function ImageModal({ imageUrl, onClose }: ImageModalProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!imageUrl) {
      setError(true)
      setIsLoading(false)
      return
    }

    const img = new Image()
    img.onload = () => {
      setIsLoading(false)
      setError(false)
    }
    img.onerror = () => {
      setError(true)
      setIsLoading(false)
    }
    img.src = imageUrl
  }, [imageUrl])

  // Handle click outside to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={handleBackdropClick}>
      <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-lg overflow-hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute top-2 right-2 z-10 h-8 w-8 p-0 bg-white/80 hover:bg-white rounded-full"
        >
          <X className="h-4 w-4" />
        </Button>

        {isLoading && (
          <div className="flex items-center justify-center h-64 w-64 bg-gray-100">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800"></div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-64 w-64 bg-gray-100 text-gray-500">
            Failed to load image
          </div>
        )}

        {!isLoading && !error && (
          <img
            src={imageUrl || "/placeholder.svg"}
            alt="Enlarged view"
            className="max-h-[80vh] max-w-full object-contain"
          />
        )}
      </div>
    </div>
  )
}
