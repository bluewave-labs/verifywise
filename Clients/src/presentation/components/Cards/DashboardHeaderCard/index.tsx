import { Stack, Typography, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { ArrowRight as RightArrow } from "lucide-react";
import { useState } from "react";

const HeaderCard = ({ title, count }: { title: string; count: number }) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  const getNavigationPath = (cardTitle: string): string | null => {
    switch (cardTitle) {
      case "Trainings":
        return "/training";
      case "Models":
        return "/model-inventory";
      case "Reports":
        return "/reporting";
      default:
        return null;
    }
  };

  const navigationPath = getNavigationPath(title);
  const isClickable = navigationPath !== null;

  const handleClick = () => {
    if (navigationPath) {
      navigate(navigationPath);
    }
  };

  return (
    <Stack
      sx={{
        border: "1px solid #eaecf0",
        borderRadius: 2,
        background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
        minWidth: 228,
        width: "100%",
        padding: "8px 36px 14px 14px",
        cursor: isClickable ? "pointer" : "default",
        position: "relative",
        overflow: "visible",
        transition: "all 0.2s ease",
        "&:hover": isClickable
          ? {
            background: "linear-gradient(135deg, #f9fafb 0%, #f1f5f9 100%)",
            borderColor: "#D1D5DB",
          }
          : {},
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <Typography
        sx={{
          fontSize: 13,
          color: "#8594AC",
          pb: "2px",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {title}
      </Typography>

      <Typography
        sx={{
          fontSize: 13,
          color: "#2D3748",
          textAlign: "justify",
        }}
      >
        {count}
      </Typography>

      {isClickable && (
        <Box
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            opacity: isHovered ? 1 : 0.3,
            transition: "opacity 0.2s ease",
          }}
        >
          <RightArrow size={16} />
        </Box>
      )}
    </Stack>
  );
};

export default HeaderCard;







