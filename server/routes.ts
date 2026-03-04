import type { Express } from "express";
import { createServer, type Server } from "http";
import { createClient } from "@supabase/supabase-js";
import { storage } from "./storage";
import { z } from "zod";
import { insertProjectSchema } from "@shared/schema";

const SUPABASE_URL = 'https://hrzycikekymemyjmeeuv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyenljaWtla3ltZW15am1lZXV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyNDk5MDcsImV4cCI6MjA4NzgyNTkwN30.GJ3xd6iZvxuWhaIzR-mAKU2GvIHyX0kOVW7Xzg7cWF0';
const sitemapSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

  // Sitemap for SEO — lists static pages + all public texture categories
  app.get("/sitemap.xml", async (_req, res) => {
    try {
      const baseUrl = "https://nimzey.com";
      const now = new Date().toISOString().split("T")[0];

      // Fetch public texture counts per category for priority
      const { data: textures } = await sitemapSupabase
        .from("documents")
        .select("id, category, updated_at")
        .eq("is_public", true)
        .order("updated_at", { ascending: false })
        .limit(500);

      const categories = [
        "Experimental", "Grunge", "Organic", "Geometric",
        "Noise", "Abstract", "Minimal", "Cosmic", "Nature",
      ];

      let urls = `
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/textures</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`;

      // Category pages
      for (const cat of categories) {
        urls += `
  <url>
    <loc>${baseUrl}/textures?category=${encodeURIComponent(cat)}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
      }

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

      res.set("Content-Type", "application/xml");
      res.send(xml);
    } catch (error) {
      console.error("Sitemap generation failed:", error);
      res.status(500).send("Sitemap generation failed");
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
