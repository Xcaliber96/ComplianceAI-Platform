import { Box } from "@mui/material";
import { Routes, Route } from "react-router-dom";
import LandingPage from "./landing page/landingpage";
import DashboardApp from "./dashboard/DashboardApp";
import SignIn from "./dashboard/SignIn";
import SignUp from "./dashboard/SignUp";
import NomiPulsePage from "./dashboard/NomiPulsePage";
import CompetitorsPage from "./dashboard/CompetitorsPage";
import SupplierOnboarding from "./dashboard/SupplierOnboarding";
import FeaturesPage from "./pages/FeaturesPage";
import PricingPage from "./pages/PricingPage";
import AboutPage from "./pages/AboutPage";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <Box>
      <Routes>
        {}
        <Route path="/" element={<LandingPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/about" element={<AboutPage />} />

        {/* 🔒 Protected Dashboard */}
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute>
              <DashboardApp />
            </ProtectedRoute>
          }
        />

        {/* 🔑 Auth pages */}
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />

        {/* 404 fallback */}
        <Route path="*" element={<div>404: Page Not Found</div>} />
      </Routes>
    </Box>
  );
}
