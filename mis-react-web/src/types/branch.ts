export interface Area {
  id: number;
  areaName: string;
}

export interface Branch {
  id?: number;
  areaId: number;
  branchName: string;
  isActive: boolean;
}

export interface SourceType {
  id?: number;
  branchId?: number;
  sourceType: string;
  isActive: boolean;
}

export interface SourceName {
  id?: number;
  branchId?: number;
  sourceTypeId: number;
  sourceName: string;
  isActive: boolean;
}

export interface DailyForm {
  sourceType: number;
  sourceName: number;
  productionVolume: boolean;
  operationHours: boolean;
  serviceInterruption: boolean;
  totalHoursServiceInterruption: boolean;
  electricityConsumption: boolean;
  VFDFrequency: boolean;
  spotFlow: boolean;
  spotPressure: boolean;
  timeSpotMeasurements: boolean;
  lineVoltage1: boolean;
  lineVoltage2: boolean;
  lineVoltage3: boolean;
  lineCurrent1: boolean;
  lineCurrent2: boolean;
  lineCurrent3: boolean;
  [key: string]: boolean | number;
}

export interface MonthlyForm {
  electricityConsumption: boolean;
  electricityCost: boolean;
  bulkCost: boolean;
  bulkOuttake: boolean;
  bulkProvider: boolean;
  WTPCost: boolean;
  WTPSource: boolean;
  WTPVolume: boolean;
  disinfectionMode: boolean;
  disinfectantCost: boolean;
  disinfectionAmount: boolean;
  disinfectionBrandType: boolean;
  otherTreatmentCost: boolean;
  emergencyLitersConsumed: boolean;
  emergencyFuelCost: boolean;
  emergencyTotalHoursUsed: boolean;
  gensetLitersConsumed: boolean;
  gensetFuelCost: boolean;
  [key: string]: boolean;
}

export interface BranchFormData {
  branch: Branch;
  sourceTypes: SourceType[];
  sourceNames: SourceName[];
  dailyFields: DailyForm;
  monthlyFields: MonthlyForm;
} 