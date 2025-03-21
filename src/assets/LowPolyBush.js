import * as THREE from 'three';

export class LowPolyBush {
  constructor() {
    // Bush geometries for variety
    this.bushGeometries = [
      new THREE.IcosahedronGeometry(0.5, 0),
      new THREE.DodecahedronGeometry(0.5, 0),
      new THREE.SphereGeometry(0.6, 4, 3)
    ];
    
    // Deform geometries for a more natural look
    this.bushGeometries.forEach(geometry => {
      const positionAttribute = geometry.getAttribute('position');
      const vertex = new THREE.Vector3();
      
      for (let i = 0; i < positionAttribute.count; i++) {
        vertex.fromBufferAttribute(positionAttribute, i);
        
        // Add more random variation to make bushes look fluffy
        vertex.x += (Math.random() - 0.5) * 0.3;
        vertex.y *= 0.8 + Math.random() * 0.4; // Slightly squash vertically
        vertex.z += (Math.random() - 0.5) * 0.3;
        
        positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
      }
      
      geometry.computeVertexNormals();
    });
  }
  
  create(x, y, z) {
    // Create a group for the bush (may contain multiple parts)
    const bush = new THREE.Group();
    
    // Select random geometry
    const geometryIndex = Math.floor(Math.random() * this.bushGeometries.length);
    const geometry = this.bushGeometries[geometryIndex].clone();
    
    // Random green color, more varied than trees
    const hue = 0.25 + (Math.random() - 0.5) * 0.15; // Green with some variation
    const saturation = 0.4 + Math.random() * 0.3;
    const lightness = 0.25 + Math.random() * 0.15;
    
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(hue, saturation, lightness),
      flatShading: true,
      roughness: 0.9,
    });
    
    // Create main bush mesh
    const mainBush = new THREE.Mesh(geometry, material);
    mainBush.castShadow = true;
    mainBush.receiveShadow = true;
    mainBush.position.y = 0.3; // Slightly raise above ground
    bush.add(mainBush);
    
    // Sometimes add a secondary smaller bush part
    if (Math.random() > 0.5) {
      const secondaryGeometry = this.bushGeometries[
        Math.floor(Math.random() * this.bushGeometries.length)
      ].clone();
      
      const secondaryMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(hue, saturation, lightness * 0.9),
        flatShading: true,
        roughness: 0.9,
      });
      
      const secondaryBush = new THREE.Mesh(secondaryGeometry, secondaryMaterial);
      secondaryBush.castShadow = true;
      secondaryBush.receiveShadow = true;
      secondaryBush.scale.set(0.7, 0.7, 0.7);
      secondaryBush.position.set(
        (Math.random() - 0.5) * 0.5,
        0.2,
        (Math.random() - 0.5) * 0.5
      );
      
      bush.add(secondaryBush);
    }
    
    // Position bush in world
    bush.position.set(x, y, z);
    
    // Random rotation
    bush.rotation.y = Math.random() * Math.PI * 2;
    
    return bush;
  }
} 