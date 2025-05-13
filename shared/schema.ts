import { pgTable, text, serial, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema remains the same
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// Project schema for saving filter projects
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  userId: integer("user_id").references(() => users.id),
  nodes: jsonb("nodes").notNull(),
  edges: jsonb("edges").notNull(),
  thumbnail: text("thumbnail"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// Filter presets table for saving reusable filter configurations
export const filterPresets = pgTable("filter_presets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"), // null for no description
  nodes: jsonb("nodes").notNull(), // Store node configurations as JSON
  edges: jsonb("edges").notNull(), // Store edge connections as JSON
  thumbnail: text("thumbnail"), // Optional base64 thumbnail of the result
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Custom nodes table for saving user-created filter nodes
export const customNodes = pgTable("custom_nodes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"), 
  category: text("category").notNull(), // For organizing in the UI
  nodesData: text("nodes_data").notNull(), // Internal node configurations as JSON string
  edgesData: text("edges_data").notNull(), // Internal edge connections as JSON string
  paramsData: text("params_data").notNull(), // Exposed parameters for the custom node as JSON string
  thumbnail: text("thumbnail"), // Preview image
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
});

export const insertFilterPresetSchema = createInsertSchema(filterPresets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCustomNodeSchema = createInsertSchema(customNodes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

export type InsertFilterPreset = z.infer<typeof insertFilterPresetSchema>;
export type FilterPreset = typeof filterPresets.$inferSelect;

export type InsertCustomNode = z.infer<typeof insertCustomNodeSchema>;
export type CustomNode = typeof customNodes.$inferSelect;
