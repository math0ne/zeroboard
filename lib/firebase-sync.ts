// Firebase sync service - optional cloud sync
import { 
  doc, 
  collection, 
  onSnapshot, 
  setDoc, 
  getDocs,
  getDoc, 
  serverTimestamp,
  writeBatch,
  Unsubscribe 
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { auth, db, isFirebaseEnabled } from './firebase-config';
import { firebaseImageSync } from './firebase-image-sync';
import type { Board } from '../app/page';

export class FirebaseSync {
  private userId: string | null = null;
  private unsubscribers: Unsubscribe[] = [];
  private onBoardsUpdate?: (boards: Board[]) => void;
  private onAuthUpdate?: (user: User | null) => void;
  private lastSaveTime: number = 0;
  private minSaveInterval: number = 2000; // Minimum 2 seconds between saves

  constructor() {
    if (!isFirebaseEnabled) {
      console.log('Firebase not available - sync disabled');
      return;
    }

    // Listen for auth changes
    onAuthStateChanged(auth, (user) => {
      this.userId = user?.uid || null;
      
      // Update image sync service with user ID
      firebaseImageSync.setUserId(this.userId);
      
      if (this.onAuthUpdate) {
        this.onAuthUpdate(user);
      }
      
      if (user) {
        this.startSync();
      } else {
        this.stopSync();
      }
    });
  }

  // Check if Firebase is available and configured
  isAvailable(): boolean {
    return isFirebaseEnabled && !!auth && !!db;
  }

  // Get current user
  getCurrentUser(): User | null {
    return auth?.currentUser || null;
  }

  // Sign in with Google
  async signInWithGoogle(): Promise<User | null> {
    if (!this.isAvailable()) {
      throw new Error('Firebase not available');
    }

    try {
      const provider = new GoogleAuthProvider();
      
      // Force account selection to ensure user picks the same account
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const result = await signInWithPopup(auth, provider);
      console.log('Google sign-in successful:', {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName
      });
      return result.user;
    } catch (error) {
      console.error('Sign in failed:', error);
      throw error;
    }
  }

  // Sign out
  async signOutUser(): Promise<void> {
    if (!this.isAvailable()) return;
    
    this.stopSync();
    await signOut(auth);
  }

  // Set callback for boards updates
  onBoardsChange(callback: (boards: Board[]) => void) {
    this.onBoardsUpdate = callback;
  }

  // Set callback for auth updates
  onAuthChange(callback: (user: User | null) => void) {
    this.onAuthUpdate = callback;
  }

  // Start syncing boards from Firebase
  private startSync() {
    if (!this.userId || !this.isAvailable()) return;

    const path = `users/${this.userId}/boards`;
    console.log(`Starting real-time sync for path: ${path}`);
    const boardsRef = collection(db, path);
    
    const unsubscribe = onSnapshot(boardsRef, (snapshot) => {
      const boards = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Board[];
      
      // Only call update if we have boards data, or if it's an explicit empty state after sync
      if (this.onBoardsUpdate && boards.length > 0) {
        console.log(`Firebase sync: Received ${boards.length} boards from cloud`);
        this.onBoardsUpdate(boards);
      } else if (boards.length === 0) {
        console.log('Firebase sync: No boards found in cloud (empty collection)');
        // Don't call onBoardsUpdate for empty collections to prevent data loss
      }
    });
    
    this.unsubscribers.push(unsubscribe);
  }

  // Stop syncing
  private stopSync() {
    this.unsubscribers.forEach(unsubscribe => unsubscribe());
    this.unsubscribers = [];
  }

  // Save board to Firebase
  async saveBoard(board: Board): Promise<void> {
    if (!this.userId || !this.isAvailable()) {
      throw new Error('Not authenticated or Firebase not available');
    }

    console.log(`Saving board ${board.id} to Firebase for user ${this.userId}`);
    const boardRef = doc(db, `users/${this.userId}/boards/${board.id}`);
    await setDoc(boardRef, {
      ...board,
      updatedAt: serverTimestamp()
    });
    console.log(`Board ${board.id} saved successfully`);
  }

  // Save multiple boards to Firebase using batched writes (more efficient)
  // Returns true if save actually happened, false if rate limited
  async saveBoards(boards: Board[]): Promise<boolean> {
    if (!this.userId || !this.isAvailable()) {
      throw new Error('Not authenticated or Firebase not available');
    }

    // Rate limiting to prevent write exhaustion
    const now = Date.now();
    const timeSinceLastSave = now - this.lastSaveTime;
    
    if (timeSinceLastSave < this.minSaveInterval) {
      console.log(`Rate limiting: Skipping save (${timeSinceLastSave}ms since last save, minimum ${this.minSaveInterval}ms)`);
      return false; // Return false to indicate save was skipped
    }

    console.log(`Batch saving ${boards.length} boards to Firebase for user ${this.userId}...`);
    console.log(`Firestore path: users/${this.userId}/boards`);
    this.lastSaveTime = now;
    
    try {
      // Use batched writes to reduce the number of writes and improve performance
      const batch = writeBatch(db);
      
      for (const board of boards) {
        const boardRef = doc(db, `users/${this.userId}/boards/${board.id}`);
        batch.set(boardRef, {
          ...board,
          updatedAt: serverTimestamp()
        });
      }
      
      await batch.commit();
      console.log(`Batch save completed for ${boards.length} boards`);
      return true; // Return true to indicate save was successful
    } catch (error) {
      console.error('Batch save failed:', error);
      // Reset the save time so we can try again
      this.lastSaveTime = 0;
      throw error;
    }
  }

  // Save current board ID to Firebase separately (to avoid conflicts between clients)
  async saveCurrentBoardId(currentBoardId: string): Promise<void> {
    if (!this.userId || !this.isAvailable()) {
      throw new Error('Not authenticated or Firebase not available');
    }

    console.log(`Saving current board ID '${currentBoardId}' to Firebase for user ${this.userId}`);
    const settingsRef = doc(db, `users/${this.userId}/settings/currentBoard`);
    await setDoc(settingsRef, {
      currentBoardId,
      updatedAt: serverTimestamp()
    });
    console.log(`Current board ID saved successfully`);
  }

  // Load current board ID from Firebase
  async loadCurrentBoardId(): Promise<string | null> {
    if (!this.userId || !this.isAvailable()) {
      throw new Error('Not authenticated or Firebase not available');
    }

    const settingsRef = doc(db, `users/${this.userId}/settings/currentBoard`);
    const settingsDoc = await getDoc(settingsRef);
    const settingsData = settingsDoc.data();
    
    console.log(`Loaded current board ID from Firebase:`, settingsData?.currentBoardId || 'none');
    return settingsData?.currentBoardId || null;
  }

  // Load boards from Firebase (one-time)
  async loadBoards(): Promise<Board[]> {
    if (!this.userId || !this.isAvailable()) {
      throw new Error('Not authenticated or Firebase not available');
    }

    const path = `users/${this.userId}/boards`;
    console.log(`Loading boards from Firestore path: ${path}`);
    const boardsRef = collection(db, path);
    const snapshot = await getDocs(boardsRef);
    
    const boards = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Board[];
    
    console.log(`Loaded ${boards.length} boards from Firestore:`, boards.map(b => ({ id: b.id, title: b.title })));
    return boards;
  }

  // Migrate local boards to Firebase (including images)
  async migrateLocalBoards(localBoards: Board[]): Promise<Board[]> {
    console.log('Migrating local boards to Firebase...', localBoards.length, 'boards');
    console.log('Board IDs being migrated:', localBoards.map(b => b.id));
    
    // Count total images to migrate
    let totalBase64Images = 0;
    let totalLocalImages = 0;
    localBoards.forEach(board => {
      board.columns.forEach(column => {
        column.cards.forEach(card => {
          const base64Count = (card.content.match(/!\[.*?\]\((data:image\/[^)]+)\)/g) || []).length;
          const localCount = (card.content.match(/!\[.*?\]\((local:[^)]+)\)/g) || []).length;
          totalBase64Images += base64Count;
          totalLocalImages += localCount;
        });
      });
    });
    
    console.log(`Found ${totalBase64Images + totalLocalImages} images to migrate across all boards (${totalBase64Images} base64, ${totalLocalImages} local)`);
    
    // Migrate images for all cards in all boards
    const migratedBoards: Board[] = [];
    
    for (const board of localBoards) {
      console.log(`Migrating images for board: ${board.title}`);
      
      // Migrate images for all cards in all columns
      const migratedColumns = [];
      for (const column of board.columns) {
        const migratedCards = await firebaseImageSync.migrateCardsImages(column.cards);
        migratedColumns.push({
          ...column,
          cards: migratedCards
        });
      }
      
      const migratedBoard = {
        ...board,
        columns: migratedColumns,
        imagesMigrated: true
      };
      
      migratedBoards.push(migratedBoard);
    }
    
    // Save boards with migrated image URLs
    const saveCompleted = await this.saveBoards(migratedBoards);
    
    if (saveCompleted) {
      console.log('Migration complete!');
    } else {
      console.log('Migration completed but save was rate limited - will sync on next change');
    }
    
    return migratedBoards;
  }

  // Download and cache images for boards coming from Firebase
  async downloadBoardsImages(cloudBoards: Board[]): Promise<Board[]> {
    console.log('Downloading images for cloud boards...', cloudBoards.length, 'boards');
    
    const downloadedBoards: Board[] = [];
    
    for (const board of cloudBoards) {
      console.log(`Downloading images for board: ${board.title}`);
      
      // Download images for all cards in all columns
      const downloadedColumns = [];
      for (const column of board.columns) {
        const downloadedCards = await firebaseImageSync.downloadCardsImages(column.cards);
        downloadedColumns.push({
          ...column,
          cards: downloadedCards
        });
      }
      
      const downloadedBoard = {
        ...board,
        columns: downloadedColumns
      };
      
      downloadedBoards.push(downloadedBoard);
    }
    
    console.log('Image download complete!');
    return downloadedBoards;
  }
}

// Export singleton instance
export const firebaseSync = new FirebaseSync();