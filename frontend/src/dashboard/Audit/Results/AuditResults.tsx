import {
  Box,
  Card,
  CardContent,
  Typography,
  Divider,
  Chip,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  FormControl,
  MenuItem,
  Select,
  InputLabel,
  Switch,
  FormControlLabel
} from "@mui/material";

import { useEffect, useMemo, useState } from "react";
import { useFilters } from "../../../store/filters";

export default function AuditResultsPage() {
  const filters = useFilters();

  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [showCharts, setShowCharts] = useState(true);
  const [supplierId, setSupplierId] = useState("");

  useEffect(() => {
    setItems([
      {
        id: "R1",
        requirement: "Access controls policy",
        department: "IT",
        country: "US",
        state: "CA",
        compliant: true,
        risk: "Low",
        gapNarrative: "Controls documented and reviewed quarterly",
        evidenceRefs: ["policy_v3.pdf"],
        supplierId: "S1",
        supplierName: "Acme Holdings"
      },
      {
        id: "R2",
        requirement: "Vendor risk assessment",
        department: "Finance",
        country: "US",
        state: "NY",
        compliant: false,
        risk: "High",
        gapNarrative: "No annual assessment for top vendors",
        evidenceRefs: ["vendors_2024.xlsx"],
        supplierId: "S2",
        supplierName: "Globex India"
      }
    ]);
  }, []);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/suppliers")
      .then((r) => r.json())
      .then(setSuppliers)
      .catch(() => setSuppliers([]));
  }, []);

  const filtered = useMemo(() => {
    return items.filter(
      (i) =>
        (!filters.department || i.department === filters.department) &&
        (!filters.country || i.country === filters.country) &&
        (!filters.state || i.state === filters.state) &&
        (!supplierId || i.supplierId === supplierId)
    );
  }, [items, filters, supplierId]);

  const compliancePct = filtered.length
    ? Math.round((filtered.filter((i) => i.compliant).length / filtered.length) * 100)
    : 0;

  return (
    <Box
      sx={{
        p: 4,
        bgcolor: "#F8FAF9",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center"
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 1100 }}>
        {/* Page Title */}
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: "#1A1F36" }}>
          Audit Results
        </Typography>

        <Typography sx={{ mb: 4, color: "#4A5568", fontSize: "1rem" }}>
          Review audit findings, risks, and compliance posture at a glance.
        </Typography>

        {/* STEP 1 */}
        <Card
          sx={{
            borderRadius: 4,
            p: 3,
            mb: 3,
            border: "1px solid #E3E8EF",
            background: "#FFFFFF",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "#17C96430",
                border: "2px solid #17C964",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#17C964",
                fontWeight: 700,
                mr: 1
              }}
            >
              1
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Filter results
            </Typography>
          </Box>

          <Typography sx={{ mb: 3, color: "#4A5568" }}>
            Choose a supplier or toggle summary metrics for a clearer audit overview.
          </Typography>

          <FormControl fullWidth size="small" sx={{ mb: 3 }}>
            <InputLabel>Supplier</InputLabel>
            <Select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
              <MenuItem value="">All Suppliers</MenuItem>
              {suppliers.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControlLabel
            control={<Switch checked={showCharts} onChange={(_, v) => setShowCharts(v)} />}
            label="Show summary metrics"
          />
        </Card>

        {/* STEP 2 */}
        {showCharts && (
          <Card
            sx={{
              borderRadius: 4,
              p: 3,
              mb: 3,
              border: "1px solid #E3E8EF",
              background: "#FFFFFF",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "#17C96430",
                  border: "2px solid #17C964",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#17C964",
                  fontWeight: 700,
                  mr: 1
                }}
              >
                2
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Summary metrics
              </Typography>
            </Box>

            <Typography sx={{ mb: 3, color: "#4A5568" }}>
              A quick overview of compliance levels and risk distribution.
            </Typography>

            <Box sx={{ display: "flex", gap: 3 }}>
              <Card
                sx={{
                  flex: 1,
                  p: 3,
                  borderRadius: 4,
                  border: "1px solid #E3E8EF",
                  background: "#FFFFFF"
                }}
              >
                <Typography sx={{ color: "#4A5568" }}>Compliance %</Typography>
                <Typography variant="h3" sx={{ mt: 1, fontWeight: 700 }}>
                  {compliancePct}%
                </Typography>
              </Card>

              <Card
                sx={{
                  flex: 1,
                  p: 3,
                  borderRadius: 4,
                  border: "1px solid #E3E8EF",
                  background: "#FFFFFF"
                }}
              >
                <Typography sx={{ color: "#4A5568" }}>Risk Levels</Typography>
                <Typography sx={{ mt: 1, fontWeight: 600 }}>
                  {(filtered || [])
                    .reduce(
                      (acc, i) => {
                        acc[i.risk] = (acc[i.risk] || 0) + 1;
                        return acc;
                      },
                      { Low: 0, Medium: 0, High: 0 }
                    )
                    .Low}{" "}
                  Low •{" "}
                  {(filtered || [])
                    .reduce(
                      (acc, i) => {
                        acc[i.risk] = (acc[i.risk] || 0) + 1;
                        return acc;
                      },
                      { Low: 0, Medium: 0, High: 0 }
                    )
                    .Medium}{" "}
                  Medium •{" "}
                  {(filtered || [])
                    .reduce(
                      (acc, i) => {
                        acc[i.risk] = (acc[i.risk] || 0) + 1;
                        return acc;
                      },
                      { Low: 0, Medium: 0, High: 0 }
                    )
                    .High}{" "}
                  High
                </Typography>
              </Card>
            </Box>
          </Card>
        )}

        {/* STEP 3 */}
        <Card
          sx={{
            borderRadius: 4,
            p: 3,
            mb: 5,
            border: "1px solid #E3E8EF",
            background: "#FFFFFF",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "#17C96430",
                border: "2px solid #17C964",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#17C964",
                fontWeight: 700,
                mr: 1
              }}
            >
              3
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Audit result details
            </Typography>
          </Box>

          <Typography sx={{ mb: 3, color: "#4A5568" }}>
            All findings and evidence collected during the audit.
          </Typography>

          <Table>
            <TableHead>
              <TableRow sx={{ background: "#F8FAFC" }}>
                {[
                  "ID",
                  "Supplier",
                  "Requirement",
                  "Compliance",
                  "Risk",
                  "Evidence",
                  "Feedback"
                ].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 700 }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {filtered.map((row) => (
                <TableRow key={row.id} sx={{ "&:hover": { background: "#F4F7FA" } }}>
                  <TableCell>{row.id}</TableCell>
                  <TableCell>{row.supplierName}</TableCell>
                  <TableCell>{row.requirement}</TableCell>
                  <TableCell>
                    <Chip
                      label={row.compliant ? "Compliant" : "Gap"}
                      color={row.compliant ? "success" : "warning"}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip label={row.risk} variant="outlined" />
                  </TableCell>
                  <TableCell>{row.evidenceRefs.join(", ")}</TableCell>
                  <TableCell>
                    <Button variant="outlined" size="small">
                      Feedback
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </Box>
    </Box>
  );
}
