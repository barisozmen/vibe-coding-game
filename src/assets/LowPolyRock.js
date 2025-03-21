import * as THREE from 'three';

export class LowPolyRock {
  constructor() {
    // Pre-create several rock geometries for variety
    this.rockGeometries = [
      new THREE.IcosahedronGeometry(0.5, 0),
      new THREE.DodecahedronGeometry(0.6, 0),
      new THREE.OctahedronGeometry(0.5, 0),
      new THREE.TetrahedronGeometry(0.6, 0)
    ];
    
    // Randomize vertices slightly for each geometry to make more irregular rocks
    this.rockGeometries.forEach(geometry => {
      const positionAttribute = geometry.getAttribute('position');
      const vertex = new THREE.Vector3();
      
      for (let i = 0; i < positionAttribute.count; i++) {
        vertex.fromBufferAttribute(positionAttribute, i);
        
        // Add random variation to each vertex
        vertex.x += (Math.random() - 0.5) * 0.2;
        vertex.y += (Math.random() - 0.5) * 0.2;
        vertex.z += (Math.random() - 0.5) * 0.2;
        
        positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
      }
      
      geometry.computeVertexNormals();
    });
  }
  
  create(x, y, z) {
    // Select random rock geometry
    const geometryIndex = Math.floor(Math.random() * this.rockGeometries.length);
    const geometry = this.rockGeometries[geometryIndex].clone();
    
    // Random grey color
    const brightness = 0.2 + Math.random() * 0.15;
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(0.1, 0.05, brightness),
      flatShading: true,
      roughness: 0.8 + Math.random() * 0.2,
    });
    
    // Create rock mesh
    const rock = new THREE.Mesh(geometry, material);
    rock.castShadow = true;
    rock.receiveShadow = true;
    
    // Position rock in world
    rock.position.set(x, y - 0.3, z); // Slightly sink into ground
    
    // Random rotation and scale
    rock.rotation.x = Math.random() * Math.PI;
    rock.rotation.y = Math.random() * Math.PI;
    rock.rotation.z = Math.random() * Math.PI;
    
    const scale = 0.5 + Math.random() * 0.7;
    rock.scale.set(scale, scale * 0.8, scale);
    
    return rock;
  }
} 