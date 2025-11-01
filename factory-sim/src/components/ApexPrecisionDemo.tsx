import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

// ============================================================================
// APEX PRECISION PLANT - BUILDING 3 FULLY OVERFITTED DEMO
// Optimized for VP of Operations presentation - October 29, 2025, 10:47 AM
// ============================================================================

interface ApexDemoProps {
  onClose: () => void;
}

// ============================================================================
// EQUIPMENT LIBRARY - REUSABLE COMPONENTS
// ============================================================================

interface EntityData {
  id: string;
  line: 'A' | 'B' | 'rework';
  progress: number; // 0-1 along path
  currentSegment: number;
  partNumber: string;
  mesh: THREE.Mesh;
  speed: number;
  pathPoints: THREE.Vector3[];
  curve?: THREE.CatmullRomCurve3;
}

// Equipment types for creating different entity shapes
const EQUIPMENT_LIBRARY = {
  // Creates a part entity with different shapes based on line
  createPartEntity: (line: 'A' | 'B' | 'rework', partNumber: string): THREE.Mesh => {
    const color = line === 'A' ? '#60a5fa' : line === 'B' ? '#14b8a6' : '#f43f5e';
    
    // Different shapes for different lines (MUCH LARGER for visibility)
    let geometry: THREE.BufferGeometry;
    if (line === 'A') {
      // Box shape for Line A parts - BIGGER
      geometry = new THREE.BoxGeometry(1.0, 1.0, 1.2);
    } else if (line === 'B') {
      // Cylindrical shape for Line B parts - BIGGER
      geometry = new THREE.CylinderGeometry(0.5, 0.5, 1.2, 8);
    } else {
      // Smaller box for rework parts - BIGGER
      geometry = new THREE.BoxGeometry(0.8, 0.8, 1.0);
    }
    
    const material = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 1.5, // BRIGHTER
      metalness: 0.5,
      roughness: 0.3,
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    // Add glow effect (more visible)
    const glowGeometry = geometry.clone();
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.6,
      side: THREE.BackSide,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.scale.multiplyScalar(1.5);
    mesh.add(glow);
    
    // Add point light for better visibility - STRONGER
    const pointLight = new THREE.PointLight(color, 2.0, 10);
    mesh.add(pointLight);
    
    // Store metadata
    (mesh as any).userData = { line, partNumber };
    
    return mesh;
  },
};

// ============================================================================
// EXACT APEX PRECISION PLANT DATA (100% OVERFITTED)
// ============================================================================

