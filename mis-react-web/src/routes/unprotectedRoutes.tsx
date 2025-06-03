import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface Props {
    children: React.ReactNode;
}

const UnprotectedRoutes = ({ children }: Props) => {
    const location = useLocation();
    const { user, loading } = useAuth();
    console.log('UnprotectedRoutes:', { user, loading });

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="flex space-x-2">
                    <div className="h-2.5 w-2.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="h-2.5 w-2.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="h-2.5 w-2.5 bg-primary rounded-full animate-bounce"></div>
                </div>
            </div>
        );
    }

    return user ? (
        <Navigate
            to="/mis/dashboard"
            state={{ from: location }}
            replace
        />
    ) : (
        <>{children}</>
    );
};

export default UnprotectedRoutes;