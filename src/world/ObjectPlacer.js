import * as THREE from 'three';
import { LowPolyTree } from '../assets/LowPolyTree.js';
import { LowPolyRock } from '../assets/LowPolyRock.js';
import { LowPolyBush } from '../assets/LowPolyBush.js';
import { LowPolyBuilding } from '../assets/LowPolyBuilding.js';
import { LowPolyApartment } from '../assets/LowPolyApartment.js';
import { LowPolyRoad } from '../assets/LowPolyRoad.js';

// Density values for object placement (objects per chunk)
const TREE_DENSITY = 20;
const ROCK_DENSITY = 10;
const BUSH_DENSITY = 15;
const BUILDING_DENSITY = 2;
const APARTMENT_DENSITY = 1; // Lower density for larger buildings

// Min distance between buildings to prevent overlap
const MIN_BUILDING_DISTANCE = 10;
const MIN_APARTMENT_DISTANCE = 20;

export class ObjectPlacer {
  constructor(scene, seed) {
    this.scene = scene;
    this.seed = seed;
    this.objects = new Map(); // Map of chunk keys to arrays of objects
    
    // Initialize object factories
    this.treeFactory = new LowPolyTree();
    this.rockFactory = new LowPolyRock();
    this.bushFactory = new LowPolyBush();
    this.buildingFactory = new LowPolyBuilding();
    this.apartmentFactory = new LowPolyApartment();
    this.roadFactory = new LowPolyRoad();
    
    // Store building positions for road placement
    this.buildingPositions = [];
    this.apartmentPositions = [];
    
    // Road network already placed
    this.roadNetworkPlaced = false;
  }
  
  // Place objects on a terrain chunk
  placeObjectsInChunk(chunk) {
    const chunkKey = `${chunk.chunkX},${chunk.chunkZ}`;
    const chunkObjects = [];
    
    // Create a simple pseudo-random generator with seed
    const random = this.createRandomGenerator(chunk.chunkX, chunk.chunkZ);
    
    // Create town center if this is a special location
    if (this.isTownLocation(chunk.chunkX, chunk.chunkZ)) {
      this.createTownCenter(chunk, chunkObjects, random);
    } 
    // Otherwise place normal objects
    else {
      // Place trees
      this.placeObjects(
        chunk, 
        chunkObjects, 
        TREE_DENSITY, 
        (x, z, y) => this.treeFactory.create(x, y, z),
        random,
        0.45 // Minimum height for trees (above water)
      );
      
      // Place rocks
      this.placeObjects(
        chunk, 
        chunkObjects, 
        ROCK_DENSITY, 
        (x, z, y) => this.rockFactory.create(x, y, z),
        random,
        0.3 // Rocks can be near water
      );
      
      // Place bushes
      this.placeObjects(
        chunk, 
        chunkObjects, 
        BUSH_DENSITY, 
        (x, z, y) => this.bushFactory.create(x, y, z),
        random,
        0.45 // Bushes on normal terrain
      );
      
      // Place buildings (rarely and only on flat areas)
      this.placeObjects(
        chunk, 
        chunkObjects, 
        BUILDING_DENSITY,
        (x, z, y) => {
          const building = this.buildingFactory.create(x, y, z);
          // Store building position for road placement
          this.buildingPositions.push(new THREE.Vector3(x, y, z));
          return building;
        },
        random,
        0.5, // Buildings only on flat ground
        (x, z, chunk) => this.isFlatArea(x, z, chunk) && this.isFarFromOtherBuildings(x, z, MIN_BUILDING_DISTANCE)
      );
      
      // Place apartment buildings (even more rarely, and only on very flat areas)
      if (random() > 0.7) { // Only 30% of chunks get apartments
        this.placeObjects(
          chunk, 
          chunkObjects, 
          APARTMENT_DENSITY,
          (x, z, y) => {
            const apartment = this.apartmentFactory.create(x, y, z);
            // Store apartment position for road placement
            this.apartmentPositions.push(new THREE.Vector3(x, y, z));
            return apartment;
          },
          random,
          0.5, // Apartments only on flat ground
          (x, z, chunk) => this.isVeryFlatArea(x, z, chunk) && this.isFarFromOtherBuildings(x, z, MIN_APARTMENT_DISTANCE)
        );
      }
    }
    
    // Store the objects for this chunk
    this.objects.set(chunkKey, chunkObjects);
    
    // Place road network once we have enough buildings
    // Only do this once to avoid creating too many roads
    if (this.buildingPositions.length > 5 && !this.roadNetworkPlaced) {
      this.createRoadNetwork();
      this.roadNetworkPlaced = true;
    }
  }
  
