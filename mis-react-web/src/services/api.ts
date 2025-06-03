import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add auth token
api.interceptors.request.use((config) => {
  console.log(`Making ${config.method?.toUpperCase()} request to: ${config.url}`); // Debug log
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for logging
api.interceptors.response.use(
  (response) => {
    console.log(`Response from ${response.config.url}:`, response.data); // Debug log
    return response;
  },
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    }); // Debug log
    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  login: async (username: string, password: string) => {
    try {
      console.log('Attempting login with:', { username }); // Debug log
      const response = await api.post('/auth/login', { username, password });
      console.log('Login response:', response.data); // Debug log
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error: any) {
      console.error('Login error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      }); // Debug log
      throw error;
    }
  },

  register: async (userData: any) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
};

// User services
export const userService = {
  getProfile: async () => {
    const response = await api.get('/user/profile');
    return response.data;
  },

  getAllUsers: async () => {
    const response = await api.get('/users');
    return response.data;
  },
};

// Area services
export const areaService = {
  getAllAreas: async () => {
    const response = await api.get('/areas');
    return response.data;
  },
};

// Branch services
export const branchService = {
  getAllBranches: async () => {
    const response = await api.get('/branches');
    return response.data;
  },

  createBranch: async (branchData: any) => {
    const response = await api.post('/branches', branchData);
    return response.data;
  },
};

// Role services
export const roleService = {
  getAllRoles: async () => {
    const response = await api.get('/roles');
    return response.data;
  },
};

// Daily report services
export const dailyService = {
  getAllDaily: async () => {
    const response = await api.get('/daily');
    return response.data;
  },
};

// Monthly report services
export const monthlyService = {
  getAllMonthly: async () => {
    const response = await api.get('/monthly');
    return response.data;
  },
};

// Source type services
export const sourceTypeService = {
  getAllSourceTypes: async () => {
    const response = await api.get('/source-types');
    return response.data;
  },
};

// Source name services
export const sourceNameService = {
  getAllSourceNames: async () => {
    const response = await api.get('/source-names');
    return response.data;
  },

  createSourceName: async (sourceNameData: any) => {
    const response = await api.post('/source-names', sourceNameData);
    return response.data;
  },
};

// Status services
export const statusService = {
  getAllStatus: async () => {
    const response = await api.get('/status');
    return response.data;
  },
};

export default api; 