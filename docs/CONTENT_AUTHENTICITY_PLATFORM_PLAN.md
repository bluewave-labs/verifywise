# Content Authenticity Platform - Implementation Plan

## Overview

A new platform section in VerifyWise for AI content watermarking and detection, helping organizations comply with EU AI Act Article 50 transparency requirements.

---

## 1. Product Scope

### Core Features

| Feature | Description | Priority |
|---------|-------------|----------|
| **Watermark Embedding** | Apply invisible watermarks to images/video/audio | P0 |
| **Watermark Detection** | Verify if content contains watermarks | P0 |
| **Model Inventory Integration** | Link watermarked content to AI models | P0 |
| **Evidence Hub Integration** | Store watermark records as compliance evidence | P1 |
| **Batch Processing** | Process multiple files at once | P1 |
| **Audit Trail** | Log all watermarking operations for compliance | P1 |
| **API Access** | REST API for integration into pipelines | P2 |

### Supported Content Types

| Type | Embedding | Detection | Library |
|------|-----------|-----------|---------|
| Images (PNG, JPG, WebP) | Yes | Yes | PixelSeal |
| Video (MP4, WebM) | Yes | Yes | VideoSeal |
| Audio (WAV, MP3) | Yes | Yes | AudioSeal |

---

## 2. Enterprise Integration Points

### Existing Infrastructure (Already Available)

| Component | Status | Location |
|-----------|--------|----------|
| **Redis** | Available | `Servers/database/redis.ts` |
| **BullMQ** | Available | `Servers/jobs/worker.ts` |
| **File Storage** | Available | `Servers/utils/fileUpload.utils.ts` |
| **Multi-tenancy** | Available | Tenant-scoped schemas |
| **Evidence Hub** | Available | `Servers/controllers/evidenceHub.ctrl.ts` |
| **Model Inventory** | Available | Links to `model_id` in files |

### Integration with Model Inventory

When users watermark content, they can **link it to an AI model** from Model Inventory:

```
User generates image with Model X
       |
       v
Watermark embedded with Model X identifier
       |
       v
Watermark record linked to Model X in Model Inventory
       |
       v
Evidence automatically created for compliance
```

**Benefits:**
- Track which AI model generated what content
- Prove provenance for EU AI Act compliance
- Connect watermark detection to model risk assessments

### Integration with Evidence Hub

Watermark operations automatically create evidence records:

```typescript
// When watermark is embedded
await createNewEvidenceQuery({
  evidence_name: `Watermark - ${filename}`,
  evidence_type: "Content Authenticity",
  description: `Invisible watermark embedded for EU AI Act Art. 50 compliance`,
  mapped_model_ids: [model_id],  // Link to AI model
  evidence_files: [watermarked_file_id],
  expiry_date: null,  // Watermarks don't expire
});
```

### Integration with Reporting

Add watermarking stats to existing reports:
- **Models and risks report**: Include watermarked content count per model
- **Compliance tracker report**: Show Article 50 transparency compliance status

### Integration with Automations

Use existing automation system for:
- Auto-watermark content uploaded to specific projects
- Notify when watermark detection finds unmarked AI content
- Scheduled batch watermarking of new files

```typescript
// Trigger: "content_uploaded_to_project"
// Action: "embed_watermark"
await enqueueAutomationAction("embed_watermark", {
  file_id: uploadedFile.id,
  model_id: project.default_model_id,
  tenant: tenantHash,
});
```

---

## 3. Architecture

### System Overview

```
+------------------------------------------------------------------+
|                        VerifyWise Frontend                        |
|                     (React + TypeScript + Vite)                   |
+------------------------------------------------------------------+
                                   |
                                   v
+------------------------------------------------------------------+
|                      VerifyWise Backend (Node.js)                 |
|                                                                   |
|  /api/content-authenticity/embed     POST  - Queue embed job     |
|  /api/content-authenticity/detect    POST  - Queue detect job    |
|  /api/content-authenticity/jobs/:id  GET   - Get job status      |
|  /api/content-authenticity/history   GET   - Get audit history   |
|  /api/content-authenticity/stats     GET   - Get usage stats     |
+------------------------------------------------------------------+
                                   |
                                   v
+------------------------------------------------------------------+
|                   Watermark Service (Python/FastAPI)              |
|                                                                   |
|  - PixelSeal for images                                          |
|  - VideoSeal for video                                           |
|  - AudioSeal for audio                                           |
|  - Job queue (Redis/BullMQ)                                      |
|  - File storage (S3/local)                                       |
+------------------------------------------------------------------+
```

