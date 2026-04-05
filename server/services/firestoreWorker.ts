import * as admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

export interface TemplateData {
  template_name: string;
  preview_url: string;
  template_link?: string;
}

interface QueueItem {
  data: TemplateData;
  attempts: number;
}

class FirestoreSyncWorker {
  private queue: QueueItem[] = [];
  private readonly MAX_RETRIES = 5;
  private readonly CONCURRENCY = 3;
  private activeWorkers = 0;
  private readonly DLQ_PATH = path.join('/tmp', 'firestore-failed-syncs.log');
  private initialized = false;

  /**
   * Initialize Firebase Admin SDK lazily.
   * This prevents the app from crashing on startup if env vars are missing,
   * and only throws when a job is actually processed.
   */
  private initFirebase() {
    if (this.initialized) return;
    
    // In production, you would set FIREBASE_SERVICE_ACCOUNT to the stringified JSON of your service account key
    const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    if (!serviceAccountStr) {
      console.warn('[Firestore Worker] FIREBASE_SERVICE_ACCOUNT not set. Worker will fail if queued.');
      return;
    }

    try {
      const serviceAccount = JSON.parse(serviceAccountStr);
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
      }
      this.initialized = true;
    } catch (error) {
      console.error('[Firestore Worker] Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:', error);
    }
  }

  /**
   * Add an item to the background queue.
   * This method is non-blocking and returns immediately, ensuring 
   * the main Supabase upload workflow is never slowed down.
   */
  public enqueue(data: TemplateData) {
    this.queue.push({ data, attempts: 0 });
    // Fire and forget - do not await
    this.processQueue().catch(err => console.error('[Firestore Worker] Queue error:', err));
  }

  private async processQueue() {
    // Prevent exceeding concurrency limit
    if (this.activeWorkers >= this.CONCURRENCY || this.queue.length === 0) {
      return;
    }

    this.initFirebase();
    this.activeWorkers++;
    
    while (this.queue.length > 0) {
      // Dequeue the next item
      const item = this.queue.shift();
      if (!item) continue;

      try {
        await this.syncToFirestore(item.data);
      } catch (error: any) {
        item.attempts++;
        
        if (item.attempts < this.MAX_RETRIES) {
          // Exponential backoff: 2s, 4s, 8s, 16s...
          const backoffMs = Math.pow(2, item.attempts) * 1000;
          console.warn(`[Firestore Worker] Sync failed for "${item.data.template_name}". Retrying in ${backoffMs}ms... (Attempt ${item.attempts}/${this.MAX_RETRIES})`);
          
          // Re-queue after delay without blocking the current worker loop
          setTimeout(() => {
            this.queue.push(item);
            this.processQueue().catch(console.error);
          }, backoffMs);
        } else {
          // Log permanent failure to a safe place (Dead Letter Queue file)
          const errorMsg = error instanceof Error ? error.message : String(error);
          this.logFailedEntry(item.data, errorMsg);
        }
      }
    }

    this.activeWorkers--;
  }

  private async syncToFirestore(data: TemplateData) {
    if (!this.initialized) {
      throw new Error("Firebase Admin not initialized. Check FIREBASE_SERVICE_ACCOUNT env var.");
    }
    
    const collectionName = process.env.FIRESTORE_COLLECTION || 'templates';
    const db = admin.firestore();
    
    // Add document to Firestore. 
    // Firestore stores this as text/metadata only, which is extremely cheap and scalable.
    await db.collection(collectionName).add({
      template_name: data.template_name,
      preview_url: data.preview_url,
      template_link: data.template_link || null,
      created_at: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`[Firestore Worker] Successfully synced metadata for: "${data.template_name}"`);
  }

  private logFailedEntry(data: TemplateData, errorMsg: string) {
    const logEntry = JSON.stringify({
      timestamp: new Date().toISOString(),
      data,
      error: errorMsg
    }) + '\n';

    console.error(`[Firestore Worker] FATAL: Failed to sync "${data.template_name}" after ${this.MAX_RETRIES} attempts. Saved to DLQ.`);
    
    // Append to a local file (Dead Letter Queue) so no data is lost
    fs.appendFile(this.DLQ_PATH, logEntry, (err) => {
      if (err) console.error('[Firestore Worker] Failed to write to DLQ file:', err);
    });
  }
}

// Export a singleton instance
export const firestoreWorker = new FirestoreSyncWorker();
