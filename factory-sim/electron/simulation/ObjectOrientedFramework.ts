/**
 * Object-Oriented Modeling Framework
 * Provides reusable simulation objects, hierarchical models, and templates
 */

import { DESEngine, Entity, EventType } from './DESEngine.js'
import type { Position3D } from './Simulation3DEngine.js'

// ============================================================================
// BASE SIMULATION OBJECT
// ============================================================================

export abstract class SimulationObject {
  id: string
  name: string
  position: Position3D
  properties: Map<string, any>
  parent: SimulationObject | null
  children: SimulationObject[]

  constructor(id: string, name: string, position: Position3D) {
    this.id = id
    this.name = name
    this.position = position
    this.properties = new Map()
    this.parent = null
    this.children = []
  }

  /**
   * Add child object (hierarchical modeling)
   */
  addChild(child: SimulationObject): void {
    this.children.push(child)
    child.parent = this
  }

  /**
   * Remove child object
   */
  removeChild(childId: string): void {
    this.children = this.children.filter(c => c.id !== childId)
  }

  /**
   * Get all descendants
   */
  getAllDescendants(): SimulationObject[] {
    const descendants: SimulationObject[] = []

    this.children.forEach(child => {
      descendants.push(child)
      descendants.push(...child.getAllDescendants())
    })

    return descendants
  }

  /**
   * Set property
   */
  setProperty(key: string, value: any): void {
    this.properties.set(key, value)
  }

  /**
   * Get property
   */
  getProperty(key: string): any {
    return this.properties.get(key)
  }

  /**
   * Initialize object (override in subclasses)
   */
  abstract initialize(engine: DESEngine): void

  /**
   * Process event (override in subclasses)
   */
  abstract onEvent(event: any, engine: DESEngine): void

  /**
   * Clone object (for templates)
   */
  abstract clone(): SimulationObject
}

// ============================================================================
// STANDARD OBJECTS
// ============================================================================

/**
 * Source - Generates entities
 */
export class Source extends SimulationObject {
  entityType: string
  interarrivalTime: number | (() => number)
  maxArrivals: number
  currentArrivals: number

  constructor(id: string, name: string, position: Position3D, entityType: string, interarrivalTime: number) {
    super(id, name, position)
    this.entityType = entityType
    this.interarrivalTime = interarrivalTime
    this.maxArrivals = Infinity
    this.currentArrivals = 0
  }

  initialize(engine: DESEngine): void {
    this.scheduleNextArrival(engine, 0)
  }

  private scheduleNextArrival(engine: DESEngine, delay: number): void {
    if (this.currentArrivals >= this.maxArrivals) return

    engine.scheduleEvent(delay, EventType.ARRIVAL, undefined, undefined, {
      sourceId: this.id,
      entityType: this.entityType
    })
  }

  onEvent(event: any, engine: DESEngine): void {
    if (event.type === EventType.ARRIVAL) {
      const entity = engine.createEntity(this.entityType)
      entity.setAttribute('sourceId', this.id)
      entity.setAttribute('creationTime', engine.clock)

      this.currentArrivals++

      // Schedule next arrival
      const delay = typeof this.interarrivalTime === 'function'
        ? this.interarrivalTime()
        : this.interarrivalTime

      this.scheduleNextArrival(engine, delay)

      // Notify next object in flow
      this.onEntityCreated(entity, engine)
    }
  }

  protected onEntityCreated(_entity: Entity, _engine: DESEngine): void {
    // Override in subclass or use connections
  }

  clone(): SimulationObject {
    return new Source(this.id + '_copy', this.name, {...this.position}, this.entityType, this.interarrivalTime as number)
  }
}

/**
 * Server - Processes entities with a resource
 */
export class Server extends SimulationObject {
  resourceName: string
  capacity: number
  processingTime: number | ((entity: Entity) => number)

  constructor(id: string, name: string, position: Position3D, resourceName: string, capacity: number, processingTime: number) {
    super(id, name, position)
    this.resourceName = resourceName
    this.capacity = capacity
    this.processingTime = processingTime
  }

  initialize(engine: DESEngine): void {
    engine.addResource(this.resourceName, this.capacity)
  }

  onEvent(event: any, engine: DESEngine): void {
    if (event.type === EventType.ARRIVAL && event.data?.serverId === this.id) {
      this.processEntity(event.entity!, engine)
    } else if (event.type === EventType.END_SERVICE && event.data?.serverId === this.id) {
      this.releaseEntity(event.entity!, engine)
    }
  }

