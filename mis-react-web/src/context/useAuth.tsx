import React from "react";
import Cookies from "js-cookie";
import { useEffect, useState, createContext } from "react";
import { toast } from "react-toastify";
import { UserProfile, UserLogin } from '../models/User';
import { authService } from '@/services/api';

type UserContextType = {
    user:       UserProfile | null;
    token:      string | null;
    loading:    boolean;
    error:      string | null;
    loginUser:  (userData: UserLogin) => Promise<void>;
    logout:     () => void;
    isLoggedIn: () => boolean;
};

type Props = { children: React.ReactNode };

const UserContext = createContext <UserContextType> ({} as UserContextType);

export const UserProvider = ({ children }: Props) => {
    const [token, setToken] = useState <string | null> (null);
    const [user, setUser] = useState <UserProfile | null> (null);
    const [loading, setLoading] = useState <boolean> (false);
    const [error, setError] = useState <string | null> (null);
    const [isReady, setIsReady] = useState (false);
    const tokenExpirationInMs = 60 * 60 * 1000;

    useEffect (() => {
        const storedToken = Cookies.get ("token");
        const lastActivity = Cookies.get ("lastActivity");

        if (storedToken && lastActivity)
        {
            const timeElapsed = Date.now() - Number (lastActivity);

            if (timeElapsed < tokenExpirationInMs)
            {
                setToken (storedToken);
                Cookies.set ("lastActivity", String (Date.now()));
                fetchUserDetails (storedToken);
            }
            else
            { logout(); }
        }

        setIsReady (true);
    }, []);

    const fetchUserDetails = async (token: string) => {
        try {
            const data = await authService.getCurrentUser();
            if (data) setUser(data);
            setIsReady(true);
        } catch (err) {
            setIsReady(true);
        }
    };

    const loginUser = async (userData: UserLogin) => {
        setLoading(true);
        setError(null);
        try {
            console.log('Attempting login with:', userData); // Debug log
            const response = await authService.login(userData.username, userData.password);
            console.log('Login response:', response); // Debug log
            
            const { token, user } = response;
            Cookies.set("token", token);
            Cookies.set("lastActivity", String(Date.now()));
            setToken(token);
            setUser(user);
            await fetchUserDetails(token);
        } catch (err: any) {
            console.error('Login error:', err); // Debug log
            const errorMessage = err.response?.data?.message || 'Login failed. Please try again.';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const isLoggedIn = () => !!token;

    const logout = () => {
        authService.logout();
        Cookies.remove ("token");
        Cookies.remove ("lastActivity");
        setUser (null);
        setToken ("");
        setError(null);
    };

    return (
        <UserContext.Provider
            value = {{
                loginUser,
                user,
                token,
                loading,
                error,
                logout,
                isLoggedIn
            }}
        >
            { isReady ? children : null }
        </UserContext.Provider>
    );
}

export const useAuth = () => React.useContext (UserContext);