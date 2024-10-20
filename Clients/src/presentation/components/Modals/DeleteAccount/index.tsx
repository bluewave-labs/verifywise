import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  useTheme,
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

  const theme = useTheme();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title" sx={{font: 'bold'}}>
        {"Are you sure you want to delete this account?"}
      </DialogTitle>
      <DialogContent>
        <DialogContentText
          id="alert-dialog-description"
          sx={{ maxWidth: '439px'}}
        >
          If you delete your account, you will no longer be able to sign in, and
          all of your data will be deleted. Deleting your account is permanent
          and non-recoverable action.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{color: 'black', fontSize: 13}}>Cancel</Button>
        <Button
          disableRipple
          variant="contained"
          sx={{
            width: theme.spacing(80),
            mb: theme.spacing(4),
            backgroundColor: "#DB504A",
            color: "#fff",
          }}
        >
          Delete account
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default index;
