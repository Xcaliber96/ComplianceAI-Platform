import React from "react";
import HubLayout from "../components/DashboardBar";

export default function TestHubLayout() {
  return (
    <HubLayout>
      <h2 style={{ fontFamily: "Montserrat, sans-serif" }}>Welcome to HubLayout Demo</h2>
      <p>
        This is your main content area — scroll, test the sidebar toggle, and
        see how the layout adapts!
      </p>
    </HubLayout>
  );
}