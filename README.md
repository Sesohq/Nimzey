# FilterKit

A dynamic, node-based image filtering application with a modern interface for creative image manipulation.

## Overview

FilterKit allows users to apply complex filter chains to images using an intuitive node-based interface. Users can upload images, connect different filter nodes, adjust parameters, and see real-time previews of the results.

## Features

- **Node-Based Interface**: Intuitive visual programming-style filter creation
- **Multiple Filter Types**: Basic, texture, compositing, and generator filters
- **Real-Time Preview**: See changes immediately as you adjust parameters
- **Blend Modes**: Combine images with various blend modes similar to professional software
- **Custom Node Creation**: Combine filters into reusable custom nodes
- **Filter Presets**: Save and load favorite filter configurations (coming soon)

## Filter Categories

- **Basic Filters**: Blur, Sharpen, Grayscale, Invert, Brightness, Contrast
- **Texture Filters**: Noise, Dither, Halftone, Pixelate, Texture
- **Compositing Filters**: Blend, Mask, Mix
- **Generator Filters**: Noise Generator, Gradient (more coming soon)
- **Special Filters**: Glow, Refraction, Wave, Find Edges

## Getting Started

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/filterkit.git

# Navigate to the project directory
cd filterkit

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Basic Usage

1. **Upload an Image**: Click the upload button to add an image
2. **Add Filters**: Drag filters from the left panel onto the canvas
3. **Connect Nodes**: Drag from an output handle to an input handle to connect nodes
4. **Adjust Parameters**: Tweak filter settings using the controls in each node
5. **View Results**: See the final output in the preview panel on the right

## Architecture

FilterKit is built using a modern web technology stack:

- **Frontend**: React with TypeScript
- **UI Framework**: Tailwind CSS with shadcn components
- **Node Graph**: ReactFlow for the node-based interface
- **Image Processing**: Custom Canvas API implementations
- **State Management**: React hooks and context
- **Database**: PostgreSQL with Drizzle ORM (for saving presets)

## Development

### Project Structure

```
filterkit/
├── client/                 # Frontend code
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions and algorithms
│   │   ├── pages/          # Page components
│   │   └── types/          # TypeScript type definitions
├── server/                 # Backend code
│   ├── index.ts            # Server entry point
│   ├── routes.ts           # API routes
│   └── storage.ts          # Data storage interface
├── shared/                 # Shared code between client and server
│   └── schema.ts           # Database schema definitions
└── docs/                   # Documentation
    ├── PROJECT_OVERVIEW.md # General project information
    ├── FILTER_NODES.md     # Filter node documentation
    ├── BLEND_SYSTEM.md     # Blend system documentation
    ├── SPECIAL_FILTERS.md  # Special filter documentation
    └── ROADMAP.md          # Development roadmap
```

### Contributing

Contributions are welcome! Please check the following resources before contributing:

- [Project Roadmap](docs/ROADMAP.md) for planned features
- [Development Guidelines](docs/PROJECT_OVERVIEW.md#development-guidelines) for code style and practices

## Documentation

For more detailed information, please refer to the documentation in the `docs/` directory:

- [Project Overview](docs/PROJECT_OVERVIEW.md)
- [Filter Nodes](docs/FILTER_NODES.md)
- [Blend System](docs/BLEND_SYSTEM.md)
- [Special Filters](docs/SPECIAL_FILTERS.md)
- [Node System](docs/NODE_SYSTEM.md)
- [Database Structure](docs/DATABASE_STRUCTURE.md)
- [UI/UX Design](docs/UI_UX_DESIGN.md)
- [Development Roadmap](docs/ROADMAP.md)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Thanks to the ReactFlow team for the excellent node graph library
- Inspiration from professional image editing software like Photoshop and Figma
- Special thanks to the open-source community for various algorithms and techniques used in the filters