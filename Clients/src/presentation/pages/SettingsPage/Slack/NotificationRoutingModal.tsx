import {
  Stack,
  Typography,
  useTheme,
  Box,
  Autocomplete,
  TextField,
} from "@mui/material";
import React, { useState } from "react";
import CustomizableButton from "../../../components/Button/CustomizableButton";
import { viewProjectButtonStyle } from "../../../components/Cards/ProjectCard/style";
import { ReactComponent as ExpandMoreIcon } from "../../../assets/icons/expand-down.svg";
import singleTheme from "../../../themes/v1SingleTheme";

type IntegrationList = { channel: string; teamName: string; id: number };
interface NotificationRoutingModalProps {
  setIsOpen: (value: null | HTMLElement) => void;
  integrations: IntegrationList[];
}

const NotificationRoutingModal: React.FC<NotificationRoutingModalProps> = ({
  setIsOpen,
  integrations,
}) => {
  const theme = useTheme();
  const [routingData, setRoutingData] = useState<
    { routingType: string; id: number[] }[]
  >([
    { routingType: "Membership and roles", id: [] },
    { routingType: "Policy reminders and status", id: [] },
    { routingType: "Evidence and task alerts", id: [] },
    { routingType: "Control or policy changes", id: [] },
  ]);

  const handleOnSelectChange = (type: string, newValue: IntegrationList[]) => {
    const data = [...routingData];
    const index = data.findIndex((item) => item.routingType === type);
    if (index > -1) {
      data[index].id = newValue.map((item) => item.id);
    } else {
      data.push({
        routingType: type,
        id: newValue.map((item) => item.id),
      });
    }
    setRoutingData(data);
  };

  const handleNotificationRouting = async () => {
    console.log("Routing Data:", routingData);
    setIsOpen(null);
    return;
  };

  const NOTIFICATIONS_TYPES = [
    "Membership and roles",
    "Policy reminders and status",
    "Evidence and task alerts",
    "Control or policy changes",
  ];

  return (
    <Stack
      gap={theme.spacing(12)}
      sx={{
        minWidth: "860px",
        paddingTop: theme.spacing(12),
      }}
    >
      {NOTIFICATIONS_TYPES.map((type) => (
        <Stack
          key={type}
          gap={2}
          sx={{
            padding: "24px",
            borderRadius: "8px",
            border: `1.5px solid ${theme.palette.border.dark}`,
          }}
        >
          <Box>
            <Typography fontSize={16} fontWeight={600}>
              {type}
            </Typography>
          </Box>

          <Stack
            sx={{
              display: "grid",
              gridTemplateColumns: "150px 600px 100px",
              alignItems: "center",
              mb: 3,
              gap: 4,
            }}
          >
            <Typography fontSize={10} sx={{ mr: 10 }}>
              DESTINATION CHANNELS
            </Typography>
            <Box>
              <Autocomplete
                multiple
                id="integration-filter"
                size="small"
                value={
                  integrations.filter((integration) =>
                    routingData
                      .find((item) => item.routingType === type)
                      ?.id.includes(integration.id),
                  ) || []
                }
                onChange={(_event, newValue: IntegrationList[]) => {
                  handleOnSelectChange(type, newValue);
                }}
                options={integrations}
                getOptionLabel={(integration) =>
                  `${integration.teamName} - ${integration.channel}`
                }
                renderOption={(props, option) => {
                  const { key, ...optionProps } = props;
                  return (
                    <Box key={key} component="li" {...optionProps}>
                      <Typography
                        fontSize={12}
                        sx={{
                          color: theme.palette.text.primary,
                        }}
                      >
                        {option.teamName} - {option.channel}
                      </Typography>
                    </Box>
                  );
                }}
                filterSelectedOptions
                popupIcon={<ExpandMoreIcon />}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder={"Select Destination Channel(s)"}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        paddingTop: `4px !important`,
                        paddingBottom: `4px !important`,
                      },
                      "& ::placeholder": {
                        fontSize: singleTheme.fontSizes.medium,
                      },
                    }}
                  />
                )}
                sx={{
                  width: "100%",
                  backgroundColor: "background.main",
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "3px",
                    overflowY: "auto",
                    flexWrap: "wrap",
                    maxHeight: "115px",
                    alignItems: "flex-start",
                    border: "1px solid #D1D5DB",
                    "&:hover": {
                      "& .MuiOutlinedInput-notchedOutline": {
                        border: "none",
                      },
                    },
                    "& .MuiOutlinedInput-notchedOutline": {
                      border: "none",
                    },
                    "&.Mui-focused": {
                      "& .MuiOutlinedInput-notchedOutline": {
                        border: "none",
                      },
                    },
                  },
                  "& .MuiAutocomplete-tag": {
                    margin: "2px",
                    maxWidth: "calc(100% - 25px)",
                    "& .MuiChip-label": {
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    },
                  },
                }}
                slotProps={{
                  paper: {
                    sx: {
                      "& .MuiAutocomplete-listbox": {
                        "& .MuiAutocomplete-option": {
                          fontSize: singleTheme.fontSizes.medium,
                          color: theme.palette.text.primary,
                          padding: `8px 4px`,
                        },
                        "& .MuiAutocomplete-option.Mui-focused": {
                          backgroundColor: theme.palette.background.accent,
                        },
                      },
                      "& .MuiAutocomplete-noOptions": {
                        fontSize: singleTheme.fontSizes.medium,
                        paddingLeft: "4px",
                        paddingRight: "4px",
                      },
                    },
                  },
                }}
              />
            </Box>
            <Box>
              <CustomizableButton
                variant="outlined"
                onClick={() => {}}
                size="medium"
                text="Send Test"
                sx={viewProjectButtonStyle}
              />
            </Box>
          </Stack>
        </Stack>
      ))}

      <Stack>
        <CustomizableButton
          variant="contained"
          onClick={handleNotificationRouting}
          size="medium"
          text="Save Changes"
          sx={{ alignSelf: "flex-end" }}
        />
      </Stack>
    </Stack>
  );
};

export default NotificationRoutingModal;