### Processing Flow

```
1. User uploads file via frontend
2. Node.js backend validates & stores file temporarily
3. Backend creates job in queue, returns job ID
4. Python service picks up job from queue
5. Meta Seal processes file (embed or detect)
6. Result stored, job marked complete
7. Frontend polls job status, downloads result
8. Audit log entry created
```

---

## 4. Frontend Implementation

### 3.1 Sidebar Addition

**File**: `Clients/src/presentation/components/Sidebar/index.tsx`

Add 4th section after GOVERNANCE:

```typescript
{
  name: "AUTHENTICITY",
  items: [
    {
      id: "watermark-embed",
      label: "Embed Watermark",
      icon: <Stamp size={16} strokeWidth={1.5} />,
      path: "/content-authenticity/embed",
    },
    {
      id: "watermark-detect",
      label: "Detect Watermark",
      icon: <ScanSearch size={16} strokeWidth={1.5} />,
      path: "/content-authenticity/detect",
    },
    {
      id: "authenticity-history",
      label: "History",
      icon: <History size={16} strokeWidth={1.5} />,
      path: "/content-authenticity/history",
    },
  ],
}
```

### 3.2 New Pages

```
Clients/src/presentation/pages/ContentAuthenticity/
  index.tsx                    # Main layout with tabs
  EmbedWatermark/
    index.tsx                  # Upload & embed UI
    style.ts
  DetectWatermark/
    index.tsx                  # Upload & detect UI
    style.ts
  History/
    index.tsx                  # Audit log table
    style.ts
  components/
    FileUploader.tsx           # Drag-drop file upload
    ProcessingStatus.tsx       # Job progress indicator
    ResultCard.tsx             # Show embed/detect results
    WatermarkSettings.tsx      # Strength, message options
```

### 3.3 Routes

**File**: `Clients/src/application/config/routes.tsx`

```typescript
// Add under Dashboard route
<Route path="/content-authenticity" element={<ContentAuthenticity />}>
  <Route index element={<Navigate to="embed" replace />} />
  <Route path="embed" element={<EmbedWatermark />} />
  <Route path="detect" element={<DetectWatermark />} />
  <Route path="history" element={<AuthenticityHistory />} />
</Route>
```

### 3.4 UI Components

#### Embed Watermark Page

```
+-------------------------------------------------------------+
|  Embed Watermark                                            |
+-------------------------------------------------------------+
|                                                             |
|  +-------------------------------------------------------+  |
|  |                                                       |  |
|  |        Drag & drop files here                         |  |
|  |        or click to browse                             |  |
|  |                                                       |  |
|  |        Supports: PNG, JPG, WebP, MP4, WAV            |  |
|  |                                                       |  |
|  +-------------------------------------------------------+  |
|                                                             |
|  Settings                                                   |
|  +-------------------------------------------------------+  |
|  |  Watermark strength    [====o=====] 0.2               |  |
|  |  Custom message        [________________________]      |  |
|  |  [ ] Also add visible stamp                           |  |
|  +-------------------------------------------------------+  |
|                                                             |
|  Uploaded Files                                             |
|  +-------------------------------------------------------+  |
|  |  image1.png    2.4 MB    [check] Ready                |  |
|  |  video.mp4     45 MB     [check] Ready                |  |
|  +-------------------------------------------------------+  |
|                                                             |
|                              [Embed Watermarks]             |
|                                                             |
+-------------------------------------------------------------+
```

#### Detect Watermark Page

```
+-------------------------------------------------------------+
|  Detect Watermark                                           |
+-------------------------------------------------------------+
|                                                             |
|  +-------------------------------------------------------+  |
|  |        Drag & drop files to check                     |  |
|  +-------------------------------------------------------+  |
|                                                             |
|  Results                                                    |
|  +-------------------------------------------------------+  |
|  |  +------+                                             |  |
|  |  | img  |  suspicious_image.png                       |  |
|  |  +------+  Watermark detected: Yes [check]            |  |
|  |            Confidence: 98.5%                          |  |
|  |            Message: "Generated by Acme AI"            |  |
|  |            Embedded: 2025-01-15 14:30                 |  |
|  +-------------------------------------------------------+  |
|                                                             |
|  +-------------------------------------------------------+  |
|  |  +------+                                             |  |
|  |  | img  |  unknown_photo.jpg                          |  |
|  |  +------+  Watermark detected: No [x]                 |  |
|  |            Confidence: 12.3%                          |  |
|  |            Note: No watermark found                   |  |
|  +-------------------------------------------------------+  |
|                                                             |
+-------------------------------------------------------------+
```

