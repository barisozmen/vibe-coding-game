import * as THREE from 'three';

export class LowPolyBuilding {
  constructor() {
    // Pre-create common building parts
    this.createBuildingParts();
  }
  
  // Create common building parts
  createBuildingParts() {
    // House base shapes with different footprints
    this.baseGeometries = [
      // Square house
      new THREE.BoxGeometry(3, 2, 3),
      // Rectangular house
      new THREE.BoxGeometry(4, 2, 2.5),
      // Small house
      new THREE.BoxGeometry(2, 1.5, 2)
    ];
    
    // Roof types
    this.roofGeometries = [
      // Pyramid roof
      this.createPyramidRoof(3, 3, 1.5),
      // Rectangular pyramid roof
      this.createPyramidRoof(4, 2.5, 1.5),
      // Small pyramid roof
      this.createPyramidRoof(2, 2, 1)
    ];
  }
  
  // Create a pyramid-shaped roof
  createPyramidRoof(width, depth, height) {
    const geometry = new THREE.BufferGeometry();
    
    // Define the vertices for a pyramid
    const halfWidth = width / 2;
    const halfDepth = depth / 2;
    
    // Define vertices
    const vertices = new Float32Array([
      // Base
      -halfWidth, 0, -halfDepth,
      halfWidth, 0, -halfDepth,
      halfWidth, 0, halfDepth,
      -halfWidth, 0, halfDepth,
      // Top
      0, height, 0
    ]);
    
    // Define faces as triangles
    const indices = [
      // Base (optional, usually not visible)
      0, 1, 2,
      0, 2, 3,
      // Sides
      0, 4, 1,
      1, 4, 2,
      2, 4, 3,
      3, 4, 0
    ];
    
    // Set attributes
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    
    return geometry;
  }
  
  create(x, y, z) {
    // Create a group for the building
    const building = new THREE.Group();
    
    // Select building style based on pseudo-random choice
    const buildingType = Math.floor(Math.random() * 3);
    
    // Create the main building structure
    const baseGeometry = this.baseGeometries[buildingType].clone();
    
    // Building color based on building type
    let buildingColor;
    
    switch (buildingType) {
      case 0: // Stone cottage
        buildingColor = new THREE.Color(0xd1c0a5);
        break;
      case 1: // Wooden house
        buildingColor = new THREE.Color(0x8a613a);
        break;
      case 2: // Small hut
        buildingColor = new THREE.Color(0xa87e43);
        break;
      default:
        buildingColor = new THREE.Color(0xd1c0a5);
    }
    
    // Slightly randomize color
    buildingColor.r += (Math.random() - 0.5) * 0.1;
    buildingColor.g += (Math.random() - 0.5) * 0.1;
    buildingColor.b += (Math.random() - 0.5) * 0.1;
    
    // Create material
    const buildingMaterial = new THREE.MeshStandardMaterial({
      color: buildingColor,
      flatShading: true,
      roughness: 0.9,
    });
    
    // Create building mesh
    const baseStructure = new THREE.Mesh(baseGeometry, buildingMaterial);
    baseStructure.castShadow = true;
    baseStructure.receiveShadow = true;
    baseStructure.position.y = 1; // Half height to place on ground
    building.add(baseStructure);
    
    // Add roof
    const roofGeometry = this.roofGeometries[buildingType].clone();
    const roofColor = new THREE.Color(0x653b19); // Dark brown for roof
    
    const roofMaterial = new THREE.MeshStandardMaterial({
      color: roofColor,
      flatShading: true,
      roughness: 0.7,
    });
    
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.castShadow = true;
    roof.position.y = 2; // Place on top of the building
    building.add(roof);
    
    // Add simple door
    this.addDoor(building, buildingType);
    
    // Add windows
    this.addWindows(building, buildingType);
    
    // Position building in world
    building.position.set(x, y, z);
    
    // Random rotation
    building.rotation.y = Math.PI * 0.5 * Math.floor(Math.random() * 4);
    
    return building;
  }
  
  // Add a door to the building
  addDoor(building, buildingType) {
    let doorWidth, doorHeight, doorX, doorY, doorZ;
    
    switch (buildingType) {
      case 0: // Square house
        doorWidth = 0.8;
        doorHeight = 1.2;
        doorX = 0;
        doorY = 0.6;
        doorZ = 1.51; // Slightly offset to avoid z-fighting
        break;
      case 1: // Rectangular house
        doorWidth = 0.8;
        doorHeight = 1.2;
        doorX = -1;
        doorY = 0.6;
        doorZ = 1.26; 
        break;
      case 2: // Small house
        doorWidth = 0.6;
        doorHeight = 1;
        doorX = 0;
        doorY = 0.5;
        doorZ = 1.01;
        break;
      default:
        doorWidth = 0.8;
        doorHeight = 1.2;
        doorX = 0;
        doorY = 0.6;
        doorZ = 1.51;
    }
    
    const doorGeometry = new THREE.PlaneGeometry(doorWidth, doorHeight);
    const doorMaterial = new THREE.MeshStandardMaterial({
      color: 0x4d2b14, // Dark wood color
      side: THREE.DoubleSide,
      roughness: 0.9,
    });
    
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(doorX, doorY, doorZ);
    building.add(door);
  }
  
  // Add windows to the building
  addWindows(building, buildingType) {
    const windowMaterial = new THREE.MeshStandardMaterial({
      color: 0xfff5e0, // Warm light color
      emissive: 0x333333,
      side: THREE.DoubleSide,
      roughness: 0.5,
    });
    
    let windowPositions = [];
    let windowSize = 0.5;
    
    switch (buildingType) {
      case 0: // Square house - windows on each side
        windowPositions = [
          { x: 1.51, y: 1.2, z: 0, rotY: Math.PI * 0.5 },
          { x: -1.51, y: 1.2, z: 0, rotY: Math.PI * 0.5 },
          { x: 0, y: 1.2, z: -1.51, rotY: 0 }
        ];
        break;
      case 1: // Rectangular house - windows on long sides
        windowPositions = [
          { x: 2.01, y: 1.2, z: 0, rotY: Math.PI * 0.5 },
          { x: -2.01, y: 1.2, z: 0, rotY: Math.PI * 0.5 },
          { x: 0, y: 1.2, z: -1.26, rotY: 0 }
        ];
        break;
      case 2: // Small house - just one window
        windowPositions = [
          { x: 1.01, y: 0.9, z: 0, rotY: Math.PI * 0.5 }
        ];
        windowSize = 0.4;
        break;
      default:
        windowPositions = [
          { x: 1.51, y: 1.2, z: 0, rotY: Math.PI * 0.5 },
          { x: -1.51, y: 1.2, z: 0, rotY: Math.PI * 0.5 }
        ];
    }
    
    const windowGeometry = new THREE.PlaneGeometry(windowSize, windowSize);
    
    windowPositions.forEach(pos => {
      const window = new THREE.Mesh(windowGeometry, windowMaterial);
      window.position.set(pos.x, pos.y, pos.z);
      window.rotation.y = pos.rotY;
      building.add(window);
    });
  }
} 