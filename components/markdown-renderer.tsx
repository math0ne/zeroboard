/**
 * @file markdown-renderer.tsx
 * @description Renders markdown content with various display modes and interactive features.
 * This component handles different rendering modes including standard markdown, image-only,
 * and table-only views. It also provides interactive features like checkbox toggling and
 * image expansion.
 */

"use client"

import type React from "react"

import { useMemo, useState, useEffect, useRef } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Button } from "@/components/ui/button"
import { Maximize2 } from "lucide-react"
import { getImageUrlFromMarkdown, resolveImageUrl, getCachedImageUrl, getCacheVersion, createImageErrorElement } from "@/lib/image-utils"

/**
 * Props for the MarkdownRenderer component
 * @interface MarkdownRendererProps
 * @property {string} content - The markdown content to render
 * @property {boolean} [imageOnly] - Whether to render only the first image in the content
 * @property {number} [collapsedImageHeight] - Height for collapsed image view
 * @property {function} [onCheckboxToggle] - Callback when a checkbox is toggled
 * @property {boolean} [tableOnly] - Whether to render only tables in the content
 * @property {function} [onImageClick] - Callback when an image is clicked
 * @property {boolean} [codeOnlyFullWidth] - Whether to render code blocks at full width for code-only cards
 */
interface MarkdownRendererProps {
  content: string
  imageOnly?: boolean
  collapsedImageHeight?: number
  onCheckboxToggle?: (index: number) => void
  tableOnly?: boolean
  onImageClick?: (imageUrl: string) => void
  codeOnlyFullWidth?: boolean
}

/**
 * Custom syntax highlighter component for code blocks
 * @param {Object} props - Component props
 * @param {string} props.language - The programming language for syntax highlighting
 * @param {string} props.children - The code content
 * @param {boolean} [props.fullWidth] - Whether to render at full width
 * @returns {JSX.Element} Rendered code block with syntax highlighting
 */
