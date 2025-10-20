/**
 * 3D Visualization Engine for DES
 * Provides Three.js-based 3D animation for simulation entities
 */

import * as THREE from 'three'

// Declare browser globals for environments where they may not be available
declare const window: any
declare const document: any
declare const requestAnimationFrame: any
declare const cancelAnimationFrame: any

export interface Position3D {
  x: number
  y: number
  z: number
}

export interface EntityVisual {
  entityId: number
  mesh: THREE.Mesh
  position: Position3D
  targetPosition: Position3D
  velocity: number
  path: Position3D[]
  pathIndex: number
  trail: Position3D[]
  maxTrailLength: number
}

export interface ResourceVisual {
  name: string
  mesh: THREE.Mesh
  position: Position3D
  queuePositions: Position3D[]
}

export class Simulation3DEngine {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private entityVisuals: Map<number, EntityVisual>
  private resourceVisuals: Map<string, ResourceVisual>
  private animationId: number | null = null
  private heatMapData: Map<string, number>

  // Camera controls
  private cameraRotation: { theta: number; phi: number; radius: number }

  constructor(canvas: any, width: number, height: number) {
    // Initialize Three.js scene
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x1a1a2e)

    // Setup camera
    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
    this.cameraRotation = { theta: 0, phi: Math.PI / 4, radius: 50 }
    this.updateCameraPosition()

    // Setup renderer
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    this.renderer.setSize(width, height)
    this.renderer.setPixelRatio(typeof window !== 'undefined' ? window.devicePixelRatio : 1)

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    this.scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(10, 20, 10)
    directionalLight.castShadow = true
    this.scene.add(directionalLight)

    // Add grid
    const gridHelper = new THREE.GridHelper(100, 50, 0x444444, 0x222222)
    this.scene.add(gridHelper)

