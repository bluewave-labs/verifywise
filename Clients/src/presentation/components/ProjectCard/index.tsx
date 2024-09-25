import { Typography, Box } from "@mui/material";
import Button from '@mui/material/Button';
import { FC } from "react";
import euimg from "../../assets/imgs/eu-ai-act.jpg"
import ProgressBar from "./ProgressBar";

export interface ProjectCardProps {
    id: number,
    name: string,
    owner_name: string,
    last_update: string,
    controls_completed: string,
    requirements_completed: string
}

const ProjectCard: FC<ProjectCardProps> = ({
    name,
    owner_name,
    last_update,
    controls_completed,
    requirements_completed
}) => {
    const proggressCount = (progressString: string): number => {
        const res = progressString.split('/');
        return Number(res[0])/Number(res[1]);
    }

    return (
        <Box sx={{ maxHeight: 261, minWidth: 300, pb: 7.5, pr: 15, pl: 6.5, pt: 9.5, border: "1px solid #EAECF0", borderRadius: 2  }}>
            <Typography variant="h5" component="div" sx={{ color: '#2D3748', fontSize: 13, fontWeight: "bold", mb: 6 }}>
                {name}
            </Typography>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 10 }}>
                <Box>
                    <Typography variant="subtitle1" component="span" sx={{ color: '#8594AC', fontSize: 11 }}>
                        Project owner
                    </Typography>
                    <Typography sx={{ color: '#344054', fontSize: 13 }}>{owner_name}</Typography>
                </Box>
                <Box>
                    <Typography variant="subtitle1" component="span" sx={{ color: '#8594AC', fontSize: 11 }}>
                        Last updated
                    </Typography>
                    <Typography sx={{ color: '#344054', fontSize: 13 }}>{last_update}</Typography>
                </Box>
            </Box>
            <ProgressBar progress={proggressCount(controls_completed)} />
            <Typography sx={{ color: '#8594AC', mb: 10, mt: 1, fontSize: 11 }}>
                {controls_completed} controls completed
            </Typography>
            <ProgressBar progress={proggressCount(requirements_completed)} />
            <Typography sx={{ color: '#8594AC', fontSize: 11, mt: 1  }}>
                {requirements_completed} requirements completed
            </Typography>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", mt: 15 }}>
                <Box sx={{ display: "flex", mb: 1.5 }}>
                    <Box sx={{ maxWidth: 18.24, maxHeight: 18, borderRadius: 2 }}>
                        <img src={euimg} alt="EU AI Act" />
                    </Box>
                    <Typography sx={{ color: '#8594AC', fontSize: 12, ml: 2 }}>
                        EU AI Act
                    </Typography>
                </Box>                    
                <Button variant="outlined" sx={{ textTransform: "none", borderRadius: 2, maxHeight: 34, borderColor: "#D0D5DD", color: "#344054", boxShadow: "1px 1px #1018280D" }}>
                    View project
                </Button>
            </Box>
        </Box>
    )
}

export default ProjectCard;