import {
    Check,
    ChevronRight,
} from "lucide-react";

import { Box, Divider, List, ListItemButton, ListItemText, Stack, Tooltip, Typography, Chip, Link, AccordionSummary, Accordion, AccordionDetails } from "@mui/material";
import StandardModal from "../StandardModal";
import { useTheme } from "@mui/material";
import type { FC } from "react";
import React, { useEffect, useState } from "react";
import { ApprovalStatus } from "../../../../domain/enums/aiApprovalWorkflow.enum";
import StepDetailsModal from './StepDetailsModal';
import { getStepDetails, IMenuItemExtended, IStepDetails } from './mockData';

import {
    getMenuGroups,
    getMockTimelineData,
    MenuItemId
} from './mockData';

const getWorkflowChipProps = (value: string) => {
    const styles: Record<string, { bg: string; color: string }> = {
        [ApprovalStatus.APPROVED]: {
            bg: "#E6F4EA",
            color: "#2E7D32",
        },
        [ApprovalStatus.REJECTED]: {
            bg: "#FDECEA",
            color: "#C62828",
        },
        [ApprovalStatus.PENDING]: {
            bg: "#F5F5F5",
            color: "#616161",
        },
    };

    const style = styles[value] || { bg: "#F5F5F5", color: "#616161" };

    return {
        label: value,
        size: "small" as const,
        sx: {
            backgroundColor: style.bg,
            color: style.color,
            fontWeight: 500,
            fontSize: "11px",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            borderRadius: "4px",
            "& .MuiChip-label": {
                padding: "4px 8px",
            },
        },
    };
};

interface IRequestorApprovalProps {
    isOpen: boolean;
    onClose: () => void;
    isRequestor: boolean;
}

const menuGroups = getMenuGroups();


