import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button } from "@mui/material";

export default function DashboardPage() {
  const users = [
    { initials: "DB", name: "David Brown", email: "david@aviation.com", phone: "+1-555-0105", role: "Admin", status: "Active", lastLogin: "2024-08-14 13:10" },
    { initials: "ED", name: "Emily Davis", email: "emily@aviation.com", phone: "+1-555-0106", role: "Technician", status: "Active", lastLogin: "2024-08-13 08:30" },
    { initials: "JS", name: "Jane Smith", email: "jane@aviation.com", phone: "+1-555-0102", role: "Admin", status: "Active", lastLogin: "2024-08-14 09:15" },
    { initials: "JD", name: "John Doe", email: "john@aviation.com", phone: "+1-555-0101", role: "Pilot", status: "Active", lastLogin: "2024-08-14 13:10" },
    { initials: "LA", name: "Lisa Anderson", email: "lisa@aviation.com", phone: "+1-555-0108", role: "Technician", status: "Active", lastLogin: "2024-08-14 10:40" },
    { initials: "MJ", name: "Mike Johnson", email: "mike@aviation.com", phone: "+1-555-0103", role: "Technician", status: "Inactive", lastLogin: "2024-08-10 16:45" },
    { initials: "RT", name: "Robert Taylor", email: "robert@aviation.com", phone: "+1-555-0107", role: "Pilot", status: "Inactive", lastLogin: "2024-08-08 15:25" },
    { initials: "SW", name: "Sarah Wilson", email: "sarah@aviation.com", phone: "+1-555-0104", role: "Pilot", status: "Active", lastLogin: "2024-08-14 11:20" },
  ];

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: "#fafafa" }}>
      {/* Sidebar */}

      <Box
        sx={{
          width: 260,
          backgroundColor: "#fff",
          borderRight: "1px solid #e0e0e0",
          p: 3,
          display: "flex",
          flexDirection: "column",
          gap: 3,
        }}
      >
        <Typography variant="h6" fontWeight={700}>
          Admin Panel
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
          <Typography variant="body1" sx={{ fontWeight: 600, color: "#1976d2" }}>
            Dashboard
          </Typography>
          <Typography variant="body2">Users</Typography>
          <Typography variant="body2">Roles & Permissions</Typography>
          <Typography variant="body2">Equipment Management</Typography>
          <Typography variant="body2">Reports & Analytics</Typography>
          <Typography variant="body2">Settings</Typography>
        </Box>
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, p: 4 }}>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
          Admin Dashboard
        </Typography>

        {/* User Management Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h6" fontWeight={600}>
            User Management
          </Typography>
          <Button variant="contained" sx={{ backgroundColor: "#000" }}>
            + Add User
          </Button>
        </Box>

        {/* Table */}
        <TableContainer component={Paper} sx={{ boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Profile</TableCell>
                <TableCell>Full Name</TableCell>
                <TableCell>Email Address</TableCell>
                <TableCell>Phone Number</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Last Login</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Box
                      sx={{
                        width: 35,
                        height: 35,
                        borderRadius: "50%",
                        backgroundColor: "#e0e0e0",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        fontWeight: 600,
                        fontSize: "0.8rem",
                      }}
                    >
                      {user.initials}
                    </Box>
                  </TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.phone}</TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        px: 1.5,
                        py: 0.5,
                        backgroundColor: "#e3f2fd",
                        color: "#1565c0",
                        borderRadius: 2,
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        display: "inline-block",
                      }}
                    >
                      {user.role}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography
                      sx={{
                        color: user.status === "Active" ? "green" : "gray",
                        fontWeight: 600,
                      }}
                    >
                      {user.status}
                    </Typography>
                  </TableCell>
                  <TableCell>{user.lastLogin}</TableCell>
                  <TableCell>
                    <Typography sx={{ color: "#1976d2", cursor: "pointer", mr: 1 }}>
                      ✏️
                    </Typography>
                    <Typography sx={{ color: "red", cursor: "pointer" }}>🗑️</Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
}