  // Create a town center layout
  createTownCenter(chunk, chunkObjects, random) {
    const centerX = chunk.chunkX * chunk.size + chunk.size / 2;
    const centerZ = chunk.chunkZ * chunk.size + chunk.size / 2;
    const height = chunk.getHeightAt(centerX, centerZ);
    
    if (height < 0.5 || height > 1.5) return; // Only create towns on suitable terrain
    
    // Create a central square
    const squareSize = 20;
    
    // Place apartments in a pattern around center
    for (let i = 0; i < 4; i++) {
      const angle = i * Math.PI / 2;
      const distance = squareSize * 0.7;
      
      const x = centerX + Math.cos(angle) * distance;
      const z = centerZ + Math.sin(angle) * distance;
      const y = chunk.getHeightAt(x, z);
      
      if (y !== null && y >= 0.5) {
        const apartment = this.apartmentFactory.create(x, y, z);
        apartment.rotation.y = angle + Math.PI;
        this.scene.add(apartment);
        chunkObjects.push(apartment);
        
        // Store position for road network
        this.apartmentPositions.push(new THREE.Vector3(x, y, z));
      }
    }
    
    // Place normal buildings between apartments
    for (let i = 0; i < 4; i++) {
      const angle = i * Math.PI / 2 + Math.PI / 4;
      const distance = squareSize * 0.6;
      
      const x = centerX + Math.cos(angle) * distance;
      const z = centerZ + Math.sin(angle) * distance;
      const y = chunk.getHeightAt(x, z);
      
      if (y !== null && y >= 0.5) {
        const building = this.buildingFactory.create(x, y, z);
        building.rotation.y = angle + Math.PI;
        this.scene.add(building);
        chunkObjects.push(building);
        
        // Store position for road network
        this.buildingPositions.push(new THREE.Vector3(x, y, z));
      }
    }
    
    // Place a crossroad in the center
    const intersection = this.roadFactory.createIntersection(centerX, height + 0.05, centerZ);
    this.scene.add(intersection);
    chunkObjects.push(intersection);
    
    // Add roads connecting to the intersection
    for (let i = 0; i < 4; i++) {
      const angle = i * Math.PI / 2;
      
      for (let j = 1; j <= 2; j++) {
        const roadX = centerX + Math.cos(angle) * (j * 16);
        const roadZ = centerZ + Math.sin(angle) * (j * 16);
        const roadY = chunk.getHeightAt(roadX, roadZ) || height;
        
        const road = this.roadFactory.createStraight(roadX, roadY + 0.05, roadZ, angle);
        this.scene.add(road);
        chunkObjects.push(road);
      }
    }
    
    // Place some trees and bushes for decoration
    for (let i = 0; i < 10; i++) {
      const angle = random() * Math.PI * 2;
      const distance = squareSize * (0.8 + random() * 0.3);
      
      const x = centerX + Math.cos(angle) * distance;
      const z = centerZ + Math.sin(angle) * distance;
      const y = chunk.getHeightAt(x, z);
      
      if (y !== null && y >= 0.45) {
        // 50% chance for tree or bush
        if (random() > 0.5) {
          const tree = this.treeFactory.create(x, y, z);
          this.scene.add(tree);
          chunkObjects.push(tree);
        } else {
          const bush = this.bushFactory.create(x, y, z);
          this.scene.add(bush);
          chunkObjects.push(bush);
        }
      }
    }
  }
  
  // Check if this is a location that should have a town center
  isTownLocation(chunkX, chunkZ) {
    // Create a deterministic check based on seed
    const townSeed = Math.sin(this.seed * 0.1 + chunkX * 0.3 + chunkZ * 0.7) * 10000;
    const townValue = (townSeed - Math.floor(townSeed));
    
    // Very rare chance (about 1 in 500 chunks)
    return townValue > 0.998 && chunkX % 5 === 0 && chunkZ % 5 === 0;
  }
  
