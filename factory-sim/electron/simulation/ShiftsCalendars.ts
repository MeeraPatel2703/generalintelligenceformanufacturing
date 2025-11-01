/**
 * Shifts and Calendars System
 * Implements work shifts, breaks, holidays, and resource availability schedules
 */

import { DESEngine, EventType } from './DESEngine'

// ============================================================================
// CALENDAR SYSTEM
// ============================================================================

export interface TimeRange {
  startMinute: number // Minutes from start of day (0-1439)
  endMinute: number
}

export interface Shift {
  name: string
  startTime: string // "08:00"
  endTime: string // "17:00"
  days: number[] // 0-6 (Sunday-Saturday)
  breaks: Break[]
}

export interface Break {
  name: string
  startMinute: number
  durationMinutes: number
}

export interface Holiday {
  name: string
  date: Date
  affectsAllResources: boolean
  affectedResources?: string[]
}

export interface WorkCalendar {
  name: string
  shifts: Shift[]
  holidays: Holiday[]
  weekends: number[] // 0-6, typically [0, 6] for Sunday/Saturday
}

export class ShiftsCalendarsSystem {
  private engine: DESEngine
  private calendars: Map<string, WorkCalendar>
  private resourceCalendars: Map<string, string> // resource -> calendar name
  private simulationStartDate: Date
  private resourceAvailabilityHistory: Map<string, { time: number; available: boolean }[]>

  constructor(engine: DESEngine, simulationStartDate: Date = new Date()) {
    this.engine = engine
    this.calendars = new Map()
    this.resourceCalendars = new Map()
    this.simulationStartDate = simulationStartDate
    this.resourceAvailabilityHistory = new Map()
  }

  /**
   * Create a standard calendar
   */
  createCalendar(name: string): WorkCalendar {
    const calendar: WorkCalendar = {
      name,
      shifts: [],
      holidays: [],
      weekends: [0, 6] // Sunday and Saturday
    }

    this.calendars.set(name, calendar)
    return calendar
  }

  /**
   * Add shift to calendar
   */
  addShift(calendarName: string, shift: Shift): void {
    const calendar = this.calendars.get(calendarName)
    if (!calendar) return

    calendar.shifts.push(shift)
  }

  /**
   * Add standard 8-hour shift
   */
  addStandard8HourShift(calendarName: string, shiftName: string, startHour: number): void {
    const shift: Shift = {
      name: shiftName,
      startTime: `${startHour.toString().padStart(2, '0')}:00`,
      endTime: `${((startHour + 8) % 24).toString().padStart(2, '0')}:00`,
      days: [1, 2, 3, 4, 5], // Monday-Friday
      breaks: [
        {
          name: 'Lunch',
          startMinute: startHour * 60 + 240, // 4 hours after start
          durationMinutes: 30
        }
      ]
    }

    this.addShift(calendarName, shift)
  }

  /**
   * Add 24/7 operation (three 8-hour shifts)
   */
  add24x7Operation(calendarName: string): void {
    // Day shift: 6am-2pm
    this.addShift(calendarName, {
      name: 'Day Shift',
      startTime: '06:00',
      endTime: '14:00',
      days: [0, 1, 2, 3, 4, 5, 6],
      breaks: [{ name: 'Break', startMinute: 360 + 120, durationMinutes: 15 }]
    })

    // Evening shift: 2pm-10pm
    this.addShift(calendarName, {
      name: 'Evening Shift',
      startTime: '14:00',
      endTime: '22:00',
      days: [0, 1, 2, 3, 4, 5, 6],
      breaks: [{ name: 'Break', startMinute: 840 + 120, durationMinutes: 15 }]
    })

    // Night shift: 10pm-6am
    this.addShift(calendarName, {
      name: 'Night Shift',
      startTime: '22:00',
      endTime: '06:00',
      days: [0, 1, 2, 3, 4, 5, 6],
      breaks: [{ name: 'Break', startMinute: 1320 + 120, durationMinutes: 15 }]
    })
  }

  /**
   * Add holiday to calendar
   */
  addHoliday(calendarName: string, holiday: Holiday): void {
    const calendar = this.calendars.get(calendarName)
    if (!calendar) return

    calendar.holidays.push(holiday)
  }

  /**
   * Assign calendar to resource
   */
  assignCalendarToResource(resourceName: string, calendarName: string): void {
    this.resourceCalendars.set(resourceName, calendarName)

    // Schedule availability changes
    this.scheduleAvailabilityChanges(resourceName, calendarName)
  }

