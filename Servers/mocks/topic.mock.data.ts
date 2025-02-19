import { Topic } from "../models/topic.model";

export const topics = (assessment1: number, assessment2: number): Topic[] => {
  return [
    {
      id: 1,
      assessment_id: assessment1,
      title: "Risk management system",
      order_no: 1
    },
    {
      id: 2,
      assessment_id: assessment1,
      title: "Data governance",
      order_no: 2
    },
    {
      id: 3,
      assessment_id: assessment1,
      title: "Technical documentation",
      order_no: 3
    },
    {
      id: 4,
      assessment_id: assessment1,
      title: "Record keeping",
      order_no: 4
    },
    {
      id: 5,
      assessment_id: assessment1,
      title: "Transparency & user information",
      order_no: 5
    },
    {
      id: 6,
      assessment_id: assessment1,
      title: "Human oversight",
      order_no: 6
    },
    {
      id: 7,
      assessment_id: assessment1,
      title: "Accuracy, robustness, cyber security",
      order_no: 7
    },
    {
      id: 8,
      assessment_id: assessment1,
      title: "Conformity assessment",
      order_no: 8
    },
    {
      id: 9,
      assessment_id: assessment1,
      title: "Post-market monitoring",
      order_no: 9
    },
    {
      id: 10,
      assessment_id: assessment1,
      title: "Bias monitoring and mitigation",
      order_no: 10
    },
    {
      id: 11,
      assessment_id: assessment1,
      title: "Accountability and governance",
      order_no: 11
    },
    {
      id: 12,
      assessment_id: assessment1,
      title: "Explainability",
      order_no: 12
    },
    {
      id: 13,
      assessment_id: assessment1,
      title: "Environmental impact",
      order_no: 13
    },
    {
      id: 14,
      assessment_id: assessment2,
      title: "Risk management system",
      order_no: 1
    },
    {
      id: 15,
      assessment_id: assessment2,
      title: "Data governance",
      order_no: 2
    },
    {
      id: 16,
      assessment_id: assessment2,
      title: "Technical documentation",
      order_no: 3
    },
    {
      id: 17,
      assessment_id: assessment2,
      title: "Record keeping",
      order_no: 4
    },
    {
      id: 18,
      assessment_id: assessment2,
      title: "Transparency & user information",
      order_no: 5
    },
    {
      id: 19,
      assessment_id: assessment2,
      title: "Human oversight",
      order_no: 6
    },
    {
      id: 20,
      assessment_id: assessment2,
      title: "Accuracy, robustness, cyber security",
      order_no: 7
    },
    {
      id: 21,
      assessment_id: assessment2,
      title: "Conformity assessment",
      order_no: 8
    },
    {
      id: 22,
      assessment_id: assessment2,
      title: "Post-market monitoring",
      order_no: 9
    },
    {
      id: 23,
      assessment_id: assessment2,
      title: "Bias monitoring and mitigation",
      order_no: 10
    },
    {
      id: 24,
      assessment_id: assessment2,
      title: "Accountability and governance",
      order_no: 11
    },
    {
      id: 25,
      assessment_id: assessment2,
      title: "Explainability",
      order_no: 12
    },
    {
      id: 26,
      assessment_id: assessment2,
      title: "Environmental impact",
      order_no: 13
    },
  ]
};
