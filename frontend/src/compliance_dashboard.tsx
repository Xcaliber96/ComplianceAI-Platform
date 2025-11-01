import {
  Box,
  Typography,
  Card,
  Grid,
  LinearProgress,
  Divider,
} from "@mui/material";
import {
  ComposableMap,
  Geographies,
  Geography,
} from "react-simple-maps";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function ComplianceDashboard() {
  const geoUrl =
    "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

  // 🌍 Example compliance coverage data
  const complianceRegions = {
    USA: 92,
    FRA: 87,
    IND: 75,
    AUS: 81,
    CAN: 89,
    DEU: 84,
    BRA: 72,
  };

  // 📊 Example monthly compliance data
  const complianceTrends = [
    { month: "Jan", risk: 18 },
    { month: "Feb", risk: 15 },
    { month: "Mar", risk: 19 },
    { month: "Apr", risk: 14 },
    { month: "May", risk: 17 },
    { month: "Jun", risk: 12 },
    { month: "Jul", risk: 10 },
    { month: "Aug", risk: 13 },
    { month: "Sep", risk: 11 },
    { month: "Oct", risk: 9 },
    { month: "Nov", risk: 8 },
    { month: "Dec", risk: 7 },
  ];

  return (
    <Box sx={{ p: 4, bgcolor: "#f8f9fa", minHeight: "100vh" }}>
      {/* Header */}
      <Typography variant="h4" fontWeight={700} mb={3}>
        Compliance Overview Dashboard
      </Typography>

      {/* Top Summary Cards */}
      <Grid container spacing={3}>
        {[
          { label: "Total Compliance Checks", value: "1,240", change: "+8%" },
          { label: "Regulations Monitored", value: "265", change: "+4%" },
          { label: "Non-Compliance Cases", value: "32", change: "-2%" },
          { label: "Audit Success Rate", value: "93%", change: "+1.5%" },
        ].map((card, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Card sx={{ p: 3, borderRadius: 3, boxShadow: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                {card.label}
              </Typography>
              <Typography variant="h5" fontWeight={700}>
                {card.value}
              </Typography>
              <Typography
                color={card.change.startsWith("+") ? "green" : "red"}
                fontWeight={500}
              >
                {card.change}
              </Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 4 }} />

      {/* Middle Section */}
      <Grid container spacing={3}>
        {/* Left: Trend Chart */}
        <Grid item xs={12} md={8}>
          <Card sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" mb={2} fontWeight={600}>
              Monthly Compliance Risk Trends
            </Typography>

            {/* 📈 Line Chart */}
            <Box sx={{ width: "100%", height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={complianceTrends} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
                  <XAxis dataKey="month" stroke="#555" />
                  <YAxis stroke="#555" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      borderRadius: "8px",
                      border: "1px solid #ccc",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="risk"
                    stroke="#1976d2"
                    strokeWidth={3}
                    dot={{ fill: "#1976d2", r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Card>
        </Grid>

        {/* Right: Audit Progress */}
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" mb={2} fontWeight={600}>
              Active Audits Progress
            </Typography>
            {[
              { label: "HIPAA", value: 80 },
              { label: "GDPR", value: 60 },
              { label: "SOX", value: 45 },
              { label: "CCPA", value: 70 },
            ].map((item, i) => (
              <Box key={i} mb={2}>
                <Typography variant="body2">{item.label}</Typography>
                <LinearProgress
                  variant="determinate"
                  value={item.value}
                  sx={{
                    height: 8,
                    borderRadius: 5,
                    mt: 0.5,
                    "& .MuiLinearProgress-bar": { backgroundColor: "#1976d2" },
                  }}
                />
              </Box>
            ))}
          </Card>
        </Grid>
      </Grid>

      {/* Footer Section */}
      <Box mt={4}>
        <Card sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" fontWeight={600} mb={2}>
            Compliance Coverage by Region
          </Typography>
          <Box
            sx={{
              width: "100%",
              height: 360,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "#eef2f5",
              borderRadius: 2,
            }}
          >
            <ComposableMap projectionConfig={{ scale: 130 }}>
              <Geographies geography={geoUrl}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const code = geo.properties.ISO_A3;
                    const value = complianceRegions[code];
                    const fill = value
                      ? `rgba(25, 118, 210, ${value / 100})`
                      : "#E0E0E0";
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={fill}
                        stroke="#FFF"
                        style={{
                          default: { outline: "none" },
                          hover: { fill: "#1565c0", outline: "none" },
                        }}
                      />
                    );
                  })
                }
              </Geographies>
            </ComposableMap>
          </Box>

          <Typography
            variant="body2"
            color="text.secondary"
            textAlign="center"
            mt={2}
          >
            Darker blue = higher compliance coverage (%)
          </Typography>
        </Card>
      </Box>
    </Box>
  );
}
