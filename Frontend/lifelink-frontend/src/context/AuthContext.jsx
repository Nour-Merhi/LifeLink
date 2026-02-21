import { createContext, useContext, useEffect, useState, useRef } from "react";
import api, { clearAuthToken, getAuthToken } from "../api/axios";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const justLoggedInRef = useRef(false); 
  const initialFetchDoneRef = useRef(false); 
  
  const setLoadingState = (value) => setLoading(value);

  const setUserWithAuth = (userData) => {
    console.log('AuthContext: Setting user', { 
      hasUser: !!userData, 
      userId: userData?.id,
      email: userData?.email 
    });
    setUser(userData);
    if (userData) {
      setIsAuthenticated(true);
      justLoggedInRef.current = true;
      setTimeout(() => {
        justLoggedInRef.current = false;
      }, 10000);
    } else {
      setIsAuthenticated(false);
      justLoggedInRef.current = false;
    }
  };

  const fetchUser = async (skipLoadingReset = false, preserveUserOn401 = false) => {
    try {
      // Then fetch user
      const { data } = await api.get("/api/user");
      if (data?.id) {
        console.log('AuthContext: User fetched', { 
          id: data.id, 
          email: data.email, 
          role: data.role 
        });
        setUser(data);
        setIsAuthenticated(true);
        justLoggedInRef.current = false; 
        if (!skipLoadingReset) {
          setLoading(false);
        }
        return data;
      } else {
        console.warn('AuthContext: No user data returned', data);
        if (!preserveUserOn401 && !justLoggedInRef.current && initialFetchDoneRef.current && !user) {
          console.log('AuthContext: Clearing user - no data returned and not preserving');
          setUser(null);
          setIsAuthenticated(false);
        }
        if (!skipLoadingReset) {
          setLoading(false);
        }
        return null;
      }
    } catch (error) {
      // 401 is expected when user is not authenticated - don't log as error
      if (error.response?.status === 401) {
        // Token is missing/expired/invalid
        if (!preserveUserOn401) {
          clearAuthToken();
        }
        // Only log 401 if we have a user (unexpected) or if debugging
        if (user && !preserveUserOn401) {
          console.debug('AuthContext: 401 received but user exists - preserving user (session might be propagating)');
        }
        // Only clear user if we're not preserving AND user wasn't just set from login
        // AND this is not the initial fetch (which might fail if user just logged in)
        // AND user is currently null (don't clear if user exists - might be session propagation delay)
        if (!preserveUserOn401 && !justLoggedInRef.current && initialFetchDoneRef.current && !user) {
          setUser(null);
          setIsAuthenticated(false);
        }
        if (!skipLoadingReset) {
          setLoading(false);
        }
        return null;
      }
      // Only log actual errors (network errors, 500s, etc.)
      console.error('AuthContext: Error fetching user', error);
      // Only clear user if we're not preserving AND user wasn't just set from login
      // AND this is not the initial fetch AND user is currently null
      if (!preserveUserOn401 && !justLoggedInRef.current && initialFetchDoneRef.current && !user) {
        console.log('AuthContext: Clearing user - error and not preserving');
        setUser(null);
        setIsAuthenticated(false);
      }
      if (!skipLoadingReset) {
        setLoading(false);
      }
      return null;
    }
  };

  useEffect(() => {
    const token = getAuthToken();

    // If no token exists, we're not authenticated (production token auth).
    if (!token) {
      setLoading(false);
      initialFetchDoneRef.current = true;
      return;
    }

    // Only fetch user on mount if no user is set.
    // If user is already set (from login), skip initial fetch to avoid clearing.
    if (!user) {
      fetchUser().finally(() => {
        initialFetchDoneRef.current = true;
      });
    } else {
      setLoading(false);
      initialFetchDoneRef.current = true;
    }

    // Listen for auth changes (triggered after login/register)
    const handleAuthChange = () => {
      // After login, preserve user state even if fetchUser gets 401
      // This prevents redirect loops when session hasn't fully propagated
      // Only fetch once with preserveUserOn401=true to avoid clearing user state
      // The user state is already set from the login/register response
      setTimeout(() => {
        fetchUser(false, true).catch(err => {
          console.warn('Error fetching user after auth change:', err);
          // Don't clear user on error - it's already set from login/register response
        });
      }, 300);
    };

    window.addEventListener("auth-change", handleAuthChange);

    return () => {
      window.removeEventListener("auth-change", handleAuthChange);
    };
  }, []);

  const logout = async () => {
    try {
      await api.post("/api/logout");
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      clearAuthToken();
      setUser(null);
      setIsAuthenticated(false);
      justLoggedInRef.current = false;
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, setUser: setUserWithAuth, fetchUser, logout, setLoading: setLoadingState }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

