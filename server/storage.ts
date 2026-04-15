import { designAnalyses, type DesignAnalysis, type InsertDesignAnalysis } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  createDesignAnalysis(analysis: InsertDesignAnalysis): Promise<DesignAnalysis>;
  getDesignAnalysis(id: number): Promise<DesignAnalysis | undefined>;
  getUserAnalyses(userId: string): Promise<DesignAnalysis[]>;
}

export class DatabaseStorage implements IStorage {
  async createDesignAnalysis(insertAnalysis: InsertDesignAnalysis): Promise<DesignAnalysis> {
    const [analysis] = await db.insert(designAnalyses).values(insertAnalysis).returning();
    return analysis;
  }

  async getDesignAnalysis(id: number): Promise<DesignAnalysis | undefined> {
    const [analysis] = await db.select().from(designAnalyses).where(eq(designAnalyses.id, id));
    return analysis;
  }

  async getUserAnalyses(userId: string): Promise<DesignAnalysis[]> {
    const analyses = await db
      .select()
      .from(designAnalyses)
      .where(eq(designAnalyses.userId, userId))
      .orderBy(desc(designAnalyses.createdAt))
      .limit(20);
    return analyses;
  }
}

export const storage = new DatabaseStorage();
