import { useState } from "react";
import { Box, Stack, Typography } from "@mui/material";
import WorkspaceSwitchModal from "../../components/Modals/WorkspaceSwitchModal";
import CustomizableButton from "../../components/Button/CustomizableButton";

const mockWorkspaces = [
  {
    id: 1,
    name: "VerifyWise - HQ",
    description: "Main workspace for VerifyWise",
    iconColor: "#13715B",
  },
  {
    id: 2,
    name: "VerifyWise - Germany",
    description: "VerifyWise in Germany",
    iconColor: "#7B9A7A",
  },
  {
    id: 3,
    name: "VerifyWise - USA",
    description: "VerifyWise in USA",
    iconColor: "#3B82F6",
  },
];

const PlayGround = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<number>(1);

  return (
    <Box sx={{ padding: "32px 40px" }}>
      <Typography sx={{ fontSize: 24, fontWeight: 600, mb: 3, color: "#101828" }}>
        Component Playground
      </Typography>

      <Stack spacing={4}>
        <Box>
          <Typography sx={{ fontSize: 16, fontWeight: 600, mb: 2, color: "#344054" }}>
            WorkspaceSwitchModal
          </Typography>
          <Typography sx={{ fontSize: 13, color: "#475467", mb: 2 }}>
            A modal for switching between workspaces and creating new ones.
          </Typography>
          <CustomizableButton
            variant="contained"
            text="Open Workspace Modal"
            onClick={() => setIsModalOpen(true)}
          />
        </Box>
      </Stack>

      <WorkspaceSwitchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        workspaces={mockWorkspaces}
        currentWorkspaceId={currentWorkspaceId}
        onWorkspaceSelect={(ws) => {
          setCurrentWorkspaceId(ws.id as number);
          setIsModalOpen(false);
        }}
        onCreateWorkspace={() => {
          console.log("Create new workspace clicked");
          setIsModalOpen(false);
        }}
      />
    </Box>
  );
};

export default PlayGround;
