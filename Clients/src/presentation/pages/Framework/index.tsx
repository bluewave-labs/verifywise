import { Stack, Typography, Box, Avatar } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { VerifyWiseContext } from "../../../application/contexts/VerifyWise.context";
import useMultipleOnScreen from "../../../application/hooks/useMultipleOnScreen";
import { vwhomeHeading } from "../Home/1.0Home/style";
import singleTheme from "../../themes/v1SingleTheme";
import useFrameworks from "../../../application/hooks/useFrameworks";

const Framework = () => {
  const { changeComponentVisibility } = useContext(VerifyWiseContext);
  const { refs, allVisible } = useMultipleOnScreen<HTMLElement>({
    countToTrigger: 1,
  });

  // Fetch all frameworks
  const { allFrameworks, loading, error } = useFrameworks({
    listOfFrameworks: [], // Empty array to get all frameworks
  });

  // Filter out EU AI Act frameworks
  const filteredFrameworks = allFrameworks.filter(
    (framework) => !framework.name.toLowerCase().includes("eu ai act")
  );

  const [selectedFramework, setSelectedFramework] = useState<number>(0);

  useEffect(() => {
    if (allVisible) {
      changeComponentVisibility("projectFrameworks", true);
    }
  }, [allVisible, changeComponentVisibility]);

  const getFrameworkIcon = (frameworkName: string) => {
    if (frameworkName.toLowerCase().includes("iso 42001")) {
      return "📋";
    } else if (frameworkName.toLowerCase().includes("iso 27001")) {
      return "🔒";
    }
    return "📊";
  };

  const getFrameworkColor = (frameworkName: string) => {
    if (frameworkName.toLowerCase().includes("iso 42001")) {
      return "#2e7d32"; // Green
    } else if (frameworkName.toLowerCase().includes("iso 27001")) {
      return "#ed6c02"; // Orange
    }
    return "#666666"; // Default gray
  };

  const handleFrameworkSelect = (index: number) => {
    setSelectedFramework(index);
  };

  const renderFrameworkContent = () => {
    if (loading) {
      return (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Typography variant="body1" color="text.secondary">
            Loading framework information...
          </Typography>
        </Box>
      );
    }

    if (error || !filteredFrameworks.length) {
      return (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Typography variant="body1" color="error">
            No frameworks available at the moment.
          </Typography>
        </Box>
      );
    }

    const framework = filteredFrameworks[selectedFramework];
    if (!framework) return null;

    return (
      <Box
        sx={{
          mt: 6,
          p: 6,
          backgroundColor: "#000000",
          borderRadius: 3,
          minHeight: "400px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography
          variant="h5"
          sx={{
            color: "#FFFFFF",
            textAlign: "center",
            maxWidth: "600px",
          }}
        >
          This is a dummy content space for {framework.name}. The actual
          framework content will be implemented here.
        </Typography>
      </Box>
    );
  };

  return (
    <Stack
      className="framework-page"
      sx={{
        minHeight: "100vh",
        padding: 3,
        backgroundColor: "#FCFCFD",
      }}
      ref={refs[0]}
    >
      <Stack>
        <Typography sx={vwhomeHeading}>Framework</Typography>
        <Typography sx={singleTheme.textStyles.pageDescription}>
          This page provides an overview of available AI compliance frameworks.
          Explore different frameworks to understand their requirements and
          implementation guidelines.
        </Typography>
      </Stack>

      <Stack className="frameworks-switch" sx={{ mt: 6 }}>
        {/* Instagram-style circular buttons */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            gap: 6,
            mb: 8,
            flexWrap: "wrap",
            py: 4,
          }}
        >
          {filteredFrameworks.map((framework, index) => (
            <Box
              key={framework.id}
              onClick={() => handleFrameworkSelect(index)}
              sx={{
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 1,
                transition: "transform 0.2s ease-in-out",
                "&:hover": {
                  transform: "scale(1.05)",
                },
              }}
            >
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  backgroundColor:
                    selectedFramework === index
                      ? getFrameworkColor(framework.name)
                      : "#F5F5F5",
                  border:
                    selectedFramework === index
                      ? `3px solid ${getFrameworkColor(framework.name)}`
                      : "3px solid #E0E0E0",
                  fontSize: "2rem",
                  fontWeight: "bold",
                  transition: "all 0.3s ease-in-out",
                  "&:hover": {
                    borderColor: getFrameworkColor(framework.name),
                    backgroundColor:
                      selectedFramework === index
                        ? getFrameworkColor(framework.name)
                        : "#F0F0F0",
                  },
                }}
              >
                {getFrameworkIcon(framework.name)}
              </Avatar>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: selectedFramework === index ? 600 : 400,
                  color:
                    selectedFramework === index
                      ? getFrameworkColor(framework.name)
                      : "#666666",
                  textAlign: "center",
                  maxWidth: 100,
                  fontSize: "0.75rem",
                }}
              >
                {framework.name}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Content that changes based on selected framework */}
        {renderFrameworkContent()}
      </Stack>
    </Stack>
  );
};

export default Framework;