    // Initialize maps
    this.entityVisuals = new Map()
    this.resourceVisuals = new Map()
    this.heatMapData = new Map()
  }

  /**
   * Add a resource (station, machine) to the 3D scene
   */
  addResource(name: string, position: Position3D, type: 'station' | 'machine' | 'queue' = 'station'): void {
    let geometry: THREE.BufferGeometry
    let color: number

    switch (type) {
      case 'machine':
        geometry = new THREE.BoxGeometry(2, 3, 2)
        color = 0x4a90e2
        break
      case 'queue':
        geometry = new THREE.CylinderGeometry(1, 1, 0.5, 16)
        color = 0xf39c12
        break
      default:
        geometry = new THREE.CylinderGeometry(1.5, 1.5, 2, 16)
        color = 0x50fa7b
    }

    const material = new THREE.MeshPhongMaterial({ color })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(position.x, position.y, position.z)
    mesh.castShadow = true
    mesh.receiveShadow = true
    this.scene.add(mesh)

    // Generate queue positions (circle around resource)
    const queuePositions: Position3D[] = []
    const radius = 3
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2
      queuePositions.push({
        x: position.x + Math.cos(angle) * radius,
        y: position.y,
        z: position.z + Math.sin(angle) * radius
      })
    }

    this.resourceVisuals.set(name, {
      name,
      mesh,
      position,
      queuePositions
    })

    // Add label
    this.addTextLabel(name, position)
  }

  /**
   * Add a 3D entity to the scene
   */
  addEntity(entityId: number, position: Position3D, type: 'box' | 'sphere' | 'person' = 'box'): void {
    let geometry: THREE.BufferGeometry
    let color: number

    switch (type) {
      case 'sphere':
        geometry = new THREE.SphereGeometry(0.5, 16, 16)
        color = 0xff79c6
        break
      case 'person':
        geometry = new THREE.CapsuleGeometry(0.3, 1, 8, 16)
        color = 0xbd93f9
        break
      default:
        geometry = new THREE.BoxGeometry(0.8, 0.8, 0.8)
        color = 0x8be9fd
    }

    const material = new THREE.MeshPhongMaterial({ color })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(position.x, position.y, position.z)
    mesh.castShadow = true
    this.scene.add(mesh)

    this.entityVisuals.set(entityId, {
      entityId,
      mesh,
      position: { ...position },
      targetPosition: { ...position },
      velocity: 5, // units per second
      path: [],
      pathIndex: 0,
      trail: [],
      maxTrailLength: 20
    })
  }

  /**
   * Move entity along a path
   */
  moveEntityAlongPath(entityId: number, path: Position3D[]): void {
    const visual = this.entityVisuals.get(entityId)
    if (!visual) return

    visual.path = path
    visual.pathIndex = 0
    if (path.length > 0) {
      visual.targetPosition = path[0]
    }
  }

  /**
   * Move entity to a specific position
   */
  moveEntity(entityId: number, target: Position3D, velocity: number = 5): void {
    const visual = this.entityVisuals.get(entityId)
    if (!visual) return

    visual.targetPosition = target
    visual.velocity = velocity
  }

  /**
   * Remove entity from scene
   */
  removeEntity(entityId: number): void {
    const visual = this.entityVisuals.get(entityId)
    if (!visual) return

    this.scene.remove(visual.mesh)
    this.entityVisuals.delete(entityId)
  }

  /**
   * Queue entity at resource
   */
  queueEntityAtResource(entityId: number, resourceName: string, queuePosition: number): void {
    const resource = this.resourceVisuals.get(resourceName)
    const visual = this.entityVisuals.get(entityId)

    if (!resource || !visual) return

    const targetPos = resource.queuePositions[queuePosition % resource.queuePositions.length]
    this.moveEntity(entityId, targetPos)
  }

  /**
   * Update heat map at position
   */
  updateHeatMap(position: Position3D, intensity: number): void {
    const key = `${Math.floor(position.x)},${Math.floor(position.z)}`
    this.heatMapData.set(key, (this.heatMapData.get(key) || 0) + intensity)
  }

  /**
   * Render heat map overlay
   */
  renderHeatMap(): void {
    // Clear existing heat map
    const heatMapObjects = this.scene.children.filter(obj => obj.userData.isHeatMap)
    heatMapObjects.forEach(obj => this.scene.remove(obj))

    // Find max intensity
    const maxIntensity = Math.max(...Array.from(this.heatMapData.values()))

    // Render heat map tiles
    this.heatMapData.forEach((intensity, key) => {
      const [x, z] = key.split(',').map(Number)
      const normalizedIntensity = intensity / maxIntensity

      // Color gradient: blue -> green -> yellow -> red
      const color = new THREE.Color()
      color.setHSL(0.7 - normalizedIntensity * 0.7, 1, 0.5)

      const geometry = new THREE.PlaneGeometry(1, 1)
      const material = new THREE.MeshBasicMaterial({
        color,
        opacity: normalizedIntensity * 0.7,
        transparent: true,
        side: THREE.DoubleSide
      })

      const plane = new THREE.Mesh(geometry, material)
      plane.rotation.x = -Math.PI / 2
      plane.position.set(x, 0.01, z)
      plane.userData.isHeatMap = true
      this.scene.add(plane)
    })
  }

  /**
   * Add text label to scene
   */
  private addTextLabel(text: string, position: Position3D): void {
    // Create canvas for text (skip in non-browser environments)
    if (typeof document === 'undefined') return

    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')!
    canvas.width = 256
    canvas.height = 64

    context.fillStyle = '#000000'
    context.fillRect(0, 0, canvas.width, canvas.height)

    context.font = '24px Arial'
    context.fillStyle = '#ffffff'
    context.textAlign = 'center'
    context.fillText(text, canvas.width / 2, canvas.height / 2)

    const texture = new THREE.CanvasTexture(canvas)
    const material = new THREE.SpriteMaterial({ map: texture })
    const sprite = new THREE.Sprite(material)

    sprite.position.set(position.x, position.y + 3, position.z)
    sprite.scale.set(4, 1, 1)
    this.scene.add(sprite)
  }

  /**
   * Update camera position based on rotation
   */
  private updateCameraPosition(): void {
    const { theta, phi, radius } = this.cameraRotation
    this.camera.position.x = radius * Math.sin(phi) * Math.cos(theta)
    this.camera.position.y = radius * Math.cos(phi)
    this.camera.position.z = radius * Math.sin(phi) * Math.sin(theta)
    this.camera.lookAt(0, 0, 0)
  }

  /**
   * Rotate camera
   */
  rotateCamera(deltaTheta: number, deltaPhi: number): void {
    this.cameraRotation.theta += deltaTheta
    this.cameraRotation.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this.cameraRotation.phi + deltaPhi))
    this.updateCameraPosition()
  }

  /**
   * Zoom camera
   */
  zoomCamera(delta: number): void {
    this.cameraRotation.radius = Math.max(10, Math.min(100, this.cameraRotation.radius + delta))
    this.updateCameraPosition()
  }

  /**
   * Animation loop
   */
  private animate = (): void => {
    if (typeof requestAnimationFrame !== 'undefined') {
      this.animationId = requestAnimationFrame(this.animate)
    }

    const deltaTime = 1 / 60 // Assume 60 FPS

    // Update entity positions
    this.entityVisuals.forEach(visual => {
      const dx = visual.targetPosition.x - visual.position.x
      const dy = visual.targetPosition.y - visual.position.y
      const dz = visual.targetPosition.z - visual.position.z
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)

      if (distance > 0.1) {
        // Move towards target
        const moveDistance = Math.min(visual.velocity * deltaTime, distance)
        const ratio = moveDistance / distance

        visual.position.x += dx * ratio
        visual.position.y += dy * ratio
        visual.position.z += dz * ratio

        visual.mesh.position.set(visual.position.x, visual.position.y, visual.position.z)

        // Update trail
        visual.trail.push({ ...visual.position })
        if (visual.trail.length > visual.maxTrailLength) {
          visual.trail.shift()
        }

        // Update heat map
        this.updateHeatMap(visual.position, 0.1)
      } else if (visual.path.length > 0 && visual.pathIndex < visual.path.length - 1) {
        // Move to next point in path
        visual.pathIndex++
        visual.targetPosition = visual.path[visual.pathIndex]
      }
    })

    this.renderer.render(this.scene, this.camera)
  }

  /**
   * Start animation loop
   */
  start(): void {
    if (this.animationId === null) {
      this.animate()
    }
  }

  /**
   * Stop animation loop
   */
  stop(): void {
    if (this.animationId !== null && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  /**
   * Resize renderer
   */
  resize(width: number, height: number): void {
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height)
  }

  /**
   * Clear scene
   */
  clear(): void {
    this.stop()

    // Remove all entities
    this.entityVisuals.forEach(visual => {
      this.scene.remove(visual.mesh)
    })
    this.entityVisuals.clear()

    // Remove all resources
    this.resourceVisuals.forEach(visual => {
      this.scene.remove(visual.mesh)
    })
    this.resourceVisuals.clear()

    // Clear heat map
    this.heatMapData.clear()

    // Reset camera
    this.cameraRotation = { theta: 0, phi: Math.PI / 4, radius: 50 }
    this.updateCameraPosition()
  }

  /**
   * Export scene snapshot
   */
  exportSnapshot(): string {
    return this.renderer.domElement.toDataURL('image/png')
  }
}
