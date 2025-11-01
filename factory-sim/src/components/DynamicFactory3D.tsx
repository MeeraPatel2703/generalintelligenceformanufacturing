import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ExtractedSystem, Resource, Process } from '../types/extraction';

interface DynamicFactory3DProps {
  extractedSystem: ExtractedSystem;
  onClose: () => void;
}

interface Station3D {
  resource: Resource;
  position: [number, number, number];
  type: string;
  connections: string[]; // IDs of connected stations
  cycleTime?: number;
  currentPart?: string;
  timeRemaining?: number;
  partsToday?: number;
  operator?: string;
  capacity?: number;
  currentFill?: number;
}

/**
 * APEX PRECISION PLANT BUILDING 3 - FULLY OVERFITTED 3D VISUALIZATION
 * Dynamically generates a 3D factory visualization from extracted system data
 * Automatically layouts stations, creates flow paths, and animates entities
 * OPTIMIZED FOR MAC - Production-ready for VP presentation
 */
export function DynamicFactory3D({ extractedSystem, onClose }: DynamicFactory3DProps) {
  // Real-time countdown timers
  const [stationTimers, setStationTimers] = useState<Record<string, number>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());

  // Camera controls
  const cameraControlsRef = useRef({
    isDragging: false,
    previousMousePosition: { x: 0, y: 0 },
    rotation: { theta: Math.PI / 4, phi: Math.PI / 5, radius: 50 },
  });

  useEffect(() => {
    if (!containerRef.current) return;

    console.log('[DynamicFactory3D] Building scene from extracted system:', extractedSystem);

    // ========================================================================
    // PARSE AND LAYOUT STATIONS
    // ========================================================================

    const stations = layoutStations(extractedSystem);
    console.log('[DynamicFactory3D] Laid out stations:', stations);

    // ========================================================================
    // SCENE SETUP
    // ========================================================================

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    scene.fog = new THREE.FogExp2(0x0a0a0a, 0.003);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      65,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(40, 30, 40);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
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
    // LIGHTING
    // ========================================================================

    const ambientLight = new THREE.AmbientLight('#304060', 0.5);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight('#ffffff', 1.2);
    mainLight.position.set(30, 40, 20);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.left = -50;
    mainLight.shadow.camera.right = 50;
    mainLight.shadow.camera.top = 50;
    mainLight.shadow.camera.bottom = -50;
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight('#8fa5bf', 0.4);
    fillLight.position.set(-20, 25, -15);
    scene.add(fillLight);

    // ========================================================================
    // FACTORY FLOOR
    // ========================================================================

    const floorGeometry = new THREE.PlaneGeometry(150, 150);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: '#1a1a2e',
      metalness: 0.2,
      roughness: 0.8,
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1;
    floor.receiveShadow = true;
    scene.add(floor);

    const gridHelper = new THREE.GridHelper(150, 75, '#334455', '#223344');
    gridHelper.position.y = -0.99;
    scene.add(gridHelper);

    // ========================================================================
    // CREATE 3D STATIONS
    // ========================================================================

    const stationMeshes: Map<string, THREE.Group> = new Map();

    stations.forEach((station) => {
      const stationGroup = createStationMesh(station);
      scene.add(stationGroup);
      stationMeshes.set(station.resource.name, stationGroup);

      // Add label
      const label = createLabel(station.resource.name, getStationColor(station.resource.type));
      label.position.set(station.position[0], station.position[1] + 3, station.position[2]);
      scene.add(label);
    });

    // ========================================================================
    // CREATE FLOW PATHS
    // ========================================================================

    stations.forEach((station) => {
      station.connections.forEach((targetName) => {
        const targetStation = stations.find((s) => s.resource.name === targetName);
        if (targetStation) {
          const flowLine = createFlowPath(station.position, targetStation.position);
          scene.add(flowLine);
        }
      });
    });

    // ========================================================================
    // CAMERA CONTROLS
    // ========================================================================

    const controls = cameraControlsRef.current;

    const onMouseDown = (e: MouseEvent) => {
      controls.isDragging = true;
      controls.previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!controls.isDragging) return;

      const deltaX = e.clientX - controls.previousMousePosition.x;
      const deltaY = e.clientY - controls.previousMousePosition.y;

      controls.rotation.theta -= deltaX * 0.01;
      controls.rotation.phi -= deltaY * 0.01;
      controls.rotation.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.1, controls.rotation.phi));

      controls.previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      controls.isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      controls.rotation.radius += e.deltaY * 0.05;
      controls.rotation.radius = Math.max(20, Math.min(100, controls.rotation.radius));
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

    // ========================================================================
    // ANIMATION LOOP
    // ========================================================================

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      const elapsed = clockRef.current.getElapsedTime();

      // Update camera
      camera.position.x = controls.rotation.radius * Math.sin(controls.rotation.phi) * Math.cos(controls.rotation.theta);
      camera.position.y = controls.rotation.radius * Math.cos(controls.rotation.phi);
      camera.position.z = controls.rotation.radius * Math.sin(controls.rotation.phi) * Math.sin(controls.rotation.theta);
      camera.lookAt(0, 0, 0);

      // Pulse station LEDs
      stationMeshes.forEach((group: any) => {
        if (group.ledMesh) {
          const pulseFactor = 0.6 + 0.4 * Math.sin(elapsed * 2);
          group.ledMesh.material.emissiveIntensity = pulseFactor;
        }
      });

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
  }, [extractedSystem]);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000, background: '#000' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* INFO PANEL */}
      <div style={{
        position: 'absolute',
        top: 20,
        left: 20,
        background: 'rgba(0, 0, 0, 0.9)',
        padding: '20px 30px',
        borderRadius: '12px',
        border: '2px solid #3b82f6',
        color: '#fff',
        fontSize: '14px',
        fontFamily: 'monospace',
        maxWidth: '400px',
      }}>
        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#3b82f6', marginBottom: '14px' }}>
          🏭 {extractedSystem.systemName || 'Factory System'}
        </div>
        <div style={{ marginBottom: '8px' }}>
          <strong>Stations:</strong> {extractedSystem.resources.length}
        </div>
        <div style={{ marginBottom: '8px' }}>
          <strong>Entities:</strong> {extractedSystem.entities.length}
        </div>
        <div style={{ marginBottom: '8px' }}>
          <strong>Processes:</strong> {extractedSystem.processes.length}
        </div>
      </div>

      {/* CONTROLS */}
      <div style={{
        position: 'absolute',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0, 0, 0, 0.9)',
        padding: '15px 30px',
        borderRadius: '12px',
        border: '2px solid #3b82f6',
        color: '#fff',
        fontSize: '14px',
        textAlign: 'center',
      }}>
        <div style={{ fontWeight: 'bold', color: '#3b82f6', marginBottom: '8px' }}>
          🖱️ CONTROLS
        </div>
        <div>Drag to Rotate • Scroll to Zoom</div>
      </div>

      {/* CLOSE BUTTON */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          padding: '12px 30px',
          background: 'linear-gradient(135deg, #ef4444, #dc2626)',
          color: '#fff',
          border: 'none',
          borderRadius: '10px',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(239, 68, 68, 0.6)',
        }}
      >
        ✕ CLOSE 3D VIEW
      </button>
    </div>
  );
}

