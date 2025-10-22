import React from "react";
import HelperIcon from "../../HelperIcon";
import PageHeader from "../../Layout/PageHeader";
import { IHeaderProps } from "../../../../domain/interfaces/iWidget";

const ReportingHeader: React.FC<IHeaderProps> = ({ onHelperClick }) => {
  return (
    <PageHeader
      title="Reporting"
      description="Want a report? We'll create one using the info from your Compliance, Assessment, and Vendor/Risk sections."
      rightContent={
        onHelperClick && <HelperIcon onClick={onHelperClick} size="small" />
      }
    />
  );
};

export default ReportingHeader;
