import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Html } from '@react-three/drei';
import * as THREE from 'three';

// ============================================================================
// 3D COMPONENT LIBRARY - BUILDABLE ENTITIES
// ============================================================================

export interface Component3DProps {
  position: [number, number, number];
  resource: any;
  onClick?: () => void;
  scale?: number;
}

// ============================================================================
// MANUFACTURING MACHINES
// ============================================================================

// CNC Machine
export function CNCMachine3D({ position, resource, onClick, scale = 1 }: Component3DProps) {
  const meshRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current && resource.utilization > 0) {
      // Vibration effect when processing
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 20) * 0.02;
    }
  });

  return (
    <group ref={meshRef} position={position} scale={scale}>
      {/* Base */}
      <mesh position={[0, -0.3, 0]}>
        <boxGeometry args={[2, 0.4, 1.5]} />
        <meshStandardMaterial color="#2d3748" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Main body */}
      <mesh
        position={[0, 0.3, 0]}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[1.6, 1.2, 1.2]} />
        <meshStandardMaterial
          color={hovered ? '#4299e1' : '#4a5568'}
          metalness={0.7}
          roughness={0.4}
        />
      </mesh>

      {/* Spindle */}
      <mesh position={[0, 0.9, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.6, 16]} />
        <meshStandardMaterial color="#cbd5e0" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Control panel */}
      <mesh position={[0.9, 0.5, 0]}>
        <boxGeometry args={[0.1, 0.6, 0.8]} />
        <meshStandardMaterial color="#1a202c" emissive="#4299e1" emissiveIntensity={0.2} />
      </mesh>

      {/* Status light */}
      <mesh position={[0, 1.2, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial
          color={resource.queueLength > 0 ? '#f6ad55' : '#48bb78'}
          emissive={resource.queueLength > 0 ? '#f6ad55' : '#48bb78'}
          emissiveIntensity={1}
        />
      </mesh>

      {/* Label */}
      <Text position={[0, 1.6, 0]} fontSize={0.2} color="#ffffff">
        🏭 {resource.name}
      </Text>
    </group>
  );
}

// Assembly Station
export function AssemblyStation3D({ position, resource, onClick, scale = 1 }: Component3DProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <group position={position} scale={scale}>
      {/* Workbench */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[2.5, 0.2, 1.5]} />
        <meshStandardMaterial color="#8b4513" roughness={0.6} />
      </mesh>

      {/* Legs */}
      {[
        [-1, -0.5, 0.6],
        [1, -0.5, 0.6],
        [-1, -0.5, -0.6],
        [1, -0.5, -0.6],
      ].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]}>
          <cylinderGeometry args={[0.08, 0.08, 1, 8]} />
          <meshStandardMaterial color="#654321" />
        </mesh>
      ))}

      {/* Assembly fixture */}
      <mesh
        position={[0, 0.5, 0]}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial
          color={hovered ? '#4299e1' : '#718096'}
          wireframe
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Tools */}
      <mesh position={[0.8, 0.3, 0]}>
        <boxGeometry args={[0.3, 0.1, 0.5]} />
        <meshStandardMaterial color="#e53e3e" />
      </mesh>

      <Text position={[0, 1.2, 0]} fontSize={0.2} color="#ffffff">
        🔧 {resource.name}
      </Text>
    </group>
  );
}

// Quality Control Station
export function QualityControlStation3D({ position, resource, onClick, scale = 1 }: Component3DProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <group position={position} scale={scale}>
      {/* Base platform */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[1.2, 1.2, 0.3, 32]} />
        <meshStandardMaterial color="#2d3748" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Scanner frame */}
      <mesh position={[0, 0.8, 0]}>
        <torusGeometry args={[0.7, 0.08, 16, 32]} />
        <meshStandardMaterial color="#4299e1" emissive="#4299e1" emissiveIntensity={0.3} />
      </mesh>

      {/* Inspection light */}
      <pointLight position={[0, 1.2, 0]} intensity={0.5} color="#4299e1" />

      {/* Display panel */}
      <mesh
        position={[0, 0.5, 0.9]}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[0.6, 0.4, 0.05]} />
        <meshStandardMaterial
          color={hovered ? '#48bb78' : '#1a202c'}
          emissive="#48bb78"
          emissiveIntensity={hovered ? 0.5 : 0.2}
        />
      </mesh>

      <Text position={[0, 1.5, 0]} fontSize={0.2} color="#ffffff">
        ✓ {resource.name}
      </Text>
    </group>
  );
}

