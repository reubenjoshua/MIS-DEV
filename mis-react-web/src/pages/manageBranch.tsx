import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
// import AddBranchModal from "../components/AddBranchModal";
import AddSourceNameModal from "../components/AddSourceNameModal";
import DatasheetModal from "../components/DailyDataSheetModal";
import BranchFormProgress from "../components/BranchFormProgress";
import { BranchFormProvider, useBranchForm } from "../context/BranchFormContext";
import { Branch, Area, DailyForm, MonthlyForm, SourceType } from "../types/branch";
import ConfirmModal from '../components/ConfirmModal';

const ManageBranchContent: React.FC = () => {
  const { user } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [sourceTypes, setSourceTypes] = useState<SourceType[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [onConfirmAction, setOnConfirmAction] = useState<() => void>(() => () => {});
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');
  
  const {
    formData,
    currentStep,
    setCurrentStep,
    updateBranch,
    updateSourceTypes,
    updateSourceNames,
    updateDailyFields,
    updateMonthlyFields,
    resetForm
  } = useBranchForm();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const config = { headers: { Authorization: `Bearer ${token}` } };

    axios.get("http://localhost:5000/api/branches", config)
      .then(res => {
        let branchList = res.data;
        if (user && user.roleId === 3) {
          branchList = branchList.filter((b: Branch) => b.id === user.branchId);
        }
        setBranches(branchList);
      })
      .catch(err => console.error("Failed to fetch branches", err));

    axios.get("http://localhost:5000/api/areas", config)
      .then(res => setAreas(res.data))
      .catch(err => console.error("Failed to fetch areas", err));

    axios.get("http://localhost:5000/api/source-types", config)
      .then(res => setSourceTypes(res.data))
      .catch(err => console.error("Failed to fetch source types", err));
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    // Transform formData to match backend expectations
    const payload = {
      areaId: formData.branch.areaId,
      branchName: formData.branch.branchName,
      sourceTypes: formData.sourceTypes.map(st => ({
        id: st.id,
        sourceNames: formData.sourceNames
          .filter(sn => sn.sourceTypeId === st.id)
          .map(sn => sn.sourceName)
      }))
    };
    try {
      await axios.post(
        "http://localhost:5000/api/branch/full-create",
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Branch and all related data saved successfully!");
      resetForm();
      setShowModal(false);
      // Refresh branches list
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get("http://localhost:5000/api/branches", config);
      setBranches(res.data);
    } catch (err: any) {
      alert("Failed to save: " + (err.response?.data?.message || err.message));
    }
  };

  const handleNext = () => {
    setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  // Wrapper functions for modal navigation to match expected signatures
  const handleNextStep = async () => {
    // Save required fields when leaving the Daily Datasheet step (step 3)
    if (currentStep === 3 && selectedBranchId) {
      const checkedFields = Object.entries(formData.dailyFields)
        .filter(([key, value]) => value === true)
        .map(([key]) => key);
      try {
        await axios.post(`/api/required-fields/${selectedBranchId}`, {
          type: 'daily',
          fields: checkedFields,
        });
        // Instead of closing, advance to monthly required fields step
        setCurrentStep(4);
      } catch (err) {
        console.error('Failed to save required fields:', err);
      }
    }
    // Save required fields when leaving the Monthly Datasheet step (step 4)
    else if (currentStep === 4 && selectedBranchId) {
      const checkedDailyFields = Object.entries(formData.dailyFields)
        .filter(([key, value]) => value === true)
        .map(([key]) => key);
      const checkedMonthlyFields = Object.entries(formData.monthlyFields)
        .filter(([key, value]) => value === true)
        .map(([key]) => key);
      try {
        // Save daily required fields
        await axios.post(`/api/required-fields/${selectedBranchId}`, {
          type: 'daily',
          fields: checkedDailyFields,
        });
        // Save monthly required fields
        await axios.post(`/api/required-fields/${selectedBranchId}`, {
          type: 'monthly',
          fields: checkedMonthlyFields,
        });
        // Close modal and reset after saving required fields
        setShowModal(false);
        setCurrentStep(1);
        resetForm();
      } catch (err) {
        console.error('Failed to save required fields:', err);
      }
    }
  };
  const handlePreviousStep = () => handlePrevious();
  const handleFinalSubmit = () => handleSubmit({ preventDefault: () => {} } as React.FormEvent);

  const handleStepSubmit = async () => {
    if (currentStep === 1) {
      // Simulate branch submit (replace with your actual submit logic)
      await handleSubmit({ preventDefault: () => {} } as React.FormEvent);
      setConfirmMessage('Branch created! Proceed to add source names?');
      setOnConfirmAction(() => () => {
        setCurrentStep(2);
        setShowConfirm(false);
      });
      setShowConfirm(true);
    } else if (currentStep === 2) {
      // Simulate source name submit (replace with your actual submit logic)
      setConfirmMessage('Source names saved! Proceed to Daily/Monthly forms?');
      setOnConfirmAction(() => () => {
        setCurrentStep(3);
        setShowConfirm(false);
      });
      setShowConfirm(true);
    } else if (currentStep === 3) {
      setConfirmMessage('Daily form saved! Proceed to Monthly form?');
      setOnConfirmAction(() => () => {
        setCurrentStep(4);
        setShowConfirm(false);
      });
      setShowConfirm(true);
    } else if (currentStep === 4) {
      // Final submit
      await handleSubmit({ preventDefault: () => {} } as React.FormEvent);
      setShowModal(false);
      setCurrentStep(1);
    }
  };

  const handleCancel = () => setShowConfirm(false);

  const fetchBranches = async () => {
    const token = localStorage.getItem("token");
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const res = await axios.get("http://localhost:5000/api/branches", config);
    setBranches(res.data);
  };

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setShowModal(true);
  };

  const handleBranchCreated = (branchId: number) => {
    console.log('handleBranchCreated called with branchId:', branchId);
    setSelectedBranchId(branchId);
    setConfirmMessage('Branch created! Proceed to Daily/Monthly forms?');
    setOnConfirmAction(() => () => {
      setCurrentStep(3); // Skip step 2 and go directly to daily forms
      setShowConfirm(false);
    });
    setShowConfirm(true);
  };

  const handleToggleActive = async (branch: Branch) => {
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.put(
        `http://localhost:5000/api/branches/${branch.id}/toggle-active`,
        {},
        config
      );
      
      // Update the branches list with the new status
      setBranches(branches.map(b => 
        b.id === branch.id ? { ...b, isActive: response.data.isActive } : b
      ));
    } catch (error) {
      console.error('Error toggling branch status:', error);
      alert('Failed to update branch status');
    }
  };

  const renderCurrentStep = () => {
    console.log('renderCurrentStep called with currentStep:', currentStep);
    switch (currentStep) {
      case 1:
        return (
          <AddSourceNameModal
            show={showModal}
            onClose={() => { setShowModal(false); setEditingBranch(null); }}
            branches={branches}
            areas={areas}
            sourceTypes={sourceTypes}
            editingBranch={editingBranch}
            onPrevious={() => setShowModal(false)}
            onNext={handleBranchCreated}
            onSuccess={fetchBranches}
            setSelectedBranchId={setSelectedBranchId}
          />
        );
      case 2:
        // This case is no longer needed as we skip directly to step 3
        return null;
      case 3:
        return (
          <DatasheetModal
            show={showModal}
            title="Forms for Daily Datasheet"
            fields={formData.dailyFields}
            setFields={updateDailyFields as (fields: DailyForm | MonthlyForm) => void}
            onPrevious={handlePreviousStep}
            onNext={handleNextStep}
            onClose={() => setShowModal(false)}
          />
        );
      case 4:
        return (
          <DatasheetModal
            show={showModal}
            title="Forms for Monthly Datasheet"
            fields={formData.monthlyFields}
            setFields={updateMonthlyFields as (fields: DailyForm | MonthlyForm) => void}
            onPrevious={() => setCurrentStep(3)}
            onNext={handleNextStep}
            onClose={() => setShowModal(false)}
          />
        );
      default:
        return null;
    }
  };

  const renderBranchTable = (branchList: Branch[]) => (
    <div className="w-full overflow-x-auto">
      <div className="max-h-[400px] overflow-y-auto">
        <table className="min-w-[600px] w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2">Branch</th>
              <th className="px-4 py-2">Area</th>
              <th className="px-4 py-2">Active</th>
              <th className="px-4 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {branchList.map((branch) => (
              <tr key={branch.id} className="text-center">
                <td className="px-4 py-2">{branch.branchName}</td>
                <td className="px-4 py-2">
                  {areas.find(a => a.id === branch.areaId)?.areaName}
                </td>
                <td className="px-4 py-2">
                  <input
                    type="checkbox"
                    checked={branch.isActive}
                    onChange={() => handleToggleActive(branch)}
                    className="accent-green-600 w-5 h-5 cursor-pointer"
                  />
                </td>
                <td className="px-4 py-2">
                  <button
                    className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700 transition"
                    onClick={() => handleEdit(branch)}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="rounded-xl p-8 w-full max-w-3xl shadow mx-auto mt-16">
      <h2 className="text-3xl font-medium text-center mb-6">Manage Branch</h2>
      <div className="flex justify-end mb-4">
        <button
          className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 transition"
          onClick={() => setShowModal(true)}
        >
          Add Branch
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-4">
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'active'
              ? 'border-b-2 border-green-600 text-green-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('active')}
        >
          Active Branches
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'inactive'
              ? 'border-b-2 border-green-600 text-green-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('inactive')}
        >
          Inactive Branches
        </button>
      </div>

      {/* Branch Tables */}
      {activeTab === 'active' ? (
        renderBranchTable(branches.filter(b => b.isActive))
      ) : (
        renderBranchTable(branches.filter(b => !b.isActive))
      )}

      {showModal && renderCurrentStep()}
      <ConfirmModal
        show={showConfirm}
        message={confirmMessage}
        onConfirm={onConfirmAction}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
};

const ManageBranch: React.FC = () => {
  return (
    <BranchFormProvider>
      <ManageBranchContent />
    </BranchFormProvider>
  );
};

export default ManageBranch;