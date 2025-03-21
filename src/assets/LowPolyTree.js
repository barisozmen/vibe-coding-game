import * as THREE from 'three';

export class LowPolyTree {
  constructor() {
    // Pre-create geometries for better performance
    this.trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, 1.5, 5, 1, false);
    this.trunkGeometry.translate(0, 0.75, 0); // Center trunk vertically
    
    // Several leaf types for variety
    this.leafGeometries = [
      // Pine tree
      new THREE.ConeGeometry(1, 3, 6, 1, false),
      // Rounded tree
      new THREE.IcosahedronGeometry(1.2, 0),
      // Minimal low-poly tree
      new THREE.TetrahedronGeometry(1.5, 0)
    ];
  }
  
  create(x, y, z) {
    // Create a group for the tree
    const tree = new THREE.Group();
    
    // Random variation in color
    const greenHue = 0.25 + Math.random() * 0.1;
    const greenSaturation = 0.5 + Math.random() * 0.3;
    
    // Create trunk
    const trunkMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(0.1, 0.5, 0.3 + Math.random() * 0.1),
      flatShading: true,
      roughness: 0.9,
    });
    
    const trunk = new THREE.Mesh(this.trunkGeometry, trunkMaterial);
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    tree.add(trunk);
    
    // Select random leaf geometry
    const leafType = Math.floor(Math.random() * this.leafGeometries.length);
    const leafGeometry = this.leafGeometries[leafType].clone();
    
    // Position leaves on top of trunk
    leafGeometry.translate(0, 2.5, 0);
    
    // Create leaves
    const leafMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(greenHue, greenSaturation, 0.3 + Math.random() * 0.1),
      flatShading: true,
      roughness: 0.8,
    });
    
    const leaves = new THREE.Mesh(leafGeometry, leafMaterial);
    leaves.castShadow = true;
    leaves.receiveShadow = true;
    tree.add(leaves);
    
    // Position tree in world
    tree.position.set(x, y, z);
    
    // Random rotation for variety
    tree.rotation.y = Math.random() * Math.PI * 2;
    
    return tree;
  }
} 