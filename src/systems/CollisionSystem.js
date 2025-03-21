import * as THREE from 'three';

export class CollisionSystem {
  constructor(worldGenerator) {
    this.worldGenerator = worldGenerator;
    this.enabled = true;
    
    // Collision parameters
    this.playerHeight = 1.8; // Height of player character
    this.playerRadius = 0.3; // Radius of player collider
    this.groundOffset = 0.05; // Small offset to keep player slightly above ground (reduced from 0.1)
    this.maxClimbAngle = 45; // Maximum angle in degrees that the player can climb
    this.maxClimbAngleRadians = this.maxClimbAngle * (Math.PI / 180);
    
    // Flag to indicate if player origin is at feet (true) or center (false)
    this.playerOriginAtFeet = true;
    
    // Object collision parameters
    this.objectCollisionEnabled = true;
    this.objectColliders = new Map(); // Map to store object colliders
    this.bounceStrength = 0.5; // How strongly to bounce the player back
  }
  
  // Update player position based on terrain and objects
  update(player, deltaTime) {
    if (!this.enabled) return;
    
    // Validate player parameter
    if (!player || !(player.position instanceof THREE.Vector3)) {
      console.error(`CollisionSystem: Invalid player object or missing position property.`);
      return;
    }
    
    // Store original position to calculate movement delta
    const originalPosition = player.position.clone();
    
    // Validate deltaTime
    if (typeof deltaTime !== 'number' || isNaN(deltaTime)) {
      console.warn(`CollisionSystem: Invalid deltaTime: ${deltaTime}, using default value`);
      deltaTime = 1/60; // Default to 60fps
    }
    
    // 1. Handle terrain collision and gravity
    this.handleTerrainCollision(player, deltaTime, originalPosition);
    
    // 2. Handle object collisions (after terrain collision to ensure correct height)
    if (this.objectCollisionEnabled) {
      this.handleObjectCollision(player, originalPosition);
    }
  }
  
  // Handle terrain collision and gravity
  handleTerrainCollision(player, deltaTime, originalPosition) {
    // Get the terrain height at player's position
    const terrainHeight = this.getTerrainHeightAt(player.position.x, player.position.z);
    
    // If no height found (e.g., outside map bounds), return
    if (terrainHeight === null) return;
    
    // Calculate player's feet position based on origin
    let playerFeetHeight;
    if (this.playerOriginAtFeet) {
      // If origin is at feet, position.y is already at feet level
      playerFeetHeight = player.position.y;
    } else {
      // If origin is at center, feet are half the height down
      playerFeetHeight = player.position.y - this.playerHeight / 2;
    }
    
    // Check if player is below terrain (collision)
    if (playerFeetHeight < terrainHeight) {
      // Check if the slope is too steep to climb
      if (this.isSlopeTooSteep(player.position)) {
        // If too steep, revert movement
        player.position.copy(originalPosition);
        
        // Also update mesh position directly for immediate visual effect
        if (player.group && player.group.position) {
          player.group.position.copy(originalPosition);
        }
      } else {
        // If slope is climbable, adjust height to be on ground
        let newY;
        if (this.playerOriginAtFeet) {
          // If origin is at feet, place feet directly on terrain plus offset
          newY = terrainHeight + this.groundOffset;
        } else {
          // If origin is at center, place center at terrain + half height + offset
          newY = terrainHeight + this.playerHeight / 2 + this.groundOffset;
        }
        
        player.position.y = newY;
        
        // Also update mesh position directly for immediate visual effect
        if (player.group && player.group.position) {
          player.group.position.y = newY;
        }
      }
    }
    
    // Apply gravity if player is above ground
    if (playerFeetHeight > terrainHeight + this.groundOffset) {
      // Simple gravity implementation
      const gravityDelta = 9.81 * deltaTime; // Adjust fall speed
      player.position.y -= gravityDelta;
      
      // Also update mesh position directly for immediate visual effect
      if (player.group && player.group.position) {
        player.group.position.y -= gravityDelta;
      }
      
      // Calculate new feet position after gravity
      let newPlayerFeetHeight;
      if (this.playerOriginAtFeet) {
        newPlayerFeetHeight = player.position.y;
      } else {
        newPlayerFeetHeight = player.position.y - this.playerHeight / 2;
      }
      
      // Don't fall below ground
      if (newPlayerFeetHeight < terrainHeight) {
        let newY;
        if (this.playerOriginAtFeet) {
          newY = terrainHeight + this.groundOffset;
        } else {
          newY = terrainHeight + this.playerHeight / 2 + this.groundOffset;
        }
        
        player.position.y = newY;
        
        // Also update mesh position directly for immediate visual effect
        if (player.group && player.group.position) {
          player.group.position.y = newY;
        }
      }
    }
  }
  
