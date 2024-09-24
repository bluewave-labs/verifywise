import { Card, CardContent, Typography, Box } from "@mui/material";
import Button from '@mui/material/Button';
import { FC } from "react";

interface ProjectCardProps {
    name: string,
    owner_name: string,
    last_update: string,
    controls_completed: string
}

const ProjectCard: FC<ProjectCardProps> = ({
    name,
    owner_name,
    last_update,
    controls_completed
}) => {
    return (
        <Card sx={{ minWidth: 261 }}>
            <CardContent>
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
                <Typography sx={{ color: '#8594AC', mb: 10, fontSize: 11 }}>
                    {controls_completed} controls completed
                </Typography>
                <Typography sx={{ color: '#8594AC', fontSize: 11  }}>
                    {controls_completed} requirements completed
                </Typography>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", mt: 15 }}>
                     <Typography sx={{ color: '#8594AC', fontSize: 12  }}>
                        EU AI Act
                    </Typography>
                    <Button variant="outlined" sx={{ textTransform: "none", borderRadius: 4, maxHeight: 34, borderColor: "#D0D5DD", color: "#344054" }}>
                        View project
                    </Button>
                </Box>
            </CardContent>
        </Card>
    )
}

export default ProjectCard;