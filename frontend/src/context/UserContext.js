// src/context/UserContext.js
import { createContext, useEffect, useState } from "react";
import io from "socket.io-client";
import api from "../services/api";

export const UserContext = createContext();

const socket = io("http://localhost:5000");

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch initial user profile
    const fetchProfile = async () => {
      try {
        const response = await api.get("/users/profile");
        setUser(response.data);
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();

    // Listen for profile updates via socket
    socket.on("profileUpdated", (updatedUser) => {
      if (user && updatedUser._id === user._id) {
        setUser(updatedUser);
      }
    });

    return () => {
      socket.off("profileUpdated");
    };
  }, [user]);

  return (
    <UserContext.Provider value={{ user, setUser, loading, socket }}>
      {children}
    </UserContext.Provider>
  );
}
