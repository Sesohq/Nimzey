# Filter Kit - Node-based Image Processing System

## Overview

This project is a sophisticated image processing application built as a node-based visual editor. Users can create complex filter chains by connecting nodes in a graph-like interface, similar to professional tools like Filter Forge or Blender's shader nodes. The application uses a full-stack architecture with React/TypeScript on the frontend and Express.js with PostgreSQL on the backend.

## System Architecture

### Frontend Architecture
- **React 18** with TypeScript for type safety and modern component patterns
- **ReactFlow** for the node-based graph editor interface
- **Tailwind CSS** with **shadcn/ui** components for consistent, modern styling
- **Vite** as the build tool for fast development and optimized production builds
- **TanStack Query** for server state management and caching
- **Wouter** for lightweight client-side routing

### Backend Architecture
- **Express.js** with TypeScript for the REST API server
- **Drizzle ORM** for type-safe database operations
- **PostgreSQL** as the primary database (using @neondatabase/serverless for cloud deployment)
- **Session-based architecture** with connect-pg-simple for session storage

### WebGL GPU Acceleration (In Development)
- **WebGL2-based filter engine** for high-performance image processing
- **Shader compilation system** that converts filter graphs into optimized GPU shaders
- **Progressive quality levels** (preview/draft/full) for responsive editing

## Key Components

### Node System
- **Filter Nodes**: Apply image processing effects (blur, sharpen, noise, etc.)
- **Generator Nodes**: Create procedural content (Perlin noise, checkerboard patterns)
- **Image Nodes**: Source images for processing
- **Output Nodes**: Final rendered results
- **Mask Nodes**: Advanced blending and masking operations

### Filter Processing Pipeline
1. **CPU-based processing** using HTML5 Canvas for immediate compatibility
2. **WebGL acceleration** (planned) for complex filter chains
3. **Real-time preview system** with debounced parameter updates
4. **Shader fusion optimization** to minimize GPU texture transfers

### Graph Management
- **Visual node editor** with drag-and-drop filter placement
- **Connection validation** to prevent invalid filter chains
- **Real-time parameter adjustment** with immediate visual feedback
- **Export capabilities** for saving processed images

## Data Flow

1. **User uploads image** → Stored as base64 data URL
2. **User creates filter nodes** → Added to ReactFlow graph state
3. **User connects nodes** → Edges define processing order
4. **Parameter changes** → Trigger debounced re-processing
5. **Filter processing** → Sequential application through connected nodes
6. **Preview generation** → Real-time canvas updates
7. **Export** → Final processed image download

The system uses a reactive data flow where parameter changes immediately trigger preview updates, providing instant visual feedback to users.

## External Dependencies

### Core Dependencies
- **ReactFlow**: Node-based graph editor functionality
- **Drizzle ORM + PostgreSQL**: Database operations and schema management
- **shadcn/ui + Radix UI**: Comprehensive component library
- **Tailwind CSS**: Utility-first styling framework
- **TanStack Query**: Server state management

### Image Processing
- **HTML5 Canvas API**: Core image manipulation
- **WebGL2** (planned): GPU-accelerated processing
- **lodash**: Utility functions for debouncing and data manipulation

### Development Tools
- **TypeScript**: Type safety across the entire stack
- **Vite**: Fast development server and build tool
- **ESBuild**: Server-side bundling for production

## Deployment Strategy

### Development Environment
- **Replit-optimized setup** with live reloading and error overlay
- **PostgreSQL database** provisioned through Replit's database service
- **Environment variables** for database connection and configuration

### Production Deployment
- **Autoscale deployment target** for handling variable traffic
- **Vite build process** generates optimized client bundles
- **ESBuild server compilation** for efficient server-side code
- **Static asset serving** through Express with proper caching headers

The application is designed to run efficiently on Replit's infrastructure while being portable to other deployment platforms.

## Changelog
```
Changelog:
- June 12, 2025. Initial setup
```

## User Preferences
```
Preferred communication style: Simple, everyday language.
```