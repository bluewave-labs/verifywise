/**
 * @fileoverview Add/Edit Repository Modal
 *
 * StandardModal for registering a new repository or editing an existing one.
 * Includes optional schedule configuration.
 *
 * @module pages/AIDetection/AddRepositoryModal
 */

import { useState, useEffect } from "react";
import { Stack, Typography, useTheme } from "@mui/material";
import StandardModal from "../../components/Modals/StandardModal";
import Field from "../../components/Inputs/Field";
import Select from "../../components/Inputs/Select";
import Toggle from "../../components/Inputs/Toggle";
import {
  AIDetectionRepository,
  CreateRepositoryInput,
  UpdateRepositoryInput,
  ScheduleFrequency,
} from "../../../domain/ai-detection/repositoryTypes";

interface AddRepositoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateRepositoryInput | UpdateRepositoryInput) => Promise<void>;
  editingRepository?: AIDetectionRepository | null;
  isSubmitting?: boolean;
  /** When true, auto-enable the schedule toggle on open */
  focusSchedule?: boolean;
}

const FREQUENCY_OPTIONS = [
  { _id: "daily", name: "Daily" },
  { _id: "weekly", name: "Weekly" },
  { _id: "monthly", name: "Monthly" },
];

const DAY_OF_WEEK_OPTIONS = [
  { _id: "0", name: "Sunday" },
  { _id: "1", name: "Monday" },
  { _id: "2", name: "Tuesday" },
  { _id: "3", name: "Wednesday" },
  { _id: "4", name: "Thursday" },
  { _id: "5", name: "Friday" },
  { _id: "6", name: "Saturday" },
];

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => ({
  _id: String(i),
  name: `${i.toString().padStart(2, "0")}:00`,
}));

const MINUTE_OPTIONS = [
  { _id: "0", name: ":00" },
  { _id: "15", name: ":15" },
  { _id: "30", name: ":30" },
  { _id: "45", name: ":45" },
];

const DAY_OF_MONTH_OPTIONS = Array.from({ length: 31 }, (_, i) => ({
  _id: String(i + 1),
  name: String(i + 1),
}));

