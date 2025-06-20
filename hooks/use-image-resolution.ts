/**
 * @file use-image-resolution.ts
 * @description Unified image resolution hook to eliminate duplication across image components
 */

import { useState, useEffect, useRef } from "react"
import { 
  getImageUrlFromMarkdown, 
  resolveImageUrl, 
  getCachedImageUrl, 
  getCacheVersion 
} from "@/lib/image-utils"

/**
 * Hook for resolving image URLs with caching
 */
export const useImageResolution = (src?: string) => {
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(() => {
    // Initialize with cached value if available
    return src ? getCachedImageUrl(src) : null
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isResolvingRef = useRef(false)

  useEffect(() => {
    const resolveImage = async () => {
      if (!src) {
        setResolvedSrc(null)
        setIsLoading(false)
        setError(null)
        return
      }

      // Check persistent cache first
      const cached = getCachedImageUrl(src)
      if (cached) {
        setResolvedSrc(cached)
        setIsLoading(false)
        setError(null)
        return
      }

      // Only resolve if not already resolving and not cached
      if (isResolvingRef.current) return
      
      isResolvingRef.current = true
      setIsLoading(true)
      setError(null)
      
      try {
        const resolved = await resolveImageUrl(src)
        setResolvedSrc(resolved || null)
        if (!resolved) {
          setError("Failed to resolve image")
        }
      } catch (err) {
        setResolvedSrc(null)
        setError(err instanceof Error ? err.message : "Unknown error")
      }
      
      setIsLoading(false)
      isResolvingRef.current = false
    }

    resolveImage()
  }, [src])

  return { resolvedSrc, isLoading, error }
}

/**
 * Hook for resolving images from markdown content
 */
export const useMarkdownImageResolution = (content: string) => {
  const [imageData, setImageData] = useState<{ url: string; alt: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const cacheVersion = getCacheVersion()

  useEffect(() => {
    const loadImage = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        const { url, alt } = await getImageUrlFromMarkdown(content)
        setImageData({ url, alt })
      } catch (err) {
        setImageData(null)
        setError(err instanceof Error ? err.message : "Failed to extract image from markdown")
      }
      
      setIsLoading(false)
    }

    loadImage()
  }, [content, cacheVersion])

  return { imageData, isLoading, error }
}

/**
 * Combined hook for image components that need both markdown parsing and URL resolution
 */
export const useAsyncImageCard = (content: string) => {
  const { imageData, isLoading: isMarkdownLoading, error: markdownError } = useMarkdownImageResolution(content)
  const { resolvedSrc, isLoading: isResolutionLoading, error: resolutionError } = useImageResolution(imageData?.url)

  const isLoading = isMarkdownLoading || isResolutionLoading
  const error = markdownError || resolutionError
  const finalImageData = imageData && resolvedSrc ? { ...imageData, url: resolvedSrc } : null

  return { imageData: finalImageData, isLoading, error }
}