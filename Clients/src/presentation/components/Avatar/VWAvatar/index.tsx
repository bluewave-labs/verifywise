import { Avatar as VWAvatar } from "@mui/material";

interface User {
  firstname: string;
  lastname: string;
  pathToImage: string;
}

/**
 * Avatar component that displays a user's avatar with customizable size and styles.
 *
 * @param {Object} props - The properties object.
 * @param {User} [props.user] - The user object containing firstname, lastname, and pathToImage.
 * @param {"small" | "medium" | "large"} [props.size="small"] - The size of the avatar.
 * @param {object} [props.sx] - Additional styles to apply to the avatar.
 *
 * @returns {JSX.Element} The rendered Avatar component.
 */
const Avatar = ({
  user = {
    firstname: "F",
    lastname: "L",
    pathToImage: "",
  },
  size = "small",
  sx,
}: {
  user?: User;
  size?: "small" | "medium" | "large";
  sx?: object;
}): JSX.Element => {
  let dimensions = {};
  if (size === "small") {
    dimensions = { width: 32, height: 32, fontSize: 13 };
  } else if (size === "medium") {
    dimensions = { width: 64, height: 64, fontSize: 22 };
  } else if (size === "large") {
    dimensions = { width: 128, height: 128, fontSize: 44 };
  }

  return (
    <VWAvatar
      src={user!.pathToImage}
      alt={`${user!.firstname} ${user!.lastname}`}
      component={"div"}
      variant="circular" // or variant="rounded" or variant="square"
      sx={{
        backgroundColor: `#12715B`,
        ...dimensions,
        border: user!.pathToImage ? `1px solid #12715B` : "none",
        ...sx,
      }}
    >
      {user!.firstname.charAt(0)}
      {user!.lastname.charAt(0)}
    </VWAvatar>
  );
};

export default Avatar;
