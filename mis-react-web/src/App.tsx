// IMPORT LIBRARIES AND DEPENDENCIES
import {
  RouterProvider,
  createBrowserRouter,
  Outlet,
  Navigate,
} from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';

import { AuthProvider } from "./context/AuthContext";

// ROUTES
import ProtectedRoutes    from "./routes/protectedRoutes";
import UnprotectedRoutes  from "./routes/unprotectedRoutes";
import AdminRoutes        from "./routes/adminRoutes";

// LAYOUT
import Layout             from "./components/layout";

// PAGES
import PageNotFound       from "./pages/pageNotFound";
import Login              from "./pages/login";
import DashboardPage      from "./pages/dashboard";
import ManageUser         from "./pages/manageUser";
import ManageBranch       from "./pages/manageBranch";
import Monthly            from "./pages/monthly";
import Daily              from "./pages/daily";
import ApproveData        from "./pages/approveData";
import DataStatus         from "./pages/dataStatus";
import ManageProfile      from "./pages/profile";
import BranchFormManagement from './pages/BranchFormManagement';

const App = () => {
  const NoUserPage = () => (
    <>
      <AuthProvider>
        <Outlet />
        <ToastContainer />
      </AuthProvider>
    </>
  );

  const WithNavigation = () => (
    <>
      <AuthProvider>
        <Layout />
        <ToastContainer />
      </AuthProvider>
    </>
  );

  const routers = createBrowserRouter([
    {
      element: <NoUserPage />,
      children: [
        {
          path: '/',
          element: <Navigate to="/mis" />
        },
        {
          path: '/mis',
          element:
            <UnprotectedRoutes>
              <Login />
            </UnprotectedRoutes>
        },
        {
          path: '/mis/login',
          element:
            <UnprotectedRoutes>
              <Login />
            </UnprotectedRoutes>
        },
        {
          path: '*',
          element: <PageNotFound />
        },
      ],
    },
    {
      element: <WithNavigation />,
      children: [
        {
          path: '/mis/dashboard',
          element:
            <ProtectedRoutes>
              <DashboardPage />
            </ProtectedRoutes>
        },
        {
          path: '/mis/manage-user',
          element:
            <ProtectedRoutes>
              <ManageUser />
            </ProtectedRoutes>
        },
        {
          path: '/mis/manage-branch',
          element:
            <ProtectedRoutes>
              <ManageBranch />
            </ProtectedRoutes>
        },
        {
          path: '/mis/monthly',
          element:
            <ProtectedRoutes>
              <Monthly />
            </ProtectedRoutes>
        },
        {
          path: '/mis/daily',
          element:
            <ProtectedRoutes>
              <Daily />
            </ProtectedRoutes>
        },
        {
          path: '/mis/approve-data',
          element:
            <ProtectedRoutes>
              <ApproveData />
            </ProtectedRoutes>
        },
        {
          path: '/mis/status',
          element:
            <ProtectedRoutes>
              <DataStatus />
            </ProtectedRoutes>
        },
        {
          path: '/mis/profile',
          element:
            <ProtectedRoutes>
              <ManageProfile />
            </ProtectedRoutes>
        },
        {
          path: '/mis/branch-form-management',
          element: <BranchFormManagement />,
        }
      ],
    }
  ]);

  return <RouterProvider router={routers} />;
};

export default App;
