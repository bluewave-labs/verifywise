import { Stack } from "@mui/material";
import StandardModal from "../StandardModal";
import { useTheme } from "@mui/material";
import type { FC } from "react";
import { title } from "process";


interface IRequestorApprovalProps {
    isOpen: boolean;
    onClose: () => void;
}



const RequestorApprovalModal: FC<IRequestorApprovalProps> = ({
    isOpen,
    onClose
}) => {
    const theme = useTheme();
    return (
        <StandardModal
            isOpen={isOpen}
            onClose={onClose}
            title={"Request title"}
            description="Describe the request here."
        >
            <Stack> <Stack
                component="aside"
                className={`sidebar-menu expanded}`}
                py={theme.spacing(6)}
                gap={theme.spacing(2)}
                sx={{
                    height: "100vh",
                    border: 1,
                    borderColor: theme.palette.border.dark,
                    borderRadius: theme.shape.borderRadius,
                    backgroundColor: theme.palette.background.main,
                    "& ,selected-path, & >MuiListItemButton-root:hover": {
                        backgroundColor: theme.palette.background.main,
                    },
                    "& .Muilist-root svg path": {
                        stroke: theme.palette.text.tertiary,
                    },
                    "& p, & span, & .MuiListSubheader-root": {
                        color: theme.palette.text.secondary,
                    },
                }}
            >
                <Stack
                    pt={theme.spacing(6)}
                    pb={theme.spacing(12)}
                    pl={theme.spacing(12)}
                    sx={{ position: "relative" }}
                >
                    <Stack
                        direction="row"
                        alignItems="center"
                        gap={theme.spacing(4)}
                        className="app-title"
                    >
                        TO-DO
                    </Stack>
                </Stack>
            </Stack>
            </Stack>
        </StandardModal>
    )
}

export default RequestorApprovalModal; 