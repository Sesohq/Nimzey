# Database Structure and Storage

## Overview

FilterKit uses a PostgreSQL database to store user data, projects, filter presets, and custom nodes. This document describes the current database structure and future plans for data storage.

## Current Schema

The database schema is defined in `shared/schema.ts` using Drizzle ORM. The schema consists of the following tables:

### Users

Stores user account information:

```typescript
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  email: text('email'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});
```

### Projects

Stores user projects, which consist of saved filter graphs:

```typescript
export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  userId: integer('user_id').references(() => users.id).notNull(),
  nodeData: jsonb('node_data').notNull(), // Stores the complete node graph
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});
```

### Filter Presets

Stores reusable filter configurations:

```typescript
export const filterPresets = pgTable('filter_presets', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category').notNull(),
  userId: integer('user_id').references(() => users.id),
  isPublic: boolean('is_public').default(false).notNull(),
  nodeData: jsonb('node_data').notNull(), // Stores the filter configuration
  thumbnail: text('thumbnail'), // Base64 encoded thumbnail
  createdAt: timestamp('created_at').defaultNow().notNull()
});
```

### Custom Nodes

Stores user-created custom nodes that combine multiple filters:

```typescript
export const customNodes = pgTable('custom_nodes', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category').notNull(),
  userId: integer('user_id').references(() => users.id),
  isPublic: boolean('is_public').default(false).notNull(),
  nodeData: jsonb('node_data').notNull(), // Stores the internal node configuration
  inputDefinitions: jsonb('input_definitions').notNull(), // Defines inputs for the custom node
  outputDefinitions: jsonb('output_definitions').notNull(), // Defines outputs for the custom node
  thumbnail: text('thumbnail'), // Base64 encoded thumbnail
  createdAt: timestamp('created_at').defaultNow().notNull()
});
```

## Storage Implementation

The application uses a storage interface defined in `server/storage.ts` to interact with the database:

```typescript
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
  
  // Custom node methods
  getAllCustomNodes(): Promise<CustomNode[]>;
  getCustomNodesByCategory(category: string): Promise<CustomNode[]>;
  getCustomNode(id: number): Promise<CustomNode | undefined>;
  createCustomNode(customNode: InsertCustomNode): Promise<CustomNode>;
  updateCustomNode(id: number, customNode: InsertCustomNode): Promise<CustomNode | undefined>;
  deleteCustomNode(id: number): Promise<boolean>;
}
```

This interface is implemented by `DatabaseStorage` which uses Drizzle ORM to interact with PostgreSQL.

## Data Flow

1. Client-side components make requests to the API endpoints in `server/routes.ts`
2. The API routes use the storage interface to perform CRUD operations
3. The storage implementation executes SQL queries using Drizzle ORM
4. Results are returned to the client as JSON data

## Image Storage

Currently, images are not stored in the database. Instead:

- User-uploaded images are processed in the browser
- Filter presets and custom nodes store thumbnails as base64-encoded strings
- Projects store only the node configuration, not the processed images

## Future Enhancements

### Short-term Improvements

- **User Authentication**: Complete user authentication system with sessions
- **Project Sharing**: Allow users to share projects with others
- **Better Thumbnails**: Improve thumbnail generation and storage
- **Backup System**: Implement automatic backups of user projects

### Long-term Plans

- **Cloud Storage**: Store large images in a cloud storage service rather than base64 in the database
- **Version History**: Track changes to projects over time
- **Public Gallery**: Create a public gallery of filter presets and custom nodes
- **Collaborative Editing**: Allow multiple users to work on a project simultaneously
- **Analytics**: Track usage patterns to improve the application
- **Export/Import**: Allow export and import of projects between accounts