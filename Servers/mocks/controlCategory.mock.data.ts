import { ControlCategory } from "../models/controlCategory.model";

export const ControlCategories = (projectId1: number, projectId2: number): ControlCategory[] => {
  return [
    { id: 1, projectId: projectId1, name: "AI literacy" },
    {
      id: 2,
      projectId: projectId1,
      name: "Transparency and provision of information to deployers",
    },
    { id: 3, projectId: projectId1, name: "Human oversight" },
    {
      id: 4,
      projectId: projectId1,
      name: "Corrective actions and duty of information",
    },
    {
      id: 5,
      projectId: projectId1,
      name: "Responsibilities along the AI value chain",
    },
    {
      id: 6,
      projectId: projectId1,
      name: "Obligations of deployers of high-risk AI systems",
    },
    {
      id: 7,
      projectId: projectId1,
      name: "Fundamental rights impact assessments for high-risk AI systems",
    },
    {
      id: 8,
      projectId: projectId1,
      name: "Transparency obligations for providers and users of certain AI systems",
    },
    { id: 9, projectId: projectId1, name: "Registration" },
    {
      id: 10,
      projectId: projectId1,
      name: "EU database for high-risk AI systems listed in Annex III",
    },
    {
      id: 11,
      projectId: projectId1,
      name: "Post-market monitoring by providers and post-market monitoring plan for high-risk AI systems",
    },
    {
      id: 12,
      projectId: projectId1,
      name: "Reporting of serious incidents",
    },
    {
      id: 13,
      projectId: projectId1,
      name: "General-purpose AI models",
    },
    { id: 14, projectId: projectId2, name: "AI literacy" },
    {
      id: 15,
      projectId: projectId2,
      name: "Transparency and provision of information to deployers",
    },
    { id: 16, projectId: projectId2, name: "Human oversight" },
    {
      id: 17,
      projectId: projectId2,
      name: "Corrective actions and duty of information",
    },
    {
      id: 18,
      projectId: projectId2,
      name: "Responsibilities along the AI value chain",
    },
    {
      id: 19,
      projectId: projectId2,
      name: "Obligations of deployers of high-risk AI systems",
    },
    {
      id: 20,
      projectId: projectId2,
      name: "Fundamental rights impact assessments for high-risk AI systems",
    },
    {
      id: 21,
      projectId: projectId2,
      name: "Transparency obligations for providers and users of certain AI systems",
    },
    { id: 22, projectId: projectId2, name: "Registration" },
    {
      id: 23,
      projectId: projectId2,
      name: "EU database for high-risk AI systems listed in Annex III",
    },
    {
      id: 24,
      projectId: projectId2,
      name: "Post-market monitoring by providers and post-market monitoring plan for high-risk AI systems",
    },
    {
      id: 25,
      projectId: projectId2,
      name: "Reporting of serious incidents",
    },
    {
      id: 26,
      projectId: projectId2,
      name: "General-purpose AI models",
    },
  ]
};
