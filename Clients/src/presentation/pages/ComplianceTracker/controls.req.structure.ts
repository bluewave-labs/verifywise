/**
 * @file controls.req.structure.ts
 * @description This file provides an example of the request structure for the controls page.
 */

/**
 * @constant {Object} controlsReqStructure
 * @description The structure of the request for the controls page.
 * @property {number} projectId - The ID of the project that the control category is related to.
 * @property {string} controlCategoryTitle - The title of the control category.
 * @property {number} controlCategoryId - The ID of the control category.
 * @property {Object} control - The control details.
 * @property {number} control.controlCategoryId - The ID of the control category that the control is related to.
 * @property {number} control.controlId - The ID of the control.
 * @property {string} control.controlTitle - The title of the control.
 * @property {string} control.controlDescription - The description of the control.
 * @property {string} control.status - The status of the control.
 * @property {string} control.approver - The approver of the control.
 * @property {string} control.riskReview - The risk review status of the control.
 * @property {string} control.owner - The owner of the control.
 * @property {string} control.reviewer - The reviewer of the control.
 * @property {string} control.date - The date related to the control.
 * @property {string} control.description - The description of the control.
 * @property {Array<Object>} control.subcontrols - The subcontrols related to the control.
 * @property {number} control.subcontrols[].controlId - The ID of the control that the subcontrol is related to.
 * @property {string} control.subcontrols[].subControlTitle - The title of the subcontrol.
 * @property {string} control.subcontrols[].subControlDescription - The description of the subcontrol.
 * @property {string} control.subcontrols[].status - The status of the subcontrol.
 * @property {string} control.subcontrols[].approver - The approver of the subcontrol.
 * @property {string} control.subcontrols[].riskReview - The risk review status of the subcontrol.
 * @property {string} control.subcontrols[].owner - The owner of the subcontrol.
 * @property {string} control.subcontrols[].reviewer - The reviewer of the subcontrol.
 * @property {string} control.subcontrols[].date - The date related to the subcontrol.
 * @property {string} control.subcontrols[].description - The description of the subcontrol.
 * @property {string} control.subcontrols[].evidence - The evidence provided for the subcontrol.
 * @property {Array<Object>} control.subcontrols[].evidenceFiles - The evidence files related to the subcontrol.
 * @property {string} control.subcontrols[].feedback - The feedback provided for the subcontrol.
 * @property {Array<Object>} control.subcontrols[].feedbackFiles - The feedback files related to the subcontrol.
 */
export const controlsReqStructure = {
  projectId: 1234, // id of the project that the control category is related to
  controlCategoryTitle: "AI literacy",
  controlCategoryId: 1, // After control Category is created id will be saved in a const
  control: {
    controlCategoryId: 1, // The control category id that the control is related to
    controlId: 1, // After control is created id will be saved in a const
    controlTitle: "AI Literacy and Responsible AI Training",
    controlDescription: "Develop the AI literacy ...",
    status: "selected option",
    approver: "selected option",
    riskReview: "selected option",
    owner: "selected option",
    reviewer: "selected option",
    date: "selected date",
    description: "provided description",
    subcontrols: [
      {
        controlId: 1, // The control id that the subcontrol is related to
        subControlTitle:
          "We ensure executive leadership takes responsibility for decisions related to AI risks",
        subControlDescription:
          "Leadership is accountable for oversight and strategic decisions regarding AI risks, ensuring alignment with compliance.",
        status: "selected option",
        approver: "selected option",
        riskReview: "selected option",
        owner: "selected option",
        reviewer: "selected option",
        date: "selected date",
        description: "provided description",
        evidence: "provided evidence",
        evidenceFiles: [],
        feedback: "provided feedback",
        feedbackFiles: [],
      },
    ],
  },
};