---

## 5. Backend Implementation (Node.js)

### 5.1 Database Schema

**File**: `Servers/database/migrations/XXXXXX-create-watermark-jobs.ts`

Uses existing tenant-scoped schema pattern:

```typescript
// watermark_jobs table (per tenant schema)
{
  id: SERIAL PRIMARY KEY,
  user_id: INTEGER NOT NULL REFERENCES public.users(id),
  type: VARCHAR(20) NOT NULL,  -- 'embed' or 'detect'
  status: VARCHAR(20) DEFAULT 'pending',  -- pending, processing, completed, failed

  // Input file (stored in existing files table)
  input_file_id: INTEGER REFERENCES files(id),
  input_file_name: VARCHAR(255) NOT NULL,
  input_file_type: VARCHAR(50) NOT NULL,  -- 'image', 'video', 'audio'

  // Output file (stored in existing files table)
  output_file_id: INTEGER REFERENCES files(id),

  // Enterprise links
  model_id: INTEGER REFERENCES model_inventory(id),  -- Link to AI model
  project_id: INTEGER REFERENCES projects(id),       -- Link to project
  evidence_id: INTEGER REFERENCES evidence_hub(id),  -- Auto-created evidence

  // Settings and results
  settings: JSONB,  -- { strength: 0.2, message: "...", model_identifier: "..." }
  result: JSONB,    -- { hasWatermark: true, confidence: 0.98, extracted_model: "..." }
  error_message: TEXT,
  processing_time_ms: INTEGER,

  created_at: TIMESTAMP DEFAULT NOW(),
  completed_at: TIMESTAMP,
  is_demo: BOOLEAN DEFAULT FALSE
}
```

### 5.2 Reuse Existing File Storage

Store files using existing `uploadFile` utility:

```typescript
// Use existing file upload pattern from Servers/utils/fileUpload.utils.ts
import { uploadFile } from "../utils/fileUpload.utils";

const savedFile = await uploadFile(
  file,
  req.userId!,
  req.body.project_id || null,
  "Content Authenticity",  // Add new FileSource
  req.tenantId!,
  transaction,
  { model_id: req.body.model_id }
);
```

### 5.3 Add to Existing Worker System

**File**: `Servers/services/watermark/watermarkWorker.ts`

Follow existing pattern from `automationWorker.ts`:

