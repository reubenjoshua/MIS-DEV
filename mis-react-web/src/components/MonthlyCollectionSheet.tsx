import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

console.log('MonthlyCollectionSheet file loaded');

const columns = [
  { label: "Month", key: "month" },
  { label: "Year", key: "year" },
  { label: "Source Type", key: "sourceTypeName" },
  { label: "Production Volume", key: "productionVolume" },
  { label: "Operation Hours", key: "operationHours" },
  { label: "Number of Service Interruptions", key: "serviceInterruption" },
  { label: "Total Number of Hours of Service Interruption", key: "totalHoursServiceInterruption" },
  { label: "Electricity Consumption", key: "electricityConsumption" },
  { label: "Electricity Cost", key: "electricityCost" },
  { label: "Bulk Cost", key: "bulkCost" },
  { label: "Bulk Outtake", key: "bulkOuttake" },
  { label: "Name of Bulk Provider", key: "bulkProvider" },
  { label: "WTP Raw Water Cost", key: "WTPCost" }
];

const extensionColumns = [
  "WTP Raw Water Volume",
  "Method of Disinfection",
  "Disinfectant Cost",
  "Disinfection Amount",
  "Brand and Type of Disinfectant",
  "Other Treatment Cost",
  "Liters Consumed Emergency Operations",
  "Fuel Cost Emergency Operations",
  "Total Hours Used Emergency Operations",
  "Liters Consumed Genset Operated",
  "Fuel Cost Genset Operated"
];

