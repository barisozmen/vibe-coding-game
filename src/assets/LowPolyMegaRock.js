import * as THREE from 'three';

export class LowPolyMegaRock {
  constructor() {
    // Initialize random seed
    this.seed = Math.random() * 10000;
    // Pre-create base geometries for different mega rock types
    this.createBaseGeometries();
  }
  
  // Create base geometries for the mega rocks
  createBaseGeometries() {
    // Don't pre-create geometries anymore - we'll generate them on demand with fractals
    this.baseGeometryTypes = [
      'floatingIsland',
      'crystalFormation',
      'mesaFormation',
      'monolithFormation'
    ];
  }
  
  // Fractal noise functions
  noise2D(x, y, seed) {
    // Simple 2D noise function based on sine
    const nx = x + seed * 0.1;
    const ny = y + seed * 0.2;
    return Math.sin(nx * 12.9898 + ny * 78.233) * 43758.5453 % 1;
  }
  
  // Fractal Brownian Motion for more natural-looking noise
  fbm(x, y, octaves, seed) {
    let value = 0;
    let amplitude = 1.0;
    let frequency = 1.0;
    let maxValue = 0;
    
    for (let i = 0; i < octaves; i++) {
      value += amplitude * this.noise2D(x * frequency, y * frequency, seed + i * 100);
      maxValue += amplitude;
      amplitude *= 0.5;
      frequency *= 2.0;
    }
    
    return value / maxValue;
  }
  
  // Apply displacement to a vertex position based on fractal noise
  displaceVertex(x, y, z, strength, scale, seed) {
    const noiseX = this.fbm(x * scale, z * scale, 4, seed);
    const noiseY = this.fbm(x * scale, y * scale, 4, seed + 100);
    const noiseZ = this.fbm(y * scale, z * scale, 4, seed + 200);
    
    return [
      x + noiseX * strength,
      y + noiseY * strength,
      z + noiseZ * strength
    ];
  }
  
