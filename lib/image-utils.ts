/**
 * @file image-utils.ts
 * @description Utility functions for handling images in markdown content
 */

import { imageService } from './indexeddb-image-service'

// Cache for resolved image URLs to avoid repeated IndexedDB calls
const imageUrlCache = new Map<string, string>()

// Cache for fully resolved URLs (including external URLs) to prevent component re-render issues
const resolvedUrlCache = new Map<string, string>()

// Cache version to trigger re-loading when cache is cleared
let cacheVersion = 0

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

  // Check the resolved URL cache first (for all URLs)
  if (resolvedUrlCache.has(src)) {
    return resolvedUrlCache.get(src)!
  }

  if (src.startsWith("local:")) {
    try {
      const imageId = src.replace("local:", "")
      
      // Check IndexedDB cache
      if (imageUrlCache.has(imageId)) {
        const dataUrl = imageUrlCache.get(imageId)!
        resolvedUrlCache.set(src, dataUrl)
        return dataUrl
      }

      // Fetch from IndexedDB
      const dataUrl = await imageService.getImageAsDataURL(imageId)
      if (dataUrl) {
        imageUrlCache.set(imageId, dataUrl)
        resolvedUrlCache.set(src, dataUrl)
        return dataUrl
      }
    } catch (error) {
      console.error("Error resolving local image:", error)
    }
    return ""
  }

  // For external URLs, cache them as-is
  resolvedUrlCache.set(src, src)
  return src
}

/**
 * Synchronously get a resolved image URL from cache
 * @param {string} src - Image source URL
 * @returns {string | null} Cached URL or null if not cached
 */
export function getCachedImageUrl(src: string): string | null {
  return resolvedUrlCache.get(src) || null
}

/**
 * Clear all image caches to force re-loading of images
 * Useful after importing new images
 */
export function clearImageCache(): void {
  imageUrlCache.clear()
  resolvedUrlCache.clear()
  cacheVersion++ // Increment version to trigger re-loading in components
}

/**
 * Get current cache version to detect when cache has been cleared
 * @returns {number} Current cache version
 */
export function getCacheVersion(): number {
  return cacheVersion
}

/**
 * Clear cache for specific image URLs
 * @param {string[]} urls - Array of URLs to clear from cache
 */
export function clearSpecificImageCache(urls: string[]): void {
  urls.forEach(url => {
    resolvedUrlCache.delete(url)
    if (url.startsWith("local:")) {
      const imageId = url.replace("local:", "")
      imageUrlCache.delete(imageId)
    }
  })
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
