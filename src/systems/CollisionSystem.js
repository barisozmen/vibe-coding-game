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
  }
  
  // Update player position based on terrain
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