import { useTheme } from "@mui/material";
import "../index.css";
import BaseLabel from "../BaseLabel";

/**
 * Lightens a given hex color by a specified percentage.
 *
 * @param color - The hex color code to lighten.
 * @param percent - The percentage to lighten the color.
 * @returns The lightened hex color code.
 */
const lightenColor = (color: any, percent: any) => {
  let r = parseInt(color.substring(1, 3), 16);
  let g = parseInt(color.substring(3, 5), 16);
  let b = parseInt(color.substring(5, 7), 16);

  const amt = Math.round((255 * percent) / 100);

  r = r + amt <= 255 ? r + amt : 255;
  g = g + amt <= 255 ? g + amt : 255;
  b = b + amt <= 255 ? b + amt : 255;

  const rStr = r.toString(16).padStart(2, "0");
  const gStr = g.toString(16).padStart(2, "0");
  const bStr = b.toString(16).padStart(2, "0");

  return `#${rStr}${gStr}${bStr}`;
};

interface ColoredLabelProps {
  label: string;
  color: string;
}

/**
 * ColoredLabel component renders a label with a specified color.
 * If the provided color is invalid, it defaults to the theme's border color.
 *
 * @param {ColoredLabelProps} props - The properties for the ColoredLabel component.
 * @param {string} props.label - The text to be displayed inside the label.
 * @param {string} props.color - The color of the label. It should be a valid hex color code.
 *
 * @returns {JSX.Element} The rendered ColoredLabel component.
 */
const ColoredLabel = ({ label, color }: ColoredLabelProps): JSX.Element => {
  const theme = useTheme();

  if (
    typeof color !== "string" ||
    !/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color)
  ) {
    color = theme.palette.border;
  }

  const borderColor = lightenColor(color, 20);
  const bgColor = lightenColor(color, 75);

  return (
    <BaseLabel
      label={label}
      styles={{
        color: color,
        borderColor: borderColor,
        backgroundColor: bgColor,
      }}
    ></BaseLabel>
  );
};

export default ColoredLabel;
