import {
  Box,
  Card,
  CardContent,
  Typography,
  Divider,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Paper
} from '@mui/material';
import { useEffect, useState } from 'react';
import { getAuditLog } from '../../../api/client';

export default function AuditLogPage() {
  const [auditLogs, setAuditLogs] = useState([]);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const logs = await getAuditLog(20);
      setAuditLogs(logs);
    } catch (err) {
      console.error("Failed to load audit logs", err);
      setAuditLogs([]);
    }
  };

  return (
    <Box
      sx={{
        p: 4,
        bgcolor: "#F7F9FB",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center"
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 1100 }}>

        {/* Page Header */}
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: "#2B2D42",
            mb: 2
          }}
        >
          Audit Log
        </Typography>

        <Typography
          sx={{
            color: "#555",
            fontSize: "0.95rem",
            mb: 4
          }}
        >
          View the most recent activity and audit trail across your workspace.
        </Typography>

        {/* Card Section Styled Like the Regulations Wizard */}
        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border: "1px solid #E1E5EA",
            overflow: "hidden",
            background: "#FFFFFF"
          }}
        >
          <CardContent sx={{ p: 3 }}>
            {/* Section Title */}
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: "#2B2D42",
                mb: 2
              }}
            >
              Recent Audit Activity
            </Typography>

            <Divider sx={{ mb: 3 }} />

            {/* Table Container */}
            <Paper
              elevation={0}
              sx={{
                borderRadius: 3,
                border: "1px solid #E1E5EA",
                overflow: "hidden"
              }}
            >
              <Table sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow sx={{ background: "#F7F9FB" }}>
                    <TableCell sx={{ fontWeight: 700, color: "#2B2D42" }}>Time</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#2B2D42" }}>Entity</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#2B2D42" }}>Action</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#2B2D42" }}>User</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#2B2D42" }}>Detail</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow
                      key={log.id}
                      sx={{
                        "&:hover": { background: "#F0F4F8" },
                        transition: "background 0.25s"
                      }}
                    >
                      <TableCell sx={{ color: "#2B2D42" }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </TableCell>

                      <TableCell sx={{ color: "#2B2D42" }}>
                        {log.entity_type} #{log.entity_id}
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={log.action}
                          size="small"
                          sx={{
                            bgcolor: "#0FA95822",
                            color: "#0FA958",
                            fontWeight: 600,
                            borderRadius: "8px"
                          }}
                        />
                      </TableCell>

                      <TableCell sx={{ color: "#2B2D42" }}>{log.user}</TableCell>

                      <TableCell sx={{ color: "#2B2D42" }}>{log.detail}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