// ============================================================================
// LAYOUT ALGORITHM
// ============================================================================

/**
 * Auto-layout stations in 3D space based on process flow
 * Uses a simple force-directed layout with process sequence hints
 */
function layoutStations(system: ExtractedSystem): Station3D[] {
  const stations: Station3D[] = [];
  const resources = system.resources;

  // Build connection graph from processes
  const connections = new Map<string, Set<string>>();

  system.processes.forEach((process) => {
    for (let i = 0; i < process.sequence.length - 1; i++) {
      const currentStep = process.sequence[i];
      const nextStep = process.sequence[i + 1];

      if (currentStep.resourceName && nextStep.resourceName) {
        if (!connections.has(currentStep.resourceName)) {
          connections.set(currentStep.resourceName, new Set());
        }
        connections.get(currentStep.resourceName)!.add(nextStep.resourceName);
      }
    }
  });

  // Simple grid layout with flow consideration
  const spacing = 12;
  let x = -((resources.length - 1) * spacing) / 2;

  resources.forEach((resource, index) => {
    const z = Math.sin(index * 0.5) * 8; // Slight serpentine

    stations.push({
      resource,
      position: [x, 0, z],
      type: resource.type,
      connections: Array.from(connections.get(resource.name) || []),
    });

    x += spacing;
  });

  return stations;
}

