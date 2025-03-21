import * as THREE from 'three';

export class TerrainChunk {
  constructor(chunkX, chunkZ, size, noise, seed) {
    this.chunkX = chunkX;
    this.chunkZ = chunkZ;
    this.size = size;
    this.noise = noise;
    this.seed = seed;
    this.heightMap = [];
    
    // Land-to-water ratio (higher values = more land, less water)
    this.landRatio = 0.9; // Very high land ratio (0.5 would be balanced, 1.0 would be all land)
    
    // Lower water level to have minimal water
    this.waterLevel = 0.15; // Reduced from 0.3 for less water
    
    // Generate the terrain mesh
    this.mesh = this.generateTerrain();
    
    // Add water plane if needed
    this.waterMesh = this.generateWater();
    if (this.waterMesh) {
      this.mesh.add(this.waterMesh);
    }
  }
  
  // Generate a terrain mesh for this chunk
  generateTerrain() {
    // Create geometry
    const geometry = new THREE.PlaneGeometry(
      this.size, 
      this.size, 
      this.size, 
      this.size
    );
    
    // Rotate to make it flat on the ground
    geometry.rotateX(-Math.PI / 2);
    
    // Move to correct position in world
    geometry.translate(
      this.chunkX * this.size + this.size / 2,
      0,
      this.chunkZ * this.size + this.size / 2
    );
    
    // Generate height data
    const positions = geometry.attributes.position;
    this.heightMap = [];
    
    // Apply height to each vertex based on noise
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      
      // Generate noise-based height
      const height = this.generateHeight(x, z);
      
      // Store height in our heightmap for later use
      this.heightMap.push({ x, z, height });
      
      // Update vertex position
      positions.setY(i, height);
    }
    
    // Compute normals for proper lighting
    geometry.computeVertexNormals();
    
    // Color the terrain based on height
    this.colorTerrain(geometry);
    
    // Create mesh with the geometry
    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      flatShading: true, // For low-poly look
      roughness: 0.8,
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    return mesh;
  }
  
  // Color the terrain based on height
  colorTerrain(geometry) {
    // Add color attribute if it doesn't exist
    if (!geometry.attributes.color) {
      const colors = new Float32Array(geometry.attributes.position.count * 3);
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    }
    
    const positions = geometry.attributes.position;
    const colors = geometry.attributes.color;
    
    for (let i = 0; i < positions.count; i++) {
      const y = positions.getY(i);
      let color = new THREE.Color();
      
      // Deep water
      if (y < this.waterLevel - 0.1) {
        color.setRGB(0.1, 0.2, 0.5);
      }
      // Water edge
      else if (y < this.waterLevel) {
        color.setRGB(0.1, 0.3, 0.6);
      }
      // Sand/beach
      else if (y < this.waterLevel + 2) {
        color.setRGB(0.85, 0.8, 0.55);
      }
      // Grass/plains (expanded range for more land)
      else if (y < 20) {
        color.setRGB(0.2 + Math.random() * 0.1, 0.5 + Math.random() * 0.1, 0.2);
      }
      // Mountain/rock
      else if (y < 40) {
        color.setRGB(0.4, 0.3, 0.2);
      }
      // Snow peaks
      else {
        color.setRGB(0.9, 0.9, 0.9);
      }
      
      // Set the color
      colors.setXYZ(i, color.r, color.g, color.b);
    }
    
    colors.needsUpdate = true;
  }
  
  // Generate water plane if needed
  generateWater() {
    // Check if this chunk might have water by checking corners
    let hasWater = false;
    for (const point of this.heightMap) {
      if (point.height <= this.waterLevel) {
        hasWater = true;
        break;
      }
    }
    
    if (!hasWater) {
      return null;
    }
    
    // Create water plane
    const waterGeometry = new THREE.PlaneGeometry(this.size, this.size);
    waterGeometry.rotateX(-Math.PI / 2);
    
    // Position at water level
    waterGeometry.translate(
      this.chunkX * this.size + this.size / 2,
      this.waterLevel,
      this.chunkZ * this.size + this.size / 2
    );
    
    // Semi-transparent blue material
    const waterMaterial = new THREE.MeshStandardMaterial({
      color: 0x3f95ea,
      transparent: true,
      opacity: 0.7,
      roughness: 0.1,
      metalness: 0.1,
    });
    
    const waterMesh = new THREE.Mesh(waterGeometry, waterMaterial);
    waterMesh.receiveShadow = true;
    
    return waterMesh;
  }
  
  // Generate height value using multiple noise samples
  generateHeight(x, z) {
    // Scale coordinates for noise input
    const worldX = x / 550; // Increased scale for larger terrain features (was 100)
    const worldZ = z / 550; // Increased scale for larger terrain features (was 100)
    
    // Multiple noise layers for varied terrain
    // Large-scale height variation (mountains and valleys)
    const mountainNoise = this.noise.noise(
      worldX * 0.5 + this.seed * 0.1,
      worldZ * 0.5 + this.seed * 0.2
    ) * 30; // Increased amplitude for more dramatic terrain
    
    // Medium-scale height variation (hills)
    const hillNoise = this.noise.noise(
      worldX * 1.5 + this.seed * 0.3,
      worldZ * 1.5 + this.seed * 0.4
    ) * 3; // Increased amplitude
    
    // Small-scale height variation (roughness)
    const roughness = this.noise.noise(
      worldX * 4 + this.seed * 0.5,
      worldZ * 4 + this.seed * 0.6
    ) * 0.3; // Increased roughness
    
    // Combine noise layers
    let height = mountainNoise + hillNoise + roughness;
    
    // Apply land ratio adjustment - raise the overall terrain based on land ratio
    height = height * (1 - this.landRatio) + (height + this.landRatio) * this.landRatio;
    
    // Add more flat areas for towns and settlements
    const flatMask = this.noise.noise(
      worldX * 0.2 + this.seed * 0.7,
      worldZ * 0.2 + this.seed * 0.8
    );
    
    // If flatMask is high enough, flatten the terrain
    if (flatMask > 0.6) {
      const targetHeight = 0.6 + Math.random() * 0.2;
      const flattenFactor = (flatMask - 0.6) * 2.5; // 0 to 1 range
      height = height * (1 - flattenFactor) + targetHeight * flattenFactor;
    }
    
    // Create mountains in specific areas (for interest)
    const mountainMask = this.noise.noise(
      worldX * 0.1 + this.seed * 0.9,
      worldZ * 0.1 + this.seed * 1.0
    );
    
    if (mountainMask > 0.7) {
      const mountainFactor = (mountainMask - 0.7) * 3.3;
      height += mountainFactor * 3; // Increased mountain height
    }
    
    return height;
  }
  
  // Get the height at a specific world position
  getHeightAt(worldX, worldZ) {
    // Convert world coordinates to local chunk coordinates
    const localX = worldX - this.chunkX * this.size;
    const localZ = worldZ - this.chunkZ * this.size;
    
    // Check if the point is in this chunk
    if (localX < 0 || localX > this.size || localZ < 0 || localZ > this.size) {
      return null;
    }
    
    // For a more accurate height, we should find the triangle the point is in
    // and interpolate, but for simplicity, we'll use noise directly
    return this.generateHeight(worldX, worldZ);
  }
} 