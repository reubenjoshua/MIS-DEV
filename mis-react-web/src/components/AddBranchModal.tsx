import React from "react";
import { Branch, SourceType, Area } from '../types/branch';

interface AddBranchModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  branch: Branch;
  setBranch: (branch: Branch) => void;
  sourceTypes: SourceType[];
  setSourceTypes: (types: SourceType[]) => void;
  areas: Area[];
  handleClear: () => void;
  allSourceTypes: SourceType[];
}

const AddBranchModal: React.FC<AddBranchModalProps> = ({
  show,
  onClose,
  onSubmit,
  branch,
  setBranch,
  sourceTypes,
  setSourceTypes,
  areas,
  handleClear,
  allSourceTypes,
}) => {
  if (!show) return null;

  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setBranch({ ...branch, [e.target.name]: e.target.value });
  };

  const handleSourceTypeChange = (typeId: number) => {
    const exists = sourceTypes.some(st => st.id === typeId);
    if (exists) {
      setSourceTypes(sourceTypes.filter(st => st.id !== typeId));
    } else {
      const found = allSourceTypes.find(st => st.id === typeId);
      if (found) {
        setSourceTypes([...sourceTypes, found]);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="bg-gray-200 rounded-xl p-8 w-full max-w-md shadow-lg relative">
        <h2 className="text-2xl font-semibold text-center mb-6">Edit Branch</h2>
        <form className="flex flex-col gap-3">
          <label className="text-left">Area</label>
          <select
            name="areaId"
            value={branch.areaId}
            onChange={handleInput}
            className="rounded px-2 py-1 border"
          >
            <option value="">Select Area (default JV)</option>
            {areas.map((area) => (
              <option key={area.id} value={area.id}>{area.areaName}</option>
            ))}
          </select>
          <label className="text-left">Branch Name</label>
          <input
            name="branchName"
            value={branch.branchName}
            onChange={handleInput}
            className="rounded px-2 py-1 border"
          />
          <div className="mt-2 mb-2">
            <div className="font-semibold mb-1">Source Type</div>
            {allSourceTypes.map((type) => (
              type.id !== undefined ? (
                <div key={type.id}>
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={sourceTypes.some(st => st.id === type.id)}
                      onChange={() => handleSourceTypeChange(type.id as number)}
                      className="mr-2"
                    />
                    {type.sourceType}
                  </label>
                </div>
              ) : null
            ))}
          </div>
          <div className="flex justify-between">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition"
            >
              Cancel
            </button>
            {onSubmit && (
              <button
                type="button"
                onClick={onSubmit}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
              >
                Next
              </button>
            )}
          </div>
        </form>
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

export default AddBranchModal;