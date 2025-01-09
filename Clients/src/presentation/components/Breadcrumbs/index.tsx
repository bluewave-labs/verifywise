import "./index.css";
import { Box, Breadcrumbs as MUIBreadcrumbs, useTheme } from "@mui/material";
import { ReactComponent as ArrowRight } from "../../assets/icons/right-arrow.svg";
import { useNavigate } from "react-router-dom";

/**
 * Breadcrumbs component renders a breadcrumb navigation using Material-UI components.
 *
 * @param {Object} props - The properties object.
 * @param {any[]} props.list - An array of breadcrumb items, each item should have a `name` and `path` property.
 *
 * @returns {JSX.Element} The rendered breadcrumb navigation component.
 *
 * @example
 * const breadcrumbList = [
 *   { name: 'Home', path: '/' },
 *   { name: 'About', path: '/about' },
 *   { name: 'Contact', path: '/contact' }
 * ];
 *
 * <Breadcrumbs list={breadcrumbList} />
 */
const Breadcrumbs = ({ list }: { list: any[] }) => {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <MUIBreadcrumbs
      separator={<ArrowRight />}
      sx={{
        "& .MuiBreadcrumbs-li:not(:last-of-type):hover a": {
          backgroundColor: theme.palette.other.fill,
          opacity: 1,
        },
        py: theme.spacing(2),
        px: theme.spacing(3.5),
        width: "fit-content",
        backgroundColor: theme.palette.background.fill,
        borderRadius: theme.shape.borderRadius,
        lineHeight: "18px",
      }}
    >
      {list.map((item: any, index: number) => {
        return (
          <Box
            component="a"
            key={`${item.name}-${index}`}
            px={theme.spacing(4)}
            pt={theme.spacing(2)}
            pb={theme.spacing(3)}
            borderRadius={theme.shape.borderRadius}
            onClick={() => navigate(item.path)}
            sx={{
              opacity: 0.8,
              textTransform: "capitalize",
              "&, &:hover": {
                color: theme.palette.text.tertiary,
              },
            }}
          >
            {item.name}
          </Box>
        );
      })}
    </MUIBreadcrumbs>
  );
};

export default Breadcrumbs;
