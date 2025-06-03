import React from 'react';
import { useBranchForm } from '../context/BranchFormContext';

const steps = [
  { number: 1, title: 'Add Branch' },
  { number: 2, title: 'Add Source Name' },
  { number: 3, title: 'Edit Daily' },
  { number: 4, title: 'Edit Monthly' }
];

const BranchFormProgress: React.FC = () => {
  const { currentStep } = useBranchForm();

  return (
    <div className="w-full mb-8">
      <div className="flex justify-between items-center">
        {steps.map((step, index) => (
          <React.Fragment key={step.number}>
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep >= step.number
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {step.number}
              </div>
              <span className="text-sm mt-2">{step.title}</span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-1 mx-4 ${
                  currentStep > step.number ? 'bg-green-600' : 'bg-gray-200'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default BranchFormProgress; 