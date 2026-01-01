import React from "react";
import HelperIcon from "../../HelperIcon";
import PageHeader from "../../Layout/PageHeader";

interface ReportingHeaderProps {
  articlePath?: string;
}

const ReportingHeader: React.FC<ReportingHeaderProps> = ({ articlePath }) => {
  return (
    <PageHeader
      title="Reporting"
      description="Want a report? We'll create one using the info from your Compliance, Assessment, and Vendor/Risk sections."
      rightContent={
        articlePath && <HelperIcon articlePath={articlePath} size="small" />
      }
    />
  );
};

export default ReportingHeader;