```typescript
import { Worker, Job } from "bullmq";
import { REDIS_URL } from "../../database/redis";
import axios from "axios";

const WATERMARK_SERVICE_URL = process.env.WATERMARK_SERVICE_URL || "http://localhost:8001";

export const createWatermarkWorker = () => {
  const watermarkWorker = new Worker(
    "watermark-jobs",
    async (job: Job) => {
      const { jobId, tenant } = job.data;
      console.log(`Processing watermark job: ${jobId}`);

      // Get job from tenant schema
      const dbJob = await getWatermarkJobQuery(jobId, tenant);
      await updateWatermarkJobStatus(jobId, "processing", tenant);

      try {
        // Get file content
        const file = await getFileById(dbJob.input_file_id, tenant);

        // Call Python watermark service
        const formData = new FormData();
        formData.append("file", new Blob([file.content]), file.filename);
        formData.append("settings", JSON.stringify(dbJob.settings));

        const endpoint = dbJob.type === "embed" ? "/embed" : "/detect";
        const response = await axios.post(
          `${WATERMARK_SERVICE_URL}${endpoint}`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );

        // For embed: save output file
        if (dbJob.type === "embed" && response.data.outputContent) {
          const outputFile = await uploadFile(
            {
              originalname: `watermarked_${file.filename}`,
              buffer: Buffer.from(response.data.outputContent, "base64"),
              mimetype: file.type,
            },
            dbJob.user_id,
            dbJob.project_id,
            "Content Authenticity",
            tenant,
            null,
            { model_id: dbJob.model_id }
          );

          // Auto-create evidence record
          const evidence = await createNewEvidenceQuery({
            evidence_name: `Watermark - ${file.filename}`,
            evidence_type: "Content Authenticity",
            description: `Invisible watermark embedded. Model: ${dbJob.settings.model_identifier || "Unknown"}`,
            mapped_model_ids: dbJob.model_id ? [dbJob.model_id] : [],
            evidence_files: [outputFile.id],
          }, tenant);

          await updateWatermarkJobQuery(jobId, {
            status: "completed",
            output_file_id: outputFile.id,
            evidence_id: evidence.id,
            result: response.data.result,
            processing_time_ms: response.data.processingTime,
            completed_at: new Date(),
          }, tenant);
        } else {
          // For detect: just save result
          await updateWatermarkJobQuery(jobId, {
            status: "completed",
            result: response.data.result,
            processing_time_ms: response.data.processingTime,
            completed_at: new Date(),
          }, tenant);
        }
      } catch (error) {
        await updateWatermarkJobQuery(jobId, {
          status: "failed",
          error_message: error instanceof Error ? error.message : "Unknown error",
          completed_at: new Date(),
        }, tenant);
        throw error;
      }
    },
    { connection: { url: REDIS_URL }, concurrency: 5 }
  );

  watermarkWorker.on("completed", (job) => {
    console.log(`Watermark job ${job.id} completed`);
  });

  watermarkWorker.on("failed", (job, err) => {
    console.error(`Watermark job ${job?.id} failed: ${err.message}`);
  });

  return watermarkWorker;
};
```

### 5.4 Register Worker

**File**: `Servers/jobs/worker.ts` (modify existing)

```typescript
import { createWatermarkWorker } from "../services/watermark/watermarkWorker";

const watermarkWorker = createWatermarkWorker();

// Add to existing workers array
const workers: Worker[] = [notificationWorker, automationWorker, watermarkWorker];
```

### 5.5 Producer

**File**: `Servers/services/watermark/watermarkProducer.ts`

```typescript
import { Queue } from "bullmq";
import { REDIS_URL } from "../../database/redis";

export const watermarkQueue = new Queue("watermark-jobs", {
  connection: { url: REDIS_URL }
});

export async function enqueueWatermarkJob(
  type: "embed" | "detect",
  jobId: number,
  tenant: string
) {
  return watermarkQueue.add(type, { jobId, tenant });
}
```

### 5.6 API Routes

**File**: `Servers/routes/contentAuthenticity.route.ts`

```typescript
import express from "express";
import authenticateJWT from "../middleware/auth.middleware";
import multer from "multer";
import {
  createEmbedJob,
  createDetectJob,
  getJobStatus,
  getJobHistory,
  downloadResult,
  getStats
} from "../controllers/contentAuthenticity.ctrl";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/embed", authenticateJWT, upload.array("files", 10), createEmbedJob);
router.post("/detect", authenticateJWT, upload.array("files", 10), createDetectJob);
router.get("/jobs/:id", authenticateJWT, getJobStatus);
router.get("/jobs/:id/download", authenticateJWT, downloadResult);
router.get("/history", authenticateJWT, getJobHistory);
router.get("/stats", authenticateJWT, getStats);

export default router;
```

### 5.7 Mount Route

**File**: `Servers/index.ts` (modify existing)

```typescript
import contentAuthenticityRoutes from "./routes/contentAuthenticity.route";

app.use("/api/content-authenticity", contentAuthenticityRoutes);
```

---

## 6. Watermark Service (Python/FastAPI)

### 5.1 Project Structure

```
WatermarkService/
  requirements.txt
  Dockerfile
  app/
    __init__.py
    main.py              # FastAPI app
    config.py            # Settings
    services/
      __init__.py
      image_watermark.py   # PixelSeal wrapper
      video_watermark.py   # VideoSeal wrapper
      audio_watermark.py   # AudioSeal wrapper
    models/
      schemas.py           # Pydantic models
    utils/
      file_utils.py        # File handling
      model_loader.py      # Lazy model loading
  tests/
```

### 5.2 Requirements

**File**: `WatermarkService/requirements.txt`

