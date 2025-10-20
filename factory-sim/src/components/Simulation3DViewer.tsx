import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

// ============================================================================
// PURE THREE.JS 3D VISUALIZATION (No React Three Fiber)
// ============================================================================

interface Resource {
  id: string;
  name: string;
  type: string;
  capacity: number;
  queueLength: number;
  utilization: number;
  position?: { x: number; y: number };
}

interface Path {
  id: string;
  fromResource: string;
  toResource: string;
  color: string;
  travelTime: number;
  speed: number;
}

interface Simulation3DViewerProps {
  resources: Resource[];
  paths: Path[];
  entities?: any[];
  onEntityClick?: (resource: Resource) => void;
}

export function Simulation3DViewer({
  resources,
  paths,
  entities,
  onEntityClick,
}: Simulation3DViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const mouseRef = useRef({ x: 0, y: 0, isDown: false, button: 0 });
  const cameraAngleRef = useRef({ theta: Math.PI / 4, phi: Math.PI / 3, radius: 20 });
  const entityMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());

  useEffect(() => {
    if (!containerRef.current) return;

    // ========================================================================
    // SCENE SETUP
    // ========================================================================
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    scene.fog = new THREE.Fog(0x0f172a, 30, 60);
    sceneRef.current = scene;

    // ========================================================================
    // CAMERA SETUP
    // ========================================================================
    const camera = new THREE.PerspectiveCamera(
      60,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(15, 12, 15);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // ========================================================================
    // RENDERER SETUP
    // ========================================================================
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // ========================================================================
    // LIGHTING
    // ========================================================================
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const pointLight1 = new THREE.PointLight(0x60a5fa, 0.4);
    pointLight1.position.set(-10, 10, -5);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xf59e0b, 0.3);
    pointLight2.position.set(10, 5, 10);
    scene.add(pointLight2);

    // ========================================================================
    // FLOOR GRID
    // ========================================================================
    const gridHelper = new THREE.GridHelper(50, 50, 0x374151, 0x1f2937);
    gridHelper.position.y = -1;
    scene.add(gridHelper);

    // ========================================================================
    // CREATE MACHINES
    // ========================================================================
    const machineGroup = new THREE.Group();

    resources.forEach((resource, index) => {
      // Calculate position
      const angle = (index / resources.length) * Math.PI * 2;
      const radius = 8;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      // Create machine body
      const geometry = new THREE.BoxGeometry(1.5, 1.2, 1.5);
      const utilization = resource.utilization || 0;

      // Color based on utilization
      let color = 0x6b7280; // Gray - idle
      if (utilization > 0.8) color = 0xef4444; // Red - high
      else if (utilization > 0.5) color = 0xf59e0b; // Orange - medium
      else if (utilization > 0.2) color = 0x10b981; // Green - low

      const material = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.6,
        roughness: 0.4,
      });

      const machine = new THREE.Mesh(geometry, material);
      machine.position.set(x, 0, z);
      machine.userData = { resource, type: 'machine' };
      machineGroup.add(machine);

      // Add base
      const baseGeometry = new THREE.CylinderGeometry(0.9, 1.0, 0.2, 32);
      const baseMaterial = new THREE.MeshStandardMaterial({
        color: 0x374151,
        metalness: 0.8,
        roughness: 0.2,
      });
      const base = new THREE.Mesh(baseGeometry, baseMaterial);
      base.position.set(x, -0.7, z);
      machineGroup.add(base);

      // Add status light
      const lightGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 16);
      const lightColor = resource.queueLength > 0 ? 0xf59e0b : 0x10b981;
      const lightMaterial = new THREE.MeshStandardMaterial({
        color: lightColor,
        emissive: lightColor,
        emissiveIntensity: 0.8,
      });
      const light = new THREE.Mesh(lightGeometry, lightMaterial);
      light.position.set(x, 0.8, z);
      machineGroup.add(light);
    });

    scene.add(machineGroup);

    // ========================================================================
    // CREATE CONVEYORS/PATHS
    // ========================================================================
    paths.forEach((path) => {
      const fromResource = resources.find((r) => r.name === path.fromResource);
      const toResource = resources.find((r) => r.name === path.toResource);
      if (!fromResource || !toResource) return;

      const fromIndex = resources.indexOf(fromResource);
      const toIndex = resources.indexOf(toResource);

      const fromAngle = (fromIndex / resources.length) * Math.PI * 2;
      const toAngle = (toIndex / resources.length) * Math.PI * 2;
      const radius = 8;

      const start = new THREE.Vector3(
        Math.cos(fromAngle) * radius,
        0,
        Math.sin(fromAngle) * radius
      );
      const end = new THREE.Vector3(
        Math.cos(toAngle) * radius,
        0,
        Math.sin(toAngle) * radius
      );

      const direction = new THREE.Vector3().subVectors(end, start);
      const distance = direction.length();
      const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

      // Create conveyor
      const conveyorGeometry = new THREE.CylinderGeometry(0.15, 0.15, distance, 16);
      const conveyorMaterial = new THREE.MeshStandardMaterial({
        color: parseInt(path.color.replace('#', '0x')),
        metalness: 0.5,
        roughness: 0.5,
        transparent: true,
        opacity: 0.8,
      });
      const conveyor = new THREE.Mesh(conveyorGeometry, conveyorMaterial);
      conveyor.position.copy(midpoint);

      // Rotate to align with direction
      const quaternion = new THREE.Quaternion();
      quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        direction.clone().normalize()
      );
      conveyor.setRotationFromQuaternion(quaternion);

      scene.add(conveyor);

      // Add flow particles
      for (let i = 0; i < 3; i++) {
        const t = i / 3;
        const pos = new THREE.Vector3().lerpVectors(start, end, t);
        const particleGeometry = new THREE.SphereGeometry(0.1, 16, 16);
        const particleMaterial = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: 0x60a5fa,
          emissiveIntensity: 0.5,
        });
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        particle.position.copy(pos);
        particle.userData = { start, end, offset: t, speed: path.speed / 100 };
        scene.add(particle);
      }
    });

    // ========================================================================
    // CREATE ENTITY GROUP (will be updated in animation loop)
    // ========================================================================
    const entityGroup = new THREE.Group();
    entityGroup.name = 'entities';
    scene.add(entityGroup);

    // ========================================================================
    // MOUSE CONTROLS
    // ========================================================================
    const onMouseDown = (e: MouseEvent) => {
      mouseRef.current.isDown = true;
      mouseRef.current.button = e.button;
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!mouseRef.current.isDown) return;

      const deltaX = e.clientX - mouseRef.current.x;
      const deltaY = e.clientY - mouseRef.current.y;

      if (mouseRef.current.button === 0) {
        // Left button - rotate
        cameraAngleRef.current.theta -= deltaX * 0.01;
        cameraAngleRef.current.phi -= deltaY * 0.01;
        cameraAngleRef.current.phi = Math.max(0.1, Math.min(Math.PI / 2, cameraAngleRef.current.phi));
      }

      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };

    const onMouseUp = () => {
      mouseRef.current.isDown = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      cameraAngleRef.current.radius += e.deltaY * 0.01;
      cameraAngleRef.current.radius = Math.max(5, Math.min(50, cameraAngleRef.current.radius));
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('wheel', onWheel);

    // ========================================================================
    // ANIMATION LOOP
    // ========================================================================
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      // Update camera position
      const { theta, phi, radius } = cameraAngleRef.current;
      camera.position.x = radius * Math.sin(phi) * Math.cos(theta);
      camera.position.y = radius * Math.cos(phi);
      camera.position.z = radius * Math.sin(phi) * Math.sin(theta);
      camera.lookAt(0, 0, 0);

      // Animate particles
      scene.traverse((obj) => {
        if (obj.userData.start && obj.userData.end) {
          obj.userData.offset = (obj.userData.offset + obj.userData.speed) % 1;
          const newPos = new THREE.Vector3().lerpVectors(
            obj.userData.start,
            obj.userData.end,
            obj.userData.offset
          );
          obj.position.copy(newPos);
        }
      });

      // Update entities
      if (entities && entities.length > 0) {
        // Clear old entity meshes
        entityGroup.clear();

        // Create/update entity meshes
        entities.forEach((entity: any) => {
          const pos = entity.position || { x: 0, y: 0 };

          // Convert 2D canvas position to 3D position
          // Map canvas coords (0-800) to 3D space (-8 to 8)
          const x3d = (pos.x - 400) / 50;
          const z3d = (pos.y - 300) / 50;

          // Create entity mesh
          const entityGeometry = new THREE.SphereGeometry(0.25, 16, 16);
          const entityMaterial = new THREE.MeshStandardMaterial({
            color: 0x3b82f6,
            emissive: 0x3b82f6,
            emissiveIntensity: 0.3,
            metalness: 0.7,
            roughness: 0.3,
          });
          const entityMesh = new THREE.Mesh(entityGeometry, entityMaterial);
          entityMesh.position.set(x3d, 0.5, z3d);
          entityMesh.userData = { entity };
          entityGroup.add(entityMesh);
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    // ========================================================================
    // RESIZE HANDLER
    // ========================================================================
    const onResize = () => {
      if (!containerRef.current || !camera || !renderer) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };

    window.addEventListener('resize', onResize);

    // ========================================================================
    // CLEANUP
    // ========================================================================
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('mouseup', onMouseUp);
      renderer.domElement.removeEventListener('wheel', onWheel);

      if (containerRef.current && renderer.domElement.parentNode === containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [resources, paths]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* Controls Overlay */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          background: 'rgba(17, 24, 39, 0.9)',
          padding: '16px',
          borderRadius: '12px',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          color: '#ffffff',
          fontSize: '14px',
          minWidth: '250px',
        }}
      >
        <div style={{ fontWeight: 'bold', marginBottom: '12px', color: '#60a5fa' }}>
          🎮 3D Visualization Controls
        </div>
        <div style={{ marginBottom: '8px', color: '#9ca3af' }}>
          • <strong>Left Click + Drag</strong> - Rotate view
        </div>
        <div style={{ marginBottom: '8px', color: '#9ca3af' }}>
          • <strong>Scroll</strong> - Zoom in/out
        </div>
        <div style={{ color: '#9ca3af' }}>
          • <strong>Hover</strong> - View details
        </div>
      </div>

      {/* Stats Panel */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: 'rgba(17, 24, 39, 0.9)',
          padding: '16px',
          borderRadius: '12px',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          color: '#ffffff',
          fontSize: '14px',
          minWidth: '200px',
        }}
      >
        <div style={{ fontWeight: 'bold', marginBottom: '12px', color: '#60a5fa' }}>
          📊 Scene Statistics
        </div>
        <div style={{ marginBottom: '8px', color: '#9ca3af' }}>
          Resources: <strong style={{ color: '#ffffff' }}>{resources.length}</strong>
        </div>
        <div style={{ marginBottom: '8px', color: '#9ca3af' }}>
          Paths: <strong style={{ color: '#ffffff' }}>{paths.length}</strong>
        </div>
        <div style={{ color: '#9ca3af' }}>
          Total Entities: <strong style={{ color: '#ffffff' }}>{entities?.length || 0}</strong>
        </div>
      </div>

      {/* Legend */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          background: 'rgba(17, 24, 39, 0.9)',
          padding: '16px',
          borderRadius: '12px',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          color: '#ffffff',
          fontSize: '13px',
        }}
      >
        <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#60a5fa' }}>
          🎨 Color Legend
        </div>
        <div style={{ marginBottom: '6px', display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              width: '16px',
              height: '16px',
              background: '#ef4444',
              marginRight: '8px',
              borderRadius: '3px',
            }}
          />
          <span style={{ color: '#9ca3af' }}>High Utilization (&gt;80%)</span>
        </div>
        <div style={{ marginBottom: '6px', display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              width: '16px',
              height: '16px',
              background: '#f59e0b',
              marginRight: '8px',
              borderRadius: '3px',
            }}
          />
          <span style={{ color: '#9ca3af' }}>Medium Utilization (50-80%)</span>
        </div>
        <div style={{ marginBottom: '6px', display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              width: '16px',
              height: '16px',
              background: '#10b981',
              marginRight: '8px',
              borderRadius: '3px',
            }}
          />
          <span style={{ color: '#9ca3af' }}>Low Utilization (20-50%)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              width: '16px',
              height: '16px',
              background: '#6b7280',
              marginRight: '8px',
              borderRadius: '3px',
            }}
          />
          <span style={{ color: '#9ca3af' }}>Idle (&lt;20%)</span>
        </div>
      </div>
    </div>
  );
}
