/**
 * @file use-firebase-sync.ts
 * @description Custom hook for managing Firebase sync state and functionality
 */

import { useState, useEffect, useRef, useCallback } from "react"
import { flushSync } from "react-dom"
import { toast } from "sonner"
import { firebaseSync } from "@/lib/firebase-sync"
import { clearImageCache } from "@/lib/image-utils"
import { ensureBoardOrder } from "@/lib/board-utils"
import type { Board } from "@/lib/default-boards-data"

interface SyncModalData {
  cloudBoards: number
  localBoards: number
  onConfirm: (useCloud: boolean) => void
}

export const useFirebaseSync = (
  boards: Board[],
  setBoards: (boards: Board[]) => void,
  currentBoardId: string,
  setCurrentBoardId: (id: string) => void,
  setCurrentBoardTitle: (title: string) => void,
  isLoading: boolean
) => {
  // Firebase sync state
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncUser, setSyncUser] = useState<any>(null)
  const [isEnablingSync, setIsEnablingSync] = useState(false)
  const [syncReady, setSyncReady] = useState(false)
  const [showSyncDataModal, setShowSyncDataModal] = useState(false)
  const [syncModalData, setSyncModalData] = useState<SyncModalData | null>(null)
  
  // Refs for current state access in sync listener (to avoid closure issues)
  const isEnablingSyncRef = useRef(false)
  const syncReadyRef = useRef(false)
  const isFirebaseConnectedRef = useRef(false)
  const syncUserRef = useRef<any>(null)
  const autoSyncPendingRef = useRef(false)
  const isRealTimeSyncUpdateRef = useRef(false)
  const initialSyncCompleteRef = useRef(false)

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
        const currentBoardIdAtTime = currentBoardId
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
  }, [currentBoardId, setBoards, setCurrentBoardId, setCurrentBoardTitle])

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
            const timeoutDuration = initialSyncCompleteRef.current ? 10000 : 3000
            setTimeout(() => {
              if (autoSyncPendingRef.current) {
                console.log('Auto-sync timeout: Force clearing pending flag to prevent permanent blocking')
                autoSyncPendingRef.current = false
              }
            }, timeoutDuration)
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

  const handleSyncDataChoice = useCallback(async (useCloud: boolean, existingBoards: Board[]) => {
    try {
      if (useCloud) {
        // Use cloud data
        console.log('=== LOADING CLOUD DATA ===')
        console.log('User chose cloud data, loading...', existingBoards)
        console.log('Before setBoards - current boards state:', boards.map(b => b.id))
        console.log('Cloud data being set:', existingBoards.map(b => b.id))
        
        // Use Firebase URLs directly (no need to download for web)
        console.log('Using Firebase Storage URLs directly for web display...')
        let boardsWithImages = existingBoards
        
        // Load current board ID before setting state (to avoid race conditions)
        let cloudCurrentBoardId = null
        try {
          cloudCurrentBoardId = await firebaseSync.loadCurrentBoardId()
          console.log('Loaded current board ID from Firebase:', cloudCurrentBoardId)
        } catch (error) {
          console.log('Could not load current board ID from Firebase:', error)
        }
        
        // Determine target board ID
        let targetBoardId = "personal" // Default fallback
        
        if (existingBoards.length > 0) {
          // Use the cloud's current board if it exists in the loaded boards, otherwise use first board
          targetBoardId = cloudCurrentBoardId && existingBoards.find(b => b.id === cloudCurrentBoardId)
            ? cloudCurrentBoardId 
            : existingBoards[0].id
          
          const targetBoard = existingBoards.find(b => b.id === targetBoardId) || existingBoards[0]
          
          console.log(`Setting synchronized state: boards + currentBoardId from ${currentBoardId} to ${targetBoardId}`)
          
          // Use flushSync to ensure all state updates are applied synchronously
          flushSync(() => {
            setBoards(ensureBoardOrder(boardsWithImages))
            setCurrentBoardId(targetBoardId)
            setCurrentBoardTitle(targetBoard.title)
          })
          
          console.log(`Synchronized state update completed: ${targetBoard.id} - ${targetBoard.title}`)
          
          // Save to localStorage
          try {
            const saveData = { 
              boards: boardsWithImages, 
              currentBoardId: targetBoardId 
            }
            localStorage.setItem("kanban-notes", JSON.stringify(saveData))
            console.log('💾 Manual save to localStorage after synchronized state update:', saveData)
          } catch (error) {
            console.warn('Failed to save to localStorage, but sync still works:', error)
          }
        } else {
          // Fallback for empty boards (shouldn't happen)
          flushSync(() => {
            setBoards(ensureBoardOrder(boardsWithImages))
          })
        }
        
        toast.success('Sync enabled! Your cloud data has been loaded.')
        
        // Refresh the page to ensure all cloud data renders correctly
        console.log('Refreshing page to ensure proper cloud data rendering...')
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } else {
        // Use local data - overwrite cloud
        console.log('User chose local data, migrating to cloud...', boards)
        
        console.log('Starting migration process - disabling auto-sync temporarily')
        autoSyncPendingRef.current = true
        
        let migratedBoards = boards
        try {
          migratedBoards = await firebaseSync.migrateLocalBoards(boards)
          console.log('Image migration completed successfully')
        } catch (error) {
          console.warn('Image migration failed, but continuing with basic board sync:', error)
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
      
      // Complete sync setup
      isEnablingSyncRef.current = false
      setIsEnablingSync(false)
      setIsSyncing(false)
      setSyncReady(true)
      syncReadyRef.current = true
      initialSyncCompleteRef.current = true
      console.log('Sync setup complete, real-time sync now enabled')
      
    } catch (error) {
      console.error('Error in handleSyncDataChoice:', error)
      toast.error('Sync setup failed. Please try again.')
      isEnablingSyncRef.current = false
      setIsSyncing(false)
      setIsEnablingSync(false)
    }
  }, [boards, currentBoardId, setBoards, setCurrentBoardId, setCurrentBoardTitle])

  const enableFirebaseSync = useCallback(async () => {
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
      console.log('Current local boards:', boards)
      console.log('========================')
      
      if (existingBoards.length === 0) {
        // No cloud data - migrate local boards to Firebase
        console.log('No cloud data found. Migrating local boards and images...', boards)
        
        console.log('Starting initial migration process - disabling auto-sync temporarily')
        autoSyncPendingRef.current = true
        
        let migratedBoards = boards
        try {
          migratedBoards = await firebaseSync.migrateLocalBoards(boards)
          console.log('Image migration completed successfully')
        } catch (error) {
          console.warn('Image migration failed, but continuing with basic board sync:', error)
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
      
      // Complete sync setup (for when no cloud data exists)
      isEnablingSyncRef.current = false
      setIsEnablingSync(false)
      setIsSyncing(false)
      setSyncReady(true)
      syncReadyRef.current = true
      initialSyncCompleteRef.current = true
      console.log('Sync setup complete, real-time sync now enabled')
      
    } catch (error) {
      console.error('Critical sync setup failed:', error)
      toast.error('Failed to enable sync. Please try again.')
      isEnablingSyncRef.current = false
      setIsSyncing(false)
      setIsEnablingSync(false)
    }
  }, [boards, setBoards, handleSyncDataChoice])

  const disableFirebaseSync = useCallback(async () => {
    try {
      await firebaseSync.signOutUser()
      setSyncReady(false)
      syncReadyRef.current = false
      initialSyncCompleteRef.current = false
      toast.success('Sync disabled. Your boards remain stored locally.')
    } catch (error) {
      console.error('Failed to disable sync:', error)
    }
  }, [])

  return {
    // State
    isFirebaseConnected,
    isSyncing,
    syncUser,
    isEnablingSync,
    syncReady,
    showSyncDataModal,
    syncModalData,
    
    // Actions
    enableFirebaseSync,
    disableFirebaseSync,
    setShowSyncDataModal,
    setSyncModalData,
    
    // Refs (for debugging/advanced usage)
    autoSyncPendingRef,
    isRealTimeSyncUpdateRef
  }
}