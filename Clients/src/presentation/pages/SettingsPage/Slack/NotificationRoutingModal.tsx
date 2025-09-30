import {
  Stack,
  Typography,
  useTheme,
  Box,
  Autocomplete,
  TextField,
} from "@mui/material";
import React, { useEffect, useMemo, useState } from "react";
import CustomizableButton from "../../../components/Button/CustomizableButton";
import { viewProjectButtonStyle } from "../../../components/Cards/ProjectCard/style";
import { ReactComponent as ExpandMoreIcon } from "../../../assets/icons/expand-down.svg";
import singleTheme from "../../../themes/v1SingleTheme";
import {
  sendSlackMessage,
  updateSlackIntegration,
} from "../../../../application/repository/slack.integration.repository";
import { useAuth } from "../../../../application/hooks/useAuth";
import useSlackIntegrations, {
  SlackRoutingType,
  SlackNotificationRoutingType,
} from "../../../../application/hooks/useSlackIntegrations";

type IntegrationList = { channel: string; teamName: string; id: number };

interface NotificationRoutingModalProps {
  setIsOpen: (value: null | HTMLElement) => void;
  integrations: IntegrationList[];
  showAlert: (
    variant: "success" | "info" | "warning" | "error",
    title: string,
    body: string,
  ) => void;
}

const NotificationRoutingModal: React.FC<NotificationRoutingModalProps> = ({
  setIsOpen,
  integrations,
  showAlert,
}) => {
  const theme = useTheme();
  const { userId } = useAuth();
  const { refreshSlackIntegrations, routingData: slackRoutingTypes } =
    useSlackIntegrations(userId);
  const [routingData, setRoutingData] =
    useState<SlackRoutingType[]>([...slackRoutingTypes]);
  
  const originalIds = useMemo(() => {
    return [...new Set(slackRoutingTypes.flatMap(item => item.id))]
  }, [slackRoutingTypes])

  useEffect(() => {
    setRoutingData(slackRoutingTypes);
  }, [slackRoutingTypes]);

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
    const transformedData = routingData.reduce(
      (acc: { id: number; routingType: string[] }[], item) => {
        item.id.forEach((id) => {
          const existing = acc.find(
            (entry: { id: number; routingType: string[] }) => entry.id === id,
          );
          if (existing) {
            existing.routingType.push(item.routingType);
          } else {
            acc.push({ id, routingType: [item.routingType] });
          }
        });
        return acc;
      },
      [],
    );

    // Handling the removed slack integration IDs
    const transformedIds = [...new Set(routingData.flatMap(item => item.id))];
    const missingIds = originalIds.filter(item => !transformedIds.includes(item));
    missingIds.forEach(id => transformedData.push({id, routingType: []}));
    try {
      await Promise.all(
        transformedData.map((item: { routingType: string[]; id: number }) =>
          updateSlackIntegration({
            id: item.id,
            body: { routing_type: item.routingType },
          }),
        ),
      );
      showAlert(
        "success",
        "Success",
        "Notification Routing type updated successfully to the Slack channel.",
      );
      refreshSlackIntegrations();
    } catch (error) {
      showAlert(
        "error",
        "Error",
        `Error updating routing types to Slack.: ${error}`,
      );
    } finally {
      setIsOpen(null);
    }
  };

  const handleSendTestNotification = async (
    type: SlackNotificationRoutingType,
  ) => {
    try {
      const ids =
        routingData.find((data) => data.routingType === type)?.id ?? [];
      await Promise.all(
        ids.map((id: number) =>
          sendSlackMessage({
            id,
          }),
        ),
      );

      showAlert(
        "success",
        "Success",
        "Test message sent successfully to the Slack channel.",
      );
    } catch (error) {
      showAlert(
        "error",
        "Error",
        `Error sending test message to the Slack channel.: ${error}`,
      );
    }
  };

  return (
    <Stack
      gap={theme.spacing(12)}
      sx={{
        minWidth: "860px",
        paddingTop: theme.spacing(12),
      }}
    >
      {Object.values(SlackNotificationRoutingType).map((type) => (
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
                onClick={() => handleSendTestNotification(type)}
                size="medium"
                text="Send Test"
                sx={viewProjectButtonStyle}
                isDisabled={(routingData.find((data) => data.routingType === type)?.id.length ?? 0) === 0}
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
