// Lucide Icons
import {
    Layers,
    CheckCircle,
    Circle,
} from "lucide-react";

import { Box, Divider, List, ListItemButton, ListItemText, Stack, Tooltip, Typography, Chip, Link } from "@mui/material";
import StandardModal from "../StandardModal";
import { useTheme } from "@mui/material";
import type { FC } from "react";
import { IMenuGroup } from "../../../../domain/interfaces/i.menu";
import { title } from "process";
import React from "react";
import { stepNumberStyle } from "./style";



const getMenuGroups = (): IMenuGroup[] => [
    {
        name: "WAITING FOR APPROVAL",
        items: [
            {
                name: "AI Marketing Tool",
                path: "/overview",
                icon: <Layers size={16} strokeWidth={1.5} />,
                highlightPaths: ["/project-view"],
            },
            {
                name: "Medical AI Platform",
                icon: <Layers size={16} strokeWidth={1.5} />,
                path: "/framework",
            },
        ],

    },
    {
        name: "APPROVED REQUESTS",
        items: [
            {
                name: "Ecommerce AI Solution",
                path: "/overview",
                icon: <Layers size={16} strokeWidth={1.5} />,
                highlightPaths: ["/project-view"],
            },
            {
                name: "HR Analytics Tool",
                icon: <Layers size={16} strokeWidth={1.5} />,
                path: "/framework",
            },
        ],

    },
];



interface IRequestorApprovalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface ITimelineStep {
    id: number;
    stepNumber: number;
    title: string;
    status: 'completed' | 'pending' | 'rejected';
    approverName?: string;
    approverRole?: string;
    date?: string;
    comment?: string;
    showDetailsLink?: boolean;
    approvalResult?: "approved" | 'rejected' | 'pending';
}

const menuGroups = getMenuGroups();

const getOverallStatus = (): 'approved' | 'rejected' | 'pending' => {
    return "pending";
};

const getMockTimelineData = (): ITimelineStep[] => [
    {
        id: 1,
        stepNumber: 1,
        title: "Request submitted",
        status: 'completed',
        approverName: "Mary Johnson",
        approverRole: 'Requestor',
        date: "2024/01/15",
        showDetailsLink: true,
    },
    {
        id: 2,
        stepNumber: 2,
        title: "Manager Approval",
        status: 'pending',
        approverName: "John Smith",
        approverRole: "Manager",
        date: "2024/01/16",
        comment: "Please provide additional documentation.",
        approvalResult: 'pending',
    },
    {
        id: 3,
        stepNumber: 3,
        title: "Approval step 2",
        status: 'pending',
        approverName: "James Smith",
        approverRole: 'Approver',
    },
];

const RequestorApprovalModal: FC<IRequestorApprovalProps> = ({
    isOpen,
    onClose
}) => {
    const theme = useTheme();
    return (
        <StandardModal
            isOpen={isOpen}
            onClose={onClose}
            maxWidth="980px"
            onSubmit={() => { }}
            submitButtonText="Resubmit"
            title={"Approval requests "}
            description="Manage and review your requestor approvals."
        >
            <Stack direction="row" spacing={6}>
                <Box width="25%">
                    <Stack>
                        <Stack
                            component="aside"
                            className={`sidebar-menu expanded}`}
                            py={theme.spacing(1)}
                            gap={theme.spacing(1)}
                            sx={{
                                height: "30vh",
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
                                                {/* Group header */}
                                                <Typography
                                                    variant="overline"
                                                    sx={{
                                                        px: theme.spacing(4),
                                                        pb: theme.spacing(4),
                                                        mt: index === 1 ? theme.spacing(10) : theme.spacing(4),
                                                        color: theme.palette.text.disabled,
                                                        fontSize: "7px",
                                                        fontWeight: 400,
                                                        letterSpacing: "0.3px",
                                                        textTransform: "uppercase",
                                                        display: "block",
                                                        opacity: 0.7,
                                                    }}
                                                >
                                                    {group.name}
                                                </Typography>

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
                                                            //onClick={() => navigate(`${item.path}`)}
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
                    sx={{ borderColor: theme.palette.border.light, mx: 4, mr: 16 }}
                />
                <Stack spacing={8} direction="column"
                    sx={{
                        ml: 16,
                        paddingLeft: 20,
                    }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography fontWeight={600} fontSize={16} mb={2}>
                            Approval timeline
                        </Typography>
                        <Chip label={getOverallStatus()} />
                    </Stack>

                    {/* STEPS */}
                    <Stack spacing={4}>
                        {getMockTimelineData().map((step, stepIndex) => (
                            <React.Fragment key={step.id}>
                                <Stack direction="row" spacing={8} alignItems="flex-start">
                                    <Box sx={stepNumberStyle}>{step.stepNumber}</Box>
                                    <Stack>
                                        <Typography fontWeight={500} fontSize={16}>
                                            {step.title}
                                        </Typography>
                                        {step.date && (
                                            <Typography fontSize={13} fontWeight={400} color="#999999">
                                                {step.date}
                                            </Typography>
                                        )}
                                    </Stack>
                                </Stack>
                                <Stack direction="row" alignItems="flex-start" >
                                    {stepIndex < getMockTimelineData().length - 1 && (
                                        <Box>
                                            <Divider
                                                orientation="vertical"
                                                flexItem
                                                sx={{
                                                    borderRightWidth: "1px",
                                                    height: "216px",
                                                    borderColor: "#E0E0E0",
                                                    mt: 4,
                                                    ml: 6,
                                                    mr: 12,
                                                }}
                                            />
                                        </Box>
                                    )}
                                    <Stack sx={{ flex: 1 }} spacing={6}>
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
                                                            {"Requestor"}
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
                                                    console.log('See details clicked');
                                                    // TODO: Implement details view
                                                }}
                                                sx={{
                                                    color: '#13715B',
                                                    fontSize: '13px',
                                                    textDecoration: 'none',
                                                    cursor: 'pointer',
                                                    '&:hover': {
                                                        textDecoration: 'underline',
                                                    },
                                                    alignSelf: 'flex-start',
                                                }}
                                            >
                                                See details
                                            </Link>
                                        )}
                                        {step.comment && (
                                            <Stack direction="column" spacing={4}>
                                                <Typography fontWeight={600} fontSize={14} color="#999999">
                                                    Comment
                                                </Typography>
                                                <Typography fontWeight={500} fontSize={14}>
                                                    {step.comment}
                                                </Typography>
                                            </Stack>
                                        )}
                                    </Stack>
                                </Stack>
                            </React.Fragment>
                        ))}
                    </Stack>
                </Stack>

            </Stack>
        </StandardModal>
    )
}

export default RequestorApprovalModal; 