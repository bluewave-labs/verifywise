import Uppy from "@uppy/core";
import { Dashboard } from "@uppy/react";
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";
import styled from "styled-components";
import { FileData } from "../../../domain/File";

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
  files?: FileData[];
}

const UppyDashboard = ({ uppy, hideProgressIndicators, files = [], ...restProps }: UppyDashboardProps) => {
  // Add files to Uppy if they're not already added
  files.forEach(file => {
    if (file.data instanceof Blob && !uppy.getFile(file.id)) {
      uppy.addFile({
        name: file.fileName,
        type: file.type,
        data: file.data,
        source: 'Local',
        isRemote: false,
      });
    }
  });

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