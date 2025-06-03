import React from "react";

interface AddUserModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  form: any;
  setForm: (form: any) => void;
  handleClear: () => void;
  areas: any[];
  roles: any[];
  branches: any[];
}

const AddUserModal: React.FC<AddUserModalProps> = ({
  show,
  onClose,
  onSubmit,
  form,
  setForm,
  handleClear,
  areas,
  roles,
  branches,
}) => {
  if (!show) return null;

  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="bg-gray-200 rounded-xl p-8 w-full max-w-md shadow-lg relative">
        <h2 className="text-2xl font-semibold text-center mb-6">Add a User</h2>
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <select name="roleId" value={form.roleId} onChange={handleInput} className="rounded px-2 py-1 border" required>
            <option value="">Role</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>{role.roleName}</option>
            ))}
          </select>
          <select name="branchId" value={form.branchId} onChange={handleInput} className="rounded px-2 py-1 border" >
            <option value="">Branch</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>{branch.branchName}</option>
            ))}
          </select>
          <select name="areaId" value={form.areaId} onChange={handleInput} className="rounded px-2 py-1 border" >
            <option value="">Area</option>
            {areas.map((area) => (
              <option key={area.id} value={area.id}>{area.areaName}</option>
            ))}
          </select>
          <input name="firstName" value={form.firstName} onChange={handleInput} className="rounded px-2 py-1 border" placeholder="First Name" required />
          <input name="lastName" value={form.lastName} onChange={handleInput} className="rounded px-2 py-1 border" placeholder="Last Name" required />
          <input name="email" value={form.email} onChange={handleInput} className="rounded px-2 py-1 border" placeholder="Email" type="email" required />
          <input name="username" value={form.username} onChange={handleInput} className="rounded px-2 py-1 border" placeholder="Username" required />
          <input name="password" value={form.password} onChange={handleInput} className="rounded px-2 py-1 border" placeholder="Password" type="password" required />
          <div className="flex justify-between mt-4">
            <button type="button" className="bg-red-700 text-white px-6 py-2 rounded-lg hover:bg-red-800 transition" onClick={handleClear}>
              Clear all
            </button>
            <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition">
              Create User
            </button>
          </div>
        </form>
        <button type="button" className="absolute top-2 right-4 text-2xl" onClick={onClose} aria-label="Close">
          &times;
        </button>
      </div>
    </div>
  );
};

export default AddUserModal;