/**
 * Excel Import/Export for Simulation Data
 * Provides full Excel integration for data I/O
 */

import * as XLSX from 'xlsx'

export interface ExcelTableData {
  headers: string[]
  rows: any[][]
}

export interface SimulationDataset {
  arrivals?: ExcelTableData
  processes?: ExcelTableData
  resources?: ExcelTableData
  routings?: ExcelTableData
  parameters?: ExcelTableData
}

export interface SimulationResults {
  summary: any[]
  resources: any[]
  entities: any[]
  timeSeries: any[]
}

export class ExcelIntegration {
  /**
   * Import Excel file and parse simulation data
   */
  static async importExcelFile(filePath: string): Promise<SimulationDataset> {
    const workbook = XLSX.readFile(filePath)
    const dataset: SimulationDataset = {}

    // Parse standard sheets
    const sheetNames = ['Arrivals', 'Processes', 'Resources', 'Routings', 'Parameters']

    sheetNames.forEach(sheetName => {
      if (workbook.SheetNames.includes(sheetName)) {
        const sheet = workbook.Sheets[sheetName]
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][]

        if (data.length > 0) {
          const headers = data[0] as string[]
          const rows = data.slice(1)

          dataset[sheetName.toLowerCase() as keyof SimulationDataset] = {
            headers,
            rows
          }
        }
      }
    })

