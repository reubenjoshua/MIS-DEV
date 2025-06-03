import React, { useState, useEffect } from 'react';
import { SourceType, Branch, Area } from '../types/branch';
import axios from 'axios';

interface AddSourceNameModalProps {
  show: boolean;
  onClose: () => void;
  branches: Branch[];
  areas: Area[];
  sourceTypes: SourceType[];
  onPrevious: () => void;
  onNext: (branchId: number) => void;
  onSuccess?: () => void;
  editingBranch?: Branch | null;
  setSelectedBranchId: (id: number) => void;
}

const AddSourceNameModal: React.FC<AddSourceNameModalProps> = ({
  show,
  onClose,
  branches,
  areas,
  sourceTypes,
  onPrevious,
  onNext,
  onSuccess,
  editingBranch,
  setSelectedBranchId,
}) => {
  const [selectedAreaId, setSelectedAreaId] = useState<number>(areas[0]?.id || 0);
  const [branchName, setBranchName] = useState('');
  const [selectedTypeId, setSelectedTypeId] = useState<string>('');
  const [newSourceName, setNewSourceName] = useState('');
  const [pendingSourceNames, setPendingSourceNames] = useState<{ sourceName: string; sourceTypeId: number }[]>([]);
  const [saving, setSaving] = useState(false);
  const [existingSourceNames, setExistingSourceNames] = useState<{ sourceName: string; sourceTypeName: string }[]>([]);

  useEffect(() => {
    if (editingBranch) {
      setSelectedAreaId(editingBranch.areaId);
      setBranchName(editingBranch.branchName);
      axios.get(`http://localhost:5000/api/branch/${editingBranch.id}/source-names`)
        .then(res => {
          if (Array.isArray(res.data)) {
            setExistingSourceNames(res.data.map((sn: any) => ({
              sourceName: sn.sourceName,
              sourceTypeName: sn.sourceTypeName
            })));
          }
        });
    } else {
      setSelectedAreaId(areas[0]?.id || 0);
      setBranchName('');
      setExistingSourceNames([]);
      setPendingSourceNames([]);
    }
  }, [editingBranch, areas]);

  if (!show) return null;

  const handleAddSourceName = () => {
    if (newSourceName.trim() && selectedTypeId) {
      setPendingSourceNames([
        ...pendingSourceNames,
        { sourceName: newSourceName.trim(), sourceTypeId: Number(selectedTypeId) }
      ]);
      setNewSourceName('');
      setSelectedTypeId('');
    }
  };

  const handleRemoveSourceName = (idx: number) => {
    setPendingSourceNames(pendingSourceNames.filter((_, i) => i !== idx));
  };

  const handleNext = async () => {
    if (!branchName.trim() || !selectedAreaId || pendingSourceNames.length === 0) {
      alert('Please fill all fields and add at least one source name.');
      return;
    }
    setSaving(true);
    try {
      console.log('Starting branch creation...');
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      // 1. Check if branch exists
      let branchId;
      const existingBranch = branches.find(
        b => b.areaId === selectedAreaId && b.branchName.trim().toLowerCase() === branchName.trim().toLowerCase()
      );
      if (existingBranch) {
        branchId = existingBranch.id;
      } else {
        // Create the branch if it doesn't exist
        const branchRes = await axios.post('http://localhost:5000/api/branches', {
          areaId: selectedAreaId,
          branchName: branchName.trim(),
          isActive: true
        }, config);
        branchId = branchRes.data.id;
      }
      setSelectedBranchId(branchId);
      // 2. Create all source names for this branch
      for (const item of pendingSourceNames) {
        await axios.post('http://localhost:5000/api/source-name', {
          branchId,
          sourceName: item.sourceName,
          sourceTypeId: item.sourceTypeId,
          isActive: true
        }, config);
      }
      console.log('All source names created successfully');
      setPendingSourceNames([]);
      setBranchName('');
      setNewSourceName('');
      setSelectedTypeId('');
      setSaving(false);
      if (onSuccess) onSuccess();
      console.log('Calling onNext with branchId:', branchId);
      onNext(branchId);
    } catch (err) {
      console.error('Error in handleNext:', err);
      setSaving(false);
      alert('Failed to save branch and source names.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="bg-white p-6 rounded-lg w-full max-w-2xl relative">
        <h2 className="text-2xl font-semibold text-center mb-6">Add Branch & Source Names</h2>
        <div className="mb-4">
          <label className="block mb-1">Area</label>
          <select
            value={selectedAreaId}
            onChange={e => setSelectedAreaId(Number(e.target.value))}
            className="mb-2 rounded px-2 py-1 border w-full"
          >
            <option value="">Select Area</option>
            {areas.map(area => (
              <option key={area.id} value={area.id}>{area.areaName}</option>
            ))}
          </select>
          <label className="block mb-1">Branch Name</label>
          <input
            type="text"
            value={branchName}
            onChange={e => setBranchName(e.target.value)}
            placeholder="Enter branch name"
            className="mb-2 rounded px-2 py-1 border w-full"
          />
          <label className="block mb-1">Source Type</label>
          <select
            value={selectedTypeId}
            onChange={e => setSelectedTypeId(e.target.value)}
            className="mb-2 rounded px-2 py-1 border w-full"
          >
            <option value="">Select Source Type</option>
            {sourceTypes.map(st => (
              <option key={st.id} value={st.id}>{st.sourceType}</option>
            ))}
          </select>
          <label className="block mb-1">Source Name</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newSourceName}
              onChange={e => setNewSourceName(e.target.value)}
              placeholder="Enter source name"
              className="flex-1 rounded px-2 py-1 border"
            />
            <button
              onClick={handleAddSourceName}
              className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 transition"
              type="button"
            >
              Add
            </button>
          </div>
        </div>
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Source Names to Add</h3>
          <div className="space-y-2">
            {existingSourceNames.length > 0 && existingSourceNames.map((sn, idx) => (
              <div key={"existing-" + idx} className="flex items-center justify-between bg-gray-100 p-2 rounded text-gray-500">
                {sn.sourceName} - {sn.sourceTypeName} (Existing)
              </div>
            ))}
            {pendingSourceNames.length === 0 && existingSourceNames.length === 0 && <div className="text-gray-500">No source names added yet.</div>}
            {pendingSourceNames.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                <span>
                  {item.sourceName}
                  {" - "}
                  {sourceTypes.find(st => st.id === item.sourceTypeId)?.sourceType}
                </span>
                <button
                  onClick={() => handleRemoveSourceName(idx)}
                  className="text-red-600 hover:text-red-700 ml-2"
                  type="button"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-between">
          <button
            type="button"
            onClick={onPrevious}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition"
            disabled={saving}
          >
            Previous
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Next'}
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

export default AddSourceNameModal;