const RequestorApprovalModal: FC<IRequestorApprovalProps> = ({
    isOpen,
    onClose,
    isRequestor
}) => {
    const theme = useTheme();
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
        "WAITING FOR APPROVAL": true,
        "APPROVED REQUESTS": false
    });


    const [isStepDetailsModalOpen, setIsStepDetailsModalOpen] = useState(false);
    const [selectedStepDetails, setSelectedStepDetails] = useState<IStepDetails | null>(null);


    const [selectedItem, setSelectedItem] = useState<IMenuItemExtended | null>(null);


    const getOverallStatus = (): 'approved' | 'rejected' | 'pending' => {
        if (selectedItem === undefined || selectedItem === null) {
            return 'pending';
        }
        return selectedItem.status || 'pending';
        return "pending";
    };

    const handleGroupAccordionChange = (groupName: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
        setExpandedGroups(prev => ({
            ...prev,
            [groupName]: isExpanded
        }));
    };

    const handleSeeDetailsClick = (stepId: number) => {
        const stepDetails = getStepDetails(stepId);
        if (stepDetails) {
            setSelectedStepDetails(stepDetails);
            setIsStepDetailsModalOpen(true);
        }
    };

    useEffect(() => {
        // Set first menu item as selected by default
        const firstGroup = menuGroups[0];
        if (firstGroup && firstGroup.items.length > 0) {
            const firstItem = firstGroup.items[0];
            // Set the integer ID of the first item
            if (firstItem.id !== undefined) {
                setSelectedItem(firstItem);
            }
        }
    }, []);

    return (
        <StandardModal
            isOpen={isOpen}
            onClose={onClose}
            maxWidth="900px"
            onSubmit={() => { isRequestor ? console.log("Resubmit clicked") : console.log("Submit clicked"); }}
            submitButtonText={isRequestor ? "Resubmit" : "Submit"}
            cancelButtonText="Cancel"
            title={isRequestor ? "Resubmit Approval Request" : "Approval requests"}
            description="Manage and review your requestor approvals."
        >
            <Stack direction="row" spacing={12} >
                <Box
                    width="250px"
                    sx={{ alignSelf: "stretch" }}
                >
                    <Stack>
                        <Stack
                            component="aside"
                            className={`sidebar-menu expanded}`}
                            py={theme.spacing(1)}
                            gap={theme.spacing(1)}
                            sx={{
                                backgroundColor: theme.palette.background.main,
                                "& ,selected-path, & >MuiListItemButton-root:hover": {
                                    backgroundColor: theme.palette.background.main,
                                },
                                "& .Muilist-root svg path": {
                                    stroke: theme.palette.text.tertiary,
                                },
                                "& p, & span, & .MuiListSubheader-root": {
                                    color: theme.palette.text.secondary,
                                }
                            }}
                        >
                            <Stack
                                pb={theme.spacing(12)}
                                sx={{ position: "relative" }}
                            >
                                <Stack
                                    direction="row"
                                    alignItems="center"
                                    gap={theme.spacing(4)}
                                    className="app-title"
                                >
                                    <List
                                        component="nav"
                                        aria-labelledby="nested-menu-subheader"
                                        disablePadding
                                        sx={{
                                            px: theme.spacing(0),
                                            flex: 1,
                                            overflowY: "auto",
                                            overflowX: "hidden",
                                            "&::-webkit-scrollbar": {
                                                width: "4px",
                                            },
                                            "&::-webkit-scrollbar-track": {
                                                background: "transparent",
                                            },
                                            "&::-webkit-scrollbar-thumb": {
                                                background: theme.palette.border.light,
                                                borderRadius: "2px",
                                            },
                                            "&::-webkit-scrollbar-thumb:hover": {
                                                background: theme.palette.border.dark,
                                            },
                                        }}
                                    >
                                        {menuGroups.map((group, index) => (
                                            <React.Fragment key={group.name}>
                                                <Accordion
                                                    expanded={expandedGroups[group.name] || false}
                                                    onChange={handleGroupAccordionChange(group.name)}
                                                    sx={{
                                                        backgroundColor: "transparent",
                                                        boxShadow: "none",
                                                        border: "none",
                                                        "&::before": {
                                                            display: "none",
                                                        },
                                                        "& .MuiAccordionSummary-root": {
                                                            minHeight: "unset !important",
                                                            padding: "0 !important",
                                                            px: `${theme.spacing(4)} !important`,
                                                            pb: `${theme.spacing(4)} !important`,
                                                            mt: index === 1 ? theme.spacing(8) : theme.spacing(8),
                                                        },
                                                        "& .MuiAccordionSummary-content": {
                                                            margin: "0 !important",
                                                        },
                                                        "& .MuiAccordionSummary-content.Mui-expanded": {
                                                            margin: "0 !important",
                                                        },
                                                        "& .MuiAccordionDetails-root": {
                                                            padding: 0,
                                                        },
                                                    }}
                                                >
                                                    <AccordionSummary
                                                        expandIcon={
                                                            <ChevronRight
                                                                size={16}
                                                                strokeWidth={2}
                                                                style={{
                                                                    transition: "transform 0.3s",
                                                                    transform: expandedGroups[group.name] ? "rotate(90deg)" : "rotate(0deg)",
                                                                    color: theme.palette.text.disabled,
                                                                }}
                                                            />
                                                        }
                                                    >
                                                        <Typography
                                                            variant="overline"
                                                            sx={{
                                                                color: theme.palette.text.disabled,
                                                                fontSize: "7px",
                                                                fontWeight: 400,
                                                                letterSpacing: "0.3px",
                                                                textTransform: "uppercase",
                                                                opacity: 0.7,
                                                            }}
                                                        >
                                                            {group.name}
                                                        </Typography>
                                                    </AccordionSummary>
                                                    <AccordionDetails>
                                                        {/* Group items */}
                                                        {group.items.map((item) => (
                                                            <Tooltip
                                                                sx={{ fontSize: 13 }}
                                                                key={item.path}
                                                                placement="right"
                                                                title={""}
                                                                slotProps={{
                                                                    popper: {
                                                                        modifiers: [
                                                                            {
                                                                                name: "offset",
                                                                                options: {
                                                                                    offset: [0, -16],
                                                                                },
                                                                            },
                                                                        ],
                                                                    },
                                                                }}
                                                                disableInteractive
                                                            >
                                                                <ListItemButton
                                                                    disableRipple={
                                                                        theme.components?.MuiListItemButton?.defaultProps
                                                                            ?.disableRipple
                                                                    }
                                                                    className={
                                                                        location.pathname === item.path
                                                                            ? "selected-path"
                                                                            : "unselected"
                                                                    }
                                                                    onClick={() => {
                                                                        // Set selected item ID (integer)
                                                                        if (item.id !== undefined) {
                                                                            setSelectedItem(item);
                                                                        }
                                                                    }}

                                                                    // class={
                                                                    //     // Update this condition to check selectedItemId
                                                                    //     (item.id !== undefined && selectedItemId === item.id)
                                                                    //         ? "selected-path"
                                                                    //         : "unselected"
                                                                    // }
                                                                    sx={{
                                                                        height: "32px",
                                                                        gap: theme.spacing(4),
                                                                        borderRadius: theme.shape.borderRadius,
                                                                        px: theme.spacing(4),
                                                                        background:
                                                                            location.pathname === item.path
                                                                                ? "linear-gradient(135deg, #ECECEC 0%, #E4E4E4 100%)"
                                                                                : "transparent",
                                                                        border:
                                                                            location.pathname === item.path
                                                                                ? "1px solid #D8D8D8"
                                                                                : "1px solid transparent",

                                                                        "&:hover": {
                                                                            background:
                                                                                location.pathname === item.path ? "linear-gradient(135deg, #ECECEC 0%, #E4E4E4 100%)"
                                                                                    : "#F9F9F9",
                                                                            border:
                                                                                location.pathname === item.path
                                                                                    ? "1px solid #D8D8D8"
                                                                                    : "1px solid transparent",
                                                                        },
                                                                        "&:hover svg": {
                                                                            color: "#13715B !important",
                                                                            stroke: "#13715B !important",
                                                                        },
                                                                        "&:hover svg path": {
                                                                            stroke: "#13715B !important",
                                                                        },
                                                                    }}
                                                                >

                                                                    <ListItemText
                                                                        sx={{
                                                                            "& .MuiListItemText-primary": {
                                                                                fontSize: "13px",
                                                                            },
                                                                        }}
                                                                    >
                                                                        {item.name}
                                                                    </ListItemText>
                                                                </ListItemButton>
                                                            </Tooltip>
                                                        ))}
                                                    </AccordionDetails>
                                                </Accordion>
                                                {index === 0 && (
                                                    <Divider
                                                        orientation="horizontal"
                                                        flexItem
                                                        sx={{
                                                            borderColor: theme.palette.border.light,
                                                            mx: 4,
                                                            mr: 16,
                                                            width: '248px'
                                                        }}
                                                    />
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </List>
                                </Stack>
                            </Stack>
                        </Stack>
                    </Stack>
                </Box>
                <Divider
                    orientation="vertical"
                    flexItem
                    sx={{
                        borderColor: theme.palette.border.light,
                        mx: 4,
                        mr: 16
                    }}
                />
                <Stack spacing={8} direction="column"
                    sx={{
                        paddingLeft: 8,
                        width: '548px'
                    }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography fontWeight={600} fontSize={16} mb={2}>
                            Approval timeline
                        </Typography>

                        <Chip
                            {...(getWorkflowChipProps(
                                getOverallStatus()
                            ) || {})}
                        />
                    </Stack>

                    {/* STEPS */}
                    <Stack>
                        {getMockTimelineData(selectedItem?.id || undefined).map((step, stepIndex, steps) => (
                            <React.Fragment key={step.id}>
                                <Box key={step.id} mb={12}>
                                    <Stack direction="row" spacing={8} justifyContent="center" alignItems="flex-start">
                                        <Box
                                            sx={{
                                                minWidth: '20px',
                                                width: '20px',
                                                height: '20px',
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                backgroundColor: step.status === 'completed' ? '#11725B' : 'transparent',
                                                border: step.status === 'completed' ? 'none' : '2px solid #CCCCCC',
                                            }}
                                        >
                                            {step.status === 'completed' ? (
                                                <Check size={12} color="#FFFFFF" />
                                            ) : (
                                                <Check size={12} color="#CCCCCC" strokeWidth={3} />
                                            )}
                                        </Box>
                                        <Stack direction="column" sx={{ flex: 1, mb: 2 }} >
                                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                <Typography fontWeight={500} fontSize={16}>
                                                    {step.approvalResult
                                                        ? `${step.title} - ${step.approvalResult}`
                                                        : step.title
                                                    }
                                                </Typography>
                                                {step.date && (
                                                    <Typography fontSize={12} fontWeight={400} color="#999999">
                                                        {step.date}
                                                    </Typography>
                                                )}
                                            </Stack>
                                        </Stack>
                                    </Stack>
                                    <Stack direction="row" alignItems="stretch">
                                        {stepIndex < steps.length && (
                                            <Divider
                                                orientation="vertical"
                                                flexItem
                                                sx={{
                                                    borderRightWidth: "0.5px",
                                                    borderColor: "#E0E0E0",
                                                    mt: 4,
                                                    ml: 5,
                                                    mr: 12,
                                                    mb: 2,
                                                }}
                                            />
                                        )}
                                        <Stack sx={{ flex: 1 }} spacing={6} ml={2}>
                                            {step.approverName && (
                                                <Stack
                                                    direction="row"
                                                    spacing={4}
                                                    alignItems="center"
                                                    gap={2}>
                                                    <Typography fontWeight={500} fontSize={14} mb={2} color="#999999">
                                                        {step.approverName}
                                                    </Typography>
                                                    {step.approverRole && (
                                                        <>
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="4" height="4" viewBox="0 0 4 4" fill="none">
                                                                <circle cx="2" cy="2" r="2" fill="#CCCCCC" />
                                                            </svg>

                                                            <Typography fontWeight={500} fontSize={14} mb={2} color="#999999">
                                                                {step.approverRole}
                                                            </Typography>
                                                        </>
                                                    )}
                                                </Stack>
                                            )}
                                            {step.showDetailsLink && (
                                                <Link
                                                    component="button"
                                                    variant="body2"
                                                    onClick={() => {
                                                        handleSeeDetailsClick(step.id);
                                                    }}
                                                    sx={{
                                                        color: "#13715B",
                                                        fontSize: '13px',
                                                        fontWeight: 500,
                                                        textDecoration: "underline",
                                                        cursor: 'pointer',
                                                        '&:hover': {
                                                            color: "#0F5A47",
                                                        },
                                                        alignSelf: 'flex-start',
                                                    }}
                                                >
                                                    See details
                                                </Link>
                                            )}
                                            {step.comment && (
                                                <Stack direction="column" spacing={2}>
                                                    <Typography fontWeight={600} fontSize={12} color="#999999">
                                                        Comment
                                                    </Typography>
                                                    <Typography fontWeight={500} fontSize={14}>
                                                        {step.comment}
                                                    </Typography>
                                                </Stack>
                                            )}
                                        </Stack>
                                    </Stack>
                                </Box>
                            </React.Fragment>
                        ))}
                    </Stack>
                </Stack>

            </Stack>
            <StepDetailsModal
                isOpen={isStepDetailsModalOpen}
                onClose={() => {
                    setIsStepDetailsModalOpen(false);
                    setSelectedStepDetails(null);
                }}
                stepDetails={selectedStepDetails}
            />
        </StandardModal>
    )
}

export default RequestorApprovalModal; 