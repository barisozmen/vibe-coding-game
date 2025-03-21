import * as THREE from 'three';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';
import { TerrainChunk } from './TerrainChunk.js';
import { ObjectPlacer } from './ObjectPlacer.js';

const RENDER_DISTANCE = 5; // Increased from 3 to 5 for a larger visible world

export class WorldGenerator {
  constructor(scene) {
    this.scene = scene;
    this.CHUNK_SIZE = 32; // Make CHUNK_SIZE a property of the class
    this.chunks = new Map(); // Store active chunks using Map for O(1) lookup
    this.seed = Math.random() * 10000; // Random seed for our world
    this.noise = new SimplexNoise(); // Noise generator for terrain
    this.objectPlacer = new ObjectPlacer(this.scene, this.seed);
    
    // Create an initial terrain chunk at origin for spawn point finding
    this.initialChunk = new TerrainChunk(0, 0, this.CHUNK_SIZE, this.noise, this.seed);
  }

  // Find a suitable spawn point on land, not water
  findSpawnPoint() {
    // Define water level from our terrain settings
    const waterLevel = this.initialChunk.waterLevel;
    
    // Try several positions near the origin until we find one above water
    const searchRadius = 50;
    const attempts = 20;
    
    for (let i = 0; i < attempts; i++) {
      // Start at the center and spiral outward
      const angle = i * Math.PI * 0.618033988749895; // Golden ratio angle for nice distribution
      const distance = Math.sqrt(i) * searchRadius / Math.sqrt(attempts);
      
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;
      
      // Get height at this position
      const height = this.initialChunk.generateHeight(x, z);
      
      // If it's above water level with some margin, it's suitable
      if (height > waterLevel + 0.2) {
        console.log(`Found suitable spawn point at (${x}, ${height}, ${z})`);
        return new THREE.Vector3(x, height, z);
      }
    }
    
    // If all else fails, force a minimum height at origin
    const originHeight = Math.max(this.initialChunk.generateHeight(0, 0), waterLevel + 0.5);
    console.log(`Forced spawn point at (0, ${originHeight}, 0)`);
    return new THREE.Vector3(0, originHeight, 0);
  }

  // Update world based on player position
  update(playerPosition) {
    // Get the chunk coordinates the player is in
    const currentChunkX = Math.floor(playerPosition.x / this.CHUNK_SIZE);
    const currentChunkZ = Math.floor(playerPosition.z / this.CHUNK_SIZE);
    
    // Generate or update chunks within render distance
    for (let x = -RENDER_DISTANCE; x <= RENDER_DISTANCE; x++) {
      for (let z = -RENDER_DISTANCE; z <= RENDER_DISTANCE; z++) {
        const chunkX = currentChunkX + x;
        const chunkZ = currentChunkZ + z;
        const chunkKey = `${chunkX},${chunkZ}`;
        
        // If chunk doesn't exist yet, create it
        if (!this.chunks.has(chunkKey)) {
          this.generateChunk(chunkX, chunkZ, chunkKey);
        }
      }
    }
    
    // Remove chunks that are too far away
    this.chunks.forEach((chunk, key) => {
      const [x, z] = key.split(',').map(Number);
      
      if (
        Math.abs(x - currentChunkX) > RENDER_DISTANCE ||
        Math.abs(z - currentChunkZ) > RENDER_DISTANCE
      ) {
        // Remove chunk from scene
        this.scene.remove(chunk.mesh);
        this.objectPlacer.removeObjectsInChunk(key);
        this.chunks.delete(key);
      }
    });
  }
  
  // Generate a new terrain chunk
  generateChunk(chunkX, chunkZ, chunkKey) {
    // Create terrain for this chunk
    const chunk = new TerrainChunk(
      chunkX, 
      chunkZ, 
      this.CHUNK_SIZE, 
      this.noise, 
      this.seed
    );
    
    // Add chunk mesh to scene
    this.scene.add(chunk.mesh);
    
    // Store chunk
    this.chunks.set(chunkKey, chunk);
    
    // Place objects on this chunk
    this.objectPlacer.placeObjectsInChunk(chunk);
  }
} 