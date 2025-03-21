# Three.js Vite Template

A simple starter template for Three.js projects using Vite as a build tool.

## Features

- Three.js setup with a rotating cube
- OrbitControls for camera manipulation
- Responsive design (adapts to window resizing)
- Basic lighting setup (ambient and directional)
- Clean project structure
- Fast development with Vite

## Getting Started

### Prerequisites

- Node.js (v14 or later recommended)
- npm or yarn

### Installation

1. Clone or download this repository
2. Install dependencies:

```bash
npm install
# or
yarn
```

### Development

Start the development server:

```bash
npm run dev
# or
yarn dev
```

The development server will start at http://localhost:5173 (or another port if 5173 is in use)

### Building for Production

Create a production build:

```bash
npm run build
# or
yarn build
```

This will generate optimized files in the `dist` directory.

### Preview Production Build

To preview the production build locally:

```bash
npm run preview
# or
yarn preview
```

## Project Structure

- `index.html` - Entry HTML file
- `src/main.js` - Main JavaScript file with Three.js setup
- `vite.config.js` - Vite configuration

## Customization

- To change the background color, modify `scene.background` in `src/main.js`
- To change the cube color, modify the `color` property in the `MeshStandardMaterial`
- Adjust lighting by modifying the ambient and directional light properties

## Resources

- [Three.js Documentation](https://threejs.org/docs/)
- [Vite Documentation](https://vitejs.dev/guide/) 