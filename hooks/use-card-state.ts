/**
 * @file use-card-state.ts
 * @description Unified state management for card properties to eliminate duplication
 */

import { useState, useCallback } from "react"
import type { Card as CardType } from "@/lib/default-boards-data"

/**
 * Card state properties that can be toggled
 */
type ToggleableCardProperty = 'collapsed' | 'plain' | 'lightBackground' | 'titleHidden'

/**
 * Hook for managing card state with unified toggle handlers
 */
export const useCardState = (
  card: CardType,
  onUpdate: (updates: Partial<CardType>) => void
) => {
  // Individual state variables (keeping existing pattern for compatibility)
  const [isCollapsed, setIsCollapsed] = useState(card.collapsed || false)
  const [isPlain, setIsPlain] = useState(card.plain || false)
  const [isLightBackground, setIsLightBackground] = useState(card.lightBackground || false)
  const [isTitleHidden, setIsTitleHidden] = useState(card.titleHidden || false)

  // Unified toggle creator - eliminates duplication
  const createToggler = useCallback(
    (
      property: ToggleableCardProperty,
      currentValue: boolean,
      setter: (value: boolean) => void
    ) => {
      return (e?: React.MouseEvent) => {
        if (e) {
          e.stopPropagation()
        }
        const newValue = !currentValue
        setter(newValue)
        onUpdate({ [property]: newValue })
      }
    },
    [onUpdate]
  )

  // Specific toggle handlers
  const toggleCollapse = createToggler('collapsed', isCollapsed, setIsCollapsed)
  const togglePlain = createToggler('plain', isPlain, setIsPlain)
  const toggleLightBackground = createToggler('lightBackground', isLightBackground, setIsLightBackground)
  const toggleTitleVisibility = createToggler('titleHidden', isTitleHidden, setIsTitleHidden)

  return {
    // State values
    isCollapsed,
    isPlain,
    isLightBackground,
    isTitleHidden,
    // State setters
    setIsCollapsed,
    setIsPlain,
    setIsLightBackground,
    setIsTitleHidden,
    // Toggle handlers
    toggleCollapse,
    togglePlain,
    toggleLightBackground,
    toggleTitleVisibility,
  }
}

/**
 * Unified keyboard event handler creator
 */
export const useKeyboardHandler = (actions: {
  onEnter?: () => void
  onEscape?: () => void
  onCtrlEnter?: () => void
}) => {
  return useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && actions.onEnter) {
        actions.onEnter()
      } else if (e.key === "Escape" && actions.onEscape) {
        actions.onEscape()
      } else if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && actions.onCtrlEnter) {
        actions.onCtrlEnter()
      }
    },
    [actions]
  )
}

/**
 * Card styling utilities to eliminate className duplication
 */
export const useCardStyles = (isPlain: boolean, isLightBackground: boolean) => {
  return {
    cardClasses: isPlain
      ? "pt-2 pl-2 pr-2 pb-2"
      : `${isLightBackground ? "bg-gray-50" : "bg-white"} border border-gray-200 pt-2 pl-2 pr-2 pb-0 shadow-[2px_2px_4px_rgba(0,0,0,0.1)]`,
    
    containerClasses: isPlain
      ? ""
      : `${isLightBackground ? "bg-gray-50" : "bg-white"} border border-gray-200 shadow-[2px_2px_4px_rgba(0,0,0,0.1)]`,
    
    getCardStyle: (shouldAddExtraPadding: boolean) => 
      shouldAddExtraPadding ? { paddingBottom: '6px' } : {}
  }
}