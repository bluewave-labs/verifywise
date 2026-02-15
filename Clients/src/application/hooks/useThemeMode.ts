import { useContext } from "react";
import { ThemeContext } from "../contexts/Theme.context";

const useThemeMode = () => useContext(ThemeContext);

export default useThemeMode;
