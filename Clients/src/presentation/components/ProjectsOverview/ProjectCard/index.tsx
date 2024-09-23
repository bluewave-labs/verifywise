import { Card, CardContent, Typography, CardActions, Button } from "@mui/material";
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
        <Card sx={{ maxWidth: 261 }}>
            <CardContent>
                <Typography variant="h5" component="div">
                    {name}
                </Typography>
                <div>
                    <Typography sx={{ color: 'text.secondary', mb: 1.5 }}>Project owner</Typography>
                    <div>{owner_name}</div>
                </div>
                <div>
                    <Typography sx={{ color: 'text.secondary', mb: 1.5 }}>Last updated</Typography>
                    <div>{last_update}</div>
                </div>
                <Typography sx={{ color: 'text.secondary', mb: 1.5 }}>{controls_completed} controls completed</Typography>
                <Typography sx={{ color: 'text.secondary', mb: 1.5 }}>{controls_completed} requirements completed</Typography>
                <div>EU AI Act</div>
            </CardContent>
            <CardActions>
                <Button variant="outlined">View project</Button>
            </CardActions>
        </Card>
    )
}

export default ProjectCard;