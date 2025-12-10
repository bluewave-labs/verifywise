import {
    Check,
    ChevronRight,
} from "lucide-react";

import { Box, Divider, List, ListItemButton, ListItemText, Stack, Tooltip, Typography, Chip, Link, AccordionSummary, Accordion, AccordionDetails, TextField, Button } from "@mui/material";
import {
    sidebarContainer,
    sidebarMenuStyle,
    sidebarInnerStack,
    listStyle,
    getAccordionStyleWithIndex,
    groupTypographyStyle,
    tooltipStyle,
    listItemButtonStyle,
    listItemTextStyle,
    horizontalDividerStyle,
    verticalDividerStyle,
    timelineContainer,
    stepCircleStyle,
    stepContainerStyle,
    stepDateStyle,
    stepTitleStyle,
    stepDividerStyle,
    stepDetailsStack,
    approverNameStyle,
    seeDetailsLinkStyle,
    commentLabelStyle,
    commentTextStyle,
    commentFieldStyle,
    withdrawalBodyStyle,
} from './style';
import StandardModal from "../StandardModal";
import { useTheme } from "@mui/material";
import type { FC } from "react";
import React, { useEffect, useState } from "react";
import { ApprovalStatus } from "../../../../domain/enums/aiApprovalWorkflow.enum";
import StepDetailsModal from './StepDetailsModal';
import { stepDetailsMap, timelineDataMap } from './mockData';
import dayjs from "dayjs";
import DualButtonModal from "../../Dialogs/DualButtonModal";
import { getMenuGroups } from './mockData';
import Field from "../../Inputs/Field";
import { IMenuItem } from "../../../../domain/interfaces/i.menu";


export interface IRequestorApprovalProps {
    isOpen: boolean;
    onClose: () => void;
    isRequestor: boolean;
}

export interface ITimelineStep {
    id: number;
    stepNumber: number;
    title: string;
    status: 'completed' | 'pending' | 'rejected';
    approverName?: string;
    date?: string;
    comment?: string;
    showDetailsLink?: boolean;
    approvalResult?: "approved" | 'rejected' | 'pending';
}

export interface IStepDetails {
    stepId: number;
    owner: string;
    teamMembers: string[];
    location: string;
    startDate: string;
    targetIndustry: string;
    description: string;
}

export interface IMenuGroupExtended {
    name: string;
    items: IMenuItemExtended[];
}

interface IMenuItemExtended extends IMenuItem {
    id: number;
    status: 'approved' | 'rejected' | 'pending';
}


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

const getTimelineData = (itemId?: number): ITimelineStep[] => {
    if (itemId === undefined || itemId === null) {
        return [];
    }
    return timelineDataMap[itemId] || [];
};

const getStepDetails = (stepId: number): IStepDetails | null => {
    // This will be populated with mock data in the next step
    return stepDetailsMap[stepId] || null;
};



