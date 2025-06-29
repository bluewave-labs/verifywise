import { Button, Dialog, Stack, useTheme } from '@mui/material'
import { Suspense, lazy, useState } from 'react'
const LinkedRisksPopup = lazy(
  () => import("../../../LinkedRisks")
);

function LinkedRisksSection() {
  const theme = useTheme();
  const [isLinkedRisksModalOpen, setIsLinkedRisksModalOpen] = useState<boolean>(false);

  return (
    <>
      <Stack direction="row" spacing={2}>
        <Button
          variant="contained"
          sx={{
            mt: 2,
            borderRadius: 2,
            width: 155,
            height: 25,
            fontSize: 11,
            border: "1px solid #D0D5DD",
            backgroundColor: "white",
            color: "#344054",
          }}
          disableRipple={
            theme.components?.MuiButton?.defaultProps?.disableRipple
          }
          onClick={() => setIsLinkedRisksModalOpen(true)}
        >
          Add/Remove risks
        </Button>
      </Stack>

      <Dialog 
        open={isLinkedRisksModalOpen} 
        onClose={() => setIsLinkedRisksModalOpen(false)}
        PaperProps={{
          sx: {
            width: '1100px',
            maxWidth: '1100px',
            minHeight: '520px'
          },
        }}
      >
        <Suspense fallback={"loading..."}>
          <LinkedRisksPopup onClose={() => setIsLinkedRisksModalOpen(false)} />
        </Suspense>
      </Dialog>
    </>
  )
}

export default LinkedRisksSection