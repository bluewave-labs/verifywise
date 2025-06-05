import React, { useState, useCallback} from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
} from "@mui/material";
import { useTheme } from "@mui/material";
import Field from "../../Inputs/Field";
import StatusOfProjectDropDown from "../../Inputs/Dropdowns/StatusOfProject/StatusOfProjectDropDown";
import VWButton from "../../../vw-v2-components/Buttons";
interface NewTrainingProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSuccess?: () => void;
}

const NewTraining: React.FC<NewTrainingProps> = ({ isOpen, setIsOpen, onSuccess }) => {
  const theme = useTheme();
  const [training_name, setTrainingName] = useState("");
  const [duration, setDuration] = useState("");
  const [provider, setProvider] = useState("");
  const [department, setDepartment] = useState("");
  //const [status, setStatus] = useState("Planned"); // Default status
  const [currentProjectStatus, setCurrentProjectStatus] = useState<string | null>(null);
  const [numberOfPeople, setNumberOfPeople] = useState("");
  const [description, setDescription] = useState("");

  const handleClose = () => {
    setIsOpen(false);
    // Optionally reset form fields on cancel
    setTrainingName("");
    setDuration("");
    setProvider("");
    setDepartment("");
    setCurrentProjectStatus("Planned");
    setNumberOfPeople("");
    setDescription("");
  };

  const handleStatusChange = useCallback((newStatus: string) => {
    setCurrentProjectStatus(newStatus);
    console.log("Status selected in parent:", newStatus);
    // You can now use newStatus for form submission or other logic
  }, []);
  const handleSubmit = () => {
    // Add logic to handle new training submission here
    const newTrainingData = {
      training_name,
      duration,
      provider,
      department,
      status,
      numberOfPeople: Number(numberOfPeople), // Convert to number
      description,
    };
    console.log("New Training Submitted:", newTrainingData);
    if (onSuccess) {
      onSuccess();
    }
    handleClose();
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ borderBottom: "1px solid #E0E0E0", paddingBottom: theme.spacing(2) }}>
        New Training
      </DialogTitle>
      <DialogContent sx={{ paddingTop: theme.spacing(3), paddingBottom: theme.spacing(3) }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Field 
            type="text"
            id="training-name"
            label="Training Name"
            placeholder="Training Name"
            value={training_name}
            onChange={(e) => setTrainingName(e.target.value)}/>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Field 
            type="text"
            id="duration"
            label="Duration"
            placeholder="Duration in weeks"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}/>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Field 
            type="text"
            id="provider"
            label="Provider"
            placeholder="Provider"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}/>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Field 
            type="text"
            id="department"
            label="Department"
            placeholder="Department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}/>
          </Grid>
          <Grid item xs={12} sm={6}>
            <StatusOfProjectDropDown
            
              selectedStatus={currentProjectStatus ?? "Planned"}
              onChange={handleStatusChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Field
              label="Number of People"
              variant="outlined"
              fullWidth
              type="number"
              value={numberOfPeople}
              onChange={(e) => setNumberOfPeople(e.target.value)}
              sx={{ '& fieldset': { borderRadius: '8px' } }}
            />
          </Grid>
          <Grid item xs={12}>
            <Field
            type="textField"
              label="Description"
              variant="outlined"
              fullWidth
              multiline
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              sx={{ '& fieldset': { borderRadius: '8px' } }}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ borderTop: "1px solid #E0E0E0", paddingTop: theme.spacing(2), justifyContent: "flex-end", paddingRight: theme.spacing(3), paddingBottom: theme.spacing(3) }}>
        <Button
          onClick={handleClose}
          sx={{
            backgroundColor: "#13715B",
            border: "1px solid #13715B",
            gap: 2,
          }}
        >
          Cancel
        </Button>
        <VWButton
          onClick={handleSubmit}
          variant="contained"
          sx={{
            backgroundColor: "#13715B",
            border: "1px solid #13715B",
            gap: 2,
          }}
        >
          Create Training
        </VWButton>
      </DialogActions>
    </Dialog>
  );
};

export default NewTraining;
