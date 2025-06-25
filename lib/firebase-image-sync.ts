// Firebase image synchronization service
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  listAll 
} from 'firebase/storage';
import { storage, isFirebaseEnabled } from './firebase-config';
import { imageService } from './indexeddb-image-service';
import type { Card } from '../app/page';

export class FirebaseImageSync {
  private userId: string | null = null;

  constructor() {
    if (!isFirebaseEnabled) {
      console.log('Firebase not available - image sync disabled');
    }
  }

  // Set the current user ID
  setUserId(userId: string | null) {
    this.userId = userId;
  }

  // Check if image sync is available
  isAvailable(): boolean {
    return isFirebaseEnabled && !!storage && !!this.userId;
  }

  // Convert base64 data URL to Blob
  private base64ToBlob(base64Data: string): Blob {
    // Handle data URLs (data:image/jpeg;base64,...)
    const [header, data] = base64Data.split(',');
    const mimeType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
    
    try {
      const byteCharacters = atob(data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      return new Blob([byteArray], { type: mimeType });
    } catch (error) {
      console.error('Failed to convert base64 to blob:', error);
      throw new Error('Invalid base64 data');
    }
  }

  // Generate unique image path for Firebase Storage
  private generateImagePath(cardId: string, imageIndex: number): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `users/${this.userId}/images/${cardId}_${imageIndex}_${timestamp}_${random}.jpg`;
  }

