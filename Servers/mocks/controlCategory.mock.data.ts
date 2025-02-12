import { ControlCategory } from "../models/controlCategory.model";

export const ControlCategories = (projectId1: number, projectId2: number): ControlCategory[] => {
  return [
    { id: 1, projectId: projectId1, name: "AI literacy", orderNo: 1 },
    {
      id: 2,
      projectId: projectId1,
      name: "Transparency and provision of information to deployers",
      orderNo: 2
    },
    { id: 3, projectId: projectId1, name: "Human oversight",
      orderNo: 3
     },
    {
      id: 4,
      projectId: projectId1,
      name: "Corrective actions and duty of information",
      orderNo: 4
    },
    {
      id: 5,
      projectId: projectId1,
      name: "Responsibilities along the AI value chain",
      orderNo: 5
    },
    {
      id: 6,
      projectId: projectId1,
      name: "Obligations of deployers of high-risk AI systems",
      orderNo: 6
    },
    {
      id: 7,
      projectId: projectId1,
      name: "Fundamental rights impact assessments for high-risk AI systems",
      orderNo: 7
    },
    {
      id: 8,
      projectId: projectId1,
      name: "Transparency obligations for providers and users of certain AI systems",
      orderNo: 8
    },
    { id: 1, projectId: projectId2, name: "AI literacy", orderNo: 1 },
    {
      id: 2,
      projectId: projectId2,
      name: "Transparency and provision of information to deployers",
      orderNo: 2
    },
    { id: 3, projectId: projectId2, name: "Human oversight",
      orderNo: 3
     },
    {
      id: 4,
      projectId: projectId2,
      name: "Corrective actions and duty of information",
      orderNo: 4
    },
    {
      id: 5,
      projectId: projectId2,
      name: "Responsibilities along the AI value chain",
      orderNo: 5
    },
    {
      id: 6,
      projectId: projectId2,
      name: "Obligations of deployers of high-risk AI systems",
      orderNo: 6
    },
    {
      id: 7,
      projectId: projectId2,
      name: "Fundamental rights impact assessments for high-risk AI systems",
      orderNo: 7
    },
    {
      id: 8,
      projectId: projectId2,
      name: "Transparency obligations for providers and users of certain AI systems",
      orderNo: 8
    },
  ]
};
