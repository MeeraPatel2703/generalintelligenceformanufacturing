import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

// ============================================================================
// ENHANCED 3D FACTORY GENERATOR
// Automatically creates beautiful 3D factory from parsed system data
// ============================================================================

interface Resource {
  name: string;
  type?: string;
  capacity?: number;
  processingTime?: any;
}

interface ExtractedSystem {
  systemName: string;
  systemType: string;
  resources: Resource[];
  entities: any[];
  [key: string]: any;
}

interface Enhanced3DFactoryProps {
  system: ExtractedSystem;
  entities?: any[];
  onClose: () => void;
}

export function Enhanced3DFactory({ system, entities, onClose }: Enhanced3DFactoryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const mouseRef = useRef({ x: 0, y: 0, isDown: false, lastX: 0, lastY: 0 });
  const cameraAngleRef = useRef({ theta: Math.PI / 4, phi: Math.PI / 4, radius: 25 });
  const machineGroupRef = useRef<THREE.Group | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;

    console.log('[Enhanced3D] Generating factory for:', system.systemName);
    console.log('[Enhanced3D] Resources:', system.resources.length);

    // ========================================================================
    // SCENE SETUP
    // ========================================================================
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    scene.fog = new THREE.Fog(0x1a1a2e, 40, 80);
    sceneRef.current = scene;

    // ========================================================================
    // CAMERA
    // ========================================================================
    const camera = new THREE.PerspectiveCamera(
      65,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(20, 15, 20);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // ========================================================================
    // RENDERER
    // ========================================================================
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // ========================================================================
    // DRAMATIC INDUSTRIAL LIGHTING
    // ========================================================================
    // Ambient base light
    const ambientLight = new THREE.AmbientLight(0x404050, 0.3);
    scene.add(ambientLight);

    // Main overhead lights (like factory ceiling lights)
    const createOverheadLight = (x: number, z: number, color: number = 0xffffff) => {
      const light = new THREE.SpotLight(color, 1.5);
      light.position.set(x, 20, z);
      light.target.position.set(x, 0, z);
      light.castShadow = true;
      light.angle = Math.PI / 6;
      light.penumbra = 0.3;
      light.decay = 2;
      light.distance = 50;
      scene.add(light);
      scene.add(light.target);

      // Add visible light fixture
      const fixtureGeometry = new THREE.CylinderGeometry(0.5, 0.7, 0.3, 8);
      const fixtureMaterial = new THREE.MeshStandardMaterial({
        color: 0x2a2a3a,
        metalness: 0.8,
        roughness: 0.2,
        emissive: color,
        emissiveIntensity: 0.1,
      });
      const fixture = new THREE.Mesh(fixtureGeometry, fixtureMaterial);
      fixture.position.set(x, 19.5, z);
      scene.add(fixture);
    };

    // Create grid of overhead lights
    for (let x = -12; x <= 12; x += 8) {
      for (let z = -12; z <= 12; z += 8) {
        createOverheadLight(x, z, x % 16 === 0 ? 0xffd700 : 0xffffff);
      }
    }

    // Accent lights
    const blueAccent = new THREE.PointLight(0x00aaff, 0.5, 30);
    blueAccent.position.set(-15, 5, -15);
    scene.add(blueAccent);

    const orangeAccent = new THREE.PointLight(0xff6600, 0.5, 30);
    orangeAccent.position.set(15, 5, 15);
    scene.add(orangeAccent);

    // ========================================================================
    // FACTORY FLOOR
    // ========================================================================
    const floorGeometry = new THREE.PlaneGeometry(60, 60);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a3a,
      metalness: 0.1,
      roughness: 0.8,
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1;
    floor.receiveShadow = true;
    scene.add(floor);

    // Floor grid markings
    const gridHelper = new THREE.GridHelper(60, 30, 0x444455, 0x333344);
    gridHelper.position.y = -0.99;
    scene.add(gridHelper);

    // Safety lines (yellow stripes)
    const createSafetyLine = (x: number, z: number, width: number, depth: number) => {
      const lineGeometry = new THREE.PlaneGeometry(width, depth);
      const lineMaterial = new THREE.MeshStandardMaterial({
        color: 0xffdd00,
        emissive: 0xffdd00,
        emissiveIntensity: 0.2,
      });
      const line = new THREE.Mesh(lineGeometry, lineMaterial);
      line.rotation.x = -Math.PI / 2;
      line.position.set(x, -0.98, z);
      scene.add(line);
    };

    for (let i = -20; i <= 20; i += 10) {
      createSafetyLine(i, -25, 0.3, 50);
      createSafetyLine(-25, i, 50, 0.3);
    }

    // ========================================================================
    // GENERATE MACHINES FROM RESOURCES
    // ========================================================================
    const machineGroup = new THREE.Group();
    machineGroupRef.current = machineGroup;

    const resourceCount = system.resources.length;
    const layoutRadius = Math.max(10, resourceCount * 1.5);

    system.resources.forEach((resource, index) => {
      // Position in factory layout
      const angle = (index / resourceCount) * Math.PI * 2;
      const x = Math.cos(angle) * layoutRadius;
      const z = Math.sin(angle) * layoutRadius;

      // Determine machine type from resource data
      const type = resource.type?.toLowerCase() || '';
      const name = resource.name.toLowerCase();

      let machineModel: THREE.Group;

      if (type.includes('cnc') || name.includes('cnc') || name.includes('mill')) {
        machineModel = createCNCMachine(resource);
      } else if (type.includes('assembly') || name.includes('assembly') || name.includes('assemble')) {
        machineModel = createAssemblyStation(resource);
      } else if (type.includes('robot') || name.includes('robot') || name.includes('arm')) {
        machineModel = createRobotArm(resource);
      } else if (type.includes('conveyor') || name.includes('conveyor') || name.includes('belt')) {
        machineModel = createConveyorBelt(resource);
      } else if (type.includes('inspect') || name.includes('inspect') || name.includes('quality') || name.includes('qc')) {
        machineModel = createQCStation(resource);
      } else if (type.includes('warehouse') || name.includes('warehouse') || name.includes('storage')) {
        machineModel = createWarehouse(resource);
      } else {
        // Default: Industrial Server/Machine
        machineModel = createIndustrialMachine(resource);
      }

      machineModel.position.set(x, 0, z);
      machineModel.userData = { resource, index };
      machineGroup.add(machineModel);

      // Add label
      createLabel(resource.name, x, 3.5, z, scene);
    });

    scene.add(machineGroup);

    // Connect machines with conveyors
    for (let i = 0; i < resourceCount - 1; i++) {
      const fromAngle = (i / resourceCount) * Math.PI * 2;
      const toAngle = ((i + 1) / resourceCount) * Math.PI * 2;

      const from = new THREE.Vector3(
        Math.cos(fromAngle) * layoutRadius,
        0,
        Math.sin(fromAngle) * layoutRadius
      );
      const to = new THREE.Vector3(
        Math.cos(toAngle) * layoutRadius,
        0,
        Math.sin(toAngle) * layoutRadius
      );

      createFactoryConveyor(from, to, scene);
    }

    setIsGenerating(false);

    // ========================================================================
    // MOUSE CONTROLS
    // ========================================================================
    const onMouseDown = (e: MouseEvent) => {
      mouseRef.current.isDown = true;
      mouseRef.current.lastX = e.clientX;
      mouseRef.current.lastY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!mouseRef.current.isDown) return;

      const deltaX = e.clientX - mouseRef.current.lastX;
      const deltaY = e.clientY - mouseRef.current.lastY;

      cameraAngleRef.current.theta -= deltaX * 0.01;
      cameraAngleRef.current.phi -= deltaY * 0.01;
      cameraAngleRef.current.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.1, cameraAngleRef.current.phi));

      mouseRef.current.lastX = e.clientX;
      mouseRef.current.lastY = e.clientY;
    };

    const onMouseUp = () => {
      mouseRef.current.isDown = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      cameraAngleRef.current.radius += e.deltaY * 0.02;
      cameraAngleRef.current.radius = Math.max(10, Math.min(60, cameraAngleRef.current.radius));
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

    // ========================================================================
    // ANIMATION LOOP
    // ========================================================================
    const clock = new THREE.Clock();

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      const elapsed = clock.getElapsedTime();

      // Update camera
      const { theta, phi, radius } = cameraAngleRef.current;
      camera.position.x = radius * Math.sin(phi) * Math.cos(theta);
      camera.position.y = radius * Math.cos(phi);
      camera.position.z = radius * Math.sin(phi) * Math.sin(theta);
      camera.lookAt(0, 0, 0);

      // Animate machines
      if (machineGroup) {
        machineGroup.children.forEach((machine, i) => {
          // Gentle bobbing motion
          machine.position.y = Math.sin(elapsed * 0.5 + i) * 0.05;

          // Rotate some elements
          machine.traverse((child) => {
            if (child.userData.rotates) {
              child.rotation.y = elapsed * child.userData.rotationSpeed;
            }
            if (child.userData.pulses) {
              const scale = 1 + Math.sin(elapsed * 2 + i) * 0.05;
              child.scale.set(scale, scale, scale);
            }
          });
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    // ========================================================================
    // CLEANUP
    // ========================================================================
    return () => {
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('mouseup', onMouseUp);
      renderer.domElement.removeEventListener('wheel', onWheel);
      if (containerRef.current && renderer.domElement.parentNode === containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [system, entities]);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000, background: '#000' }}>
      {/* 3D Container */}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* Generating Overlay */}
      {isGenerating && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0, 0, 0, 0.9)',
          padding: '40px 60px',
          borderRadius: '16px',
          border: '2px solid #00aaff',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#00aaff', marginBottom: '20px' }}>
            🏭 GENERATING 3D FACTORY...
          </div>
          <div style={{ color: '#888', fontSize: '14px' }}>
            Creating {system.resources.length} machines
          </div>
        </div>
      )}

      {/* Header Info */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        background: 'rgba(0, 0, 0, 0.8)',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid #00aaff',
        minWidth: '300px',
      }}>
        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#00aaff', marginBottom: '10px' }}>
          🏭 {system.systemName}
        </div>
        <div style={{ color: '#888', fontSize: '14px', marginBottom: '8px' }}>
          Type: {system.systemType}
        </div>
        <div style={{ color: '#fff', fontSize: '14px' }}>
          Machines: {system.resources.length}
        </div>
      </div>

      {/* Controls */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        background: 'rgba(0, 0, 0, 0.8)',
        padding: '16px',
        borderRadius: '12px',
        border: '1px solid #666',
        color: '#fff',
        fontSize: '13px',
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#00aaff' }}>
          🎮 CONTROLS
        </div>
        <div style={{ marginBottom: '4px' }}>• DRAG - Rotate view</div>
        <div style={{ marginBottom: '4px' }}>• SCROLL - Zoom</div>
        <div>• ESC - Close</div>
      </div>

      {/* Close Button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          padding: '12px 24px',
          background: '#ef4444',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.5)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#dc2626';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#ef4444';
        }}
      >
        ✕ CLOSE
      </button>
    </div>
  );
}

// ============================================================================
// 3D MODEL GENERATORS
// ============================================================================

function createCNCMachine(resource: Resource): THREE.Group {
  const group = new THREE.Group();

  // Base
  const base = createMesh(new THREE.BoxGeometry(3, 0.5, 2.5), 0x2a2a3a, 0, -0.25, 0);
  group.add(base);

  // Main body
  const body = createMesh(new THREE.BoxGeometry(2.5, 2, 2), 0x3a4a5a, 0, 0.75, 0);
  group.add(body);

  // Spindle housing
  const spindle = createMesh(new THREE.BoxGeometry(0.8, 1.5, 0.8), 0x5a6a7a, 0, 2, 0);
  spindle.userData.rotates = true;
  spindle.userData.rotationSpeed = 2;
  group.add(spindle);

  // Control panel
  const panel = createMesh(new THREE.BoxGeometry(0.6, 1, 0.1), 0x1a1a2a, 1.3, 1, 0);
  const panelLight = createMesh(new THREE.BoxGeometry(0.4, 0.6, 0.05), 0x00ff00, 1.35, 1, 0);
  panelLight.material.emissive = new THREE.Color(0x00ff00);
  panelLight.material.emissiveIntensity = 0.5;
  group.add(panel, panelLight);

  // Status light
  const light = createMesh(new THREE.CylinderGeometry(0.15, 0.15, 0.1, 16), 0x00aaff, 0, 2.5, 0);
  light.material.emissive = new THREE.Color(0x00aaff);
  light.material.emissiveIntensity = 1;
  light.userData.pulses = true;
  group.add(light);

  return group;
}

function createAssemblyStation(resource: Resource): THREE.Group {
  const group = new THREE.Group();

  // Workbench
  const table = createMesh(new THREE.BoxGeometry(4, 0.3, 2.5), 0x8b4513, 0, 0, 0);
  group.add(table);

  // Legs
  [[-1.7, -0.65, 1], [1.7, -0.65, 1], [-1.7, -0.65, -1], [1.7, -0.65, -1]].forEach(([x, y, z]) => {
    group.add(createMesh(new THREE.CylinderGeometry(0.1, 0.1, 1.3, 8), 0x654321, x, y, z));
  });

  // Assembly jig
  const jig = createMesh(new THREE.BoxGeometry(1.5, 1.2, 1.5), 0x444444, 0, 0.75, 0);
  jig.material.wireframe = true;
  jig.material.opacity = 0.6;
  jig.material.transparent = true;
  group.add(jig);

  // Tool rack
  const rack = createMesh(new THREE.BoxGeometry(0.5, 0.8, 2), 0x333333, -1.8, 0.5, 0);
  group.add(rack);

  return group;
}

function createRobotArm(resource: Resource): THREE.Group {
  const group = new THREE.Group();

  // Base
  const base = createMesh(new THREE.CylinderGeometry(1, 1.2, 0.5, 16), 0x2a2a3a, 0, 0, 0);
  group.add(base);

  // Lower arm
  const lowerArm = createMesh(new THREE.CylinderGeometry(0.3, 0.3, 2.5, 16), 0xffa500, 0, 1.25, 0);
  lowerArm.userData.rotates = true;
  lowerArm.userData.rotationSpeed = 0.5;
  group.add(lowerArm);

  // Upper arm
  const upperArm = createMesh(new THREE.CylinderGeometry(0.25, 0.25, 2, 16), 0xffa500, 0, 2.75, 0.5);
  upperArm.rotation.z = Math.PI / 6;
  group.add(upperArm);

  // Gripper
  const gripper = createMesh(new THREE.BoxGeometry(0.4, 0.3, 0.2), 0x666666, 0, 3.5, 0.8);
  group.add(gripper);

  return group;
}

function createConveyorBelt(resource: Resource): THREE.Group {
  const group = new THREE.Group();

  // Frame
  const frame = createMesh(new THREE.BoxGeometry(1, 0.5, 6), 0x444444, 0, 0, 0);
  group.add(frame);

  // Belt
  const belt = createMesh(new THREE.BoxGeometry(0.8, 0.1, 5.5), 0x1a1a1a, 0, 0.3, 0);
  group.add(belt);

  // Rollers
  for (let z = -2; z <= 2; z += 1) {
    const roller = createMesh(new THREE.CylinderGeometry(0.1, 0.1, 1, 8), 0x888888, 0, 0, z);
    roller.rotation.z = Math.PI / 2;
    roller.userData.rotates = true;
    roller.userData.rotationSpeed = 3;
    group.add(roller);
  }

  return group;
}

function createQCStation(resource: Resource): THREE.Group {
  const group = new THREE.Group();

  // Platform
  const platform = createMesh(new THREE.CylinderGeometry(1.5, 1.5, 0.4, 32), 0x2a2a3a, 0, 0, 0);
  group.add(platform);

  // Scanner ring
  const ring = createMesh(new THREE.TorusGeometry(1, 0.15, 16, 32), 0x00aaff, 0, 1.2, 0);
  ring.material.emissive = new THREE.Color(0x00aaff);
  ring.material.emissiveIntensity = 0.5;
  ring.userData.rotates = true;
  ring.userData.rotationSpeed = 1;
  group.add(ring);

  // Inspection arms
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2;
    const arm = createMesh(new THREE.BoxGeometry(0.2, 1.5, 0.2), 0x666666, Math.cos(angle) * 1, 0.75, Math.sin(angle) * 1);
    group.add(arm);
  }

  return group;
}

function createWarehouse(resource: Resource): THREE.Group {
  const group = new THREE.Group();

  // Building
  const building = createMesh(new THREE.BoxGeometry(5, 3, 4), 0x3a3a4a, 0, 1.5, 0);
  group.add(building);

  // Roof
  const roof = createMesh(new THREE.ConeGeometry(3.5, 1, 4), 0x2a2a3a, 0, 3.5, 0);
  roof.rotation.y = Math.PI / 4;
  group.add(roof);

  // Door
  const door = createMesh(new THREE.BoxGeometry(1.5, 2, 0.1), 0x1a1a2a, 0, 1, 2.05);
  group.add(door);

  // Windows
  [[-1.5, 2, 2], [1.5, 2, 2]].forEach(([x, y, z]) => {
    const window = createMesh(new THREE.BoxGeometry(0.8, 0.6, 0.05), 0x00aaff, x, y, z);
    window.material.emissive = new THREE.Color(0x00aaff);
    window.material.emissiveIntensity = 0.3;
    group.add(window);
  });

  return group;
}

function createIndustrialMachine(resource: Resource): THREE.Group {
  const group = new THREE.Group();

  // Base
  const base = createMesh(new THREE.CylinderGeometry(1.2, 1.4, 0.4, 32), 0x2a2a3a, 0, -0.2, 0);
  group.add(base);

  // Main body
  const body = createMesh(new THREE.BoxGeometry(2, 2, 2), 0x4a5a6a, 0, 1, 0);
  group.add(body);

  // Top housing
  const top = createMesh(new THREE.CylinderGeometry(0.8, 1, 0.5, 16), 0x3a4a5a, 0, 2.25, 0);
  group.add(top);

  // Status indicator
  const indicator = createMesh(new THREE.SphereGeometry(0.2, 16, 16), 0x00ff00, 0, 2.6, 0);
  indicator.material.emissive = new THREE.Color(0x00ff00);
  indicator.material.emissiveIntensity = 1;
  indicator.userData.pulses = true;
  group.add(indicator);

  return group;
}

function createFactoryConveyor(from: THREE.Vector3, to: THREE.Vector3, scene: THREE.Scene) {
  const direction = new THREE.Vector3().subVectors(to, from);
  const distance = direction.length();
  const midpoint = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5);

  const geometry = new THREE.CylinderGeometry(0.2, 0.2, distance, 16);
  const material = new THREE.MeshStandardMaterial({
    color: 0x666666,
    metalness: 0.7,
    roughness: 0.3,
  });

  const conveyor = new THREE.Mesh(geometry, material);
  conveyor.position.copy(midpoint);

  const quaternion = new THREE.Quaternion();
  quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  conveyor.setRotationFromQuaternion(quaternion);

  scene.add(conveyor);
}

function createLabel(text: string, x: number, y: number, z: number, scene: THREE.Scene) {
  // Create a simple text sprite
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d')!;
  canvas.width = 512;
  canvas.height = 128;

  context.fillStyle = 'rgba(0, 0, 0, 0.8)';
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.font = 'bold 48px Arial';
  context.fillStyle = '#00aaff';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.position.set(x, y, z);
  sprite.scale.set(4, 1, 1);
  scene.add(sprite);
}

function createMesh(geometry: THREE.BufferGeometry, color: number, x: number, y: number, z: number): THREE.Mesh {
  const material = new THREE.MeshStandardMaterial({
    color,
    metalness: 0.6,
    roughness: 0.4,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}
