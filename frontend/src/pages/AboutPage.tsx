import { Box, Typography, Grid, Paper } from "@mui/material";
import DownBar from "../components/DownBar";
import monitorImg from "../assets/monitor.avif";
import AdventureSection from "./HeroSectionAbout";
import MissionSection from "./ComonentMissionVisionValues";
import MonitoringSection from "./ComponentImageAbout";
export default function AboutPage() {
  return (
    <>
      {}
           <AdventureSection />
            <MissionSection/>
{/* 🌍 Monitoring Section with Wrapped Background */}
<MonitoringSection/>
      {/* 👇 Footer */}
      <DownBar />
    </>
  );
}
