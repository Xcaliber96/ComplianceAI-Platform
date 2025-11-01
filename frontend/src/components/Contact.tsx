import {
  Box,
  TextField,
  Button,
  Typography,
  MenuItem,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { useState, type ChangeEvent, type FormEvent } from "react";

export default function ContactSection() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    jobTitle: "",
    solutionInterest: "",
    companyName: "",
    phone: "",
    country: "",
    consent: false,
  });

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
  };

  return (
    <Box
      sx={{
        width: "100%",
        position: "relative",
        overflow: "hidden",
        background: `linear-gradient(135deg, rgba(74,144,226,0.15) 0%, white 70%)`,
      }}
    >
      {/* 🟦 Decorative Corner Glow */}
      <Box
        sx={{
          position: "absolute",
          top: "-0px",
          right: "-150px",
          width: 450,
          height: 450,
          background:
            "radial-gradient(circle at center, rgba(74,144,226,0.35) 0%, rgba(74,144,226,0) 70%)",
          filter: "blur(100px)",
          zIndex: 0,
        }}
      />

      {/* 🖼️ Full-Width Banner Image */}
      <Box
        sx={{
          width: "100%",
          height: { xs: "25vh", md: "20vh" },
          position: "relative",
          overflow: "hidden",
          zIndex: 1,
        }}
      >
        <Box
          component="img"
          src="https://images.unsplash.com/photo-1753362975708-c2932c383b7f?ixlib=rb-4.1.0&auto=format&fit=crop&q=80&w=1932"
          alt="Nomi AI compliance visualization"
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      </Box>

      {/* 🤍 Unified White Container (Text + Form) */}
      <Box
        sx={{
          maxWidth: "1100px",
          mx: "auto",
          mt: { xs: -6, md: -10 },
          mb: { xs: 8, md: 10 },
          backgroundColor: "#fff",
   
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          px: { xs: 3, md: 6 },
          py: { xs: 5, md: 8 },
          position: "relative",
          zIndex: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: { xs: 6, md: 10 },
          }}
        >
          {/* LEFT SIDE — TEXT */}
          <Box sx={{ flex: 1 }}>
         <Typography
  variant="h4"
  fontWeight={800}
  sx={{ mb: 3, color: "#0d1117" }}
>
  Let’s Talk Compliance
</Typography>

<Typography
  variant="body1"
  sx={{
    color: "#555",
    lineHeight: 1.8,
    mb: 4,
    maxWidth: "600px",
  }}
>
  At Nomi AI, we believe compliance should empower innovation — not slow it down.
  Too often, regulatory obligations feel like an obstacle to progress. Teams
  spend endless hours chasing audit trails, filling out spreadsheets, and
  reacting to incidents instead of focusing on what really matters — building
  great products and delivering value to customers.
  <br />
  <br />
  That’s why we built Nomi AI — an intelligent compliance governance platform
  that helps organizations stay proactive, not reactive. Our AI continuously
  monitors evolving standards, automatically maps controls to your existing
  frameworks, and provides clear, actionable insights when gaps appear. It’s
  designed to turn complex compliance operations into a simple, transparent, and
  collaborative process shared across your entire organization.
  <br />
  <br />
  Whether you’re launching your first startup, managing enterprise-level
  operations, or scaling a global compliance program, Nomi AI gives your team
  the clarity and confidence to make compliance a competitive advantage — not a
  burden.
</Typography>

<Typography
  variant="body2"
  sx={{
    color: "#777",
    fontStyle: "italic",
    maxWidth: "600px",
  }}
>
  Reach out today to learn how Nomi AI can transform your organization’s
  compliance workflow and give your team peace of mind.
</Typography>
          </Box>

          {/* RIGHT SIDE — FORM */}
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
              Request a Demo
            </Typography>

            <TextField
              label="First Name * *"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              fullWidth
              variant="outlined"
              sx={{ backgroundColor: "#f5f5f5" }}
            />
            <TextField
              label="Last Name * *"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              fullWidth
              variant="outlined"
              sx={{ backgroundColor: "#f5f5f5" }}
            />
            <TextField
              label="Business Email * *"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              fullWidth
              variant="outlined"
              sx={{ backgroundColor: "#f5f5f5" }}
            />
            <TextField
              label="Job Title * *"
              name="jobTitle"
              value={formData.jobTitle}
              onChange={handleChange}
              fullWidth
              variant="outlined"
              sx={{ backgroundColor: "#f5f5f5" }}
            />

            <TextField
              select
              label="Solution Interest"
              name="solutionInterest"
              value={formData.solutionInterest}
              onChange={handleChange}
              fullWidth
              variant="outlined"
              sx={{ backgroundColor: "#f5f5f5" }}
            >
              <MenuItem value="Compliance">Compliance</MenuItem>
              <MenuItem value="Governance">Governance</MenuItem>
              <MenuItem value="Risk Management">Risk Management</MenuItem>
              <MenuItem value="AI Solutions">AI Solutions</MenuItem>
            </TextField>

            <TextField
              label="Company Name * *"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              fullWidth
              variant="outlined"
              sx={{ backgroundColor: "#f5f5f5" }}
            />

            <TextField
              label="Business Phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              fullWidth
              variant="outlined"
              sx={{ backgroundColor: "#f5f5f5" }}
            />

            <TextField
              select
              label="Company Country * *"
              name="country"
              value={formData.country}
              onChange={handleChange}
              fullWidth
              variant="outlined"
              sx={{ backgroundColor: "#f5f5f5" }}
            >
              <MenuItem value="United States">United States</MenuItem>
              <MenuItem value="Canada">Canada</MenuItem>
              <MenuItem value="United Kingdom">United Kingdom</MenuItem>
              <MenuItem value="Australia">Australia</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </TextField>

            {/* Privacy Statement */}
            <Typography variant="body2" sx={{ color: "#333", mt: 1 }}>
              Let’s stay in touch by email, phone and post. Nomi AI will keep
              you updated on products, services, solutions, exclusive offers and
              special events. For information on how we protect your personal
              data, see our{" "}
              <Typography
                component="a"
                href="#"
                sx={{
                  fontWeight: 600,
                  color: "#0046AD",
                  textDecoration: "none",
                }}
              >
                Privacy Statement *
              </Typography>
            </Typography>

            {/* Checkbox */}
            <FormControlLabel
              control={
                <Checkbox
                  name="consent"
                  checked={formData.consent}
                  onChange={handleChange}
                />
              }
              label="I'm In!"
            />

            {/* reCAPTCHA placeholder */}
            <Box
              sx={{
                border: "1px solid #ccc",

                p: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mt: 1,
              }}
            >
              <Typography variant="body2">I'm not a robot</Typography>
              <img
                src="https://www.gstatic.com/recaptcha/api2/logo_48.png"
                alt="reCAPTCHA"
                style={{ height: "24px", opacity: 0.8 }}
              />
            </Box>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="contained"
              sx={{
                mt: 2,
                py: 1.4,
                fontWeight: 600,
                backgroundColor: "#0046AD",
                ":hover": { backgroundColor: "#003a91" },
              }}
            >
              Submit
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