  // Handle collision with objects in the world
  handleObjectCollision(player, originalPosition) {
    // Get player position in 2D (x, z) for collision testing
    const playerPos2D = new THREE.Vector2(player.position.x, player.position.z);
    
    // Early return if no object placer
    if (!this.worldGenerator.objectPlacer) return;
    
    const objectPlacer = this.worldGenerator.objectPlacer;
    
    // Check collisions in priority order
    const collisionResult = this.checkMegaRockCollisions(playerPos2D, objectPlacer) || 
                            this.checkBuildingCollisions(playerPos2D, objectPlacer) || 
                            this.checkApartmentCollisions(playerPos2D, objectPlacer) ||
                            this.checkWorldObjectCollisions(playerPos2D, objectPlacer);
    
    // Apply collision response if needed
    if (collisionResult) {
      this.applyCollisionResponse(player, originalPosition, collisionResult);
    }
  }

  // Check for collisions with mega rocks
  checkMegaRockCollisions(playerPos2D, objectPlacer) {
    const megaRockRadius = 1;
    
    for (const megaRockPos of objectPlacer.megaRockPositions) {
      const megaRockPos2D = new THREE.Vector2(megaRockPos.x, megaRockPos.z);
      const distance = playerPos2D.distanceTo(megaRockPos2D);
      
      if (distance < this.playerRadius + megaRockRadius) {
        // Calculate bounce direction (away from mega rock)
        const normal = new THREE.Vector2().subVectors(playerPos2D, megaRockPos2D).normalize();
        return { normal };
      }
    }
    
    return null;
  }
  
  // Check for collisions with buildings
  checkBuildingCollisions(playerPos2D, objectPlacer) {
    const buildingRadius = 1;
    
    for (const buildingPos of objectPlacer.buildingPositions) {
      const buildingPos2D = new THREE.Vector2(buildingPos.x, buildingPos.z);
      const distance = playerPos2D.distanceTo(buildingPos2D);
      
      if (distance < this.playerRadius + buildingRadius) {
        // Calculate bounce direction (away from building)
        const normal = new THREE.Vector2().subVectors(playerPos2D, buildingPos2D).normalize();
        return { normal };
      }
    }
    
    return null;
  }
  
  // Check for collisions with apartments
  checkApartmentCollisions(playerPos2D, objectPlacer) {
    const apartmentRadius = 1;
    
    for (const apartmentPos of objectPlacer.apartmentPositions) {
      const apartmentPos2D = new THREE.Vector2(apartmentPos.x, apartmentPos.z);
      const distance = playerPos2D.distanceTo(apartmentPos2D);
      
      if (distance < this.playerRadius + apartmentRadius) {
        // Calculate bounce direction (away from apartment)
        const normal = new THREE.Vector2().subVectors(playerPos2D, apartmentPos2D).normalize();
        return { normal };
      }
    }
    
    return null;
  }
  
  // Check for collisions with other world objects
  checkWorldObjectCollisions(playerPos2D, objectPlacer) {
    for (const [chunkKey, objects] of objectPlacer.objects) {
      for (const object of objects) {
        // Skip non-collidable objects or objects without position
        if (!object.position) continue;
        
        // Get collision radius based on object type
        const objectRadius = this.getObjectCollisionRadius(object);
        
        // Simple distance check
        const objectPos2D = new THREE.Vector2(object.position.x, object.position.z);
        const distance = playerPos2D.distanceTo(objectPos2D);
        
        if (distance < this.playerRadius + objectRadius) {
          // Calculate bounce direction (away from object)
          const normal = new THREE.Vector2().subVectors(playerPos2D, objectPos2D).normalize();
          return { normal };
        }
      }
    }
    
    return null;
  }
  
