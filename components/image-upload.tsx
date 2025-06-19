"use client"

import type React from "react"
import { useState, useRef } from "react"
import { ImageIcon } from "lucide-react"
import { imageService } from "@/lib/indexeddb-image-service"

interface ImageUploadProps {
  onImageUploaded: (imageId: string, filename: string) => void
  maxSizeKB?: number
}

export function ImageUpload({ onImageUploaded, maxSizeKB = 500 }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file")
      return
    }

    // Check file size
    const fileSizeKB = file.size / 1024
    if (fileSizeKB > maxSizeKB) {
      alert(`Image too large. Please select an image smaller than ${maxSizeKB}KB`)
      return
    }

    setIsUploading(true)

    try {
      // Generate unique ID for the image
      const imageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Create blob from file
      const blob = new Blob([file], { type: file.type })

      // Store in IndexedDB
      await imageService.storeImage(imageId, file.name, blob, file.type)

      console.log("Image uploaded successfully:", {
        id: imageId,
        filename: file.name,
        size: `${fileSizeKB.toFixed(1)}KB`,
        type: file.type,
      })

      // Return the image ID
      onImageUploaded(imageId, file.name)
    } catch (error) {
      console.error("Error uploading image:", error)
      alert("Error uploading image. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }


  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="w-full">
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />

      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
          isDragging ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400"
        } ${isUploading ? "opacity-50 pointer-events-none" : ""}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={triggerFileSelect}
      >
        {isUploading ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
            <p className="text-sm text-gray-600">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <ImageIcon className="h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 mb-1">Drop an image here or click to select</p>
            <p className="text-xs text-gray-400">Max size: {maxSizeKB}KB</p>
          </div>
        )}
      </div>
    </div>
  )
}
