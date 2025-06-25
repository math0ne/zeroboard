/**
 * @file image-utils.ts
 * @description Utility functions for handling images and content detection in markdown
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
        // Error resolving local image
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
      // Error resolving local image
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
 * Check if markdown content contains only a code block
 * @param {string} content - Markdown content to check
 * @returns {boolean} True if content contains only a code block
 */
export function isCodeOnlyContent(content: string): boolean {
  const trimmed = content.trim()
  return /^```[\s\S]*```$/.test(trimmed)
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

// ============================================================================
// Firebase Image Sync Utilities
// ============================================================================

/**
 * Check if an image source is a base64 data URL
 * @param {string} src - Image source URL
 * @returns {boolean} True if the source is a base64 data URL
 */
export const isBase64Image = (src: string): boolean => {
  return src.startsWith('data:image/');
};

/**
 * Check if an image source is a Firebase Storage URL
 * @param {string} src - Image source URL
 * @returns {boolean} True if the source is a Firebase Storage URL
 */
export const isFirebaseImage = (src: string): boolean => {
  return src.includes('firebasestorage.googleapis.com');
};

/**
 * Extract all image sources from markdown content
 * @param {string} content - Markdown content
 * @returns {string[]} Array of image source URLs
 */
export const extractImageSources = (content: string): string[] => {
  const imageRegex = /!\[.*?\]\(([^)]+)\)/g;
  const sources: string[] = [];
  let match;
  
  while ((match = imageRegex.exec(content)) !== null) {
    sources.push(match[1]);
  }
  
  return sources;
};

/**
 * Check if a card has any base64 images that need migration
 * @param {string} content - Card content to check
 * @returns {boolean} True if the card has base64 images
 */
export const cardNeedsMigration = (content: string): boolean => {
  const imageSources = extractImageSources(content);
  return imageSources.some(src => isBase64Image(src));
};

/**
 * Check if a card has Firebase images that need downloading
 * @param {string} content - Card content to check
 * @returns {boolean} True if the card has Firebase images
 */
export const cardNeedsDownload = (content: string): boolean => {
  const imageSources = extractImageSources(content);
  return imageSources.some(src => isFirebaseImage(src));
};

/**
 * Get image statistics for a card
 * @param {string} content - Card content to analyze
 * @returns {Object} Statistics about images in the card
 */
export const getCardImageStats = (content: string) => {
  const imageSources = extractImageSources(content);
  const base64Count = imageSources.filter(src => isBase64Image(src)).length;
  const firebaseCount = imageSources.filter(src => isFirebaseImage(src)).length;
  const localCount = imageSources.filter(src => src.startsWith('local:')).length;
  const otherCount = imageSources.length - base64Count - firebaseCount - localCount;
  
  return {
    total: imageSources.length,
    base64: base64Count,
    firebase: firebaseCount,
    local: localCount,
    other: otherCount,
    sources: imageSources
  };
};

/**
 * Progressive image loading helper
 * @param {string} src - Image source URL
 * @returns {Promise<string>} Promise that resolves to the source URL when loaded
 */
export const createImageLoadPromise = (src: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(src);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
};

/**
 * Batch load images with progress tracking
 * @param {string[]} sources - Array of image source URLs
 * @param {Function} onProgress - Optional progress callback
 * @returns {Promise<string[]>} Promise that resolves to array of loaded sources
 */
export const loadImagesWithProgress = async (
  sources: string[], 
  onProgress?: (loaded: number, total: number) => void
): Promise<string[]> => {
  const loadedSources: string[] = [];
  
  for (let i = 0; i < sources.length; i++) {
    try {
      const loadedSrc = await createImageLoadPromise(sources[i]);
      loadedSources.push(loadedSrc);
    } catch (error) {
      console.warn(`Failed to load image ${i + 1}/${sources.length}:`, error);
      // Still add the source even if it failed to load
      loadedSources.push(sources[i]);
    }
    
    if (onProgress) {
      onProgress(i + 1, sources.length);
    }
  }
  
  return loadedSources;
};
