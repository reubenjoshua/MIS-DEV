import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { DailyForm, MonthlyForm } from '../types/branch';

const API_BASE_URL = 'http://localhost:5000';

const BranchFormManagement: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [branchData, setBranchData] = useState<any>(null);
  const [dailyFields, setDailyFields] = useState<DailyForm>({});
  const [monthlyFields, setMonthlyFields] = useState<MonthlyForm>({});
  const [sourceTypes, setSourceTypes] = useState<any[]>([]);
  const [sourceNames, setSourceNames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [selectedSourceType, setSelectedSourceType] = useState<string>('');

  useEffect(() => {
    if (!user) {
      navigate('/mis/login');
    }
  }, [user, navigate]);

  // Fetch all necessary data when component mounts
  useEffect(() => {
    if (user?.branchId) {
      const fetchData = async () => {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        try {
          // Fetch branch details
          const branchRes = await axios.get(`/api/branches/${user.branchId}`, { headers });
          setBranchData(branchRes.data);

          // Fetch required fields
          const fieldsRes = await axios.get(`/api/required-fields/${user.branchId}`, { headers });
          setDailyFields(fieldsRes.data.dailyFields || {});
          setMonthlyFields(fieldsRes.data.monthlyFields || {});

          // Fetch source types and names
          const detailsRes = await axios.get(`/api/branch/${user.branchId}/details`, { headers });
          setSourceTypes(detailsRes.data.sourceTypes);
          setSourceNames(detailsRes.data.sourceNames);
        } catch (err: any) {
          setError(err.response?.data?.message || 'Failed to fetch branch data');
          console.error('Error fetching data:', err);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }
  }, [user?.branchId]);

  const handleUpdateRequiredFields = async (type: 'daily' | 'monthly', fields: any) => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    
    try {
      await axios.post(`/api/required-fields/${user?.branchId}`, {
        type,
        fields
      }, { headers });
      
      // Update local state
      if (type === 'daily') {
        setDailyFields(fields);
      } else {
        setMonthlyFields(fields);
      }
      setSuccessMessage(`${type === 'daily' ? 'Daily' : 'Monthly'} form fields updated successfully`);
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to update ${type} form fields`);
      console.error(`Error updating ${type} form fields:`, err);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (type: 'daily' | 'monthly', fieldName: string, checked: boolean) => {
    const currentFields = type === 'daily' ? dailyFields : monthlyFields;
    const updatedFields = {
      ...currentFields,
      [fieldName]: checked
    };
    handleUpdateRequiredFields(type, updatedFields);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Branch Form Management</h1>
        {branchData && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Branch Information</h2>
            <p className="text-gray-600">Branch Name: {branchData.branchName}</p>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{successMessage}</span>
          </div>
        )}

        <div className="mb-4 flex items-center space-x-2">
          <button
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            onClick={() => {
              setSelectedFields([]);
              setSelectedSourceType('');
              setShowAddModal(true);
            }}
          >
            Add
          </button>
        </div>

        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
            <div className="bg-white rounded-xl p-8 w-full max-w-2xl shadow-lg relative">
              <h2 className="text-2xl font-semibold text-center mb-6">Forms for Daily Datasheet</h2>
              <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.keys(dailyFields).map(fieldName => (
                  <label key={fieldName} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedFields.includes(fieldName)}
                      onChange={() => {
                        setSelectedFields(selectedFields =>
                          selectedFields.includes(fieldName)
                            ? selectedFields.filter(f => f !== fieldName)
                            : [...selectedFields, fieldName]
                        );
                      }}
                    />
                    <span>{fieldName}</span>
                  </label>
                ))}
              </div>
              <div className="mb-6">
                <select
                  value={selectedSourceType}
                  onChange={e => setSelectedSourceType(e.target.value)}
                  className="border rounded px-2 py-1 w-full"
                >
                  <option value="">Source Type</option>
                  {sourceTypes.map(st => (
                    <option key={st.id} value={st.id}>{st.sourceType || st.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-between mt-8">
                <button
                  className="bg-gray-700 text-white px-6 py-2 rounded"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="bg-green-600 text-white px-6 py-2 rounded"
                  // onClick={handleSave} // To be implemented
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Daily Form Configuration */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Daily Form Fields</h2>
            <div className="space-y-3">
              {Object.entries(dailyFields).map(([fieldName, isRequired]) => (
                <div key={fieldName} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`daily-${fieldName}`}
                    checked={isRequired}
                    onChange={(e) => handleFieldChange('daily', fieldName, e.target.checked)}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`daily-${fieldName}`} className="ml-2 block text-sm text-gray-900">
                    {fieldName}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Form Configuration */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Monthly Form Fields</h2>
            <div className="space-y-3">
              {Object.entries(monthlyFields).map(([fieldName, isRequired]) => (
                <div key={fieldName} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`monthly-${fieldName}`}
                    checked={isRequired}
                    onChange={(e) => handleFieldChange('monthly', fieldName, e.target.checked)}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`monthly-${fieldName}`} className="ml-2 block text-sm text-gray-900">
                    {fieldName}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Source Types and Names Management */}
          <div className="bg-white p-6 rounded-lg shadow md:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Source Types and Names</h2>
            <div className="space-y-6">
              {sourceTypes.map((sourceType) => (
                <div key={sourceType.id} className="border-b pb-4">
                  <h3 className="font-medium mb-2">{sourceType.sourceType}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {sourceNames
                      .filter((sn) => sn.sourceTypeId === sourceType.id)
                      .map((sourceName) => (
                        <div key={sourceName.id} className="text-sm text-gray-600">
                          {sourceName.sourceName}
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BranchFormManagement; 