const APEX_DATA = {
  facility: {
    name: 'Apex Precision Plant, Building 3',
    department: 'Final Assembly & Outbound',
    currentTime: 'October 29, 2025, 10:47 AM',
    shift: '07:00–15:00 (8 hours) + OT until 16:00',
    dailyTarget: 480,
    partsShippedToday: 455,
    scheduleAdherence: 95,
  },

  stations: {
    // LINE A: DRILL → RIVET → MERGE
    A1_DRILL: {
      id: 'A1',
      label: 'A1-DRILL-001',
      type: 'drill',
      position: [-15, 0, 8],
      color: '#5A5A5A',
      cycleTime: 45,
      currentPart: 'X-10847',
      timeRemaining: 28,
      partsToday: 287,
      uptime: 97.2,
      status: 'RUNNING',
      statusLED: '#10b981',
      operator: 'Auto-clamp (no operator)',
    },

    A_BUFFER: {
      id: 'A-BUFFER',
      label: 'A-BUFFER: 6/10 TOTES - OK',
      position: [-10, 0, 8],
      capacity: 10,
      currentFill: 6,
      totes: [
        'PART-X BATCH-8847 QTY:12',
        'PART-X BATCH-8848 QTY:12',
        'PART-X BATCH-8849 QTY:11',
        'PART-X BATCH-8850 QTY:12',
        'PART-X BATCH-8851 QTY:12',
        'PART-X BATCH-8852 QTY:9',
      ],
      color: '#2196F3',
    },

    A2_RIVET_1: {
      id: 'A2-1',
      label: 'A2-RIVET-001',
      type: 'rivet',
      position: [-5, 0, 8],
      color: '#6B7280',
      cycleTime: 60,
      currentPart: 'X-10822',
      timeRemaining: 37,
      partsToday: 136,
      operator: 'Maria Santos',
      status: 'RUNNING',
      statusLED: '#10b981',
    },

    A2_RIVET_2: {
      id: 'A2-2',
      label: 'A2-RIVET-002',
      type: 'rivet',
      position: [-5, 0, 10],
      color: '#6B7280',
      cycleTime: 60,
      currentPart: 'X-10823',
      timeRemaining: 44,
      partsToday: 136,
      operator: 'James Chen',
      status: 'RUNNING',
      statusLED: '#10b981',
    },

    // LINE B: CUT → WELD → QC → MERGE (WITH REWORK LOOP)
    B1_CUT: {
      id: 'B1',
      label: 'B1-CUT-001',
      type: 'cut',
      position: [-15, 0, -8],
      color: '#5A5A5A',
      cycleTime: 30,
      currentPart: 'Y-7634',
      timeRemaining: 18,
      partsToday: 189,
      uptime: 98.1,
      status: 'RUNNING',
      statusLED: '#10b981',
      operator: 'Automated with supervision',
    },

    B_BUFFER: {
      id: 'B-BUFFER',
      label: 'B-BUFFER: 5/8 TOTES - OK',
      position: [-10, 0, -8],
      capacity: 8,
      currentFill: 5,
      totes: [
        'PART-Y BATCH-7621 QTY:10',
        'PART-Y BATCH-7622 QTY:9',
        'PART-Y BATCH-7623 QTY:10',
        'PART-Y BATCH-7624 QTY:11',
        'PART-Y BATCH-7625 QTY:8',
      ],
      color: '#2196F3',
    },

    B2_WELD: {
      id: 'B2',
      label: 'B2-WELD-CELL-001',
      type: 'weld',
      position: [-5, 0, -8],
      color: '#FDC500', // FANUC yellow
      cycleTime: 75,
      currentPart: 'Y-7615',
      timeRemaining: 52,
      partsToday: 183,
      operator: 'David Kim',
      status: 'ACTIVE - Arc on, sparks visible',
      statusLED: '#f59e0b',
      reworkPriority: 'When RB ≥3 totes',
    },

    Q1_QC: {
      id: 'Q1',
      label: 'Q1-QUALITY-001',
      type: 'qc',
      position: [0, 0, -8],
      color: '#3B82F6',
      cycleTime: 45,
      currentPart: 'Y-7610',
      timeRemaining: 31,
      operator: 'Lisa Wang',
      partsToday: 168,
      failedToday: 23,
      passRate: 88.0,
      status: 'INSPECTING',
      statusLED: '#3b82f6',
    },

    RB_BUFFER: {
      id: 'RB-BUFFER',
      label: 'RB-BUFFER: 2/5 TOTES - OK',
      position: [0, 0, -10],
      capacity: 5,
      currentFill: 2,
      totes: [
        'REWORK BATCH-R7589 QTY:3',
        'REWORK BATCH-R7592 QTY:4',
      ],
      color: '#EF4444',
    },

    R1_REWORK: {
      id: 'R1',
      label: 'R1-REWORK-001',
      type: 'rework',
      position: [2, 0, -10],
      color: '#F43F5E',
      cycleTime: 120,
      currentPart: 'Y-7589',
      timeRemaining: 73,
      partsToday: 21,
      operator: 'Maria Santos (Flex)',
      status: 'CORRECTING',
      statusLED: '#f43f5e',
    },

    // MERGE POINT
    M1_MERGE: {
      id: 'M1',
      label: 'M1-MERGE-POINT',
      type: 'merge',
      position: [0, 0, 0],
      color: '#8B5CF6',
      logic: 'Pure FIFO',
      lineAPercent: 54,
      lineBPercent: 46,
      partsMergedToday: 455,
      statusLED: '#8b5cf6',
    },

    // PACK STATIONS
    P1_PACK_1: {
      id: 'P1-1',
      label: 'P1-PACK-001',
      type: 'pack',
      position: [12, 0, 2],
      color: '#10B981',
      cycleTime: 90,
      currentPart: 'X-10815',
      timeRemaining: 54,
      partsToday: 227,
      operator: 'Carlos Rodriguez',
      status: 'PACKING',
      statusLED: '#10b981',
    },

    P1_PACK_2: {
      id: 'P1-2',
      label: 'P1-PACK-002',
      type: 'pack',
      position: [12, 0, -2],
      color: '#6B7280',
      cycleTime: 90,
      currentPart: '',
      timeRemaining: 0,
      partsToday: 228,
      operator: 'Carlos Rodriguez (Alternating)',
      status: 'IDLE',
      statusLED: '#6b7280',
    },
  },

  // C1 SERPENTINE CONVEYOR
  conveyor: {
    id: 'C1',
    label: 'C1-MAIN-SERPENTINE',
    length: 12, // meters
    speed: 0.6, // m/s
    rideTime: 20, // seconds
    color: '#1C1C1C',
    frameColor: '#B0B0B0',
    parts: [
      { id: 'X-10820', position: 2.4, type: 'X' },
      { id: 'Y-7608', position: 4.7, type: 'Y' },
      { id: 'X-10821', position: 6.1, type: 'X' },
      { id: 'Y-7609', position: 7.8, type: 'Y' },
      { id: 'X-10819', position: 9.3, type: 'X' },
      { id: 'Y-7607', position: 10.6, type: 'Y' },
      { id: 'X-10818', position: 11.2, type: 'X' },
    ],
  },
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ApexPrecisionDemo({ onClose }: ApexDemoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());

  // Real-time station timers (live countdown)
  const [stationTimers, setStationTimers] = useState({
    A1_DRILL: 28,
    B1_CUT: 18,
    A2_RIVET_1: 37,
    A2_RIVET_2: 44,
    B2_WELD: 52,
    Q1_QC: 31,
    R1_REWORK: 73,
    P1_PACK_1: 54,
  });

  // Camera controls state
  const cameraControlsRef = useRef({
    isDragging: false,
    previousMousePosition: { x: 0, y: 0 },
    rotation: { theta: Math.PI / 4, phi: Math.PI / 5, radius: 40 },
  });

  // Update timers every second
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setStationTimers((prev) => {
        const next: any = {};
        Object.keys(prev).forEach((key) => {
          const k = key as keyof typeof prev;
          next[k] = prev[k] > 0 ? prev[k] - 1 : 0;
        });
        return next;
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    console.log('[APEX DEMO] Building scene...');

    // ========================================================================
    // SCENE SETUP
    // ========================================================================
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    scene.fog = new THREE.FogExp2(0x1a1a2e, 0.003);
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
    camera.position.set(30, 20, 30);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // ========================================================================
    // RENDERER (OPTIMIZED FOR MAC)
    // ========================================================================
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit for Mac performance
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // ========================================================================
    // LIGHTING (REALISTIC FACTORY LIGHTING)
    // ========================================================================

    // Ambient light
    const ambientLight = new THREE.AmbientLight('#404060', 0.5);
    scene.add(ambientLight);

    // Main overhead lights
    const mainLight1 = new THREE.DirectionalLight('#ffffff', 1.0);
    mainLight1.position.set(20, 25, 20);
    mainLight1.castShadow = true;
    mainLight1.shadow.mapSize.width = 2048;
    mainLight1.shadow.mapSize.height = 2048;
    mainLight1.shadow.camera.near = 0.5;
    mainLight1.shadow.camera.far = 100;
    mainLight1.shadow.camera.left = -30;
    mainLight1.shadow.camera.right = 30;
    mainLight1.shadow.camera.top = 30;
    mainLight1.shadow.camera.bottom = -30;
    scene.add(mainLight1);

    const mainLight2 = new THREE.DirectionalLight('#f5f5f5', 0.6);
    mainLight2.position.set(-15, 20, -10);
    scene.add(mainLight2);

    // Task lights at stations
    const stationLightPositions = [
      [-15, 12, 8],  // A1 Drill
      [-5, 12, 9],   // A2 Rivet
      [-15, 12, -8], // B1 Cut
      [-5, 12, -8],  // B2 Weld
      [0, 12, -8],   // Q1 QC
      [12, 12, 0],   // Pack stations
    ];

    stationLightPositions.forEach((pos) => {
      const light = new THREE.PointLight('#ffffff', 0.8, 15);
      light.position.set(pos[0], pos[1], pos[2]);
      light.castShadow = true;
      scene.add(light);
    });

    // ========================================================================
    // FACTORY FLOOR & ENVIRONMENT
    // ========================================================================

    const floorGeometry = new THREE.PlaneGeometry(100, 100);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: '#2a2a3a',
      metalness: 0.1,
      roughness: 0.8,
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1;
    floor.receiveShadow = true;
    scene.add(floor);

    // Grid helper for spatial reference
    const gridHelper = new THREE.GridHelper(100, 50, '#444444', '#333333');
    gridHelper.position.y = -0.99;
    scene.add(gridHelper);

    // Yellow safety markings
    const createSafetyLine = (start: [number, number, number], end: [number, number, number]) => {
      const points = [
        new THREE.Vector3(start[0], start[1], start[2]),
        new THREE.Vector3(end[0], end[1], end[2]),
      ];
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const lineMaterial = new THREE.LineBasicMaterial({ color: '#FCD34D', linewidth: 3 });
      return new THREE.Line(lineGeometry, lineMaterial);
    };

    // Safety lines around rivet stations
    scene.add(createSafetyLine([-6, -0.98, 7], [-4, -0.98, 7]));
    scene.add(createSafetyLine([-6, -0.98, 11], [-4, -0.98, 11]));

    // ========================================================================
    // BUILD ALL STATIONS
    // ========================================================================

    const stationMeshes: Map<string, THREE.Group> = new Map();
    const labelSprites: Map<string, THREE.Sprite> = new Map();

    // Helper function to create station with exact specs
    const createStation = (config: any) => {
      const group = new THREE.Group();

      // Main machine body
      let geometry: THREE.BufferGeometry;
      switch (config.type) {
        case 'drill':
        case 'cut':
          geometry = new THREE.BoxGeometry(2, 1.5, 1.8);
          break;
        case 'rivet':
          geometry = new THREE.BoxGeometry(1.5, 1.2, 1.2);
          break;
        case 'weld':
          geometry = new THREE.CylinderGeometry(0.5, 0.7, 2, 16);
          break;
        case 'qc':
          geometry = new THREE.BoxGeometry(2, 1, 2);
          break;
        case 'rework':
          geometry = new THREE.BoxGeometry(1.8, 0.8, 1.5);
          break;
        case 'pack':
          geometry = new THREE.BoxGeometry(2, 1.2, 1.5);
          break;
        case 'merge':
          geometry = new THREE.ConeGeometry(0.8, 1.5, 4);
          break;
        default:
          geometry = new THREE.BoxGeometry(2, 1.5, 2);
      }

      const material = new THREE.MeshStandardMaterial({
        color: config.color || '#5A5A5A',
        metalness: 0.7,
        roughness: 0.3,
        emissive: config.statusLED || '#000000',
        emissiveIntensity: 0.3,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);

      // Status LED indicator
      const ledGeometry = new THREE.SphereGeometry(0.15, 16, 16);
      const ledMaterial = new THREE.MeshStandardMaterial({
        color: config.statusLED || '#6b7280',
        emissive: config.statusLED || '#6b7280',
        emissiveIntensity: 1.0,
      });
      const led = new THREE.Mesh(ledGeometry, ledMaterial);
      led.position.set(0, 1.2, 0);
      group.add(led);
      (group as any).ledMesh = led;

      // Position
      group.position.set(config.position[0], config.position[1], config.position[2]);

      // Store config for updates
      (group as any).config = config;

      return group;
    };

    // Helper function to create buffer with totes
    const createBuffer = (config: any) => {
      const group = new THREE.Group();

      // Buffer platform
      const platformGeom = new THREE.BoxGeometry(2, 0.2, 2);
      const platformMat = new THREE.MeshStandardMaterial({ color: '#4a5568', metalness: 0.5, roughness: 0.5 });
      const platform = new THREE.Mesh(platformGeom, platformMat);
      platform.position.y = -0.5;
      platform.receiveShadow = true;
      group.add(platform);

      // Totes (blue plastic containers)
      const toteSize = 0.4;
      const toteSpacing = 0.5;
      const totesPerRow = Math.min(5, config.capacity);

      for (let i = 0; i < config.currentFill; i++) {
        const toteGeom = new THREE.BoxGeometry(toteSize, toteSize * 0.7, toteSize);
        const toteMat = new THREE.MeshStandardMaterial({
          color: config.color || '#2196F3',
          metalness: 0.2,
          roughness: 0.6,
          transparent: true,
          opacity: 0.9,
        });
        const tote = new THREE.Mesh(toteGeom, toteMat);

        const row = Math.floor(i / totesPerRow);
        const col = i % totesPerRow;
        tote.position.set(
          (col - totesPerRow / 2) * toteSpacing,
          -0.15 + row * (toteSize * 0.8),
          0
        );
        tote.castShadow = true;
        tote.receiveShadow = true;
        group.add(tote);
      }

      group.position.set(config.position[0], config.position[1], config.position[2]);
      (group as any).config = config;

      return group;
    };

    // Helper function to create text label
    const createLabel = (text: string, color: string = '#ffffff') => {
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
    };

    // Create all stations from APEX_DATA
    Object.entries(APEX_DATA.stations).forEach(([key, config]: [string, any]) => {
      let stationGroup: THREE.Group;

      if (key.includes('BUFFER')) {
        stationGroup = createBuffer(config);
      } else {
        stationGroup = createStation(config);
      }

      scene.add(stationGroup);
      stationMeshes.set(key, stationGroup);

      // Add label above station
      const label = createLabel(config.label, config.statusLED || '#ffffff');
      label.position.set(config.position[0], config.position[1] + 3, config.position[2]);
      scene.add(label);
      labelSprites.set(key, label);
    });

    // ========================================================================
    // OPERATORS (HUMAN AVATARS)
    // ========================================================================

    const createOperator = (name: string, position: [number, number, number], color: string = '#f59e0b') => {
      const group = new THREE.Group();

      // Body (capsule)
      const bodyGeom = new THREE.CapsuleGeometry(0.22, 0.7, 8, 16);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.2,
      });
      const body = new THREE.Mesh(bodyGeom, bodyMat);
      body.castShadow = true;
      group.add(body);

      // Head
      const headGeom = new THREE.SphereGeometry(0.2, 16, 16);
      const headMat = new THREE.MeshStandardMaterial({ color: '#ffe0bd' });
      const head = new THREE.Mesh(headGeom, headMat);
      head.position.y = 0.75;
      head.castShadow = true;
      group.add(head);

      // Arms
      const armGeom = new THREE.CylinderGeometry(0.07, 0.07, 0.5, 10);
      const armMat = new THREE.MeshStandardMaterial({ color: color });

      const leftArm = new THREE.Mesh(armGeom, armMat);
      leftArm.position.set(-0.3, 0.3, 0);
      leftArm.rotation.z = Math.PI / 4;
      leftArm.castShadow = true;
      group.add(leftArm);

      const rightArm = new THREE.Mesh(armGeom, armMat);
      rightArm.position.set(0.3, 0.3, 0);
      rightArm.rotation.z = -Math.PI / 4;
      rightArm.castShadow = true;
      group.add(rightArm);

      // Name label
      const nameLabel = createLabel(name, '#ffffff');
      nameLabel.position.y = 1.5;
      nameLabel.scale.set(3, 0.75, 1);
      group.add(nameLabel);

      group.position.set(position[0], position[1], position[2]);

      // Animation data
      (group as any).leftArm = leftArm;
      (group as any).rightArm = rightArm;
      (group as any).animateArms = (time: number) => {
        leftArm.rotation.z = Math.PI / 4 + Math.sin(time * 2.5) * 0.3;
        rightArm.rotation.z = -Math.PI / 4 - Math.sin(time * 2.5) * 0.3;
      };

      return group;
    };

    // Create operators at their stations
    const operators: THREE.Group[] = [];

    operators.push(createOperator('Maria Santos', [-4.5, 0, 7.5], '#f59e0b'));
    operators.push(createOperator('James Chen', [-4.5, 0, 10.5], '#3b82f6'));
    operators.push(createOperator('David Kim', [-4.5, 0, -8.5], '#FDC500'));
    operators.push(createOperator('Lisa Wang', [0.5, 0, -9], '#3b82f6'));
    operators.push(createOperator('Carlos Rodriguez', [11.5, 0, 1.5], '#10b981'));

    operators.forEach((op) => scene.add(op));

    // ========================================================================
    // C1 SERPENTINE CONVEYOR
    // ========================================================================

    const conveyorGroup = new THREE.Group();
    const conveyorPath = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.5, 0),
      new THREE.Vector3(5, 0.5, 2),
      new THREE.Vector3(8, 0.5, -2),
      new THREE.Vector3(12, 0.5, 0),
    ]);

    // Belt tube
    const beltGeometry = new THREE.TubeGeometry(conveyorPath, 100, 0.3, 8, false);
    const beltTexture = createStripedBeltTexture();
    const beltMaterial = new THREE.MeshStandardMaterial({
      color: APEX_DATA.conveyor.color,
      metalness: 0.3,
      roughness: 0.7,
      map: beltTexture,
    });
    const beltMesh = new THREE.Mesh(beltGeometry, beltMaterial);
    beltMesh.castShadow = true;
    beltMesh.receiveShadow = true;
    conveyorGroup.add(beltMesh);
    (conveyorGroup as any).beltMaterial = beltMaterial;
    (conveyorGroup as any).beltTexture = beltTexture;

    // Frame supports
    for (let i = 0; i <= 12; i += 2) {
      const t = i / 12;
      const pos = conveyorPath.getPointAt(t);
      const supportGeom = new THREE.CylinderGeometry(0.08, 0.08, pos.y + 0.5, 8);
      const supportMat = new THREE.MeshStandardMaterial({ color: APEX_DATA.conveyor.frameColor, metalness: 0.8, roughness: 0.4 });
      const support = new THREE.Mesh(supportGeom, supportMat);
      support.position.set(pos.x, (pos.y - 0.5) / 2, pos.z);
      support.castShadow = true;
      conveyorGroup.add(support);
    }

    scene.add(conveyorGroup);

    // ========================================================================
    // WELD SPARKS PARTICLE SYSTEM
    // ========================================================================

    const sparkParticles: Array<{ mesh: THREE.Mesh; velocity: THREE.Vector3; life: number }> = [];
    const sparkGeometry = new THREE.SphereGeometry(0.04, 4, 4);
    const sparkMaterials = [
      new THREE.MeshBasicMaterial({ color: '#FFA500', transparent: true }),
      new THREE.MeshBasicMaterial({ color: '#FFD700', transparent: true }),
      new THREE.MeshBasicMaterial({ color: '#FF4500', transparent: true }),
    ];

    const createSpark = () => {
      const weldPos = APEX_DATA.stations.B2_WELD.position;
      const material = sparkMaterials[Math.floor(Math.random() * sparkMaterials.length)].clone();
      const spark = new THREE.Mesh(sparkGeometry, material);

      spark.position.set(
        weldPos[0] + (Math.random() - 0.5) * 0.3,
        weldPos[1] + 0.5 + Math.random() * 0.3,
        weldPos[2] + (Math.random() - 0.5) * 0.3
      );

      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.15,
        Math.random() * 0.2 + 0.1,
        (Math.random() - 0.5) * 0.15
      );

      scene.add(spark);
      sparkParticles.push({ mesh: spark, velocity, life: 1.0 });
    };

    // Parts on conveyor
    const partsOnConveyor: Array<{ mesh: THREE.Mesh; t: number; id: string; type: string }> = [];

    APEX_DATA.conveyor.parts.forEach((partData) => {
      const partGeom = new THREE.BoxGeometry(0.35, 0.25, 0.3);
      const partColor = partData.type === 'X' ? '#60a5fa' : '#34d399';
      const partMat = new THREE.MeshStandardMaterial({
        color: partColor,
        emissive: partColor,
        emissiveIntensity: 0.4,
        metalness: 0.5,
        roughness: 0.3,
      });
      const partMesh = new THREE.Mesh(partGeom, partMat);
      partMesh.castShadow = true;

      const t = partData.position / APEX_DATA.conveyor.length;
      const pos = conveyorPath.getPointAt(t);
      partMesh.position.copy(pos);
      partMesh.position.y += 0.2;

      conveyorGroup.add(partMesh);
      partsOnConveyor.push({ mesh: partMesh, t, id: partData.id, type: partData.type });
    });

    // ========================================================================
    // FLOW LINES (LINE A = BLUE, LINE B = TEAL, REWORK = RED)
    // ========================================================================

    // Define complete paths for each production line
    // Note: Line A can go through either rivet station (we'll alternate)
    const LINE_PATHS: Record<'A' | 'B' | 'rework', [number, number, number][]> = {
      A: [
        APEX_DATA.stations.A1_DRILL.position as [number, number, number],
        APEX_DATA.stations.A_BUFFER.position as [number, number, number],
        // Alternate between rivet stations - use RIVET_1 as primary path
        APEX_DATA.stations.A2_RIVET_1.position as [number, number, number],
        APEX_DATA.stations.M1_MERGE.position as [number, number, number],
        APEX_DATA.stations.P1_PACK_1.position as [number, number, number],
      ],
      B: [
        APEX_DATA.stations.B1_CUT.position as [number, number, number],
        APEX_DATA.stations.B_BUFFER.position as [number, number, number],
        APEX_DATA.stations.B2_WELD.position as [number, number, number],
        APEX_DATA.stations.Q1_QC.position as [number, number, number],
        APEX_DATA.stations.M1_MERGE.position as [number, number, number],
        APEX_DATA.stations.P1_PACK_1.position as [number, number, number],
      ],
      rework: [
        APEX_DATA.stations.Q1_QC.position as [number, number, number],
        APEX_DATA.stations.RB_BUFFER.position as [number, number, number],
        APEX_DATA.stations.R1_REWORK.position as [number, number, number],
        APEX_DATA.stations.B2_WELD.position as [number, number, number],
      ],
    };

    // Create visual flow lines (tubes) between stations
    const flowLines = [
      // Line A segments
      { from: APEX_DATA.stations.A1_DRILL.position, to: APEX_DATA.stations.A_BUFFER.position, color: '#60a5fa' },
      { from: APEX_DATA.stations.A_BUFFER.position, to: APEX_DATA.stations.A2_RIVET_1.position, color: '#60a5fa' },
      { from: APEX_DATA.stations.A2_RIVET_1.position, to: APEX_DATA.stations.M1_MERGE.position, color: '#60a5fa' },
      { from: APEX_DATA.stations.A2_RIVET_2.position, to: APEX_DATA.stations.M1_MERGE.position, color: '#60a5fa' },

      // Line B segments
      { from: APEX_DATA.stations.B1_CUT.position, to: APEX_DATA.stations.B_BUFFER.position, color: '#14b8a6' },
      { from: APEX_DATA.stations.B_BUFFER.position, to: APEX_DATA.stations.B2_WELD.position, color: '#14b8a6' },
      { from: APEX_DATA.stations.B2_WELD.position, to: APEX_DATA.stations.Q1_QC.position, color: '#14b8a6' },
      { from: APEX_DATA.stations.Q1_QC.position, to: APEX_DATA.stations.M1_MERGE.position, color: '#14b8a6' },

      // Rework loop segments
      { from: APEX_DATA.stations.Q1_QC.position, to: APEX_DATA.stations.RB_BUFFER.position, color: '#f43f5e' },
      { from: APEX_DATA.stations.RB_BUFFER.position, to: APEX_DATA.stations.R1_REWORK.position, color: '#f43f5e' },
      { from: APEX_DATA.stations.R1_REWORK.position, to: APEX_DATA.stations.B2_WELD.position, color: '#f43f5e' },

      // Merge to pack
      { from: APEX_DATA.stations.M1_MERGE.position, to: APEX_DATA.stations.P1_PACK_1.position, color: '#8b5cf6' },
    ];

    // Store curves for entity movement
    const pathCurves: Map<string, THREE.CatmullRomCurve3> = new Map();

    flowLines.forEach(({ from, to, color }) => {
      const points = [
        new THREE.Vector3(from[0], from[1] + 0.5, from[2]),
        new THREE.Vector3((from[0] + to[0]) / 2, from[1] + 2, (from[2] + to[2]) / 2),
        new THREE.Vector3(to[0], to[1] + 0.5, to[2]),
      ];
      const curve = new THREE.CatmullRomCurve3(points);
      
      // Store curve for entity movement
      const key = `${from[0]},${from[1]},${from[2]}-${to[0]},${to[1]},${to[2]}`;
      pathCurves.set(key, curve);
      
      // Create visual tube
      const tubeGeom = new THREE.TubeGeometry(curve, 40, 0.08, 8, false);
      const tubeMat = new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.4,
        metalness: 0.4,
        roughness: 0.5,
        transparent: true,
        opacity: 0.6,
      });
      const tube = new THREE.Mesh(tubeGeom, tubeMat);
      scene.add(tube);
    });

    // ========================================================================
    // ENTITY FLOW SYSTEM - FLOWING ENTITIES BETWEEN STATIONS
    // ========================================================================

    const entityGroup = new THREE.Group();
    entityGroup.name = 'flowingEntities';
    entityGroup.visible = true;
    scene.add(entityGroup);
    console.log('[APEX] Entity group created and added to scene');

    // Store all active entities
    const activeEntities: EntityData[] = [];

    // Create curves for complete paths
    const createPathCurve = (points: [number, number, number][]): THREE.CatmullRomCurve3 => {
      const curvePoints = points.map((p, i) => {
        if (i === 0) {
          // First point - start at station height
          return new THREE.Vector3(p[0], p[1] + 0.5, p[2]);
        } else if (i === points.length - 1) {
          // Last point - end at station height
          return new THREE.Vector3(p[0], p[1] + 0.5, p[2]);
        } else {
          // Middle points - elevated for smooth curves
          const prevPoint = points[i - 1];
          const nextPoint = points[i + 1];
          const midY = Math.max(p[1], prevPoint[1], nextPoint[1]) + 2;
          return new THREE.Vector3(p[0], midY, p[2]);
        }
      });
      return new THREE.CatmullRomCurve3(curvePoints);
    };

    const lineACurve = createPathCurve(LINE_PATHS.A);
    const lineBCurve = createPathCurve(LINE_PATHS.B);
    const reworkCurve = createPathCurve(LINE_PATHS.rework);

    // Spawn new entities periodically
    const spawnEntity = (line: 'A' | 'B' | 'rework') => {
      try {
        const partNum = line === 'A' 
          ? `X-${10000 + Math.floor(Math.random() * 900)}`
          : line === 'B'
          ? `Y-${7000 + Math.floor(Math.random() * 700)}`
          : `R-${7500 + Math.floor(Math.random() * 100)}`;

        const entityMesh = EQUIPMENT_LIBRARY.createPartEntity(line, partNum);
        
        // Get the appropriate curve
        const curve = line === 'A' ? lineACurve : line === 'B' ? lineBCurve : reworkCurve;
        
        // Start at beginning of path
        const startPos = curve.getPointAt(0);
        entityMesh.position.copy(startPos);
        
        // Make sure entity is visible
        entityMesh.visible = true;
        entityMesh.scale.set(1, 1, 1);
        
        entityGroup.add(entityMesh);

        const entityData: EntityData = {
          id: partNum,
          line,
          progress: 0,
          currentSegment: 0,
          partNumber: partNum,
          mesh: entityMesh,
          speed: line === 'rework' ? 0.8 : line === 'A' ? 1.2 : 1.0, // Different speeds per line
          pathPoints: [],
          curve: curve,
        };

        activeEntities.push(entityData);
        console.log(`[APEX] Spawned entity ${partNum} on line ${line}, total entities: ${activeEntities.length}`);
      } catch (error) {
        console.error('[APEX] Error spawning entity:', error);
      }
    };

    // Spawn entities at different intervals for each line
    let lineASpawnTimer = 0;
    let lineBSpawnTimer = 0;
    let reworkSpawnTimer = 0;

    // Initial spawn - start with multiple entities visible
    console.log('[APEX] Initializing entity flow system...');
    spawnEntity('A');
    spawnEntity('A');
    spawnEntity('B');
    setTimeout(() => {
      spawnEntity('B');
      spawnEntity('A');
      console.log('[APEX] Initial entities spawned, active:', activeEntities.length);
    }, 500);

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
      controls.rotation.radius = Math.max(20, Math.min(70, controls.rotation.radius));
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
      const delta = clockRef.current.getDelta();

      // Update camera position
      camera.position.x = controls.rotation.radius * Math.sin(controls.rotation.phi) * Math.cos(controls.rotation.theta);
      camera.position.y = controls.rotation.radius * Math.cos(controls.rotation.phi);
      camera.position.z = controls.rotation.radius * Math.sin(controls.rotation.phi) * Math.sin(controls.rotation.theta);
      camera.lookAt(0, 0, 0);

      // Animate operators
      operators.forEach((op: any) => {
        if (op.animateArms) op.animateArms(elapsed);
      });

      // Animate conveyor belt texture
      if ((conveyorGroup as any).beltTexture) {
        (conveyorGroup as any).beltTexture.offset.y -= 0.02;
      }

      // Move parts on conveyor
      partsOnConveyor.forEach((part) => {
        part.t += (APEX_DATA.conveyor.speed * delta) / APEX_DATA.conveyor.length;
        if (part.t > 1) part.t = 0;

        const pos = conveyorPath.getPointAt(part.t);
        part.mesh.position.copy(pos);
        part.mesh.position.y = pos.y + 0.2;

        // Rotate parts slightly
        part.mesh.rotation.y += 0.01;
      });

      // Update flowing entities along production lines
      lineASpawnTimer += delta;
      lineBSpawnTimer += delta;
      reworkSpawnTimer += delta;

      // Spawn new entities periodically (Line A: every 1.5-2.5s, Line B: every 2-3s, Rework: every 6-10s)
      if (lineASpawnTimer >= 1.5 + Math.random() * 1) {
        spawnEntity('A');
        lineASpawnTimer = 0;
      }
      if (lineBSpawnTimer >= 2 + Math.random() * 1) {
        spawnEntity('B');
        lineBSpawnTimer = 0;
      }
      if (reworkSpawnTimer >= 6 + Math.random() * 4) {
        spawnEntity('rework');
        reworkSpawnTimer = 0;
      }

      // Update entity positions along curves
      for (let i = activeEntities.length - 1; i >= 0; i--) {
        const entity = activeEntities[i];
        if (!entity.curve) {
          console.warn('[APEX] Entity missing curve:', entity.id);
          continue;
        }
        
        if (!entity.mesh || !entity.mesh.parent) {
          console.warn('[APEX] Entity mesh missing or not in scene:', entity.id);
          activeEntities.splice(i, 1);
          continue;
        }

        // Update progress along the curve (faster movement for visibility)
        entity.progress += entity.speed * delta * 0.3; // Scale speed appropriately

        if (entity.progress >= 1) {
          // Entity completed path - remove it
          entityGroup.remove(entity.mesh);
          entity.mesh.geometry.dispose();
          if (Array.isArray(entity.mesh.material)) {
            entity.mesh.material.forEach(m => m.dispose());
          } else {
            entity.mesh.material.dispose();
          }
          // Clean up glow mesh and lights
          entity.mesh.children.forEach(child => {
            if (child instanceof THREE.Mesh) {
              child.geometry.dispose();
              if (Array.isArray(child.material)) {
                child.material.forEach(m => m.dispose());
              } else {
                child.material.dispose();
              }
            } else if (child instanceof THREE.PointLight) {
              child.dispose();
            }
          });
          activeEntities.splice(i, 1);
          continue;
        }

        // Clamp progress to [0, 1]
        entity.progress = Math.min(1, entity.progress);

        // Get position along curve
        const position = entity.curve.getPointAt(entity.progress);
        const tangent = entity.curve.getTangentAt(entity.progress);

        // Update mesh position - direct setting for visibility
        entity.mesh.position.copy(position);

        // Add bobbing animation
        const bobAmount = Math.sin(elapsed * 3 + entity.progress * 10) * 0.1;
        entity.mesh.position.y += bobAmount;

        // Rotate entity to face direction of travel
        if (tangent.length() > 0.01) {
          entity.mesh.lookAt(
            entity.mesh.position.x + tangent.x,
            entity.mesh.position.y + tangent.y,
            entity.mesh.position.z + tangent.z
          );
          // Add slight rotation offset for visual interest
          entity.mesh.rotation.z += delta * 1.5;
        }

        // Update glow opacity based on progress
        const firstChild = entity.mesh.children[0];
        if (firstChild && firstChild instanceof THREE.Mesh && firstChild.material instanceof THREE.MeshBasicMaterial) {
          firstChild.material.opacity = 0.4 + Math.sin(elapsed * 4 + entity.progress * 5) * 0.2;
        }
      }

      // Pulse station LEDs
      stationMeshes.forEach((group: any) => {
        if (group.ledMesh && group.config.status === 'RUNNING') {
          const pulseFactor = 0.7 + 0.3 * Math.sin(elapsed * 3);
          group.ledMesh.material.emissiveIntensity = pulseFactor;
        }
      });

      // Pulse weld station (arc effect) and create sparks
      const weldStation = stationMeshes.get('B2_WELD');
      if (weldStation && weldStation.children[0] instanceof THREE.Mesh) {
        const mesh = weldStation.children[0] as THREE.Mesh;
        const material = mesh.material;
        if (material instanceof THREE.MeshStandardMaterial) {
          const weldPulse = 0.3 + 0.5 * Math.abs(Math.sin(elapsed * 10));
          material.emissiveIntensity = weldPulse;
        }

        // Create sparks periodically (5-10 sparks per second)
        if (Math.random() < 0.15) {
          createSpark();
        }
      }

      // Update spark particles
      for (let i = sparkParticles.length - 1; i >= 0; i--) {
        const particle = sparkParticles[i];

        // Update position
        particle.mesh.position.add(particle.velocity.clone().multiplyScalar(delta));

        // Apply gravity
        particle.velocity.y -= 0.5 * delta;

        // Fade out
        particle.life -= delta * 2;
        (particle.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, particle.life);

        // Remove dead particles
        if (particle.life <= 0 || particle.mesh.position.y < -0.5) {
          scene.remove(particle.mesh);
          particle.mesh.geometry.dispose();
          (particle.mesh.material as THREE.Material).dispose();
          sparkParticles.splice(i, 1);
        }
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

      // Clean up all entities
      activeEntities.forEach(entity => {
        entityGroup.remove(entity.mesh);
        entity.mesh.geometry.dispose();
        if (Array.isArray(entity.mesh.material)) {
          entity.mesh.material.forEach(m => m.dispose());
        } else {
          entity.mesh.material.dispose();
        }
        // Clean up glow mesh and lights if they exist
        entity.mesh.children.forEach(child => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach(m => m.dispose());
            } else {
              child.material.dispose();
            }
          } else if (child instanceof THREE.PointLight) {
            child.dispose();
          }
        });
      });
      activeEntities.length = 0;

      if (containerRef.current && renderer.domElement.parentNode === containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }

      renderer.dispose();
    };
  }, []);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000, background: '#000' }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.2); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* TOP-LEFT: FACILITY INFO */}
      <div style={{
        position: 'absolute',
        top: 20,
        left: 20,
        background: 'rgba(0, 0, 0, 0.9)',
        padding: '20px 30px',
        borderRadius: '12px',
        border: '2px solid #3b82f6',
        color: '#fff',
        fontSize: '13px',
        fontFamily: 'monospace',
        maxWidth: '420px',
      }}>
        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#3b82f6', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>🏭</span>
          {APEX_DATA.facility.name}
        </div>
        <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
          <strong>Department:</strong>
          <span>{APEX_DATA.facility.department}</span>
        </div>
        <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
          <strong>Current Time:</strong>
          <span style={{ color: '#60a5fa' }}>{APEX_DATA.facility.currentTime}</span>
        </div>
        <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
          <strong>Shift:</strong>
          <span>{APEX_DATA.facility.shift}</span>
        </div>
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.2)', margin: '12px 0' }} />
        <div style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <strong>Daily Target:</strong>
            <span>{APEX_DATA.facility.dailyTarget} units</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <strong>Shipped Today:</strong>
            <span style={{ color: '#10b981', fontWeight: 'bold' }}>{APEX_DATA.facility.partsShippedToday} units</span>
          </div>
          <div style={{
            width: '100%',
            height: '10px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '5px',
            overflow: 'hidden',
            marginBottom: '8px',
          }}>
            <div style={{
              width: `${(APEX_DATA.facility.partsShippedToday / APEX_DATA.facility.dailyTarget) * 100}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #10b981, #059669)',
              boxShadow: '0 0 10px #10b981',
              transition: 'width 0.5s ease',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#10b981' }}>
            <span>{Math.round((APEX_DATA.facility.partsShippedToday / APEX_DATA.facility.dailyTarget) * 100)}% Complete</span>
            <span>{APEX_DATA.facility.dailyTarget - APEX_DATA.facility.partsShippedToday} remaining</span>
          </div>
        </div>
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.2)', margin: '12px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong>Schedule Adherence:</strong>
          <span style={{
            color: APEX_DATA.facility.scheduleAdherence >= 95 ? '#10b981' : '#f59e0b',
            fontWeight: 'bold',
            fontSize: '16px',
          }}>
            {APEX_DATA.facility.scheduleAdherence}%
            <span style={{ fontSize: '12px', marginLeft: '4px' }}>
              {APEX_DATA.facility.scheduleAdherence >= 95 ? '✓' : '⚠'}
            </span>
          </span>
        </div>
      </div>

      {/* TOP-RIGHT: STATION STATUS */}
      <div style={{
        position: 'absolute',
        top: 20,
        right: 20,
        background: 'rgba(0, 0, 0, 0.9)',
        padding: '20px',
        borderRadius: '12px',
        border: '2px solid #8b5cf6',
        color: '#fff',
        fontSize: '12px',
        fontFamily: 'monospace',
        maxWidth: '450px',
      }}>
        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#8b5cf6', marginBottom: '12px' }}>
          🎯 LIVE STATION STATUS
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <StationStatusItem label="A1 DRILL" part="X-10847" time={stationTimers.A1_DRILL} status="RUNNING" color="#10b981" cycleTime={45} />
          <StationStatusItem label="B1 CUT" part="Y-7634" time={stationTimers.B1_CUT} status="RUNNING" color="#10b981" cycleTime={30} />
          <StationStatusItem label="A2-1 RIVET" part="X-10822" time={stationTimers.A2_RIVET_1} status="RUNNING" color="#10b981" cycleTime={60} />
          <StationStatusItem label="A2-2 RIVET" part="X-10823" time={stationTimers.A2_RIVET_2} status="RUNNING" color="#10b981" cycleTime={60} />
          <StationStatusItem label="B2 WELD" part="Y-7615" time={stationTimers.B2_WELD} status="ACTIVE" color="#f59e0b" cycleTime={75} />
          <StationStatusItem label="Q1 QC" part="Y-7610" time={stationTimers.Q1_QC} status="INSPECT" color="#3b82f6" cycleTime={45} />
          <StationStatusItem label="R1 REWORK" part="Y-7589" time={stationTimers.R1_REWORK} status="CORRECTING" color="#f43f5e" cycleTime={120} />
          <StationStatusItem label="P1-1 PACK" part="X-10815" time={stationTimers.P1_PACK_1} status="PACKING" color="#10b981" cycleTime={90} />
        </div>
      </div>

      {/* BOTTOM-LEFT: BUFFER STATUS */}
      <div style={{
        position: 'absolute',
        bottom: 20,
        left: 20,
        background: 'rgba(0, 0, 0, 0.9)',
        padding: '18px 24px',
        borderRadius: '12px',
        border: '2px solid #2196F3',
        color: '#fff',
        fontSize: '12px',
        fontFamily: 'monospace',
        maxWidth: '320px',
      }}>
        <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#2196F3', marginBottom: '12px' }}>
          📦 BUFFER STATUS
        </div>
        <BufferStatusBar label="A-BUFFER" current={6} capacity={10} color="#60a5fa" />
        <BufferStatusBar label="B-BUFFER" current={5} capacity={8} color="#14b8a6" />
        <BufferStatusBar label="RB-REWORK" current={2} capacity={5} color="#f43f5e" />
        <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
          <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#8b5cf6', marginBottom: '6px' }}>
            M1 MERGE - FIFO
          </div>
          <div style={{ fontSize: '11px', marginBottom: '4px' }}>
            <span style={{ color: '#60a5fa' }}>●</span> Line A: 54% (287 parts)
          </div>
          <div style={{ fontSize: '11px', marginBottom: '4px' }}>
            <span style={{ color: '#14b8a6' }}>●</span> Line B: 46% (168 parts)
          </div>
          <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 'bold' }}>
            Total: 455 parts today
          </div>
        </div>
      </div>

      {/* BOTTOM-CENTER: CONTROLS */}
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

      {/* BOTTOM-RIGHT: LEGEND */}
      <div style={{
        position: 'absolute',
        bottom: 20,
        right: 20,
        background: 'rgba(0, 0, 0, 0.9)',
        padding: '15px 20px',
        borderRadius: '12px',
        border: '2px solid #6b7280',
        color: '#fff',
        fontSize: '12px',
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>LEGEND</div>
        <div style={{ marginBottom: '4px' }}><span style={{ color: '#60a5fa' }}>●</span> Line A Flow</div>
        <div style={{ marginBottom: '4px' }}><span style={{ color: '#14b8a6' }}>●</span> Line B Flow</div>
        <div style={{ marginBottom: '4px' }}><span style={{ color: '#f43f5e' }}>●</span> Rework Loop</div>
        <div style={{ marginBottom: '4px' }}><span style={{ color: '#10b981' }}>●</span> Running</div>
        <div style={{ marginBottom: '4px' }}><span style={{ color: '#f59e0b' }}>●</span> Active/Working</div>
        <div><span style={{ color: '#6b7280' }}>●</span> Idle</div>
      </div>

      {/* CLOSE BUTTON */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 20,
          right: '50%',
          transform: 'translateX(50%)',
          padding: '12px 30px',
          background: 'linear-gradient(135deg, #ef4444, #dc2626)',
          color: '#fff',
          border: 'none',
          borderRadius: '10px',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(239, 68, 68, 0.6)',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateX(50%) translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.8)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateX(50%) translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 15px rgba(239, 68, 68, 0.6)';
        }}
      >
        ✕ CLOSE DEMO
      </button>
    </div>
  );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function BufferStatusBar({ label, current, capacity, color }: {
  label: string;
  current: number;
  capacity: number;
  color: string;
}) {
  const percentage = (current / capacity) * 100;
  const isCritical = percentage > 80;
  const isLow = percentage < 30;

  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
        <span style={{ fontWeight: 'bold' }}>{label}</span>
        <span style={{ color: isCritical ? '#ef4444' : isLow ? '#f59e0b' : color }}>
          {current}/{capacity} totes ({Math.round(percentage)}%)
        </span>
      </div>
      <div style={{
        width: '100%',
        height: '8px',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '4px',
        overflow: 'hidden',
        border: `1px solid ${color}33`,
      }}>
        <div style={{
          width: `${percentage}%`,
          height: '100%',
          background: isCritical ? `linear-gradient(90deg, #ef4444, #dc2626)` : `linear-gradient(90deg, ${color}, ${color}88)`,
          transition: 'width 0.5s ease',
          boxShadow: isCritical ? '0 0 10px #ef4444' : `0 0 6px ${color}`,
        }} />
      </div>
    </div>
  );
}