// ============================================================================
// MATERIAL HANDLING
// ============================================================================

// Robot Arm
export function RobotArm3D({ position, resource, onClick, scale = 1 }: Component3DProps) {
  const armRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (armRef.current && resource.utilization > 0) {
      // Rotate arm when active
      armRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 2) * 0.5;
    }
  });

  return (
    <group position={position} scale={scale}>
      {/* Base */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.5, 0.6, 0.4, 32]} />
        <meshStandardMaterial color="#2d3748" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Rotating arm assembly */}
      <group ref={armRef} position={[0, 0.3, 0]}>
        {/* Lower arm */}
        <mesh position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 1, 16]} />
          <meshStandardMaterial color="#f6ad55" metalness={0.7} roughness={0.3} />
        </mesh>

        {/* Upper arm */}
        <mesh position={[0, 1.2, 0.3]}>
          <cylinderGeometry args={[0.12, 0.12, 0.8, 16]} />
          <meshStandardMaterial color="#f6ad55" metalness={0.7} roughness={0.3} />
        </mesh>

        {/* Gripper */}
        <mesh
          position={[0, 1.6, 0.3]}
          onClick={onClick}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          <boxGeometry args={[0.3, 0.2, 0.15]} />
          <meshStandardMaterial
            color={hovered ? '#4299e1' : '#4a5568'}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
      </group>

      <Text position={[0, 2.2, 0]} fontSize={0.2} color="#ffffff">
        🤖 {resource.name}
      </Text>
    </group>
  );
}

// Conveyor Belt System
export function ConveyorBeltSystem3D({ position, resource, onClick, scale = 1 }: Component3DProps) {
  const beltRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (beltRef.current) {
      // Scroll texture to simulate belt movement
      beltRef.current.position.z = (state.clock.elapsedTime * 0.5) % 1;
    }
  });

  return (
    <group position={position} scale={scale}>
      {/* Frame */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.8, 0.3, 3]} />
        <meshStandardMaterial color="#4a5568" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Belt surface */}
      <mesh
        ref={beltRef}
        position={[0, 0.2, 0]}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[0.7, 0.05, 2.8]} />
        <meshStandardMaterial
          color={hovered ? '#4299e1' : '#1a202c'}
          roughness={0.7}
        />
      </mesh>

      {/* Rollers */}
      {[-1.2, 0, 1.2].map((z, i) => (
        <mesh key={i} position={[0, 0, z]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.08, 0.08, 0.9, 16]} />
          <meshStandardMaterial color="#cbd5e0" metalness={0.8} roughness={0.2} />
        </mesh>
      ))}

      <Text position={[0, 0.6, 0]} fontSize={0.15} color="#ffffff">
        ➡️ {resource.name}
      </Text>
    </group>
  );
}

// AGV (Automated Guided Vehicle)
export function AGV3D({ position, resource, onClick, scale = 1 }: Component3DProps) {
  const vehicleRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (vehicleRef.current && resource.utilization > 0) {
      // Gentle hovering motion
      vehicleRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 3) * 0.05;
    }
  });

  return (
    <group ref={vehicleRef} position={position} scale={scale}>
      {/* Chassis */}
      <mesh
        position={[0, 0.2, 0]}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[1.2, 0.4, 0.8]} />
        <meshStandardMaterial
          color={hovered ? '#f6ad55' : '#4a5568'}
          metalness={0.6}
          roughness={0.4}
        />
      </mesh>

      {/* Wheels */}
      {[
        [-0.5, -0.1, 0.5],
        [0.5, -0.1, 0.5],
        [-0.5, -0.1, -0.5],
        [0.5, -0.1, -0.5],
      ].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.15, 0.15, 0.2, 16]} />
          <meshStandardMaterial color="#1a202c" />
        </mesh>
      ))}

      {/* Sensor */}
      <mesh position={[0, 0.5, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#4299e1" emissive="#4299e1" emissiveIntensity={0.8} />
      </mesh>

      <Text position={[0, 0.8, 0]} fontSize={0.15} color="#ffffff">
        🚛 {resource.name}
      </Text>
    </group>
  );
}

