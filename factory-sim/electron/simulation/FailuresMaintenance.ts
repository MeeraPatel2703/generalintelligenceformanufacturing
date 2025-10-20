/**
 * Failures and Maintenance System
 * Implements MTBF/MTTR, scheduled maintenance, and downtime tracking
 */

import { DESEngine, EventType, Distributions } from './DESEngine.js'

// ============================================================================
// FAILURE MODELS
// ============================================================================

export enum FailureType {
  RANDOM = 'RANDOM', // Exponential (MTBF)
  WEAR_OUT = 'WEAR_OUT', // Weibull distribution
  SCHEDULED = 'SCHEDULED', // Periodic maintenance
  USAGE_BASED = 'USAGE_BASED', // After N operations
  CONDITION_BASED = 'CONDITION_BASED' // Based on condition monitoring
}

export interface FailureProfile {
  type: FailureType
  mtbf?: number // Mean Time Between Failures (minutes)
  mttr?: number // Mean Time To Repair (minutes)
  weibullShape?: number // For wear-out failures
  weibullScale?: number
  usageThreshold?: number // For usage-based failures
  conditionThreshold?: number // For condition-based
}

export interface MaintenanceSchedule {
  type: 'preventive' | 'predictive' | 'corrective'
  intervalMinutes: number
  durationMinutes: number
  nextScheduledTime: number
}

export interface DowntimeRecord {
  resourceName: string
  startTime: number
  endTime: number
  duration: number
  reason: 'failure' | 'maintenance' | 'break'
  type: string
}

export class FailureMaintenanceSystem {
  private engine: DESEngine
  private dist: Distributions
  private failureProfiles: Map<string, FailureProfile>
  private maintenanceSchedules: Map<string, MaintenanceSchedule[]>
  private downtimeRecords: DowntimeRecord[]
  private resourceConditions: Map<string, number> // 0-100% health
  private resourceUsageCounts: Map<string, number>

  constructor(engine: DESEngine, distributions: Distributions) {
    this.engine = engine
    this.dist = distributions
    this.failureProfiles = new Map()
    this.maintenanceSchedules = new Map()
    this.downtimeRecords = []
    this.resourceConditions = new Map()
    this.resourceUsageCounts = new Map()
  }

  /**
   * Add failure profile to resource
   */
  addFailureProfile(resourceName: string, profile: FailureProfile): void {
    this.failureProfiles.set(resourceName, profile)
    this.resourceConditions.set(resourceName, 100) // Start at 100% health

    // Schedule first failure
    if (profile.type === FailureType.RANDOM && profile.mtbf) {
      this.scheduleNextFailure(resourceName, profile)
    }
  }

  /**
   * Add maintenance schedule
   */
  addMaintenanceSchedule(resourceName: string, schedule: MaintenanceSchedule): void {
    if (!this.maintenanceSchedules.has(resourceName)) {
      this.maintenanceSchedules.set(resourceName, [])
    }

    // Set next scheduled time
    schedule.nextScheduledTime = schedule.intervalMinutes

    this.maintenanceSchedules.get(resourceName)!.push(schedule)

    // Schedule first maintenance
    this.engine.scheduleEvent(schedule.intervalMinutes, EventType.CUSTOM, undefined, undefined, {
      type: 'scheduled_maintenance',
      resourceName,
      schedule
    })
  }

  /**
   * Schedule next random failure
   */
  private scheduleNextFailure(resourceName: string, profile: FailureProfile): void {
    let timeToFailure: number

    switch (profile.type) {
      case FailureType.RANDOM:
        // Exponential distribution
        timeToFailure = this.dist.exponential(profile.mtbf || 480)
        break

      case FailureType.WEAR_OUT:
        // Weibull distribution
        timeToFailure = this.sampleWeibull(profile.weibullShape || 2, profile.weibullScale || profile.mtbf || 480)
        break

      default:
        timeToFailure = profile.mtbf || 480
    }

    this.engine.scheduleEvent(timeToFailure, EventType.RESOURCE_FAILURE, undefined, undefined, {
      resourceName,
      profile
    })
  }

  /**
   * Sample from Weibull distribution
   */
  private sampleWeibull(shape: number, scale: number): number {
    const u = Math.random()
    return scale * Math.pow(-Math.log(1 - u), 1 / shape)
  }

  /**
   * Handle resource failure
   */
  handleFailure(resourceName: string, currentTime: number): void {
    const resource = this.engine.getResource(resourceName)
    const profile = this.failureProfiles.get(resourceName)

    if (!resource || !profile) return

    // Make resource unavailable
    const originalCapacity = resource.capacity
    resource.capacity = 0
    resource.available = 0

    // Sample repair time
    const repairTime = this.dist.exponential(profile.mttr || 60)

    // Record downtime
    const downtime: DowntimeRecord = {
      resourceName,
      startTime: currentTime,
      endTime: currentTime + repairTime,
      duration: repairTime,
      reason: 'failure',
      type: profile.type
    }
    this.downtimeRecords.push(downtime)

    // Schedule repair completion
    this.engine.scheduleEvent(repairTime, EventType.RESOURCE_REPAIR, undefined, resource, {
      resourceName,
      profile,
      originalCapacity
    })

    console.log(`[${currentTime.toFixed(2)}] ${resourceName} FAILED - Repair time: ${repairTime.toFixed(2)} min`)
  }

  /**
   * Handle resource repair completion
   */
  handleRepair(resourceName: string, originalCapacity: number, currentTime: number): void {
    const resource = this.engine.getResource(resourceName)
    const profile = this.failureProfiles.get(resourceName)

    if (!resource || !profile) return

    // Restore resource capacity
    resource.capacity = originalCapacity
    resource.available = originalCapacity

    // Reset condition
    this.resourceConditions.set(resourceName, 100)

    // Schedule next failure if profile exists
    if (profile) {
      this.scheduleNextFailure(resourceName, profile)
    }

    console.log(`[${currentTime.toFixed(2)}] ${resourceName} REPAIRED - Back online`)
  }

