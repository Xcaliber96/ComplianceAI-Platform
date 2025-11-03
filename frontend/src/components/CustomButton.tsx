import { Button } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

interface CustomButtonProps {
  text: string;
  to?: string;
  onClick?: () => void;
  variant?:
    | "contained"
    | "outlined"
    | "gradient"
    | "outlineGradient"
    | "danger"
    | "flat"
    | "outlinedText"; // ✅ new variant
  sx?: object;
  target?: "_blank" | "_self";
}

export default function CustomButton({
  text,
  to,
  onClick,
  variant = "contained",
  sx = {},
  target = "_self",
}: CustomButtonProps) {
  // 🎨 Button style variants
  const baseStyles = {
    contained: {
      backgroundColor: "#7B61FF",
      color: "#fff",
      px: 5,
      py: 1.5,
      fontSize: "1rem",
      fontWeight: 600,
      borderRadius: "50px",
      textTransform: "uppercase",
      boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
      "&:hover": {
        backgroundColor: "#9C7FFF",
      },
    },

    gradient: {
      background: "linear-gradient(90deg, #8e2de2 0%, #4a00e0 100%)",
      color: "#fff",
      px: 5,
      py: 1.5,
      borderRadius: "50px",
      textTransform: "uppercase",
      fontWeight: 700,
      letterSpacing: "0.5px",
      transition: "0.3s ease",
      "&:hover": {
        background: "linear-gradient(90deg, #4a00e0 0%, #8e2de2 100%)",
        transform: "translateY(-2px)",
      },
    },

    outlineGradient: {
      background: "transparent",
      color: "#8e2de2",
      px: 5,
      py: 1.5,
      borderRadius: "50px",
      textTransform: "uppercase",
      fontWeight: 700,
      border: "2px solid",
      borderImageSlice: 1,
      borderImageSource: "linear-gradient(90deg, #8e2de2, #4a00e0)",
      "&:hover": {
        background:
          "linear-gradient(90deg, rgba(142,45,226,0.1) 0%, rgba(74,0,224,0.1) 100%)",
      },
    },

    danger: {
      background: "linear-gradient(90deg, #ff512f 0%, #f09819 100%)",
      color: "#fff",
      px: 5,
      py: 1.5,
      borderRadius: "50px",
      fontWeight: 700,
      textTransform: "uppercase",
      "&:hover": {
        background: "linear-gradient(90deg, #f09819 0%, #ff512f 100%)",
      },
    },

    flat: {
      backgroundColor: "#fff",
      color: "#000",
      px: 4,
      py: 1.2,
      borderRadius: "6px",
      fontWeight: 700,
      textTransform: "uppercase",
      "&:hover": {
        backgroundColor: "#f0f0f0",
      },
    },

    // ✅ New variant — transparent background, bordered text-only
    outlinedText: {
      backgroundColor: "transparent",
      color: "#fff",
      px: 4,
      py: 1.2,
      borderRadius: "50px",
      border: "2px solid #fff",
      textTransform: "uppercase",
      fontWeight: 600,
      letterSpacing: "0.5px",
      transition: "all 0.3s ease",
      "&:hover": {
        backgroundColor: "rgba(255,255,255,0.1)",
        transform: "translateY(-2px)",
      },
    },
  };

  const isExternal = to && (to.startsWith("http") || to.startsWith("www"));

  if (to) {
    return (
      <Button
        component={isExternal ? "a" : RouterLink}
        href={isExternal ? to : undefined}
        to={!isExternal ? to : undefined}
        target={isExternal ? target : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        variant="text"
        sx={{ ...baseStyles[variant], ...sx }}
      >
        {text}
      </Button>
    );
  }

  return (
    <Button variant="text" onClick={onClick} sx={{ ...baseStyles[variant], ...sx }}>
      {text}
    </Button>
  );
}
