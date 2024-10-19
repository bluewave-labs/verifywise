import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";

interface DeleteAccountConfirmationProps {
  open: boolean;
  onClose: () => void;
}

const index: React.FC<DeleteAccountConfirmationProps> = ({ open, onClose }) => {
  const handleDelete = () => {
    console.log("Account deleted");
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">
        {"Are you absolutely sure?"}
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          This action cannot be undone. This will permanently delete your
          account and remove your data from our servers.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleDelete} color="error" autoFocus>
          Delete Account
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default index;
