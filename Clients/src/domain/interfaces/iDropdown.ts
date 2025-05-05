export interface ProjectFilterDropdownProps {
  projects: { id: string; name: string }[];
  selectedProject: string | null;
  onChange: (projectId: string | null) => void;
}
