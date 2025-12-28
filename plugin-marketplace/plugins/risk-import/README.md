# Risk Import Plugin

Import risks from CSV files for bulk risk creation in VerifyWise.

## Features

- 📥 **CSV Template Download**: Download a pre-formatted CSV template with all risk fields
- 📝 **Enum Values Guide**: Get all valid values for dropdown fields (lifecycle phases, likelihood, severity, etc.)
- 📤 **Bulk Import**: Upload CSV file to create multiple risks at once
- ✅ **Validation**: Comprehensive validation of all fields before import
- 📊 **Import Results**: Detailed feedback on successful and failed imports

## Installation

1. Navigate to the Plugins page in VerifyWise
2. Find "Risk Import" in the marketplace
3. Click "Install"

## Usage

### Step 1: Download CSV Template

1. Go to Risk Management
2. Find the "Risk Import" section
3. Click "Download CSV Template"
4. A CSV file will be downloaded with:
   - All risk field headers
   - Sample data row
   - Valid enum values in a separate sheet (if Excel)

### Step 2: Fill in Risk Data

Open the downloaded CSV template and fill in your risk data:

#### Required Fields:
- **risk_name**: Name of the risk
- **risk_owner**: User ID of the risk owner
- **risk_description**: Description of the risk

#### Optional Fields:
- **ai_lifecycle_phase**: Phase in AI lifecycle (see enum values)
- **risk_category**: Comma-separated categories (e.g., "Data Quality,Model Performance")
- **impact**: Impact description
- **assessment_mapping**: Assessment ID reference
- **controls_mapping**: Control ID reference
- **likelihood**: Likelihood level (see enum values)
- **severity**: Severity level (see enum values)
- **risk_level_autocalculated**: Auto-calculated risk level
- **review_notes**: Review notes
- **mitigation_status**: Status of mitigation (see enum values)
- **current_risk_level**: Current risk level
- **deadline**: Deadline date (YYYY-MM-DD format)
- **mitigation_plan**: Mitigation plan description
- **implementation_strategy**: Implementation strategy
- **mitigation_evidence_document**: Evidence document reference
- **likelihood_mitigation**: Likelihood after mitigation
- **risk_severity**: Risk severity level
- **final_risk_level**: Final risk level
- **risk_approval**: Approver user ID
- **approval_status**: Approval status
- **date_of_assessment**: Assessment date (YYYY-MM-DD format)

#### Enum Values Reference:

**AI Lifecycle Phase:**
- Problem definition & planning
- Data collection & processing
- Model development & training
- Model validation & testing
- Deployment & integration
- Monitoring & maintenance
- Decommissioning & retirement

**Likelihood / Likelihood Mitigation:**
- Rare
- Unlikely
- Possible
- Likely
- Almost Certain

**Severity:**
- Negligible
- Minor
- Moderate
- Major
- Catastrophic

**Risk Severity:**
- Negligible
- Minor
- Moderate
- Major
- Critical

**Risk Level (Auto-calculated):**
- No risk
- Very low risk
- Low risk
- Medium risk
- High risk
- Very high risk

**Current Risk Level:**
- Very Low risk
- Low risk
- Medium risk
- High risk
- Very high risk

**Mitigation Status:**
- Not Started
- In Progress
- Completed
- On Hold
- Deferred
- Canceled
- Requires review

### Step 3: Upload CSV

1. Save your filled CSV file
2. Return to Risk Management > Risk Import section
3. Click "Upload CSV" or drag and drop your file
4. Review the import preview
5. Click "Import Risks"

### Step 4: Review Results

After import, you'll see:
- Number of successfully imported risks
- Number of failed imports
- Detailed error messages for any failures
- Option to download error report

## Validation Rules

The plugin validates:
- Required fields are present
- User IDs exist
- Enum values match allowed values
- Dates are in correct format (YYYY-MM-DD)
- Risk categories are properly formatted

## Error Handling

If validation fails:
- No risks will be imported (all-or-nothing approach)
- You'll receive detailed error messages showing:
  - Row number
  - Field name
  - Error description
- Fix the errors in your CSV and re-upload

## Tips

1. **Start Small**: Test with a few risks first to ensure your format is correct
2. **Use Sample Data**: The template includes a sample row - use it as a guide
3. **Check User IDs**: Ensure risk_owner and risk_approval IDs exist in your system
4. **Date Format**: Always use YYYY-MM-DD format for dates
5. **Categories**: Separate multiple categories with commas (no spaces after commas)

## Troubleshooting

**Problem**: Import fails with "Invalid user ID"
- **Solution**: Verify that the user IDs in risk_owner and risk_approval columns exist in your system

**Problem**: "Invalid enum value" error
- **Solution**: Check that dropdown values exactly match the allowed values (case-sensitive)

**Problem**: Date format errors
- **Solution**: Ensure all dates use YYYY-MM-DD format (e.g., 2025-12-31)

## Support

For issues or questions, contact VerifyWise support or visit our documentation.