function StationStatusItem({ label, part, time, status, color, cycleTime }: {
  label: string;
  part: string;
  time: number;
  status: string;
  color: string;
  cycleTime?: number;
}) {
  const progress = cycleTime ? ((cycleTime - time) / cycleTime) * 100 : 0;

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.05)',
      padding: '8px',
      borderRadius: '6px',
      border: `1px solid ${color}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
        <div style={{
          width: 8,
          height: 8,
          background: color,
          borderRadius: '50%',
          boxShadow: `0 0 8px ${color}`,
          animation: time > 0 ? 'pulse 1s infinite' : 'none',
        }} />
        <div style={{ fontWeight: 'bold', fontSize: '11px' }}>{label}</div>
      </div>
      {part && <div style={{ fontSize: '10px', opacity: 0.8 }}>Part: {part}</div>}
      {time > 0 && (
        <>
          <div style={{ fontSize: '10px', color: color, fontWeight: 'bold' }}>{time}s remaining</div>
          {cycleTime && (
            <div style={{
              width: '100%',
              height: '4px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '2px',
              marginTop: '4px',
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${progress}%`,
                height: '100%',
                background: `linear-gradient(90deg, ${color}, ${color}88)`,
                transition: 'width 1s linear',
                boxShadow: `0 0 6px ${color}`,
              }} />
            </div>
          )}
        </>
      )}
      <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '2px' }}>{status}</div>
    </div>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function createStripedBeltTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1C1C1C';
  ctx.fillRect(0, 0, 256, 256);

  ctx.fillStyle = '#2b2b2b';
  for (let i = 0; i < 16; i++) {
    ctx.fillRect(0, i * 16, 256, 8);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 1);

  return texture;
}
