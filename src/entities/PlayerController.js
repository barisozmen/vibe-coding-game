import * as THREE from 'three';

export class PlayerController {
  constructor(scene, camera, controls) {
    this.scene = scene;
    this.camera = camera;
    this.controls = controls;
    
    // Player properties
    this.position = new THREE.Vector3(0, 0, 0);
    this.moveSpeed = 0.5;
    this.rotationSpeed = 0.05;
    
    // Player mesh (temporary for development)
    this.createPlayerMesh();
    
    // Movement state
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    
    // Set up keyboard controls
    this.setupKeyboardControls();
  }
  
  // Create a low-poly human mesh for the player
  createPlayerMesh() {
    // Create a group to hold all body parts
    this.group = new THREE.Group();
    
    // Body color and material
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x3366ff, // Blue clothing
      roughness: 0.7,
    });
    
    const skinMaterial = new THREE.MeshStandardMaterial({
      color: 0xffcc99, // Skin tone
      roughness: 0.5,
    });
    
    // Head (sphere)
    const headGeometry = new THREE.SphereGeometry(0.25, 8, 6);
    const head = new THREE.Mesh(headGeometry, skinMaterial);
    head.position.y = 1.7;
    head.castShadow = true;
    
    // Torso (box)
    const torsoGeometry = new THREE.BoxGeometry(0.6, 0.7, 0.3);
    const torso = new THREE.Mesh(torsoGeometry, bodyMaterial);
    torso.position.y = 1.2;
    torso.castShadow = true;
    
    // Left arm
    const armGeometry = new THREE.BoxGeometry(0.15, 0.6, 0.15);
    const leftArm = new THREE.Mesh(armGeometry, bodyMaterial);
    leftArm.position.set(0.375, 1.15, 0);
    leftArm.castShadow = true;
    
    // Right arm
    const rightArm = new THREE.Mesh(armGeometry, bodyMaterial);
    rightArm.position.set(-0.375, 1.15, 0);
    rightArm.castShadow = true;
    
    // Left leg
    const legGeometry = new THREE.BoxGeometry(0.2, 0.7, 0.2);
    const leftLeg = new THREE.Mesh(legGeometry, bodyMaterial);
    leftLeg.position.set(0.2, 0.35, 0);
    leftLeg.castShadow = true;
    
    // Right leg
    const rightLeg = new THREE.Mesh(legGeometry, bodyMaterial);
    rightLeg.position.set(-0.2, 0.35, 0);
    rightLeg.castShadow = true;
    
    // Add all body parts to the group
    this.group.add(head);
    this.group.add(torso);
    this.group.add(leftArm);
    this.group.add(rightArm);
    this.group.add(leftLeg);
    this.group.add(rightLeg);
    
    // Add to scene
    this.scene.add(this.group);
    
    // Store the position for easy reference
    this.mesh = this.group; // For compatibility with existing code
  }
  
  // Set up keyboard controls
  setupKeyboardControls() {
    document.addEventListener('keydown', (event) => {
      switch (event.code) {
        case 'KeyW':
          this.moveForward = true;
          break;
        case 'KeyS':
          this.moveBackward = true;
          break;
        case 'KeyA':
          this.moveLeft = true;
          break;
        case 'KeyD':
          this.moveRight = true;
          break;
      }
    });
    
    document.addEventListener('keyup', (event) => {
      switch (event.code) {
        case 'KeyW':
          this.moveForward = false;
          break;
        case 'KeyS':
          this.moveBackward = false;
          break;
        case 'KeyA':
          this.moveLeft = false;
          break;
        case 'KeyD':
          this.moveRight = false;
          break;
      }
    });
  }
  
  // Update player position and camera
  update() {
    // Store original position
    const originalPosition = this.position.clone();
    
    // Calculate movement direction
    const moveX = (this.moveRight ? 1 : 0) - (this.moveLeft ? 1 : 0);
    const moveZ = (this.moveBackward ? 1 : 0) - (this.moveForward ? 1 : 0);
    
    if (moveX !== 0 || moveZ !== 0) {
      // Get camera direction for movement relative to view
      const cameraDirection = new THREE.Vector3();
      this.camera.getWorldDirection(cameraDirection);
      cameraDirection.y = 0;
      cameraDirection.normalize();
      
      // Calculate movement vector
      const moveVector = new THREE.Vector3();
      
      // Forward/backward movement along camera direction
      if (moveZ !== 0) {
        moveVector.add(cameraDirection.clone().multiplyScalar(moveZ));
      }
      
      // Left/right movement perpendicular to camera direction
      if (moveX !== 0) {
        const rightVector = new THREE.Vector3();
        rightVector.crossVectors(new THREE.Vector3(0, 1, 0), cameraDirection);
        moveVector.add(rightVector.multiplyScalar(moveX));
      }
      
      // Normalize and apply movement
      moveVector.normalize();
      this.position.x -= moveVector.x * this.moveSpeed;
      this.position.z -= moveVector.z * this.moveSpeed;
    }
    
    // Check if position was changed externally (e.g., by collision system)
    // by comparing current group position to where it should be based on last frame
    if (this.group.position.x !== originalPosition.x || 
        this.group.position.y !== originalPosition.y || 
        this.group.position.z !== originalPosition.z) {
      
      // If the mesh position was changed externally, update our abstract position to match
      this.position.copy(this.group.position);
    }
    
    // Update player mesh position from our current abstract position
    this.group.position.copy(this.position);
    
    // Update camera to follow player
    // For development, we'll keep using OrbitControls, but in a real game
    // you might want to replace this with a third-person camera
    this.controls.target.copy(this.group.position);
  }
} 