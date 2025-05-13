import { 
  users, type User, type InsertUser, 
  projects, type Project, type InsertProject,
  filterPresets, type FilterPreset, type InsertFilterPreset
} from "@shared/schema";

// Interface with CRUD methods for all entities
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Project methods
  getProjects(userId?: number): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: InsertProject): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;
  
  // Filter preset methods
  getAllFilterPresets(): Promise<FilterPreset[]>;
  getFilterPreset(id: number): Promise<FilterPreset | undefined>;
  createFilterPreset(preset: InsertFilterPreset): Promise<FilterPreset>;
  updateFilterPreset(id: number, preset: InsertFilterPreset): Promise<FilterPreset | undefined>;
  deleteFilterPreset(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private projects: Map<number, Project>;
  private filterPresets: Map<number, FilterPreset>;
  
  private userIdCounter: number;
  private projectIdCounter: number;
  private presetIdCounter: number;

  constructor() {
    this.users = new Map();
    this.projects = new Map();
    this.filterPresets = new Map();
    
    this.userIdCounter = 1;
    this.projectIdCounter = 1;
    this.presetIdCounter = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Project methods
  async getProjects(userId?: number): Promise<Project[]> {
    const projects = Array.from(this.projects.values());
    if (userId !== undefined) {
      return projects.filter(project => project.userId === userId);
    }
    return projects;
  }
  
  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }
  
  async createProject(project: InsertProject): Promise<Project> {
    const id = this.projectIdCounter++;
    const now = new Date().toISOString();
    const newProject: Project = { 
      ...project, 
      id,
      createdAt: now,
      updatedAt: now
    };
    this.projects.set(id, newProject);
    return newProject;
  }
  
  async updateProject(id: number, project: InsertProject): Promise<Project | undefined> {
    const existingProject = this.projects.get(id);
    if (!existingProject) {
      return undefined;
    }
    
    const updatedProject: Project = {
      ...existingProject,
      ...project,
      id,
      updatedAt: new Date().toISOString()
    };
    
    this.projects.set(id, updatedProject);
    return updatedProject;
  }
  
  async deleteProject(id: number): Promise<boolean> {
    if (!this.projects.has(id)) {
      return false;
    }
    return this.projects.delete(id);
  }
  
  // Filter preset methods
  async getAllFilterPresets(): Promise<FilterPreset[]> {
    return Array.from(this.filterPresets.values());
  }
  
  async getFilterPreset(id: number): Promise<FilterPreset | undefined> {
    return this.filterPresets.get(id);
  }
  
  async createFilterPreset(preset: InsertFilterPreset): Promise<FilterPreset> {
    const id = this.presetIdCounter++;
    const now = new Date();
    const newPreset: FilterPreset = {
      id,
      name: preset.name,
      description: preset.description || null,
      nodes: preset.nodes,
      edges: preset.edges,
      thumbnail: preset.thumbnail || null,
      createdAt: now,
      updatedAt: now
    };
    this.filterPresets.set(id, newPreset);
    return newPreset;
  }
  
  async updateFilterPreset(id: number, preset: InsertFilterPreset): Promise<FilterPreset | undefined> {
    const existingPreset = this.filterPresets.get(id);
    if (!existingPreset) {
      return undefined;
    }
    
    const now = new Date();
    const updatedPreset: FilterPreset = {
      id,
      name: preset.name,
      description: preset.description || null,
      nodes: preset.nodes,
      edges: preset.edges,
      thumbnail: preset.thumbnail || null,
      createdAt: existingPreset.createdAt,
      updatedAt: now
    };
    
    this.filterPresets.set(id, updatedPreset);
    return updatedPreset;
  }
  
  async deleteFilterPreset(id: number): Promise<boolean> {
    if (!this.filterPresets.has(id)) {
      return false;
    }
    return this.filterPresets.delete(id);
  }
}

export const storage = new MemStorage();