  // Upload image to Firebase Storage
  async uploadImage(base64Data: string, cardId: string, imageIndex: number): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error('Image sync not available - user not authenticated or Firebase not configured');
    }

    try {
      console.log(`Uploading image ${imageIndex} for card ${cardId}...`);
      
      // Convert base64 to blob
      const imageBlob = this.base64ToBlob(base64Data);
      
      // Create storage reference
      const imagePath = this.generateImagePath(cardId, imageIndex);
      const imageRef = ref(storage, imagePath);
      
      // Upload the image
      const snapshot = await uploadBytes(imageRef, imageBlob);
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      console.log(`Image uploaded successfully: ${downloadURL}`);
      return downloadURL;
    } catch (error) {
      console.error('Image upload failed:', error);
      throw error;
    }
  }

  // Download image from Firebase Storage and convert to base64
  async downloadImage(downloadURL: string): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error('Image sync not available');
    }

    try {
      console.log(`Downloading image: ${downloadURL}`);
      
      const response = await fetch(downloadURL);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
      }
      
      const imageBlob = await response.blob();
      
      // Convert blob to base64
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            console.log('Image downloaded and converted to base64');
            resolve(reader.result);
          } else {
            reject(new Error('Failed to convert image to base64'));
          }
        };
        reader.onerror = () => reject(new Error('Failed to read image blob'));
        reader.readAsDataURL(imageBlob);
      });
    } catch (error) {
      console.error('Image download failed:', error);
      throw error;
    }
  }

  // Extract image URLs from card content
  private extractImageUrls(content: string): string[] {
    const imageRegex = /!\[.*?\]\((https:\/\/firebasestorage\.googleapis\.com\/[^)]+)\)/g;
    const urls: string[] = [];
    let match;
    
    while ((match = imageRegex.exec(content)) !== null) {
      urls.push(match[1]);
    }
    
    return urls;
  }

  // Extract base64 images from card content
  private extractBase64Images(content: string): string[] {
    const base64Regex = /!\[.*?\]\((data:image\/[^)]+)\)/g;
    const images: string[] = [];
    let match;
    
    while ((match = base64Regex.exec(content)) !== null) {
      images.push(match[1]);
    }
    
    return images;
  }

  // Extract local images from card content
  private extractLocalImages(content: string): string[] {
    const localRegex = /!\[.*?\]\((local:[^)]+)\)/g;
    const images: string[] = [];
    let match;
    
    while ((match = localRegex.exec(content)) !== null) {
      images.push(match[1]);
    }
    
    return images;
  }

  // Check if an image URL is a placeholder that should be skipped
  private isPlaceholderImage(url: string): boolean {
    return url.includes('/placeholder.svg') || 
           url.includes('placeholder.com') ||
           url.includes('via.placeholder.com') ||
           url.startsWith('/placeholder');
  }

  // Migrate a single card's images to Firebase
  async migrateCardImages(card: Card): Promise<Card> {
    if (!this.isAvailable()) {
      return card;
    }

    try {
      const base64Images = this.extractBase64Images(card.content);
      const localImages = this.extractLocalImages(card.content);
      const totalImages = base64Images.length + localImages.length;
      
      if (totalImages === 0) {
        // No images to migrate
        console.log(`No migratable images found in card ${card.id}`);
        return card;
      }

      console.log(`Migrating ${totalImages} images for card ${card.id} (${base64Images.length} base64, ${localImages.length} local)`);
      
      let updatedContent = card.content;
      let imageIndex = 0;
      
      // Upload each base64 image and replace with Firebase URL
      for (const base64Data of base64Images) {
        try {
          // Upload to Firebase Storage
          const firebaseURL = await this.uploadImage(base64Data, card.id, imageIndex);
          
          // Replace base64 with Firebase URL in content
          updatedContent = updatedContent.replace(base64Data, firebaseURL);
          imageIndex++;
        } catch (error) {
          console.error(`Failed to migrate base64 image ${imageIndex} for card ${card.id}:`, error);
          imageIndex++;
          // Continue with other images
        }
      }
      
      // Upload each local image and replace with Firebase URL
      for (const localUrl of localImages) {
        try {
          // Extract image ID from local URL
          const imageId = localUrl.replace('local:', '');
          
          // Get image data from IndexedDB
          const base64Data = await imageService.getImageAsDataURL(imageId);
          
          if (base64Data) {
            // Upload to Firebase Storage
            const firebaseURL = await this.uploadImage(base64Data, card.id, imageIndex);
            
            // Replace local URL with Firebase URL in content
            updatedContent = updatedContent.replace(localUrl, firebaseURL);
            console.log(`Successfully migrated local image ${imageId} to Firebase`);
          } else {
            console.warn(`Local image ${imageId} not found in IndexedDB`);
          }
          
          imageIndex++;
        } catch (error) {
          console.error(`Failed to migrate local image ${imageIndex} for card ${card.id}:`, error);
          imageIndex++;
          // Continue with other images
        }
      }
      
      return {
        ...card,
        content: updatedContent
      };
    } catch (error) {
      console.error(`Failed to migrate images for card ${card.id}:`, error);
      return card;
    }
  }

  // Download and cache Firebase images for a card (convert URLs back to base64 for local storage)
  async downloadCardImages(card: Card): Promise<Card> {
    if (!this.isAvailable()) {
      return card;
    }

    try {
      const firebaseUrls = this.extractImageUrls(card.content);
      
      if (firebaseUrls.length === 0) {
        // No Firebase images to download
        return card;
      }

      console.log(`Downloading ${firebaseUrls.length} images for card ${card.id}`);
      
      let updatedContent = card.content;
      
      // Download each Firebase image and replace with base64
      for (const firebaseURL of firebaseUrls) {
        try {
          // Download from Firebase Storage
          const base64Data = await this.downloadImage(firebaseURL);
          
          // Replace Firebase URL with base64 in content
          updatedContent = updatedContent.replace(firebaseURL, base64Data);
        } catch (error) {
          console.error(`Failed to download image ${firebaseURL} for card ${card.id}:`, error);
          // Continue with other images - they'll remain as URLs
        }
      }
      
      return {
        ...card,
        content: updatedContent
      };
    } catch (error) {
      console.error(`Failed to download images for card ${card.id}:`, error);
      return card;
    }
  }

  // Migrate all images in multiple cards
  async migrateCardsImages(cards: Card[]): Promise<Card[]> {
    if (!this.isAvailable()) {
      return cards;
    }

    console.log(`Starting image migration for ${cards.length} cards...`);
    
    const migratedCards: Card[] = [];
    
    for (const card of cards) {
      const migratedCard = await this.migrateCardImages(card);
      migratedCards.push(migratedCard);
    }
    
    console.log('Image migration completed');
    return migratedCards;
  }

  // Download images for multiple cards
  async downloadCardsImages(cards: Card[]): Promise<Card[]> {
    if (!this.isAvailable()) {
      return cards;
    }

    console.log(`Starting image download for ${cards.length} cards...`);
    
    const downloadedCards: Card[] = [];
    
    for (const card of cards) {
      const downloadedCard = await this.downloadCardImages(card);
      downloadedCards.push(downloadedCard);
    }
    
    console.log('Image download completed');
    return downloadedCards;
  }

  // Clean up unused images for a user (optional maintenance function)
  async cleanupUnusedImages(activeCards: Card[]): Promise<void> {
    if (!this.isAvailable()) {
      return;
    }

    try {
      console.log('Starting image cleanup...');
      
      // Get all image URLs currently in use
      const activeImageUrls = new Set<string>();
      activeCards.forEach(card => {
        const urls = this.extractImageUrls(card.content);
        urls.forEach(url => activeImageUrls.add(url));
      });
      
      // List all images in Firebase Storage
      const userImagesRef = ref(storage, `users/${this.userId}/images/`);
      const imagesList = await listAll(userImagesRef);
      
      // Delete images that are no longer referenced
      for (const imageRef of imagesList.items) {
        const imageUrl = await getDownloadURL(imageRef);
        if (!activeImageUrls.has(imageUrl)) {
          console.log(`Deleting unused image: ${imageUrl}`);
          await deleteObject(imageRef);
        }
      }
      
      console.log('Image cleanup completed');
    } catch (error) {
      console.error('Image cleanup failed:', error);
    }
  }
}

// Export singleton instance
export const firebaseImageSync = new FirebaseImageSync();