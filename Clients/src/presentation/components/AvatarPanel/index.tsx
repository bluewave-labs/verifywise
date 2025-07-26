import { Box, Stack, Typography } from "@mui/material";
import Avatar from "../Avatar/VWAvatar/index";
import { ChangeEvent, useCallback, useMemo, useRef, useState } from "react";
import { useTheme } from "@mui/material/styles";


/**
 * Interface representing a user object.
 * @interface
 */
interface UserDetails {
    firstname: string;
    lastname: string;
    email: string;
  }


interface User{
    firstname: string;
    lastname: string;
    email: string;
    pathToImage: string;
}  

const AvatarPanel = ({ userDetails }: { userDetails: UserDetails }) => {

    const theme = useTheme();
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [profilePhoto, setProfilePhoto] = useState<string>("/placeholder.svg?height=80&width=80");


    const user : User = useMemo(() => {
        return {
            firstname: userDetails.firstname,
            lastname: userDetails.lastname,
            email: userDetails.email,
            pathToImage: profilePhoto
        }
    }, [userDetails, profilePhoto]);

    /**
   * Handle file input change.
   *
   * Updates the profile photo with the selected file.
   *
   * @param {ChangeEvent<HTMLInputElement>} event - The change event.
   */
  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      const file = event.target.files?.[0];
      if (file) {
        const newPhotoUrl = URL.createObjectURL(file);
        setProfilePhoto(newPhotoUrl);
      }
    },
    []
  );


  /**
   * Handle update photo button click.
   *
   * Triggers the file input click to update the profile photo.
   */
  const handleUpdatePhoto = useCallback((): void => {
    fileInputRef.current?.click();
  }, []);

  /**
   * Handle delete photo button click.
   *
   * Resets the profile photo to the default placeholder.
   */
  const handleDeletePhoto = useCallback((): void => {
    setProfilePhoto("/placeholder.svg?height=80&width=80");
  }, []);

  return(
    <Box
            sx={{
              width: { xs: "100%", md: "40%" },
              textAlign: { xs: "left", md: "center" },
            }}
          >
            <Stack
              direction="column"
              alignItems={{ xs: "flex-start", md: "center" }}
              spacing={2}
            >
              <Typography
                fontWeight="600"
                variant="subtitle1"
                color="#344054"
                pb={theme.spacing(5)}
              >
                Your photo
              </Typography>
              <Avatar
                user={user}
                size="medium"
                sx={{ width: 80, height: 80 }}
              />
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                accept="image/*"
                onChange={handleFileChange}
              />
              <Stack
                direction="row"
                spacing={2}
                alignItems={"center"}
                sx={{ paddingTop: theme.spacing(10) }}
              >
                <Typography
                  sx={{
                    color: "#667085",
                    cursor: "pointer",
                    textDecoration: "none",
                    "&:hover": { textDecoration: "underline" },
                    fontSize: 13,
                  }}
                  onClick={handleDeletePhoto}
                >
                  Delete
                </Typography>
                <Typography
                  sx={{
                    color: "#13715B",
                    cursor: "pointer",
                    textDecoration: "none",
                    "&:hover": { textDecoration: "underline" },
                    paddingLeft: theme.spacing(5),
                    fontSize: 13,
                  }}
                  onClick={handleUpdatePhoto}
                >
                  Update
                </Typography>
              </Stack>
            </Stack>
          </Box>
  )
};

export default AvatarPanel;