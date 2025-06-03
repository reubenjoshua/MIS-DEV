import React from 'react';
import { DailyForm, MonthlyForm } from '../types/branch';

interface DatasheetModalProps {
  show: boolean;
  title: string;
  fields: DailyForm | MonthlyForm;
  setFields: (fields: DailyForm | MonthlyForm) => void;
  onPrevious: () => void;
  onNext: () => void;
  onClose: () => void;
}

const DatasheetModal: React.FC<DatasheetModalProps> = ({
  show,
  title,
  fields,
  setFields,
  onPrevious,
  onNext,
  onClose,
}) => {
  if (!show) return null;

  const handleFieldChange = (fieldName: string) => {
    setFields({
      ...fields,
      [fieldName]: !fields[fieldName as keyof typeof fields]
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="bg-white p-6 rounded-lg w-full max-w-2xl relative">
        <h2 className="text-2xl font-semibold text-center mb-6">{title}</h2>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(fields).map(([key, value]) => {
            // Skip sourceType and sourceName fields as they're handled separately
            if (key === 'sourceType' || key === 'sourceName') return null;
            
            return (
              <div key={key} className="flex items-center">
                <input
                  type="checkbox"
                  id={key}
                  checked={value as boolean}
                  onChange={() => handleFieldChange(key)}
                  className="mr-2"
                />
                <label htmlFor={key} className="capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </label>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-6">
          <button
            type="button"
            onClick={onPrevious}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={onNext}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
          >
            Next
          </button>
        </div>
        <button
          type="button"
          className="absolute top-2 right-4 text-2xl"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
      </div>
    </div>
  );
};

export default DatasheetModal;