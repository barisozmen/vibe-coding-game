import * as THREE from 'three';

export class LowPolyRoad {
  constructor() {
    // Pre-create common road parts
    this.createRoadParts();
    
    // Create road materials
    this.roadMaterial = new THREE.MeshStandardMaterial({
      color: 0x555555, // Dark gray asphalt
      roughness: 0.9,
      flatShading: false
    });
    
    // Create road markings material
    this.markingsMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide
    });
  }
  
  // Create common road parts
  createRoadParts() {
    // Road segment geometry (straight piece)
    this.roadGeometry = new THREE.PlaneGeometry(4, 16, 2, 4);
    this.roadGeometry.rotateX(-Math.PI / 2); // Lay flat
    
    // Intersection geometry (crossroads)
    this.intersectionGeometry = new THREE.PlaneGeometry(12, 12, 4, 4);
    this.intersectionGeometry.rotateX(-Math.PI / 2); // Lay flat
    
    // Curved road segment - create geometry only
    this.curvedRoadGeometry = this.createCurvedRoadGeometry();
    
    // T-junction - create geometry only
    this.tJunctionGeometry = this.createTJunctionGeometry();
  }
  
  // Create a curved road geometry
  createCurvedRoadGeometry() {
    // Create a custom geometry for curved road
    const geometry = new THREE.BufferGeometry();
    const radius = 6; // Radius of the curve
    const width = 4;   // Width of the road
    const segments = 8; // Number of segments in the curve
    
    const vertices = [];
    const indices = [];
    
    // Create a quarter-circle curve
    for (let i = 0; i <= segments; i++) {
      const angle = (Math.PI / 2) * (i / segments);
      const cosAngle = Math.cos(angle);
      const sinAngle = Math.sin(angle);
      
      // Outer edge
      vertices.push(
        radius * cosAngle,
        0,
        radius * sinAngle
      );
      
      // Inner edge
      vertices.push(
        (radius - width) * cosAngle,
        0,
        (radius - width) * sinAngle
      );
      
      // Create faces (triangles)
      if (i < segments) {
        const v = i * 2;
        indices.push(
          v, v + 1, v + 2,
          v + 1, v + 3, v + 2
        );
      }
    }
    
    const vertexArray = new Float32Array(vertices);
    geometry.setAttribute('position', new THREE.BufferAttribute(vertexArray, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    
    return geometry;
  }
  
  // Create a T-junction geometry
  createTJunctionGeometry() {
    const geometry = new THREE.BufferGeometry();
    
    // Define vertices for T shape (top view)
    const halfWidth = 6;
    const halfLength = 6;
    const roadWidth = 4;
    
    const vertices = [
      // Main horizontal road (top edge)
      -halfWidth, 0, -roadWidth/2,
      halfWidth, 0, -roadWidth/2,
      
      // Main horizontal road (bottom edge)
      -halfWidth, 0, roadWidth/2,
      halfWidth, 0, roadWidth/2,
      
      // Vertical road (top edges)
      -roadWidth/2, 0, roadWidth/2,
      roadWidth/2, 0, roadWidth/2,
      
      // Vertical road (bottom edges)
      -roadWidth/2, 0, halfLength,
      roadWidth/2, 0, halfLength
    ];
    
    // Create triangles
    const indices = [
      // Horizontal road
      0, 1, 3,
      0, 3, 2,
      
      // Vertical road
      4, 5, 7,
      4, 7, 6
    ];
    
    const vertexArray = new Float32Array(vertices);
    geometry.setAttribute('position', new THREE.BufferAttribute(vertexArray, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    
    return geometry;
  }
  
  // Create a straight road segment at location
  createStraight(x, y, z, rotation = 0) {
    // Create a new road mesh using the straight road geometry
    const road = new THREE.Mesh(
      this.roadGeometry, 
      this.roadMaterial
    );
    
    // Position and rotate
    road.position.set(x, y + 0.05, z);
    road.rotation.y = rotation;
    road.receiveShadow = true;
    
    // Add road markings
    const markings = this.createStraightRoadMarkings();
    markings.rotation.y = rotation;
    road.add(markings);
    
    return road;
  }
  
  // Create a curved road segment at location
  createCurve(x, y, z, rotation = 0) {
    // Create a new road mesh using the curved road geometry
    const road = new THREE.Mesh(
      this.curvedRoadGeometry, 
      this.roadMaterial
    );
    
    // Position and rotate
    road.position.set(x, y + 0.05, z);
    road.rotation.y = rotation;
    road.receiveShadow = true;
    
    // Add road markings
    const markings = this.createCurvedRoadMarkings();
    road.add(markings);
    
    return road;
  }
  
  // Create an intersection (crossroads) at location
  createIntersection(x, y, z) {
    // Create a new road mesh using the intersection geometry
    const road = new THREE.Mesh(
      this.intersectionGeometry, 
      this.roadMaterial
    );
    
    // Position
    road.position.set(x, y + 0.05, z);
    road.receiveShadow = true;
    
    // Add road markings
    const markings = this.createIntersectionMarkings();
    road.add(markings);
    
    return road;
  }
  
  // Create a T-junction at location
  createTJunction(x, y, z, rotation = 0) {
    // Create a new road mesh using the T-junction geometry
    const road = new THREE.Mesh(
      this.tJunctionGeometry, 
      this.roadMaterial
    );
    
    // Position and rotate
    road.position.set(x, y + 0.05, z);
    road.rotation.y = rotation;
    road.receiveShadow = true;
    
    // Add road markings
    const markings = this.createTJunctionMarkings();
    road.add(markings);
    
    return road;
  }
  
  // Create straight road markings
  createStraightRoadMarkings() {
    const markingsGroup = new THREE.Group();
    
    // Simple straight road with center line
    const lineGeometry = new THREE.PlaneGeometry(0.2, 14);
    lineGeometry.rotateX(-Math.PI / 2);
    
    const line = new THREE.Mesh(lineGeometry, this.markingsMaterial);
    line.position.y = 0.01; // Slightly above the road
    markingsGroup.add(line);
    
    return markingsGroup;
  }
  
  // Create intersection markings
  createIntersectionMarkings() {
    const markingsGroup = new THREE.Group();
    
    // Horizontal line
    const hLineGeometry = new THREE.PlaneGeometry(10, 0.2);
    hLineGeometry.rotateX(-Math.PI / 2);
    
    const hLine = new THREE.Mesh(hLineGeometry, this.markingsMaterial);
    hLine.position.y = 0.01;
    markingsGroup.add(hLine);
    
    // Vertical line
    const vLineGeometry = new THREE.PlaneGeometry(0.2, 10);
    vLineGeometry.rotateX(-Math.PI / 2);
    
    const vLine = new THREE.Mesh(vLineGeometry, this.markingsMaterial);
    vLine.position.y = 0.01;
    markingsGroup.add(vLine);
    
    return markingsGroup;
  }
  
  // Create markings for curved roads
  createCurvedRoadMarkings() {
    const markingsGroup = new THREE.Group();
    
    // Create a curved line following the road center
    const curve = new THREE.EllipseCurve(
      0, 0,            // Center
      4, 4,            // X and Y radius
      0, Math.PI/2,    // Start and end angle
      false,           // Clockwise
      0                // Rotation
    );
    
    const points = curve.getPoints(8);
    const curveGeometry = new THREE.BufferGeometry().setFromPoints(points);
    
    // Create a thin plane along the curve
    const line = new THREE.Line(curveGeometry, this.markingsMaterial);
    line.position.y = 0.01;
    markingsGroup.add(line);
    
    return markingsGroup;
  }
  
  // Create markings for T-junctions
  createTJunctionMarkings() {
    const markingsGroup = new THREE.Group();
    
    // Horizontal line
    const hLineGeometry = new THREE.PlaneGeometry(10, 0.2);
    hLineGeometry.rotateX(-Math.PI / 2);
    
    const hLine = new THREE.Mesh(hLineGeometry, this.markingsMaterial);
    hLine.position.y = 0.01;
    markingsGroup.add(hLine);
    
    // Vertical line (only the bottom half)
    const vLineGeometry = new THREE.PlaneGeometry(0.2, 5);
    vLineGeometry.rotateX(-Math.PI / 2);
    
    const vLine = new THREE.Mesh(vLineGeometry, this.markingsMaterial);
    vLine.position.set(0, 0.01, 2.5);
    markingsGroup.add(vLine);
    
    return markingsGroup;
  }
  
  // Create road texture
  createRoadTexture() {
    // Create a simple procedural road texture
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    
    // Fill with base color
    context.fillStyle = '#555555';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add noise grains for asphalt texture
    context.fillStyle = '#505050';
    for (let i = 0; i < 5000; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const size = Math.random() * 2;
      context.fillRect(x, y, size, size);
    }
    
    // Create texture
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 4);
    
    return texture;
  }
  
  // Create road networks between positions
  createRoadNetwork(scene, positions, y = 0) {
    // Logic to determine road placement between positions
    // For now, we'll implement a simple grid pattern
    
    // Create roads between positions
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        // Get positions
        const posA = positions[i];
        const posB = positions[j];
        
        // Calculate distance
        const dx = posB.x - posA.x;
        const dz = posB.z - posA.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        // If distance is reasonable, create a road
        if (distance < 100) {
          this.createRoadBetweenPoints(scene, posA, posB, y);
        }
      }
    }
  }
  
  // Create road segments between two points
  createRoadBetweenPoints(scene, pointA, pointB, y = 0) {
    // Calculate direction and distance
    const dx = pointB.x - pointA.x;
    const dz = pointB.z - pointA.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    const angle = Math.atan2(dz, dx);
    
    // Segment size
    const segmentLength = 16;
    const numSegments = Math.ceil(distance / segmentLength);
    
    // Create segments
    for (let i = 0; i < numSegments; i++) {
      const ratio = i / numSegments;
      const x = pointA.x + dx * ratio;
      const z = pointA.z + dz * ratio;
      
      // Create a road segment
      const road = this.createStraight(x, y, z, angle);
      scene.add(road);
    }
  }
} 