  private processEntity(entity: Entity, engine: DESEngine): void {
    const resource = engine.getResource(this.resourceName)
    if (!resource) return

    if (resource.isAvailable()) {
      resource.seize(entity, engine.clock)

      const delay = typeof this.processingTime === 'function'
        ? this.processingTime(entity)
        : this.processingTime

      engine.scheduleEvent(delay, EventType.END_SERVICE, entity, resource, {
        serverId: this.id
      })
    } else {
      resource.addToQueue(entity, engine.clock)
    }
  }

  private releaseEntity(entity: Entity, engine: DESEngine): void {
    const resource = engine.getResource(this.resourceName)
    if (!resource) return

    resource.release(entity, engine.clock)

    // Process next entity in queue
    if (resource.getQueueLength() > 0) {
      const nextEntity = resource.removeFromQueue(engine.clock)!
      this.processEntity(nextEntity, engine)
    }

    // Notify next object
    this.onEntityProcessed(entity, engine)
  }

  protected onEntityProcessed(_entity: Entity, _engine: DESEngine): void {
    // Override in subclass or use connections
  }

  clone(): SimulationObject {
    return new Server(this.id + '_copy', this.name, {...this.position}, this.resourceName, this.capacity, this.processingTime as number)
  }
}

/**
 * Sink - Destroys entities (exit point)
 */
export class Sink extends SimulationObject {
  entitiesDestroyed: number

  constructor(id: string, name: string, position: Position3D) {
    super(id, name, position)
    this.entitiesDestroyed = 0
  }

  initialize(_engine: DESEngine): void {
    // Nothing to initialize
  }

  onEvent(event: any, engine: DESEngine): void {
    if (event.type === 'ENTITY_ARRIVAL' && event.data?.sinkId === this.id) {
      this.destroyEntity(event.entity!, engine)
    }
  }

  private destroyEntity(entity: Entity, engine: DESEngine): void {
    const cycleTime = engine.clock - entity.createTime
    engine.recordObservation('cycleTime', cycleTime)
    engine.recordObservation('throughput', 1)

    engine.entities.delete(entity.id)
    this.entitiesDestroyed++
  }

  clone(): SimulationObject {
    return new Sink(this.id + '_copy', this.name, {...this.position})
  }
}

/**
 * Combiner - Combines multiple entities into one
 */
export class Combiner extends SimulationObject {
  batchSize: number
  currentBatch: Entity[]
  memberMatchExpression?: string

  constructor(id: string, name: string, position: Position3D, batchSize: number) {
    super(id, name, position)
    this.batchSize = batchSize
    this.currentBatch = []
  }

  initialize(_engine: DESEngine): void {
    this.currentBatch = []
  }

  onEvent(event: any, engine: DESEngine): void {
    if (event.type === 'ENTITY_ARRIVAL' && event.data?.combinerId === this.id) {
      this.addToBatch(event.entity!, engine)
    }
  }

  private addToBatch(entity: Entity, engine: DESEngine): void {
    this.currentBatch.push(entity)

    if (this.currentBatch.length >= this.batchSize) {
      // Create combined entity
      const combinedEntity = engine.createEntity('Batch')
      combinedEntity.setAttribute('batchMembers', [...this.currentBatch])
      combinedEntity.setAttribute('batchSize', this.batchSize)
      combinedEntity.setAttribute('creationTime', engine.clock)

      // Clear batch
      this.currentBatch = []

      // Send combined entity
      this.onBatchComplete(combinedEntity, engine)
    }
  }

  protected onBatchComplete(_batchEntity: Entity, _engine: DESEngine): void {
    // Override in subclass or use connections
  }

  clone(): SimulationObject {
    return new Combiner(this.id + '_copy', this.name, {...this.position}, this.batchSize)
  }
}

/**
 * Separator - Splits one entity into multiple
 */
export class Separator extends SimulationObject {
  splitCount: number

  constructor(id: string, name: string, position: Position3D, splitCount: number) {
    super(id, name, position)
    this.splitCount = splitCount
  }

  initialize(_engine: DESEngine): void {
    // Nothing to initialize
  }

  onEvent(event: any, engine: DESEngine): void {
    if (event.type === 'ENTITY_ARRIVAL' && event.data?.separatorId === this.id) {
      this.splitEntity(event.entity!, engine)
    }
  }

