/**
 * Advanced Material Handling Systems
 * Implements conveyors, AGVs, transporters, and networks
 */

import { DESEngine, Entity, EventType } from './DESEngine.js'
import type { Position3D } from './Simulation3DEngine.js'

// ============================================================================
// CONVEYOR SYSTEM
// ============================================================================

export interface ConveyorSegment {
  id: string
  startPos: Position3D
  endPos: Position3D
  speed: number // units per minute
  capacity: number // max entities
  accumulating: boolean // can entities stop?
  entities: Map<number, { entity: Entity; position: number }> // position 0-1 along segment
}

export class ConveyorSystem {
  private segments: Map<string, ConveyorSegment>
  private engine: DESEngine

  constructor(engine: DESEngine) {
    this.engine = engine
    this.segments = new Map()
  }

  /**
   * Add conveyor segment
   */
  addSegment(id: string, start: Position3D, end: Position3D, speed: number, capacity: number, accumulating: boolean = true): void {
    this.segments.set(id, {
      id,
      startPos: start,
      endPos: end,
      speed,
      capacity,
      accumulating,
      entities: new Map()
    })
  }

  /**
   * Load entity onto conveyor
   */
  loadEntity(segmentId: string, entity: Entity): boolean {
    const segment = this.segments.get(segmentId)
    if (!segment) return false

    if (segment.entities.size >= segment.capacity) {
      return false // Conveyor full
    }

    segment.entities.set(entity.id, { entity, position: 0 })

    // Calculate travel time
    const distance = this.calculateDistance(segment.startPos, segment.endPos)
    const travelTime = distance / segment.speed

    // Schedule arrival at end of conveyor
    this.engine.scheduleEvent(travelTime, EventType.END_TRAVEL, entity, undefined, {
      segmentId,
      type: 'conveyor'
    })

    return true
  }

  /**
   * Unload entity from conveyor
   */
  unloadEntity(segmentId: string, entityId: number): Entity | undefined {
    const segment = this.segments.get(segmentId)
    if (!segment) return undefined

    const entityData = segment.entities.get(entityId)
    if (!entityData) return undefined

    segment.entities.delete(entityId)
    return entityData.entity
  }

  /**
   * Get entity position on conveyor (for visualization)
   */
  getEntityPosition(segmentId: string, entityId: number): Position3D | undefined {
    const segment = this.segments.get(segmentId)
    if (!segment) return undefined

    const entityData = segment.entities.get(entityId)
    if (!entityData) return undefined

    // Interpolate position
    const { startPos, endPos } = segment
    const t = entityData.position

    return {
      x: startPos.x + (endPos.x - startPos.x) * t,
      y: startPos.y + (endPos.y - startPos.y) * t,
      z: startPos.z + (endPos.z - startPos.z) * t
    }
  }

  /**
   * Update entity positions (called during simulation)
   */
  updatePositions(deltaTime: number): void {
    this.segments.forEach(segment => {
      segment.entities.forEach((entityData, entityId) => {
        const distance = this.calculateDistance(segment.startPos, segment.endPos)
        const deltaPosition = (segment.speed * deltaTime) / distance

        entityData.position = Math.min(1, entityData.position + deltaPosition)

        // Check for accumulation
        if (segment.accumulating) {
          // Check if blocked by entity ahead
          let blockedDistance = Infinity
          segment.entities.forEach((otherData, otherId) => {
            if (otherId !== entityId && otherData.position > entityData.position) {
              const gap = otherData.position - entityData.position
              if (gap < blockedDistance) {
                blockedDistance = gap
              }
            }
          })

          // Stop if too close
          if (blockedDistance < 0.1) {
            entityData.position = Math.min(entityData.position, entityData.position - deltaPosition)
          }
        }
      })
    })
  }

  private calculateDistance(start: Position3D, end: Position3D): number {
    const dx = end.x - start.x
    const dy = end.y - start.y
    const dz = end.z - start.z
    return Math.sqrt(dx * dx + dy * dy + dz * dz)
  }
}

// ============================================================================
// AGV (AUTOMATED GUIDED VEHICLE) SYSTEM
// ============================================================================

export interface AGVVehicle {
  id: string
  currentPosition: Position3D
  targetPosition: Position3D
  speed: number
  capacity: number
  currentLoad: Entity[]
  state: 'idle' | 'traveling' | 'loading' | 'unloading'
  batteryLevel: number // 0-100
}

export interface AGVNetwork {
  nodes: Map<string, Position3D>
  edges: Map<string, { from: string; to: string; distance: number }>
}

export class AGVSystem {
  private vehicles: Map<string, AGVVehicle>
  private network: AGVNetwork
  private engine: DESEngine
  private dispatchQueue: Array<{ entity: Entity; from: string; to: string }>

