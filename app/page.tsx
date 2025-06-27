"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { flushSync } from "react-dom"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { KanbanColumn } from "@/components/kanban-column"
import { BoardTitleBar } from "@/components/board-title-bar"
import { imageService } from "@/lib/indexeddb-image-service"
import { clearImageCache } from "@/lib/image-utils"
import { firebaseSync } from "@/lib/firebase-sync"
import { defaultBoards, type Card, type Column, type Board } from "@/lib/default-boards-data"


// Utility function to ensure boards are sorted by order and have order values
const ensureBoardOrder = (boards: Board[]): Board[] => {
  return boards
    .map((board, index) => ({
      ...board,
      order: board.order !== undefined ? board.order : index
    }))
    .sort((a, b) => a.order - b.order)
}

export default function KanbanBoard() {
  const [isLoading, setIsLoading] = useState(true)
  const [boards, setBoards] = useState<Board[]>([])
  const [currentBoardId, _setCurrentBoardId] = useState("zeroboard-showcase")
  
  // Wrap setCurrentBoardId with debugging
  const setCurrentBoardId = useCallback((newId: string) => {
    console.log(`🔥 setCurrentBoardId called: ${currentBoardId} -> ${newId}`)
    console.trace('Call stack:')
    _setCurrentBoardId(newId)
  }, [currentBoardId])
  const [currentBoardTitle, setCurrentBoardTitle] = useState("**Personal** *Kanban* Notes")
  const [isEditingBoardTitle, setIsEditingBoardTitle] = useState(false)
  const [boardTitleValue, setBoardTitleValue] = useState("")
  const [boardDeleteConfirming, setBoardDeleteConfirming] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isMobile, setIsMobile] = useState(false)

  // Firebase sync state - optional cloud sync
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncUser, setSyncUser] = useState<any>(null)
  const [isEnablingSync, setIsEnablingSync] = useState(false)
  const [syncReady, setSyncReady] = useState(false)
  const [showSyncDataModal, setShowSyncDataModal] = useState(false)
  const [syncModalData, setSyncModalData] = useState<{
    cloudBoards: number
    localBoards: number
    onConfirm: (useCloud: boolean) => void
  } | null>(null)
  const isEnablingSyncRef = useRef(false)
  
  // Refs for current state access in sync listener (to avoid closure issues)
  const syncReadyRef = useRef(false)
  const isFirebaseConnectedRef = useRef(false)
  const syncUserRef = useRef<any>(null)
  const autoSyncPendingRef = useRef(false)
  const isRealTimeSyncUpdateRef = useRef(false) // Track when boards are updated from Firebase real-time sync
  const initialSyncCompleteRef = useRef(false) // Track if initial sync setup is complete

  const currentBoard = (() => {
    const found = boards.find((board) => board.id === currentBoardId)
    const fallback = boards[0] || defaultBoards[0]
    const result = found || fallback
    
    if (!found && boards.length > 0) {
      console.log(`⚠️ Current board '${currentBoardId}' not found in boards:`, boards.map(b => b.id))
      console.log(`Using fallback board: ${result?.id}`)
    }
    
    return result
  })()

  // Load data from localStorage on mount
  useEffect(() => {
    console.log('🚀 localStorage loading useEffect triggered')
    const saved = localStorage.getItem("kanban-notes")
    if (saved) {
      try {
        const data = JSON.parse(saved)
        const loadedBoards = ensureBoardOrder(data.boards || defaultBoards)
        const loadedBoardId = data.currentBoardId || "personal"
        const loadedBoard = loadedBoards.find((board: Board) => board.id === loadedBoardId) || loadedBoards[0]
        
        console.log('📦 Loading from localStorage:', {
          boardCount: loadedBoards.length,
          loadedBoardId,
          currentTitle: loadedBoard.title
        })
        setBoards(loadedBoards)
        setCurrentBoardId(loadedBoardId)
        setCurrentBoardTitle(loadedBoard.title)
      } catch (error) {
        console.log('❌ Failed to load from localStorage, using default boards')
        setBoards(ensureBoardOrder(defaultBoards))
      }
    } else {
      console.log('📭 No localStorage data found, using default boards')
      setBoards(ensureBoardOrder(defaultBoards))
    }
    // Always set loading to false after checking localStorage
    setIsLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Save to localStorage whenever boards or current board change
  useEffect(() => {
    // Only save if we have boards and we're not in loading state AND not enabling sync
    if (!isLoading && !isEnablingSync && !isEnablingSyncRef.current && boards.length > 0) {
      console.log('Auto-saving to localStorage:', {
        boardCount: boards.length, 
        boardIds: boards.map(b => b.id),
        currentBoardId,
        isEnablingSync,
        isEnablingSyncRef: isEnablingSyncRef.current
      })
      localStorage.setItem("kanban-notes", JSON.stringify({ boards, currentBoardId }))
    } else {
      console.log('Skipping localStorage save:', { 
        isLoading, 
        isEnablingSync, 
        isEnablingSyncRef: isEnablingSyncRef.current,
        boardsLength: boards.length 
      })
    }
  }, [boards, currentBoardId, isLoading, isEnablingSync])

  // Auto-sync to Firebase if connected (debounced to prevent overwhelming Firebase)
  useEffect(() => {
    // Skip auto-sync if this boards update is from real-time sync
    if (isRealTimeSyncUpdateRef.current) {
      console.log('Skipping auto-sync: boards updated from real-time sync')
      isRealTimeSyncUpdateRef.current = false // Reset flag
      return
    }
    
    if (isFirebaseConnected && !isLoading && !isEnablingSync && syncReady && boards.length > 0) {
      // Set pending flag to prevent real-time sync conflicts
      autoSyncPendingRef.current = true
      console.log('Auto-sync pending - blocking real-time sync updates')
      
      // Debounce auto-sync to prevent too many writes
      const syncTimeout = setTimeout(async () => {
        console.log('Auto-syncing boards to Firebase...')
        try {
          const syncCompleted = await firebaseSync.saveBoards(boards)
          
          if (syncCompleted) {
            console.log('Auto-sync completed successfully')
            // Clear pending flag only when sync actually happened
            autoSyncPendingRef.current = false
            console.log('Auto-sync pending flag cleared - real-time sync re-enabled')
          } else {
            console.log('Auto-sync was rate limited - keeping pending flag, will retry on next change')
            // Keep pending flag set so sync will be retried on next change
            // But add a safety timeout to prevent permanent blocking
            const timeoutDuration = initialSyncCompleteRef.current ? 10000 : 3000 // Shorter timeout during initial setup
            setTimeout(() => {
              if (autoSyncPendingRef.current) {
                console.log('Auto-sync timeout: Force clearing pending flag to prevent permanent blocking')
                autoSyncPendingRef.current = false
              }
            }, timeoutDuration)
            // autoSyncPendingRef.current stays true for now
          }
        } catch (error) {
          console.error('Auto-sync failed:', error)
          // Clear pending flag even on error to prevent permanent blocking
          autoSyncPendingRef.current = false
          console.log('Auto-sync failed - pending flag cleared to allow retries')
        }
      }, 1000) // Wait 1 second after last change before syncing

      return () => {
        clearTimeout(syncTimeout)
        // Clear pending flag if effect is cleaned up before timeout
        autoSyncPendingRef.current = false
      }
    }
  }, [boards, isFirebaseConnected, isLoading, isEnablingSync, syncReady])

  // Sync currentBoardId to Firebase separately (to avoid conflicts between clients)
  useEffect(() => {
    if (isFirebaseConnected && !isLoading && !isEnablingSync && syncReady) {
      // Debounce currentBoardId sync
      const syncTimeout = setTimeout(() => {
        console.log(`Syncing current board ID '${currentBoardId}' to Firebase...`)
        firebaseSync.saveCurrentBoardId(currentBoardId).catch(error => {
          console.error('Current board ID sync failed:', error)
        })
      }, 500) // Shorter delay for board switching

      return () => clearTimeout(syncTimeout)
    }
  }, [currentBoardId, isFirebaseConnected, isLoading, isEnablingSync, syncReady])

  // Update board title value when current board title changes
  useEffect(() => {
    setBoardTitleValue(currentBoardTitle)
  }, [currentBoardTitle])

  // Update document title when current board title changes
  useEffect(() => {
    // Strip markdown formatting and special characters from title for browser tab
    const stripMarkdown = (text: string) => {
      return text
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold **text**
        .replace(/\*(.*?)\*/g, '$1')     // Remove italic *text*
        .replace(/`(.*?)`/g, '$1')       // Remove inline code `text`
        .replace(/#{1,6}\s?/g, '')       // Remove headers # text
        .replace(/[^\w\s]/g, '')         // Remove all special characters except letters, numbers, and spaces
        .replace(/\s+/g, ' ')            // Replace multiple spaces with single space
        .trim()
    }
    
    const cleanTitle = stripMarkdown(currentBoardTitle)
    document.title = `zeroboard - ${cleanTitle}`
  }, [currentBoardTitle])

  // Firebase sync initialization - optional cloud sync
  useEffect(() => {
    if (!firebaseSync.isAvailable()) {
      console.log('Firebase not available - sync disabled')
      return
    }

    // Set up auth state listener
    firebaseSync.onAuthChange(async (user) => {
      console.log('Firebase auth state changed:', { 
        hasUser: !!user, 
        uid: user?.uid, 
        isEnablingSync: isEnablingSyncRef.current 
      })
      
      // Update both state and refs for sync listener access
      setSyncUser(user)
      syncUserRef.current = user
      
      setIsFirebaseConnected(!!user)
      isFirebaseConnectedRef.current = !!user
      
      setIsSyncing(false)
      
      if (user && !isEnablingSyncRef.current) {
        // User is authenticated - auto-enable sync if they have cloud data
        try {
          console.log('Checking if user has existing cloud data...')
          const existingBoards = await firebaseSync.loadBoards()
          
          if (existingBoards.length > 0) {
            console.log(`Found ${existingBoards.length} existing boards - auto-enabling sync`)
            setSyncReady(true)
            syncReadyRef.current = true
            console.log('Auto-sync enabled for returning user')
          } else {
            console.log('No existing cloud data found - sync remains disabled')
          }
        } catch (error) {
          console.error('Failed to check for existing cloud data:', error)
        }
      } else if (!user && !isEnablingSyncRef.current) {
        // Only reset syncReady when user signs out AND we're not enabling sync
        // This prevents race conditions during the sign-in process
        setSyncReady(false)
        syncReadyRef.current = false
        console.log('User signed out, sync is no longer ready')
      }
    })

    // Set up boards sync listener - only for real-time updates, not initial setup
    firebaseSync.onBoardsChange((syncedBoards) => {
      // Use refs to get current state values (avoid closure issues)
      const currentSyncReady = syncReadyRef.current
      const currentIsEnablingSync = isEnablingSyncRef.current
      const currentIsFirebaseConnected = isFirebaseConnectedRef.current
      const currentSyncUser = syncUserRef.current
      const currentAutoSyncPending = autoSyncPendingRef.current
      
      console.log('Firebase sync listener triggered:', {
        syncedBoardsLength: syncedBoards.length,
        syncReady: currentSyncReady,
        isEnablingSync: currentIsEnablingSync,
        isFirebaseConnected: currentIsFirebaseConnected,
        hasUser: !!currentSyncUser,
        autoSyncPending: currentAutoSyncPending
      })
      
      // Only update from Firebase for real-time sync (after initial setup is complete)
      // Skip if auto-sync is pending to prevent overwriting local changes
      if (currentSyncReady && !currentIsEnablingSync && !currentAutoSyncPending && syncedBoards.length > 0) {
        console.log('Real-time sync: Updating boards from Firebase:', syncedBoards.map(b => b.id))
        
        // Use Firebase URLs directly for web (no CORS issues)
        console.log('Real-time sync: Using Firebase URLs directly for images')
        
        // Set flag to indicate this is a real-time sync update (not user change)
        isRealTimeSyncUpdateRef.current = true
        
        // Update current board if it exists in synced data
        const currentBoardIdAtTime = currentBoardId // Capture current value
        const syncedCurrentBoard = syncedBoards.find(b => b.id === currentBoardIdAtTime)
        
        // Use flushSync to ensure synchronized state updates for real-time sync too
        flushSync(() => {
          setBoards(ensureBoardOrder(syncedBoards))
          
          if (syncedCurrentBoard) {
            setCurrentBoardTitle(syncedCurrentBoard.title)
          } else if (syncedBoards.length > 0) {
            // Current board doesn't exist in sync, switch to first synced board
            console.log('Current board not found in sync, switching to first board')
            setCurrentBoardId(syncedBoards[0].id)
            setCurrentBoardTitle(syncedBoards[0].title)
          }
        })
        
        if (syncedCurrentBoard) {
          console.log('Current board found in sync, keeping it')
        }
      } else {
        const reason = !currentSyncReady ? 'sync not ready' 
                     : currentIsEnablingSync ? 'enabling sync'
                     : currentAutoSyncPending ? 'auto-sync pending' 
                     : 'no data'
        
        console.log('Ignoring Firebase sync update:', {
          reason,
          syncReady: currentSyncReady,
          isEnablingSync: currentIsEnablingSync,
          autoSyncPending: currentAutoSyncPending,
          syncedBoardsLength: syncedBoards.length
        })
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Track currentBoardId changes for debugging
  useEffect(() => {
    console.log(`📍 currentBoardId changed to: ${currentBoardId}`)
    console.trace('currentBoardId change stack trace:')
  }, [currentBoardId])

  // Detect and fix React state vs localStorage mismatches
  useEffect(() => {
    if (!isLoading && !isEnablingSync) {
      const saved = localStorage.getItem("kanban-notes")
      if (saved) {
        try {
          const data = JSON.parse(saved)
          const savedCurrentBoardId = data.currentBoardId
          
          if (savedCurrentBoardId && savedCurrentBoardId !== currentBoardId) {
            console.log(`🔧 MISMATCH DETECTED! React state: ${currentBoardId}, localStorage: ${savedCurrentBoardId}`)
            console.log('🔧 Fixing by reloading from localStorage...')
            
            // Fix the mismatch by updating React state to match localStorage
            setCurrentBoardId(savedCurrentBoardId)
            
            // Also update boards and title if needed
            if (data.boards) {
              const savedBoard = data.boards.find((b: Board) => b.id === savedCurrentBoardId)
              if (savedBoard) {
                setCurrentBoardTitle(savedBoard.title)
              }
            }
          }
        } catch (error) {
          console.log('🔧 Error checking localStorage mismatch:', error)
        }
      }
    }
  }, [currentBoardId, isLoading, isEnablingSync, setCurrentBoardId])

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 459)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])


  const handleBoardTitleSave = () => {
    if (boardTitleValue.trim()) {
      const newTitle = boardTitleValue.trim()
      setBoards(
        boards.map((board) => (board.id === currentBoardId ? { ...board, title: newTitle } : board)),
      )
      setCurrentBoardTitle(newTitle) // Update the dedicated title state
    } else {
      setBoardTitleValue(currentBoardTitle) // Reset if empty
    }
    setIsEditingBoardTitle(false)
  }

  const handleBoardTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleBoardTitleSave()
    } else if (e.key === "Escape") {
      setBoardTitleValue(currentBoardTitle)
      setIsEditingBoardTitle(false)
    }
  }

  const addBoard = () => {
    const timestamp = Date.now()
    const newBoard: Board = {
      id: `board-${timestamp}`,
      title: `New Board ${boards.length + 1}`,
      order: boards.length,
      columns: [
        {
          id: `column-${timestamp}-1`,
          title: "To Do",
          color: "bg-gray-100",
          cards: [],
        },
        {
          id: `column-${timestamp}-2`,
          title: "In Progress",
          color: "bg-gray-100",
          cards: [],
        },
        {
          id: `column-${timestamp}-3`,
          title: "Done",
          color: "bg-gray-100",
          cards: [],
        },
      ],
    }

    setBoards([...boards, newBoard])
    setCurrentBoardId(newBoard.id)
    setCurrentBoardTitle(newBoard.title)
  }

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

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
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

  // Firebase sync functions - optional cloud sync
  const enableFirebaseSync = async () => {
    if (!firebaseSync.isAvailable()) {
      alert('Firebase sync is not configured. Please configure Firebase to enable sync.')
      return
    }

    setIsSyncing(true)
    setIsEnablingSync(true)
    isEnablingSyncRef.current = true

    try {
      // Step 1: Critical - Authentication (must succeed)
      const user = await firebaseSync.signInWithGoogle()
      
      if (!user) {
        throw new Error('Authentication failed - no user returned')
      }

      console.log('=== USER AUTHENTICATION DEBUG ===')
      console.log('Authenticated user:', {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName
      })
      console.log('=====================================')
      
      // Step 2: Critical - Load existing boards (must succeed)
      const existingBoards = await firebaseSync.loadBoards()
      
      console.log('=== SYNC SETUP DEBUG ===')
      console.log('Existing cloud boards:', existingBoards)
      console.log('Existing cloud board details:', existingBoards.map(b => ({ 
        id: b.id, 
        title: b.title, 
        columnsCount: b.columns?.length || 0 
      })))
      console.log('Current local boards:', boards)
      console.log('Current local board details:', boards.map(b => ({ 
        id: b.id, 
        title: b.title, 
        columnsCount: b.columns?.length || 0 
      })))
      console.log('Are local boards default?', boards === defaultBoards || JSON.stringify(boards) === JSON.stringify(defaultBoards))
      console.log('========================')
      
      if (existingBoards.length === 0) {
        // No cloud data - migrate local boards to Firebase
        console.log('No cloud data found. Migrating local boards and images...', boards)
        
        // Step 3: Non-critical - Image migration (can fail gracefully)
        console.log('Starting initial migration process - disabling auto-sync temporarily')
        autoSyncPendingRef.current = true // Disable auto-sync during migration
        
        let migratedBoards = boards
        try {
          migratedBoards = await firebaseSync.migrateLocalBoards(boards)
          console.log('Image migration completed successfully')
        } catch (error) {
          console.warn('Image migration failed, but continuing with basic board sync:', error)
          // Save boards without image migration
          try {
            const saveCompleted = await firebaseSync.saveBoards(boards)
            if (!saveCompleted) {
              console.warn('Basic board sync was rate limited - boards will sync on next change')
            }
          } catch (saveError) {
            console.warn('Failed to save boards during migration fallback:', saveError)
          }
        }
        
        // Update local state with migrated boards
        setBoards(ensureBoardOrder(migratedBoards))
        
        console.log('Migration completed, verifying...')
        // Verify the migration worked
        try {
          const verifyBoards = await firebaseSync.loadBoards()
          console.log('Verification: Found', verifyBoards.length, 'boards in cloud after migration')
        } catch (error) {
          console.warn('Verification failed but migration likely succeeded:', error)
        }
        
        // Clear auto-sync pending flag after initial migration
        console.log('Initial migration complete - re-enabling auto-sync')
        autoSyncPendingRef.current = false
        
        toast.success('Sync enabled! Your local boards have been backed up to the cloud.')
      } else {
        // Cloud data exists - ask user what to do
        console.log('Found existing cloud data:', existingBoards.length, 'boards')
        console.log('Current local data:', boards.length, 'boards')
        
        // Show modal for user choice
        setSyncModalData({
          cloudBoards: existingBoards.length,
          localBoards: boards.length,
          onConfirm: async (useCloud: boolean) => {
            setShowSyncDataModal(false)
            setSyncModalData(null)
            await handleSyncDataChoice(useCloud, existingBoards)
          }
        })
        setShowSyncDataModal(true)
        return // Exit early, let modal handle the choice
      }
      
      // Step 8: Complete sync setup (for when no cloud data exists)
      isEnablingSyncRef.current = false
      setIsEnablingSync(false)
      setIsSyncing(false)
      setSyncReady(true)
      syncReadyRef.current = true
      initialSyncCompleteRef.current = true // Mark initial sync as complete
      console.log('Sync setup complete, real-time sync now enabled')
      
    } catch (error) {
      // Only show popup for critical errors (authentication, loading boards)
      console.error('Critical sync setup failed:', error)
      toast.error('Failed to enable sync. Please try again.')
      isEnablingSyncRef.current = false
      setIsSyncing(false)
      setIsEnablingSync(false)
    }
  }

  const handleSyncDataChoice = async (useCloud: boolean, existingBoards: Board[]) => {
    try {
      if (useCloud) {
        // Use cloud data
        console.log('=== LOADING CLOUD DATA ===')
        console.log('User chose cloud data, loading...', existingBoards)
        console.log('Before setBoards - current boards state:', boards.map(b => b.id))
        console.log('Cloud data being set:', existingBoards.map(b => b.id))
        
        // Step 4: Use Firebase URLs directly (no need to download for web)
        console.log('Using Firebase Storage URLs directly for web display...')
        let boardsWithImages = existingBoards
        
        // Step 5: Load current board ID before setting state (to avoid race conditions)
        let cloudCurrentBoardId = null
        try {
          cloudCurrentBoardId = await firebaseSync.loadCurrentBoardId()
          console.log('Loaded current board ID from Firebase:', cloudCurrentBoardId)
        } catch (error) {
          console.log('Could not load current board ID from Firebase:', error)
        }
        
        // Determine target board ID (declare in broader scope)
        let targetBoardId = "personal" // Default fallback
        
        if (existingBoards.length > 0) {
          // Use the cloud's current board if it exists in the loaded boards, otherwise use first board
          targetBoardId = cloudCurrentBoardId && existingBoards.find(b => b.id === cloudCurrentBoardId)
            ? cloudCurrentBoardId 
            : existingBoards[0].id
          
          const targetBoard = existingBoards.find(b => b.id === targetBoardId) || existingBoards[0]
          
          console.log(`Setting synchronized state: boards + currentBoardId from ${currentBoardId} to ${targetBoardId}`)
          
          // Use flushSync to ensure all state updates are applied synchronously
          // This prevents race conditions where boards update but currentBoardId hasn't been processed yet
          flushSync(() => {
            setBoards(ensureBoardOrder(boardsWithImages))
            _setCurrentBoardId(targetBoardId)
            setCurrentBoardTitle(targetBoard.title)
          })
          
          console.log(`Synchronized state update completed: ${targetBoard.id} - ${targetBoard.title}`)
          
          // Verify the state (should now be consistent)
          console.log('State verification after flushSync:', { 
            currentBoardId: targetBoardId, // Use the target value since state is now flushed
            expectedId: targetBoardId,
            boardsLength: boardsWithImages.length
          })
        } else {
          // Fallback for empty boards (shouldn't happen)
          flushSync(() => {
            setBoards(ensureBoardOrder(boardsWithImages))
          })
        }
        
        // Step 6: Non-critical - Save to localStorage (can fail gracefully)
        // Use the synchronized state values to ensure consistency
        try {
          const saveData = { 
            boards: boardsWithImages, 
            currentBoardId: targetBoardId 
          }
          localStorage.setItem("kanban-notes", JSON.stringify(saveData))
          console.log('💾 Manual save to localStorage after synchronized state update:', saveData)
          
          // Verify what was actually saved
          const verification = localStorage.getItem("kanban-notes")
          console.log('✅ localStorage verification:', JSON.parse(verification || '{}'))
        } catch (error) {
          console.warn('Failed to save to localStorage, but sync still works:', error)
        }
        
        console.log('========================')
        
        toast.success('Sync enabled! Your cloud data has been loaded.')
        
        // Refresh the page to ensure all cloud data renders correctly
        console.log('Refreshing page to ensure proper cloud data rendering...')
        setTimeout(() => {
          window.location.reload()
        }, 1000) // Give the toast time to show before refreshing
      } else {
        // Use local data - overwrite cloud
        console.log('User chose local data, migrating to cloud...', boards)
        
        // Step 7: Non-critical - Image migration (can fail gracefully)
        console.log('Starting migration process - disabling auto-sync temporarily')
        autoSyncPendingRef.current = true // Disable auto-sync during migration
        
        let migratedBoards = boards
        try {
          migratedBoards = await firebaseSync.migrateLocalBoards(boards)
          console.log('Image migration completed successfully')
        } catch (error) {
          console.warn('Image migration failed, but continuing with basic board sync:', error)
          // Save boards without image migration
          try {
            const saveCompleted = await firebaseSync.saveBoards(boards)
            if (!saveCompleted) {
              console.warn('Basic board sync was rate limited - boards will sync on next change')
            }
          } catch (saveError) {
            console.warn('Failed to save boards during migration fallback:', saveError)
          }
        }
        
        // Update local state with migrated boards
        setBoards(ensureBoardOrder(migratedBoards))
        
        // Clear auto-sync pending flag after migration
        console.log('Migration complete - re-enabling auto-sync')
        autoSyncPendingRef.current = false
        
        toast.success('Sync enabled! Your local data has been backed up to the cloud.')
      }
      
      // Step 8: Complete sync setup
      isEnablingSyncRef.current = false
      setIsEnablingSync(false)
      setIsSyncing(false)
      setSyncReady(true)
      syncReadyRef.current = true
      initialSyncCompleteRef.current = true // Mark initial sync as complete
      console.log('Sync setup complete, real-time sync now enabled')
      
    } catch (error) {
      console.error('Error in handleSyncDataChoice:', error)
      toast.error('Sync setup failed. Please try again.')
      isEnablingSyncRef.current = false
      setIsSyncing(false)
      setIsEnablingSync(false)
    }
  }

  const disableFirebaseSync = async () => {
    try {
      await firebaseSync.signOutUser()
      setSyncReady(false)
      syncReadyRef.current = false
      initialSyncCompleteRef.current = false // Reset initial sync flag
      toast.success('Sync disabled. Your boards remain stored locally.')
    } catch (error) {
      console.error('Failed to disable sync:', error)
    }
  }

  const switchBoard = (boardId: string) => {
    const targetBoard = boards.find((board) => board.id === boardId) || boards[0]
    setCurrentBoardId(boardId)
    setCurrentBoardTitle(targetBoard.title)
    setBoardDeleteConfirming(null)
  }

  const handleDeleteBoardClick = (e: React.MouseEvent, boardId: string) => {
    e.stopPropagation() // Prevent switching to the board when clicking delete

    if (boardDeleteConfirming === boardId) {
      // Second click - actually delete the board
      if (boards.length > 1) {
        const newBoards = boards.filter((board) => board.id !== boardId)
        setBoards(newBoards)

        // If we're deleting the current board, switch to another one
        if (boardId === currentBoardId) {
          setCurrentBoardId(newBoards[0].id)
          setCurrentBoardTitle(newBoards[0].title)
        }
      } else {
        // Don't allow deleting the last board
        alert("Cannot delete the last board")
      }
      setBoardDeleteConfirming(null)
    } else {
      // First click - enter confirmation mode
      setBoardDeleteConfirming(boardId)
      // Reset confirmation after 3 seconds if not clicked again
      setTimeout(() => {
        setBoardDeleteConfirming(null)
      }, 3000)
    }
  }

  const handleDragEnd = (result: any) => {
    if (!result.destination) return

    const { source, destination, type } = result

    // Handle column reordering
    if (type === 'COLUMN') {
      const newColumns = Array.from(currentBoard.columns)
      const [reorderedColumn] = newColumns.splice(source.index, 1)
      newColumns.splice(destination.index, 0, reorderedColumn)

      setBoards(boards.map((board) => 
        board.id === currentBoardId ? { ...board, columns: newColumns } : board
      ))
      return
    }

    // Handle card reordering/moving (existing logic)
    if (source.droppableId === destination.droppableId) {
      // Reordering within the same column
      const column = currentBoard.columns.find((col) => col.id === source.droppableId)
      if (!column) return

      const newCards = Array.from(column.cards)
      const [reorderedCard] = newCards.splice(source.index, 1)
      newCards.splice(destination.index, 0, reorderedCard)

      const newColumns = currentBoard.columns.map((col) =>
        col.id === source.droppableId ? { ...col, cards: newCards } : col,
      )

      setBoards(boards.map((board) => (board.id === currentBoardId ? { ...board, columns: newColumns } : board)))
    } else {
      // Moving between columns
      const sourceColumn = currentBoard.columns.find((col) => col.id === source.droppableId)
      const destColumn = currentBoard.columns.find((col) => col.id === destination.droppableId)

      if (!sourceColumn || !destColumn) return

      const sourceCards = Array.from(sourceColumn.cards)
      const destCards = Array.from(destColumn.cards)
      const [movedCard] = sourceCards.splice(source.index, 1)
      destCards.splice(destination.index, 0, movedCard)

      const newColumns = currentBoard.columns.map((col) => {
        if (col.id === source.droppableId) {
          return { ...col, cards: sourceCards }
        }
        if (col.id === destination.droppableId) {
          return { ...col, cards: destCards }
        }
        return col
      })

      setBoards(boards.map((board) => (board.id === currentBoardId ? { ...board, columns: newColumns } : board)))
    }
  }

  const addColumn = () => {
    const newColumn: Column = {
      id: `column-${Date.now()}`,
      title: `Column ${currentBoard.columns.length + 1}`,
      color: "bg-gray-100",
      cards: [],
    }

    const newColumns = [...currentBoard.columns, newColumn]
    setBoards(boards.map((board) => (board.id === currentBoardId ? { ...board, columns: newColumns } : board)))
  }

  const updateColumn = (columnId: string, updates: Partial<Column>) => {
    const newColumns = currentBoard.columns.map((col) => (col.id === columnId ? { ...col, ...updates } : col))
    setBoards(boards.map((board) => (board.id === currentBoardId ? { ...board, columns: newColumns } : board)))
  }

  const deleteColumn = (columnId: string) => {
    const newColumns = currentBoard.columns.filter((col) => col.id !== columnId)
    setBoards(boards.map((board) => (board.id === currentBoardId ? { ...board, columns: newColumns } : board)))
  }

  const addCard = (columnId: string, card: Omit<Card, "id" | "createdAt" | "updatedAt">) => {
    const newCard: Card = {
      ...card,
      id: `card-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const newColumns = currentBoard.columns.map((col) =>
      col.id === columnId ? { ...col, cards: [...col.cards, newCard] } : col,
    )
    setBoards(boards.map((board) => (board.id === currentBoardId ? { ...board, columns: newColumns } : board)))
  }

  const moveCard = (columnId: string, cardId: string, direction: 'up' | 'down') => {
    const newColumns = currentBoard.columns.map((col) => {
      if (col.id === columnId) {
        const cardIndex = col.cards.findIndex((card) => card.id === cardId)
        if (cardIndex === -1) return col
        
        const newCards = [...col.cards]
        
        if (direction === 'up' && cardIndex > 0) {
          // Move card up (swap with previous card)
          [newCards[cardIndex], newCards[cardIndex - 1]] = [newCards[cardIndex - 1], newCards[cardIndex]]
        } else if (direction === 'down' && cardIndex < newCards.length - 1) {
          // Move card down (swap with next card)
          [newCards[cardIndex], newCards[cardIndex + 1]] = [newCards[cardIndex + 1], newCards[cardIndex]]
        }
        
        return { ...col, cards: newCards }
      }
      return col
    })
    
    setBoards(boards.map((board) => (board.id === currentBoardId ? { ...board, columns: newColumns } : board)))
  }

  const moveColumn = (columnId: string, direction: 'up' | 'down') => {
    const columnIndex = currentBoard.columns.findIndex((col) => col.id === columnId)
    if (columnIndex === -1) return
    
    const newColumns = [...currentBoard.columns]
    
    if (direction === 'up' && columnIndex > 0) {
      // Move column up (swap with previous column)
      [newColumns[columnIndex], newColumns[columnIndex - 1]] = [newColumns[columnIndex - 1], newColumns[columnIndex]]
    } else if (direction === 'down' && columnIndex < newColumns.length - 1) {
      // Move column down (swap with next column)
      [newColumns[columnIndex], newColumns[columnIndex + 1]] = [newColumns[columnIndex + 1], newColumns[columnIndex]]
    }
    
    setBoards(boards.map((board) => (board.id === currentBoardId ? { ...board, columns: newColumns } : board)))
  }

  const updateCard = (columnId: string, cardId: string, updates: Partial<Card>) => {
    const newColumns = currentBoard.columns.map((col) =>
      col.id === columnId
        ? {
            ...col,
            cards: col.cards.map((card) =>
              card.id === cardId ? { ...card, ...updates, updatedAt: new Date().toISOString() } : card,
            ),
          }
        : col,
    )
    setBoards(boards.map((board) => (board.id === currentBoardId ? { ...board, columns: newColumns } : board)))
  }

  const deleteCard = (columnId: string, cardId: string) => {
    const newColumns = currentBoard.columns.map((col) =>
      col.id === columnId ? { ...col, cards: col.cards.filter((card) => card.id !== cardId) } : col,
    )
    setBoards(boards.map((board) => (board.id === currentBoardId ? { ...board, columns: newColumns } : board)))
  }


  // Calculate the total width of all columns - recalculated on every render
  const columnsWidth = currentBoard.columns.length * 288 + (currentBoard.columns.length - 1) * 8 // 288px per column (w-72) + 8px gap between columns

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  // Show empty state if no boards available
  if (!boards || boards.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-500">Initializing boards...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white p-4 mobile-container">
      {/* Hidden file input for import */}
      <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportFile} style={{ display: "none" }} />

      <div className="flex justify-center overflow-x-auto mobile-wrapper">
        <div className="inline-block mobile-wrapper">
          {/* Board Title Bar - Width matches columns */}
          <BoardTitleBar
            currentBoardTitle={currentBoardTitle}
            boardTitleValue={boardTitleValue}
            setBoardTitleValue={setBoardTitleValue}
            isEditingBoardTitle={isEditingBoardTitle}
            setIsEditingBoardTitle={setIsEditingBoardTitle}
            onBoardTitleSave={handleBoardTitleSave}
            onBoardTitleKeyDown={handleBoardTitleKeyDown}
            columnsWidth={columnsWidth}
            isMobile={isMobile}
            boards={boards}
            currentBoardId={currentBoardId}
            onAddColumn={addColumn}
            onSwitchBoard={switchBoard}
            onDeleteBoard={handleDeleteBoardClick}
            onAddBoard={addBoard}
            onExportBoards={exportBoards}
            onImportBoards={triggerImport}
            onEnableFirebaseSync={enableFirebaseSync}
            onDisableFirebaseSync={disableFirebaseSync}
            boardDeleteConfirming={boardDeleteConfirming}
            setBoardDeleteConfirming={setBoardDeleteConfirming}
            isFirebaseConnected={isFirebaseConnected}
            isSyncing={isSyncing}
          />

          {isMobile ? (
            // Mobile: No drag and drop - use up/down buttons instead
            <div className="flex gap-2 pb-4 min-w-fit mobile-columns-container">
              {currentBoard.columns.map((column, index) => (
                <div key={column.id} className="flex-shrink-0 w-72 min-w-[18rem] mobile-column">
                  <KanbanColumn
                    column={column}
                    onUpdateColumn={updateColumn}
                    onDeleteColumn={deleteColumn}
                    onAddCard={addCard}
                    onUpdateCard={updateCard}
                    onDeleteCard={deleteCard}
                    onMoveCardUp={(columnId, cardId) => moveCard(columnId, cardId, 'up')}
                    onMoveCardDown={(columnId, cardId) => moveCard(columnId, cardId, 'down')}
                    onMoveColumnUp={index > 0 ? () => moveColumn(column.id, 'up') : undefined}
                    onMoveColumnDown={index < currentBoard.columns.length - 1 ? () => moveColumn(column.id, 'down') : undefined}
                    canMoveUp={index > 0}
                    canMoveDown={index < currentBoard.columns.length - 1}
                    dragHandleProps={null}
                    isMobile={isMobile}
                  />
                </div>
              ))}
            </div>
          ) : (
            // Desktop: Full drag and drop functionality
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="columns" direction="horizontal" type="COLUMN">
                {(provided) => (
                  <div 
                    className="flex gap-2 pb-4 min-w-fit mobile-columns-container"
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    {currentBoard.columns.map((column, index) => (
                      <Draggable key={column.id} draggableId={column.id} index={index}>
                        {(provided, snapshot) => (
                          <div 
                            key={column.id} 
                            className={`flex-shrink-0 w-72 min-w-[18rem] mobile-column ${snapshot.isDragging ? 'opacity-70 rotate-2' : ''}`}
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                          >
                            <KanbanColumn
                              column={column}
                              onUpdateColumn={updateColumn}
                              onDeleteColumn={deleteColumn}
                              onAddCard={addCard}
                              onUpdateCard={updateCard}
                              onDeleteCard={deleteCard}
                              dragHandleProps={provided.dragHandleProps}
                              isMobile={isMobile}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </div>
      </div>

      {/* Sync Data Selection Modal */}
      <Dialog open={showSyncDataModal} onOpenChange={setShowSyncDataModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Cloud Data Found</DialogTitle>
            <DialogDescription>
              We found existing data in the cloud. Choose which data to keep:
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {syncModalData?.cloudBoards || 0}
                </div>
                <div className="text-sm text-gray-600">Cloud Boards</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {syncModalData?.localBoards || 0}
                </div>
                <div className="text-sm text-gray-600">Local Boards</div>
              </div>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => syncModalData?.onConfirm(false)}
            >
              Keep Local Data
              <span className="text-xs text-gray-500 block">(Replace cloud)</span>
            </Button>
            <Button
              onClick={() => syncModalData?.onConfirm(true)}
            >
              Use Cloud Data
              <span className="text-xs text-gray-500 block">(Replace local)</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
