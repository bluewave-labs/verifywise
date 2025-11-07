import { Box, Typography, useTheme } from "@mui/material";
import { NoProjectBox } from "../../pages/Home/styles";
import SkeletonCard from "../SkeletonCard";

interface NoProjectProps {
  message: string;
}

/**
 * NoProject component displays a message and an image indicating an empty project state.
 *
 * @component
 * @param {NoProjectProps} props - The properties object.
 * @param {string} props.message - The message to display when there are no projects.
 *
 * @returns {JSX.Element} The rendered NoProject component.
 */

const NoProject = ({ message }: NoProjectProps) => {
  const theme = useTheme();

  return (
    <NoProjectBox>
      <Box sx={{ display: "flex", justifyContent: "center", mb: '20px' }}>
        <SkeletonCard showHalo={false} />
      </Box>
      <Typography
        sx={{
          textAlign: "center",
          color: theme.palette.text.tertiary,
          textWrap: "balance",
          fontSize: 13,
          fontWeight: 400,
        }}
      >
        {message}
      </Typography>
    </NoProjectBox>
  );
};

export default NoProject;
