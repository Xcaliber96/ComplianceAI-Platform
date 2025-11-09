import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getCurrentSession } from "../api/client";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const data = await getCurrentSession();
        if (data.status === "authenticated") setAuthenticated(true);
      } catch {
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!authenticated) return <Navigate to="/signin" replace />;

  return <>{children}</>;
  
}
