import { Stack, Typography } from "@mui/material";

const HeaderCard = ({ title, count }: { title: string; count: number }) => {
  return (
    <Stack sx={{
      border: `1px solid #eaecf0`,
      borderRadius: 2,
      backgroundColor: "#FFFFFF",
      minWidth: 228,
      width: "100%",
      padding: "8px 36px 14px 14px",
    }}>
      <Typography sx={{
        fontSize: 13,
        color: "#8594AC",
        pb: "2px",
        textWrap: "wrap",
      }}>
        {title}
      </Typography>
      
      <Typography sx={{
        fontSize: 13,
        color: "#2D3748",
        textAlign: "justify",
      }}>
        {count}
      </Typography>
    </Stack>
  );
};

export default HeaderCard;
