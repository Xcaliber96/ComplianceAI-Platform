import { Box } from "@mui/material";
import TopBar from "../components/TopBar";
import DownBar from "../components/DownBar";
import HeroSection from "./HeroSection";
import FeatureSection from "./Features";
import WhyNomiSection from "./WhyNomiSection";
import HowItWorksSection from "./HowItWorksSection";
import ContactSection from "./Contact";
import ComplianceStatsPage from "./stats";

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