    return dataset
  }

  /**
   * Import Excel from buffer (for web upload)
   */
  static importExcelBuffer(buffer: ArrayBuffer): SimulationDataset {
    const workbook = XLSX.read(buffer, { type: 'array' })
    const dataset: SimulationDataset = {}

    // Parse standard sheets
    const sheetNames = ['Arrivals', 'Processes', 'Resources', 'Routings', 'Parameters']

    sheetNames.forEach(sheetName => {
      if (workbook.SheetNames.includes(sheetName)) {
        const sheet = workbook.Sheets[sheetName]
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][]

        if (data.length > 0) {
          const headers = data[0] as string[]
          const rows = data.slice(1)

          dataset[sheetName.toLowerCase() as keyof SimulationDataset] = {
            headers,
            rows
          }
        }
      }
    })

    return dataset
  }

  /**
   * Parse arrivals table
   */
  static parseArrivals(tableData: ExcelTableData): any[] {
    const arrivals: any[] = []

    tableData.rows.forEach(row => {
      const arrival: any = {}
      tableData.headers.forEach((header, index) => {
        arrival[header.toLowerCase().replace(/\s/g, '_')] = row[index]
      })
      arrivals.push(arrival)
    })

    return arrivals
  }

  /**
   * Parse processes table
   */
  static parseProcesses(tableData: ExcelTableData): any[] {
    const processes: any[] = []

    tableData.rows.forEach(row => {
      const process: any = {}
      tableData.headers.forEach((header, index) => {
        process[header.toLowerCase().replace(/\s/g, '_')] = row[index]
      })
      processes.push(process)
    })

    return processes
  }

  /**
   * Parse resources table
   */
  static parseResources(tableData: ExcelTableData): any[] {
    const resources: any[] = []

    tableData.rows.forEach(row => {
      const resource: any = {}
      tableData.headers.forEach((header, index) => {
        resource[header.toLowerCase().replace(/\s/g, '_')] = row[index]
      })
      resources.push(resource)
    })

    return resources
  }

  /**
   * Export simulation results to Excel
   */
  static exportResultsToExcel(results: SimulationResults, filePath: string): void {
    const workbook = XLSX.utils.book_new()

    // Summary sheet
    if (results.summary && results.summary.length > 0) {
      const summarySheet = XLSX.utils.json_to_sheet(results.summary)
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')
    }

    // Resource utilization sheet
    if (results.resources && results.resources.length > 0) {
      const resourceSheet = XLSX.utils.json_to_sheet(results.resources)
      XLSX.utils.book_append_sheet(workbook, resourceSheet, 'Resources')
    }

    // Entity statistics sheet
    if (results.entities && results.entities.length > 0) {
      const entitySheet = XLSX.utils.json_to_sheet(results.entities)
      XLSX.utils.book_append_sheet(workbook, entitySheet, 'Entities')
    }

    // Time series data sheet
    if (results.timeSeries && results.timeSeries.length > 0) {
      const timeSeriesSheet = XLSX.utils.json_to_sheet(results.timeSeries)
      XLSX.utils.book_append_sheet(workbook, timeSeriesSheet, 'TimeSeries')
    }

    // Write file
    XLSX.writeFile(workbook, filePath)
  }

  /**
   * Export results to Excel buffer (for web download)
   */
  static exportResultsToBuffer(results: SimulationResults): ArrayBuffer {
    const workbook = XLSX.utils.book_new()

    // Summary sheet
    if (results.summary && results.summary.length > 0) {
      const summarySheet = XLSX.utils.json_to_sheet(results.summary)
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')
    }

    // Resource utilization sheet
    if (results.resources && results.resources.length > 0) {
      const resourceSheet = XLSX.utils.json_to_sheet(results.resources)
      XLSX.utils.book_append_sheet(workbook, resourceSheet, 'Resources')
    }

    // Entity statistics sheet
    if (results.entities && results.entities.length > 0) {
      const entitySheet = XLSX.utils.json_to_sheet(results.entities)
      XLSX.utils.book_append_sheet(workbook, entitySheet, 'Entities')
    }

    // Time series data sheet
    if (results.timeSeries && results.timeSeries.length > 0) {
      const timeSeriesSheet = XLSX.utils.json_to_sheet(results.timeSeries)
      XLSX.utils.book_append_sheet(workbook, timeSeriesSheet, 'TimeSeries')
    }

    // Write to buffer
    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    return buffer as ArrayBuffer
  }

  /**
   * Create Excel template for simulation input
   */
  static createTemplate(filePath: string): void {
    const workbook = XLSX.utils.book_new()

    // Arrivals template
    const arrivalsData = [
      ['Entity Type', 'Arrival Rate', 'Rate Unit', 'Distribution', 'Start Time', 'End Time'],
      ['Customer', 10, 'per_hour', 'poisson', 0, 480],
      ['Order', 5, 'per_hour', 'poisson', 0, 480]
    ]
    const arrivalsSheet = XLSX.utils.aoa_to_sheet(arrivalsData)
    XLSX.utils.book_append_sheet(workbook, arrivalsSheet, 'Arrivals')

    // Processes template
    const processesData = [
      ['Process Name', 'Entity Type', 'Resource', 'Processing Time', 'Distribution', 'Next Process'],
      ['Reception', 'Customer', 'Receptionist', 2, 'triangular(1,2,3)', 'Queue'],
      ['Serving', 'Customer', 'Server', 5, 'normal(5,1)', 'Exit']
    ]
    const processesSheet = XLSX.utils.aoa_to_sheet(processesData)
    XLSX.utils.book_append_sheet(workbook, processesSheet, 'Processes')

    // Resources template
    const resourcesData = [
      ['Resource Name', 'Type', 'Capacity', 'Cost per Hour', 'MTBF', 'MTTR'],
      ['Receptionist', 'Worker', 2, 25, 480, 30],
      ['Server', 'Worker', 3, 30, 480, 30],
      ['Machine1', 'Machine', 1, 50, 240, 60]
    ]
    const resourcesSheet = XLSX.utils.aoa_to_sheet(resourcesData)
    XLSX.utils.book_append_sheet(workbook, resourcesSheet, 'Resources')

    // Routings template
    const routingsData = [
      ['From', 'To', 'Condition', 'Probability', 'Priority'],
      ['Reception', 'Queue', 'always', 1.0, 1],
      ['Queue', 'Serving', 'resource_available', 1.0, 1],
      ['Serving', 'Exit', 'always', 1.0, 1]
    ]
    const routingsSheet = XLSX.utils.aoa_to_sheet(routingsData)
    XLSX.utils.book_append_sheet(workbook, routingsSheet, 'Routings')

    // Parameters template
    const parametersData = [
      ['Parameter', 'Value', 'Unit', 'Description'],
      ['Simulation Time', 480, 'minutes', 'Total simulation time'],
      ['Warmup Time', 60, 'minutes', 'Warmup period'],
      ['Number of Replications', 100, 'runs', 'Statistical replications'],
      ['Random Seed', 12345, '', 'Random number seed']
    ]
    const parametersSheet = XLSX.utils.aoa_to_sheet(parametersData)
    XLSX.utils.book_append_sheet(workbook, parametersSheet, 'Parameters')

    // Write file
    XLSX.writeFile(workbook, filePath)
  }

  /**
   * Import time series data from Excel
   */
  static importTimeSeries(filePath: string, sheetName: string = 'TimeSeries'): number[] {
    const workbook = XLSX.readFile(filePath)
    if (!workbook.SheetNames.includes(sheetName)) {
      return []
    }

    const sheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][]

    // Extract first column (assuming it contains the time series values)
    const values: number[] = []
    for (let i = 1; i < data.length; i++) {
      if (typeof data[i][0] === 'number') {
        values.push(data[i][0])
      }
    }

    return values
  }

  /**
   * Export time series data to Excel
   */
  static exportTimeSeries(filePath: string, data: { time: number; value: number }[], seriesName: string = 'Value'): void {
    const workbook = XLSX.utils.book_new()

    const sheetData = [
      ['Time', seriesName],
      ...data.map(d => [d.time, d.value])
    ]

    const sheet = XLSX.utils.aoa_to_sheet(sheetData)
    XLSX.utils.book_append_sheet(workbook, sheet, 'TimeSeries')

    XLSX.writeFile(workbook, filePath)
  }

  /**
   * Import multiple scenarios from Excel
   */
  static importScenarios(filePath: string): Map<string, any> {
    const workbook = XLSX.readFile(filePath)
    const scenarios = new Map<string, any>()

    workbook.SheetNames.forEach(sheetName => {
      if (sheetName.startsWith('Scenario_')) {
        const sheet = workbook.Sheets[sheetName]
        const data = XLSX.utils.sheet_to_json(sheet)
        scenarios.set(sheetName, data)
      }
    })

    return scenarios
  }

  /**
   * Export comparison of multiple scenarios
   */
  static exportScenarioComparison(filePath: string, scenarios: Map<string, any>): void {
    const workbook = XLSX.utils.book_new()

    scenarios.forEach((data, scenarioName) => {
      const sheet = XLSX.utils.json_to_sheet(data)
      XLSX.utils.book_append_sheet(workbook, sheet, scenarioName)
    })

    XLSX.writeFile(workbook, filePath)
  }
}
