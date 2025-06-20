/**
 * @file card-controls.tsx
 * @description Reusable control button system for cards to eliminate duplication
 */

"use client"

import React from "react"
import { ChevronDown, ChevronUp, Hash, Square, X, ImageIcon, Expand, Type } from "lucide-react"
import { Button } from "@/components/ui/button"

/**
 * Configuration for a control button
 */
export interface ControlButtonConfig {
  id: string
  icon: React.ComponentType<{ className?: string }>
  onClick: (e?: React.MouseEvent) => void
  isActive?: boolean
  title: string
  iconSize?: string
  variant?: 'default' | 'delete' | 'dynamic'
  showWhen?: boolean
}

/**
 * Props for the ControlButtons component
 */
interface ControlButtonsProps {
  buttons: ControlButtonConfig[]
  className?: string
  isDeleteConfirming?: boolean
}

/**
 * Get button styling based on variant and state
 */
const getButtonStyles = (
  variant: ControlButtonConfig['variant'],
  isActive?: boolean,
  isDeleteConfirming?: boolean
) => {
  const baseClasses = "h-4 w-4 p-0"
  
  switch (variant) {
    case 'delete':
      return `${baseClasses} ml-1 transition-colors duration-200 ${
        isDeleteConfirming
          ? "text-red-600 hover:text-red-700 hover:bg-red-100 bg-red-50"
          : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
      }`
    
    case 'dynamic':
      return `${baseClasses} ml-1 ${
        isActive 
          ? 'text-gray-800 hover:text-black' 
          : 'text-gray-300 hover:text-gray-500'
      }`
    
    default:
      return `${baseClasses} ml-1 text-gray-600 hover:text-gray-900`
  }
}

/**
 * Reusable control buttons component
 */
export function ControlButtons({ buttons, className, isDeleteConfirming }: ControlButtonsProps) {
  const visibleButtons = buttons.filter(button => button.showWhen !== false)
  
  if (visibleButtons.length === 0) return null

  return (
    <div className={`absolute top-2 right-2 flex z-10 bg-white/95 rounded p-1 ${className || ''}`}>
      {visibleButtons.map((button, index) => {
        const Icon = button.icon
        const isFirstButton = index === 0
        
        return (
          <Button
            key={button.id}
            variant="ghost"
            size="sm"
            onClick={button.onClick}
            className={`${getButtonStyles(
              button.variant, 
              button.isActive, 
              isDeleteConfirming
            )} ${isFirstButton ? '' : 'ml-1'}`}
            title={button.title}
          >
            <Icon className={button.iconSize || "h-2 w-2"} />
          </Button>
        )
      })}
    </div>
  )
}

/**
 * Hook to create standardized button configurations
 */
export const useCardControlButtons = ({
  isPlain,
  isLightBackground,
  isTitleHidden,
  isCollapsed,
  isDeleteConfirming,
  onTogglePlain,
  onToggleLightBackground,
  onToggleTitleVisibility,
  onToggleCollapse,
  onOpenImageUpload,
  onOpenCardModal,
  onDelete,
}: {
  isPlain: boolean
  isLightBackground: boolean
  isTitleHidden: boolean
  isCollapsed: boolean
  isDeleteConfirming: boolean
  onTogglePlain: () => void
  onToggleLightBackground: () => void
  onToggleTitleVisibility: () => void
  onToggleCollapse: () => void
  onOpenImageUpload: () => void
  onOpenCardModal: () => void
  onDelete: () => void
}) => {
  const allButtons: ControlButtonConfig[] = [
    {
      id: 'border',
      icon: Square,
      onClick: onTogglePlain,
      isActive: isPlain,
      title: "Toggle border",
      variant: 'dynamic'
    },
    {
      id: 'highlight',
      icon: Hash,
      onClick: onToggleLightBackground,
      isActive: isLightBackground,
      title: isLightBackground ? "Remove highlight" : "Highlight card",
      variant: 'dynamic',
      iconSize: "h-2.5 w-2.5"
    },
    {
      id: 'title',
      icon: Type,
      onClick: onToggleTitleVisibility,
      isActive: isTitleHidden,
      title: "Toggle title",
      variant: 'dynamic'
    },
    {
      id: 'image',
      icon: ImageIcon,
      onClick: onOpenImageUpload,
      title: "Add image",
      iconSize: "h-1.5 w-1.5"
    },
    {
      id: 'expand',
      icon: Expand,
      onClick: onOpenCardModal,
      title: "Expand card",
      iconSize: "h-1.5 w-1.5"
    },
    {
      id: 'collapse',
      icon: isCollapsed ? ChevronDown : ChevronUp,
      onClick: onToggleCollapse,
      isActive: isCollapsed,
      title: isCollapsed ? "Expand card" : "Collapse card",
      variant: 'dynamic',
      iconSize: "h-2.5 w-2.5"
    },
    {
      id: 'delete',
      icon: X,
      onClick: onDelete,
      title: isDeleteConfirming ? "Click again to delete" : "Delete card",
      variant: 'delete'
    }
  ]

  return {
    all: allButtons,
    imageOnly: allButtons.filter(btn => btn.id === 'delete'),
    collapsedImage: allButtons.filter(btn => ['collapse', 'delete'].includes(btn.id)),
    standard: allButtons
  }
}