```
fastapi==0.109.0
uvicorn==0.27.0
python-multipart==0.0.6
torch==2.4.0
torchvision==0.19.0
torchaudio==2.4.0
pillow==10.2.0
numpy==1.26.3
videoseal @ git+https://github.com/facebookresearch/videoseal.git
audioseal @ git+https://github.com/facebookresearch/audioseal.git
```

### 5.3 Main Application

**File**: `WatermarkService/app/main.py`

```python
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
import tempfile
import time
import os
import json

from app.services.image_watermark import ImageWatermarker
from app.services.video_watermark import VideoWatermarker
from app.services.audio_watermark import AudioWatermarker

app = FastAPI(title="VerifyWise Watermark Service")

# Lazy-loaded models
image_watermarker = None
video_watermarker = None
audio_watermarker = None

def get_image_watermarker():
    global image_watermarker
    if image_watermarker is None:
        image_watermarker = ImageWatermarker()
    return image_watermarker

def get_video_watermarker():
    global video_watermarker
    if video_watermarker is None:
        video_watermarker = VideoWatermarker()
    return video_watermarker

def get_audio_watermarker():
    global audio_watermarker
    if audio_watermarker is None:
        audio_watermarker = AudioWatermarker()
    return audio_watermarker


@app.post("/embed")
async def embed_watermark(
    file: UploadFile = File(...),
    settings: str = Form("{}")
):
    start_time = time.time()
    settings_dict = json.loads(settings)

    # Determine file type
    content_type = file.content_type

    # Save uploaded file
    suffix = get_suffix(content_type)
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        content = await file.read()
        tmp.write(content)
        input_path = tmp.name

    try:
        if content_type.startswith("image/"):
            watermarker = get_image_watermarker()
            output_path = watermarker.embed(input_path, settings_dict)
        elif content_type.startswith("video/"):
            watermarker = get_video_watermarker()
            output_path = watermarker.embed(input_path, settings_dict)
        elif content_type.startswith("audio/"):
            watermarker = get_audio_watermarker()
            output_path = watermarker.embed(input_path, settings_dict)
        else:
            raise HTTPException(400, f"Unsupported file type: {content_type}")

        processing_time = int((time.time() - start_time) * 1000)

        return {
            "success": True,
            "outputPath": output_path,
            "processingTime": processing_time,
            "result": {"embedded": True}
        }
    finally:
        os.unlink(input_path)


@app.post("/detect")
async def detect_watermark(
    file: UploadFile = File(...)
):
    start_time = time.time()
    content_type = file.content_type

    suffix = get_suffix(content_type)
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        content = await file.read()
        tmp.write(content)
        input_path = tmp.name

    try:
        if content_type.startswith("image/"):
            watermarker = get_image_watermarker()
            result = watermarker.detect(input_path)
        elif content_type.startswith("video/"):
            watermarker = get_video_watermarker()
            result = watermarker.detect(input_path)
        elif content_type.startswith("audio/"):
            watermarker = get_audio_watermarker()
            result = watermarker.detect(input_path)
        else:
            raise HTTPException(400, f"Unsupported file type: {content_type}")

        processing_time = int((time.time() - start_time) * 1000)

        return {
            "success": True,
            "processingTime": processing_time,
            "result": result
        }
    finally:
        os.unlink(input_path)


@app.get("/download/{file_id}")
async def download_file(file_id: str):
    file_path = f"/tmp/watermarked/{file_id}"
    if not os.path.exists(file_path):
        raise HTTPException(404, "File not found")
    return FileResponse(file_path)


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


def get_suffix(content_type: str) -> str:
    mapping = {
        "image/png": ".png",
        "image/jpeg": ".jpg",
        "image/webp": ".webp",
        "video/mp4": ".mp4",
        "video/webm": ".webm",
        "audio/wav": ".wav",
        "audio/mpeg": ".mp3",
    }
    return mapping.get(content_type, "")
```

### 5.4 Image Watermarker

**File**: `WatermarkService/app/services/image_watermark.py`