const RequestorApprovalModal: FC<IRequestorApprovalProps> = ({
    isOpen,
    onClose,
    isRequestor
}) => {

    const [isStepDetailsModalOpen, setIsStepDetailsModalOpen] = useState(false);
    const [selectedStepDetails, setSelectedStepDetails] = useState<IStepDetails | null>(null);
    const [selectedItem, setSelectedItem] = useState<IMenuItemExtended | null>(null);
    const [comment, setComment] = useState<string>("");
    const [isWithdrawConfirmationOpen, setIsWithdrawConfirmationOpen] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
        "WAITING FOR APPROVAL": true,
        "APPROVED REQUESTS": false
    });

    const theme = useTheme();
    const menuGroups = getMenuGroups();

    const getOverallStatus = (): 'approved' | 'rejected' | 'pending' => {
        if (selectedItem === undefined || selectedItem === null) {
            return 'pending';
        }
        return selectedItem.status || 'pending';
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

    const handleApprove = () => {
        // TODO: API call to approve the request
        console.log("Approve clicked with comment:", comment);

        onClose();
    };

    const handleReject = () => {
        // TODO: API call to reject the request
        console.log("Reject clicked with comment:", comment);

        onClose();
    };

    const handleWithdraw = () => {
        // TODO: API call to withdraw the request
        setIsWithdrawConfirmationOpen(false);
        console.log("Withdraw confirmed - API call will be made here");

        onClose();
    };

    const handleWithdrawClick = () => {
        setIsWithdrawConfirmationOpen(true);
    };

    const handleWithdrawCancel = () => {
        setIsWithdrawConfirmationOpen(false);
    }

    const renderCustomFooter = () => {
        if (isRequestor) {
            return (
                <>
                    <Box />
                    <Button onClick={handleWithdrawClick} color="error" variant="contained">Withdraw</Button>
                </>
            );
        } else {
            return (
                <Stack
                    direction="row"
                    justifyContent="flex-end"
                    spacing={8}
                    alignItems="center"
                    width="100%"
                >
                    <Button onClick={handleReject} color="error" variant="contained">Reject</Button>
                    <Button onClick={handleApprove} color="primary" variant="contained">Approve</Button>
                </Stack>
            );
        }
    };

    useEffect(() => {
        const firstGroup = menuGroups[0];
        if (firstGroup && firstGroup.items.length > 0) {
            const firstItem = firstGroup.items[0];

            if (firstItem.id !== undefined) {
                setSelectedItem(firstItem);
            }
        }
    }, [menuGroups]);

    return (
        <StandardModal
            isOpen={isOpen}
            onClose={onClose}
            maxWidth="900px"
            title={isRequestor ? "Approval requests" : "Approval requests"}
            description="Manage and review your requestor approvals."
            customFooter={renderCustomFooter()}
        >
            <Stack direction="row" spacing={12} >
                <Box
                    width="250px"
                    sx={sidebarContainer}
                >
                    <Stack>
                        <Stack
                            component="aside"
                            className={`sidebar-menu expanded}`}
                            py={theme.spacing(1)}
                            gap={theme.spacing(1)}
                            sx={sidebarMenuStyle(theme)}
                        >
                            <Stack
                                sx={sidebarInnerStack(theme)}
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
                                        sx={listStyle(theme)}
                                    >
                                        {menuGroups.map((group, index) => (
                                            <React.Fragment key={group.name}>
                                                <Accordion
                                                    expanded={expandedGroups[group.name] || false}
                                                    onChange={handleGroupAccordionChange(group.name)}
                                                    sx={getAccordionStyleWithIndex(theme, index)}
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
                                                            sx={groupTypographyStyle(theme)}
                                                        >
                                                            {group.name}
                                                        </Typography>
                                                    </AccordionSummary>
                                                    <AccordionDetails>
                                                        {/* Group items */}
                                                        {group.items.map((item) => (
                                                            <Tooltip
                                                                sx={tooltipStyle}
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
                                                                        (item.id !== undefined && selectedItem?.id === item.id)
                                                                            ? "selected-path"
                                                                            : "unselected"
                                                                    }
                                                                    onClick={() => {
                                                                        // Set selected item ID (integer)
                                                                        if (item.id !== undefined) {
                                                                            setSelectedItem(item);
                                                                        }
                                                                    }}
                                                                    sx={listItemButtonStyle(theme, item.id !== undefined && selectedItem?.id === item.id)}
                                                                >

                                                                    <ListItemText
                                                                        sx={listItemTextStyle}
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
                                                        sx={horizontalDividerStyle(theme)}
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
                    sx={verticalDividerStyle(theme)}
                />
                <Stack spacing={8} direction="column"
                    sx={timelineContainer}>
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
                        {getTimelineData(selectedItem?.id || undefined).map((step, stepIndex, steps) => (
                            <React.Fragment key={step.id}>
                                <Box key={step.id} mb={12}>
                                    <Stack direction="row" spacing={8} justifyContent="center" alignItems="flex-start">
                                        <Box
                                            sx={stepCircleStyle(step.status === 'completed')}
                                        >
                                            {step.status === 'completed' ? (
                                                <Check size={12} color="#FFFFFF" />
                                            ) : (
                                                <Check size={12} color="#CCCCCC" strokeWidth={3} />
                                            )}
                                        </Box>
                                        <Stack direction="column" sx={stepContainerStyle} >
                                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                <Typography sx={stepTitleStyle}>
                                                    {step.approvalResult
                                                        ? `${step.title} - ${step.approvalResult}`
                                                        : step.title
                                                    }
                                                </Typography>
                                                {step.date && (
                                                    <Typography sx={stepDateStyle}>
                                                        {dayjs(step.date).format("YYYY-MM-DD, HH:mm")}
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
                                                sx={stepDividerStyle}
                                            />
                                        )}
                                        <Stack sx={stepDetailsStack} spacing={6} ml={2}>
                                            {step.approverName && (
                                                <Stack
                                                    direction="row"
                                                    spacing={4}
                                                    alignItems="center"
                                                    gap={2}>
                                                    <Typography sx={approverNameStyle}>
                                                        {step.approverName}
                                                    </Typography>
                                                </Stack>
                                            )}
                                            {step.showDetailsLink && (
                                                <Link
                                                    component="button"
                                                    variant="body2"
                                                    onClick={() => {
                                                        handleSeeDetailsClick(step.id);
                                                    }}
                                                    sx={seeDetailsLinkStyle}
                                                >
                                                    See details
                                                </Link>
                                            )}
                                            {step.comment && (
                                                <Stack direction="column" spacing={2}>
                                                    <Typography sx={commentLabelStyle}>
                                                        Comment
                                                    </Typography>
                                                    <Typography sx={commentTextStyle}>
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
                    {!isRequestor && (
                        <Stack spacing={0}>
                            <Field
                                label="Comment"
                                rows={2}
                                type="description"
                                placeholder="Add comment"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                sx={commentFieldStyle}
                            />
                        </Stack>
                    )}
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
            <DualButtonModal
                isOpen={isWithdrawConfirmationOpen}
                title="Confirm Withdrawal"
                body={
                    <Typography sx={withdrawalBodyStyle}>
                        Are you sure you want to withdraw this approval request? This action cannot be undone.
                    </Typography>
                }
                cancelText="Cancel"
                proceedText="Withdraw"
                onCancel={handleWithdrawCancel}
                onProceed={handleWithdraw}
                proceedButtonColor="error"
                proceedButtonVariant="contained"
                TitleFontSize={16}
            />
        </StandardModal>
    )
}

export default RequestorApprovalModal; 