"use client"

import type React from "react"
import { useState, useRef } from "react"
import { ImageIcon } from "lucide-react"

interface ImageUploadProps {
  onImageUploaded: (imageId: string, filename: string) => void
  maxSizeKB?: number
}

export function ImageUpload({ onImageUploaded, maxSizeKB = 500 }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Completely rewritten handleFileUpload function with better debugging
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
      // Convert to base64
      const base64 = await fileToBase64(file)

      if (!base64) {
        throw new Error("Failed to convert file to base64")
      }

      // Generate unique ID for the image
      const imageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Store in localStorage
      const imageData = {
        id: imageId,
        filename: file.name,
        base64: base64,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
      }

      // Get existing images
      let existingImages = {}
      try {
        const storedImagesStr = localStorage.getItem("kanban-images")
        existingImages = storedImagesStr ? JSON.parse(storedImagesStr) : {}
      } catch (error) {
        console.error("Error parsing existing images:", error)
        existingImages = {}
      }

      // Add new image
      existingImages[imageId] = imageData

      // Store back to localStorage
      localStorage.setItem("kanban-images", JSON.stringify(existingImages))

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

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result)
        } else {
          reject(new Error("Failed to convert file to base64"))
        }
      }
      reader.onerror = (error) => reject(error)
    })
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
