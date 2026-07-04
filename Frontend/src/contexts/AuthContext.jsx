import axios from "axios";
import { createContext, useState } from "react";

export const AuthContext = createContext({});

const client = axios.create({
    baseURL: "http://192.168.1.16:8000/api/v1/users"
});

export const AuthProvider = ({ children }) => {
    // Sanitizes edge case values from parsing empty local storage states
    const getInitialToken = () => {
        const storedToken = localStorage.getItem("token");
        if (!storedToken || storedToken === "null" || storedToken === "undefined") {
            return null;
        }
        return storedToken;
    };

    const [token, setToken] = useState(getInitialToken());
    const [user, setUser] = useState(null);

    const handleRegister = async (email, username, password) => {
        try {
            const request = await client.post("/register", { email, username, password });
            return request.data?.message || "Registration successful";
        } catch (err) {
            console.error("Registration Error:", err);
            throw err;
        }
    };

    const handleLogin = async (username, password) => {
        try {
            const request = await client.post("/login", { username, password });
            const receivedToken = request.data?.token;

            if (!receivedToken) {
                throw new Error("Login succeeded but no token was returned by the server.");
            }

            localStorage.setItem("token", receivedToken);
            setToken(receivedToken);

            if (request.data.user) setUser(request.data.user);

            console.log("Successfully Authenticated. Token committed:", receivedToken);
            return request.data;
        } catch (err) {
            console.error("Login Error Execution context:", err);
            throw err;
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
    };

    const isAuthenticated = !!token;

    const data = {
        token,
        user,
        isAuthenticated,
        handleRegister,
        handleLogin,
        handleLogout
    };

    return (
        <AuthContext.Provider value={data}>
            {children}
        </AuthContext.Provider>
    );
};