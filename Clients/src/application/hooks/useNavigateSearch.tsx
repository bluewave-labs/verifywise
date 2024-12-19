/**
 * Custom hook for navigating with search parameters.
 * @returns A function that accepts a pathname and optional search parameters
 * @example
 * const navigateSearch = useNavigateSearch();
 * navigateSearch('/projects', { id: '123' }); // Navigates to /projects?id=123
 */

import { createSearchParams, URLSearchParamsInit, useNavigate } from "react-router-dom";

const useNavigateSearch = () => {
  const navigate = useNavigate();
  return (pathname: string, params: URLSearchParamsInit | undefined) =>
    navigate({ pathname, search: `?${createSearchParams(params)}` });
};

export default useNavigateSearch