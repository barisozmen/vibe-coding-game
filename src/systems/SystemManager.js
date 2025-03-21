import * as THREE from 'three';
import { CollisionSystem } from './CollisionSystem.js';

export class SystemManager {
  constructor(scene, worldGenerator) {
    this.scene = scene;
    this.worldGenerator = worldGenerator;
    this.systems = {};
    this.previousTime = performance.now();
    
    // Initialize default systems
    this.initializeSystems();
  }
  
  // Initialize all game systems
  initializeSystems() {
    // Collision system
    this.systems.collision = new CollisionSystem(this.worldGenerator);
    
    // Additional systems can be added here as needed:
    // this.systems.physics = new PhysicsSystem();
    // this.systems.ai = new AISystem();
    // etc.
  }
  
  // Update all systems
  update(player) {
    // Calculate delta time
    const currentTime = performance.now();
    const deltaTime = (currentTime - this.previousTime) / 1000; // Convert to seconds
    this.previousTime = currentTime;
    
    // Update each system
    for (const systemName in this.systems) {
      const system = this.systems[systemName];
      if (system.enabled) {
        system.update(player, deltaTime);
      }
    }
  }
  
  // Get a specific system
  getSystem(systemName) {
    return this.systems[systemName];
  }
  
  // Enable/disable a system
  setSystemEnabled(systemName, enabled) {
    const system = this.systems[systemName];
    if (system) {
      system.enabled = enabled;
    }
  }
} 