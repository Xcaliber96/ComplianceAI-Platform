import { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  CircularProgress,
} from "@mui/material";
import { analyzeCompany } from "./api/client"; // your existing API function

export default function AIComplianceChat() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "👋 Hi! I’m NomiAI — your compliance assistant. Type a company name or ask about compliance risks.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // call backend
      const response = await analyzeCompany(input);
      const { insight, steps } = response;

      // optional step messages (progress updates)
      if (steps && steps.length > 0) {
        for (const step of steps) {
          setMessages((prev) => [
            ...prev,
            { role: "system", content: `🧩 ${step}` },
          ]);
          await new Promise((r) => setTimeout(r, 700));
        }
      }

      const assistantMessage = {
        role: "assistant",
        content: insight || "No insight generated yet.",
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "⚠️ Error while analyzing. Please try again later.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        backgroundColor: "#fdf8f3",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        py: 6,
        px: 2,
      }}
    >
      <Typography variant="h4" fontWeight={700} sx={{ mb: 2 }}>
        NomiAI Compliance Chat
      </Typography>
      <Typography variant="body1" sx={{ mb: 4, opacity: 0.8, maxWidth: 700, textAlign: "center" }}>
        Chat with NomiAI’s compliance intelligence engine. You can ask about any company or regulation — 
        NomiAI will analyze filings and generate insights in real time.
      </Typography>

      <Paper
        elevation={3}
        sx={{
          width: "100%",
          maxWidth: 800,
          height: "75vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          p: 3,
          borderRadius: 3,
          backgroundColor: "#fff",
        }}
      >
        {/* Chat Messages */}
        <Box
          sx={{
            flexGrow: 1,
            overflowY: "auto",
            pr: 2,
            mb: 2,
            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
          {messages.map((msg, index) => (
            <Box
              key={index}
              sx={{
                display: "flex",
                justifyContent:
                  msg.role === "user" ? "flex-end" : "flex-start",
                mb: 1.5,
              }}
            >
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  backgroundColor:
                    msg.role === "user"
                      ? "#1976d2"
                      : msg.role === "system"
                      ? "#f0f0f0"
                      : "#f7f7f7",
                  color: msg.role === "user" ? "#fff" : "#333",
                  maxWidth: "75%",
                  whiteSpace: "pre-wrap",
                }}
              >
                {msg.content}
              </Box>
            </Box>
          ))}
          {loading && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 1 }}>
              <CircularProgress size={24} />
            </Box>
          )}
        </Box>

        {/* Input Area */}
        <Box sx={{ display: "flex", gap: 2 }}>
          <TextField
            fullWidth
            placeholder="Ask about a company or compliance topic..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={sendMessage}
            disabled={loading}
            sx={{
              px: 4,
              fontWeight: 600,
              textTransform: "none",
            }}
          >
            Send
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
