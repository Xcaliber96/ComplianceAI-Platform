import { Box } from "@mui/material";
import TopBar from "./components/TopBar";
import HeroSection from "./components/HeroSection";
import FeatureSection from "./components/Features";
import WhyNomiSection from "./components/WhyNomiSection";
import HowItWorksSection from "./components/HowItWorksSection";
import ContactSection from "./components/Contact";
import DownBar from "./components/DownBar";
import ComplianceStatsPage from "./components/stats";

export default function LandingPage() {
  return (
    <Box sx={{ width: "100%", overflowX: "hidden" }}>
      <TopBar />
      <HeroSection />
      <FeatureSection />
      <ComplianceStatsPage/>
      <WhyNomiSection />
      <HowItWorksSection />
      <ContactSection />
      <DownBar /> 
      
    </Box>
  );
}
