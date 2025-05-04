/**
 * Styles for the IconButton component.
 *
 * @param {boolean} hasIcon - Whether the alert has an icon.
 * @returns {object} The styles for the IconButton component.
 */
export const iconButtonStyles = (hasIcon: boolean): object => ({
  alignSelf: "flex-start",
  ml: "auto",
  mr: "-5px",
  mt: hasIcon ? "-5px" : 0,
  "&:focus": {
    outline: "none",
  },
  "&:hover": {
    backgroundColor: "transparent",
  },
});

/**
 * Styles for the CloseIcon component.
 *
 * @param {string} text - The color of the close icon.
 * @returns {object} The styles for the CloseIcon component.
 */
export const closeIconStyles = (text: string): object => ({
  fontSize: 20,
  fill: text,
});
