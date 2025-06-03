import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface Props {
    children: React.ReactNode;
}

const AdminRoutes = ({ children }: Props) => {
    const location = useLocation();
    const { user } = useAuth();

    return (user?.roleId === 1 ||
            user?.roleId === 2 ||
            user?.roleId === 3 ||
            user?.roleId === 4)
        ? (
            <>{children}</>
        ) : (
            <Navigate
                to="/mis/login"
                state={{ from: location }}
                replace
            />
        );
};

export default AdminRoutes;