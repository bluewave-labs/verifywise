import { ControlCategory } from "../models/controlCategory.model";

export const ControlCategories = (projectId1: number, projectId2: number): ControlCategory[] => {
  return [
    { id: 1, project_id: projectId1, title: "AI literacy", order_no: 1 },
    {
      id: 2,
      project_id: projectId1,
      title: "Transparency and provision of information to deployers",
      order_no: 2
    },
    {
      id: 3, project_id: projectId1, title: "Human oversight",
      order_no: 3
    },
    {
      id: 4,
      project_id: projectId1,
      title: "Corrective actions and duty of information",
      order_no: 4
    },
    {
      id: 5,
      project_id: projectId1,
      title: "Responsibilities along the AI value chain",
      order_no: 5
    },
    {
      id: 6,
      project_id: projectId1,
      title: "Obligations of deployers of high-risk AI systems",
      order_no: 6
    },
    {
      id: 7,
      project_id: projectId1,
      title: "Fundamental rights impact assessments for high-risk AI systems",
      order_no: 7
    },
    {
      id: 8,
      project_id: projectId1,
      title: "Transparency obligations for providers and users of certain AI systems",
      order_no: 8
    },
    { id: 1, project_id: projectId2, title: "AI literacy", order_no: 1 },
    {
      id: 2,
      project_id: projectId2,
      title: "Transparency and provision of information to deployers",
      order_no: 2
    },
    {
      id: 3, project_id: projectId2, title: "Human oversight",
      order_no: 3
    },
    {
      id: 4,
      project_id: projectId2,
      title: "Corrective actions and duty of information",
      order_no: 4
    },
    {
      id: 5,
      project_id: projectId2,
      title: "Responsibilities along the AI value chain",
      order_no: 5
    },
    {
      id: 6,
      project_id: projectId2,
      title: "Obligations of deployers of high-risk AI systems",
      order_no: 6
    },
    {
      id: 7,
      project_id: projectId2,
      title: "Fundamental rights impact assessments for high-risk AI systems",
      order_no: 7
    },
    {
      id: 8,
      project_id: projectId2,
      title: "Transparency obligations for providers and users of certain AI systems",
      order_no: 8
    },
  ]
};
