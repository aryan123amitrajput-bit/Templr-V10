import express from 'express';
import multer from 'multer';
import cors from 'cors';
import dotenv from 'dotenv';
import { uploadPreviewImage } from './services/supabaseService';
import { firestoreWorker } from './services/firestoreWorker';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configure Multer for memory storage.
// This allows us to receive the file buffer directly without writing to disk first,
// which is ideal for serverless environments and direct Supabase uploads.
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

/**
 * Main Upload Endpoint for Templr Templates.
 * 
 * 1. Receives 'preview' image file, 'template_name', and 'template_link'
 * 2. Uploads the image to Supabase Storage (Blocking)
 * 3. Enqueues the metadata to Firestore (Non-blocking)
 * 4. Returns success to the user immediately
 */
app.post('/api/templates/upload', upload.single('preview'), async (req, res) => {
  try {
    const { template_name, template_link } = req.body;
    const file = req.file;

    // Validation
    if (!file) {
      return res.status(400).json({ error: 'Preview image is required (field: preview)' });
    }
    if (!template_name) {
      return res.status(400).json({ error: 'Template name is required (field: template_name)' });
    }

    console.log(`[Upload] Processing template: ${template_name}`);

    // 1. Upload to Supabase and get public URL (Blocking, user waits for this)
    // We must wait for this because we need the URL to save to Firestore and return to the user.
    const publicUrl = await uploadPreviewImage(file.buffer, file.originalname, file.mimetype);

    // 2. Queue Firestore metadata sync (Non-blocking, runs in background)
    // This is fire-and-forget. The worker handles retries and errors without slowing down the response.
    firestoreWorker.enqueue({
      template_name,
      preview_url: publicUrl,
      template_link
    });

    // 3. Return success immediately
    return res.status(200).json({
      success: true,
      message: 'Template uploaded successfully',
      data: {
        template_name,
        preview_url: publicUrl,
        template_link: template_link || null
      }
    });

  } catch (error: any) {
    console.error('[Upload Error]', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'Templr Upload Backend' });
});

app.listen(port, () => {
  console.log(`Templr Backend running on port ${port}`);
});