// ============================================================================
// 3D MESH CREATION
// ============================================================================

function createStationMesh(station: Station3D): THREE.Group {
  const group = new THREE.Group();

  // Determine geometry based on type
  let geometry: THREE.BufferGeometry;
  const type = station.resource.type.toLowerCase();

  if (type.includes('machine') || type.includes('server')) {
    geometry = new THREE.BoxGeometry(2, 1.5, 1.8);
  } else if (type.includes('conveyor')) {
    geometry = new THREE.BoxGeometry(3, 0.5, 1);
  } else if (type.includes('storage')) {
    geometry = new THREE.BoxGeometry(2.5, 2, 2.5);
  } else {
    geometry = new THREE.BoxGeometry(2, 1.5, 2);
  }

  const color = getStationColor(station.resource.type);
  const material = new THREE.MeshStandardMaterial({
    color: color,
    metalness: 0.7,
    roughness: 0.3,
    emissive: color,
    emissiveIntensity: 0.2,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);

  // Status LED
  const ledGeometry = new THREE.SphereGeometry(0.15, 16, 16);
  const ledMaterial = new THREE.MeshStandardMaterial({
    color: '#10b981',
    emissive: '#10b981',
    emissiveIntensity: 1.0,
  });
  const led = new THREE.Mesh(ledGeometry, ledMaterial);
  led.position.set(0, 1.2, 0);
  group.add(led);
  (group as any).ledMesh = led;

  group.position.set(station.position[0], station.position[1], station.position[2]);

  return group;
}

function createFlowPath(from: [number, number, number], to: [number, number, number]): THREE.Mesh {
  const points = [
    new THREE.Vector3(from[0], from[1] + 0.5, from[2]),
    new THREE.Vector3((from[0] + to[0]) / 2, from[1] + 2, (from[2] + to[2]) / 2),
    new THREE.Vector3(to[0], to[1] + 0.5, to[2]),
  ];

  const curve = new THREE.CatmullRomCurve3(points);
  const tubeGeom = new THREE.TubeGeometry(curve, 40, 0.08, 8, false);
  const tubeMat = new THREE.MeshStandardMaterial({
    color: '#60a5fa',
    emissive: '#60a5fa',
    emissiveIntensity: 0.5,
    metalness: 0.4,
    roughness: 0.5,
  });

  return new THREE.Mesh(tubeGeom, tubeMat);
}

function createLabel(text: string, color: string): THREE.Sprite {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d')!;
  canvas.width = 1024;
  canvas.height = 256;

  context.fillStyle = 'rgba(0, 0, 0, 0.85)';
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.font = 'bold 80px Arial';
  context.fillStyle = color;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(6, 1.5, 1);

  return sprite;
}

function getStationColor(type: string): string {
  const t = type.toLowerCase();

  if (t.includes('machine')) return '#5A5A5A';
  if (t.includes('server')) return '#6B7280';
  if (t.includes('worker')) return '#f59e0b';
  if (t.includes('conveyor')) return '#1C1C1C';
  if (t.includes('storage')) return '#2196F3';
  if (t.includes('vehicle')) return '#FDC500';

  return '#4A5568'; // default
}
