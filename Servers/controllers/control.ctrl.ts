import { Request, Response } from "express";

import { STATUS_CODE } from "../utils/statusCode.utils";
import {
  createNewControlQuery,
  deleteControlByIdQuery,
  getAllControlsByControlGroupQuery,
  getAllControlsQuery,
  getControlByIdAndControlTitleAndControlDescriptionQuery,
  getControlByIdQuery,
  updateControlByIdQuery,
} from "../utils/control.utils";
import {
  createNewSubcontrolQuery,
  getAllSubcontrolsByControlIdQuery,
  updateSubcontrolByIdQuery,
} from "../utils/subControl.utils";
import {
  createControlCategoryQuery,
  getControlCategoryByIdQuery,
  getControlCategoryByTitleAndProjectIdQuery,
  updateControlCategoryByIdQuery,
} from "../utils/controlCategory.util";
import { RequestWithFile, UploadedFile } from "../utils/question.utils";
import { Control } from "../models/control.model";
import { Subcontrol } from "../models/subcontrol.model";

export async function getAllControls(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const controls = await getAllControlsQuery();

    if (controls) {
      return res.status(200).json(STATUS_CODE[200](controls));
    }

    return res.status(204).json(STATUS_CODE[204](controls));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getControlById(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const controlId = parseInt(req.params.id);

    const control = await getControlByIdQuery(controlId);

    if (control) {
      return res.status(200).json(STATUS_CODE[200](control));
    }

    return res.status(204).json(STATUS_CODE[204](control));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function createControl(req: Request, res: Response): Promise<any> {
  try {
    const newControl: Control = req.body;

    const createdControl = await createNewControlQuery(newControl);

    if (createdControl) {
      return res.status(201).json(STATUS_CODE[201](createdControl));
    }

    return res.status(400).json(STATUS_CODE[400]({}));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateControlById(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const controlId = parseInt(req.params.id);
    const updatedControl: Control = req.body;

    const control = await updateControlByIdQuery(controlId, updatedControl);

    if (control) {
      return res.status(200).json(STATUS_CODE[200](control));
    }

    return res.status(400).json(STATUS_CODE[400](control));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteControlById(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const controlId = parseInt(req.params.id);

    const control = await deleteControlByIdQuery(controlId);

    if (control) {
      return res.status(200).json(STATUS_CODE[200](control));
    }

    return res.status(400).json(STATUS_CODE[400](control));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

// export async function saveControls(
//   req: RequestWithFile,
//   res: Response
// ): Promise<any> {
//   try {
//     console.log("0");
//     const requestBody: any = {
//       projectId: req.body.projectId,
//       controlCategoryTitle: req.body.controlCategoryTitle,
//       controlCategoryId: req.body.controlCategoryId,
//       control: req.body.control,
//     };
//     const projectId = requestBody.projectId;
//     if (!projectId) {
//       res
//         .status(400)
//         .json(STATUS_CODE[400]({ message: "project_id is required" }));
//     }

//     // First, we need to see if we have a control category with such title for the project
//     const controlCategoryTitle = requestBody.controlCategoryTitle;
//     console.log("1");

//     const controlCategory = await getControlCategoryByTitleAndProjectIdQuery(
//       controlCategoryTitle,
//       projectId
//     );

//     if (!controlCategory) {
//       console.log("!controlCategory 2");
//       // Now that such control Category does not exist, first we create the controlCategory
//       const newControlCategory = await createControlCategoryQuery({
//         projectId,
//         name: controlCategoryTitle,
//       });
//       console.log("!controlCategory newControlCategory 3");

//       // Now, we need to create the control
//       const newControl = {
//         controlTitle: requestBody.control.control.controlTitle,
//         controlDescription: requestBody.control.control.controlDescription,
//         status: requestBody.control.control.status,
//         approver: requestBody.control.control.approver,
//         riskReview: requestBody.control.control.riskReview,
//         owner: requestBody.control.control.owner,
//         reviewer: requestBody.control.control.reviewer,
//         dueDate: requestBody.control.control.date,
//         implementationDetails:
//           requestBody.control.control.subControlDescription,
//         controlGroup: newControlCategory.id ?? requestBody.controlCategoryId,
//       };
//       const resultControl = await createNewControlQuery(newControl);
//       const subControlResp = [];
//       console.log("!controlCategory createNewControlQuery 4");

//       // Now, we need to create subControls
//       const subcontrols = requestBody.control.subControls;
//       for (const subcontrol of subcontrols) {
//         const subcontrolToSave: any = await createNewSubcontrolQuery(
//           resultControl.id,
//           {
//             ...subcontrol,
//             controlId: resultControl.id,
//           },
//           (
//             req.files as {
//               [key: string]: UploadedFile[];
//             }
//           )?.evidenceFiles || [],
//           (
//             req.files as {
//               [key: string]: UploadedFile[];
//             }
//           )?.feedbackFiles || []
//         );
//         subControlResp.push(subcontrolToSave);
//       }
//       console.log("!controlCategory createNewSubcontrolQuery 5");

//       // Creating the final response
//       const response = {
//         ...{
//           controlCategory,
//           ...{ control: resultControl, subControls: subControlResp },
//         },
//       };

//       return res.status(201).json(
//         STATUS_CODE[201]({
//           message: response,
//         })
//       );
//     } else {
//       console.log("controlCategory 2");
//       // Now that there is a controlCategory with such details
//       if (controlCategory.id) {
//         const controls = await getAllControlsByControlGroupQuery(
//           controlCategory.id
//         );
//         console.log("controlCategory getAllControlsByControlGroupQuery 3");

//         if (controls.length === 0) {
//           console.log("controlCategory controls.length === 0 4");
//           // No controls found for this control category, then we need to create the control
//           const controlData = {
//             controlTitle: requestBody.control.control.controlTitle,
//             controlDescription: requestBody.control.control.controlDescription,
//             status: requestBody.control.control.status,
//             approver: requestBody.control.control.approver,
//             riskReview: requestBody.control.control.riskReview,
//             owner: requestBody.control.control.owner,
//             reviewer: requestBody.control.control.reviewer,
//             dueDate: requestBody.control.control.date,
//             implementationDetails: requestBody.control.control.description,
//             controlGroup: controlCategory.id,
//           };
//           const newControl = await createNewControlQuery(controlData);
//           const subControlResp = [];
//           console.log(
//             "controlCategory controls.length createNewControlQuery 5"
//           );

//           // the control is create, now its subControls
//           const subcontrols = requestBody.control.subControls;
//           for (const subcontrol of subcontrols) {
//             const subcontrolToSave: any = await createNewSubcontrolQuery(
//               newControl.id,
//               {
//                 ...subcontrol,
//                 controlId: newControl.id,
//               },
//               (
//                 req.files as {
//                   [key: string]: UploadedFile[];
//                 }
//               )?.evidenceFiles || [],
//               (
//                 req.files as {
//                   [key: string]: UploadedFile[];
//                 }
//               )?.feedbackFiles || []
//             );
//             subControlResp.push(subcontrolToSave);
//           }
//           console.log(
//             "controlCategory controls.length createNewSubcontrolQuery 6"
//           );

//           // Creating the final response
//           const response = {
//             ...{
//               controlCategory,
//               ...{ control: newControl, subControls: subControlResp },
//             },
//           };

//           return res.status(201).json(
//             STATUS_CODE[201]({
//               message: response,
//             })
//           );
//         } else {
//           console.log("controlCategory controls.length !== 0 4");
//           // Controls found for this control category, then we need to get the control that has the same id
//           const controlToUpdate = requestBody.control.control;
//           const existingControl = await getControlByIdQuery(controlToUpdate.id);
//           if (existingControl) {
//             console.log("controlCategory existingControl 5");
//             const control: any = await updateControlByIdQuery(
//               controlToUpdate.id,
//               {
//                 title: requestBody.control.control.controlTitle,
//                 description:
//                   requestBody.control.control.controlDescription,
//                 status: requestBody.control.control.status,
//                 approver: requestBody.control.control.approver,
//                 riskReview: requestBody.control.control.riskReview,
//                 owner: requestBody.control.control.owner,
//                 reviewer: requestBody.control.control.reviewer,
//                 dueDate: requestBody.control.control.date,
//                 implementationDetails: requestBody.control.control.description,
//                 controlCategoryId: requestBody.controlCategoryId,
//                 orderNo: requestBody.orderNo
//               }
//             );
//             console.log(
//               "controlCategory existingControl updateControlByIdQuery 6"
//             );

//             const subcontrols = requestBody.control.subControls;
//             const subControlResp = [];

//             for (const subcontrol of subcontrols) {
//               const subcontrolToSave: any = await updateSubcontrolByIdQuery(
//                 subcontrol.id,
//                 { ...subcontrol, controlId: controlToUpdate.id },
//                 (
//                   req.files as {
//                     [key: string]: UploadedFile[];
//                   }
//                 )?.evidenceFiles || [],
//                 (
//                   req.files as {
//                     [key: string]: UploadedFile[];
//                   }
//                 )?.feedbackFiles || []
//               );
//               subControlResp.push(subcontrolToSave);
//             }
//             console.log(
//               "controlCategory existingControl updateSubcontrolByIdQuery 7"
//             );

//             const response = {
//               ...{
//                 controlCategory,
//                 ...{ control, subControls: subControlResp },
//               },
//             };

//             return res.status(200).json(
//               STATUS_CODE[200]({
//                 message: response,
//               })
//             );
//           }
//         }
//       }
//     }
//   } catch (error) {
//     return res.status(500).json(STATUS_CODE[500]((error as Error).message));
//   }
// }

// export async function updateControls(
//   req: Request,
//   res: Response
// ): Promise<any> {
//   const requestBody = req.body as {
//     projectId: number;
//     controlCategoryTitle: string;
//     controlCategoryId: number;
//     control: {
//       id: number;
//       controlCategoryId: number;
//       controlId: number;
//       controlTitle: string;
//       controlDescription: string;
//       status: string;
//       approver: string;
//       riskReview: string;
//       owner: string;
//       reviewer: string;
//       date: Date;
//       description: string;
//       subControls: {
//         id: number;
//         controlId: number;
//         subControlTitle: string;
//         subControlDescription: string;
//         status: string;
//         approver: string;
//         riskReview: string;
//         owner: string;
//         reviewer: string;
//         date: Date;
//         description: string;
//         evidence: string;
//         evidenceFiles: [];
//         feedback: string;
//         feedbackFiles: [];
//       }[];
//     };
//   };
//   try {
//     const projectId = requestBody.projectId;

//     if (!projectId) {
//       res
//         .status(400)
//         .json(STATUS_CODE[400]({ message: "project_id is required" }));
//     }

//     // first the id of the project is needed and will be sent inside the requestBody
//     const controlCategoryId = requestBody.controlCategoryId;
//     const controlCategoryTitle = requestBody.controlCategoryTitle;

//     // then we need to create the control category and use the projectId as the foreign key
//     await updateControlCategoryByIdQuery(controlCategoryId, {
//       projectId,
//       name: controlCategoryTitle,
//     });

//     const controlId = requestBody.control.id;
//     // now we need to create the control for the control category, and use the control category id as the foreign key
//     await updateControlByIdQuery(controlId, {
//       // title: requestBody.control.title,
//       status: requestBody.control.status,
//       approver: requestBody.control.approver,
//       riskReview: requestBody.control.riskReview,
//       owner: requestBody.control.owner,
//       reviewer: requestBody.control.reviewer,
//       dueDate: requestBody.control.date,
//       implementationDetails: requestBody.control.description,
//       controlGroup: controlCategoryId,
//     });

//     // now we need to iterate over subcontrols inside the control, and create a subcontrol for each subcontrol
//     const subcontrols = requestBody.control.subControls;
//     for (const subcontrol of subcontrols) {
//       const subControlId = subcontrol.id;
//       const subcontrolToSave: any = await updateSubcontrolByIdQuery(
//         subControlId,
//         subcontrol
//       );
//       console.log("subcontrolToSave : ", subcontrolToSave);
//     }

//     res.status(200).json(
//       STATUS_CODE[200]({
//         message: "Controls saved",
//       })
//     );
//   } catch (error) {
//     return res.status(500).json(STATUS_CODE[500]((error as Error).message));
//   }
// }

export async function saveControls(
  req: RequestWithFile,
  res: Response
): Promise<any> {
  try {
    const controlId = parseInt(req.params.id);
    const Control = req.body as Control;

    // now we need to create the control for the control category, and use the control category id as the foreign key
    const control: any = await updateControlByIdQuery(controlId, {
      title: Control.title,
      description: Control.description,
      order_no: Control.order_no,
      status: Control.status,
      approver: Control.approver,
      risk_review: Control.risk_review,
      owner: Control.owner,
      reviewer: Control.reviewer,
      due_date: Control.due_date,
      implementation_details: Control.implementation_details,
      control_category_id: Control.control_category_id,
    });

    // now we need to iterate over subcontrols inside the control, and create a subcontrol for each subcontrol
    const subControlResp = [];
    if (Control.subControls) {
      for (const subcontrol of Control.subControls) {
        const evidenceFiles =
          (req.files as { [key: string]: UploadedFile[] })?.evidence_files ||
          [];
        const feedbackFiles =
          (req.files as { [key: string]: UploadedFile[] })?.feedback_files ||
          [];

        const subcontrolToSave: any = await updateSubcontrolByIdQuery(
          subcontrol.id!,
          {
            title: subcontrol.title,
            description: subcontrol.description,
            order_no: subcontrol.order_no,
            status: subcontrol.status as
              | "Waiting"
              | "In progress"
              | "Done"
              | undefined,
            approver: subcontrol.approver,
            risk_review: subcontrol.risk_review as
              | "Acceptable risk"
              | "Residual risk"
              | "Unacceptable risk"
              | undefined,
            owner: subcontrol.owner,
            reviewer: subcontrol.reviewer,
            due_date: subcontrol.due_date,
            implementation_details: subcontrol.implementation_details,
            evidence_description: subcontrol.evidence_description,
            feedback_description: subcontrol.feedback_description,
            evidence_files: subcontrol.evidence_files,
            feedback_files: subcontrol.feedback_files,
            control_id: subcontrol.control_id,
          },
          evidenceFiles,
          feedbackFiles
        );
        subControlResp.push(subcontrolToSave);
      }
    }
    // const response = {
    //   ...{ control, subcontrols: subControlResp },
    // };
    return res.status(200).json(
      STATUS_CODE[200]({
        message: "Updated",
      })
    );
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getComplianceById(
  req: Request,
  res: Response
): Promise<any> {
  const control_id = req.params.id;
  try {
    const control = await getControlByIdQuery(parseInt(control_id));
    if (control && control.id) {
      const subControls = await getAllSubcontrolsByControlIdQuery(control.id);
      control.subControls = subControls;
      return res.status(200).json(STATUS_CODE[200](control));
    } else {
      return res.status(404).json(STATUS_CODE[404]("Control not found"));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getControlsByControlCategoryId(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const controlCategoryId = parseInt(req.params.id);
    const controls = await getAllControlsByControlGroupQuery(controlCategoryId);
    return res.status(200).json(STATUS_CODE[200](controls));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
