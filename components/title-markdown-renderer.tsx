"use client"

interface TitleMarkdownRendererProps {
  content: string
}

export function TitleMarkdownRenderer({ content }: TitleMarkdownRendererProps) {
  // Process markdown for bold and italic text
  const processMarkdown = (text: string) => {
    // Handle bold and italic combined (four asterisks or four underscores)
    let processed = text.replace(/\*\*\*\*(.*?)\*\*\*\*/g, "<strong><em>$1</em></strong>")
    processed = processed.replace(/____(.*?)____/g, "<strong><em>$1</em></strong>")

    // Handle bold text (both ** and __ syntax)
    processed = processed.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    processed = processed.replace(/__(.*?)__/g, "<strong>$1</strong>")

    // Handle italic text (both * and _ syntax)
    processed = processed.replace(/\*(.*?)\*/g, "<em>$1</em>")
    processed = processed.replace(/_(.*?)_/g, "<em>$1</em>")

    return processed
  }

  const htmlContent = processMarkdown(content)

  return <span className="markdown-title" dangerouslySetInnerHTML={{ __html: htmlContent }} />
}
