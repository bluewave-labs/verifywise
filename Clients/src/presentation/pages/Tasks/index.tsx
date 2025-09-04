import React, { useState, useEffect } from "react";
import { 
  Box, Stack, Typography
  
  } from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import CustomizableButton from "../../vw-v2-components/Buttons";
import { ITask } from "../../../domain/interfaces/i.task";
import { getAllTasks } from "../../../application/repository/task.repository";
import HeaderCard from "../../components/Cards/DashboardHeaderCard";
import { vwhomeHeading, vwhomeHeaderCards, vwhomeBody, vwhomeBodyControls } from "../Home/1.0Home/style";

const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<ITask[]>([]);


  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await getAllTasks({});
        setTasks(response.data?.tasks || []);
        console.log("Fetched tasks:", tasks);
      } catch (err: any) {
        console.error("Error fetching tasks:", err);}
    };
    fetchTasks();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Stack sx={vwhomeBody}>
        <Typography sx={vwhomeHeading}>Tasks</Typography>
        <Stack sx={vwhomeBodyControls}>
          <CustomizableButton
            variant="contained"
            icon={<AddCircleOutlineIcon />}
            text="Create task"
            onClick={() => console.log('Create task clicked')}
          />
        </Stack>
      </Stack>

      <Stack sx={vwhomeHeaderCards}>
        <HeaderCard title="Tasks" count={1} />
        <HeaderCard title="Overdue" count={1} />
        <HeaderCard title="In Progress" count={1} />
        <HeaderCard title="Completed" count={1} />
      </Stack>
      </Box>
  );
};

export default Tasks;