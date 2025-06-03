import React, { createContext, useContext, useState } from 'react';
import { BranchFormData, Branch, SourceType, SourceName, DailyForm, MonthlyForm } from '../types/branch';

interface BranchFormContextType {
  formData: BranchFormData;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  updateBranch: (branch: Branch) => void;
  updateSourceTypes: (sourceTypes: SourceType[]) => void;
  updateSourceNames: (sourceNames: SourceName[]) => void;
  updateDailyFields: (dailyFields: DailyForm) => void;
  updateMonthlyFields: (monthlyFields: MonthlyForm) => void;
  resetForm: () => void;
}

const initialFormData: BranchFormData = {
  branch: {
    areaId: 0,
    branchName: '',
    isActive: true
  },
  sourceTypes: [],
  sourceNames: [],
  dailyFields: {
    sourceType: 0,
    sourceName: 0,
    productionVolume: false,
    operationHours: false,
    serviceInterruption: false,
    totalHoursServiceInterruption: false,
    electricityConsumption: false,
    VFDFrequency: false,
    spotFlow: false,
    spotPressure: false,
    timeSpotMeasurements: false,
    lineVoltage1: false,
    lineVoltage2: false,
    lineVoltage3: false,
    lineCurrent1: false,
    lineCurrent2: false,
    lineCurrent3: false
  },
  monthlyFields: {
    electricityConsumption: false,
    electricityCost: false,
    bulkCost: false,
    bulkOuttake: false,
    bulkProvider: false,
    WTPCost: false,
    WTPSource: false,
    WTPVolume: false,
    disinfectionMode: false,
    disinfectantCost: false,
    disinfectionAmount: false,
    disinfectionBrandType: false,
    otherTreatmentCost: false,
    emergencyLitersConsumed: false,
    emergencyFuelCost: false,
    emergencyTotalHoursUsed: false,
    gensetLitersConsumed: false,
    gensetFuelCost: false
  }
};

const BranchFormContext = createContext<BranchFormContextType | undefined>(undefined);

export const BranchFormProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [formData, setFormData] = useState<BranchFormData>(initialFormData);
  const [currentStep, setCurrentStep] = useState(1);

  const updateBranch = (branch: Branch) => {
    setFormData(prev => ({ ...prev, branch }));
  };

  const updateSourceTypes = (sourceTypes: SourceType[]) => {
    setFormData(prev => ({ ...prev, sourceTypes }));
  };

  const updateSourceNames = (sourceNames: SourceName[]) => {
    setFormData(prev => ({ ...prev, sourceNames }));
  };

  const updateDailyFields = (dailyFields: DailyForm) => {
    setFormData(prev => ({ ...prev, dailyFields }));
  };

  const updateMonthlyFields = (monthlyFields: MonthlyForm) => {
    setFormData(prev => ({ ...prev, monthlyFields }));
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setCurrentStep(1);
  };

  return (
    <BranchFormContext.Provider
      value={{
        formData,
        currentStep,
        setCurrentStep,
        updateBranch,
        updateSourceTypes,
        updateSourceNames,
        updateDailyFields,
        updateMonthlyFields,
        resetForm
      }}
    >
      {children}
    </BranchFormContext.Provider>
  );
};

export const useBranchForm = () => {
  const context = useContext(BranchFormContext);
  if (context === undefined) {
    throw new Error('useBranchForm must be used within a BranchFormProvider');
  }
  return context;
}; 