function CodeBlock({ language, children, fullWidth = false }: { language: string; children: string; fullWidth?: boolean }) {
  // Function to tokenize and highlight code based on language patterns
  const tokenizeCode = () => {
    const tokens: Array<{ type: string; content: string }> = []

    // Common patterns across languages
    const patterns = [
      { type: "comment", regex: /\/\/.*$|\/\*[\s\S]*?\*\//gm },
      { type: "string", regex: /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`/g },
      {
        type: "keyword",
        regex:
          /\b(const|let|var|function|return|if|else|for|while|class|import|export|from|async|await|try|catch|throw|new|this|typeof|instanceof|void|delete|in|of|do|switch|case|break|continue|default|extends|implements|interface|package|private|protected|public|static|yield|debugger|with)\b/g,
      },
      { type: "type", regex: /\b(string|number|boolean|any|null|undefined|never|object|symbol|bigint|true|false)\b/g },
      { type: "number", regex: /\b\d+\b/g },
      { type: "function", regex: /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?=\()/g },
    ]

    // Language-specific patterns
    if (language === "python") {
      patterns.push({
        type: "python-keyword",
        regex: /\b(def|class|import|from|as|with|global|nonlocal|lambda|and|or|not|is|in|raise|except|finally)\b/g,
      })
    }

    const remainingCode = children
    const allMatches: Array<{ start: number; end: number; type: string; content: string }> = []

    // Find all matches for each pattern
    patterns.forEach((pattern) => {
      let match
      while ((match = pattern.regex.exec(remainingCode)) !== null) {
        allMatches.push({
          start: match.index,
          end: match.index + match[0].length,
          type: pattern.type,
          content: match[0],
        })
      }
      pattern.regex.lastIndex = 0 // Reset regex
    })

    // Sort matches by position
    allMatches.sort((a, b) => a.start - b.start)

    // Remove overlapping matches (keep the first one)
    const filteredMatches = []
    let lastEnd = 0
    for (const match of allMatches) {
      if (match.start >= lastEnd) {
        filteredMatches.push(match)
        lastEnd = match.end
      }
    }

    // Build tokens
    let currentPos = 0
    for (const match of filteredMatches) {
      // Add text before match
      if (match.start > currentPos) {
        tokens.push({
          type: "text",
          content: remainingCode.slice(currentPos, match.start),
        })
      }
      // Add the match
      tokens.push({
        type: match.type,
        content: match.content,
      })
      currentPos = match.end
    }

    // Add remaining text
    if (currentPos < remainingCode.length) {
      tokens.push({
        type: "text",
        content: remainingCode.slice(currentPos),
      })
    }

    return tokens
  }

  const tokens = tokenizeCode()

  /**
   * Get CSS style for a token type
   * @param {string} type - Token type
   * @returns {React.CSSProperties} CSS style object
   */
  const getTokenStyle = (type: string): React.CSSProperties => {
    switch (type) {
      case "comment":
        return { color: "#6a9955" }
      case "string":
        return { color: "#ce9178" }
      case "number":
        return { color: "#b5cea8" }
      case "keyword":
        return { color: "#569cd6" }
      case "type":
        return { color: "#4ec9b0" }
      case "function":
        return { color: "#dcdcaa" }
      case "python-keyword":
        return { color: "#c586c0" }
      default:
        return { color: "#d4d4d4" }
    }
  }

  return (
    <pre
      className={fullWidth ? 'full-width-code full-width-code full-width-code' : 'mb-1 rounded-md overflow-x-auto p-3 m-0 custom-code-block'}
      style={fullWidth ? {
        backgroundColor: "rgb(17, 24, 39)",
        color: "#f3f4f6",
        fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace",
        fontSize: "11px",
        lineHeight: "1.4",
        marginTop: "0 !important",
        marginRight: "-8px !important", 
        marginBottom: "15px !important",
        marginLeft: "-11px !important",
        borderRadius: "0 !important",
        width: "calc(100% + 19px) !important",
        maxWidth: "calc(100% + 19px) !important",
        minWidth: "calc(100% + 19px) !important",
        display: "block !important",
        overflow: "visible !important",
        padding: "12px !important",
        paddingLeft: "0px !important"
      } : {
        backgroundColor: "rgb(17, 24, 39)",
        color: "#f3f4f6",
        fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace",
        fontSize: "11px",
        lineHeight: "1.4",
        marginBottom: "15px"
      }}
    >
      <code style={{ backgroundColor: "transparent", fontSize: "11px", lineHeight: "1.4" }}>
        {tokens.map((token, index) => (
          <span key={index} style={getTokenStyle(token.type)}>
            {token.content}
          </span>
        ))}
      </code>
    </pre>
  )
}

/**
 * Component for rendering image-only cards that handles async image loading
 * @param {Object} props - Component props
 * @param {string} props.content - Markdown content containing image
 * @param {number} [props.collapsedImageHeight] - Height for collapsed view
 * @param {function} [props.onImageClick] - Callback when image is clicked
 * @returns {JSX.Element} Image only renderer
 */
function ImageOnlyRenderer({
  content,
  collapsedImageHeight,
  onImageClick,
}: {
  content: string
  collapsedImageHeight?: number
  onImageClick?: (imageUrl: string) => void
}) {
  const [imageData, setImageData] = useState<{ url: string; alt: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const cacheVersion = getCacheVersion()

  useEffect(() => {
    const loadImage = async () => {
      try {
        const { url, alt } = await getImageUrlFromMarkdown(content)
        setImageData({ url, alt })
      } catch (error) {
        setImageData(null)
      }
      setIsLoading(false)
    }

    loadImage()
  }, [content, cacheVersion])

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4 bg-gray-50 text-gray-400 text-xs h-full">
        Loading image...
      </div>
    )
  }

  // No image found
  if (!imageData || !imageData.url) {
    return (
      <div className="flex items-center justify-center p-4 bg-gray-50 text-gray-400 text-xs h-full">
        Image not available
      </div>
    )
  }

  const imageStyle: React.CSSProperties = {
    margin: 0,
    padding: 0,
    border: "none",
    display: "block",
    borderRadius: 0,
    width: "100%",
    objectFit: "cover",
  }

  // If collapsedImageHeight is provided, set height and crop the image
  if (collapsedImageHeight) {
    imageStyle.height = `${collapsedImageHeight}px`
    imageStyle.objectPosition = "center top"
  } else {
    imageStyle.height = "100%"
  }

  return (
    <img
      src={imageData.url}
      alt={imageData.alt}
      className="w-full object-cover"
      style={imageStyle}
      onClick={() => onImageClick?.(imageData.url)}
      onError={(e) => {
        const parent = e.currentTarget.parentElement
        if (parent) {
          e.currentTarget.style.display = "none"
          const errorDiv = createImageErrorElement()
          parent.appendChild(errorDiv)
        }
      }}
    />
  )
}

/**
 * Component for displaying an image with an expand button that handles async image loading
 * @param {Object} props - Component props
 * @param {string} [props.src] - Image source URL (may be local: prefixed)
 * @param {string} [props.alt] - Image alt text
 * @param {function} [props.onImageClick] - Callback when image is clicked
 * @returns {JSX.Element} Image with expand button
 */
function ImageWithExpand({
  src,
  alt,
  onImageClick,
}: { src?: string; alt?: string; onImageClick?: (imageUrl: string) => void }) {
  const [isHovering, setIsHovering] = useState(false)
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(() => {
    // Initialize with cached value if available
    return src ? getCachedImageUrl(src) : null
  })
  const [isLoading, setIsLoading] = useState(false)
  const isResolvingRef = useRef(false)

  // Resolve the image URL asynchronously, with persistent caching to prevent re-loads
  useEffect(() => {
    const resolveImage = async () => {
      if (!src) {
        setResolvedSrc(null)
        setIsLoading(false)
        return
      }

      // Check persistent cache first
      const cached = getCachedImageUrl(src)
      if (cached) {
        setResolvedSrc(cached)
        setIsLoading(false)
        return
      }

      // Only resolve if not already resolving and not cached
      if (isResolvingRef.current) return
      
      isResolvingRef.current = true
      setIsLoading(true)
      
      try {
        const resolved = await resolveImageUrl(src)
        setResolvedSrc(resolved || null)
      } catch (error) {
        setResolvedSrc(null)
      }
      
      setIsLoading(false)
      isResolvingRef.current = false
    }

    resolveImage()
  }, [src])

  const handleExpandClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onImageClick && resolvedSrc) {
      onImageClick(resolvedSrc)
    }
  }

  // Loading state (should be rare now due to caching)
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4 border border-dashed border-gray-300 rounded bg-gray-50 text-gray-400 text-xs">
        Loading image...
      </div>
    )
  }

  // If no resolved src, show error (only if not loading and not cached)
  if (!resolvedSrc) {
    return (
      <div className="flex items-center justify-center p-4 border border-dashed border-gray-300 rounded bg-gray-50 text-gray-400 text-xs">
        Image not available
      </div>
    )
  }

  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      style={{ display: "inline-block" }}
    >
      <img
        src={resolvedSrc}
        alt={alt || ""}
        className="max-w-full h-auto shadow-sm"
        onError={(e) => {
          e.currentTarget.style.display = "none"
          const errorDiv = createImageErrorElement()
          e.currentTarget.parentElement?.appendChild(errorDiv)
        }}
      />
      {isHovering && onImageClick && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleExpandClick}
          className="absolute bottom-5 right-2 z-10 h-6 w-6 p-0 bg-white/90 hover:bg-white shadow-sm rounded-full"
        >
          <Maximize2 className="h-3 w-3" />
        </Button>
      )}
    </span>
  )
}

/**
 * Main markdown renderer component with multiple rendering modes
 * @param {MarkdownRendererProps} props - Component props
 * @returns {JSX.Element} Rendered markdown content
 */
export function MarkdownRenderer({
  content,
  imageOnly = false,
  collapsedImageHeight,
  onCheckboxToggle,
  tableOnly = false,
  onImageClick,
  codeOnlyFullWidth = false,
}: MarkdownRendererProps) {
  const processedContent = useMemo(() => {
    return content
  }, [content])

  // For image-only cards, we need a special component that handles async loading
  if (imageOnly) {
    return <ImageOnlyRenderer content={content} collapsedImageHeight={collapsedImageHeight} onImageClick={onImageClick} />
  }

  // For table-only cards, render only the table content
  if (tableOnly) {
    return (
      <div className="leading-[1.4] text-xs" style={{ lineHeight: "1.4", margin: 0, padding: 0 }}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            table: ({ children }) => (
              <table className="min-w-full border-collapse border border-gray-300 w-full" style={{ margin: 0 }}>
                {children}
              </table>
            ),
            th: ({ children }) => (
              <th className="border border-gray-300 px-2 py-1 bg-gray-100 font-semibold text-left text-xs">
                {children}
              </th>
            ),
            td: ({ children }) => <td className="border border-gray-300 px-2 py-1 text-xs whitespace-normal" style={{ maxWidth: '200px' }}>{children}</td>,
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    )
  }

  // Standard markdown rendering with custom components
  return (
    <>
      {/* Global styles for markdown rendering */}
      <style jsx global>{`
        /* Target all pre tags within the markdown renderer */
        pre {
          background-color: rgb(17, 24, 39) !important;
          padding: 12px !important;
          margin: 0 0 15px 0 !important; /* Increased bottom margin from 4px to 15px */
          border-radius: 6px !important;
          overflow-x: auto !important;
          font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace !important;
          font-size: 11px !important;
          line-height: 1.4 !important;
          color: #f3f4f6 !important;
        }
        
        /* Special styling for full-width code blocks - only when code-only condition is met */
        .full-width-code.full-width-code.full-width-code {
          margin: 0 -8px 0 -8px !important;
          width: calc(100% + 16px) !important;
          max-width: calc(100% + 16px) !important;
          min-width: calc(100% + 16px) !important;
        }
        
        /* Force link breaking in table cells */
        td a {
          word-break: break-all !important;
          overflow-wrap: break-word !important;
          hyphens: auto !important;
        }
        
        /* Specific override for custom code blocks */
        .custom-code-block {
          padding-left: 0px !important;
          margin-bottom: 15px !important; /* Ensure consistent margin */
        }
        
        /* Ensure code elements inside pre also have consistent styling */
        pre code {
          background-color: transparent !important;
          font-size: 11px !important;
          line-height: 1.4 !important;
          padding: 0 !important;
          margin: 0 !important;
        }
        
        /* Reset any potential whitespace issues */
        .prose {
          margin: 0 !important;
        }

        .prose p {
          margin-top: 0 !important;
          margin-bottom: 10px !important;
        }

        .prose ul, .prose ol {
          margin-top: 0 !important;
          margin-bottom: 10px !important;
        }

        .prose li {
          margin-top: 0 !important;
          margin-bottom: 2px !important;
        }

        .prose blockquote {
          margin-top: 0 !important;
          margin-bottom: 10px !important;
        }

        .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
          margin-top: 0 !important;
          margin-bottom: 10px !important;
        }
        
        /* Custom checkbox styling */
        .custom-checkbox-wrapper {
          display: inline-block;
          margin-right: 6px;
          vertical-align: middle;
          margin-top: -2px;
          position: relative;
          top: -1px;
        }

        .custom-checkbox-wrapper input[type="checkbox"] {
          display: none;
        }

        .custom-checkbox-wrapper label {
          display: inline-block;
          cursor: pointer;
          position: relative;
        }

        .custom-checkbox-wrapper label span {
          display: inline-block;
          position: relative;
          background-color: transparent;
          width: 15px;
          height: 15px;
          transform-origin: center;
          border: 1.5px solid #666;
          border-radius: 3px;
          vertical-align: middle;
          transition: background-color 150ms 200ms, transform 350ms cubic-bezier(0.78, -1.22, 0.17, 1.89);
        }

        .custom-checkbox-wrapper label span:before {
          content: "";
          width: 0px;
          height: 2px;
          border-radius: 1px;
          background: #666;
          position: absolute;
          transform: rotate(45deg);
          top: 6px;
          left: 4px;
          transition: width 50ms ease 50ms;
          transform-origin: 0% 0%;
        }

        .custom-checkbox-wrapper label span:after {
          content: "";
          width: 0;
          height: 2px;
          border-radius: 1px;
          background: #666;
          position: absolute;
          transform: rotate(305deg);
          top: 8.5px;
          left: 5.5px;
          transition: width 50ms ease;
          transform-origin: 0% 0%;
        }

        .custom-checkbox-wrapper label:hover span:before {
          width: 4px;
          transition: width 100ms ease;
        }

        .custom-checkbox-wrapper label:hover span:after {
          width: 7px;
          transition: width 150ms ease 100ms;
        }

        .custom-checkbox-wrapper input[type="checkbox"]:checked + label span {
          background-color: #666;
          transform: scale(1);
        }

        .custom-checkbox-wrapper input[type="checkbox"]:checked + label span:after {
          width: 7px;
          background: #fff;
          transition: width 150ms ease 100ms;
        }

        .custom-checkbox-wrapper input[type="checkbox"]:checked + label span:before {
          width: 4px;
          background: #fff;
          transition: width 150ms ease 100ms;
        }

        .custom-checkbox-wrapper input[type="checkbox"]:checked + label:hover span {
          background-color: #666;
          transform: scale(1);
        }

        .custom-checkbox-wrapper input[type="checkbox"]:checked + label:hover span:after {
          width: 7px;
          background: #fff;
          transition: width 150ms ease 100ms;
        }

        .custom-checkbox-wrapper input[type="checkbox"]:checked + label:hover span:before {
          width: 4px;
          background: #fff;
          transition: width 150ms ease 100ms;
        }
      `}</style>
      <div
        className="leading-[1.4] text-xs"
        style={{ lineHeight: "1.4", margin: 0, padding: 0 }}
        onClick={(e) => {
          // Capture checkbox clicks at the container level
          const target = e.target as HTMLElement

          if (target.tagName === "INPUT" && (target as HTMLInputElement).type === "checkbox") {
            e.preventDefault()
            e.stopPropagation()

            // Find which checkbox was clicked by counting preceding checkboxes
            const allCheckboxes = e.currentTarget.querySelectorAll('input[type="checkbox"]')
            const clickedIndex = Array.from(allCheckboxes).indexOf(target as HTMLInputElement)

            if (clickedIndex >= 0) {
              onCheckboxToggle?.(clickedIndex)
            }
          }

          // Also handle clicks on labels
          if (target.tagName === "LABEL" || target.tagName === "SPAN") {
            const label = target.tagName === "LABEL" ? target : target.closest("label")
            if (label) {
              const checkbox = label.previousElementSibling as HTMLInputElement
              if (checkbox && checkbox.type === "checkbox") {
                e.preventDefault()
                e.stopPropagation()

                const allCheckboxes = e.currentTarget.querySelectorAll('input[type="checkbox"]')
                const clickedIndex = Array.from(allCheckboxes).indexOf(checkbox)

                if (clickedIndex >= 0) {
                  onCheckboxToggle?.(clickedIndex)
                }
              }
            }
          }
        }}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          urlTransform={(url) => url}
          components={{
            // Custom code block rendering
            code({ node, inline, className, children, ...props }: any) {
              const match = /language-(\w+)/.exec(className || "")
              const language = match ? match[1] : "text"

              return !inline && match ? (
                <CodeBlock language={language} fullWidth={codeOnlyFullWidth}>{String(children).replace(/\n$/, "")}</CodeBlock>
              ) : (
                <code className="bg-gray-100 px-1 py-0.5 rounded text-sm" {...props}>
                  {children}
                </code>
              )
            },
            // Custom pre tag rendering
            pre({ children }) {
              // This ensures any pre tags generated by ReactMarkdown get the right styling
              return (
                <pre
                  className={codeOnlyFullWidth ? 'full-width-code full-width-code full-width-code' : ''}
                  style={codeOnlyFullWidth ? {
                    backgroundColor: "rgb(17, 24, 39)",
                    color: "#f3f4f6",
                    fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace",
                    fontSize: "11px",
                    lineHeight: "1.4",
                    padding: "12px",
                    paddingLeft: "0px",
                    marginTop: "0 !important",
                    marginRight: "-8px !important",
                    marginBottom: "15px !important", 
                    marginLeft: "-11px !important",
                    borderRadius: "0 !important",
                    overflowX: "auto",
                    width: "calc(100% + 19px) !important",
                    maxWidth: "calc(100% + 19px) !important",
                    minWidth: "calc(100% + 19px) !important",
                    display: "block !important"
                  } : {
                    backgroundColor: "rgb(17, 24, 39)",
                    color: "#f3f4f6",
                    fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace",
                    fontSize: "11px",
                    lineHeight: "1.4",
                    padding: "12px",
                    paddingLeft: "0px",
                    margin: "0 0 15px 0",
                    borderRadius: "6px",
                    overflowX: "auto"
                  }}
                >
                  {children}
                </pre>
              )
            },
            // Custom heading renderers
            h1: ({ children }) => (
              <h1 className="text-sm font-bold mb-1 text-gray-900 leading-tight" style={{ margin: "0 0 10px 0" }}>
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-xs font-semibold mb-1 text-gray-800 leading-tight" style={{ margin: "0 0 10px 0" }}>
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-xs font-medium mb-1 text-gray-700 leading-tight" style={{ margin: "0 0 10px 0" }}>
                {children}
              </h3>
            ),
            // Custom paragraph renderer
            p: ({ children }) => (
              <p className="mb-1 text-gray-700 leading-tight" style={{ margin: "0 0 10px 0" }}>
                {children}
              </p>
            ),
            // Custom list renderers
            ul: ({ children }) => (
              <ul
                className="mb-1 list-disc"
                style={{ paddingLeft: "15px", listStylePosition: "outside", marginLeft: "0", margin: "0 0 10px 0" }}
              >
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol
                className="mb-1 list-decimal"
                style={{ paddingLeft: "15px", listStylePosition: "outside", marginLeft: "0", margin: "0 0 10px 0" }}
              >
                {children}
              </ol>
            ),
            li: ({ children }) => (
              <li className="text-gray-700 mb-0" style={{ paddingLeft: "2px", lineHeight: "1.4", margin: "0 0 2px 0" }}>
                {children}
              </li>
            ),
            // Custom blockquote renderer
            blockquote: ({ children }) => (
              <blockquote
                className="border-l-4 border-gray-300 pl-2 italic text-gray-600 mb-1 leading-tight"
                style={{ margin: "0 0 10px 0" }}
              >
                {children}
              </blockquote>
            ),
            // Custom link renderer
            a: ({ href, children }) => (
              <a
                href={href}
                className="text-inherit hover:underline break-words"
                target="_blank"
                rel="noopener noreferrer"
                style={{ wordBreak: 'break-all', overflowWrap: 'break-word' }}
              >
                {children}
              </a>
            ),
            // Custom image renderer with local image support
            img: ({ src, alt }) => {
              return <ImageWithExpand src={src || "/placeholder.svg"} alt={alt} onImageClick={onImageClick} />
            },
            // Custom table renderers
            table: ({ children }) => (
              <div className="overflow-x-auto" style={{ margin: "0 0 10px 0" }}>
                <table className="w-full border-collapse border border-gray-300" style={{ tableLayout: 'auto' }}>{children}</table>
              </div>
            ),
            th: ({ children }) => (
              <th className="border border-gray-300 px-2 py-1 bg-gray-100 font-semibold text-left text-xs">
                {children}
              </th>
            ),
            td: ({ children }) => <td className="border border-gray-300 px-2 py-1 text-xs whitespace-normal" style={{ maxWidth: '200px' }}>{children}</td>,
            // Custom details/summary renderers
            details: ({ children, ...props }) => (
              <details className="mb-1" style={{ margin: "0 0 10px 0" }} {...props}>
                {children}
              </details>
            ),
            summary: ({ children, ...props }) => (
              <summary
                className="cursor-pointer text-gray-700 font-medium hover:text-gray-900 mb-1"
                style={{ margin: "0 0 10px 0" }}
                {...props}
              >
                {children}
              </summary>
            ),
            // Custom input renderer with special handling for checkboxes
            input: ({ type, checked, disabled, ...props }) => {
              if (type === "checkbox") {
                // Generate a unique ID for this checkbox
                const checkboxId = `checkbox-${Math.random().toString(36).substr(2, 9)}`

                return (
                  <div className="custom-checkbox-wrapper">
                    <input type="checkbox" id={checkboxId} checked={checked} readOnly {...props} />
                    <label htmlFor={checkboxId}>
                      <span></span>
                    </label>
                  </div>
                )
              }
              return <input type={type} disabled={disabled} {...props} />
            },
          }}
        >
          {processedContent}
        </ReactMarkdown>
      </div>
    </>
  )
}
