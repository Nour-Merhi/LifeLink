import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  // Show nothing while checking authentication
  if (loading) {
    return null; // or a loading spinner
  }

  // If not authenticated, redirect to donation welcome page
  if (!user) {
    return <Navigate to="/donation" replace />;
  }

  // User is authenticated, render the protected component
  return children;
}
