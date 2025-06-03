import { useEffect, useState } from "react";
import axios from "axios";
import AddUserModal from "../components/AddUserModal";
import { useAuth } from "../context/AuthContext";

// Define a User type for type safety
interface User {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  roleId?: number;
  areaId?: number;
  branchId?: number;
  isActive: boolean;
  roleName?: string;
  areaName?: string;
  branchName?: string;
}

interface Area {
  id: number;
  name: string;
}

interface Role {
  id: number;
  name: string;
}

interface Branch {
  id: number;
  name: string;
}

interface FormData {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  roleId: number;
  areaId: number;
  branchId: number;
  isActive: boolean;
}

export default function ManageUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormData>({
    id: 0,
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    roleId: 0,
    areaId: 0,
    branchId: 0,
    isActive: true
  });
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');

  const handleClear = () => {
    setForm({
      id: 0,
      firstName: '',
      lastName: '',
      email: '',
      username: '',
      password: '',
      roleId: 0,
      areaId: 0,
      branchId: 0,
      isActive: true
    });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prepare the payload for the backend
    const payload = {
      userName: form.username,
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      password: form.password,
      roleId: Number(form.roleId),
      areaId: Number(form.areaId),
      branchId: Number(form.branchId),
    };

    try {
      await axios.post("http://localhost:5000/api/auth/register", payload);
      // Optionally, fetch users again to update the table
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get("http://localhost:5000/api/users", config);
      setUsers(res.data);
      setShowModal(false);
      handleClear();
    } catch (err: any) {
      alert(
        err.response?.data?.message ||
        "Failed to create user. Please check your input."
      );
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const config = { headers: { Authorization: `Bearer ${token}` } };

    // Fetch users with optional branch filtering
    axios.get("http://localhost:5000/api/users", config)
      .then(res => {
        let userList = res.data;
        // Filter users if logged in as branch admin
        if (user && user.roleId === 3) {
          userList = userList.filter((u: User) => u.branchId === user.branchId);
        }
        setUsers(userList);
      })
      .catch(err => {
        console.error("Failed to fetch users", err);
      });

    axios.get("http://localhost:5000/api/areas", config)
      .then(res => setAreas(res.data))
      .catch(err => console.error("Failed to fetch areas", err));

    axios.get("http://localhost:5000/api/roles", config)
      .then(res => setRoles(res.data))
      .catch(err => console.error("Failed to fetch roles", err));

    axios.get("http://localhost:5000/api/branches", config)
      .then(res => setBranches(res.data))
      .catch(err => console.error("Failed to fetch branches", err));
  }, [user]);

  // Filter branches for branch admin
  const filteredBranches = branches.filter((branch: any) => {
    if (user?.roleId === 3) {
      return branch.id === user.branchId;
    }
    return true;
  });

  // Filter roles for branch admin (they can only create encoders)
  const filteredRoles = roles.filter((role: any) => {
    if (user?.roleId === 3) {
      return role.id === 4; // Assuming 4 is the encoder role ID
    }
    return true;
  });

  const handleToggleActive = async (user: User) => {
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.put(
        `http://localhost:5000/api/users/${user.id}/toggle-active`,
        {},
        config
      );
      
      // Update the users list with the new status
      setUsers(users.map(u => 
        u.id === user.id ? { ...u, isActive: response.data.isActive } : u
      ));
    } catch (error: any) {
      console.error('Error toggling user status:', error.response || error);
      alert(`Failed to update user status: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleEdit = (user: User) => {
    setForm({
      id: user.id || 0,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      username: user.username,
      password: '', // Don't set password when editing
      roleId: user.roleId || 0,
      areaId: user.areaId || 0,
      branchId: user.branchId || 0,
      isActive: user.isActive
    });
    setShowModal(true);
  };

  const renderUserTable = (userList: User[]) => (
    <div className="w-full overflow-x-auto">
      <div className="max-h-[400px] overflow-y-auto">
        <table className="min-w-[600px] w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2">First Name</th>
              <th className="px-4 py-2">Last Name</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Area</th>
              <th className="px-4 py-2">Branch</th>
              <th className="px-4 py-2">Role</th>
              <th className="px-4 py-2">Active</th>
              <th className="px-4 py-2">Username</th>
              <th className="px-4 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {userList.map((user, idx) => (
              <tr key={user.id || idx} className="text-center">
                <td className="px-4 py-2">{user.firstName}</td>
                <td className="px-4 py-2">{user.lastName}</td>
                <td className="px-4 py-2">{user.email}</td>
                <td className="px-4 py-2">{user.areaName || ""}</td>
                <td className="px-4 py-2">{user.branchName || ""}</td>
                <td className="px-4 py-2">{user.roleName || ""}</td>
                <td className="px-4 py-2">
                  <input
                    type="checkbox"
                    checked={user.isActive}
                    onChange={() => handleToggleActive(user)}
                    className="accent-green-600 w-5 h-5 cursor-pointer"
                  />
                </td>
                <td className="px-4 py-2">{user.username}</td>
                <td className="px-4 py-2">
                  <button 
                    className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700 transition"
                    onClick={() => handleEdit(user)}
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
    <div className="rounded-xl p-8 w-full max-w-6xl shadow mx-auto mt-16">
      <h2 className="text-3xl font-medium text-center mb-6">Manage Users</h2>
      <div className="flex justify-end mb-4">
        <button
          className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 transition"
          onClick={() => setShowModal(true)}
        >
          Add User
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
          Active Users
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'inactive'
              ? 'border-b-2 border-green-600 text-green-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('inactive')}
        >
          Inactive Users
        </button>
      </div>

      {/* User Tables */}
      {activeTab === 'active' ? (
        renderUserTable(users.filter(u => u.isActive))
      ) : (
        renderUserTable(users.filter(u => !u.isActive))
      )}

      <AddUserModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmit}
        form={form}
        setForm={setForm}
        handleClear={handleClear}
        areas={areas}
        roles={filteredRoles}
        branches={filteredBranches}
      />
    </div>
  );
}