import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { CatmullRomCurve3, Vector3, Matrix4, InstancedMesh } from 'three'
import { useMemo, useRef, useEffect } from 'react'

function Spline({ pts, color = '#26d07c', width = 0.05 }: { pts: [number, number, number][]; color?: string; width?: number }) {
	const curve = useMemo(() => new CatmullRomCurve3(pts.map(p => new Vector3(...p))), [pts])
	return (
		<mesh>
			<tubeGeometry args={[curve, 300, width, 8, false]} />
			<meshStandardMaterial color={color} metalness={0.1} roughness={0.6} />
		</mesh>
	)
}

function Mover({ curve, color = 'orange', size = [0.3, 0.2, 0.5] as [number, number, number], speed = 0.8, offset = 0 }) {
	const ref = useRef<any>(null)
	const length = useMemo(() => curve.getLength(), [curve])
	const t = useRef(offset)
	useFrame((_, dt) => {
		t.current = (t.current + (speed * dt) / length) % 1
		const p = curve.getPointAt(t.current)
		const tan = curve.getTangentAt(t.current)
		if (ref.current) {
			ref.current.position.copy(p)
			ref.current.lookAt(p.clone().add(tan))
		}
	})
	return (
		<mesh ref={ref} castShadow>
			<boxGeometry args={size} />
			<meshStandardMaterial color={color} roughness={0.4} metalness={0.1} />
		</mesh>
	)
}

function Conveyor({ pts, beltSpeed = 0.65 }: { pts: [number, number, number][]; beltSpeed?: number }) {
	const curve = useMemo(() => new CatmullRomCurve3(pts.map(p => new Vector3(...p))), [pts])
	return (
		<group>
			<Spline pts={pts} color="#666" width={0.08} />
			<Spline pts={pts.map(([x, y, z]) => [x, y + 0.05, z + 0.12]) as [number, number, number][]} color="#999" width={0.02} />
			<Spline pts={pts.map(([x, y, z]) => [x, y + 0.05, z - 0.12]) as [number, number, number][]} color="#999" width={0.02} />
			<Mover curve={curve} color="#2a6fdb" size={[0.32, 0.22, 0.42]} speed={beltSpeed} offset={0.00} />
			<Mover curve={curve} color="#2a6fdb" size={[0.32, 0.22, 0.42]} speed={beltSpeed} offset={0.18} />
			<Mover curve={curve} color="#2a6fdb" size={[0.32, 0.22, 0.42]} speed={beltSpeed} offset={0.36} />
			<Mover curve={curve} color="#2a6fdb" size={[0.32, 0.22, 0.42]} speed={beltSpeed} offset={0.54} />
		</group>
	)
}

function Racks({ cols = 8, rows = 4, levels = 5, spacing = [1.4, 1.2] as [number, number], origin = [-9, 0, -6] as [number, number, number] }) {
	const instRef = useRef<InstancedMesh>(null as unknown as InstancedMesh)
	useEffect(() => {
		if (!instRef.current) return
		const m = new Matrix4()
		let id = 0
		for (let c = 0; c < cols; c++) {
			for (let r = 0; r < rows; r++) {
				for (let l = 0; l < levels; l++) {
					const x = origin[0] + c * spacing[0]
					const y = 0.25 + l * 0.45
					const z = origin[2] + r * spacing[1]
					m.setPosition(x, y, z)
					instRef.current.setMatrixAt(id++, m)
				}
			}
		}
		instRef.current.instanceMatrix.needsUpdate = true
	}, [cols, rows, levels, spacing, origin])
	return (
		<instancedMesh ref={instRef} args={[undefined as any, undefined as any, cols * rows * levels]} castShadow receiveShadow>
			<boxGeometry args={[1.2, 0.35, 0.9]} />
			<meshStandardMaterial color="#caa36b" />
		</instancedMesh>
	)
}

function AGV({ route, speed = 1.2, color = '#ff8c00' }: { route: [number, number, number][]; speed?: number; color?: string }) {
	const curve = useMemo(() => new CatmullRomCurve3(route.map(p => new Vector3(...p)), true), [route])
	return (
		<group>
			<Spline pts={route} color="#2bdc6e" width={0.035} />
			<Mover curve={curve} color={color} size={[0.6, 0.35, 0.9]} speed={speed} />
		</group>
	)
}

function Worker({ loop, speed = 1.35 }: { loop: [number, number, number][]; speed?: number }) {
	const curve = useMemo(() => new CatmullRomCurve3(loop.map(p => new Vector3(...p)), true), [loop])
	return <Mover curve={curve} color="#f4c542" size={[0.25, 0.45, 0.25]} speed={speed} />
}

export default function WarehouseShowcase() {
	const main = useMemo(() => [
		[-2, 0, 6], [4, 0, 6], [8, 0, 2], [8, 0, -4], [4, 0, -7], [-2, 0, -7], [-6, 0, -3], [-6, 0, 3], [-2, 0, 6]
	] as [number, number, number][], [])
	const side = useMemo(() => [
		[10, 0, -5], [12, 0, -2], [12, 0, 2], [10, 0, 5], [8, 0, 6]
	] as [number, number, number][], [])
	const agv = useMemo(() => [
		[-7, 0, -8], [-2, 0, -8], [2, 0, -6], [6, 0, -2], [6, 0, 4], [2, 0, 7], [-3, 0, 7], [-7, 0, 2], [-7, 0, -8]
	] as [number, number, number][], [])
	const patrolA = useMemo(() => [[-1, 0, 5], [2, 0, 5], [3, 0, 2], [0, 0, 2]] as [number, number, number][], [])
	const patrolB = useMemo(() => [[7, 0, -3], [10, 0, -3], [10, 0, 1], [7, 0, 1]] as [number, number, number][], [])

	return (
		<Canvas shadows camera={{ position: [-4, 8, 14], fov: 45 }}>
			<color attach="background" args={["#101418"]} />
			<hemisphereLight intensity={0.3} />
			<directionalLight position={[8, 12, 6]} intensity={1.1} castShadow />
			<mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
				<planeGeometry args={[60, 40]} />
				<meshStandardMaterial color="#1b1f24" />
			</mesh>

			<Racks origin={[-12, 0, -7]} />
			<Racks origin={[-12, 0, 1]} />
			<Racks origin={[12, 0, -7]} />
			<Racks origin={[12, 0, 1]} />

			<Conveyor pts={main} beltSpeed={0.6} />
			<Conveyor pts={side} beltSpeed={0.6} />

			<AGV route={agv} />
			<Worker loop={patrolA} />
			<Worker loop={patrolB} />

			<Spline pts={[[-5, 0, -2], [-4, 0, -1], [-3, 0, 0]]} color="#26d07c" width={0.03} />
			<Spline pts={[[-5, 0, -3], [-4, 0, -3], [-3, 0, -3]]} color="#ff4d4f" width={0.03} />

			<OrbitControls enableDamping />
		</Canvas>
	)
}



