import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

interface FormData {
  id: number;
  date: string;
  areaName: string;
  branchName: string;
  status: string;
  remarks: string;
  isActive: boolean;
  branchId?: number;
  sourceType?: number;
  sourceName?: number;
  // Form fields
  productionVolume?: number;
  operationHours?: number;
  serviceInterruption?: number;
  totalHoursServiceInterruption?: number;
  electricityConsumption?: number;
  vfdFrequency?: number;
  spotFlow?: number;
  spotPressure?: number;
  timeSpotMeasurements?: string;
  lineVoltage1?: number;
  lineVoltage2?: number;
  lineVoltage3?: number;
  lineCurrent1?: number;
  lineCurrent2?: number;
  lineCurrent3?: number;
  statusName?: string;
  comment?: string;
}

interface SourceType {
  id: number;
  sourceType: string;
}

interface SourceName {
  id: number;
  sourceName: string;
  sourceTypeId: number;
}

export default function DataStatus() {
  const { user } = useAuth();
  const [formData, setFormData] = useState<FormData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState<FormData | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sourceType, setSourceType] = useState("All");
  const [sourceTypes, setSourceTypes] = useState<SourceType[]>([]);
  const [sourceNames, setSourceNames] = useState<SourceName[]>([]);
  const [readOnly, setReadOnly] = useState(false);
  const [requiredFields, setRequiredFields] = useState<string[]>([]);

  // Field mapping for the form
  const fieldMap = [
    { label: "Production Volume (m³)", key: "productionVolume", type: "number" },
    { label: "Operation Hours", key: "operationHours", type: "number" },
    { label: "Number of Service Interruptions", key: "serviceInterruption", type: "number" },
    { label: "Total Hours of Service Interruption", key: "totalHoursServiceInterruption", type: "number" },
    { label: "Electricity Consumption", key: "electricityConsumption", type: "number" },
    { label: "VFD Frequency (Hz)", key: "vfdFrequency", type: "number" },
    { label: "Spot Flow (LPS)", key: "spotFlow", type: "number" },
    { label: "Spot Pressure (PSI)", key: "spotPressure", type: "number" },
    { label: "Time Spot Measurements", key: "timeSpotMeasurements", type: "text" },
    { label: "Line Voltage [L1-L2] (Volts)", key: "lineVoltage1", type: "number" },
    { label: "Line Voltage [L2-L3] (Volts)", key: "lineVoltage2", type: "number" },
    { label: "Line Voltage [L3-L1] (Volts)", key: "lineVoltage3", type: "number" },
    { label: "Line Current [L1] (Amps)", key: "lineCurrent1", type: "number" },
    { label: "Line Current [L2] (Amps)", key: "lineCurrent2", type: "number" },
    { label: "Line Current [L3] (Amps)", key: "lineCurrent3", type: "number" },
  ];

  useEffect(() => {
    const token = localStorage.getItem("token");
    const config = { headers: { Authorization: `Bearer ${token}` } };

    if (user?.roleId === 4 && user?.branchId) {
      // Encoder: fetch only for assigned branch
      axios.get(`http://localhost:5000/api/branch/${user.branchId}/source-types`, config)
        .then(res => setSourceTypes(res.data))
        .catch(err => console.error("Failed to fetch source types:", err));

      axios.get(`http://localhost:5000/api/branch/${user.branchId}/source-names`, config)
        .then(res => setSourceNames(res.data))
        .catch(err => console.error("Failed to fetch source names:", err));
    } else {
      // Other roles: fetch all
      axios.get("http://localhost:5000/api/source-types", config)
        .then(res => setSourceTypes(res.data))
        .catch(err => console.error("Failed to fetch source types:", err));

      axios.get("http://localhost:5000/api/source-names", config)
        .then(res => setSourceNames(res.data))
        .catch(err => console.error("Failed to fetch source names:", err));
    }

    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get("http://localhost:5000/api/daily", {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Filter data for encoder's branch
      let filteredData = response.data.filter((item: FormData) => 
        item.branchId === user?.branchId && item.isActive
      );
      setFormData(filteredData);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch latest source types and names for encoder's branch
  const fetchBranchSources = async () => {
    if (user?.roleId === 4 && user?.branchId) {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const [typesRes, namesRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/branch/${user.branchId}/source-types`, config),
        axios.get(`http://localhost:5000/api/branch/${user.branchId}/source-names`, config)
      ]);
      setSourceTypes(typesRes.data);
      setSourceNames(namesRes.data);
    }
  };

  const fetchRequiredFields = async (branchId: number) => {
    const token = localStorage.getItem("token");
    const config = { headers: { Authorization: `Bearer ${token}` } };
    try {
      const res = await axios.get(`http://localhost:5000/api/required-fields/${branchId}`, config);
      setRequiredFields(res.data.fields || []);
    } catch (err) {
      setRequiredFields([]);
    }
  };

  const handleEditClick = async (item: FormData) => {
    setReadOnly(false);
    if (user?.roleId === 4) {
      await fetchBranchSources();
      await fetchRequiredFields(item.branchId!);
      const token = localStorage.getItem("token");
      try {
        const res = await axios.get(`http://localhost:5000/api/daily/${item.id}`, { headers: { Authorization: `Bearer ${token}` } });
        setSelectedRow(res.data);
        setShowEditModal(true);
      } catch (err) {
        alert("Failed to fetch full record for editing.");
      }
    } else {
      setSelectedRow(item);
      setShowEditModal(true);
    }
  };

  const handleViewClick = (item: FormData) => {
    setReadOnly(true);
    setSelectedRow(item);
    setShowEditModal(true);
  };

  const handleEdit = async (updatedData: FormData) => {
    const token = localStorage.getItem("token");
    try {
      // Format date as YYYY-MM-DD
      const formattedDate = updatedData.date ? new Date(updatedData.date).toISOString().split('T')[0] : "";
      const payload = { ...updatedData, date: formattedDate };
      await axios.put(
        `http://localhost:5000/api/daily/${updatedData.id}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowEditModal(false);
      fetchData();
    } catch (err) {
      console.error("Failed to update data:", err);
      alert("Failed to update data. Please try again.");
    }
  };

  const handleDelete = async (id: number) => {
    const token = localStorage.getItem("token");
    try {
      await axios.put(
        `http://localhost:5000/api/daily/${id}/soft-delete`,
        { isActive: false },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowDeleteConfirm(false);
      fetchData();
    } catch (err) {
      console.error("Failed to delete data:", err);
      alert("Failed to delete data. Please try again.");
    }
  };

  const filteredData = formData.filter(item => {
    if (sourceType !== "All" && item.sourceType !== Number(sourceType)) return false;
    if (fromDate && new Date(item.date) < new Date(fromDate)) return false;
    if (toDate && new Date(item.date) > new Date(toDate)) return false;
    return true;
  });

    return (
    <main className="p-2 sm:p-6 mx-auto">
      <div className="max-w-full sm:max-w-5xl w-full mx-auto bg-white rounded-xl shadow-lg sm:p-8 p-2">
        <h1 className="text-2xl sm:text-3xl font-medium text-center mb-6">Data Status</h1>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-4 mb-4 items-center justify-between">
          <div className="flex items-center gap-2">
            <label className="font-medium">From</label>
            <input
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="border rounded px-2 py-1"
            />
            <span>-</span>
            <label className="font-medium">To</label>
            <input
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className="border rounded px-2 py-1"
            />
          </div>
          <select
            value={sourceType}
            onChange={e => setSourceType(e.target.value)}
            className="border rounded px-2 py-1"
          >
            <option value="All">All Source Types</option>
            {sourceTypes.map(st => (
              <option key={st.id} value={st.id}>{st.sourceType}</option>
            ))}
          </select>
        </div>
        {/* Data Table */}
        {loading ? (
          <div className="text-center py-4">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full bg-white rounded shadow text-xs sm:text-sm">
              <thead>
                <tr className="bg-gray-100 sticky top-0 z-10">
                  <th className="px-2 sm:px-4 py-2">Date</th>
                  <th className="px-2 sm:px-4 py-2">Source Type</th>
                  <th className="px-2 sm:px-4 py-2">Source Name</th>
                  <th className="px-2 sm:px-4 py-2">Status</th>
                  <th className="px-2 sm:px-4 py-2">Remarks</th>
                  <th className="px-2 sm:px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item) => (
                  <tr key={item.id} className="border-b text-center">
                    <td className="px-2 sm:px-4 py-2">{new Date(item.date).toLocaleDateString()}</td>
                    <td className="px-2 sm:px-4 py-2">{sourceTypes.find(st => st.id === item.sourceType)?.sourceType || ""}</td>
                    <td className="px-2 sm:px-4 py-2">{sourceNames.find(sn => sn.id === item.sourceName)?.sourceName || ""}</td>
                    <td className="px-2 sm:px-4 py-2">{item.statusName || item.status}</td>
                    <td className="px-2 sm:px-4 py-2 max-w-xs break-words" title={item.comment || item.statusName}>
                      {item.statusName === "Rejected" ? item.comment : ""}
                    </td>
                    <td className="px-2 sm:px-4 py-2">
                      <div className="flex flex-row gap-2 justify-center items-center w-full">
                        {item.statusName === "Accepted" ? (
                          <button
                            onClick={() => handleViewClick(item)}
                            className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700"
                          >
                            View
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEditClick(item)}
                              className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => { setSelectedRow(item); setShowDeleteConfirm(true); }}
                              className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {/* Edit Modal */}
        {showEditModal && selectedRow && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
            <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <h2 className="text-2xl font-semibold text-center mb-6">Edit Data</h2>
              <form onSubmit={(e) => {
                e.preventDefault();
                handleEdit(selectedRow);
              }}>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex flex-col">
                    <label className="text-sm font-medium mb-1">Source Type</label>
                    <select
                      value={selectedRow.sourceType || ""}
                      onChange={e => setSelectedRow({ ...selectedRow, sourceType: Number(e.target.value), sourceName: undefined })}
                      className="border rounded px-2 py-1"
                      disabled={readOnly}
                    >
                      <option value="">Select Source Type</option>
                      {sourceTypes.map(st => (
                        <option key={st.id} value={st.id}>{st.sourceType}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-medium mb-1">Source Name</label>
                    <select
                      value={selectedRow.sourceName || ""}
                      onChange={e => setSelectedRow({ ...selectedRow, sourceName: Number(e.target.value) })}
                      className="border rounded px-2 py-1"
                      disabled={readOnly}
                    >
                      <option value="">Select Source Name</option>
                      {sourceNames
                        .filter(sn => sn.sourceTypeId === selectedRow.sourceType)
                        .map(sn => (
                          <option key={sn.id} value={sn.id}>{sn.sourceName}</option>
                        ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {fieldMap.map(({ label, key, type }) => (
                    <div key={key} className="flex flex-col">
                      <label className="text-sm font-medium mb-1">{label}</label>
                      <input
                        type={type}
                        value={
                          selectedRow[key as keyof FormData] !== undefined && selectedRow[key as keyof FormData] !== null && typeof selectedRow[key as keyof FormData] !== 'boolean'
                            ? String(selectedRow[key as keyof FormData])
                            : ''
                        }
                        onChange={(e) => setSelectedRow({
                          ...selectedRow,
                          [key]: type === "number" ? parseFloat(e.target.value) : e.target.value
                        })}
                        className="border rounded px-2 py-1"
                        readOnly={readOnly}
                        disabled={readOnly || !requiredFields.includes(key)}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && selectedRow && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
            <div className="bg-white p-6 rounded-lg w-full max-w-md">
              <h2 className="text-xl font-semibold text-center mb-4">Confirm Delete</h2>
              <p className="text-center mb-6">
                Are you sure you want to delete this record? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(selectedRow.id)}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
            </div>
        </main>
    );
}