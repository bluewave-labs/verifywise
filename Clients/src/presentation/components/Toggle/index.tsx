import React from "react";
import { Box, useTheme } from "@mui/material";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

const Toggle: React.FC<ToggleProps> = ({ checked, onChange, disabled = false }) => {
  const theme = useTheme();

  const handleClick = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const ToggleOffIcon = () => (
    <svg width="36" height="20" viewBox="0 0 36 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0_1_18061)">
        <path 
          d="M0 10C0 4.47715 4.47715 0 10 0H26C31.5228 0 36 4.47715 36 10C36 15.5228 31.5228 20 26 20H10C4.47715 20 0 15.5228 0 10Z" 
          fill={theme.palette.border?.dark || "#F2F4F7"}
        />
        <g filter="url(#filter0_dd_1_18061)">
          <path 
            d="M2 10C2 5.58172 5.58172 2 10 2C14.4183 2 18 5.58172 18 10C18 14.4183 14.4183 18 10 18C5.58172 18 2 14.4183 2 10Z" 
            fill="white"
          />
        </g>
      </g>
      <defs>
        <filter id="filter0_dd_1_18061" x="-1" y="0" width="22" height="22" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix"/>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <feOffset dy="1"/>
          <feGaussianBlur stdDeviation="1"/>
          <feComposite in2="hardAlpha" operator="out"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0.0627451 0 0 0 0 0.0941176 0 0 0 0 0.156863 0 0 0 0.06 0"/>
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1_18061"/>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <feOffset dy="1"/>
          <feGaussianBlur stdDeviation="1.5"/>
          <feComposite in2="hardAlpha" operator="out"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0.0627451 0 0 0 0 0.0941176 0 0 0 0 0.156863 0 0 0 0.1 0"/>
          <feBlend mode="normal" in2="effect1_dropShadow_1_18061" result="effect2_dropShadow_1_18061"/>
          <feBlend mode="normal" in="SourceGraphic" in2="effect2_dropShadow_1_18061" result="shape"/>
        </filter>
        <clipPath id="clip0_1_18061">
          <path d="M0 10C0 4.47715 4.47715 0 10 0H26C31.5228 0 36 4.47715 36 10C36 15.5228 31.5228 20 26 20H10C4.47715 20 0 15.5228 0 10Z" fill="white"/>
        </clipPath>
      </defs>
    </svg>
  );

  const ToggleOnIcon = () => (
    <svg width="36" height="20" viewBox="0 0 36 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0_1_18062)">
        <path 
          d="M0 10C0 4.47715 4.47715 0 10 0H26C31.5228 0 36 4.47715 36 10C36 15.5228 31.5228 20 26 20H10C4.47715 20 0 15.5228 0 10Z" 
          fill={theme.palette.primary?.main || "#13715B"}
        />
        <g filter="url(#filter0_dd_1_18062)">
          <path 
            d="M18 10C18 5.58172 21.5817 2 26 2C30.4183 2 34 5.58172 34 10C34 14.4183 30.4183 18 26 18C21.5817 18 18 14.4183 18 10Z" 
            fill="white"
          />
        </g>
      </g>
      <defs>
        <filter id="filter0_dd_1_18062" x="15" y="0" width="22" height="22" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix"/>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <feOffset dy="1"/>
          <feGaussianBlur stdDeviation="1"/>
          <feComposite in2="hardAlpha" operator="out"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0.0627451 0 0 0 0 0.0941176 0 0 0 0 0.156863 0 0 0 0.06 0"/>
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1_18062"/>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <feOffset dy="1"/>
          <feGaussianBlur stdDeviation="1.5"/>
          <feComposite in2="hardAlpha" operator="out"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0.0627451 0 0 0 0 0.0941176 0 0 0 0 0.156863 0 0 0 0.1 0"/>
          <feBlend mode="normal" in2="effect2_dropShadow_1_18062" result="effect2_dropShadow_1_18062"/>
          <feBlend mode="normal" in="SourceGraphic" in2="effect2_dropShadow_1_18062" result="shape"/>
        </filter>
        <clipPath id="clip0_1_18062">
          <path d="M0 10C0 4.47715 4.47715 0 10 0H26C31.5228 0 36 4.47715 36 10C36 15.5228 31.5228 20 26 20H10C4.47715 20 0 15.5228 0 10Z" fill="white"/>
        </clipPath>
      </defs>
    </svg>
  );

  return (
    <Box
      onClick={handleClick}
      sx={{
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        display: "inline-flex",
        alignItems: "center",
        transition: "opacity 0.2s ease",
        zIndex: 10,
        position: "relative",
        "&:hover": {
          opacity: disabled ? 0.6 : 0.8,
        },
      }}
    >
      {checked ? <ToggleOnIcon /> : <ToggleOffIcon />}
    </Box>
  );
};

export default Toggle;