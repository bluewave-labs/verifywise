import { Box, Typography, useTheme } from "@mui/material";
import { NoProjectBox } from "../../pages/Home/styles";
import emptyState from "../../assets/imgs/empty-state.svg";

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
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <img src={emptyState} alt="Empty project state" />
      </Box>
      <Typography
        sx={{
          textAlign: "center",
          mt: 13.5,
          color: theme.palette.text.tertiary,
        }}
      >
        {message}
      </Typography>
    </NoProjectBox>
  );
};

export default NoProject;
