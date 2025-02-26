import { SelectChangeEvent, Stack, Typography, useTheme } from "@mui/material";
import { ClearIcon } from "@mui/x-date-pickers/icons";
import Field from "../../../components/Inputs/Field";
import { textfieldStyle } from "./style";
import { useCallback, useMemo, useState } from "react";
import Select from "../../../components/Inputs/Select";
import useUsers from "../../../../application/hooks/useUsers";
import DatePicker from "../../../components/Inputs/Datepicker";
import dayjs, { Dayjs } from "dayjs";
import VWButton from "../../Buttons";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";

enum RiskClassificationEnum {
  HighRisk = "High risk",
  LimitedRisk = "Limited risk",
  MinimalRisk = "Minimal risk",
}

enum HighRiskRoleEnum {
  Deployer = "Deployer",
  Provider = "Provider",
  Distributor = "Distributor",
  Importer = "Importer",
  ProductManufacturer = "Product manufacturer",
  AuthorizedRepresentative = "Authorized representative",
}

const VWProjectForm = () => {
  const theme = useTheme();
  const [values, setValues] = useState<any>({});
  const [errors, setErrors] = useState<any>({});
  const { users } = useUsers();

  const handleOnTextFieldChange = useCallback(
    (prop: keyof any) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setValues({ ...values, [prop]: event.target.value });
      setErrors({ ...errors, [prop]: "" });
    },
    [values, errors]
  );

  const handleOnSelectChange = useCallback(
    (prop: keyof any) => (event: SelectChangeEvent<string | number>) => {
      setValues({ ...values, [prop]: event.target.value });
      setErrors({ ...errors, [prop]: "" });
    },
    [values, errors]
  );

  const handleDateChange = useCallback((newDate: Dayjs | null) => {
    if (newDate?.isValid()) {
      setValues((prevValues: any) => ({
        ...prevValues,
        start_date: newDate ? newDate.toISOString() : "",
      }));
    }
  }, []);

  const riskClassificationItems = useMemo(
    () => [
      { _id: 1, name: RiskClassificationEnum.HighRisk },
      { _id: 2, name: RiskClassificationEnum.LimitedRisk },
      { _id: 3, name: RiskClassificationEnum.MinimalRisk },
    ],
    []
  );

  const highRiskRoleItems = useMemo(
    () => [
      { _id: 1, name: HighRiskRoleEnum.Deployer },
      { _id: 2, name: HighRiskRoleEnum.Provider },
      { _id: 3, name: HighRiskRoleEnum.Distributor },
      { _id: 4, name: HighRiskRoleEnum.Importer },
      { _id: 5, name: HighRiskRoleEnum.ProductManufacturer },
      { _id: 6, name: HighRiskRoleEnum.AuthorizedRepresentative },
    ],
    []
  );

  const renderSelect = (
    id: string,
    label: string,
    value: any,
    onChange: any,
    items: any[],
    error: any,
    isRequired: boolean = true
  ) => (
    <Select
      id={id}
      label={label}
      placeholder={`Select ${label.toLowerCase()}`}
      value={value || ""}
      onChange={onChange}
      items={items}
      sx={{
        width: "350px",
        backgroundColor: theme.palette.background.main,
      }}
      error={error}
      isRequired={isRequired}
    />
  );

  return (
    <Stack
      sx={{
        width: "fit-content",
        backgroundColor: "#FCFCFD",
        padding: 10,
        borderRadius: "4px",
        gap: 10,
      }}
    >
      <Stack
        className="vwproject-form-header"
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <Stack className="vwproject-form-header-text">
          <Typography
            sx={{ fontSize: 16, color: "#344054", fontWeight: "bold" }}
          >
            Create new project
          </Typography>
          <Typography sx={{ fontSize: 13, color: "#344054" }}>
            Create a new project from scratch by filling in the following.
          </Typography>
        </Stack>
        <ClearIcon sx={{ color: "#98A2B3" }} />
      </Stack>
      <Stack
        className="vwproject-form-body"
        sx={{ display: "flex", flexDirection: "row", gap: 8 }}
      >
        <Stack className="vwproject-form-body-start" sx={{ gap: 8 }}>
          <Field
            id="project-title-input"
            label="Project title"
            value={values.project_title}
            onChange={handleOnTextFieldChange("project_title")}
            error={errors.projectTitle}
            width="350px"
            sx={textfieldStyle}
            isRequired
          />
          {renderSelect(
            "owner-input",
            "Owner",
            values.owner,
            handleOnSelectChange("owner"),
            users?.map((user) => ({
              _id: user.id,
              name: `${user.name} ${user.surname}`,
              email: user.email,
            })) || [],
            errors.owner
          )}
          {renderSelect(
            "risk-classification-input",
            "AI risk classification",
            values.ai_risk_classification,
            handleOnSelectChange("ai_risk_classification"),
            riskClassificationItems,
            errors.riskClassification
          )}
          {renderSelect(
            "type-of-high-risk-role-input",
            "Type of high risk role",
            values.type_of_high_risk_role,
            handleOnSelectChange("type_of_high_risk_role"),
            highRiskRoleItems,
            errors.typeOfHighRiskRole
          )}
        </Stack>
        <Stack className="vwproject-form-body-end" sx={{ gap: 8 }}>
          {renderSelect(
            "users-input",
            "Users",
            values.users,
            handleOnSelectChange("users"),
            users?.map((user) => ({
              _id: user.id,
              name: `${user.name} ${user.surname}`,
              email: user.email,
            })) || [],
            errors.users
          )}
          <DatePicker
            label="Start date"
            date={
              values.start_date ? dayjs(values.start_date) : dayjs(new Date())
            }
            handleDateChange={handleDateChange}
            sx={{
              width: "130px",
              "& input": { width: "85px" },
            }}
            isRequired
            error={errors.startDate}
          />
          <Field
            id="goal-input"
            label="Goal"
            type="description"
            value={values.goal}
            onChange={handleOnTextFieldChange("goal")}
            sx={{
              backgroundColor: "white",
            }}
            isRequired
            error={errors.goal}
          />
        </Stack>
      </Stack>
      <Stack
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "flex-end",
        }}
      >
        <VWButton
          text="Create project"
          sx={{
            backgroundColor: "#13715B",
            border: "1px solid #13715B",
            gap: 2,
          }}
          icon={<AddCircleOutlineIcon />}
        />
      </Stack>
    </Stack>
  );
};

export default VWProjectForm;