  // Create a floating island with arches - fractal version
  createFloatingIsland(seed = 0) {
    const geometry = new THREE.BufferGeometry();
    
    // Create a complex shape with arches and caves
    // Base island is a half sphere with flattened top
    const baseRadius = 15 + Math.random() * 10;
    const baseHeight = 25 + Math.random() * 10;
    
    // Create vertices for the base
    const vertices = [];
    const indices = [];
    
    // Create a flattened half-sphere for the base
    const segments = 12 + Math.floor(Math.random() * 8); // Randomize segment count
    const rings = 6 + Math.floor(Math.random() * 4);
    
    // Create main body of the floating island (half-sphere with flat top)
    // With fractal displacement
    const fractalScale = 0.03 + Math.random() * 0.04;
    const displacementStrength = 3 + Math.random() * 5;
    
    for (let y = 0; y <= rings; y++) {
      const v = y / rings;
      const yPos = Math.sin(v * Math.PI / 2) * baseHeight;
      const radius = Math.cos(v * Math.PI / 2) * baseRadius;
      
      for (let x = 0; x <= segments; x++) {
        const u = x / segments;
        const angle = u * Math.PI * 2;
        
        const xPos = Math.cos(angle) * radius;
        const zPos = Math.sin(angle) * radius;
        
        // Apply fractal displacement
        const [fracX, fracY, fracZ] = this.displaceVertex(
          xPos, yPos, zPos, 
          displacementStrength * (1 - v * 0.5), // Less displacement at the top
          fractalScale,
          seed
        );
        
        // Add vertex
        vertices.push(fracX, fracY, fracZ);
      }
    }
    
    // Add indices for faces
    for (let y = 0; y < rings; y++) {
      for (let x = 0; x < segments; x++) {
        const a = (segments + 1) * y + x;
        const b = (segments + 1) * (y + 1) + x;
        const c = (segments + 1) * (y + 1) + x + 1;
        const d = (segments + 1) * y + x + 1;
        
        // Two triangles per quad
        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }
    
    // Create arches with fractal variation
    const numArches = 2 + Math.floor(Math.random() * 3); // Random number of arches
    const archFractalScale = 0.1 + Math.random() * 0.1;
    
    for (let i = 0; i < numArches; i++) {
      const angle = (i / numArches) * Math.PI * 2 + Math.random() * 0.5; // Randomize placement
      const startIndex = vertices.length / 3;
      
      const archHeight = 10 + Math.random() * 10;
      const archWidth = 6 + Math.random() * 4;
      const archDepth = 4 + Math.random() * 3;
      
      const archSegments = Math.floor(segments / 2 + Math.random() * 4);
      const archRingsSegments = Math.floor(segments / 4 + Math.random() * 3);
      
      for (let j = 0; j <= archSegments; j++) {
        const archAngle = j / archSegments * Math.PI;
        
        // Create arch vertices in a semicircle
        const archX = Math.cos(archAngle) * archWidth;
        const archY = Math.sin(archAngle) * archHeight;
        
        for (let k = 0; k <= archRingsSegments; k++) {
          const depth = k / archRingsSegments * archDepth;
          
          // Position the arch
          const worldX = Math.cos(angle) * (baseRadius - depth);
          const worldZ = Math.sin(angle) * (baseRadius - depth);
          
          // Base vertex position
          const vx = worldX + Math.sin(angle) * archX;
          const vy = archY;
          const vz = worldZ - Math.cos(angle) * archX;
          
          // Apply fractal displacement - less at the edges to maintain arch shape
          const edgeFactor = Math.sin(archAngle); // 0 at endpoints, 1 in middle
          const [fracX, fracY, fracZ] = this.displaceVertex(
            vx, vy, vz, 
            1.5 * edgeFactor, // Less at endpoints to maintain shape
            archFractalScale,
            seed + i * 100
          );
          
          // Add displaced vertex
          vertices.push(fracX, fracY, fracZ);
        }
      }
      
      // Create indices for this arch
      for (let y = 0; y < archSegments; y++) {
        for (let x = 0; x < archRingsSegments; x++) {
          const base = startIndex + y * (archRingsSegments + 1) + x;
          const a = base;
          const b = base + 1;
          const c = base + (archRingsSegments + 1);
          const d = base + (archRingsSegments + 1) + 1;
          
          // Two triangles
          indices.push(a, c, b);
          indices.push(b, c, d);
        }
      }
    }
    
    // Create the final geometry
    const positionArray = new Float32Array(vertices);
    geometry.setAttribute('position', new THREE.BufferAttribute(positionArray, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    
    return geometry;
  }
  
  // Create a massive crystal formation - fractal version
  createCrystalFormation(seed = 0) {
    // Use a simple geometry approach instead of merging
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const indices = [];
    
    // Create base with fractal perturbation
    const baseRadius = 12 + Math.random() * 6;
    const baseHeight = 8 + Math.random() * 5;
    const segments = 5 + Math.floor(Math.random() * 4); // Random segment count for base
    
    // Fractal parameters for base
    const baseFractalScale = 0.1 + Math.random() * 0.05;
    const baseDisplacement = 1 + Math.random() * 2;
    
    // Create base vertices with fractal displacement
    for (let y = 0; y <= 1; y++) {
      const yPos = y * baseHeight;
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        
        const xPos = Math.cos(angle) * baseRadius;
        const zPos = Math.sin(angle) * baseRadius;
        
        // Apply fractal displacement - less at top edge
        const [fracX, fracY, fracZ] = this.displaceVertex(
          xPos, yPos, zPos,
          baseDisplacement * (1 - y * 0.3), // Less displacement at top edge
          baseFractalScale,
          seed + 300
        );
        
        vertices.push(fracX, fracY, fracZ);
      }
    }
    
    // Create base indices
    for (let i = 0; i < segments; i++) {
      const a = i;
      const b = i + 1;
      const c = i + segments + 1;
      const d = i + segments + 2;
      
      // Connect base
      indices.push(a, c, b);
      indices.push(b, c, d);
    }
    
    // Add crystal spikes with fractal variations
    const baseVertexCount = vertices.length / 3;
    
    // Randomly determine number of crystals
    const numCrystals = 5 + Math.floor(Math.random() * 5);
    
    // Create surrounding crystals with fractal variations
    for (let i = 0; i < numCrystals; i++) {
      // Randomize placement within the base
      const angle = (i / numCrystals) * Math.PI * 2 + Math.random() * 0.3;
      const distance = (baseRadius * 0.3) + Math.random() * (baseRadius * 0.5);
      
      // Vary crystal parameters
      const crystalHeight = 12 + Math.random() * 25;
      const crystalRadius = 1.5 + Math.random() * 3;
      
      // Number of sides for this crystal
      const crystalSides = 3 + Math.floor(Math.random() * 3); // 3 to 5 sides
      
      // Base of crystal
      const baseX = Math.cos(angle) * distance;
      const baseZ = Math.sin(angle) * distance;
      
      // Add base vertex
      const baseIndex = vertices.length / 3;
      vertices.push(baseX, baseHeight, baseZ);
      
      // Add surrounding vertices for base of crystal with slight variation
      for (let j = 0; j < crystalSides; j++) {
        const pointAngle = (j / crystalSides) * Math.PI * 2;
        
        // Apply some variation to the crystal base points
        const variation = 0.8 + Math.random() * 0.4;
        
        vertices.push(
          baseX + Math.cos(pointAngle) * crystalRadius * variation,
          baseHeight,
          baseZ + Math.sin(pointAngle) * crystalRadius * variation
        );
      }
      
      // Fractal parameters for this crystal
      const fractalScale = 0.15 + Math.random() * 0.1;
      const fractalStrength = 0.5 + Math.random() * 1.5;
      
      // Add tip of crystal with fractal displacement
      const tipX = baseX + (Math.random() * 2 - 1) * 3; // Slight random tilt
      const tipZ = baseZ + (Math.random() * 2 - 1) * 3;
      
      // Apply fractal displacement to tip
      const [fracTipX, fracTipY, fracTipZ] = this.displaceVertex(
        tipX, baseHeight + crystalHeight, tipZ,
        fractalStrength,
        fractalScale,
        seed + i * 200
      );
      
      const tipIndex = vertices.length / 3;
      vertices.push(fracTipX, fracTipY, fracTipZ);
      
      // Create faces connecting base to tip
      for (let j = 0; j < crystalSides; j++) {
        indices.push(
          baseIndex + 1 + j,
          tipIndex,
          baseIndex + 1 + ((j + 1) % crystalSides)
        );
      }
      
      // Create base of crystal
      for (let j = 2; j < crystalSides; j++) {
        indices.push(baseIndex, baseIndex + j, baseIndex + j - 1);
      }
      indices.push(baseIndex, baseIndex + 1, baseIndex + crystalSides);
    }
    
    // Add central crystal with fractal variations
    const centralHeight = 35 + Math.random() * 15;
    const centralRadius = 4 + Math.random() * 3;
    const centralSides = 5 + Math.floor(Math.random() * 4); // 5 to 8 sides
    
    // Add central crystal base
    const centralBaseIndex = vertices.length / 3;
    vertices.push(0, baseHeight, 0);
    
    // Add surrounding vertices with slight variations
    for (let i = 0; i < centralSides; i++) {
      const angle = (i / centralSides) * Math.PI * 2;
      
      // Add some variation to the base points
      const variation = 0.85 + Math.random() * 0.3;
      
      vertices.push(
        Math.cos(angle) * centralRadius * variation,
        baseHeight,
        Math.sin(angle) * centralRadius * variation
      );
    }
    
    // Fractal parameters for central crystal
    const centralFractalScale = 0.05 + Math.random() * 0.05;
    const centralFractalStrength = 2 + Math.random() * 3;
    
    // Add central tip with fractal displacement
    const [fracCentralX, fracCentralY, fracCentralZ] = this.displaceVertex(
      0, baseHeight + centralHeight, 0,
      centralFractalStrength,
      centralFractalScale,
      seed + 500
    );
    
    const centralTipIndex = vertices.length / 3;
    vertices.push(fracCentralX, fracCentralY, fracCentralZ);
    
    // Create faces for central crystal
    for (let i = 0; i < centralSides; i++) {
      indices.push(
        centralBaseIndex + 1 + i,
        centralTipIndex,
        centralBaseIndex + 1 + ((i + 1) % centralSides)
      );
    }
    
    // Create base of central crystal
    for (let i = 2; i < centralSides; i++) {
      indices.push(centralBaseIndex, centralBaseIndex + i, centralBaseIndex + i - 1);
    }
    indices.push(centralBaseIndex, centralBaseIndex + 1, centralBaseIndex + centralSides);
    
    // Create the geometry
    const positionArray = new Float32Array(vertices);
    geometry.setAttribute('position', new THREE.BufferAttribute(positionArray, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    
    return geometry;
  }
  
  // Create a giant mesa formation with stepped sides - fractal version
  createMesaFormation(seed = 0) {
    const geometry = new THREE.BufferGeometry();
    
    // Create a mesa with layered/stepped sides
    const baseRadius = 20 + Math.random() * 10;
    const height = 30 + Math.random() * 15;
    const layers = 4 + Math.floor(Math.random() * 4); // Random number of layers
    
    const vertices = [];
    const indices = [];
    
    // Fractal parameters
    const fractalScale = 0.03 + Math.random() * 0.04;
    const horizontalDisplacement = 2 + Math.random() * 3; // Displacement for x/z
    const verticalDisplacement = 1 + Math.random() * 2;  // Less displacement for height
    
    // Create stepped layers with fractal displacement
    for (let layer = 0; layer <= layers; layer++) {
      const layerRatio = layer / layers;
      const layerHeight = layerRatio * height;
      
      // Random offset for this layer to create more interesting shapes
      const layerOffsetX = (Math.random() * 2 - 1) * 3 * layerRatio;
      const layerOffsetZ = (Math.random() * 2 - 1) * 3 * layerRatio;
      
      // Vary layer radius with some noise
      const noiseValue = this.fbm(layer * 0.5, seed * 0.1, 2, seed);
      const variance = 0.8 + noiseValue * 0.4;
      
      // More variation in higher layers
      const layerRadius = baseRadius * (1 - 0.15 * layerRatio * variance);
      
      // Number of segments varies by layer - more segments in lower layers
      const segmentsPerLayer = 6 + Math.floor((1 - layerRatio) * 6) + Math.floor(Math.random() * 3);
      
      const layerStart = vertices.length / 3;
      
      // Create vertices for this layer with fractal displacement
      for (let i = 0; i <= segmentsPerLayer; i++) {
        const angle = (i / segmentsPerLayer) * Math.PI * 2;
        
        // Base positions
        let xPos = Math.cos(angle) * layerRadius + layerOffsetX;
        let zPos = Math.sin(angle) * layerRadius + layerOffsetZ;
        
        // Apply fractal displacement - stronger at edges, weaker at top
        const edgeFactor = 1 - layerRatio * 0.7; // Less displacement near top
        const [fracX, fracY, fracZ] = this.displaceVertex(
          xPos, layerHeight, zPos,
          horizontalDisplacement * edgeFactor, // Horizontal displacement
          fractalScale,
          seed + layer * 30
        );
        
        // Use horizontal displacement for x/z but control vertical displacement separately
        const verticalNoise = this.fbm(xPos * fractalScale, zPos * fractalScale, 3, seed + 100) * 2 - 1;
        const fy = layerHeight + verticalNoise * verticalDisplacement * edgeFactor;
        
        vertices.push(fracX, fy, fracZ);
      }
      
      // Add center vertex for top layer with slight displacement
      if (layer === layers) {
        const [centerX, centerY, centerZ] = this.displaceVertex(
          layerOffsetX, layerHeight, layerOffsetZ,
          verticalDisplacement * 0.5, // Less displacement at center
          fractalScale,
          seed + 200
        );
        
        vertices.push(centerX, centerY, centerZ);
      }
      
      // Create faces between this layer and the previous one
      if (layer > 0) {
        // Handle different number of segments between layers
        const prevSegments = 6 + Math.floor((1 - (layer - 1) / layers) * 6) + Math.floor(Math.random() * 3);
        
        // Create faces connecting layers - may need to skip or duplicate vertices
        const prevStart = layerStart - (prevSegments + 1);
        
        for (let i = 0; i < segmentsPerLayer; i++) {
          // Map this segment to the previous layer's segments
          const prevI = Math.floor(i * prevSegments / segmentsPerLayer);
          const nextPrevI = Math.floor((i + 1) * prevSegments / segmentsPerLayer);
          
          // Create triangles - may need multiple if segments don't align
          indices.push(
            prevStart + prevI,
            layerStart + i,
            layerStart + i + 1
          );
          
          // Add extra triangles if needed
          if (nextPrevI > prevI) {
            indices.push(
              prevStart + prevI,
              prevStart + nextPrevI,
              layerStart + i + 1
            );
          }
        }
      }
      
      // Create top face for the top layer
      if (layer === layers) {
        const center = vertices.length / 3 - 1;
        for (let i = 0; i < segmentsPerLayer; i++) {
          indices.push(
            layerStart + i,
            layerStart + i + 1,
            center
          );
        }
      }
    }
    
    // Create the geometry
    const positionArray = new Float32Array(vertices);
    geometry.setAttribute('position', new THREE.BufferAttribute(positionArray, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    
    return geometry;
  }
  
  // Create an alien monolith formation - fractal version
  createMonolithFormation(seed = 0) {
    const geometry = new THREE.BufferGeometry();
    
    // Create a tall, imposing alien structure
    const baseWidth = 15 + Math.random() * 8;
    const baseDepth = 15 + Math.random() * 8;
    const height = 40 + Math.random() * 20;
    
    // Create vertices for a complex monolith
    const vertices = [];
    const indices = [];
    
    // Create base - slightly wider at bottom
    const baseSegments = 6 + Math.floor(Math.random() * 4);
    const baseHeight = height * (0.1 + Math.random() * 0.1);
    
    // Fractal parameters for base
    const baseFractalScale = 0.1 + Math.random() * 0.1;
    const baseDisplacement = 1.5 + Math.random() * 1.5;
    
    for (let y = 0; y <= 1; y++) {
      const yPos = y * baseHeight;
      for (let x = 0; x <= baseSegments; x++) {
        const xRatio = x / baseSegments;
        const xPos = (xRatio - 0.5) * baseWidth;
        
        for (let z = 0; z <= baseSegments; z++) {
          const zRatio = z / baseSegments;
          const zPos = (zRatio - 0.5) * baseDepth;
          
          // Taper the base slightly
          const taper = y === 0 ? 1.0 : 0.9;
          
          // Apply fractal displacement - less at edges
          const edgeFactor = Math.min(xRatio, 1-xRatio, zRatio, 1-zRatio) * 2;
          const [fracX, fracY, fracZ] = this.displaceVertex(
            xPos * taper, yPos, zPos * taper,
            baseDisplacement * edgeFactor, 
            baseFractalScale,
            seed + 400
          );
          
          vertices.push(fracX, fracY, fracZ);
        }
      }
    }
    
    // Create indices for the base
    const baseVerticesPerRow = (baseSegments + 1) * (baseSegments + 1);
    for (let y = 0; y < 1; y++) {
      for (let x = 0; x < baseSegments; x++) {
        for (let z = 0; z < baseSegments; z++) {
          const base = y * baseVerticesPerRow + x * (baseSegments + 1) + z;
          
          const a = base;
          const b = base + 1;
          const c = base + (baseSegments + 1);
          const d = base + (baseSegments + 1) + 1;
          const e = base + baseVerticesPerRow;
          const f = base + baseVerticesPerRow + 1;
          const g = base + baseVerticesPerRow + (baseSegments + 1);
          const h = base + baseVerticesPerRow + (baseSegments + 1) + 1;
          
          // Top face (if we're at the top layer)
          if (y === 0) {
            indices.push(e, g, f);
            indices.push(f, g, h);
          }
          
          // Bottom face (if we're at the bottom layer)
          if (y === 0) {
            indices.push(a, b, c);
            indices.push(b, d, c);
          }
          
          // Side faces
          // Front
          indices.push(a, e, b);
          indices.push(b, e, f);
          
          // Right
          indices.push(b, f, d);
          indices.push(d, f, h);
          
          // Back
          indices.push(d, h, c);
          indices.push(c, h, g);
          
          // Left
          indices.push(c, g, a);
          indices.push(a, g, e);
        }
      }
    }
    
    // Random number of pillars - between 2 and 4
    const numPillars = 2 + Math.floor(Math.random() * 3);
    
    // Fractal parameters for pillars
    const pillarFractalScale = 0.05 + Math.random() * 0.05;
    const pillarDisplacement = 1 + Math.random() * 2;
    
    // Create the tall monolith pillars with fractal variations
    const monolithSegments = 3 + Math.floor(Math.random() * 3);
    
    // Create multiple tall pillars with fractal displacement
    for (let pillar = 0; pillar < numPillars; pillar++) {
      // Random pillar dimensions
      const pillarWidth = baseWidth * (0.15 + Math.random() * 0.1);
      const pillarDepth = baseDepth * (0.15 + Math.random() * 0.1);
      const pillarHeight = height * (0.7 + Math.random() * 0.3);
      
      // Random pillar position within base bounds
      const randPlacement = Math.random();
      const angle = (pillar / numPillars) * Math.PI * 2 + randPlacement * Math.PI / 4;
      const distance = baseWidth * 0.25 * randPlacement;
      
      const pillarX = Math.cos(angle) * distance;
      const pillarZ = Math.sin(angle) * distance;
      
      const pillarStartIndex = vertices.length / 3;
      
      // Create vertices for this pillar
      for (let y = 0; y <= 1; y++) {
        const yPos = baseHeight + y * pillarHeight;
        
        for (let x = 0; x <= monolithSegments; x++) {
          const xRatio = x / monolithSegments;
          const xPos = pillarX + (xRatio - 0.5) * pillarWidth;
          
          for (let z = 0; z <= monolithSegments; z++) {
            const zRatio = z / monolithSegments;
            const zPos = pillarZ + (zRatio - 0.5) * pillarDepth;
            
            // Taper the top slightly
            const taper = y === 0 ? 1.0 : 0.8 + Math.random() * 0.2;
            
            // Apply fractal displacement - less at edges and top
            const edgeFactor = Math.min(xRatio, 1-xRatio, zRatio, 1-zRatio) * 2;
            const topFactor = 1 - y * 0.7; // Less displacement at top
            
            const [fracX, fracY, fracZ] = this.displaceVertex(
              xPos * taper, yPos, zPos * taper,
              pillarDisplacement * edgeFactor * topFactor,
              pillarFractalScale,
              seed + pillar * 100 + 500
            );
            
            vertices.push(fracX, fracY, fracZ);
          }
        }
      }
      
      // Create indices for this pillar
      const verticesPerRow = (monolithSegments + 1) * (monolithSegments + 1);
      for (let y = 0; y < 1; y++) {
        for (let x = 0; x < monolithSegments; x++) {
          for (let z = 0; z < monolithSegments; z++) {
            const base = pillarStartIndex + y * verticesPerRow + x * (monolithSegments + 1) + z;
            
            const a = base;
            const b = base + 1;
            const c = base + (monolithSegments + 1);
            const d = base + (monolithSegments + 1) + 1;
            const e = base + verticesPerRow;
            const f = base + verticesPerRow + 1;
            const g = base + verticesPerRow + (monolithSegments + 1);
            const h = base + verticesPerRow + (monolithSegments + 1) + 1;
            
            // Top face (if we're at the top layer)
            if (y === 0) {
              indices.push(e, g, f);
              indices.push(f, g, h);
            }
            
            // Side faces
            // Front
            indices.push(a, e, b);
            indices.push(b, e, f);
            
            // Right
            indices.push(b, f, d);
            indices.push(d, f, h);
            
            // Back
            indices.push(d, h, c);
            indices.push(c, h, g);
            
            // Left
            indices.push(c, g, a);
            indices.push(a, g, e);
          }
        }
      }
    }
    
    // Create the geometry
    const positionArray = new Float32Array(vertices);
    geometry.setAttribute('position', new THREE.BufferAttribute(positionArray, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    
    return geometry;
  }

  // Create a mega rock at the specified position
  create(x, y, z) {
    // Generate a new seed for this instance
    const instanceSeed = this.seed + x * 100 + z * 10;
    
    // Randomly select a mega rock type
    const typeIndex = Math.floor(Math.random() * this.baseGeometryTypes.length);
    const selectedType = this.baseGeometryTypes[typeIndex];
    
    // Generate a new geometry using fractal methods
    let geometry;
    switch (selectedType) {
      case 'floatingIsland':
        geometry = this.createFloatingIsland(instanceSeed);
        break;
      case 'crystalFormation':
        geometry = this.createCrystalFormation(instanceSeed);
        break;
      case 'mesaFormation':
        geometry = this.createMesaFormation(instanceSeed);
        break;
      case 'monolithFormation':
        geometry = this.createMonolithFormation(instanceSeed);
        break;
      default:
        geometry = this.createFloatingIsland(instanceSeed);
    }
    
    // Create material with alien/weird colors and variations
    const colors = [
      0x8a0303, // Dark red
      0x2d0576, // Deep purple
      0x076457, // Teal
      0x615b5b, // Grey stone
      0x704214, // Rusty brown
      0x1a3a1a, // Dark green
      0x3a0ca3, // Indigo
      0x540d6e, // Dark purple
      0x06373a, // Dark teal
      0x5f4842  // Brown stone
    ];
    
    // Use the seed to select a deterministic but random color
    const colorIndex = Math.floor((instanceSeed % 1000) / 100) % colors.length;
    
    // Add variation to the base color
    const baseColor = colors[colorIndex];
    const r = ((baseColor >> 16) & 255) / 255;
    const g = ((baseColor >> 8) & 255) / 255;
    const b = (baseColor & 255) / 255;
    
    // Vary the color slightly
    const colorVariation = 0.15;
    const rVar = r * (1 - colorVariation + Math.random() * colorVariation * 2);
    const gVar = g * (1 - colorVariation + Math.random() * colorVariation * 2);
    const bVar = b * (1 - colorVariation + Math.random() * colorVariation * 2);
    
    const variedColor = new THREE.Color(
      Math.min(Math.max(rVar, 0), 1),
      Math.min(Math.max(gVar, 0), 1),
      Math.min(Math.max(bVar, 0), 1)
    );
    
    // Create the material with the varied color
    const material = new THREE.MeshStandardMaterial({
      color: variedColor,
      flatShading: true,
      roughness: 0.7 + Math.random() * 0.3,
      metalness: 0.1 + Math.random() * 0.3,
      // Add some emissive glow for some types
      emissive: selectedType === 'crystalFormation' ? variedColor.clone().multiplyScalar(0.2) : 0x000000
    });
    
    // Create the mesh
    const rock = new THREE.Mesh(geometry, material);
    rock.castShadow = true;
    rock.receiveShadow = true;
    
    // Position in world
    rock.position.set(x, y, z);
    
    // Random rotation on Y axis
    rock.rotation.y = Math.random() * Math.PI * 2;
    
    // Add user data for collision detection
    rock.userData.type = 'megarock';
    rock.userData.collisionRadius = 25; // Large collision radius
    rock.userData.isClimbable = true;   // Mark as climbable for potential gameplay use
    
    return rock;
  }
} 