  /**
   * Schedule all availability changes for a resource
   */
  private scheduleAvailabilityChanges(resourceName: string, calendarName: string): void {
    const calendar = this.calendars.get(calendarName)
    if (!calendar) return

    // Schedule shifts
    calendar.shifts.forEach(shift => {
      this.scheduleShift(resourceName, shift)
    })
  }

  /**
   * Schedule a shift (start, breaks, end)
   */
  private scheduleShift(resourceName: string, shift: Shift): void {
    const startMinute = this.parseTime(shift.startTime)
    const endMinute = this.parseTime(shift.endTime)

    // Find first occurrence of this shift
    let currentTime = 0
    const dayLength = 24 * 60 // minutes per day

    while (currentTime < this.engine.stopTime) {
      const dayOfWeek = this.getDayOfWeek(currentTime)

      if (shift.days.includes(dayOfWeek)) {
        const dayStart = Math.floor(currentTime / dayLength) * dayLength

        // Schedule shift start
        const shiftStartTime = dayStart + startMinute
        if (shiftStartTime > currentTime) {
          this.engine.scheduleEvent(shiftStartTime - this.engine.clock, EventType.CUSTOM, undefined, undefined, {
            type: 'shift_start',
            resourceName,
            shiftName: shift.name
          })
        }

        // Schedule breaks
        shift.breaks.forEach(breakInfo => {
          const breakStartTime = dayStart + breakInfo.startMinute
          if (breakStartTime > currentTime) {
            this.engine.scheduleEvent(breakStartTime - this.engine.clock, EventType.CUSTOM, undefined, undefined, {
              type: 'break_start',
              resourceName,
              breakName: breakInfo.name,
              duration: breakInfo.durationMinutes
            })
          }
        })

        // Schedule shift end
        const shiftEndTime = dayStart + endMinute
        if (shiftEndTime > currentTime) {
          this.engine.scheduleEvent(shiftEndTime - this.engine.clock, EventType.CUSTOM, undefined, undefined, {
            type: 'shift_end',
            resourceName,
            shiftName: shift.name
          })
        }
      }

      currentTime += dayLength
    }
  }

  /**
   * Handle shift start
   */
  handleShiftStart(resourceName: string, shiftName: string, currentTime: number): void {
    const resource = this.engine.getResource(resourceName)
    if (!resource) return

    // Make resource available
    resource.available = resource.capacity

    this.logAvailabilityChange(resourceName, currentTime, true)

    console.log(`[${currentTime.toFixed(2)}] ${resourceName} - ${shiftName} STARTED`)
  }

  /**
   * Handle shift end
   */
  handleShiftEnd(resourceName: string, shiftName: string, currentTime: number): void {
    const resource = this.engine.getResource(resourceName)
    if (!resource) return

    // Make resource unavailable
    resource.available = 0

    this.logAvailabilityChange(resourceName, currentTime, false)

    console.log(`[${currentTime.toFixed(2)}] ${resourceName} - ${shiftName} ENDED`)
  }

  /**
   * Handle break start
   */
  handleBreakStart(resourceName: string, breakName: string, duration: number, currentTime: number): void {
    const resource = this.engine.getResource(resourceName)
    if (!resource) return

    // Make resource unavailable during break
    resource.available = 0

    this.logAvailabilityChange(resourceName, currentTime, false)

    // Schedule break end
    this.engine.scheduleEvent(duration, EventType.CUSTOM, undefined, undefined, {
      type: 'break_end',
      resourceName,
      breakName
    })

    console.log(`[${currentTime.toFixed(2)}] ${resourceName} - ${breakName} STARTED (${duration} min)`)
  }

  /**
   * Handle break end
   */
  handleBreakEnd(resourceName: string, breakName: string, currentTime: number): void {
    const resource = this.engine.getResource(resourceName)
    if (!resource) return

    // Make resource available after break
    resource.available = resource.capacity

    this.logAvailabilityChange(resourceName, currentTime, true)

    console.log(`[${currentTime.toFixed(2)}] ${resourceName} - ${breakName} ENDED`)
  }

