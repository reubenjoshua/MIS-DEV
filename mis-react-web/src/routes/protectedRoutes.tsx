import { useAuth } from '../context/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

interface Props {
    children: React.ReactNode;
}

const ProtectedRoutes = ({ children }: Props) => {
    const location = useLocation();
    const { user, loading } = useAuth();

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
        <>{children}</>
    ) : (
        <Navigate
            to="/mis/login"
            state={{ from: location }}
            replace
        />
    );
};

export default ProtectedRoutes;