  private splitEntity(entity: Entity, engine: DESEngine): void {
    // Destroy original
    engine.entities.delete(entity.id)

    // Create split entities
    for (let i = 0; i < this.splitCount; i++) {
      const newEntity = engine.createEntity(entity.type)
      newEntity.setAttribute('parentEntityId', entity.id)
      newEntity.setAttribute('splitIndex', i)
      newEntity.setAttribute('creationTime', engine.clock)

      // Copy some attributes
      entity.attributes.forEach((value, key) => {
        if (key !== 'id') {
          newEntity.setAttribute(key, value)
        }
      })

      this.onEntitySplit(newEntity, engine)
    }
  }

  protected onEntitySplit(_entity: Entity, _engine: DESEngine): void {
    // Override in subclass or use connections
  }

  clone(): SimulationObject {
    return new Separator(this.id + '_copy', this.name, {...this.position}, this.splitCount)
  }
}

/**
 * Decide - Routes entity based on conditions
 */
export class Decide extends SimulationObject {
  condition: (entity: Entity) => boolean
  truePath?: string
  falsePath?: string

  constructor(id: string, name: string, position: Position3D, condition: (entity: Entity) => boolean) {
    super(id, name, position)
    this.condition = condition
  }

  initialize(_engine: DESEngine): void {
    // Nothing to initialize
  }

  onEvent(event: any, engine: DESEngine): void {
    if (event.type === 'ENTITY_ARRIVAL' && event.data?.decideId === this.id) {
      this.routeEntity(event.entity!, engine)
    }
  }

  private routeEntity(entity: Entity, engine: DESEngine): void {
    const result = this.condition(entity)

    if (result) {
      this.onTruePath(entity, engine)
    } else {
      this.onFalsePath(entity, engine)
    }
  }

  protected onTruePath(_entity: Entity, _engine: DESEngine): void {
    // Override in subclass or use connections
  }

  protected onFalsePath(_entity: Entity, _engine: DESEngine): void {
    // Override in subclass or use connections
  }

  clone(): SimulationObject {
    return new Decide(this.id + '_copy', this.name, {...this.position}, this.condition)
  }
}

// ============================================================================
// OBJECT LIBRARY
// ============================================================================

export class ObjectLibrary {
  private templates: Map<string, SimulationObject>

  constructor() {
    this.templates = new Map()
  }

  /**
   * Add template to library
   */
  addTemplate(name: string, template: SimulationObject): void {
    this.templates.set(name, template)
  }

  /**
   * Get template by name
   */
  getTemplate(name: string): SimulationObject | undefined {
    return this.templates.get(name)
  }

  /**
   * Create instance from template
   */
  createInstance(templateName: string, newId: string, newPosition: Position3D): SimulationObject | undefined {
    const template = this.templates.get(templateName)
    if (!template) return undefined

    const instance = template.clone()
    instance.id = newId
    instance.position = newPosition

    return instance
  }

  /**
   * List all templates
   */
  listTemplates(): string[] {
    return Array.from(this.templates.keys())
  }
}

// ============================================================================
// MODEL COMPOSER
// ============================================================================

export class ModelComposer {
  private objects: Map<string, SimulationObject>
  private connections: Map<string, string[]> // objectId -> [targetIds]

  constructor() {
    this.objects = new Map()
    this.connections = new Map()
  }

  /**
   * Add object to model
   */
  addObject(obj: SimulationObject): void {
    this.objects.set(obj.id, obj)
  }

  /**
   * Connect two objects
   */
  connect(sourceId: string, targetId: string): void {
    if (!this.connections.has(sourceId)) {
      this.connections.set(sourceId, [])
    }

    this.connections.get(sourceId)!.push(targetId)
  }

  /**
   * Get connected objects
   */
  getConnectedObjects(sourceId: string): SimulationObject[] {
    const targetIds = this.connections.get(sourceId) || []
    return targetIds.map(id => this.objects.get(id)!).filter(obj => obj !== undefined)
  }

  /**
   * Initialize all objects
   */
  initializeAll(engine: DESEngine): void {
    this.objects.forEach(obj => {
      obj.initialize(engine)
    })
  }

  /**
   * Get all objects
   */
  getAllObjects(): SimulationObject[] {
    return Array.from(this.objects.values())
  }

  /**
   * Export model definition
   */
  exportModel(): any {
    return {
      objects: Array.from(this.objects.values()).map(obj => ({
        id: obj.id,
        name: obj.name,
        type: obj.constructor.name,
        position: obj.position,
        properties: Object.fromEntries(obj.properties)
      })),
      connections: Object.fromEntries(this.connections)
    }
  }
}
