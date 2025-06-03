import React, { useState, useEffect } from "react";
import axios from "axios";

interface ApprovalData {
  date: string;
  area: string;
  branch: string;
  status: string;
  remarks: string;
  action: string;
  comment: string;
  areaName?: string;
  branchName?: string;
  branchId?: string | number;
  sourceType?: string | number;
  sourceTypeName?: string;
  statusName?: string;
  encodedAt?: string;
}

interface SourceType {
  id: number;
  sourceType: string;
  branchId: number | null;
  isActive: boolean;
}

interface Branch {
  id: number;
  branchName: string;
  areaId: number;
  isActive: boolean;
}

export default function ApproveData() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sourceType, setSourceType] = useState("All");
  const [branch, setBranch] = useState("All");
  const [allApprovalData, setAllApprovalData] = useState<ApprovalData[]>([]);
  const [approvalData, setApprovalData] = useState<ApprovalData[]>([]);
  const [sourceTypes, setSourceTypes] = useState<SourceType[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);
  const [userRoleId, setUserRoleId] = useState<number | null>(null);
  const [userBranchId, setUserBranchId] = useState<string | null>(null);

  const isSuperAdmin = userRoleId === 1;

  const fieldMap: { label: string; key: string }[] = [
    { label: "Production Volume (m³)", key: "productionVolume" },
    { label: "Operation Hours", key: "operationHours" },
    { label: "Number of Service Interruptions", key: "serviceInterruption" },
    { label: "Total Number of Hours of Service interruption", key: "totalHoursServiceInterruption" },
    { label: "Electricity Consumption", key: "electricityConsumption" },
    { label: "VFD Frequency (Hz)", key: "vfdFrequency" },
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

  useEffect(() => {
    const token = localStorage.getItem("token");
    const config = { headers: { Authorization: `Bearer ${token}` } };

    // Fetch source types
    console.log("Fetching source types...");
    axios.get("http://localhost:5000/api/source-types", config)
      .then(res => {
        console.log("Source types response (detailed):", JSON.stringify(res.data, null, 2));
        setSourceTypes(res.data);
        // Log state after update
        setTimeout(() => {
          console.log("Current sourceTypes state:", sourceTypes);
        }, 0);
      })
      .catch((err: any) => {
        console.error("Failed to fetch source types:", err);
        console.error("Error details:", err.response?.data || err.message);
      });

    // Fetch branches
    console.log("Fetching branches...");
    axios.get("http://localhost:5000/api/branches", config)
      .then(res => {
        console.log("Branches response (detailed):", JSON.stringify(res.data, null, 2));
        setBranches(res.data);
        // Log state after update
        setTimeout(() => {
          console.log("Current branches state:", branches);
        }, 0);
      })
      .catch((err: any) => {
        console.error("Failed to fetch branches:", err);
        console.error("Error details:", err.response?.data || err.message);
      });
  }, []);

  // Add a useEffect to monitor state changes
  useEffect(() => {
    console.log("sourceTypes state updated:", sourceTypes);
  }, [sourceTypes]);

  useEffect(() => {
    console.log("branches state updated:", branches);
  }, [branches]);

  // Fetch user profile for role and branchId
  useEffect(() => {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };
    axios.get("/api/user/profile", { headers })
      .then(res => {
        const userData = res.data;
        setUserRoleId(userData.roleId ?? null);
        setUserBranchId(userData.branchId?.toString() || null);
      })
      .catch(err => {
        console.error("Failed to fetch user info:", err);
      });
  }, []);

  // For branch admin, autofill and disable branch dropdown
  useEffect(() => {
    if (!isSuperAdmin && userBranchId) {
      setBranch(userBranchId);
    }
  }, [isSuperAdmin, userBranchId]);

  // For branch admin, filter source types to only those present in approval data for their branch
  const availableSourceTypes = isSuperAdmin
    ? sourceTypes.map(st => ({ id: st.id, label: st.sourceType }))
    : Array.from(
        new Map(
          allApprovalData
            .filter(row => String(row.branchId) === String(userBranchId))
            .map(row => {
              const st = sourceTypes.find(st => String(st.id) === String(row.sourceType));
              return [row.sourceType, st ? st.sourceType : row.sourceType];
            })
        ).entries()
      ).map(([id, label]) => ({ id, label }));

  // Move fetchAllData outside useEffect so it can be called after Accept/Reject
  const fetchAllData = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get("http://localhost:5000/api/daily", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllApprovalData(response.data);
      setApprovalData(response.data); // Show all by default
    } catch (err: any) {
      console.error("Failed to fetch approval data:", err);
      console.error("Error details:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    let filtered = allApprovalData;
    // Helper to get YYYY-MM-DD from any date string
    const getDateOnly = (dateStr: string) => {
      if (!dateStr) return "";
      return new Date(dateStr).toISOString().split('T')[0];
    };
    if (fromDate) {
      filtered = filtered.filter(row => getDateOnly(row.date) >= fromDate);
    }
    if (toDate) {
      filtered = filtered.filter(row => getDateOnly(row.date) <= toDate);
    }
    if (sourceType !== "All") {
      filtered = filtered.filter(row => String((row as any).sourceType) === String(sourceType));
    }
    if (branch !== "All") {
      filtered = filtered.filter(row => String((row as any).branchId) === String(branch));
    }
    setApprovalData(filtered);
  }, [fromDate, toDate, sourceType, branch, allApprovalData]);

  return (
    <main className="min-h-screen flex items-center justify-center w-full">
      <div className="rounded-lg p-6 w-full max-w-6xl min-h-screen">
        <h1 className="text-3xl font-medium text-center mb-6">Status for Approval</h1>
        {/* Filter Bar */}
        <div className="flex flex-wrap gap-4 mb-4 items-center justify-between">
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
            {availableSourceTypes.map(st => (
              <option key={st.id} value={st.id}>{st.label}</option>
            ))}
          </select>
          <select
            value={branch}
            onChange={e => setBranch(e.target.value)}
            className="border rounded px-2 py-1"
            disabled={!isSuperAdmin}
          >
            <option value="All">All Branches</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.branchName}</option>
            ))}
          </select>
        </div>
        {/* Table */}
        {loading ? (
          <div className="text-center py-4">Loading...</div>
        ) : (
          <div className="overflow-x-auto w-full" style={{ maxHeight: '60vh', minHeight: '200px', overflowY: 'auto' }}>
            <table className="min-w-full w-full bg-white rounded shadow text-xs sm:text-sm">
              <thead>
                <tr className="bg-gray-100 sticky top-0 z-10">
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Encoded At</th>
                  <th className="px-4 py-2">Area</th>
                  <th className="px-4 py-2">Branch</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Remarks</th>
                  <th className="px-4 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {approvalData.map((row, idx) => (
                  <tr key={idx} className="text-center border-b last:border-b-0">
                    <td className="px-4 py-2 whitespace-nowrap">
                      {row.date
                        ? new Date(row.date).toLocaleDateString('en-PH', {
                            timeZone: 'Asia/Manila',
                            year: 'numeric',
                            month: 'short',
                            day: '2-digit',
                          })
                        : ''}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {row.encodedAt
                        ? new Date(row.encodedAt).toLocaleString('en-PH', {
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
                    <td className="px-4 py-2">{row.areaName || row.area || ''}</td>
                    <td className="px-4 py-2">{row.branchName || row.branch || ''}</td>
                    <td className="px-4 py-2">
                      {(row as any)?.statusName || row.status || "Pending"}
                      {row.remarks === "Accepted" ? " - Accepted" : (row.remarks && row.remarks !== "Accepted" ? " - Rejected" : "")}
                    </td>
                    <td className="px-4 py-2 max-w-xs break-words" title={row.comment || row.statusName}>
                      {row.statusName === "Accepted"
                        ? "Accepted"
                        : (row.statusName === "Rejected" && row.comment
                            ? row.comment
                            : "")}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <button
                        className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700 transition"
                        onClick={() => {
                          setSelectedRow(row);
                          setShowReviewModal(true);
                          setReviewComment("");
                          setReviewError("");
                          setIsRejecting(false);
                        }}
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {/* Review Modal */}
        {showReviewModal && selectedRow && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
            <div className="bg-white p-6 rounded-lg w-full max-w-2xl relative max-h-[65vh] overflow-y-auto">
              <button
                type="button"
                className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-gray-300 text-gray-700 hover:bg-gray-400 hover:text-black transition"
                aria-label="Close"
                onClick={() => setShowReviewModal(false)}
              >
                &#10005;
              </button>
              <h2 className="text-2xl font-semibold text-center mb-6">Daily Collection Sheet</h2>
              <div className="flex flex-col items-center w-full mb-2">
                <input
                  type="date"
                  value={selectedRow.date ? new Date(selectedRow.date).toISOString().slice(0, 10) : ""}
                  readOnly
                  className="mb-2 px-3 py-1 bg-gray-100 border border-gray-400 rounded text-black w-56"
                />
                <div className="flex w-full gap-4 justify-center">
                  <select
                    value={selectedRow.sourceType || ""}
                    disabled
                    className="bg-gray-100 text-black border border-gray-400 rounded px-2 py-1 w-56"
                  >
                    <option value="">{selectedRow.sourceTypeName || "Source Type"}</option>
                  </select>
                  <select
                    value={selectedRow.sourceName || ""}
                    disabled
                    className="bg-gray-100 text-black border border-gray-400 rounded px-2 py-1 w-56"
                  >
                    <option value="">{selectedRow.sourceNameName || "Source Name"}</option>
                  </select>
                </div>
                <div className="w-full mt-2 mb-2 flex flex-col">
                  <label className="text-black text-sm font-semibold mb-1">Branch</label>
                  <input
                    type="text"
                    value={selectedRow.branchName || ""}
                    readOnly
                    className="bg-gray-100 text-black border border-gray-400 rounded px-2 py-1 w-full"
                    placeholder="Branch"
                  />
                </div>
              </div>
              <div className="w-full flex flex-col gap-1 mb-2">
                {fieldMap.map(({ label, key }) => (
                  <div className="flex items-center justify-between" key={label}>
                    <label className="text-black text-sm">{label}</label>
                    <input
                      type="text"
                      className="bg-gray-100 text-black border border-gray-400 rounded px-2 py-1 w-56 h-8"
                      name={key}
                      value={selectedRow[key] ?? ""}
                      readOnly
                    />
                  </div>
                ))}
              </div>
              <div className="w-full mb-4">
                {(selectedRow.remarks === "Rejected" || selectedRow.status === "Rejected") && (
                  <>
                    <label className="text-black text-sm">Rejection Comments</label>
                    <textarea
                      value={selectedRow.comment || selectedRow.remarks || ""}
                      readOnly
                      className="w-full mt-1 bg-gray-100 text-black border border-gray-400 rounded px-2 py-2 min-h-[50px] resize-none"
                    />
                  </>
                )}
              </div>
              {isRejecting ? (
                <div className="mb-4">
                  <label className="block mb-2 font-medium">Rejection Comment</label>
                  <textarea
                    className="w-full border rounded px-2 py-1"
                    value={reviewComment}
                    onChange={e => setReviewComment(e.target.value)}
                    rows={3}
                  />
                  {reviewError && <div className="text-red-600 text-sm mt-1">{reviewError}</div>}
                </div>
              ) : null}
              <div className="flex justify-end gap-2">
                {!isRejecting && (
                  <>
                    <button
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                      onClick={async () => {
                        const token = localStorage.getItem("token");
                        await axios.put(`http://localhost:5000/api/approval-data/${selectedRow.id}`,
                          { status: 'Accepted', remarks: 'Accepted' },
                          { headers: { Authorization: `Bearer ${token}` } }
                        );
                        setShowReviewModal(false);
                        setIsRejecting(false);
                        fetchAllData();
                      }}
                    >
                      Accept
                    </button>
                    <button
                      className="bg-red-700 text-white px-4 py-2 rounded hover:bg-red-800"
                      onClick={() => setIsRejecting(true)}
                    >
                      Reject
                    </button>
                  </>
                )}
                {isRejecting && (
                  <>
                    <button
                      className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                      onClick={() => setIsRejecting(false)}
                    >
                      Cancel
                    </button>
                    <button
                      className="bg-red-700 text-white px-4 py-2 rounded hover:bg-red-800"
                      onClick={async () => {
                        if (!reviewComment.trim()) {
                          setReviewError("Please provide a rejection comment.");
                          return;
                        }
                        const token = localStorage.getItem("token");
                        await axios.put(`http://localhost:5000/api/approval-data/${selectedRow.id}`,
                          { 
                            status: 'Rejected', 
                            remarks: reviewComment,
                            comment: reviewComment  // Add this to ensure both fields are updated
                          },
                          { headers: { Authorization: `Bearer ${token}` } }
                        );
                        setShowReviewModal(false);
                        setIsRejecting(false);
                        fetchAllData();
                      }}
                    >
                      Confirm Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}