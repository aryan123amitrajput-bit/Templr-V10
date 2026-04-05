
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface TemplateMetadata {
  id: string;
  name: string;
  author: string;
  image_preview: string;
  banner_url: string;
  gallery_images: string[];
  category: string;
  created_at: string;
  tags: string[];
  [key: string]: any;
}

export interface Batch {
  id: string;
  url: string;
  host: string;
  count: number;
}

export interface Registry {
  batches: Batch[];
  last_updated: string;
  total_templates: number;
}

class UnlimitedStorageService {
  private registry: Registry = { batches: [], last_updated: '', total_templates: 0 };
  private BATCH_SIZE_LIMIT = 1000;
  private REGISTRY_PATH = path.join(process.cwd(), 'master_registry.json');
  private BATCHES_DIR = path.join(process.cwd(), 'batches');
  
  // Free Hosts Configuration
  private hosts = [
    { 
      name: 'jsonhosting', 
      url: 'https://jsonhosting.com/api/json',
      apiKey: process.env.JSONHOSTING_API_KEY
    },
    { 
      name: 'plainraw', 
      url: 'https://plainraw.com/api/v1/pastes',
      apiKey: process.env.PLAINRAW_API_KEY
    },
    { 
      name: 'tiinyhost', 
      url: 'https://api.tiiny.host/v1/deploy',
      apiKey: process.env.TIINYHOST_API_KEY
    },
    { 
      name: 'staticsave', 
      url: 'https://staticsave.com/api/v1/save',
      apiKey: process.env.STATICSAVE_API_KEY
    }
  ];

  constructor() {
    if (!fs.existsSync(this.BATCHES_DIR)) {
      fs.mkdirSync(this.BATCHES_DIR, { recursive: true });
    }
    this.loadRegistry();
  }

  private loadRegistry() {
    if (fs.existsSync(this.REGISTRY_PATH)) {
      try {
        this.registry = JSON.parse(fs.readFileSync(this.REGISTRY_PATH, 'utf8'));
      } catch (e) {
        console.error("Failed to load registry, starting fresh:", e);
      }
    }
  }

  private saveRegistry() {
    this.registry.last_updated = new Date().toISOString();
    fs.writeFileSync(this.REGISTRY_PATH, JSON.stringify(this.registry, null, 2));
    // In a real scenario, you'd also backup this registry to a cloud provider
    console.log(`[Registry] Saved. Total templates: ${this.registry.total_templates}`);
  }

