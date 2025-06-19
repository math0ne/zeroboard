/**
 * @file image-utils.ts
 * @description Utility functions for handling images in markdown content
 */

/**
 * Extract image URL and alt text from markdown content
 * @param {string} markdown - Markdown content containing an image
 * @returns {Object} Object containing url and alt text
 */
export function getImageUrlFromMarkdown(markdown: string): { url: string; alt: string } {
  // Simple regex to extract image URL and alt text
  const match = markdown.match(/!\[([^\]]*)\]\(([^)]+)\)/)

  if (match) {
    const alt = match[1] || ""
    const url = match[2] || ""

    // Handle local images stored in localStorage
    if (url.startsWith("local:")) {
      try {
        const imageId = url.replace("local:", "")
        const storedImages = JSON.parse(localStorage.getItem("kanban-images") || "{}")
        const imageData = storedImages[imageId]
        if (imageData && imageData.base64) {
          return { url: imageData.base64, alt }
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
 * Resolve a local image URL to its base64 representation
 * @param {string} src - Image source URL (may be local: prefixed)
 * @returns {string} Resolved image URL or original URL if not local
 */
export function resolveImageUrl(src: string): string {
  if (!src) return ""

  if (src.startsWith("local:")) {
    try {
      const imageId = src.replace("local:", "")
      const storedImages = JSON.parse(localStorage.getItem("kanban-images") || "{}")
      const imageData = storedImages[imageId]
      if (imageData && imageData.base64) {
        return imageData.base64
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
