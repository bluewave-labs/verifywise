import { Request, Response } from "express";

import { STATUS_CODE } from "../utils/statusCode.utils";
import {
  createNewControlQuery,
  deleteControlByIdQuery,
  getAllControlsByControlGroupQuery,
  getAllControlsQuery,
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
    const newControl: {
      projectId: number;
      status: string;
      approver: string;
      riskReview: string;
      owner: string;
      reviewer: string;
      dueDate: Date;
      implementationDetails: string;
      controlGroup: number;
    } = req.body;

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
    const updatedControl: {
      projectId: number;
      status: string;
      approver: string;
      riskReview: string;
      owner: string;
      reviewer: string;
      date: Date;
      description: string;
    } = req.body;

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

export async function saveControls(
  req: RequestWithFile,
  res: Response
): Promise<any> {
  try {
    const requestBody: any = {
      projectId: req.body.projectId,
      controlCategoryTitle: req.body.controlCategoryTitle,
      controlCategoryId: req.body.controlCategoryId,
      control: req.body.control,
    };
    const projectId = requestBody.projectId;

    if (!projectId) {
      res
        .status(400)
        .json(STATUS_CODE[400]({ message: "project_id is required" }));
    }

    // First, we need to see if we have a control category with such title for the project
    const controlCategoryTitle = requestBody.controlCategoryTitle;

    const controlCategory = await getControlCategoryByTitleAndProjectIdQuery(
      controlCategoryTitle,
      projectId
    );

    if (!controlCategory) {
      // Now that such control Category does not exist, first we create the controlCategory
      const newControlCategory = await createControlCategoryQuery({
        projectId,
        name: controlCategoryTitle,
      });

      // Now, we need to create the control
      const newControl = {
        status: requestBody.control.status,
        approver: requestBody.control.approver,
        riskReview: requestBody.control.riskReview,
        owner: requestBody.control.owner,
        reviewer: requestBody.control.reviewer,
        dueDate: requestBody.control.date,
        implementationDetails: requestBody.control.description,
        controlGroup: newControlCategory.id ?? requestBody.controlCategoryId,
      };
      const resultControl = await createNewControlQuery(newControl);
      const subControlResp = [];

      // Now, we need to create subControls
      const subcontrols = requestBody.control.subControls;
      for (const subcontrol of subcontrols) {
        const subcontrolToSave: any = await createNewSubcontrolQuery(
          resultControl.id,
          {
            ...subcontrol,
            controlId: resultControl.id,
          },
          (
            req.files as {
              [key: string]: UploadedFile[];
            }
          )?.evidenceFiles || [],
          (
            req.files as {
              [key: string]: UploadedFile[];
            }
          )?.feedbackFiles || []
        );
        subControlResp.push(subcontrolToSave);
      }

      // Creating the final response
      const response = {
        ...{
          controlCategory,
          ...{ control: resultControl, subControls: subControlResp },
        },
      };

      return res.status(201).json(
        STATUS_CODE[201]({
          message: response,
        })
      );
    } else {
      // Now that there is a controlCategory with such details
      if (controlCategory.id) {
        const controls = await getAllControlsByControlGroupQuery(
          controlCategory.id
        );
        if (controls.length === 0) {
          // No controls found for this control category, then we need to create the control
          const controlData = {
            status: requestBody.control.status,
            approver: requestBody.control.approver,
            riskReview: requestBody.control.riskReview,
            owner: requestBody.control.owner,
            reviewer: requestBody.control.reviewer,
            dueDate: requestBody.control.date,
            implementationDetails: requestBody.control.description,
            controlGroup: controlCategory.id,
          };
          const newControl = await createNewControlQuery(controlData);
          const subControlResp = [];

          // the control is create, now its subControls
          const subcontrols = requestBody.control.subControls;
          for (const subcontrol of subcontrols) {
            const subcontrolToSave: any = await createNewSubcontrolQuery(
              newControl.id,
              {
                ...subcontrol,
                controlId: newControl.id,
              },
              (
                req.files as {
                  [key: string]: UploadedFile[];
                }
              )?.evidenceFiles || [],
              (
                req.files as {
                  [key: string]: UploadedFile[];
                }
              )?.feedbackFiles || []
            );
            subControlResp.push(subcontrolToSave);
          }

          // Creating the final response
          const response = {
            ...{
              controlCategory,
              ...{ control: newControl, subControls: subControlResp },
            },
          };

          return res.status(201).json(
            STATUS_CODE[201]({
              message: response,
            })
          );
        } else {
          // Controls found for this control category, then we need to get the control that has the same id
          const controlToUpdate = requestBody.control.control;
          const existingControl = await getControlByIdQuery(controlToUpdate.id);
          if (existingControl) {
            const control: any = await updateControlByIdQuery(
              controlToUpdate.id,
              {
                status: controlToUpdate.status,
                approver: controlToUpdate.approver,
                riskReview: controlToUpdate.riskReview,
                owner: controlToUpdate.owner,
                reviewer: controlToUpdate.reviewer,
                dueDate: controlToUpdate.date,
                implementationDetails: controlToUpdate.description,
                controlGroup: requestBody.controlCategoryId,
              }
            );

            const subcontrols = requestBody.control.subControls;
            const subControlResp = [];

            for (const subcontrol of subcontrols) {
              const subcontrolToSave: any = await updateSubcontrolByIdQuery(
                subcontrol.id,
                { ...subcontrol, controlId: controlToUpdate.id },
                (
                  req.files as {
                    [key: string]: UploadedFile[];
                  }
                )?.evidenceFiles || [],
                (
                  req.files as {
                    [key: string]: UploadedFile[];
                  }
                )?.feedbackFiles || []
              );
              subControlResp.push(subcontrolToSave);
            }

            const response = {
              ...{
                controlCategory,
                ...{ control, subControls: subControlResp },
              },
            };

            return res.status(200).json(
              STATUS_CODE[200]({
                message: response,
              })
            );
          }
        }
      }
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

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

export async function getComplianceById(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const controlId = parseInt(req.params.id);
    const control = await getControlByIdQuery(controlId);
    const subControls = await getAllSubcontrolsByControlIdQuery(controlId);
    const result = {
      control,
      subControls,
    };
    return res.status(200).json(STATUS_CODE[200](result));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
