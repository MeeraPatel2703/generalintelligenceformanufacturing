/**
 * INDUSTRIAL SIMULATION ADAPTER
 *
 * Connects IndustrialDESKernel to UI components
 * Provides visual entity/resource tracking for animation
 */

import { IndustrialDESKernel, DESEvent, Distribution } from './IndustrialDESKernel';
import { ExtractedSystem } from '../types/extraction';

export interface VisualEntity {
  id: string;
  type: string;
  state: 'created' | 'waiting' | 'processing' | 'traveling' | 'departed';
  position: { x: number; y: number };
  currentResourceId?: string;
  creationTime: number;
}

export interface VisualResource {
  id: string;
  name: string;
  position: { x: number; y: number };
  capacity: number;
  currentLoad: number;
  queueLength: number;
  utilization: number;
}

export interface SimulationStats {
  currentTime: number;
  entitiesCreated: number;
  entitiesDeparted: number;
  entitiesInSystem: number;
  throughput: number;
  avgCycleTime: number;
  avgWaitTime: number;
  progress: number;
}

/**
 * Process flow interfaces for multi-stage routing
 */
interface ProcessFlow {
  entityType: string;
  stages: ProcessStage[];
}

interface ProcessStage {
  stageId: string;
  stepType: 'seize' | 'delay' | 'release' | 'decision';
  resourceName?: string;
  processingTime?: Distribution;
  nextStageRules: {
    nextStageId: string | 'EXIT';
    probability?: number;
    condition?: any;
  }[];
}

export class IndustrialSimulationAdapter {
  private kernel: IndustrialDESKernel;
  private system: ExtractedSystem;
  private resourcePositions: Map<string, { x: number; y: number }> = new Map();
  private endTime: number = 360; // 6 hours in minutes
  private currentStepTime: number = 0;
  private maxStepTime: number = 360;

  // Multi-stage routing support
  private processFlows: Map<string, ProcessFlow> = new Map(); // entityType → flow
  private entityCurrentStage: Map<string, string> = new Map(); // entityId → stageId
  private resourceIdToName: Map<string, string> = new Map(); // resourceId → resourceName

  constructor(system: ExtractedSystem, seed: number = Date.now()) {
    this.system = system;
    this.kernel = new IndustrialDESKernel(seed);

    // Use default 360 minutes (6 hours) for now
    // TODO: Extract simulation time from system or user input

    this.initialize();
  }

