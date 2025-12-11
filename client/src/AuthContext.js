import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';

if (!global.atob) {
  global.atob = atob;
}

const AuthContext = createContext({});

const AuthProvider = ({ children }) => {
    const [auth, setAuthState] = useState({ token: null, uid: null });

    const configureAxiosHeaders = (token) => {
        if (token) {
            axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        } else {
            delete axios.defaults.headers.common["Authorization"];
        }
    };

    const getAuthState = async () => {
        try {
            const authToken = await SecureStore.getItemAsync("authToken");
            if (!authToken) {
                setAuthState({ token: null, uid: null });
                configureAxiosHeaders(null);
                return;
            }
            configureAxiosHeaders(authToken);
            const authData = jwtDecode(authToken);
            setAuthState({ token: authToken, uid: authData.uid });
        } catch (err) {
            setAuthState({ token: null, uid: null });
            configureAxiosHeaders(null);
        }
    };

    const setAuth = async (authToken) => {
        try {
            await SecureStore.setItemAsync("authToken", authToken);
            configureAxiosHeaders(authToken);
            const authData = jwtDecode(authToken);
            setAuthState({ token: authToken, uid: authData.uid });
        } catch (error) {
            return Promise.reject(error);
        }
    };

    const logout = async () => {
        try {
            await SecureStore.deleteItemAsync("authToken");
            configureAxiosHeaders(null);
            setAuthState({ token: null, uid: null });
        } catch (error) {
            console.error("Failed to logout:", error);
        }
        };

    useEffect(() => {
        getAuthState();
    }, []);

    return (
        <AuthContext.Provider value={{ auth, setAuth, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export { AuthContext, AuthProvider };