export interface StoredImage {
  id: string
  filename: string
  blob: Blob
  size: number
  type: string
  uploadedAt: string
}

export class IndexedDBImageService {
  private dbName = 'zeroboard-images'
  private dbVersion = 1
  private storeName = 'images'
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    if (this.db) return

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'))
      }

      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' })
          store.createIndex('uploadedAt', 'uploadedAt', { unique: false })
          store.createIndex('filename', 'filename', { unique: false })
        }
      }
    })
  }

  async storeImage(
    id: string,
    filename: string,
    blob: Blob,
    type: string
  ): Promise<void> {
    await this.init()
    
    if (!this.db) throw new Error('Database not initialized')

    const imageData: StoredImage = {
      id,
      filename,
      blob,
      size: blob.size,
      type,
      uploadedAt: new Date().toISOString()
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.put(imageData)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error('Failed to store image'))
    })
  }

  async getImage(id: string): Promise<StoredImage | null> {
    await this.init()
    
    if (!this.db) throw new Error('Database not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.get(id)

      request.onsuccess = () => {
        resolve(request.result || null)
      }
      request.onerror = () => reject(new Error('Failed to get image'))
    })
  }

  async getAllImages(): Promise<StoredImage[]> {
    await this.init()
    
    if (!this.db) throw new Error('Database not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const index = store.index('uploadedAt')
      const request = index.getAll()

      request.onsuccess = () => {
        const images = request.result.sort((a, b) => 
          new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
        )
        resolve(images)
      }
      request.onerror = () => reject(new Error('Failed to get all images'))
    })
  }

  async deleteImage(id: string): Promise<void> {
    await this.init()
    
    if (!this.db) throw new Error('Database not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error('Failed to delete image'))
    })
  }

  async getImageAsDataURL(id: string): Promise<string | null> {
    const image = await this.getImage(id)
    if (!image) return null

    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error('Failed to convert blob to data URL'))
      reader.readAsDataURL(image.blob)
    })
  }

  async getStorageUsage(): Promise<{ used: number; quota: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate()
      return {
        used: estimate.usage || 0,
        quota: estimate.quota || 0
      }
    }
    return { used: 0, quota: 0 }
  }

}

// Singleton instance
export const imageService = new IndexedDBImageService()