  constructor(engine: DESEngine) {
    this.engine = engine
    this.vehicles = new Map()
    this.network = { nodes: new Map(), edges: new Map() }
    this.dispatchQueue = []
  }

  /**
   * Add AGV vehicle
   */
  addVehicle(id: string, position: Position3D, speed: number, capacity: number): void {
    this.vehicles.set(id, {
      id,
      currentPosition: position,
      targetPosition: position,
      speed,
      capacity,
      currentLoad: [],
      state: 'idle',
      batteryLevel: 100
    })
  }

  /**
   * Add network node
   */
  addNode(nodeId: string, position: Position3D): void {
    this.network.nodes.set(nodeId, position)
  }

  /**
   * Add network edge
   */
  addEdge(edgeId: string, from: string, to: string): void {
    const fromPos = this.network.nodes.get(from)
    const toPos = this.network.nodes.get(to)

    if (!fromPos || !toPos) return

    const distance = this.calculateDistance(fromPos, toPos)
    this.network.edges.set(edgeId, { from, to, distance })
  }

  /**
   * Request AGV transport
   */
  requestTransport(entity: Entity, _fromNode: string, toNode: string): boolean {
    // Add to dispatch queue
    this.dispatchQueue.push({ entity, from: _fromNode, to: toNode })

    // Try to dispatch immediately
    return this.dispatchNextRequest()
  }

  /**
   * Dispatch next request to available AGV
   */
  private dispatchNextRequest(): boolean {
    if (this.dispatchQueue.length === 0) return false

    // Find available AGV
    const availableAGV = this.findAvailableAGV()
    if (!availableAGV) return false

    const request = this.dispatchQueue.shift()!
    this.assignAGV(availableAGV, request.entity, request.from, request.to)

    return true
  }

  /**
   * Find available AGV using dispatching rule
   */
  private findAvailableAGV(): AGVVehicle | undefined {
    let bestAGV: AGVVehicle | undefined
    let minDistance = Infinity

    this.vehicles.forEach(agv => {
      if (agv.state === 'idle' && agv.currentLoad.length < agv.capacity) {
        // Use closest available AGV
        const distance = 0 // Calculate distance to pickup point
        if (distance < minDistance) {
          minDistance = distance
          bestAGV = agv
        }
      }
    })

    return bestAGV
  }

  /**
   * Assign AGV to transport task
   */
  private assignAGV(agv: AGVVehicle, entity: Entity, _fromNode: string, toNode: string): void {
    agv.state = 'traveling'
    agv.currentLoad.push(entity)

    // Find path from current position to toNode (fromNode is pickup location)
    const path = this.findShortestPath(this.getClosestNode(agv.currentPosition), toNode)

    if (path.length === 0) return

    // Calculate total travel time
    let totalTime = 0
    for (let i = 0; i < path.length - 1; i++) {
      const edge = this.findEdge(path[i], path[i + 1])
      if (edge) {
        totalTime += edge.distance / agv.speed
      }
    }

    // Schedule arrival
    this.engine.scheduleEvent(totalTime, EventType.END_TRAVEL, entity, undefined, {
      agvId: agv.id,
      type: 'agv',
      toNode
    })

    agv.targetPosition = this.network.nodes.get(toNode)!
  }

  /**
   * Find shortest path using Dijkstra's algorithm
   */
  private findShortestPath(start: string, end: string): string[] {
    const distances = new Map<string, number>()
    const previous = new Map<string, string>()
    const unvisited = new Set(this.network.nodes.keys())

    // Initialize distances
    this.network.nodes.forEach((_, nodeId) => {
      distances.set(nodeId, nodeId === start ? 0 : Infinity)
    })

    while (unvisited.size > 0) {
      // Find node with minimum distance
      let currentNode: string | undefined
      let minDist = Infinity

      unvisited.forEach(nodeId => {
        const dist = distances.get(nodeId)!
        if (dist < minDist) {
          minDist = dist
          currentNode = nodeId
        }
      })

      if (!currentNode || currentNode === end) break

      unvisited.delete(currentNode)

      // Update neighbors
      this.network.edges.forEach(edge => {
        if (edge.from === currentNode && unvisited.has(edge.to)) {
          const newDist = distances.get(currentNode!)! + edge.distance
          if (newDist < distances.get(edge.to)!) {
            distances.set(edge.to, newDist)
            previous.set(edge.to, currentNode!)
          }
        }
      })
    }

    // Reconstruct path
    const path: string[] = []
    let current: string | undefined = end

    while (current) {
      path.unshift(current)
      current = previous.get(current)
    }

    return path
  }

