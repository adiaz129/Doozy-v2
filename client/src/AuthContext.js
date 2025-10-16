import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
            const authToken = await AsyncStorage.getItem("authToken");
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
            await AsyncStorage.setItem("authToken", authToken);
            configureAxiosHeaders(authToken);
            const authData = jwtDecode(authToken);
            setAuthState({ token: authToken, uid: authData.uid });
        } catch (error) {
            return Promise.reject(error);
        }
    };

    const logout = async () => {
        try {
            await AsyncStorage.removeItem("authToken");
            configureAxiosHeaders(null);
            setAuthState({ token: null, uid: null });
        } catch (error) {
            console.error("Failed to logout:", error);
        }
        };

    useEffect(() => {
        getAuthState();
    }, []);

    useEffect(() => {
        console.log(auth);
    }, [auth])

    return (
        <AuthContext.Provider value={{ auth, setAuth, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export { AuthContext, AuthProvider };