import React from 'react';
import HelperIcon from '../../HelperIcon';
import PageHeader from '../../Layout/PageHeader';

interface HeaderProps {

  onHelperClick?: () => void;
}

const ReportingHeader: React.FC<HeaderProps> = ({ onHelperClick }) => {
  return (
    <PageHeader
      title="Reporting"
      description="Want a report? We'll create one using the info from your Compliance, Assessment, and Vendor/Risk sections."
      rightContent={
        onHelperClick && (
          <HelperIcon onClick={onHelperClick} size="small" />
        )
      }
    />
  );
};

export default ReportingHeader