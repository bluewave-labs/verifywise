import { Dashboard } from "@uppy/react";
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";
import styled from "styled-components";
import { IUppyDashboardProps } from "../../../domain/interfaces/i.uppy";

const StyledDashboard = styled.div`
  .uppy-Dashboard-AddFiles-title {
    margin-bottom: 50%;
    margin-top: 50%;
  }
`;

const UppyDashboard = ({
  uppy,
  hideProgressIndicators,
  files = [],
  ...restProps
}: IUppyDashboardProps) => {
  // Add files to Uppy if they're not already added
  files.forEach((file) => {
    if (file.data instanceof Blob && !uppy.getFile(file.id)) {
      uppy.addFile({
        name: file.fileName,
        type: file.type,
        data: file.data,
        source: "Local",
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
