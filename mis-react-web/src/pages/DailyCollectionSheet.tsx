import React, { useState, useEffect } from "react";
import axios from "axios";

interface SourceName {
  id: number;
  sourceName: string;
  sourceTypeId: number;
  branchId: number;
  sourceTypeName?: string;
}

const tableHeaders = [
  "Date",
  "Encoded At",
  "Source Type",
  "Production Volume",
  "Operation Hours",
  "Number of Service Interruptions",
  "Total Number of Hours of Service Interruption",
  "Electricity Consumption",
  "VFD Frequency",
  "Spot Flow",
  "Spot Pressure",
  "Time Spot Measurements were taken",
  "Line Voltage [L1-L2]",
  "Line Voltage [L2-L3]",
  "Line Voltage [L3-L1]",
  "Line Current [L1-L2]",
  "Line Current [L2-L3]",
  "Line Current [L3-L1]",
  // Add more columns as needed
];

const initialForm = {
  date: "",
  sourceType: "",
  sourceName: "",
  productionVolume: "",
  operationHours: "",
  serviceInterruption: "",
  totalHoursServiceInterruption: "",
  electricityConsumption: "",
  vfdFrequency: "",
  spotFlow: "",
  spotPressure: "",
  timeSpotMeasurements: "",
  lineVoltage1: "",
  lineVoltage2: "",
  lineVoltage3: "",
  lineCurrent1: "",
  lineCurrent2: "",
  lineCurrent3: "",
  branchId: "",
  areaId: "",
};

type DailyFormType = typeof initialForm;

