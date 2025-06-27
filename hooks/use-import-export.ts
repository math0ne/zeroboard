/**
 * @file use-import-export.ts
 * @description Custom hook for managing board import/export functionality
 */

import { useRef } from "react"
import { imageService } from "@/lib/indexeddb-image-service"
import { clearImageCache } from "@/lib/image-utils"
import type { Board } from "@/lib/default-boards-data"

export const useImportExport = (
  boards: Board[],
  currentBoardId: string,
  setBoards: (boards: Board[]) => void,
  setCurrentBoardId: (id: string) => void,
  setCurrentBoardTitle: (title: string) => void
) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const exportBoards = async () => {
    try {
      // Get all stored images from IndexedDB
      const storedImages = await imageService.getAllImages()

      // Find all image references in board content to only export used images
      const usedImageIds = new Set<string>()
      boards.forEach(board => {
        board.columns.forEach(column => {
          column.cards.forEach(card => {
            // Find local image references in card content
            const localImageMatches = card.content.match(/local:([a-zA-Z0-9_]+)/g)
            if (localImageMatches) {
              localImageMatches.forEach(match => {
                const imageId = match.replace('local:', '')
                usedImageIds.add(imageId)
              })
            }
          })
        })
      })

      // Only export images that are actually used in the boards
      const exportImages: { [key: string]: any } = {}
      for (const imageId of usedImageIds) {
        const imageData = storedImages.find(img => img.id === imageId)
        if (imageData) {
          // Convert blob to base64 for export
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(imageData.blob)
          })

          exportImages[imageId] = {
            id: imageData.id,
            filename: imageData.filename,
            base64: base64,
            size: imageData.size,
            type: imageData.type,
            uploadedAt: imageData.uploadedAt
          }
        }
      }

      const dataToExport = {
        boards,
        currentBoardId,
        images: exportImages,
        exportDate: new Date().toISOString(),
        version: "3.0", // Increment version to indicate IndexedDB format
      }

      const dataStr = JSON.stringify(dataToExport, null, 2)
      const dataBlob = new Blob([dataStr], { type: "application/json" })

      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement("a")
      link.href = url
      link.download = `zeroboard-export-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      const imageCount = Object.keys(exportImages).length
      alert(`Export successful! Included ${boards.length} boards and ${imageCount} images.`)
    } catch (error) {
      alert("Failed to export boards. Please try again.")
    }
  }

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string)

        // Validate the imported data structure
        if (importedData.boards && Array.isArray(importedData.boards)) {
          // Validate that each board has the required structure
          const isValidData = importedData.boards.every(
            (board: any) => board.id && board.title && board.columns && Array.isArray(board.columns),
          )

          if (isValidData) {
            const loadedBoardId = importedData.currentBoardId || importedData.boards[0]?.id || "personal"
            const loadedBoard = importedData.boards.find((board: Board) => board.id === loadedBoardId) || importedData.boards[0]
            
            setBoards(importedData.boards)
            setCurrentBoardId(loadedBoardId)
            setCurrentBoardTitle(loadedBoard.title)
            
            // Handle images if they exist in the import
            let importedImageCount = 0
            if (importedData.images && typeof importedData.images === 'object') {
              try {
                const imageIds = Object.keys(importedData.images)
                
                // Import each image to IndexedDB
                for (const imageId of imageIds) {
                  const imageData = importedData.images[imageId]
                  if (imageData.base64) {
                    try {
                      // Convert base64 back to blob
                      const response = await fetch(imageData.base64)
                      const blob = await response.blob()

                      // Store in IndexedDB
                      await imageService.storeImage(
                        imageData.id,
                        imageData.filename,
                        blob,
                        imageData.type
                      )

                      importedImageCount++
                    } catch (error) {
                      // Continue with other images even if one fails
                    }
                  }
                }

                // Clear image cache after importing so components will re-load images
                if (importedImageCount > 0) {
                  clearImageCache()
                }
              } catch (error) {
                // Continue with board import even if images fail
              }
            }

            // Show success message with image count
            const version = importedData.version || "1.0"
            if (importedImageCount > 0) {
              alert(`Import successful! Imported ${importedData.boards.length} boards and ${importedImageCount} images (format v${version}).`)
            } else {
              alert(`Import successful! Imported ${importedData.boards.length} boards (format v${version}).`)
            }
          } else {
            throw new Error("Invalid board data structure")
          }
        } else {
          throw new Error("Invalid file format")
        }
      } catch (error) {
        alert("Failed to import boards. Please check the file format and try again.")
      }
    }

    reader.readAsText(file)
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const triggerImport = () => {
    fileInputRef.current?.click()
  }

  return {
    fileInputRef,
    exportBoards,
    handleImportFile,
    triggerImport
  }
}