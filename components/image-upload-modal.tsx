"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ImageUpload } from "./image-upload"
import { ImageManager } from "./image-manager"

interface ImageUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onImageSelect: (imageId: string, filename: string) => void
}

export function ImageUploadModal({ isOpen, onClose, onImageSelect }: ImageUploadModalProps) {
  const [activeTab, setActiveTab] = useState<string>("upload")

  const handleImageUploaded = (imageId: string, filename: string) => {
    onImageSelect(imageId, filename)
    onClose()
  }

  const handleImageSelected = (imageId: string, filename: string) => {
    onImageSelect(imageId, filename)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl max-w-[90vw] max-h-[90vh]" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Images</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2 pb-4 flex flex-col overflow-hidden">
          <div className="flex-shrink-0">
            <ImageUpload onImageUploaded={handleImageUploaded} maxSizeKB={5000} />
          </div>

          <div className="mt-6 flex-1 overflow-hidden">
            <h3 className="text-sm font-medium mb-2">Image Library</h3>
            <div className="overflow-y-auto max-h-[60vh]">
              <ImageManager onImageSelect={handleImageSelected} showSelector={true} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