const MonthlyCollectionSheet: React.FC = () => {
  console.log('MonthlyCollectionSheet rendered');
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [sourceTypes, setSourceTypes] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedSourceType, setSelectedSourceType] = useState<string>("");
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [tableData, setTableData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [token] = useState(localStorage.getItem("token"));
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalSourceType, setModalSourceType] = useState("");
  const [modalSourceName, setModalSourceName] = useState("");
  const [modalDate, setModalDate] = useState<Date | null>(null);
  const [sourceNames, setSourceNames] = useState<any[]>([]);
  const [previewSums, setPreviewSums] = useState({
    productionVolume: 0,
    operationHours: 0,
    serviceInterruption: 0,
    totalHoursServiceInterruption: 0,
  });
  const [requiredFields, setRequiredFields] = useState<string[]>([]);
  const [liveSums, setLiveSums] = useState<{ [key: string]: any }>({});
  const liveSumsCache = useRef<{ [key: string]: any }>({});
  const [liveSumsLoading, setLiveSumsLoading] = useState(false);

  // Monthly fields map
  const monthlyFieldMap = [
    { label: "Electricity Consumption", key: "electricityConsumption" },
    { label: "Electricity Cost", key: "electricityCost" },
    { label: "Bulk Cost", key: "bulkCost" },
    { label: "Bulk Outtake", key: "bulkOuttake" },
    { label: "Name of Bulk provider", key: "bulkProvider" },
    { label: "WTP Raw Water Cost", key: "WTPCost" },
    { label: "WTP Raw Water Source", key: "WTPSource" },
    { label: "WTP Raw Water Volume", key: "WTPVolume" },
    { label: "Method of Disinfection", key: "disinfectionMode" },
    { label: "Disinfectant Cost", key: "disinfectantCost" },
    { label: "Disinfectant amount", key: "disinfectionAmount" },
    { label: "Brand and Type of Disinfectant", key: "disinfectionBrandType" },
    { label: "Other Treatment Cost", key: "otherTreatmentCost" },
    { label: "Liters consumed - Emergency Operations", key: "emergencyLitersConsumed" },
    { label: "Fuel Cost - Emergency Operations", key: "emergencyFuelCost" },
    { label: "Total Hours used - Emergency Operations", key: "emergencyTotalHoursUsed" },
    { label: "Liters consumed - Genset Operated", key: "gensetLitersConsumed" },
    { label: "Fuel Cost - Genset Operated", key: "gensetFuelCost" },
  ];

  const initialMonthlyForm = Object.fromEntries(monthlyFieldMap.map(f => [f.key, ""]));
  const [monthlyForm, setMonthlyForm] = useState<{ [key: string]: string }>(initialMonthlyForm);

  const handleMonthlyFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setMonthlyForm({ ...monthlyForm, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    axios.get("http://localhost:5000/api/source-types", {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      console.log("Source types response:", res.data);
      setSourceTypes(res.data);
    });
    axios.get("http://localhost:5000/api/branches", {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      console.log("Branches response:", res.data);
      setBranches(res.data);
    });
  }, [token]);

  useEffect(() => {
    // Only auto-select the first branch if selectedBranch is undefined (not empty string)
    if (typeof selectedBranch === 'undefined' && branches.length > 0) {
      setSelectedBranch(branches[0].id);
    }
  }, [branches, selectedBranch]);

  useEffect(() => {
    setLoading(true);
    let url = "http://localhost:5000/api/monthly-data";
    let params: any = {};
    if (selectedSourceType) params.sourceTypeId = selectedSourceType;
    if (selectedBranch) params.branchId = selectedBranch;

    axios.get(url, {
      params,
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        setTableData(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedSourceType, selectedBranch, token]);

  useEffect(() => {
    axios.get("http://localhost:5000/api/branch-source-names", {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      console.log("Branch source names response:", res.data);
      setSourceNames(res.data);
    }).catch(err => {
      console.error("Failed to fetch branch source names:", err);
    });
  }, [token]);

  useEffect(() => {
    // Compute filteredSourceNames here
    if (isAddModalOpen && modalSourceType && modalSourceName && modalDate) {
      const d = new Date(modalDate);
      const month = (d.getMonth() + 1).toString();
      const year = d.getFullYear().toString();
      
      // Only make the request if we have valid month and year
      if (month && year) {
        const branchId = sourceNames.find(sn => sn.id?.toString() === modalSourceName)?.branchId;
        if (!branchId) {
          console.error('Could not determine branch ID for selected source name');
          return;
        }

        console.log('Fetching daily sums with params:', {
          branchId,
          sourceTypeId: modalSourceType,
          month,
          year
        });

        // Use the new daily-sums endpoint
        axios.get("http://localhost:5000/api/daily-sums", {
          params: {
            branchId,
            sourceTypeId: modalSourceType,
            month,
            year
          },
          headers: { Authorization: `Bearer ${token}` }
        }).then(res => {
          console.log('Raw daily sums response:', res.data);
          const sums = {
            productionVolume: Number(res.data.productionVolume) || 0,
            operationHours: Number(res.data.operationHours) || 0,
            serviceInterruption: Number(res.data.serviceInterruption) || 0,
            totalHoursServiceInterruption: Number(res.data.totalHoursServiceInterruption) || 0,
          };
          console.log('Processed daily sums:', sums);
          setPreviewSums(sums);
        }).catch(err => {
          console.error('Error fetching daily sums:', err);
          setPreviewSums({
            productionVolume: 0,
            operationHours: 0,
            serviceInterruption: 0,
            totalHoursServiceInterruption: 0,
          });
        });
      }
    } else {
      setPreviewSums({
        productionVolume: 0,
        operationHours: 0,
        serviceInterruption: 0,
        totalHoursServiceInterruption: 0,
      });
    }
  }, [isAddModalOpen, modalSourceType, modalSourceName, modalDate, sourceNames, token]);

  // Add a function to refresh preview sums
  const refreshPreviewSums = () => {
    if (isAddModalOpen && modalSourceType && modalSourceName && modalDate) {
      const d = new Date(modalDate);
      const month = (d.getMonth() + 1).toString();
      const year = d.getFullYear().toString();
      
      if (month && year) {
        const branchId = sourceNames.find(sn => sn.id?.toString() === modalSourceName)?.branchId;
        if (!branchId) return;

        axios.get("http://localhost:5000/api/daily-sums", {
          params: {
            branchId,
            sourceTypeId: modalSourceType,
            month,
            year
          },
          headers: { Authorization: `Bearer ${token}` }
        }).then(res => {
          console.log('Refreshed daily sums:', res.data);
          setPreviewSums({
            productionVolume: res.data.productionVolume || 0,
            operationHours: res.data.operationHours || 0,
            serviceInterruption: res.data.serviceInterruption || 0,
            totalHoursServiceInterruption: res.data.totalHoursServiceInterruption || 0,
          });
        }).catch(err => {
          console.error('Error refreshing daily sums:', err);
        });
      }
    }
  };

  // Add a polling effect to refresh sums periodically while modal is open
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (isAddModalOpen) {
      // Refresh every 5 seconds while modal is open
      intervalId = setInterval(refreshPreviewSums, 5000);
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isAddModalOpen, modalSourceType, modalSourceName, modalDate]);

  // Get the branchId for the selected source name in the modal
  const selectedSourceNameObj = sourceNames.find(sn => sn.id?.toString() === modalSourceName);
  const effectiveBranchId = selectedSourceNameObj?.branchId?.toString() || '';

  // Fetch required fields for monthly when the branchId of the selected source name changes
  useEffect(() => {
    if (effectiveBranchId) {
      const token = localStorage.getItem('token');
      axios.get(`http://localhost:5000/api/required-fields/${effectiveBranchId}`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        setRequiredFields(res.data.monthly || []);
      }).catch(err => {
        console.error('Failed to fetch required fields:', err);
      });
    } else {
      setRequiredFields([]);
    }
  }, [effectiveBranchId]);

  const handleRowClick = (rowIdx: number) => {
    setExpandedRow(expandedRow === rowIdx ? null : rowIdx);
  };

  // Filter data by selectedDate
  const filteredData = selectedDate
    ? tableData.filter(row => {
        if (!row.date) return false;
        const rowDate = new Date(row.date).toISOString().slice(0, 10);
        const selected = selectedDate.toISOString().slice(0, 10);
        return rowDate === selected;
      })
    : tableData;

  // Helper to get month and year from modalDate
  const getMonthYear = (date: Date | null) => {
    if (!date) return { month: '', year: '' };
    const d = new Date(date);
    return { month: (d.getMonth() + 1).toString(), year: d.getFullYear().toString() };
  };

  // Utility to filter unique sourceNames by id
  const uniqueSourceNames = sourceNames.filter(
    (sn, index, self) =>
      index === self.findIndex((s) => s.id === sn.id)
  );

  // Filter source names for the modal based on selected source type
  const filteredSourceNames = uniqueSourceNames.filter(
    sn => sn.sourceTypeId?.toString() === modalSourceType
  );

  const validateForm = () => {
    const missingFields = requiredFields.filter(field => !monthlyForm[field]);
    if (missingFields.length > 0) {
      const fieldLabels = missingFields.map(field => 
        monthlyFieldMap.find(f => f.key === field)?.label || field
      );
      alert(`Please fill in all required fields: ${fieldLabels.join(', ')}`);
      return false;
    }
    return true;
  };

  // Debug logs for required fields
  console.log('Required fields:', requiredFields);
  console.log('monthlyFieldMap:', monthlyFieldMap.map(f => f.key));

  // Helper to build a unique key for caching
  const getSumKey = (row: any) => `${row.branchId}_${row.sourceType}_${row.month}_${row.year}`;

  // Fetch live sums for all visible rows using the batch endpoint
  useEffect(() => {
    if (!tableData || tableData.length === 0) {
      setLiveSums({});
      return;
    }
    setLiveSumsLoading(true);
    const requests = tableData.map(row => ({
      branchId: row.branchId,
      sourceTypeId: row.sourceType,
      month: row.month,
      year: row.year
    }));
    // Check cache first
    const uncachedRequests = requests.filter(req => {
      const key = `${req.branchId}_${req.sourceTypeId}_${req.month}_${req.year}`;
      return !liveSumsCache.current[key];
    });
    if (uncachedRequests.length === 0) {
      // All cached
      const newSums: { [key: string]: any } = {};
      requests.forEach(req => {
        const key = `${req.branchId}_${req.sourceTypeId}_${req.month}_${req.year}`;
        newSums[key] = liveSumsCache.current[key];
      });
      setLiveSums(newSums);
      setLiveSumsLoading(false);
      return;
    }
    // Fetch only uncached
    axios.post("http://localhost:5000/api/daily-sums/batch", {
      requests: uncachedRequests
    }, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      const results = res.data.results || [];
      // Update cache and state
      const newSums: { [key: string]: any } = { ...liveSums };
      results.forEach(sum => {
        const key = `${sum.branchId}_${sum.sourceTypeId}_${sum.month}_${sum.year}`;
        liveSumsCache.current[key] = sum;
        newSums[key] = sum;
      });
      // Add already cached
      requests.forEach(req => {
        const key = `${req.branchId}_${req.sourceTypeId}_${req.month}_${req.year}`;
        if (liveSumsCache.current[key]) newSums[key] = liveSumsCache.current[key];
      });
      setLiveSums(newSums);
      setLiveSumsLoading(false);
    }).catch(err => {
      console.error('Error fetching batch live sums:', err);
      setLiveSumsLoading(false);
    });
  }, [tableData, token]);

  // In the table, replace the 4 columns with live sum values if available
  // Find the keys for the 4 columns
  const sumColumns = [
    'productionVolume',
    'operationHours',
    'serviceInterruption',
    'totalHoursServiceInterruption',
  ];

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-6xl mx-auto p-8 rounded-2xl bg-white shadow-lg flex flex-col">
        <h1 className="text-3xl font-semibold mb-8 mt-2 text-center">Monthly Collection Sheet</h1>
        <div className="flex flex-wrap gap-4 mb-4 items-center justify-center">
          <div className="flex gap-2 items-center">
            <DatePicker
              selected={selectedDate}
              onChange={(date: Date | null) => setSelectedDate(date)}
              className="border rounded-lg px-4 py-2 bg-gray-100"
              dateFormat="yyyy-MM-dd"
              placeholderText="Select a date"
              isClearable
            />
            <span className="ml-2">📅</span>
          </div>
          <select
            className="border rounded px-2 py-1"
            value={selectedSourceType}
            onChange={e => setSelectedSourceType(e.target.value)}
          >
            <option value="">Source Type</option>
            {Array.isArray(sourceTypes) && sourceTypes.map((type: any) => (
              <option key={type.id} value={type.id}>{type.sourceType}</option>
            ))}
          </select>
          <select
            className="border rounded px-2 py-1"
            value={selectedBranch}
            onChange={e => setSelectedBranch(e.target.value)}
          >
            <option value="">Branch</option>
            {Array.isArray(branches) && branches.map((branch: any) => (
              <option key={branch.id} value={branch.id}>{branch.branchName}</option>
            ))}
          </select>
          <button className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition" onClick={() => setIsAddModalOpen(true)}>
            Add
          </button>
        </div>
        <div className="overflow-x-auto w-full" style={{ maxHeight: '500px' }}>
          <table className="min-w-full w-full bg-white rounded-lg text-xs">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="px-3 py-2 text-xs font-semibold text-gray-700 bg-gray-100 border"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={columns.length} className="text-center py-8 text-gray-400">
                    Loading data...
                  </td>
                </tr>
              )}
              {!loading && filteredData.length === 0 && (
                <tr>
                  <td colSpan={columns.length} className="text-center py-8 text-gray-400">
                    No data available.
                  </td>
                </tr>
              )}
              {!loading && filteredData.map((row, idx) => {
                const sumKey = getSumKey(row);
                const liveSum = liveSums[sumKey];
                return (
                  <React.Fragment key={row.id}>
                    <tr
                      className="cursor-pointer hover:bg-gray-50 transition"
                      onClick={() => handleRowClick(idx)}
                    >
                      {columns.map((col) => {
                        // If this is one of the 4 sum columns, use the live sum value
                        if (sumColumns.includes(col.key)) {
                          return (
                            <td key={col.key} className="px-3 py-2 border text-sm font-bold">
                              {liveSumsLoading && !liveSum ? (
                                <span>...</span>
                              ) : liveSum && liveSum[col.key] !== undefined ? (
                                liveSum[col.key]
                              ) : (
                                <span>—</span>
                              )}
                            </td>
                          );
                        } else {
                          return (
                            <td key={col.key} className="px-3 py-2 border text-sm">
                              {row[col.key]}
                            </td>
                          );
                        }
                      })}
                    </tr>
                    {expandedRow === idx && (
                      <tr>
                        <td colSpan={columns.length} className="bg-gray-900">
                          <div className="flex flex-col p-4">
                            <div className="text-gray-200 font-semibold mb-2">
                              Table Extension &gt; Monthly
                            </div>
                            <div className="overflow-x-auto">
                              <table className="min-w-full">
                                <thead>
                                  <tr>
                                    {extensionColumns.map((col) => (
                                      <th
                                        key={col}
                                        className="px-3 py-2 text-xs font-semibold text-gray-100 bg-gray-800 border"
                                      >
                                        {col}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr>
                                    {extensionColumns.map((col) => (
                                      <td
                                        key={col}
                                        className="px-3 py-2 border text-gray-200 bg-gray-700"
                                      >
                                        {(row.extension as any)[col]}
                                      </td>
                                    ))}
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
            <div className="bg-white p-4 rounded-lg w-full max-w-2xl relative" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
              <h2 className="text-2xl font-semibold text-center mb-4">Add Monthly Data</h2>
              <button
                type="button"
                className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-gray-300 text-gray-700 hover:bg-gray-400 hover:text-black transition"
                aria-label="Close"
                onClick={() => setIsAddModalOpen(false)}
              >
                &#10005;
              </button>
              <form onSubmit={async e => {
                e.preventDefault();
                console.log('\n=== FORM SUBMISSION STARTED ===');
                console.log('Current preview sums:', previewSums);
                if (!validateForm()) return;
                
                // Minimal, clean submit logic with debug logs
                console.log('modalSourceName:', modalSourceName);
                const selectedSourceNameObj = sourceNames.find(sn => sn.id?.toString() === modalSourceName);
                console.log('selectedSourceNameObj:', selectedSourceNameObj);
                const branchId = selectedSourceNameObj?.branchId?.toString() || '';
                console.log('branchId:', branchId);
                if (!branchId) {
                  alert('Could not determine branch for selected source name.');
                  return;
                }
                if (!modalSourceName) {
                  alert('Please select a source name.');
                  return;
                }
                // Prepare payload
                const { month, year } = getMonthYear(modalDate);
                console.log('Month/Year from modalDate:', { month, year });
                
                // Convert preview sums to numbers and log each step
                const productionVolume = Number(previewSums.productionVolume) || 0;
                const operationHours = Number(previewSums.operationHours) || 0;
                const serviceInterruption = Number(previewSums.serviceInterruption) || 0;
                const totalHoursServiceInterruption = Number(previewSums.totalHoursServiceInterruption) || 0;
                
                console.log('Converted preview sums:', {
                  productionVolume,
                  operationHours,
                  serviceInterruption,
                  totalHoursServiceInterruption
                });

                const payload = {
                  branchId,
                  sourceType: modalSourceType,
                  sourceName: modalSourceName,
                  month,
                  year,
                  ...monthlyForm,
                  productionVolume,
                  operationHours,
                  serviceInterruption,
                  totalHoursServiceInterruption
                };
                console.log('Final payload to be sent to /api/monthly:', payload);
                try {
                  const token = localStorage.getItem('token');
                  console.log('Making POST request to /api/monthly with token:', token ? 'Token exists' : 'No token');
                  console.log('Request URL:', 'http://localhost:5000/api/monthly');
                  console.log('Request headers:', { Authorization: `Bearer ${token}` });
                  
                  const response = await axios.post('http://localhost:5000/api/monthly', payload, {
                    headers: { Authorization: `Bearer ${token}` }
                  });
                  
                  console.log('Response received:', response.data);
                  setIsAddModalOpen(false);
                  setMonthlyForm(initialMonthlyForm);
                  setModalDate(null);
                  setModalSourceType("");
                  setModalSourceName("");
                  // Refresh table
                  if (selectedSourceType && branchId) {
                    setLoading(true);
                    axios.get("http://localhost:5000/api/monthly-data", {
                      params: {
                        sourceTypeId: selectedSourceType,
                        branchId: branchId,
                      },
                      headers: { Authorization: `Bearer ${token}` }
                    }).then(res => {
                      setTableData(res.data);
                      setLoading(false);
                    }).catch(() => setLoading(false));
                  }
                } catch (err: any) {
                  console.error('Error submitting monthly data:', err);
                  console.error('Error details:', {
                    message: err.message,
                    response: err.response?.data,
                    status: err.response?.status,
                    headers: err.response?.headers
                  });
                  alert('Failed to add monthly data: ' + (err.response?.data?.error || err.message));
                }
                console.log('=== FORM SUBMISSION COMPLETED ===\n');
              }}>
                <div className="flex flex-col items-center w-full mb-1">
                  <DatePicker
                    selected={modalDate}
                    onChange={(date: Date | null) => setModalDate(date)}
                    className="mb-1 px-3 py-1 bg-white border border-gray-400 rounded text-black w-56"
                    dateFormat="yyyy-MM-dd"
                    placeholderText="Select a date"
                    isClearable
                  />
                  <div className="flex w-full gap-2 justify-center mb-2">
                    <select
                      value={modalSourceType}
                      onChange={e => setModalSourceType(e.target.value.toString())}
                      className="bg-white text-black border border-gray-400 rounded px-2 py-1 w-56"
                    >
                      <option value="">Source Type</option>
                      {Array.isArray(sourceTypes) && sourceTypes.map((st: any) => (
                        <option key={st.id} value={st.id.toString()}>{st.sourceType}</option>
                      ))}
                    </select>
                    <select
                      value={modalSourceName}
                      onChange={e => setModalSourceName(e.target.value.toString())}
                      className="bg-white text-black border border-gray-400 rounded px-2 py-1 w-56"
                    >
                      <option value="">Source Name</option>
                      {filteredSourceNames.map(sn => (
                        <option key={sn.id} value={sn.id.toString()}>{sn.sourceName}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2 w-full mb-2 bg-gray-50 p-2 rounded">
                    <div><strong>Production Volume (auto-summed):</strong> {previewSums.productionVolume}</div>
                    <div><strong>Operation Hours (auto-summed):</strong> {previewSums.operationHours}</div>
                    <div><strong>Number of Service Interruptions (auto-summed):</strong> {previewSums.serviceInterruption}</div>
                    <div><strong>Total Number of Hours of Service Interruption (auto-summed):</strong> {previewSums.totalHoursServiceInterruption}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 w-full mb-2">
                    {monthlyFieldMap.map(({ label, key }) => (
                      <div key={key} className="flex flex-col">
                        <label className="text-sm font-medium mb-0.5">
                          {label}
                          {requiredFields.includes(key) && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <input
                          type="text"
                          name={key}
                          value={monthlyForm[key]}
                          onChange={handleMonthlyFormChange}
                          className={`border rounded px-2 py-1 ${
                            requiredFields.includes(key) ? 'border-gray-400' : 'border-gray-300 bg-gray-50 opacity-50 cursor-not-allowed'
                          }`}
                          required={requiredFields.includes(key)}
                          disabled={!requiredFields.includes(key)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex w-full justify-end mt-1">
                  <button
                    type="button"
                    className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-2 px-4 rounded"
                    onClick={() => setIsAddModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded ml-2"
                    disabled={!modalSourceName}
                  >
                    Submit
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MonthlyCollectionSheet;