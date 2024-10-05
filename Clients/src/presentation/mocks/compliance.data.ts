
import Checked from "../../presentation/assets/icons/check-circle-green.svg";
import Exclamation from "../../presentation/assets/icons/alert-circle-orange.svg";


export const complianceMetrics = [
    {
      name: "Compliance Status",
      amount: "15%",
    },
    {
      name: "Total number of controls",
      amount: "184",
    },
    {
      name: "Implemented controls",
      amount: "31",
    },
    {
      name: "Auditor completed",
      amount: "17",
    },
  ];
  
  export const complianceDetails = {
    cols: [
      { id: "icon", name: "icon" },
      { id: "CONTROLS", name: "CONTROLS" },
      { id: "OWNER", name: "OWNER" },
      { id: "SUBCONTROLS", name: "SUBCONTROLS" },
      { id: "COMPLETION", name: "COMPLETION" },
    ],
    rows: [
      {
        id: 1,
        icon: Checked,
        data: [
          {
            id: "1",
            data: "AIAct-016: Compliance with High-Risk AI System Requirements",
          },
          { id: "2", data: "Rachelle Swing" },
          { id: "3", data: "5 (2 left)" },
          { id: "4", data: "45%" },
        ],
      },
      {
        id: 2,
        icon: Checked,
        data: [
          {
            id: "1",
            data: "AIAct-017: Compliance with Union Harmonisation Legislation",
          },
          { id: "2", data: "Mike Arthurs" },
          { id: "3", data: "3 (1 left)" },
          { id: "4", data: "33%" },
        ],
      },
      {
        id: 3,
        icon: Exclamation,
        data: [
          {
            id: "1",
            data: "AIAct-018: Establish and Maintain Risk Management System for High-Risk AI Systems",
          },
          { id: "2", data: "John B" },
          { id: "3", data: "5 (all completed)" },
          { id: "4", data: "55%" },
        ],
      },
      {
        id: 4,
        icon: Checked,
        data: [
          {
            id: "1",
            data: "AIAct-020: Identify and Analyze Known and Foreseeable Risks",
          },
          { id: "2", data: "Adam Gwen" },
          { id: "3", data: "4 (2 left)" },
          { id: "4", data: "70%" },
        ],
      },
    ],
  };