// ============================================================================
// STORAGE & BUFFERS
// ============================================================================

// Buffer Queue
export function BufferQueue3D({ position, resource, onClick, scale = 1 }: Component3DProps) {
  const [hovered, setHovered] = useState(false);
  const queueLength = resource.queueLength || 0;

  return (
    <group position={position} scale={scale}>
      {/* Base platform */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[2, 0.2, 1.5]} />
        <meshStandardMaterial color="#2d3748" />
      </mesh>

      {/* Queue slots */}
      {Array.from({ length: Math.min(queueLength, 5) }).map((_, i) => (
        <mesh key={i} position={[-0.6 + i * 0.4, 0.3, 0]}>
          <boxGeometry args={[0.3, 0.4, 0.3]} />
          <meshStandardMaterial
            color="#4299e1"
            transparent
            opacity={0.6}
            emissive="#4299e1"
            emissiveIntensity={0.3}
          />
        </mesh>
      ))}

      {/* Capacity indicator */}
      <mesh
        position={[0, 0.7, 0]}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <cylinderGeometry args={[0.3, 0.3, 0.1, 32]} />
        <meshStandardMaterial
          color={hovered ? '#48bb78' : '#4a5568'}
          emissive="#48bb78"
          emissiveIntensity={queueLength > 0 ? 0.5 : 0}
        />
      </mesh>

      <Text position={[0, 1.0, 0]} fontSize={0.2} color="#ffffff">
        📦 {resource.name} ({queueLength})
      </Text>
    </group>
  );
}

// Warehouse
export function Warehouse3D({ position, resource, onClick, scale = 1 }: Component3DProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <group position={position} scale={scale}>
      {/* Building structure */}
      <mesh position={[0, 0.8, 0]}>
        <boxGeometry args={[3, 1.6, 2]} />
        <meshStandardMaterial color="#4a5568" metalness={0.3} roughness={0.7} />
      </mesh>

      {/* Roof */}
      <mesh position={[0, 1.7, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[2.3, 0.4, 4]} />
        <meshStandardMaterial color="#2d3748" />
      </mesh>

      {/* Door */}
      <mesh
        position={[0, 0.5, 1.05]}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[0.8, 1, 0.1]} />
        <meshStandardMaterial
          color={hovered ? '#4299e1' : '#1a202c'}
          metalness={0.5}
        />
      </mesh>

      {/* Windows */}
      {[-0.8, 0.8].map((x, i) => (
        <mesh key={i} position={[x, 1.2, 1.05]}>
          <boxGeometry args={[0.4, 0.3, 0.05]} />
          <meshStandardMaterial color="#4299e1" emissive="#4299e1" emissiveIntensity={0.2} />
        </mesh>
      ))}

      <Text position={[0, 2.2, 0]} fontSize={0.25} color="#ffffff">
        🏢 {resource.name}
      </Text>
    </group>
  );
}

// ============================================================================
// COMPONENT LIBRARY REGISTRY
// ============================================================================

export const ComponentLibrary = {
  // Machines
  CNCMachine: CNCMachine3D,
  AssemblyStation: AssemblyStation3D,
  QualityControl: QualityControlStation3D,

  // Material Handling
  RobotArm: RobotArm3D,
  ConveyorBelt: ConveyorBeltSystem3D,
  AGV: AGV3D,

  // Storage
  Buffer: BufferQueue3D,
  Warehouse: Warehouse3D,
};

export const ComponentCatalog = [
  {
    category: '🏭 Manufacturing Machines',
    components: [
      { name: 'CNCMachine', label: 'CNC Machine', icon: '🏭' },
      { name: 'AssemblyStation', label: 'Assembly Station', icon: '🔧' },
      { name: 'QualityControl', label: 'Quality Control', icon: '✓' },
    ],
  },
  {
    category: '🤖 Material Handling',
    components: [
      { name: 'RobotArm', label: 'Robot Arm', icon: '🤖' },
      { name: 'ConveyorBelt', label: 'Conveyor Belt', icon: '➡️' },
      { name: 'AGV', label: 'AGV', icon: '🚛' },
    ],
  },
  {
    category: '📦 Storage & Buffers',
    components: [
      { name: 'Buffer', label: 'Buffer Queue', icon: '📦' },
      { name: 'Warehouse', label: 'Warehouse', icon: '🏢' },
    ],
  },
];
