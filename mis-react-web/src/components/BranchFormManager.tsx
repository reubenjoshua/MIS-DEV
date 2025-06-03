import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface BranchFormManagerProps {
  branchId: number;
  isBranchAdmin?: boolean;
}

const API_BASE_URL = 'http://localhost:5000';

// Field key to label mapping
const FIELD_LABELS: Record<string, string> = {
  productionVolume: 'Production Volume (m³)',
  operationHours: 'Operation Hours',
  serviceInterruption: 'Number of Service Interruptions',
  totalHoursServiceInterruption: 'Total Number of Hours of Service Interruption',
  electricityConsumption: 'Electricity Consumption',
  vfdFrequency: 'VFD Frequency (Hz)',
  spotFlow: 'Spot Flow (LPS)',
  spotPressure: 'Spot Pressure (PSI)',
  timeSpotMeasurements: 'Time Spot Measurements were taken',
  lineVoltage1: 'Line Voltage [L1-L2] (Volts)',
  lineVoltage2: 'Line Voltage [L2-L3] (Volts)',
  lineVoltage3: 'Line Voltage [L3-L1] (Volts)',
  lineCurrent1: 'Line Current [L1-L2] (Volts)',
  lineCurrent2: 'Line Current [L2-L3] (Volts)',
  lineCurrent3: 'Line Current [L3-L1] (Volts)',
  // Add more as needed
};

const ALL_POSSIBLE_DAILY_FIELDS = Object.keys(FIELD_LABELS);

const ALL_POSSIBLE_MONTHLY_FIELDS: string[] = [
  // Add your monthly field keys here, and add to FIELD_LABELS above
];

const BranchFormManager: React.FC<BranchFormManagerProps> = ({
  branchId,
  isBranchAdmin = false
}) => {
  const [branchData, setBranchData] = useState<any>(null);
  const [requiredDailyFields, setRequiredDailyFields] = useState<string[]>([]);
  const [requiredMonthlyFields, setRequiredMonthlyFields] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      try {
        const branchRes = await axios.get(`${API_BASE_URL}/api/branches/${branchId}`, { headers });
        setBranchData(branchRes.data);

        const fieldsRes = await axios.get(`${API_BASE_URL}/api/branch/${branchId}/form-config`, { headers });
        setRequiredDailyFields(fieldsRes.data.requiredFields.daily || []);
        setRequiredMonthlyFields(fieldsRes.data.requiredFields.monthly || []);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch branch data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [branchId]);

  const handleFieldToggle = async (type: 'daily' | 'monthly', fieldName: string) => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    let updatedFields: string[] =
      type === 'daily'
        ? requiredDailyFields.includes(fieldName)
          ? requiredDailyFields.filter(f => f !== fieldName)
          : [...requiredDailyFields, fieldName]
        : requiredMonthlyFields.includes(fieldName)
          ? requiredMonthlyFields.filter(f => f !== fieldName)
          : [...requiredMonthlyFields, fieldName];
    try {
      await axios.post(`${API_BASE_URL}/api/branch/${branchId}/required-fields`, {
        type,
        fields: updatedFields
      }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      if (type === 'daily') setRequiredDailyFields(updatedFields);
      else setRequiredMonthlyFields(updatedFields);
      setSuccessMessage(`${type === 'daily' ? 'Daily' : 'Monthly'} required fields updated successfully`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update required fields');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="p-6 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Branch: {branchData?.branchName}</h2>
      <h3 className="text-lg font-semibold mb-2">Daily Form Required Fields</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-6">
        {ALL_POSSIBLE_DAILY_FIELDS.map(fieldName => (
          <label key={fieldName} className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={requiredDailyFields.includes(fieldName)}
              onChange={() => handleFieldToggle('daily', fieldName)}
              id={fieldName}
            />
            <span>{FIELD_LABELS[fieldName] || fieldName}</span>
          </label>
        ))}
      </div>
      <h3 className="text-lg font-semibold mb-2">Monthly Form Required Fields</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-6">
        {ALL_POSSIBLE_MONTHLY_FIELDS.length === 0 && <span className="text-gray-500">No monthly fields defined.</span>}
        {ALL_POSSIBLE_MONTHLY_FIELDS.map(fieldName => (
          <label key={fieldName} className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={requiredMonthlyFields.includes(fieldName)}
              onChange={() => handleFieldToggle('monthly', fieldName)}
              id={fieldName}
            />
            <span>{FIELD_LABELS[fieldName] || fieldName}</span>
          </label>
        ))}
      </div>
      {successMessage && <div className="text-green-600">{successMessage}</div>}
    </div>
  );
};

export default BranchFormManager; 