```python
import videoseal
import torch
import torchvision.transforms as T
from PIL import Image
import tempfile
import os

class ImageWatermarker:
    def __init__(self):
        self.model = videoseal.load("pixelseal")

    def embed(self, input_path: str, settings: dict) -> str:
        # Load image
        img = Image.open(input_path).convert("RGB")
        img_tensor = T.ToTensor()(img).unsqueeze(0)

        # Apply watermark strength if specified
        if "strength" in settings:
            self.model.blender.scaling_w = settings["strength"]

        # Embed watermark
        with torch.no_grad():
            outputs = self.model.embed(img_tensor)

        # Save watermarked image
        watermarked = T.ToPILImage()(outputs["imgs_w"][0])

        output_path = tempfile.mktemp(suffix=".png", dir="/tmp/watermarked")
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        watermarked.save(output_path, "PNG")

        return output_path

    def detect(self, input_path: str) -> dict:
        # Load image
        img = Image.open(input_path).convert("RGB")
        img_tensor = T.ToTensor()(img).unsqueeze(0)

        # Detect watermark
        with torch.no_grad():
            detected = self.model.detect(img_tensor)

        confidence = detected["preds"][0, 0].item()
        has_watermark = confidence > 0.5

        # Extract message if present
        message_bits = (detected["preds"][0, 1:] > 0).float()

        return {
            "hasWatermark": has_watermark,
            "confidence": round(confidence, 4),
            "messageBits": message_bits.tolist() if has_watermark else None
        }
```

### 5.5 Audio Watermarker

**File**: `WatermarkService/app/services/audio_watermark.py`

```python
from audioseal import AudioSeal
import torch
import torchaudio
import tempfile
import os

class AudioWatermarker:
    def __init__(self):
        self.generator = AudioSeal.load_generator("audioseal_wm_16bits")
        self.detector = AudioSeal.load_detector("audioseal_detector_16bits")

    def embed(self, input_path: str, settings: dict) -> str:
        # Load audio
        wav, sample_rate = torchaudio.load(input_path)

        # Resample to 16kHz if needed
        if sample_rate != 16000:
            resampler = torchaudio.transforms.Resample(sample_rate, 16000)
            wav = resampler(wav)
            sample_rate = 16000

        # Add batch dimension
        wav = wav.unsqueeze(0)

        # Generate watermark
        with torch.no_grad():
            watermark = self.generator.get_watermark(wav)
            watermarked = wav + watermark

        # Save
        output_path = tempfile.mktemp(suffix=".wav", dir="/tmp/watermarked")
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        torchaudio.save(output_path, watermarked.squeeze(0), sample_rate)

        return output_path

    def detect(self, input_path: str) -> dict:
        wav, sample_rate = torchaudio.load(input_path)

        if sample_rate != 16000:
            resampler = torchaudio.transforms.Resample(sample_rate, 16000)
            wav = resampler(wav)

        wav = wav.unsqueeze(0)

        with torch.no_grad():
            result, message = self.detector.detect_watermark(wav)

        confidence = result.mean().item()

        return {
            "hasWatermark": confidence > 0.5,
            "confidence": round(confidence, 4),
            "message": message.tolist() if message is not None else None
        }
```

---

## 7. Deployment

### 6.1 Docker Compose

**File**: `docker-compose.watermark.yml`

```yaml
version: "3.8"

services:
  watermark-service:
    build:
      context: ./WatermarkService
      dockerfile: Dockerfile
    ports:
      - "8001:8001"
    volumes:
      - watermark-temp:/tmp/watermarked
    environment:
      - CUDA_VISIBLE_DEVICES=0  # Remove for CPU-only
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

volumes:
  watermark-temp:
  redis-data:
```

### 6.2 Dockerfile

**File**: `WatermarkService/Dockerfile`

```dockerfile
FROM python:3.10-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsndfile1 \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY app/ ./app/

# Create temp directory
RUN mkdir -p /tmp/watermarked

EXPOSE 8001

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
```

---

## 8. Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Set up WatermarkService Python project structure
- [ ] Implement image watermark embed/detect with PixelSeal
- [ ] Create FastAPI endpoints (/embed, /detect, /health)
- [ ] Add database migration for watermark_jobs table (tenant-scoped)
- [ ] Add "Content Authenticity" to FileSource enum
- [ ] Create Node.js routes and controller
- [ ] Add watermarkWorker to existing worker system
- [ ] Add watermarkProducer using existing Redis/BullMQ