  /**
   * Find edge between two nodes
   */
  private findEdge(from: string, to: string): { from: string; to: string; distance: number } | undefined {
    let foundEdge: { from: string; to: string; distance: number } | undefined

    this.network.edges.forEach(edge => {
      if (edge.from === from && edge.to === to) {
        foundEdge = edge
      }
    })

    return foundEdge
  }

  /**
   * Get closest node to position
   */
  private getClosestNode(position: Position3D): string {
    let closestNode = ''
    let minDistance = Infinity

    this.network.nodes.forEach((nodePos, nodeId) => {
      const distance = this.calculateDistance(position, nodePos)
      if (distance < minDistance) {
        minDistance = distance
        closestNode = nodeId
      }
    })

    return closestNode
  }

  /**
   * Update AGV states
   */
  update(deltaTime: number): void {
    this.vehicles.forEach(agv => {
      if (agv.state === 'traveling') {
        // Move towards target
        const distance = this.calculateDistance(agv.currentPosition, agv.targetPosition)
        if (distance < 0.1) {
          agv.state = 'idle'
          agv.currentPosition = agv.targetPosition

          // Try to dispatch next request
          this.dispatchNextRequest()
        } else {
          // Move incrementally
          const moveDistance = Math.min(agv.speed * deltaTime, distance)
          const ratio = moveDistance / distance

          agv.currentPosition.x += (agv.targetPosition.x - agv.currentPosition.x) * ratio
          agv.currentPosition.y += (agv.targetPosition.y - agv.currentPosition.y) * ratio
          agv.currentPosition.z += (agv.targetPosition.z - agv.currentPosition.z) * ratio
        }

        // Drain battery
        agv.batteryLevel -= 0.01 * deltaTime
      }
    })
  }

  private calculateDistance(start: Position3D, end: Position3D): number {
    const dx = end.x - start.x
    const dy = end.y - start.y
    const dz = end.z - start.z
    return Math.sqrt(dx * dx + dy * dy + dz * dz)
  }

  /**
   * Get all vehicles (for visualization)
   */
  getVehicles(): Map<string, AGVVehicle> {
    return this.vehicles
  }
}

// ============================================================================
// TRANSPORTER SYSTEM (Forklifts, Trucks)
// ============================================================================

export interface Transporter {
  id: string
  type: 'forklift' | 'truck' | 'crane'
  position: Position3D
  capacity: number
  currentLoad: Entity[]
  speed: number
  state: 'idle' | 'busy'
}

export class TransporterSystem {
  private transporters: Map<string, Transporter>
  private engine: DESEngine

  constructor(engine: DESEngine) {
    this.engine = engine
    this.transporters = new Map()
  }

  /**
   * Add transporter
   */
  addTransporter(id: string, type: 'forklift' | 'truck' | 'crane', position: Position3D, capacity: number, speed: number): void {
    this.transporters.set(id, {
      id,
      type,
      position,
      capacity,
      currentLoad: [],
      speed,
      state: 'idle'
    })
  }

  /**
   * Request transport
   */
  requestTransport(entity: Entity, from: Position3D, to: Position3D): boolean {
    // Find available transporter
    const transporter = this.findAvailableTransporter()
    if (!transporter) return false

    transporter.state = 'busy'
    transporter.currentLoad.push(entity)

    // Calculate travel time
    const pickupDistance = this.calculateDistance(transporter.position, from)
    const deliveryDistance = this.calculateDistance(from, to)
    const totalTime = (pickupDistance + deliveryDistance) / transporter.speed

    // Schedule delivery
    this.engine.scheduleEvent(totalTime, EventType.END_TRAVEL, entity, undefined, {
      transporterId: transporter.id,
      type: 'transporter'
    })

    transporter.position = to

    return true
  }

  /**
   * Release transporter
   */
  releaseTransporter(transporterId: string, entity: Entity): void {
    const transporter = this.transporters.get(transporterId)
    if (!transporter) return

    transporter.currentLoad = transporter.currentLoad.filter(e => e.id !== entity.id)

    if (transporter.currentLoad.length === 0) {
      transporter.state = 'idle'
    }
  }

  /**
   * Find available transporter
   */
  private findAvailableTransporter(): Transporter | undefined {
    for (const transporter of this.transporters.values()) {
      if (transporter.state === 'idle') {
        return transporter
      }
    }
    return undefined
  }

  private calculateDistance(start: Position3D, end: Position3D): number {
    const dx = end.x - start.x
    const dy = end.y - start.y
    const dz = end.z - start.z
    return Math.sqrt(dx * dx + dy * dy + dz * dz)
  }

  /**
   * Get all transporters (for visualization)
   */
  getTransporters(): Map<string, Transporter> {
    return this.transporters
  }
}
