import { Box, Typography, Grid, Card, CardContent } from "@mui/material";
import { motion } from "framer-motion";
import { ShieldCheck, Brain, LineChart, Lock, Network, Zap } from "lucide-react";

export default function HowItWorksSection() {
  const features = [
    {
      icon: <ShieldCheck size={32} />,
      title: "Automated Compliance Monitoring",
      desc: "Track and maintain compliance effortlessly with real-time AI-driven monitoring and control mapping across multiple frameworks.",
    },
    {
      icon: <Brain size={32} />,
      title: "Intelligent Risk Analysis",
      desc: "Leverage advanced machine learning to identify, score, and predict compliance risks before they impact operations.",
    },
    {
      icon: <LineChart size={32} />,
      title: "Data-Driven Insights",
      desc: "Visualize compliance performance and trends with interactive analytics dashboards built for modern audit workflows.",
    },
    {
      icon: <Lock size={32} />,
      title: "End-to-End Security",
      desc: "Enterprise-grade encryption, access control, and continuous security validation keep your sensitive data fully protected.",
    },
    {
      icon: <Network size={32} />,
      title: "Seamless Integrations",
      desc: "Connect your compliance stack to your existing tools — from Google Drive to SharePoint to Slack — in just a few clicks.",
    },
    {
      icon: <Zap size={32} />,
      title: "AI-Powered Automation",
      desc: "Let Nomi AI handle the repetitive work — from evidence collection to reporting — so your team can focus on innovation.",
    },
  ];

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        overflow: "hidden",
        py: { xs: 10, md: 14 },
        background: "linear-gradient(180deg, #f8faff 0%, #ffffff 100%)",
      }}
    >
      {/* ✨ Decorative gradient background */}
      <Box
        sx={{
          position: "absolute",
          top: "-100px",
          right: "-150px",
          width: 400,
          height: 400,
          background:
            "radial-gradient(circle at center, rgba(74,144,226,0.25) 0%, rgba(74,144,226,0) 70%)",
          filter: "blur(90px)",
          zIndex: 0,
        }}
      />

      {/* 🌟 Heading Section */}
      <Box
        component={motion.div}
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        sx={{
          textAlign: "center",
          maxWidth: "800px",
          mx: "auto",
          mb: { xs: 6, md: 10 },
          px: 2,
          zIndex: 2,
          position: "relative",
        }}
      >
        <Typography
          variant="h3"
          fontWeight={800}
          sx={{
            mb: 2,
            background:
              "linear-gradient(90deg, #0046AD 0%, #3B70C9 50%, #4A90E2 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Powerful Features, Built for Modern Compliance
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: "#555",
            maxWidth: "600px",
            mx: "auto",
            lineHeight: 1.8,
          }}
        >
          Nomi AI gives your organization everything it needs to stay ahead —
          from automated monitoring to intelligent reporting — built with
          security, scalability, and simplicity in mind.
        </Typography>
      </Box>

      {/* ⚙️ Features Grid */}
      <Grid
        container
        spacing={4}
        sx={{
          maxWidth: "1200px",
          mx: "auto",
          px: { xs: 3, md: 6 },
          position: "relative",
          zIndex: 2,
        }}
      >
        {features.map((f, i) => (
          <Grid item xs={12} sm={6} md={4} key={i}>
            <Card
              component={motion.div}
              whileHover={{ y: -6, boxShadow: "0 12px 30px rgba(0,0,0,0.08)" }}
              transition={{ duration: 0.3 }}
              sx={{
                height: "100%",
                background: "rgba(255,255,255,0.8)",
                backdropFilter: "blur(10px)",
                borderRadius: 3,
                border: "1px solid rgba(0,0,0,0.05)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Box
                  sx={{
                    mb: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background:
                      "linear-gradient(135deg, #4A90E2, #3B70C9, #3260B2)",
                    color: "#fff",
                  }}
                >
                  {f.icon}
                </Box>

                <Typography
                  variant="h6"
                  fontWeight={700}
                  sx={{ mb: 1, color: "#0d1117" }}
                >
                  {f.title}
                </Typography>

                <Typography
                  variant="body2"
                  sx={{ color: "#555", lineHeight: 1.7 }}
                >
                  {f.desc}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