const DailyCollectionSheet: React.FC = () => {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sourceType, setSourceType] = useState("");
  const [branch, setBranch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [sourceTypes, setSourceTypes] = useState<{ id: string; sourceType: string }[]>([]);
  const [branches, setBranches] = useState<{ id: string; branchName: string; areaId: number; isActive: boolean }[]>([]);
  const [sourceNames, setSourceNames] = useState<SourceName[]>([]);
  const [form, setForm] = useState<DailyFormType>(initialForm);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requiredFields, setRequiredFields] = useState<string[]>([]);
  const [fetchedBranch, setFetchedBranch] = useState<any | null>(null);
  const [userBranchId, setUserBranchId] = useState<string | null>(null);
  const [userRoleId, setUserRoleId] = useState<number | null>(null);
  const isSuperAdmin = userRoleId === 1;

  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    // Fetch user info to get assigned branch and role
    axios.get("/api/user/profile", { headers })
      .then(res => {
        const userData = res.data;
        console.log('Debug - User data received:', userData);
        if (!userData.branchId && userData.roleId !== 1) {
          console.error('Debug - No branchId in user data:', userData);
          setError('User branch information not found');
        }
        setUserBranchId(userData.branchId?.toString() || null);
        setUserRoleId(userData.roleId ?? null);
      })
      .catch(err => {
        console.error("Failed to fetch user info:", err);
        setError('Failed to fetch user information');
      });

    axios.get("/api/source-types", { headers })
      .then(res => setSourceTypes(res.data))
      .catch(err => console.error("Failed to fetch source types", err));

    axios.get("/api/branches", { headers })
      .then(res => setBranches(res.data))
      .catch(err => console.error("Failed to fetch branches", err));
  }, []);

  // Fetch source names/types for the user's branch or all if super admin
  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    if (userRoleId === 1) {
      // Super admin: fetch all source name-branch links
      axios.get(`/api/branch-source-names`, { headers })
        .then(res => setSourceNames(res.data))
        .catch(err => console.error("Failed to fetch source names", err));
    } else if (userBranchId) {
      // Branch admin: fetch only for their branch
      axios.get(`/api/branch/${userBranchId}/source-names`, { headers })
        .then(res => setSourceNames(res.data))
        .catch(err => console.error("Failed to fetch source names", err));
    } else {
      setSourceNames([]);
    }
  }, [userBranchId, userRoleId]);

  useEffect(() => {
    fetchRecords();
  }, []);

  // Get unique source types from the sourceNames array
  const uniqueSourceTypes = Array.from(
    new Map(sourceNames.map(sn => [sn.sourceTypeId, sn.sourceTypeName])).entries()
  ).map(([id, name]) => ({ id, name }));

  // Filter source names by selected source type
  const filteredSourceNamesForForm = form.sourceType
    ? sourceNames.filter(sn => sn.sourceTypeId?.toString() === form.sourceType)
    : sourceNames;

  // When a source name is selected, get its branchId for required fields and form submission
  const selectedSourceNameForForm = sourceNames.find(sn => sn.id?.toString() === form.sourceName);
  const effectiveBranchId = selectedSourceNameForForm?.branchId?.toString() || '';
  const selectedBranch = branches.find(b => b.id?.toString() === effectiveBranchId);
  const areaId = selectedBranch?.areaId || null;

  // Debug logs for source name and branchId
  console.log('Selected source name for form:', selectedSourceNameForForm);
  console.log('Effective branchId:', effectiveBranchId);

  // Fetch required fields when effectiveBranchId changes
  useEffect(() => {
    console.log('useEffect for required fields, effectiveBranchId:', effectiveBranchId);
    if (effectiveBranchId) {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      axios.get(`/api/required-fields/${effectiveBranchId}`, { headers })
        .then(res => {
          console.log('Fetched required fields API response:', res.data);
          setRequiredFields(res.data.daily || []);
        })
        .catch(err => console.error("Failed to fetch required fields", err));
    } else {
      setRequiredFields([]);
    }
  }, [effectiveBranchId]);

  // Explicit mapping for form fields
  const fieldMap = [
    { label: "Production Volume (m³)", key: "productionVolume" },
    { label: "Operation Hours", key: "operationHours" },
    { label: "Number of Service Interruptions", key: "serviceInterruption" },
    { label: "Total Number of Hours of Service interruption", key: "totalHoursServiceInterruption" },
    { label: "Electricity Consumption", key: "electricityConsumption" },
    { label: "VFD Frequency (Hz)", key: "VFDFrequency" },
    { label: "Spot Flow (LPS)", key: "spotFlow" },
    { label: "Spot Pressure (PSI)", key: "spotPressure" },
    { label: "Time Spot Measurements were taken", key: "timeSpotMeasurements" },
    { label: "Line Voltage [L1-L2] (Volts)", key: "lineVoltage1" },
    { label: "Line Voltage [L2-L3] (Volts)", key: "lineVoltage2" },
    { label: "Line Voltage [L3-L1] (Volts)", key: "lineVoltage3" },
    { label: "Line Current [L1-L2] (Volts)", key: "lineCurrent1" },
    { label: "Line Current [L2-L3] (Volts)", key: "lineCurrent2" },
    { label: "Line Current [L3-L1] (Volts)", key: "lineCurrent3" },
  ];

  // Debug log before rendering the form
  console.log('Debug - Rendering form with requiredFields:', requiredFields);
  fieldMap.forEach(f => console.log('Field:', f.key, 'Enabled:', requiredFields.includes(f.key)));

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleClear = () => setForm(initialForm);

  const fetchRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/daily', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecords(res.data);
      console.log("Fetched records:", res.data);
    } catch (err) {
      setError('Failed to fetch records');
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Add validation for effectiveBranchId
    if (!effectiveBranchId) {
      setError('Unable to determine branch. Please select a source name and try again.');
      setLoading(false);
      return;
    }
    if (!form.sourceType) {
      setError('Unable to determine source type. Please select a source type and try again.');
      setLoading(false);
      return;
    }
    // Validate required fields
    const missingFields = requiredFields.filter(field => {
      const value = form[field as keyof typeof form];
      return value === "" || value === undefined || value === null;
    });

    if (missingFields.length > 0) {
      setError(`Please fill in all required fields: ${missingFields.join(", ")}`);
      setLoading(false);
      return;
    }

    // Debug: log form state before constructing payload
    console.log('Form state on submit:', form);
    // Validate date before submit
    if (!form.date || typeof form.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(form.date)) {
      setError('Please select a valid date.');
      setLoading(false);
      return;
    }
    try {
      const token = localStorage.getItem('token');
      // Destructure and convert numeric fields, but leave date as string
      const {
        serviceInterruption,
        vfdFrequency,
        productionVolume,
        operationHours,
        electricityConsumption,
        spotFlow,
        spotPressure,
        timeSpotMeasurements,
        lineVoltage1,
        lineVoltage2,
        lineVoltage3,
        lineCurrent1,
        lineCurrent2,
        lineCurrent3,
        totalHoursServiceInterruption,
        // do not destructure date
        ...rest
      } = form;

      const payload = {
        ...rest,
        date: form.date, // keep as string
        serviceInterruption: Number(serviceInterruption),
        totalHoursServiceInterruption: Number(totalHoursServiceInterruption),
        VFDFrequency: Number(vfdFrequency),
        productionVolume: Number(productionVolume),
        operationHours: Number(operationHours),
        electricityConsumption: Number(electricityConsumption),
        spotFlow: Number(spotFlow),
        spotPressure: Number(spotPressure),
        timeSpotMeasurements: Number(timeSpotMeasurements),
        lineVoltage1: Number(lineVoltage1),
        lineVoltage2: Number(lineVoltage2),
        lineVoltage3: Number(lineVoltage3),
        lineCurrent1: Number(lineCurrent1),
        lineCurrent2: Number(lineCurrent2),
        lineCurrent3: Number(lineCurrent3),
        isActive: true,
        branchId: effectiveBranchId, // Use effectiveBranchId
        sourceType: form.sourceType, // Use sourceType from form
        areaId: areaId, // Use areaId from selected branch or null
      };

      // Debug: log payload before sending
      console.log('Debug - Final payload:', payload);
      console.log('Debug - Using branch ID:', effectiveBranchId);

      await axios.post('/api/daily', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsFormOpen(false);
      setForm(initialForm);
      fetchRecords(); // Refresh table
    } catch (err) {
      setError('Failed to submit data');
      console.error('Submit error:', err);
    }
    setLoading(false);
  };

  // Filtering logic: show all records if no filters, otherwise filter by date range, source type, and branch
  const anyFilterActive = !!fromDate || !!toDate || !!sourceType || !!branch;

  const filteredRecords = records.filter(rec => {
    if (!anyFilterActive) return true;

    // Date range filter (using date, compare only date part)
    let matchesDate = true;
    if (fromDate || toDate) {
      const getDateOnly = (dateStr: string) => {
        if (!dateStr) return "";
        return new Date(dateStr).toISOString().split('T')[0];
      };
      const recDate = getDateOnly(rec.date);
      if (fromDate && recDate < fromDate) return false;
      if (toDate && recDate > toDate) return false;
    }

    // Source Type filter
    const matchesSourceType = !sourceType || (rec.sourceType && rec.sourceType.toString() === sourceType);

    // Branch filter (using branchId)
    const matchesBranch = !branch || (rec.branchId && rec.branchId.toString() === branch);

    return matchesDate && matchesSourceType && matchesBranch;
  });

  const handleOpenForm = () => {
    setForm(initialForm);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setForm(initialForm);
    setRequiredFields([]);
  };

  // Debug log for filtered source names
  console.log('All sourceNames:', sourceNames);
  console.log('Filtered sourceNames for form:', filteredSourceNamesForForm);
  // Additional debug logs for dropdown population
  console.log("userRoleId:", userRoleId);
  console.log("branch:", branch);
  console.log("userBranchId:", userBranchId);

  // For branch admin, autofill and disable branch dropdown
  useEffect(() => {
    if (!isSuperAdmin && userBranchId) {
      setBranch(userBranchId);
    }
  }, [isSuperAdmin, userBranchId]);

  // For branch admin, filter source types to only those present in sourceNames for their branch
  const availableSourceTypes = isSuperAdmin
    ? sourceTypes.map(st => ({ id: st.id, label: st.sourceType })) // all source types
    : Array.from(
        new Map(sourceNames.map(sn => [sn.sourceTypeId, sn.sourceTypeName])).entries()
      ).map(([id, label]) => ({ id, label }));

  return (
    <div className="p-6 rounded-lg shadow-lg max-w-6xl mx-auto min-h-screen flex flex-col">
      <h1 className="text-2xl font-semibold text-center mb-6">Daily Collection Sheet</h1>
      <div className="flex flex-wrap gap-4 mb-4 items-center justify-center">
        <div className="flex items-center gap-2">
          <label className="font-medium">From</label>
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="border rounded px-2 py-1" />
        </div>
        <div className="flex items-center gap-2">
          <label className="font-medium">To</label>
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="border rounded px-2 py-1" />
        </div>
        <select value={sourceType} onChange={e => setSourceType(e.target.value)} className="border rounded px-2 py-1">
          <option value="">Source Type</option>
          {availableSourceTypes.map(st => (
            <option key={st.id} value={st.id}>{st.label}</option>
          ))}
        </select>
        <select
          value={branch}
          onChange={e => setBranch(e.target.value)}
          className="border rounded px-2 py-1"
          disabled={!isSuperAdmin} // Disable for branch admin
        >
          <option value="">Branch</option>
          {branches.map(b => (
            <option key={b.id} value={b.id}>{b.branchName}</option>
          ))}
        </select>
        <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded" onClick={handleOpenForm}>Add</button>
      </div>
      <div className="overflow-x-auto w-full max-w-full" style={{ maxHeight: '500px' }}>
        {loading && <div className="text-center py-4 text-gray-700">Loading...</div>}
        {error && <div className="text-center py-4 text-red-600">{error}</div>}
        <table className="min-w-full w-full bg-white rounded shadow text-xs">
          <thead className="sticky top-0 bg-white z-10">
            <tr>
              {tableHeaders.map((header, idx) => (
                <th
                  key={idx}
                  className="px-3 py-2 font-semibold text-gray-700 border-b whitespace-nowrap"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRecords.length === 0 && !loading ? (
              <tr>
                <td colSpan={tableHeaders.length} className="text-center py-4 text-gray-500 whitespace-nowrap">
                  No records found.
                </td>
              </tr>
            ) : (
              filteredRecords.map((rec, idx) => (
                <tr key={idx}>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {rec.date
                      ? new Date(rec.date).toLocaleDateString('en-PH', {
                          timeZone: 'Asia/Manila',
                          year: 'numeric',
                          month: 'short',
                          day: '2-digit',
                        })
                      : ''}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {rec.encodedAt
                      ? new Date(rec.encodedAt).toLocaleString('en-PH', {
                          timeZone: 'Asia/Manila',
                          year: 'numeric',
                          month: 'short',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: true,
                        }) + ' PHT'
                      : ''}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">{rec.sourceType}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{rec.productionVolume}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{rec.operationHours}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{rec.serviceInterruption}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{rec.totalHoursServiceInterruption}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{rec.electricityConsumption}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{rec.VFDFrequency}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{rec.spotFlow}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{rec.spotPressure}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{rec.timeSpotMeasurements}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{rec.lineVoltage1}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{rec.lineVoltage2}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{rec.lineVoltage3}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{rec.lineCurrent1}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{rec.lineCurrent2}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{rec.lineCurrent3}</td>
                  {/* Add more cells as needed */}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Modal/Form for Add */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl relative">
            <h2 className="text-2xl font-semibold text-center mb-6">Add Daily Data</h2>
            <button
              type="button"
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-gray-300 text-gray-700 hover:bg-gray-400 hover:text-black transition"
              aria-label="Close"
              onClick={handleCloseForm}
            >
              &#10005;
            </button>
            <form onSubmit={handleSubmit}>
              <div className="flex flex-col items-center w-full mb-2">
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleFormChange}
                  className="mb-2 px-3 py-1 bg-white border border-gray-400 rounded text-black w-56"
                  required
                />
                <div className="flex w-full gap-4 justify-center">
                  <select
                    name="sourceType"
                    value={form.sourceType}
                    onChange={handleFormChange}
                    className="bg-white text-black border border-gray-400 rounded px-2 py-1 w-56"
                  >
                    <option value="">Source Type</option>
                    {availableSourceTypes.map(st => (
                      <option key={st.id} value={st.id}>{st.label}</option>
                    ))}
                  </select>
                  <select
                    name="sourceName"
                    value={form.sourceName}
                    onChange={handleFormChange}
                    className="bg-white text-black border border-gray-400 rounded px-2 py-1 w-56"
                  >
                    <option value="">Source Name</option>
                    {filteredSourceNamesForForm.map((sn: SourceName, index: number) => (
                      <option key={`${sn.id}_${sn.sourceTypeId}_${index}`} value={sn.id}>{sn.sourceName}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="w-full flex flex-col gap-1 mb-2">
                {fieldMap.map(({ label, key }) => (
                  <div className="flex items-center justify-between" key={label}>
                    <label className="text-black text-sm">
                      {label}
                      {requiredFields.includes(key) && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <input
                      type="text"
                      className={`bg-white text-black border border-gray-400 rounded px-2 py-1 w-56 h-8 ${
                        !requiredFields.includes(key) ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      name={key}
                      value={form[key as keyof typeof form] ?? ""}
                      onChange={handleFormChange}
                      required={requiredFields.includes(key)}
                      disabled={!requiredFields.includes(key)}
                    />
                  </div>
                ))}
              </div>
              <div className="flex w-full justify-between mt-2">
                <button
                  type="button"
                  className="bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-6 rounded"
                  onClick={handleClear}
                >
                  Clear all
                </button>
                <button
                  type="submit"
                  className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-2 px-6 rounded"
                >
                  Submit
                </button>
                <button
                  type="button"
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded"
                >
                  Approve
                </button>
                <button
                  type="button"
                  className="bg-red-800 hover:bg-red-900 text-white font-bold py-2 px-6 rounded"
                >
                  Decline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyCollectionSheet; 