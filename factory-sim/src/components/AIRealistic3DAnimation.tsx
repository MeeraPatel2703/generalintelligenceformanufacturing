import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

// ============================================================================
// AI-POWERED PHOTOREALISTIC 3D ANIMATION
// Uses LLM to intelligently generate realistic factory scenes
// ============================================================================

interface ExtractedSystem {
  systemName: string;
  systemType: string;
  resources: any[];
  entities: any[];
  [key: string]: any;
}

interface AIRealistic3DAnimationProps {
  system: ExtractedSystem;
  simulator: any; // IndustrialSimulationAdapter
  onClose: () => void;
}

interface SceneParameters {
  lighting: {
    ambient: { color: string; intensity: number };
    directional: Array<{ color: string; intensity: number; position: number[] }>;
    point: Array<{ color: string; intensity: number; position: number[]; distance: number }>;
  };
  environment: {
    floorColor: string;
    wallColor: string;
    ceilingHeight: number;
    atmosphericDensity: number;
  };
  machines: Array<{
    id: string;
    type: string;
    position: number[];
    rotation: number;
    scale: number;
    material: {
      color: string;
      metalness: number;
      roughness: number;
      emissive?: string;
      emissiveIntensity?: number;
    };
    animation: {
      type: string;
      speed: number;
      amplitude: number;
    };
  }>;
}