export default function AddRepositoryModal({
  isOpen,
  onClose,
  onSubmit,
  editingRepository,
  isSubmitting = false,
  focusSchedule = false,
}: AddRepositoryModalProps) {
  const theme = useTheme();
  const isEditing = !!editingRepository;

  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [defaultBranch, setDefaultBranch] = useState("main");
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleFrequency, setScheduleFrequency] = useState<ScheduleFrequency>("daily");
  const [scheduleDayOfWeek, setScheduleDayOfWeek] = useState(1);
  const [scheduleDayOfMonth, setScheduleDayOfMonth] = useState(1);
  const [scheduleHour, setScheduleHour] = useState(2);
  const [scheduleMinute, setScheduleMinute] = useState(0);

  useEffect(() => {
    if (editingRepository) {
      setRepositoryUrl(editingRepository.repository_url);
      setDisplayName(editingRepository.display_name || "");
      setDefaultBranch(editingRepository.default_branch || "main");
      setScheduleEnabled(focusSchedule ? true : editingRepository.schedule_enabled);
      setScheduleFrequency((editingRepository.schedule_frequency as ScheduleFrequency) || "daily");
      setScheduleDayOfWeek(editingRepository.schedule_day_of_week ?? 1);
      setScheduleDayOfMonth(editingRepository.schedule_day_of_month ?? 1);
      setScheduleHour(editingRepository.schedule_hour ?? 2);
      setScheduleMinute(editingRepository.schedule_minute ?? 0);
    } else {
      setRepositoryUrl("");
      setDisplayName("");
      setDefaultBranch("main");
      setScheduleEnabled(false);
      setScheduleFrequency("daily");
      setScheduleDayOfWeek(1);
      setScheduleDayOfMonth(1);
      setScheduleHour(2);
      setScheduleMinute(0);
    }
  }, [editingRepository, isOpen, focusSchedule]);

  const handleSubmit = async () => {
    if (isEditing) {
      const updateData: UpdateRepositoryInput = {
        display_name: displayName || null,
        default_branch: defaultBranch,
        schedule_enabled: scheduleEnabled,
        schedule_frequency: scheduleEnabled ? scheduleFrequency : null,
        schedule_day_of_week: scheduleEnabled && scheduleFrequency === "weekly" ? scheduleDayOfWeek : null,
        schedule_day_of_month: scheduleEnabled && scheduleFrequency === "monthly" ? scheduleDayOfMonth : null,
        schedule_hour: scheduleHour,
        schedule_minute: scheduleMinute,
      };
      await onSubmit(updateData);
    } else {
      const createData: CreateRepositoryInput = {
        repository_url: repositoryUrl,
        display_name: displayName || null,
        default_branch: defaultBranch,
        schedule_enabled: scheduleEnabled,
        schedule_frequency: scheduleEnabled ? scheduleFrequency : null,
        schedule_day_of_week: scheduleEnabled && scheduleFrequency === "weekly" ? scheduleDayOfWeek : null,
        schedule_day_of_month: scheduleEnabled && scheduleFrequency === "monthly" ? scheduleDayOfMonth : null,
        schedule_hour: scheduleHour,
        schedule_minute: scheduleMinute,
      };
      await onSubmit(createData);
    }
  };

  return (
    <StandardModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit repository" : "Add repository"}
      description={
        isEditing
          ? "Update repository settings and scan schedule."
          : "Register a GitHub repository for monitoring and optional scheduled scans."
      }
      onSubmit={handleSubmit}
      submitButtonText={isEditing ? "Save changes" : "Add repository"}
      isSubmitting={isSubmitting}
    >
      <Stack spacing={6}>
        {/* Repository section */}
        <Stack spacing={4}>
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 600, color: theme.palette.text.primary }}
          >
            Repository
          </Typography>

          <Field
            label="GitHub URL"
            placeholder="https://github.com/owner/repo"
            value={repositoryUrl}
            onChange={(e) => setRepositoryUrl(e.target.value)}
            disabled={isEditing}
            required
          />

          <Stack direction="row" spacing={4}>
            <Field
              label="Display name"
              placeholder="Optional friendly name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              sx={{ flex: 1 }}
            />
            <Field
              label="Default branch"
              placeholder="main"
              value={defaultBranch}
              onChange={(e) => setDefaultBranch(e.target.value)}
              sx={{ width: 160 }}
            />
          </Stack>
        </Stack>

        {/* Schedule section */}
        <Stack spacing={4}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 600, color: theme.palette.text.primary }}
            >
              Scheduled scans
            </Typography>
            <Toggle
              checked={scheduleEnabled}
              onChange={() => setScheduleEnabled(!scheduleEnabled)}
              size="small"
            />
          </Stack>

          {scheduleEnabled && (
            <Stack spacing={4}>
              <Select
                id="schedule-frequency"
                label="Frequency"
                value={scheduleFrequency}
                onChange={(e) =>
                  setScheduleFrequency(e.target.value as ScheduleFrequency)
                }
                items={FREQUENCY_OPTIONS}
                sx={{ maxWidth: 220 }}
              />

              {scheduleFrequency === "weekly" && (
                <Select
                  id="schedule-day-of-week"
                  label="Day of week"
                  value={String(scheduleDayOfWeek)}
                  onChange={(e) => setScheduleDayOfWeek(Number(e.target.value))}
                  items={DAY_OF_WEEK_OPTIONS}
                  sx={{ maxWidth: 220 }}
                />
              )}

              {scheduleFrequency === "monthly" && (
                <Select
                  id="schedule-day-of-month"
                  label="Day of month"
                  value={String(scheduleDayOfMonth)}
                  onChange={(e) => setScheduleDayOfMonth(Number(e.target.value))}
                  items={DAY_OF_MONTH_OPTIONS}
                  sx={{ maxWidth: 220 }}
                />
              )}

              <Stack direction="row" spacing={4}>
                <Select
                  id="schedule-hour"
                  label="Hour (UTC)"
                  value={String(scheduleHour)}
                  onChange={(e) => setScheduleHour(Number(e.target.value))}
                  items={HOUR_OPTIONS}
                  sx={{ width: 140 }}
                />
                <Select
                  id="schedule-minute"
                  label="Minute"
                  value={String(scheduleMinute)}
                  onChange={(e) => setScheduleMinute(Number(e.target.value))}
                  items={MINUTE_OPTIONS}
                  sx={{ width: 120 }}
                />
              </Stack>
            </Stack>
          )}
        </Stack>
      </Stack>
    </StandardModal>
  );
}
