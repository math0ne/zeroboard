/**
 * @file image-utils.ts
 * @description Utility functions for handling images in markdown content
 */

import { imageService } from './indexeddb-image-service'

// Cache for resolved image URLs to avoid repeated IndexedDB calls
const imageUrlCache = new Map<string, string>()

/**
 * Extract image URL and alt text from markdown content
 * @param {string} markdown - Markdown content containing an image
 * @returns {Promise<Object>} Promise resolving to object containing url and alt text
 */
export async function getImageUrlFromMarkdown(markdown: string): Promise<{ url: string; alt: string }> {
  // Simple regex to extract image URL and alt text
  const match = markdown.match(/!\[([^\]]*)\]\(([^)]+)\)/)

  if (match) {
    const alt = match[1] || ""
    const url = match[2] || ""

    // Handle local images stored in IndexedDB
    if (url.startsWith("local:")) {
      try {
        const imageId = url.replace("local:", "")
        
        // Check cache first
        if (imageUrlCache.has(imageId)) {
          return { url: imageUrlCache.get(imageId)!, alt }
        }

        // Fetch from IndexedDB
        const dataUrl = await imageService.getImageAsDataURL(imageId)
        if (dataUrl) {
          imageUrlCache.set(imageId, dataUrl)
          return { url: dataUrl, alt }
        }
      } catch (error) {
        console.error("Error resolving local image:", error)
      }
      return { url: "", alt }
    }

    // Return external URL as is
    return { url, alt }
  }

  return { url: "", alt: "" }
}

/**
 * Resolve a local image URL to its data URL representation
 * @param {string} src - Image source URL (may be local: prefixed)
 * @returns {Promise<string>} Promise resolving to resolved image URL or original URL if not local
 */
export async function resolveImageUrl(src: string): Promise<string> {
  if (!src) return ""

  if (src.startsWith("local:")) {
    try {
      const imageId = src.replace("local:", "")
      
      // Check cache first
      if (imageUrlCache.has(imageId)) {
        return imageUrlCache.get(imageId)!
      }

      // Fetch from IndexedDB
      const dataUrl = await imageService.getImageAsDataURL(imageId)
      if (dataUrl) {
        imageUrlCache.set(imageId, dataUrl)
        return dataUrl
      }
    } catch (error) {
      console.error("Error resolving local image:", error)
    }
    return ""
  }

  return src
}

/**
 * Check if markdown content contains only an image
 * @param {string} content - Markdown content to check
 * @returns {boolean} True if content contains only an image
 */
export function isImageOnlyContent(content: string): boolean {
  return /^\s*!\[.*?\](.*?)\s*$/.test(content.trim())
}

/**
 * Check if markdown content contains only a table
 * @param {string} content - Markdown content to check
 * @returns {boolean} True if content contains only a table
 */
export function isTableOnlyContent(content: string): boolean {
  return /^\s*\|.*\|\s*\n\s*\|[\s\-|:]*\|\s*(\n\s*\|.*\|\s*)*\s*$/.test(content.trim())
}

/**
 * Check if markdown content starts with an image
 * @param {string} content - Markdown content to check
 * @returns {boolean} True if content starts with an image
 */
export function startsWithImage(content: string): boolean {
  return /^\s*!\[.*?\](.*?)/.test(content.trim())
}

/**
 * Create an error element for failed image loading
 * @param {string} message - Error message to display
 * @returns {HTMLDivElement} Error element
 */
export function createImageErrorElement(message = "Image not available test3"): HTMLDivElement {
  const errorDiv = document.createElement("div")
  errorDiv.className = "flex items-center justify-center p-4 bg-gray-50 text-gray-400 text-xs h-full"
  errorDiv.textContent = message
  return errorDiv
}