  /**
   * Check if resource is available at specific time
   */
  isResourceAvailable(resourceName: string, time: number): boolean {
    const calendarName = this.resourceCalendars.get(resourceName)
    if (!calendarName) return true // No calendar = always available

    const calendar = this.calendars.get(calendarName)
    if (!calendar) return true

    const dayOfWeek = this.getDayOfWeek(time)
    const minuteOfDay = Math.floor(time % (24 * 60))

    // Check if weekend
    if (calendar.weekends.includes(dayOfWeek)) {
      return false
    }

    // Check if holiday
    const date = this.getDateFromTime(time)
    const isHoliday = calendar.holidays.some(h => this.isSameDay(h.date, date))
    if (isHoliday) {
      return false
    }

    // Check if within shift
    let inShift = false
    for (const shift of calendar.shifts) {
      if (shift.days.includes(dayOfWeek)) {
        const startMinute = this.parseTime(shift.startTime)
        const endMinute = this.parseTime(shift.endTime)

        if (minuteOfDay >= startMinute && minuteOfDay < endMinute) {
          inShift = true

          // Check if in break
          const inBreak = shift.breaks.some(breakInfo => {
            const breakEnd = breakInfo.startMinute + breakInfo.durationMinutes
            return minuteOfDay >= breakInfo.startMinute && minuteOfDay < breakEnd
          })

          if (inBreak) {
            return false
          }

          break
        }
      }
    }

    return inShift
  }

  /**
   * Get availability percentage over time period
   */
  getAvailabilityPercentage(resourceName: string, startTime: number, endTime: number): number {
    const sampleInterval = 1 // Check every minute
    let availableMinutes = 0
    let totalMinutes = 0

    for (let t = startTime; t < endTime; t += sampleInterval) {
      if (this.isResourceAvailable(resourceName, t)) {
        availableMinutes++
      }
      totalMinutes++
    }

    return totalMinutes > 0 ? availableMinutes / totalMinutes : 0
  }

  /**
   * Parse time string "HH:MM" to minutes
   */
  private parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number)
    return hours * 60 + minutes
  }

  /**
   * Get day of week from simulation time
   */
  private getDayOfWeek(time: number): number {
    const days = Math.floor(time / (24 * 60))
    const startDayOfWeek = this.simulationStartDate.getDay()
    return (startDayOfWeek + days) % 7
  }

  /**
   * Get date from simulation time
   */
  private getDateFromTime(time: number): Date {
    const days = Math.floor(time / (24 * 60))
    const date = new Date(this.simulationStartDate)
    date.setDate(date.getDate() + days)
    return date
  }

  /**
   * Check if two dates are the same day
   */
  private isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    )
  }

  /**
   * Log availability change
   */
  private logAvailabilityChange(resourceName: string, time: number, available: boolean): void {
    if (!this.resourceAvailabilityHistory.has(resourceName)) {
      this.resourceAvailabilityHistory.set(resourceName, [])
    }

    this.resourceAvailabilityHistory.get(resourceName)!.push({ time, available })
  }

  /**
   * Get availability history for visualization
   */
  getAvailabilityHistory(resourceName: string): { time: number; available: boolean }[] {
    return this.resourceAvailabilityHistory.get(resourceName) || []
  }

  /**
   * Reset system
   */
  reset(): void {
    this.resourceAvailabilityHistory.clear()
  }
}

// ============================================================================
// PREDEFINED CALENDARS
// ============================================================================

export class StandardCalendars {
  /**
   * Create standard 5-day work week (9am-5pm)
   */
  static create5DayWeek(system: ShiftsCalendarsSystem, name: string = 'Standard 5-Day Week'): void {
    system.createCalendar(name)
    system.addStandard8HourShift(name, 'Day Shift', 9)
  }

  /**
   * Create 24/7 operation
   */
  static create24x7(system: ShiftsCalendarsSystem, name: string = '24x7 Operation'): void {
    system.createCalendar(name)
    system.add24x7Operation(name)
  }

  /**
   * Create 2-shift operation (day + evening)
   */
  static create2Shift(system: ShiftsCalendarsSystem, name: string = '2-Shift Operation'): void {
    system.createCalendar(name)
    system.addStandard8HourShift(name, 'Day Shift', 6)
    system.addStandard8HourShift(name, 'Evening Shift', 14)
  }

  /**
   * Add US federal holidays
   */
  static addUSHolidays(system: ShiftsCalendarsSystem, calendarName: string, year: number): void {
    const holidays: Holiday[] = [
      { name: "New Year's Day", date: new Date(year, 0, 1), affectsAllResources: true },
      { name: 'Independence Day', date: new Date(year, 6, 4), affectsAllResources: true },
      { name: 'Thanksgiving', date: new Date(year, 10, 24), affectsAllResources: true },
      { name: 'Christmas', date: new Date(year, 11, 25), affectsAllResources: true }
    ]

    holidays.forEach(holiday => {
      system.addHoliday(calendarName, holiday)
    })
  }
}