  /**
   * Initialize simulation from ExtractedSystem
   * Sets up resources, parses process flows, and schedules entity arrivals
   */
  private initialize(): void {
    console.log('╔════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                   INDUSTRIAL DES ADAPTER - INITIALIZATION                  ║');
    console.log('╚════════════════════════════════════════════════════════════════════════════╝');
    console.log('[IndustrialAdapter] System Name:', this.system.systemName);
    console.log('[IndustrialAdapter] System Type:', this.system.systemType);
    console.log('[IndustrialAdapter] Simulation End Time:', this.endTime, 'minutes');

    // Set up service completion callback for multi-stage routing
    this.kernel.setOnServiceCompleteCallback((entityId, resourceId) => {
      this.handleEntityCompletesStage(entityId, resourceId);
    });

    // STEP 1: Add resources to the simulation
    console.log('\n[IndustrialAdapter] ─── STEP 1: Adding Resources ───');
    if (this.system.resources.length === 0) {
      console.error('[IndustrialAdapter] ✗ ERROR: No resources defined in system!');
    }

    this.system.resources.forEach((resource, index) => {
      const resourceId = `resource_${index}`;
      this.kernel.addResource(resourceId, resource.name, resource.capacity || 1);
      this.resourceIdToName.set(resourceId, resource.name);

      // Calculate position for visualization
      const x = 200 + (index % 3) * 250;
      const y = 200 + Math.floor(index / 3) * 200;
      this.resourcePositions.set(resourceId, { x, y });

      console.log(`[IndustrialAdapter]   ✓ Resource ${index}: ${resource.name} (ID: ${resourceId}, Capacity: ${resource.capacity})`);
    });

    // STEP 2: Parse process sequences into routing rules
    console.log('\n[IndustrialAdapter] ─── STEP 2: Parsing Process Sequences ───');
    if (!this.system.processes || this.system.processes.length === 0) {
      console.warn('[IndustrialAdapter] ⚠ WARNING: No processes defined! Entities will use simple routing.');
    }
    this.parseProcessSequences();

    // STEP 3: Schedule entity arrivals
    console.log('\n[IndustrialAdapter] ─── STEP 3: Scheduling Entity Arrivals ───');
    if (this.system.entities.length === 0) {
      console.error('[IndustrialAdapter] ✗ ERROR: No entities defined in system!');
    }

    this.system.entities.forEach((entityDef, entityIndex) => {
      console.log(`\n[IndustrialAdapter] Processing entity ${entityIndex}: ${entityDef.name}`);
      console.log('[IndustrialAdapter] Entity definition:', JSON.stringify(entityDef, null, 2));

      let arrivalPattern = entityDef.arrivalPattern;

      if (!arrivalPattern || !arrivalPattern.rate) {
        console.error(`[IndustrialAdapter] ✗ ERROR: No valid arrival pattern for entity ${entityDef.name}`);
        console.error(`[IndustrialAdapter] ✗ Original pattern:`, JSON.stringify(arrivalPattern, null, 2));
        console.error(`[IndustrialAdapter] ✗ ADDING DEFAULT ARRIVAL PATTERN: 60/hour Poisson`);
        // Add default arrival pattern - moderate rate that works well visually
        arrivalPattern = {
          type: 'poisson',
          rate: 60,  // 60 per hour = 1 per minute
          rateUnit: 'per_hour'
        };
      }

      console.log('[IndustrialAdapter] Using arrival pattern:', JSON.stringify(arrivalPattern, null, 2));

      // Determine first resource and service time from process flow
      let firstResourceId = 'resource_0';
      let serviceTimeDistribution: Distribution = { type: 'constant', value: 1 };
      let firstStageId: string | undefined;

      const flow = this.processFlows.get(entityDef.name);
      if (flow && flow.stages.length > 0) {
        // Use first stage from process flow
        const firstStage = flow.stages[0];
        firstStageId = firstStage.stageId;

        const resId = this.findResourceIdByName(firstStage.resourceName || '');
        if (resId) {
          firstResourceId = resId;
        } else {
          console.warn(`[IndustrialAdapter] ⚠ Could not find resource ID for ${firstStage.resourceName}, using resource_0`);
        }

        if (firstStage.processingTime) {
          serviceTimeDistribution = firstStage.processingTime;
        }

        console.log(`[IndustrialAdapter]   First stage: ${firstStageId} at resource ${firstStage.resourceName} (${firstResourceId})`);
        console.log(`[IndustrialAdapter]   Service time: ${JSON.stringify(serviceTimeDistribution)}`);
      } else {
        // Fallback: use first resource's processing time
        console.warn(`[IndustrialAdapter] ⚠ No process flow found for ${entityDef.name}, using fallback routing`);
        const firstResource = this.system.resources[0];
        if (firstResource && firstResource.processingTime) {
          serviceTimeDistribution = this.convertDistribution(firstResource.processingTime);
        }
        console.log(`[IndustrialAdapter]   Fallback: first resource ${firstResourceId}, service time ${JSON.stringify(serviceTimeDistribution)}`);
      }

      // Schedule arrivals based on pattern type
      // Handle multiple variations of Poisson arrival pattern naming
      const arrivalType = arrivalPattern.type?.toLowerCase().replace(/[_-]/g, '') || '';
      const isPoissonType = arrivalType === 'poisson' || 
                           arrivalType === 'nonhomogeneous' || 
                           arrivalType === 'nonhomogeneouspoisson' ||
                           arrivalPattern.type === 'non-homogeneous_poisson' ||
                           arrivalPattern.type === 'non_homogeneous_poisson';
      
      if (isPoissonType) {
        console.log(`[IndustrialAdapter]   Arrival type: ${arrivalPattern.type} → Handling as Poisson`);
        this.scheduleNonHomogeneousPoissonArrivals(
          entityDef,
          entityIndex,
          arrivalPattern,
          firstResourceId,
          serviceTimeDistribution,
          firstStageId
        );
      } else if (arrivalPattern.type === 'scheduled') {
        console.log(`[IndustrialAdapter]   Arrival type: ${arrivalPattern.type} → Handling as Scheduled`);
        this.scheduleScheduledArrivals(
          entityDef,
          entityIndex,
          arrivalPattern,
          firstResourceId,
          serviceTimeDistribution,
          firstStageId
        );
      } else {
        console.error(`[IndustrialAdapter] ✗ ERROR: Unknown arrival pattern type: ${arrivalPattern.type}`);
        console.error(`[IndustrialAdapter] ✗ Cannot schedule arrivals for this entity!`);
        console.error(`[IndustrialAdapter] ✗ Supported types: poisson, non-homogeneous_poisson, nonhomogeneous, scheduled`);
      }
    });

    console.log('\n╔════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                    INITIALIZATION COMPLETE                                 ║');
    console.log('╠════════════════════════════════════════════════════════════════════════════╣');
    console.log(`║  Resources: ${this.system.resources.length.toString().padEnd(66)}║`);
    console.log(`║  Entity Types: ${this.system.entities.length.toString().padEnd(63)}║`);
    console.log(`║  Process Flows: ${this.processFlows.size.toString().padEnd(62)}║`);
    console.log(`║  End Time: ${this.endTime.toString().padEnd(67)}║`);
    console.log('╚════════════════════════════════════════════════════════════════════════════╝');
  }

