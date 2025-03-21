import * as THREE from 'three';

export class LowPolyApartment {
  constructor() {
    // Pre-create building parts for better performance
    this.createApartmentParts();
  }
  
  // Create common building parts
  createApartmentParts() {
    // Different apartment base shapes
    this.baseGeometries = [
      // Wide rectangular apartment
      new THREE.BoxGeometry(10, 8, 6),
      // Tower apartment
      new THREE.BoxGeometry(6, 12, 6),
      // L-shaped apartment
      this.createLShapedGeometry(8, 6, 8, 4),
    ];
    
    // Roof types
    this.roofGeometries = [
      // Flat roof for wide apartment
      new THREE.BoxGeometry(10, 0.5, 6),
      // Tower roof
      new THREE.BoxGeometry(6, 0.5, 6),
      // L-shaped roof
      this.createLShapedGeometry(8, 0.5, 8, 0.5)
    ];
  }
  
  // Create an L-shaped geometry
  createLShapedGeometry(width, height, depth, cutout) {
    const geometry = new THREE.BufferGeometry();
    
    // Define vertices for L-shape
    const vertices = [
      // Bottom face
      -width/2, 0, -depth/2,
      width/2, 0, -depth/2,
      width/2, 0, depth/2-cutout,
      cutout-width/2, 0, depth/2-cutout,
      cutout-width/2, 0, depth/2,
      -width/2, 0, depth/2,
      
      // Top face
      -width/2, height, -depth/2,
      width/2, height, -depth/2,
      width/2, height, depth/2-cutout,
      cutout-width/2, height, depth/2-cutout,
      cutout-width/2, height, depth/2,
      -width/2, height, depth/2
    ];
    
    // Create triangles
    const indices = [
      // Bottom face
      0, 1, 2,
      0, 2, 3,
      0, 3, 5,
      3, 4, 5,
      
      // Top face
      6, 8, 7,
      6, 9, 8,
      6, 11, 9,
      9, 11, 10,
      
      // Front faces
      0, 6, 7,
      0, 7, 1,
      1, 7, 8,
      1, 8, 2,
      2, 8, 9,
      2, 9, 3,
      3, 9, 10,
      3, 10, 4,
      4, 10, 11,
      4, 11, 5,
      5, 11, 6,
      5, 6, 0
    ];
    
    const vertexArray = new Float32Array(vertices);
    geometry.setAttribute('position', new THREE.BufferAttribute(vertexArray, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    
    return geometry;
  }
  
  create(x, y, z) {
    // Create a group for the apartment building
    const apartment = new THREE.Group();
    
    // Select building style
    const buildingType = Math.floor(Math.random() * 3);
    
    // Create the main building structure
    const baseGeometry = this.baseGeometries[buildingType].clone();
    
    // Building colors - more urban than village buildings
    const buildingColors = [
      0x8c8c8c, // Gray concrete
      0xa8a8a8, // Light gray
      0x6d6d6d  // Dark gray
    ];
    
    // Select random color from the palette
    const colorIndex = Math.floor(Math.random() * buildingColors.length);
    const buildingColor = new THREE.Color(buildingColors[colorIndex]);
    
    // Slightly randomize color
    buildingColor.r += (Math.random() - 0.5) * 0.05;
    buildingColor.g += (Math.random() - 0.5) * 0.05;
    buildingColor.b += (Math.random() - 0.5) * 0.05;
    
    // Create material
    const buildingMaterial = new THREE.MeshStandardMaterial({
      color: buildingColor,
      flatShading: true,
      roughness: 0.8,
    });
    
    // Create building mesh
    const baseStructure = new THREE.Mesh(baseGeometry, buildingMaterial);
    baseStructure.castShadow = true;
    baseStructure.receiveShadow = true;
    
    // Position based on building type
    let yOffset = 0;
    switch (buildingType) {
      case 0: // Wide rectangular
        yOffset = 4;
        break;
      case 1: // Tower
        yOffset = 6;
        break;
      case 2: // L-shaped
        yOffset = 3;
        break;
    }
    
    baseStructure.position.y = yOffset;
    apartment.add(baseStructure);
    
    // Add roof
    const roofGeometry = this.roofGeometries[buildingType].clone();
    const roofColor = new THREE.Color(0x333333); // Dark gray roof
    
    const roofMaterial = new THREE.MeshStandardMaterial({
      color: roofColor,
      flatShading: true,
      roughness: 0.7,
    });
    
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.castShadow = true;
    
    // Position roof on top of building
    switch (buildingType) {
      case 0: // Wide rectangular
        roof.position.y = 8.25;
        break;
      case 1: // Tower
        roof.position.y = 12.25;
        break;
      case 2: // L-shaped
        roof.position.y = 6.25;
        break;
    }
    
    apartment.add(roof);
    
    // Add windows in a grid pattern
    this.addWindowGrid(apartment, buildingType);
    
    // Add entrance
    this.addEntrance(apartment, buildingType);
    
    // Position apartment in world
    apartment.position.set(x, y, z);
    
    // Random rotation (4 cardinal directions)
    apartment.rotation.y = Math.PI * 0.5 * Math.floor(Math.random() * 4);
    
    return apartment;
  }
  
  // Add grid of windows
  addWindowGrid(apartment, buildingType) {
    // Window material
    const windowMaterial = new THREE.MeshStandardMaterial({
      color: 0x6a8fc2, // Blue-ish window color
      emissive: 0x101921,
      roughness: 0.4,
      metalness: 0.5,
      flatShading: false,
    });
    
    // Night time window material (random windows lit)
    const litWindowMaterial = new THREE.MeshStandardMaterial({
      color: 0xffd992,
      emissive: 0xffd992,
      emissiveIntensity: 0.5,
      roughness: 0.4,
      metalness: 0.3,
      flatShading: false,
    });
    
    const windowGeometry = new THREE.PlaneGeometry(0.7, 1);
    
    // Different window layouts for each building type
    let rows, cols, startY, spacing, faceSizes;
    
    switch (buildingType) {
      case 0: // Wide rectangular
        rows = 3;
        cols = [4, 4, 4, 4]; // [front, right, back, left]
        startY = 2;
        spacing = 2;
        faceSizes = [10, 6, 10, 6]; // width of each face
        break;
      case 1: // Tower
        rows = 5;
        cols = [3, 3, 3, 3];
        startY = 2;
        spacing = 2;
        faceSizes = [6, 6, 6, 6];
        break;
      case 2: // L-shaped
        rows = 2;
        cols = [4, 4, 2, 4]; // L-shape has different window counts
        startY = 2;
        spacing = 2;
        faceSizes = [8, 8, 4, 8];
        break;
      default:
        rows = 3;
        cols = [3, 3, 3, 3];
        startY = 2;
        spacing = 2;
        faceSizes = [6, 6, 6, 6];
    }
    
    // For each face of the building
    for (let face = 0; face < 4; face++) {
      const faceWidth = faceSizes[face];
      const numWindows = cols[face];
      const windowSpacing = faceWidth / (numWindows + 1);
      
      // Calculate rotation and offset for this face
      const rotation = face * Math.PI / 2;
      const offsetX = face === 1 ? faceWidth/2 : (face === 3 ? -faceWidth/2 : 0);
      const offsetZ = face === 0 ? faceWidth/2 : (face === 2 ? -faceWidth/2 : 0);
      
      // Create window grid
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < numWindows; col++) {
          // Skip some windows for variety in L-shape
          if (buildingType === 2 && face === 2 && col >= 2) continue;
          
          // Position within grid
          const x = (col + 1) * windowSpacing - faceWidth/2;
          const y = startY + row * spacing;
          
          // Position on building face
          let wx = Math.cos(rotation) * x + offsetX;
          let wz = Math.sin(rotation) * x + offsetZ;
          
          // Adjust L-shape windows
          if (buildingType === 2 && face === 2 && row >= 0) {
            wx += 2;
          }
          
          // Create window with random chance to be lit
          const useLight = Math.random() > 0.7;
          const material = useLight ? litWindowMaterial : windowMaterial;
          const window = new THREE.Mesh(windowGeometry, material);
          
          // Position and rotate window
          window.position.set(wx, y, wz);
          window.rotation.y = rotation;
          
          // Move slightly away from wall to avoid z-fighting
          window.position.x += Math.cos(rotation) * 0.01;
          window.position.z += Math.sin(rotation) * 0.01;
          
          apartment.add(window);
        }
      }
    }
  }
  
  // Add entrance to the building
  addEntrance(apartment, buildingType) {
    // Door geometry and material
    const doorWidth = 2;
    const doorHeight = 2.5;
    
    const doorGeometry = new THREE.PlaneGeometry(doorWidth, doorHeight);
    const doorMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      side: THREE.DoubleSide,
      roughness: 0.7,
    });
    
    // Create door
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    
    // Position door based on building type
    switch (buildingType) {
      case 0: // Wide rectangular
        door.position.set(0, 1.25, 3.01);
        break;
      case 1: // Tower
        door.position.set(0, 1.25, 3.01);
        break;
      case 2: // L-shaped
        door.position.set(-2, 1.25, 4.01);
        break;
    }
    
    apartment.add(door);
    
    // Add steps/entrance platform
    const stepGeometry = new THREE.BoxGeometry(doorWidth + 1, 0.2, 1);
    const stepMaterial = new THREE.MeshStandardMaterial({
      color: 0x555555,
      flatShading: true,
    });
    
    const step = new THREE.Mesh(stepGeometry, stepMaterial);
    step.position.set(door.position.x, 0.1, door.position.z - 0.6);
    apartment.add(step);
  }
} 