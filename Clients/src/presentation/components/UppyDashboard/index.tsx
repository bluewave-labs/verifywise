import Uppy from "@uppy/core";
import { Dashboard } from "@uppy/react";
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";
import styled from "styled-components";

const StyledDashboard = styled.div`
  .uppy-Dashboard-AddFiles-title {
    margin-bottom: 50%;
    margin-top: 50%;   
  }
`;

interface UppyDashboardProps {
  uppy: Uppy;
  width?: number;
  height?: number;
  hideProgressIndicators?: boolean;
}

const UppyDashboard = ({ uppy, hideProgressIndicators, ...restProps }: UppyDashboardProps) => {
  return (
    <StyledDashboard>
      <Dashboard 
        uppy={uppy} 
        {...restProps}
        disableStatusBar={hideProgressIndicators}
      />
    </StyledDashboard>
  );
};

export default UppyDashboard;