### Phase 2: Frontend (Week 2-3)
- [ ] Add AUTHENTICITY section to sidebar
- [ ] Create EmbedWatermark page with file uploader
- [ ] Create DetectWatermark page with results display
- [ ] Add Model Inventory dropdown for linking to AI models
- [ ] Implement job polling and status display
- [ ] Add History page with audit table

### Phase 3: Enterprise Integration (Week 3-4)
- [ ] Auto-create Evidence Hub records on embed
- [ ] Link watermark jobs to Model Inventory
- [ ] Add watermark stats to Model detail page
- [ ] Add Content Authenticity section to Compliance reports
- [ ] Integrate with existing automation triggers

### Phase 4: Additional Media (Week 4-5)
- [ ] Add video watermarking (VideoSeal)
- [ ] Add audio watermarking (AudioSeal)
- [ ] Update UI to show media-specific previews
- [ ] Handle large file streaming

### Phase 5: Polish & Deploy (Week 5-6)
- [ ] Add rate limiting per tenant
- [ ] Create API documentation
- [ ] Add Swagger/OpenAPI spec
- [ ] Deploy Python service
- [ ] Write user documentation

---

## 9. API Reference

### Embed Watermark

```
POST /api/content-authenticity/embed
Content-Type: multipart/form-data

files: File[] (required)
settings: JSON string (optional)
  - strength: number (0.1-0.5, default 0.2)
  - message: string (custom message to embed)
  - addVisibleStamp: boolean (default false)

Response:
{
  "jobs": ["uuid-1", "uuid-2", ...]
}
```

### Detect Watermark

```
POST /api/content-authenticity/detect
Content-Type: multipart/form-data

files: File[] (required)

Response:
{
  "jobs": ["uuid-1", "uuid-2", ...]
}
```

### Get Job Status

```
GET /api/content-authenticity/jobs/:id

Response:
{
  "id": "uuid",
  "status": "completed",
  "type": "detect",
  "fileName": "image.png",
  "result": {
    "hasWatermark": true,
    "confidence": 0.9845,
    "message": null
  },
  "createdAt": "2025-02-02T10:30:00Z",
  "completedAt": "2025-02-02T10:30:03Z"
}
```

### Download Result

```
GET /api/content-authenticity/jobs/:id/download

Response: Binary file
```

### Get History

```
GET /api/content-authenticity/history?page=1&limit=20

Response:
{
  "jobs": [...],
  "total": 150,
  "page": 1,
  "totalPages": 8
}
```

---

## 10. Security Considerations

1. **File Validation**: Strictly validate file types, reject executables
2. **File Size Limits**: Max 100MB for images, 500MB for video, 50MB for audio
3. **Tenant Isolation**: Jobs are scoped to tenant_id
4. **Temp File Cleanup**: Auto-delete processed files after 24 hours
5. **Rate Limiting**: 100 requests/hour per user
6. **Authentication**: All endpoints require valid JWT

---

## 11. Cost Estimate

### Reusing Existing Infrastructure

| Component | Status | Additional Cost |
|-----------|--------|-----------------|
| Redis | Already deployed | $0 |
| BullMQ | Already configured | $0 |
| File storage (PostgreSQL) | Already available | $0 |
| Node.js backend | Already running | $0 |

### New Infrastructure Required

| Component | Monthly Cost |
|-----------|--------------|
| Python service (same server) | $0 (CPU-only) |
| Python service (separate VPS) | $20-40 |
| **Total additional** | **$0-40/month** |

### Optional: GPU for Faster Processing

For high-volume enterprise usage:

| GPU Option | Cost | Use Case |
|------------|------|----------|
| On-demand (RunPod/Lambda) | $0.20-0.50/hour | Occasional batch jobs |
| Dedicated GPU VPS | $100-200/month | High volume (1000+ files/day) |

### Processing Time Estimates (CPU)

| Media Type | Embed Time | Detect Time |
|------------|------------|-------------|
| Image (1080p) | 2-5 seconds | 1-2 seconds |
| Video (30s, 720p) | 30-60 seconds | 15-30 seconds |
| Audio (1 min) | 3-5 seconds | 2-3 seconds |

For most enterprise use cases, CPU processing is sufficient.

---

## 12. Success Metrics

- Processing time: < 5 seconds for images, < 30 seconds for short videos
- Detection accuracy: > 95% for watermarked content
- Uptime: 99.9%
- User adoption: Track unique users and jobs created