  // Create a road network connecting buildings
  createRoadNetwork() {
    // Combine apartment and regular building positions
    const allPositions = [...this.buildingPositions, ...this.apartmentPositions];
    
    // Only create roads if we have enough buildings
    if (allPositions.length > 5) {
      this.roadFactory.createRoadNetwork(this.scene, allPositions);
    }
  }
  
  // Helper to place objects with different parameters
  placeObjects(chunk, chunkObjects, density, createFn, random, minHeight, additionalCheckFn = null) {
    for (let i = 0; i < density; i++) {
      // Random position within chunk
      const localX = random() * chunk.size;
      const localZ = random() * chunk.size;
      
      // World coordinates
      const worldX = chunk.chunkX * chunk.size + localX;
      const worldZ = chunk.chunkZ * chunk.size + localZ;
      
      // Get height at this position
      const height = chunk.getHeightAt(worldX, worldZ);
      
      // Skip if underwater or additional check fails
      if (height < minHeight || height > 2.0) continue;
      if (additionalCheckFn && !additionalCheckFn(worldX, worldZ, chunk)) continue;
      
      // Create object and add to scene
      const object = createFn(worldX, worldZ, height);
      this.scene.add(object);
      chunkObjects.push(object);
      
      // Add some variation
      object.rotation.y = random() * Math.PI * 2;
      const scale = 0.8 + random() * 0.4;
      object.scale.set(scale, scale, scale);
    }
  }
  
  // Check if an area is flat enough for buildings
  isFlatArea(x, z, chunk) {
    // Sample heights in a small area
    const sampleRadius = 5;
    const samples = [];
    
    for (let sx = -sampleRadius; sx <= sampleRadius; sx += 2) {
      for (let sz = -sampleRadius; sz <= sampleRadius; sz += 2) {
        const height = chunk.getHeightAt(x + sx, z + sz);
        if (height !== null) {
          samples.push(height);
        }
      }
    }
    
    // Calculate height difference
    if (samples.length < 4) return false;
    
    const min = Math.min(...samples);
    const max = Math.max(...samples);
    
    // Area is flat if max height difference is small
    return (max - min) < 0.2;
  }
  
  // Check if area is very flat (for apartments)
  isVeryFlatArea(x, z, chunk) {
    // Sample heights in a larger area
    const sampleRadius = 10;
    const samples = [];
    
    for (let sx = -sampleRadius; sx <= sampleRadius; sx += 2) {
      for (let sz = -sampleRadius; sz <= sampleRadius; sz += 2) {
        const height = chunk.getHeightAt(x + sx, z + sz);
        if (height !== null) {
          samples.push(height);
        }
      }
    }
    
    // Calculate height difference
    if (samples.length < 10) return false;
    
    const min = Math.min(...samples);
    const max = Math.max(...samples);
    
    // Area is very flat if max height difference is extremely small
    return (max - min) < 0.15;
  }
  
  // Check if position is far enough from other buildings
  isFarFromOtherBuildings(x, z, minDistance) {
    // Check distance to regular buildings
    for (const pos of this.buildingPositions) {
      const dx = pos.x - x;
      const dz = pos.z - z;
      const distSq = dx * dx + dz * dz;
      
      if (distSq < minDistance * minDistance) {
        return false;
      }
    }
    
    // Check distance to apartments
    for (const pos of this.apartmentPositions) {
      const dx = pos.x - x;
      const dz = pos.z - z;
      const distSq = dx * dx + dz * dz;
      
      if (distSq < minDistance * minDistance) {
        return false;
      }
    }
    
    return true;
  }
  
  // Remove all objects in a chunk
  removeObjectsInChunk(chunkKey) {
    const objects = this.objects.get(chunkKey);
    if (!objects) return;
    
    // Remove each object from scene
    for (const object of objects) {
      this.scene.remove(object);
      
      // Dispose of geometries and materials to prevent memory leaks
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    }
    
    // Remove from map
    this.objects.delete(chunkKey);
  }
  
  // Create a deterministic random number generator for a chunk
  createRandomGenerator(chunkX, chunkZ) {
    // Seed based on chunk coordinates and world seed
    let seed = this.seed + chunkX * 10000 + chunkZ * 1000;
    
    return function() {
      // Simple but effective pseudo-random generator
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };
  }
} 