  async uploadToImgBB(imageBuffer: Buffer | string): Promise<string> {
    const apiKey = process.env.IMGBB_API_KEY || 'a7324da8420f04b2e6bae6035cf7e25d';
    
    try {
      const formData = new URLSearchParams();
      formData.append('key', apiKey);
      
      if (typeof imageBuffer === 'string' && imageBuffer.startsWith('http')) {
        formData.append('image', imageBuffer);
      } else {
        const base64 = typeof imageBuffer === 'string' ? imageBuffer : imageBuffer.toString('base64');
        formData.append('image', base64);
      }

      const response = await fetch('https://api.imgbb.com/1/upload', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      if (data.success && data.data && data.data.url) {
        return data.data.url;
      } else {
        throw new Error(`ImgBB upload failed: ${JSON.stringify(data)}`);
      }
    } catch (error) {
      console.error('Error uploading to ImgBB:', error);
      throw error;
    }
  }

  /**
   * Uploads a JSON batch to a free host.
   * Rotates between hosts and uses real API calls if keys are provided.
   * Falls back to local storage if API call fails or key is missing.
   */
  private async uploadBatchToFreeHost(batchData: TemplateMetadata[], hostIndex: number): Promise<string> {
    const host = this.hosts[hostIndex % this.hosts.length];
    const batchId = `batch_${host.name}_${Date.now()}`;
    const fileName = `${batchId}.json`;
    const filePath = path.join(this.BATCHES_DIR, fileName);

    // Always save locally as a backup and for local serving
    fs.writeFileSync(filePath, JSON.stringify(batchData, null, 2));

    if (!host.apiKey) {
      console.warn(`[Storage] No API key for ${host.name}, using local serving fallback.`);
      return `/api/batches/${fileName}`;
    }

    try {
      console.log(`[Storage] Attempting real upload to ${host.name}...`);
      
      let response;
      const jsonString = JSON.stringify(batchData);

      switch (host.name) {
        case 'jsonhosting':
          response = await fetch(host.url, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'x-api-key': host.apiKey 
            },
            body: JSON.stringify({ data: batchData })
          });
          if (response.ok) {
            const result = await response.json();
            return result.url; // Assuming JSONHosting returns { url: '...' }
          }
          break;

        case 'plainraw':
          response = await fetch(host.url, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${host.apiKey}`
            },
            body: JSON.stringify({ 
              content: jsonString,
              title: fileName,
              private: false
            })
          });
          if (response.ok) {
            const result = await response.json();
            return result.raw_url || result.url;
          }
          break;

        case 'tiinyhost':
          // Tiiny Host usually expects a file upload
          const formData = new FormData();
          const blob = new Blob([jsonString], { type: 'application/json' });
          formData.append('file', blob, fileName);
          
          response = await fetch(host.url, {
            method: 'POST',
            headers: { 
              'Authorization': `Bearer ${host.apiKey}`
            },
            body: formData
          });
          if (response.ok) {
            const result = await response.json();
            return result.url;
          }
          break;

        case 'staticsave':
          response = await fetch(host.url, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${host.apiKey}`
            },
            body: JSON.stringify({ content: jsonString })
          });
          if (response.ok) {
            const result = await response.json();
            return result.url;
          }
          break;
      }
      
      console.warn(`[Storage] ${host.name} upload failed with status ${response?.status}, falling back to local.`);
    } catch (error) {
      console.error(`[Storage] Error uploading to ${host.name}:`, error);
    }

    // Return local URL as fallback
    return `/api/batches/${fileName}`;
  }

  async addTemplate(template: TemplateMetadata): Promise<void> {
    // 1. Find or create an active batch
    let activeBatch = this.registry.batches.find(b => b.count < this.BATCH_SIZE_LIMIT);
    
    let batchData: TemplateMetadata[] = [];
    if (activeBatch) {
      try {
        // Load from local file if it exists
        const fileName = path.basename(activeBatch.url);
        const filePath = path.join(this.BATCHES_DIR, fileName);
        if (fs.existsSync(filePath)) {
          batchData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
      } catch (e) {
        console.warn(`Failed to read batch file for ${activeBatch.id}, starting new data.`);
      }
    }

    if (!activeBatch) {
      activeBatch = {
        id: `batch_${this.registry.batches.length + 1}`,
        url: '', 
        host: this.hosts[this.registry.batches.length % this.hosts.length].name,
        count: 0
      };
      this.registry.batches.push(activeBatch);
    }

    // 2. Add template to batch
    batchData.push(template);
    activeBatch.count = batchData.length;
    this.registry.total_templates += 1;

    // 3. Save/Upload updated batch
    const hostIndex = this.registry.batches.indexOf(activeBatch);
    activeBatch.url = await this.uploadBatchToFreeHost(batchData, hostIndex);

    // 4. Save registry
    this.saveRegistry();
  }

  async deleteTemplate(templateId: string): Promise<void> {
    for (const batch of this.registry.batches) {
      try {
        const fileName = path.basename(batch.url);
        const filePath = path.join(this.BATCHES_DIR, fileName);
        if (!fs.existsSync(filePath)) continue;

        let batchData: TemplateMetadata[] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const initialCount = batchData.length;
        batchData = batchData.filter(t => t.id !== templateId);

        if (batchData.length < initialCount) {
          batch.count = batchData.length;
          this.registry.total_templates -= (initialCount - batchData.length);
          
          // Update file
          fs.writeFileSync(filePath, JSON.stringify(batchData, null, 2));
          
          this.saveRegistry();
          return;
        }
      } catch (e) {
        console.error(`Error processing batch ${batch.id} for deletion:`, e);
      }
    }
  }

  getBatchData(fileName: string): any {
    const filePath = path.join(this.BATCHES_DIR, fileName);
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    return null;
  }

  getRegistry(): Registry {
    return this.registry;
  }
}

export const unlimitedStorage = new UnlimitedStorageService();