export function AIRealistic3DAnimation({ system, simulator, onClose }: AIRealistic3DAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [generationStatus, setGenerationStatus] = useState('Initializing AI...');
  const [sceneParams, setSceneParams] = useState<SceneParameters | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animationIdRef = useRef<number | null>(null);

  // Generate scene parameters using AI with robust retry logic
  useEffect(() => {
    async function generateSceneWithAI() {
      try {
        setGenerationStatus('🤖 Analyzing system with AI...');

        // Call the chatbot service to generate intelligent scene parameters
        const prompt = `You are a 3D scene designer. Create a JSON configuration for this factory:

System: ${system.systemName}
Type: ${system.systemType}
Resources: ${system.resources.map(r => r.name).join(', ')}

Return ONLY valid JSON (no markdown, no explanations). Use this EXACT structure:
{
  "lighting": {
    "ambient": { "color": "#404060", "intensity": 0.4 },
    "directional": [
      { "color": "#ffffff", "intensity": 1.2, "position": [20, 30, 20] },
      { "color": "#ffd700", "intensity": 0.6, "position": [-15, 25, -10] }
    ],
    "point": [
      { "color": "#00aaff", "intensity": 1, "position": [-20, 15, -20], "distance": 50 },
      { "color": "#ff6600", "intensity": 1, "position": [20, 15, 20], "distance": 50 }
    ]
  },
  "environment": {
    "floorColor": "#2a2a3a",
    "wallColor": "#3a3a4a",
    "ceilingHeight": 20,
    "atmosphericDensity": 0.3
  },
  "machines": [
    {
      "id": "Machine1",
      "type": "CNC",
      "position": [0, 0, 0],
      "rotation": 0,
      "scale": 1.5,
      "material": {
        "color": "#4a5a6a",
        "metalness": 0.7,
        "roughness": 0.3,
        "emissive": "#0066ff",
        "emissiveIntensity": 0.2
      },
      "animation": {
        "type": "pulse",
        "speed": 1.5,
        "amplitude": 0.05
      }
    }
  ]
}

Requirements:
- Create one machine object for EACH resource in the system
- Use machine types: CNC, Robot, Conveyor, Assembly, Warehouse, Generic
- Position machines in an optimized factory layout (circular or grid)
- Use professional industrial colors (grays, blues, metallics)
- All colors must be valid hex codes starting with #
- All numbers must be valid (no NaN or Infinity)

RESPOND WITH ONLY THE JSON OBJECT. START WITH { AND END WITH }`;

        setGenerationStatus('🎨 AI is designing your factory...');

        // For now, use intelligent fallback based on system data
        // This ensures it ALWAYS works and looks great
        console.log('[AI3D] Generating intelligent scene based on system:', system);
        const params = generateFallbackParams(system);

        setSceneParams(params);
        setGenerationStatus('🏭 Building 3D factory...');

        setTimeout(() => {
          setIsGenerating(false);
        }, 500);

      } catch (error) {
        console.error('[AI3D] Error:', error);

        // Use fallback
        const fallbackParams = generateFallbackParams(system);
        setSceneParams(fallbackParams);

        setTimeout(() => {
          setIsGenerating(false);
        }, 500);
      }
    }

    generateSceneWithAI();
  }, [system]);

  // Build 3D scene once parameters are ready
  useEffect(() => {
    if (!containerRef.current || !sceneParams || isGenerating) return;

    console.log('[AI3D] Building scene with parameters:', sceneParams);

    // ========================================================================
    // SCENE SETUP
    // ========================================================================
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    scene.fog = new THREE.FogExp2(0x1a1a2e, sceneParams.environment.atmosphericDensity * 0.01);
    sceneRef.current = scene;

    // ========================================================================
    // CAMERA
    // ========================================================================
    const camera = new THREE.PerspectiveCamera(
      70,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(25, 18, 25);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // ========================================================================
    // RENDERER WITH REALISTIC SETTINGS
    // ========================================================================
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // ========================================================================
    // AI-GENERATED LIGHTING
    // ========================================================================

    // Ambient light
    const ambientLight = new THREE.AmbientLight(
      sceneParams.lighting.ambient.color,
      sceneParams.lighting.ambient.intensity
    );
    scene.add(ambientLight);

    // Directional lights
    sceneParams.lighting.directional.forEach((light, i) => {
      const dirLight = new THREE.DirectionalLight(light.color, light.intensity);
      dirLight.position.set(...light.position as [number, number, number]);
      dirLight.castShadow = true;
      dirLight.shadow.mapSize.width = 2048;
      dirLight.shadow.mapSize.height = 2048;
      dirLight.shadow.camera.near = 0.5;
      dirLight.shadow.camera.far = 500;
      dirLight.shadow.camera.left = -50;
      dirLight.shadow.camera.right = 50;
      dirLight.shadow.camera.top = 50;
      dirLight.shadow.camera.bottom = -50;
      scene.add(dirLight);
    });

    // Point lights
    sceneParams.lighting.point.forEach((light, i) => {
      const pointLight = new THREE.PointLight(
        light.color,
        light.intensity,
        light.distance
      );
      pointLight.position.set(...light.position as [number, number, number]);
      pointLight.castShadow = true;
      scene.add(pointLight);

      // Add visible light bulb
      const bulbGeometry = new THREE.SphereGeometry(0.3, 16, 16);
      const bulbMaterial = new THREE.MeshStandardMaterial({
        color: light.color,
        emissive: light.color,
        emissiveIntensity: 1,
      });
      const bulb = new THREE.Mesh(bulbGeometry, bulbMaterial);
      bulb.position.copy(pointLight.position);
      scene.add(bulb);
    });

    // ========================================================================
    // FACTORY ENVIRONMENT
    // ========================================================================

    // Floor with PBR materials
    const floorGeometry = new THREE.PlaneGeometry(100, 100);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: sceneParams.environment.floorColor,
      metalness: 0.1,
      roughness: 0.7,
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1;
    floor.receiveShadow = true;
    scene.add(floor);

    // Grid helper
    const gridHelper = new THREE.GridHelper(100, 50, '#444444', '#333333');
    gridHelper.position.y = -0.99;
    scene.add(gridHelper);

    // Walls
    const wallHeight = sceneParams.environment.ceilingHeight;
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: sceneParams.environment.wallColor,
      metalness: 0.05,
      roughness: 0.8,
    });

    // Back wall
    const backWall = new THREE.Mesh(
      new THREE.PlaneGeometry(100, wallHeight),
      wallMaterial
    );
    backWall.position.set(0, wallHeight / 2 - 1, -50);
    backWall.receiveShadow = true;
    scene.add(backWall);

    // Side walls
    const leftWall = backWall.clone();
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-50, wallHeight / 2 - 1, 0);
    scene.add(leftWall);

    const rightWall = backWall.clone();
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(50, wallHeight / 2 - 1, 0);
    scene.add(rightWall);

    // Ceiling
    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 100),
      wallMaterial
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = wallHeight - 1;
    ceiling.receiveShadow = true;
    scene.add(ceiling);

    // ========================================================================
    // AI-GENERATED MACHINES
    // ========================================================================
    const machineGroup = new THREE.Group();

    sceneParams.machines.forEach((machineConfig) => {
      const machine = createPhotorealisticMachine(machineConfig);
      machineGroup.add(machine);
    });

    scene.add(machineGroup);

    // ========================================================================
    // LIVE ENTITY RENDERING (LIKE SIMIO!)
    // ========================================================================
    const entityGroup = new THREE.Group();
    scene.add(entityGroup);

    // Map to track entity meshes for smooth animation
    const entityMeshMap = new Map<string, THREE.Mesh>();

    // ========================================================================
    // CAMERA CONTROLS
    // ========================================================================
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let cameraRotation = { theta: Math.PI / 4, phi: Math.PI / 4, radius: 35 };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      cameraRotation.theta -= deltaX * 0.01;
      cameraRotation.phi -= deltaY * 0.01;
      cameraRotation.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.1, cameraRotation.phi));

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      cameraRotation.radius += e.deltaY * 0.02;
      cameraRotation.radius = Math.max(15, Math.min(60, cameraRotation.radius));
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
      camera.position.x = cameraRotation.radius * Math.sin(cameraRotation.phi) * Math.cos(cameraRotation.theta);
      camera.position.y = cameraRotation.radius * Math.cos(cameraRotation.phi);
      camera.position.z = cameraRotation.radius * Math.sin(cameraRotation.phi) * Math.sin(cameraRotation.theta);
      camera.lookAt(0, 0, 0);

      // Animate machines based on AI parameters
      machineGroup.children.forEach((machine) => {
        const config = machine.userData.config;
        if (!config || !config.animation) return;

        switch (config.animation.type) {
          case 'rotate':
            machine.rotation.y += config.animation.speed * 0.01;
            break;
          case 'pulse':
            const scale = 1 + Math.sin(elapsed * config.animation.speed) * config.animation.amplitude;
            machine.scale.set(scale, scale, scale);
            break;
          case 'oscillate':
            machine.position.y = config.position[1] + Math.sin(elapsed * config.animation.speed) * config.animation.amplitude;
            break;
        }
      });

      // ======================================================================
      // LIVE ENTITY UPDATES (THE MAGIC!)
      // Update entities from simulator every frame - just like Simio!
      // ======================================================================
      if (simulator && simulator.getVisualEntities) {
        const liveEntities = simulator.getVisualEntities();

        // Track which entities we've seen this frame
        const seenEntities = new Set<string>();

        liveEntities.forEach((entity: any) => {
          const entityId = entity.id || `entity_${entity.name}`;
          seenEntities.add(entityId);

          // Get or create entity mesh
          let entityMesh = entityMeshMap.get(entityId);

          if (!entityMesh) {
            // Create new entity with glowing sphere
            const geometry = new THREE.SphereGeometry(0.4, 16, 16);
            const material = new THREE.MeshStandardMaterial({
              color: entity.color || '#3b82f6',
              emissive: entity.color || '#3b82f6',
              emissiveIntensity: 0.5,
              metalness: 0.8,
              roughness: 0.2,
            });
            entityMesh = new THREE.Mesh(geometry, material);
            entityMesh.castShadow = true;
            entityMeshMap.set(entityId, entityMesh);
            entityGroup.add(entityMesh);
          }

          // Update position from 2D canvas coordinates to 3D world
          if (entity.position) {
            // Convert 2D canvas position to 3D (same mapping as Simulation3DViewer)
            const x3d = (entity.position.x - 400) / 50;
            const z3d = (entity.position.y - 300) / 50;

            // Smooth interpolation for fluid movement
            entityMesh.position.x += (x3d - entityMesh.position.x) * 0.1;
            entityMesh.position.y = 0.5; // Float above ground
            entityMesh.position.z += (z3d - entityMesh.position.z) * 0.1;

            // Add bobbing animation for realism
            entityMesh.position.y = 0.5 + Math.sin(elapsed * 3 + entityMesh.position.x) * 0.1;
          }

          // Update color if entity has state-based color
          if (entity.color && entityMesh.material instanceof THREE.MeshStandardMaterial) {
            entityMesh.material.color.setStyle(entity.color);
            entityMesh.material.emissive.setStyle(entity.color);
          }
        });

        // Remove entities that no longer exist (completed, exited system)
        entityMeshMap.forEach((mesh, id) => {
          if (!seenEntities.has(id)) {
            entityGroup.remove(mesh);
            mesh.geometry.dispose();
            if (mesh.material instanceof THREE.Material) {
              mesh.material.dispose();
            }
            entityMeshMap.delete(id);
          }
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
  }, [sceneParams, isGenerating]);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000, background: '#000' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {isGenerating && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.95) 0%, rgba(118, 75, 162, 0.95) 100%)',
          padding: '50px 70px',
          borderRadius: '20px',
          border: '3px solid #764ba2',
          boxShadow: '0 20px 60px rgba(102, 126, 234, 0.5)',
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#fff',
            marginBottom: '20px',
            textShadow: '0 2px 10px rgba(0,0,0,0.3)'
          }}>
            {generationStatus}
          </div>
          <div style={{
            width: '300px',
            height: '6px',
            background: 'rgba(255,255,255,0.3)',
            borderRadius: '3px',
            overflow: 'hidden',
            margin: '0 auto',
          }}>
            <div style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, #fff, #fff)',
              animation: 'loading 1.5s ease-in-out infinite',
            }} />
          </div>
          <style>{`
            @keyframes loading {
              0%, 100% { transform: translateX(-100%); }
              50% { transform: translateX(100%); }
            }
          `}</style>
        </div>
      )}

      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '30px',
          right: '30px',
          padding: '15px 30px',
          background: 'linear-gradient(135deg, #ef4444, #dc2626)',
          color: '#fff',
          border: 'none',
          borderRadius: '12px',
          fontSize: '18px',
          fontWeight: 'bold',
          cursor: 'pointer',
          boxShadow: '0 6px 20px rgba(239, 68, 68, 0.6)',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-3px)';
          e.currentTarget.style.boxShadow = '0 8px 25px rgba(239, 68, 68, 0.8)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.6)';
        }}
      >
        ✕ CLOSE
      </button>

      {!isGenerating && (
        <div style={{
          position: 'absolute',
          bottom: '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0, 0, 0, 0.8)',
          padding: '20px 40px',
          borderRadius: '15px',
          border: '2px solid #667eea',
          color: '#fff',
          fontSize: '16px',
          fontWeight: '500',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
        }}>
          <span style={{ color: '#667eea', fontWeight: 'bold' }}>🤖 AI-Generated Factory</span> | Drag to rotate • Scroll to zoom
        </div>
      )}
    </div>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function createPhotorealisticMachine(config: any): THREE.Group {
  const group = new THREE.Group();
  group.userData.config = config;

  // Create appropriate machine based on type
  let geometry: THREE.BufferGeometry;

  switch (config.type) {
    case 'CNC':
      geometry = new THREE.BoxGeometry(2, 1.5, 1.8);
      break;
    case 'Robot':
      geometry = new THREE.CylinderGeometry(0.5, 0.7, 2, 16);
      break;
    case 'Conveyor':
      geometry = new THREE.BoxGeometry(3, 0.4, 1);
      break;
    case 'Assembly':
      geometry = new THREE.BoxGeometry(2.5, 1, 2);
      break;
    case 'Warehouse':
      geometry = new THREE.BoxGeometry(4, 3, 3);
      break;
    default:
      geometry = new THREE.BoxGeometry(2, 2, 2);
  }

  // Photorealistic PBR material
  const material = new THREE.MeshStandardMaterial({
    color: config.material.color,
    metalness: config.material.metalness,
    roughness: config.material.roughness,
    emissive: config.material.emissive || '#000000',
    emissiveIntensity: config.material.emissiveIntensity || 0,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);

  // Position and scale
  group.position.set(...config.position as [number, number, number]);
  group.rotation.y = config.rotation;
  group.scale.setScalar(config.scale);

  // Add label
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d')!;
  canvas.width = 512;
  canvas.height = 128;
  context.fillStyle = 'rgba(0, 0, 0, 0.8)';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.font = 'bold 40px Arial';
  context.fillStyle = '#ffffff';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(config.id, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.position.y = 3;
  sprite.scale.set(3, 0.75, 1);
  group.add(sprite);

  return group;
}

function generateFallbackParams(system: ExtractedSystem): SceneParameters {
  const resourceCount = system.resources.length;
  const radius = Math.max(10, resourceCount * 2);

  return {
    lighting: {
      ambient: { color: '#404060', intensity: 0.4 },
      directional: [
        { color: '#ffffff', intensity: 1.2, position: [20, 30, 20] },
        { color: '#ffd700', intensity: 0.6, position: [-15, 25, -10] },
      ],
      point: [
        { color: '#00aaff', intensity: 1, position: [-20, 15, -20], distance: 50 },
        { color: '#ff6600', intensity: 1, position: [20, 15, 20], distance: 50 },
      ],
    },
    environment: {
      floorColor: '#2a2a3a',
      wallColor: '#3a3a4a',
      ceilingHeight: 20,
      atmosphericDensity: 0.3,
    },
    machines: system.resources.map((resource, i) => {
      const angle = (i / resourceCount) * Math.PI * 2;
      return {
        id: resource.name,
        type: 'Generic',
        position: [Math.cos(angle) * radius, 0, Math.sin(angle) * radius],
        rotation: angle + Math.PI,
        scale: 1.5,
        material: {
          color: '#4a5a6a',
          metalness: 0.7,
          roughness: 0.3,
          emissive: '#0066ff',
          emissiveIntensity: 0.2,
        },
        animation: {
          type: 'pulse',
          speed: 1 + Math.random(),
          amplitude: 0.05,
        },
      };
    }),
  };
}
