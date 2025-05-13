import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertProjectSchema, insertFilterPresetSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Projects endpoints
  app.get("/api/projects", async (req, res) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const projects = await storage.getProjects(userId);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getProject(id);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const result = insertProjectSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid project data", 
          errors: result.error.format() 
        });
      }
      
      const project = await storage.createProject(result.data);
      res.status(201).json(project);
    } catch (error) {
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.put("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const result = insertProjectSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid project data", 
          errors: result.error.format() 
        });
      }
      
      const project = await storage.updateProject(id, result.data);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteProject(id);
      
      if (!success) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Filter Presets endpoints
  app.get("/api/presets", async (req, res) => {
    try {
      const presets = await storage.getAllFilterPresets();
      res.json(presets);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch filter presets" });
    }
  });

  app.get("/api/presets/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const preset = await storage.getFilterPreset(id);
      
      if (!preset) {
        return res.status(404).json({ message: "Filter preset not found" });
      }
      
      res.json(preset);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch filter preset" });
    }
  });

  app.post("/api/presets", async (req, res) => {
    try {
      const result = insertFilterPresetSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid filter preset data", 
          errors: result.error.format() 
        });
      }
      
      const preset = await storage.createFilterPreset(result.data);
      res.status(201).json(preset);
    } catch (error) {
      res.status(500).json({ message: "Failed to create filter preset" });
    }
  });

  app.put("/api/presets/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const result = insertFilterPresetSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid filter preset data", 
          errors: result.error.format() 
        });
      }
      
      const preset = await storage.updateFilterPreset(id, result.data);
      
      if (!preset) {
        return res.status(404).json({ message: "Filter preset not found" });
      }
      
      res.json(preset);
    } catch (error) {
      res.status(500).json({ message: "Failed to update filter preset" });
    }
  });

  app.delete("/api/presets/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteFilterPreset(id);
      
      if (!success) {
        return res.status(404).json({ message: "Filter preset not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete filter preset" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