  /**
   * Handle scheduled maintenance
   */
  handleScheduledMaintenance(resourceName: string, schedule: MaintenanceSchedule, currentTime: number): void {
    const resource = this.engine.getResource(resourceName)
    if (!resource) return

    // Make resource unavailable
    const originalCapacity = resource.capacity
    resource.capacity = 0
    resource.available = 0

    // Record downtime
    const downtime: DowntimeRecord = {
      resourceName,
      startTime: currentTime,
      endTime: currentTime + schedule.durationMinutes,
      duration: schedule.durationMinutes,
      reason: 'maintenance',
      type: schedule.type
    }
    this.downtimeRecords.push(downtime)

    // Schedule maintenance completion
    this.engine.scheduleEvent(schedule.durationMinutes, EventType.CUSTOM, undefined, resource, {
      type: 'maintenance_complete',
      resourceName,
      schedule,
      originalCapacity
    })

    // Schedule next maintenance
    schedule.nextScheduledTime = currentTime + schedule.intervalMinutes
    this.engine.scheduleEvent(schedule.intervalMinutes, EventType.CUSTOM, undefined, undefined, {
      type: 'scheduled_maintenance',
      resourceName,
      schedule
    })

    console.log(`[${currentTime.toFixed(2)}] ${resourceName} MAINTENANCE - Duration: ${schedule.durationMinutes} min`)
  }

  /**
   * Handle maintenance completion
   */
  handleMaintenanceComplete(resourceName: string, originalCapacity: number, currentTime: number): void {
    const resource = this.engine.getResource(resourceName)
    if (!resource) return

    // Restore resource
    resource.capacity = originalCapacity
    resource.available = originalCapacity

    // Improve condition
    this.resourceConditions.set(resourceName, 100)

    console.log(`[${currentTime.toFixed(2)}] ${resourceName} MAINTENANCE COMPLETE`)
  }

  /**
   * Update resource condition (degrades with use)
   */
  updateCondition(resourceName: string, degradationRate: number = 0.1): void {
    const currentCondition = this.resourceConditions.get(resourceName) || 100
    const newCondition = Math.max(0, currentCondition - degradationRate)
    this.resourceConditions.set(resourceName, newCondition)

    // Check for condition-based maintenance trigger
    const profile = this.failureProfiles.get(resourceName)
    if (profile && profile.type === FailureType.CONDITION_BASED && profile.conditionThreshold) {
      if (newCondition <= profile.conditionThreshold) {
        // Trigger maintenance
        this.handleFailure(resourceName, this.engine.clock)
      }
    }
  }

  /**
   * Increment usage count and check for usage-based maintenance
   */
  incrementUsage(resourceName: string): void {
    const currentUsage = this.resourceUsageCounts.get(resourceName) || 0
    const newUsage = currentUsage + 1
    this.resourceUsageCounts.set(resourceName, newUsage)

    // Check for usage-based maintenance trigger
    const profile = this.failureProfiles.get(resourceName)
    if (profile && profile.type === FailureType.USAGE_BASED && profile.usageThreshold) {
      if (newUsage >= profile.usageThreshold) {
        // Trigger maintenance
        this.handleFailure(resourceName, this.engine.clock)
        // Reset usage counter
        this.resourceUsageCounts.set(resourceName, 0)
      }
    }
  }

  /**
   * Get downtime statistics
   */
  getDowntimeStatistics(resourceName?: string): {
    totalDowntime: number
    failureDowntime: number
    maintenanceDowntime: number
    numFailures: number
    numMaintenances: number
    availability: number
    mtbf: number
    mttr: number
  } {
    let records = this.downtimeRecords
    if (resourceName) {
      records = records.filter(r => r.resourceName === resourceName)
    }

    const failureRecords = records.filter(r => r.reason === 'failure')
    const maintenanceRecords = records.filter(r => r.reason === 'maintenance')

    const totalDowntime = records.reduce((sum, r) => sum + r.duration, 0)
    const failureDowntime = failureRecords.reduce((sum, r) => sum + r.duration, 0)
    const maintenanceDowntime = maintenanceRecords.reduce((sum, r) => sum + r.duration, 0)

    const totalTime = this.engine.clock
    const uptime = totalTime - totalDowntime
    const availability = totalTime > 0 ? uptime / totalTime : 1

    // Calculate MTBF and MTTR
    const numFailures = failureRecords.length
    const mtbf = numFailures > 1 ? uptime / (numFailures - 1) : Infinity
    const mttr = numFailures > 0 ? failureDowntime / numFailures : 0

    return {
      totalDowntime,
      failureDowntime,
      maintenanceDowntime,
      numFailures,
      numMaintenances: maintenanceRecords.length,
      availability,
      mtbf,
      mttr
    }
  }

  /**
   * Get all downtime records
   */
  getDowntimeRecords(): DowntimeRecord[] {
    return this.downtimeRecords
  }

  /**
   * Get resource condition
   */
  getCondition(resourceName: string): number {
    return this.resourceConditions.get(resourceName) || 100
  }

  /**
   * Reset system
   */
  reset(): void {
    this.downtimeRecords = []
    this.resourceConditions.clear()
    this.resourceUsageCounts.clear()

    // Re-initialize all resources
    this.failureProfiles.forEach((_profile, resourceName) => {
      this.resourceConditions.set(resourceName, 100)
      this.resourceUsageCounts.set(resourceName, 0)
    })
  }
}
