import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Expose setLoading so components can control loading state
  const setLoadingState = (value) => setLoading(value);

  const fetchUser = async (skipLoadingReset = false) => {
    try {
      const { data } = await api.get("/api/user");
      if (data?.id) {
        console.log('AuthContext: User fetched', { 
          id: data.id, 
          email: data.email, 
          role: data.role 
        });
        setUser(data);
        if (!skipLoadingReset) {
          setLoading(false);
        }
        return data;
      } else {
        console.warn('AuthContext: No user data returned', data);
        setUser(null);
        if (!skipLoadingReset) {
          setLoading(false);
        }
        return null;
      }
    } catch (error) {
      // 401 is expected when user is not authenticated - don't log as error
      if (error.response?.status === 401) {
        setUser(null);
        if (!skipLoadingReset) {
          setLoading(false);
        }
        return null;
      }
      // Only log actual errors (network errors, 500s, etc.)
      console.error('AuthContext: Error fetching user', error);
      setUser(null);
      if (!skipLoadingReset) {
        setLoading(false);
      }
      return null;
    }
  };

  useEffect(() => {
    fetchUser();

    // Listen for auth changes (triggered after login/register)
    const handleAuthChange = () => {
      fetchUser();
    };

    window.addEventListener("auth-change", handleAuthChange);

    return () => {
      window.removeEventListener("auth-change", handleAuthChange);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, setUser, fetchUser, setLoading: setLoadingState }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

