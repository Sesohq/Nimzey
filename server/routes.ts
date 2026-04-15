import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import sharp from "sharp";
import { storage } from "./storage";
import { analyzeDesignWithReferences } from "./services/openai";
import { fetchReferenceAssets, selectReferencesForAI } from "./services/supabase";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { insertDesignAnalysisSchema } from "@shared/schema";

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication FIRST
  await setupAuth(app);
  registerAuthRoutes(app);

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Get user's past analyses
  app.get("/api/my-analyses", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const analyses = await storage.getUserAnalyses(userId);
      res.json(analyses.map(a => ({
        ...a,
        feedback: JSON.parse(a.feedback)
      })));
    } catch (error) {
      console.error("Error fetching user analyses:", error);
      res.status(500).json({ error: "Failed to fetch analyses" });
    }
  });

  // Upload and analyze design endpoint (now uses reference-based critique as primary flow)
  app.post("/api/analyze-design", upload.single('image'), async (req: MulterRequest, res) => {
    try {
      console.log("Upload request received");
      console.log("Files in request:", req.file ? "File present" : "No file");
      console.log("Content-Type:", req.headers['content-type']);
      
      if (!req.file) {
        console.log("Error: No image file provided");
        return res.status(400).json({ error: "No image file provided" });
      }

      // Get original image metadata
      const metadata = await sharp(req.file.buffer).metadata();
      console.log('Original image metadata:', metadata);
      
      // Process the image and convert to base64 (NO RESIZE - preserve original)
      const processedImage = await sharp(req.file.buffer)
        .jpeg({ quality: 90 })
        .toBuffer();
      
      // Get processed image metadata
      const processedMetadata = await sharp(processedImage).metadata();
      console.log('Processed image metadata:', processedMetadata);

      const base64Image = processedImage.toString('base64');

      // Fetch reference assets from Supabase for comparison
      // Use designPurpose from frontend, fallback to intent for backwards compatibility
      const designPurpose = req.body.designPurpose || req.body.intent || 'poster_print';
      const primaryGoal = req.body.primaryGoal || 'brand_perception';
      console.log(`Fetching references for design purpose: ${designPurpose}, goal: ${primaryGoal}`);
      
      // Fetch up to 20 references to ensure we have enough of all quality levels
      const allReferences = await fetchReferenceAssets(designPurpose, 20);
      
      if (allReferences.length === 0) {
        return res.status(404).json({ 
          error: "No reference assets found. Please add references to the database first." 
        });
      }

      // Select minimum 10 references for proper calibration (strong, mixed, weak)
      const selectedReferences = selectReferencesForAI(allReferences, 10);
      console.log(`Selected ${selectedReferences.length} references for AI analysis`);

      // Analyze the design using reference-based critique (includes annotations + heatmap)
      console.log("Analyzing design with reference-based critique...");
      const feedback = await analyzeDesignWithReferences(base64Image, selectedReferences);

      // Create a temporary URL for the original image
      const originalImageUrl = `data:image/jpeg;base64,${base64Image}`;

      // Get userId if authenticated (optional - allow anonymous uploads)
      const userId = (req as any).user?.claims?.sub || null;

      // Store the analysis result
      const analysis = await storage.createDesignAnalysis({
        userId,
        originalImageUrl,
        revisedImageUrl: '',
        feedback: JSON.stringify(feedback),
      });

      res.json({
        id: analysis.id,
        originalImageUrl,
        feedback,
        referencesUsed: selectedReferences.length,
        createdAt: analysis.createdAt,
      });

    } catch (error) {
      console.error("Error in analyze-design endpoint:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to analyze design" 
      });
    }
  });

  // Get analysis by ID
  app.get("/api/analysis/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const analysis = await storage.getDesignAnalysis(id);

      if (!analysis) {
        return res.status(404).json({ error: "Analysis not found" });
      }

      res.json({
        id: analysis.id,
        originalImageUrl: analysis.originalImageUrl,
        revisedImageUrl: analysis.revisedImageUrl,
        feedback: JSON.parse(analysis.feedback),
        createdAt: analysis.createdAt,
      });
    } catch (error) {
      console.error("Error fetching analysis:", error);
      res.status(500).json({ error: "Failed to fetch analysis" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