  // Determine collision radius based on object type
  getObjectCollisionRadius(object) {
    // If object has type metadata
    if (object.userData && object.userData.type) {
      switch (object.userData.type) {
        case 'tree': return 0.8;
        case 'rock': return 0.6;
        case 'bush': return 0.5;
        default: return 0.5;
      }
    } 
    
    // Try to guess based on size or children
    if (object.scale && object.scale.x > 1.5) {
      return 0.8; // Probably a tree
    }
    
    return 0.4; // Default size
  }
  
  // Apply collision response
  applyCollisionResponse(player, originalPosition, collisionResult) {
    const { normal } = collisionResult;
    const bounceDistance = this.bounceStrength;
    
    // Move player position away from collision along normal
    player.position.x = originalPosition.x + normal.x * bounceDistance;
    player.position.z = originalPosition.z + normal.y * bounceDistance;
    
    // Update mesh position for immediate visual feedback
    if (player.group && player.group.position) {
      player.group.position.x = player.position.x;
      player.group.position.z = player.position.z;
    }
  }
  
  // Register a world object for collision detection
  registerObjectCollider(object, radius) {
    if (!object.uuid) return;
    
    this.objectColliders.set(object.uuid, {
      object,
      radius: radius || 1.0
    });
  }
  
  // Remove an object collider
  removeObjectCollider(object) {
    if (!object.uuid) return;
    this.objectColliders.delete(object.uuid);
  }
  
  // Get terrain height at position
  getTerrainHeightAt(x, z) {
    // Get active chunks from WorldGenerator
    const chunks = this.worldGenerator.chunks;
    
    // Find the chunk that contains this position
    const chunkSize = this.worldGenerator.CHUNK_SIZE;
    const chunkX = Math.floor(x / chunkSize);
    const chunkZ = Math.floor(z / chunkSize);
    const chunkKey = `${chunkX},${chunkZ}`;
    
    // Get the chunk
    const chunk = chunks.get(chunkKey);
    
    // If chunk exists, get height
    if (chunk) {
      return chunk.getHeightAt(x, z);
    }
    
    // Try using initial chunk if main chunks aren't loaded yet
    if (this.worldGenerator.initialChunk) {
      return this.worldGenerator.initialChunk.getHeightAt(x, z);
    }
    
    // If no height found, return null
    return null;
  }
  
  // Check if the slope at position is too steep to climb
  isSlopeTooSteep(position) {
    // Sample points around the player to determine slope
    const sampleDistance = 0.5;
    
    // Get heights at sampled points
    const centerHeight = this.getTerrainHeightAt(position.x, position.z);
    
    // If no height data, assume not steep
    if (centerHeight === null) return false;
    
    // Get 4 heights around the player
    const northHeight = this.getTerrainHeightAt(position.x, position.z - sampleDistance);
    const southHeight = this.getTerrainHeightAt(position.x, position.z + sampleDistance);
    const eastHeight = this.getTerrainHeightAt(position.x + sampleDistance, position.z);
    const westHeight = this.getTerrainHeightAt(position.x - sampleDistance, position.z);
    
    // Calculate the steepest slope
    const slopes = [];
    
    if (northHeight !== null) {
      const slopeNorth = Math.abs(Math.atan((northHeight - centerHeight) / sampleDistance));
      slopes.push(slopeNorth);
    }
    
    if (southHeight !== null) {
      const slopeSouth = Math.abs(Math.atan((southHeight - centerHeight) / sampleDistance));
      slopes.push(slopeSouth);
    }
    
    if (eastHeight !== null) {
      const slopeEast = Math.abs(Math.atan((eastHeight - centerHeight) / sampleDistance));
      slopes.push(slopeEast);
    }
    
    if (westHeight !== null) {
      const slopeWest = Math.abs(Math.atan((westHeight - centerHeight) / sampleDistance));
      slopes.push(slopeWest);
    }
    
    // If no valid slopes, assume not steep
    if (slopes.length === 0) return false;
    
    // Get the maximum slope
    const maxSlope = Math.max(...slopes);
    
    // Return true if steeper than max climb angle
    return maxSlope > this.maxClimbAngleRadians;
  }
} 