  /**
   * Schedule non-homogeneous Poisson arrivals
   * Handles both simple rate-based and time-scheduled arrival patterns
   */
  private scheduleNonHomogeneousPoissonArrivals(
    entityDef: any,
    entityIndex: number,
    arrivalPattern: any,
    firstResourceId: string,
    serviceTimeDistribution: Distribution,
    firstStageId?: string
  ): void {
    console.log('[IndustrialAdapter] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[IndustrialAdapter] Scheduling arrivals for:', entityDef.name);
    console.log('[IndustrialAdapter] Arrival pattern type:', arrivalPattern.type);
    console.log('[IndustrialAdapter] Pattern details:', JSON.stringify(arrivalPattern, null, 2));

    // Handle both formats: old 'rateSchedule' and new 'schedule'
    const schedule = arrivalPattern.rateSchedule || arrivalPattern.schedule || [];

    if (schedule.length === 0) {
      console.log('[IndustrialAdapter] No schedule array, checking for simple rate...');
      // Fall back to simple Poisson with rate if available
      if (arrivalPattern.rate) {
        const rate = arrivalPattern.rate;
        let ratePerMinute = rate;
        
        // Convert rate unit to per-minute (handle all variations)
        const rateUnit = (arrivalPattern.rateUnit || 'per_hour').toLowerCase().replace(/[_\s-]/g, '');
        
        if (rateUnit === 'perhour' || rateUnit === 'hr' || rateUnit === 'hour' || rateUnit === 'hourly') {
          ratePerMinute = rate / 60;
        } else if (rateUnit === 'perminute' || rateUnit === 'min' || rateUnit === 'minute') {
          ratePerMinute = rate;
        } else if (rateUnit === 'persecond' || rateUnit === 'sec' || rateUnit === 'second') {
          ratePerMinute = rate * 60;
        } else if (rateUnit === 'perday' || rateUnit === 'day' || rateUnit === 'daily') {
          ratePerMinute = rate / (24 * 60);
        } else if (rateUnit === 'perweek' || rateUnit === 'week' || rateUnit === 'weekly') {
          ratePerMinute = rate / (7 * 24 * 60);
        } else {
          console.warn(`[IndustrialAdapter] ⚠ Unknown rate unit: ${arrivalPattern.rateUnit}, assuming per_hour`);
          ratePerMinute = rate / 60;
        }

        console.log(`[IndustrialAdapter] Using simple rate: ${rate} ${rateUnit} = ${ratePerMinute.toFixed(4)} per minute`);

        const rng = this.kernel.getRNGStreamManager().getStream(`arrivals_${entityIndex}`);
        let currentTime = 0;
        let arrivalCount = 0;

        console.log(`[IndustrialAdapter] Generating arrivals from 0 to ${this.endTime} minutes...`);

        while (currentTime < this.endTime && arrivalCount < 10000) {
          const interarrival = -Math.log(1 - rng.random()) / ratePerMinute;
          currentTime += interarrival;

          if (currentTime >= this.endTime) {
            console.log(`[IndustrialAdapter] Stopping: next arrival at ${currentTime.toFixed(2)} > endTime ${this.endTime}`);
            break;
          }

          const entityId = `entity_${entityIndex}_${arrivalCount}`;
          
          if (arrivalCount < 10) {
            console.log(`[IndustrialAdapter]   Arrival ${arrivalCount}: entityId=${entityId}, time=${currentTime.toFixed(4)}, firstResource=${firstResourceId}`);
          }
          
          this.kernel.scheduleEvent(new DESEvent(
            currentTime,
            'arrival',
            0,
            entityId,
            undefined,
            {
              entityType: entityDef.name,
              firstResource: firstResourceId,
              serviceTimeDistribution,
              onProcessed: null
            }
          ));

          // Track first stage for this entity
          if (firstStageId) {
            this.entityCurrentStage.set(entityId, firstStageId);
          }

          arrivalCount++;
        }

        console.log(`[IndustrialAdapter] ✓ Scheduled ${arrivalCount} arrivals using simple rate`);
        console.log('[IndustrialAdapter] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        return;
      }

      console.error('[IndustrialAdapter] ✗ No schedule and no rate - CANNOT SCHEDULE ARRIVALS!');
      console.error('[IndustrialAdapter] ✗ This entity will have ZERO arrivals!');
      console.log('[IndustrialAdapter] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return;
    }

    console.log(`[IndustrialAdapter] Found schedule with ${schedule.length} periods`);

    let currentTime = 0;
    let arrivalCount = 0;
    const rng = this.kernel.getRNGStreamManager().getStream(`arrivals_${entityIndex}`);

    // Convert schedule format if needed
    const rateSchedule = schedule.map((s: any, idx: number) => {
      if (s.startTime !== undefined && s.endTime !== undefined && s.rate !== undefined) {
        // Already in rateSchedule format
        console.log(`[IndustrialAdapter]   Period ${idx}: ${s.startTime}-${s.endTime} min, rate=${s.rate}/hr`);
        return s;
      }
      // Convert from ArrivalSchedule format (with timeOfDay, dayOfWeek)
      const converted = this.convertArrivalScheduleToRateSchedule(s);
      if (converted) {
        console.log(`[IndustrialAdapter]   Period ${idx} (converted): ${converted.startTime}-${converted.endTime} min, rate=${converted.rate}/hr`);
      }
      return converted;
    }).filter(Boolean);

    console.log(`[IndustrialAdapter] Generating arrivals from schedule...`);

    while (currentTime < this.endTime && arrivalCount < 10000) {
      // Find current rate period
      const currentPeriod = rateSchedule.find((r: any) => currentTime >= r.startTime && currentTime < r.endTime);

      if (!currentPeriod) {
        // Jump to next period
        const nextPeriod = rateSchedule.find((r: any) => r.startTime > currentTime);
        if (nextPeriod) {
          console.log(`[IndustrialAdapter]   Jumping from ${currentTime.toFixed(2)} to next period at ${nextPeriod.startTime}`);
          currentTime = nextPeriod.startTime;
        } else {
          console.log(`[IndustrialAdapter]   No more periods after ${currentTime.toFixed(2)}, stopping`);
          break;
        }
        continue;
      }

      const ratePerMinute = currentPeriod.rate / 60;
      if (ratePerMinute <= 0) {
        console.warn(`[IndustrialAdapter]   Rate is zero in period, jumping to end of period`);
        currentTime = currentPeriod.endTime;
        continue;
      }

      // Sample inter-arrival time using exponential distribution
      const interarrival = -Math.log(1 - rng.random()) / ratePerMinute;
      currentTime += interarrival;

      if (currentTime >= this.endTime) {
        console.log(`[IndustrialAdapter]   Stopping: next arrival at ${currentTime.toFixed(2)} > endTime ${this.endTime}`);
        break;
      }
      
      if (currentPeriod.endTime && currentTime >= currentPeriod.endTime) {
        currentTime = currentPeriod.endTime;
        continue;
      }

      // Schedule arrival event
      const entityId = `entity_${entityIndex}_${arrivalCount}`;
      
      if (arrivalCount < 10) {
        console.log(`[IndustrialAdapter]   Arrival ${arrivalCount}: entityId=${entityId}, time=${currentTime.toFixed(4)}, firstResource=${firstResourceId}`);
      }
      
      this.kernel.scheduleEvent(new DESEvent(
        currentTime,
        'arrival',
        0,
        entityId,
        undefined,
        {
          entityType: entityDef.name,
          firstResource: firstResourceId,
          serviceTimeDistribution,
          onProcessed: null
        }
      ));

      // Track first stage for this entity
      if (firstStageId) {
        this.entityCurrentStage.set(entityId, firstStageId);
      }

      arrivalCount++;
    }

    console.log(`[IndustrialAdapter] ✓ Scheduled ${arrivalCount} arrivals for ${entityDef.name}`);
    console.log('[IndustrialAdapter] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }

  /**
   * Parse process sequences into routing rules
   * Converts seize → delay → release patterns into stages with routing logic
   */
  private parseProcessSequences(): void {
    console.log('[IndustrialAdapter] Parsing process sequences...');

    if (!this.system.processes || this.system.processes.length === 0) {
      console.warn('[IndustrialAdapter] No processes defined - using simple single-resource routing');
      return;
    }

    this.system.processes.forEach(process => {
      const stages: ProcessStage[] = [];
      const sequence = process.sequence || [];

      console.log(`[IndustrialAdapter] Parsing process: ${process.name} with ${sequence.length} steps`);

      // Find next seize step after the current index
      const findNextSeizeStep = (startIndex: number): any => {
        for (let i = startIndex; i < sequence.length; i++) {
          if (sequence[i].type === 'seize') {
            return sequence[i];
          }
        }
        return null;
      };

      // Group seize → delay → release into stages
      // Normalize step types to handle variations
      for (let i = 0; i < sequence.length; i++) {
        const step = sequence[i];
        const normalizedStepType = (step.type || '').toLowerCase().replace(/[_\s-]/g, '');

        if ((normalizedStepType === 'seize' || normalizedStepType === 'acquire' || normalizedStepType === 'grab') && step.resourceName) {
          // Start of a new stage
          const seizeStepId = step.id;
          const resourceName = step.resourceName;

          // Look for corresponding delay and release
          let delayStep = null;
          let nextStepAfterRelease = null;

          for (let j = i + 1; j < sequence.length; j++) {
            const nextStepType = (sequence[j].type || '').toLowerCase().replace(/[_\s-]/g, '');
            
            if ((nextStepType === 'delay' || nextStepType === 'wait' || nextStepType === 'process') && !delayStep) {
              delayStep = sequence[j];
            } else if ((nextStepType === 'release' || nextStepType === 'free') && sequence[j].resourceName === resourceName) {
              // Next step after release determines routing
              if (j + 1 < sequence.length) {
                nextStepAfterRelease = sequence[j + 1];
              }
              break;
            }
          }

          // Create stage
          const stage: ProcessStage = {
            stageId: seizeStepId,
            stepType: 'seize',
            resourceName,
            processingTime: delayStep?.duration ? this.convertDistribution(delayStep.duration) : undefined,
            nextStageRules: []
          };

          // Determine next stage routing
          if (!nextStepAfterRelease) {
            // No step after release - entity exits
            console.log(`[IndustrialAdapter]   Stage ${seizeStepId}: No next step, routing to EXIT`);
            stage.nextStageRules.push({ nextStageId: 'EXIT' });
          } else {
            const nextType = (nextStepAfterRelease.type || '').toLowerCase().replace(/[_\s-]/g, '');
            
            if (nextType === 'decision' || nextType === 'branch' || nextType === 'choose' || nextType === 'decide') {
              // Decision point - parse routing conditions
              console.log(`[IndustrialAdapter]   Stage ${seizeStepId}: Found decision with ${nextStepAfterRelease.conditions?.length || 0} conditions`);
              
              if (nextStepAfterRelease.conditions && nextStepAfterRelease.conditions.length > 0) {
                nextStepAfterRelease.conditions.forEach((cond: any) => {
                  const nextStepId = cond.nextStepId;
                  
                  // Check if nextStepId points to an exit/process step
                  const nextStep = sequence.find((s: any) => s.id === nextStepId);
                  const nextStepType = nextStep ? (nextStep.type || '').toLowerCase().replace(/[_\s-]/g, '') : '';
                  const isExit = !nextStep || 
                                nextStepType === 'process' || 
                                nextStepType === 'exit' || 
                                nextStepType === 'leave' || 
                                nextStepType === 'depart' ||
                                nextStepType === 'dispose';
                  
                  stage.nextStageRules.push({
                    nextStageId: isExit ? 'EXIT' : nextStepId,
                    probability: cond.probability,
                    condition: cond.condition
                  });
                  
                  console.log(`[IndustrialAdapter]     Condition: next=${isExit ? 'EXIT' : nextStepId}, prob=${cond.probability}`);
                });
              } else {
                // Decision with no conditions - default to EXIT
                stage.nextStageRules.push({ nextStageId: 'EXIT' });
              }
            } else if (nextType === 'seize' || nextType === 'acquire' || nextType === 'grab') {
              // Sequential routing to next resource
              console.log(`[IndustrialAdapter]   Stage ${seizeStepId}: Sequential routing to ${nextStepAfterRelease.id}`);
              stage.nextStageRules.push({
                nextStageId: nextStepAfterRelease.id
              });
            } else if (nextType === 'delay' || nextType === 'wait' || nextType === 'travel') {
              // Delay step (travel time) - find next seize after it
              const nextSeize = findNextSeizeStep(i + 1);
              if (nextSeize) {
                console.log(`[IndustrialAdapter]   Stage ${seizeStepId}: Delay then seize ${nextSeize.id}`);
                stage.nextStageRules.push({
                  nextStageId: nextSeize.id
                });
              } else {
                console.log(`[IndustrialAdapter]   Stage ${seizeStepId}: Delay with no next seize, routing to EXIT`);
                stage.nextStageRules.push({ nextStageId: 'EXIT' });
              }
            } else if (nextType === 'process' || 
                      nextType === 'exit' || 
                      nextType === 'leave' || 
                      nextType === 'depart' || 
                      nextType === 'dispose') {
              // Exit step - entity leaves system
              console.log(`[IndustrialAdapter]   Stage ${seizeStepId}: Found exit/process step, routing to EXIT`);
              stage.nextStageRules.push({ nextStageId: 'EXIT' });
            } else {
              // Unknown next step type - default to EXIT
              console.warn(`[IndustrialAdapter]   Stage ${seizeStepId}: Unknown next step type '${nextStepAfterRelease.type}', routing to EXIT`);
              stage.nextStageRules.push({ nextStageId: 'EXIT' });
            }
          }

          stages.push(stage);
          console.log(`[IndustrialAdapter]   ✓ Stage ${seizeStepId} created: ${resourceName} → ${JSON.stringify(stage.nextStageRules.map(r => r.nextStageId))}`);
        }
      }

      if (stages.length > 0) {
        this.processFlows.set(process.entityType, {
          entityType: process.entityType,
          stages
        });
        console.log(`[IndustrialAdapter] ✓ Created flow for ${process.entityType} with ${stages.length} stages`);
      } else {
        console.warn(`[IndustrialAdapter] ⚠ No stages created for ${process.entityType}`);
      }
    });

    console.log(`[IndustrialAdapter] Process parsing complete. Total flows: ${this.processFlows.size}`);
  }

  /**
   * Handle entity completing a stage
   */
  private handleEntityCompletesStage(entityId: string, _resourceId: string): void {
    const entity = this.kernel.getEntity(entityId);
    if (!entity) {
      console.error(`[IndustrialAdapter] Entity ${entityId} not found`);
      return;
    }

    const currentStageId = this.entityCurrentStage.get(entityId);
    const flow = this.processFlows.get(entity.type);

    if (!flow || !currentStageId) {
      // No flow defined, use default behavior (depart)
      console.log(`[IndustrialAdapter] No flow for ${entity.type}, entity ${entityId} departing`);
      this.kernel.scheduleEntityDeparture(entityId);
      return;
    }

    // Find current stage
    const currentStage = flow.stages.find(s => s.stageId === currentStageId);
    if (!currentStage) {
      console.warn(`[IndustrialAdapter] Stage ${currentStageId} not found, entity ${entityId} departing`);
      this.kernel.scheduleEntityDeparture(entityId);
      return;
    }

    // Determine next stage
    const nextRule = this.selectNextStage(currentStage.nextStageRules);

    if (nextRule.nextStageId === 'EXIT') {
      console.log(`[IndustrialAdapter] Entity ${entityId} exiting system after stage ${currentStageId}`);
      this.kernel.scheduleEntityDeparture(entityId);
      this.entityCurrentStage.delete(entityId);
    } else {
      // Route to next stage
      const nextStage = flow.stages.find(s => s.stageId === nextRule.nextStageId);
      if (!nextStage) {
        console.error(`[IndustrialAdapter] Next stage ${nextRule.nextStageId} not found, entity ${entityId} departing`);
        this.kernel.scheduleEntityDeparture(entityId);
        return;
      }

      // Find resource ID for next stage
      const nextResourceId = this.findResourceIdByName(nextStage.resourceName || '');
      if (!nextResourceId) {
        console.error(`[IndustrialAdapter] Resource ${nextStage.resourceName} not found, entity ${entityId} departing`);
        this.kernel.scheduleEntityDeparture(entityId);
        return;
      }

      console.log(`[IndustrialAdapter] Entity ${entityId} routing from stage ${currentStageId} → ${nextStage.stageId} (${nextStage.resourceName})`);

      // Update entity's current stage
      this.entityCurrentStage.set(entityId, nextStage.stageId);

      // Update entity's service time distribution if stage has one
      if (nextStage.processingTime) {
        entity.attributes.set('serviceTimeDistribution', this.convertDistribution(nextStage.processingTime));
      }

      // Route to next resource
      this.kernel.routeEntityToResource(entityId, nextResourceId);
    }
  }

  /**
   * Select next stage based on routing rules (probabilistic or conditional)
   */
  private selectNextStage(rules: { nextStageId: string | 'EXIT'; probability?: number; condition?: any }[]): { nextStageId: string | 'EXIT' } {
    if (rules.length === 0) {
      return { nextStageId: 'EXIT' };
    }

    if (rules.length === 1) {
      return rules[0];
    }

    // Probabilistic routing
    if (rules.some(r => r.probability !== undefined)) {
      const rand = Math.random();
      let cumulative = 0;

      for (const rule of rules) {
        cumulative += rule.probability || 0;
        if (rand <= cumulative) {
          return rule;
        }
      }

      // Fallback to last rule
      return rules[rules.length - 1];
    }

    // Conditional routing (TODO: implement condition evaluation)
    // For now, take first rule
    return rules[0];
  }

  /**
   * Find resource ID by resource name
   */
  private findResourceIdByName(resourceName: string): string | undefined {
    for (const [resourceId, name] of this.resourceIdToName.entries()) {
      if (name === resourceName) {
        return resourceId;
      }
    }
    return undefined;
  }

  /**
   * Schedule scheduled arrivals
   */
  private scheduleScheduledArrivals(
    entityDef: any,
    entityIndex: number,
    arrivalPattern: any,
    firstResourceId: string,
    serviceTimeDistribution: Distribution,
    firstStageId?: string
  ): void {
    const arrivalTimes = arrivalPattern.times || [];

    arrivalTimes.forEach((time: number, index: number) => {
      if (time < this.endTime) {
        const entityId = `entity_${entityIndex}_${index}`;
        this.kernel.scheduleEvent(new DESEvent(
          time,
          'arrival',
          0,
          entityId,
          undefined,
          {
            entityType: entityDef.name,
            firstResource: firstResourceId,
            serviceTimeDistribution
          }
        ));

        // Track first stage for this entity
        if (firstStageId) {
          this.entityCurrentStage.set(entityId, firstStageId);
        }
      }
    });

    console.log(`[IndustrialAdapter] Scheduled ${arrivalTimes.length} arrivals for ${entityDef.name}`);
  }

  /**
   * Convert ArrivalSchedule to RateSchedule format
   */
  private convertArrivalScheduleToRateSchedule(arrivalSchedule: any): { startTime: number; endTime: number; rate: number } | null {
    if (!arrivalSchedule) return null;

    // Parse time strings like "09:00" → minutes from simulation start
    const startMinutes = arrivalSchedule.timeOfDay?.start
      ? this.parseTimeString(arrivalSchedule.timeOfDay.start)
      : 0;
    const endMinutes = arrivalSchedule.timeOfDay?.end
      ? this.parseTimeString(arrivalSchedule.timeOfDay.end)
      : this.endTime;

    // Convert rate to per-minute (handle all variations)
    let ratePerMinute = arrivalSchedule.rate || 0;
    const rateUnit = (arrivalSchedule.rateUnit || 'per_hour').toLowerCase().replace(/[_\s-]/g, '');

    if (rateUnit === 'perhour' || rateUnit === 'hr' || rateUnit === 'hour' || rateUnit === 'hourly') {
      ratePerMinute = arrivalSchedule.rate / 60;
    } else if (rateUnit === 'perminute' || rateUnit === 'min' || rateUnit === 'minute') {
      ratePerMinute = arrivalSchedule.rate;
    } else if (rateUnit === 'persecond' || rateUnit === 'sec' || rateUnit === 'second') {
      ratePerMinute = arrivalSchedule.rate * 60;
    } else if (rateUnit === 'perday' || rateUnit === 'day' || rateUnit === 'daily') {
      ratePerMinute = arrivalSchedule.rate / (24 * 60);
    } else if (rateUnit === 'perweek' || rateUnit === 'week' || rateUnit === 'weekly') {
      ratePerMinute = arrivalSchedule.rate / (7 * 24 * 60);
    } else {
      console.warn(`[IndustrialAdapter] ⚠ Unknown rate unit in schedule: ${arrivalSchedule.rateUnit}, assuming per_hour`);
      ratePerMinute = arrivalSchedule.rate / 60;
    }

    console.log(`[IndustrialAdapter] Converted schedule: ${arrivalSchedule.timeOfDay?.start || '00:00'}-${arrivalSchedule.timeOfDay?.end || 'end'} → ${startMinutes}-${endMinutes} min, rate: ${ratePerMinute}/min`);

    return {
      startTime: startMinutes,
      endTime: endMinutes,
      rate: ratePerMinute
    };
  }

  /**
   * Parse time string (HH:MM) to minutes
   */
  private parseTimeString(timeStr: string): number {
    if (!timeStr || !timeStr.includes(':')) {
      console.warn(`[IndustrialAdapter] Invalid time string: ${timeStr}, defaulting to 0`);
      return 0;
    }

    try {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    } catch (e) {
      console.error(`[IndustrialAdapter] Error parsing time string: ${timeStr}`, e);
      return 0;
    }
  }

  /**
   * Convert extraction distribution to DES distribution
   * Handles multiple naming variations robustly
   */
  private convertDistribution(dist: any): Distribution {
    const params = dist.parameters || {};
    
    // Normalize distribution type (lowercase, no spaces/underscores/hyphens)
    const normalizedType = (dist.type || 'constant').toLowerCase().replace(/[_\s-]/g, '');

    // Handle all common variations of distribution names
    if (normalizedType === 'constant' || normalizedType === 'fixed' || normalizedType === 'deterministic') {
      return { type: 'constant', value: params.value || 1 };
    }
    
    if (normalizedType === 'exponential' || normalizedType === 'exp' || normalizedType === 'expon') {
      return { type: 'exponential', mean: params.mean || params.lambda || 1 };
    }
    
    if (normalizedType === 'uniform' || normalizedType === 'unif') {
      return { 
        type: 'uniform', 
        min: params.min || params.minimum || 0, 
        max: params.max || params.maximum || 1 
      };
    }
    
    if (normalizedType === 'triangular' || normalizedType === 'triang' || normalizedType === 'triangle') {
      return {
        type: 'triangular',
        min: params.min || params.minimum || 0,
        mode: params.mode || params.peak || 0.5,
        max: params.max || params.maximum || 1
      };
    }
    
    if (normalizedType === 'normal' || normalizedType === 'gaussian' || normalizedType === 'norm') {
      return {
        type: 'normal',
        mean: params.mean || params.mu || 0,
        stdDev: params.stdDev || params.std || params.standardDeviation || params.sigma || 1
      };
    }
    
    if (normalizedType === 'empirical' || normalizedType === 'discrete' || normalizedType === 'custom') {
      return {
        type: 'empirical',
        values: params.values || [1],
        probabilities: params.probabilities || params.probs || [1]
      };
    }

    console.warn(`[IndustrialAdapter] ⚠ Unknown distribution type: '${dist.type}', using constant with value 1`);
    console.warn(`[IndustrialAdapter] ⚠ Supported types: constant, exponential, uniform, triangular, normal, empirical`);
    return { type: 'constant', value: 1 };
  }

  /**
   * Step simulation forward
   * Runs simulation in small increments for smooth animation
   * BUG FIX: Only increment currentStepTime if kernel actually has events to process
   */
  step(): void {
    if (this.currentStepTime >= this.maxStepTime) {
      return; // Simulation complete
    }

    const beforeTime = this.kernel.getCurrentTime();
    const beforeStats = this.kernel.getStatistics();
    
    // Run simulation for a small time increment (0.1 minute steps for smooth animation)
    const targetTime = Math.min(this.currentStepTime + 0.1, this.maxStepTime);
    
    console.log(`[Adapter:step] BEFORE - stepTime=${this.currentStepTime.toFixed(2)}, kernelTime=${beforeTime.toFixed(2)}, targetTime=${targetTime.toFixed(2)}, created=${beforeStats.simulation.entitiesCreated}`);
    
    this.kernel.run(targetTime, 0);
    
    const afterTime = this.kernel.getCurrentTime();
    const afterStats = this.kernel.getStatistics();
    
    // BUG FIX: Only advance currentStepTime if kernel time actually advanced
    // This prevents the adapter from thinking time passed when no events were processed
    if (afterTime > beforeTime) {
      this.currentStepTime = afterTime;
    } else {
      // Kernel time didn't advance - either no events or reached end
      // Still increment stepTime to avoid infinite loop, but mark as potentially stuck
      this.currentStepTime = targetTime;
      console.warn(`[Adapter:step] ⚠ WARNING: Kernel time did not advance! This means no events in calendar. Check initialization.`);
    }
    
    console.log(`[Adapter:step] AFTER  - stepTime=${this.currentStepTime.toFixed(2)}, kernelTime=${afterTime.toFixed(2)}, created=${afterStats.simulation.entitiesCreated}, timeAdvanced=${afterTime > beforeTime}`);
  }

  /**
   * Get visual entities for rendering
   */
  getVisualEntities(): VisualEntity[] {
    const entities: VisualEntity[] = [];
    const activeEntities = this.kernel.getActiveEntities();

    activeEntities.forEach(entity => {
      // Calculate position based on current resource
      let position = { x: 100, y: 300 }; // Default entry point

      if (entity.currentResourceId) {
        const resourcePosition = this.resourcePositions.get(entity.currentResourceId);
        if (resourcePosition) {
          position = { ...resourcePosition };

          // If entity is waiting in queue, offset position
          const resource = this.kernel.getResource(entity.currentResourceId);
          if (resource && entity.state === 'waiting') {
            const queuePosition = resource.queue.indexOf(entity.id);
            if (queuePosition >= 0) {
              position = {
                x: position.x - 60,
                y: position.y + queuePosition * 35 // Stack vertically
              };
            }
          } else if (resource && entity.state === 'processing') {
            // Entities being processed are shown at the resource
            const serviceIndex = resource.inService.indexOf(entity.id);
            if (serviceIndex >= 0) {
              position = {
                x: position.x + 20,
                y: position.y + serviceIndex * 35
              };
            }
          }
        }
      }

      entities.push({
        id: entity.id,
        type: entity.type,
        state: entity.state as any,
        position,
        currentResourceId: entity.currentResourceId,
        creationTime: entity.creationTime
      });
    });

    return entities;
  }

  /**
   * Get visual resources for rendering
   */
  getVisualResources(): VisualResource[] {
    const resources: VisualResource[] = [];
    const stats = this.kernel.getStatistics();

    this.system.resources.forEach((resource, index) => {
      const resourceId = `resource_${index}`;
      const position = this.resourcePositions.get(resourceId) || { x: 0, y: 0 };
      const resourceStats = stats.resources[resourceId];

      if (resourceStats) {
        resources.push({
          id: resourceId,
          name: resource.name,
          position,
          capacity: resourceStats.capacity,
          currentLoad: resourceStats.currentLoad,
          queueLength: resourceStats.queueLength,
          utilization: parseFloat(resourceStats.utilization.replace('%', ''))
        });
      }
    });

    return resources;
  }

  /**
   * Get simulation statistics
   */
  getStats(): SimulationStats {
    const stats = this.kernel.getStatistics();
    const avgCycleTime = stats.tally.entity_cycle_time?.mean || 0;
    const avgWaitTime = stats.tally.entity_wait_time?.mean || 0;
    const throughput = this.currentStepTime > 0
      ? (stats.simulation.entitiesDeparted / this.currentStepTime) * 60
      : 0;

    // Get current time from kernel with defensive checks
    const kernelTime = this.kernel?.getCurrentTime?.() ?? 0;
    const currentTime = isNaN(kernelTime) ? this.currentStepTime : kernelTime;

    return {
      currentTime,
      entitiesCreated: stats.simulation.entitiesCreated || 0,
      entitiesDeparted: stats.simulation.entitiesDeparted || 0,
      entitiesInSystem: stats.simulation.entitiesInSystem || 0,
      throughput: isNaN(throughput) ? 0 : throughput,
      avgCycleTime: isNaN(avgCycleTime) ? 0 : avgCycleTime,
      avgWaitTime: isNaN(avgWaitTime) ? 0 : avgWaitTime,
      progress: (this.currentStepTime / this.maxStepTime) * 100
    };
  }

  /**
   * Check if simulation is complete
   */
  isComplete(): boolean {
    return this.currentStepTime >= this.maxStepTime;
  }

  /**
   * Get detailed statistics
   */
  getDetailedStats(): any {
    return this.kernel.getStatistics();
  }

  /**
   * Reset simulation
   */
  reset(): void {
    this.kernel.reset();
    this.currentStepTime = 0;
    this.initialize();
  }
}
