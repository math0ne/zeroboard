"use client"
import { useState, useEffect } from "react"
import Image from "next/image"
import { Trash2, Copy, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { imageService, type StoredImage } from "@/lib/indexeddb-image-service"

interface ImageManagerProps {
  onImageSelect?: (imageId: string, filename: string) => void
  showSelector?: boolean
}

export function ImageManager({ onImageSelect, showSelector = false }: ImageManagerProps) {
  const [images, setImages] = useState<StoredImage[]>([])
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({})

  useEffect(() => {
    loadImages()
  }, [])

  const loadImages = async () => {
    try {
      const storedImages = await imageService.getAllImages()
      setImages(storedImages)

      // Create object URLs for display
      const urls: Record<string, string> = {}
      for (const image of storedImages) {
        urls[image.id] = URL.createObjectURL(image.blob)
      }
      setImageUrls(urls)
    } catch (error) {
      setImages([])
    }
  }

  // Cleanup object URLs when component unmounts or images change
  useEffect(() => {
    return () => {
      Object.values(imageUrls).forEach(url => {
        URL.revokeObjectURL(url)
      })
    }
  }, [imageUrls])

  const deleteImage = async (imageId: string) => {
    try {
      await imageService.deleteImage(imageId)
      
      // Revoke the object URL for the deleted image
      if (imageUrls[imageId]) {
        URL.revokeObjectURL(imageUrls[imageId])
      }
      
      loadImages()
    } catch (error) {
      // Error deleting image
    }
  }

  const copyImageMarkdown = (image: StoredImage) => {
    const markdown = `![${image.filename}](local:${image.id})`
    navigator.clipboard.writeText(markdown)
    alert("Markdown copied to clipboard!")
  }

  const downloadImage = (image: StoredImage) => {
    const link = document.createElement("a")
    link.href = imageUrls[image.id] || URL.createObjectURL(image.blob)
    link.download = image.filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const handleImageClick = (image: StoredImage) => {
    if (showSelector && onImageSelect) {
      setSelectedImage(image.id)
      onImageSelect(image.id, image.filename)
    }
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No images uploaded yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap">
        {images.map((image) => (
          <div
            key={image.id}
            className={`border rounded-lg overflow-hidden ${
              showSelector
                ? `cursor-pointer hover:border-blue-400 ${selectedImage === image.id ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-200"}`
                : "border-gray-200"
            }`}
            style={{ width: '120px', minWidth: '120px', maxWidth: '120px', marginRight: '12px', marginBottom: '12px' }}
            onClick={() => handleImageClick(image)}
          >
            <div className="aspect-square relative" style={{ width: '120px', height: '120px' }}>
              <Image
                src={imageUrls[image.id] || "/placeholder.svg"}
                alt={image.filename}
                width={120}
                height={120}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Failed to load image
                  e.currentTarget.src =
                    "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2232%22%20height%3D%2232%22%20viewBox%3D%220%200%2032%2032%22%3E%3Cpath%20fill%3D%22%23ccc%22%20d%3D%22M30%2026h-28v-20h28v20zm2-22h-32v24h32v-24z%22%2F%3E%3Cpath%20fill%3D%22%23ccc%22%20d%3D%22M12%2016l6-8%206%208v6h-12v-6z%22%2F%3E%3Ccircle%20fill%3D%22%23ccc%22%20cx%3D%2212%22%20cy%3D%2212%22%20r%3D%222%22%2F%3E%3C%2Fsvg%3E"
                }}
              />
            </div>
            <div className="p-2">
              <p className="text-xs font-medium truncate" title={image.filename}>
                {image.filename}
              </p>
              <p className="text-xs text-gray-500">{formatFileSize(image.size)}</p>
              <div className="flex justify-between mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    copyImageMarkdown(image)
                  }}
                  className="h-6 w-6 p-0"
                  title="Copy markdown"
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    downloadImage(image)
                  }}
                  className="h-6 w-6 p-0"
                  title="Download"
                >
                  <Download className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm("Delete this image?")) {
                      deleteImage(image.id)
                    }
                  }}
                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                  title="Delete"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-xs text-gray-500 text-center">
        {images.length} image{images.length !== 1 ? "s" : ""} stored locally
      </div>
    </div>
  )
}
