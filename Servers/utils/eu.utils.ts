import { QueryTypes, Transaction } from "sequelize";
import { sequelize } from "../database/db";
import {
  AnswerEU,
  AnswerEUModel,
} from "../domain.layer/frameworks/EU-AI-Act/answerEU.model";
import {
  AssessmentEU,
  AssessmentEUModel,
} from "../domain.layer/frameworks/EU-AI-Act/assessmentEU.model";
import { ControlCategoryStructEUModel } from "../domain.layer/frameworks/EU-AI-Act/controlCategoryStructEU.model";
import {
  ControlEU,
  ControlEUModel,
} from "../domain.layer/frameworks/EU-AI-Act/controlEU.model";
import { ControlStructEUModel } from "../domain.layer/frameworks/EU-AI-Act/controlStructEU.model";
import { QuestionStructEUModel } from "../domain.layer/frameworks/EU-AI-Act/questionStructEU.model";
import {
  SubcontrolEU,
  SubcontrolEUModel,
} from "../domain.layer/frameworks/EU-AI-Act/subControlEU.model";
import { SubtopicStructEUModel } from "../domain.layer/frameworks/EU-AI-Act/subTopicStructEU.model";
import { TopicStructEUModel } from "../domain.layer/frameworks/EU-AI-Act/topicStructEU.model";
import { ProjectScopeModel } from "../domain.layer/models/projectScope/projectScope.model";
import { Topics } from "../structures/EU-AI-Act/assessment-tracker/topics.struct";
import { ControlCategories } from "../structures/EU-AI-Act/compliance-tracker/controlCategories.struct";
import { deleteHelper } from "./project.utils";
import { ProjectFrameworksModel } from "../domain.layer/models/projectFrameworks/projectFrameworks.model";
import { STATUSES_ANSWERS, STATUSES_COMPLIANCE } from "../types/status.type";

const getDemoAnswers = (): String[] => {
  const answers = [];
  for (let topic of Topics) {
    for (let subTopic of topic.subtopics) {
      for (let question of subTopic.questions) {
        answers.push(question.answer);
      }
    }
  }
  return answers;
};

const getDemoControls = (): Object[] => {
  let controls: Object[] = [];
  for (let controlCategory of ControlCategories) {
    controls = controls.concat([...controlCategory.controls]);
  }
  return controls;
};

const findIsDemo = async (
  tableName: string,
  id: number,
  transaction: Transaction
) => {
  const result = (await sequelize.query(
    `SELECT is_demo FROM ${tableName} WHERE id = :id`,
    {
      replacements: { id },
      transaction,
    }
  )) as [{ is_demo: boolean }[], number];
  return result[0][0].is_demo;
};

export const countAnswersEUByProjectId = async (
  projectFrameworkId: number
): Promise<{
  totalAssessments: string;
  answeredAssessments: string;
}> => {
  const result = await sequelize.query(
    `SELECT COUNT(*) AS "totalAssessments", COUNT(CASE WHEN ans.status = 'Done' THEN 1 END) AS "answeredAssessments" FROM
      assessments a JOIN answers_eu ans ON a.id = ans.assessment_id WHERE a.projects_frameworks_id = :projects_frameworks_id;`,
    {
      replacements: { projects_frameworks_id: projectFrameworkId },
      type: QueryTypes.SELECT,
    }
  );
  return result[0] as {
    totalAssessments: string;
    answeredAssessments: string;
  };
};

export const countSubControlsEUByProjectId = async (
  projectFrameworkId: number
): Promise<{
  totalSubcontrols: string;
  doneSubcontrols: string;
}> => {
  // const projectFrameworkId = await sequelize.query(
  //   `SELECT id FROM projects_frameworks WHERE project_id = :project_id AND framework_id = 1`,
  //   {
  //     replacements: { project_id: project_id }
  //   }
  // ) as [{ id: number }[], number];
  const result = await sequelize.query(
    `SELECT COUNT(*) AS "totalSubcontrols", COUNT(CASE WHEN sc.status = 'Done' THEN 1 END) AS "doneSubcontrols" FROM
      controls_eu c JOIN subcontrols_eu sc ON c.id = sc.control_id WHERE c.projects_frameworks_id = :projects_frameworks_id;`,
    {
      replacements: { projects_frameworks_id: projectFrameworkId },
      type: QueryTypes.SELECT,
    }
  );
  return result[0] as {
    totalSubcontrols: string;
    doneSubcontrols: string;
  };
};

export const getTopicByIdForProjectQuery = async (
  topicStructId: number,
  projectFrameworkId: number
): Promise<TopicStructEUModel | null> => {
  const assessmentId = (await sequelize.query(
    `SELECT id FROM assessments WHERE projects_frameworks_id = :projects_frameworks_id`,
    {
      replacements: { projects_frameworks_id: projectFrameworkId },
    }
  )) as [{ id: number }[], number];
  const topics = await sequelize.query(
    "SELECT * FROM topics_struct_eu WHERE id = :topic_id;",
    {
      replacements: { topic_id: topicStructId },
      mapToModel: true,
      model: TopicStructEUModel,
    }
  );
  const topic = topics[0];
  const subtopicStruct = await getAllSubTopicsQuery(topic.id!);
  (topic.dataValues as any).subTopics = subtopicStruct;
  for (let subtopic of subtopicStruct) {
    const questionAnswers = await getAllQuestionsQuery(
      subtopic.id!,
      assessmentId[0][0].id
    );
    (subtopic.dataValues as any).questions = [];
    for (let question of questionAnswers) {
      (subtopic.dataValues as any).questions.push({ ...question });
    }
  }
  return topic;
};

const getSubControlsCalculations = async (controlId: number) => {
  const result = (await sequelize.query(
    `SELECT COUNT(*) AS "numberOfSubcontrols", COUNT(CASE WHEN sc.status = 'Done' THEN 1 END) AS "numberOfDoneSubcontrols" FROM
      controls_eu c JOIN subcontrols_eu sc ON c.id = sc.control_id WHERE c.id = :control_id;`,
    {
      replacements: { control_id: controlId },
    }
  )) as [
    { numberOfSubcontrols: string; numberOfDoneSubcontrols: string }[],
    number
  ];
  return result[0][0] as {
    numberOfSubcontrols: string;
    numberOfDoneSubcontrols: string;
  };
};

export const getControlByIdForProjectQuery = async (
  controlStructId: number,
  projectFrameworkId: number
): Promise<Partial<ControlEU & ControlStructEUModel> | null> => {
  const controlId = (await sequelize.query(
    `SELECT id FROM controls_eu WHERE control_meta_id = :control_meta_id AND projects_frameworks_id = :projects_frameworks_id`,
    {
      replacements: {
        control_meta_id: controlStructId,
        projects_frameworks_id: projectFrameworkId,
      },
    }
  )) as [{ id: number }[], number];
  const controls = await getControlByIdQuery(controlId[0][0].id);
  const control = controls[0];
  const subControls = await getSubControlsByIdQuery(control.id!);
  (control as any).subControls = [];
  for (let subControl of subControls) {
    (control as any).subControls.push({ ...subControl });
  }
  const subControlsCalculations = await getSubControlsCalculations(control.id!);
  (control as any).numberOfSubcontrols = parseInt(
    subControlsCalculations.numberOfSubcontrols
  );
  (control as any).numberOfDoneSubcontrols = parseInt(
    subControlsCalculations.numberOfDoneSubcontrols
  );
  return control;
};

export const getAllTopicsQuery = async (
  transaction: Transaction | null = null
) => {
  const topicStruct = await sequelize.query("SELECT * FROM topics_struct_eu;", {
    mapToModel: true,
    model: TopicStructEUModel,
    ...(transaction && { transaction }),
  });
  return topicStruct;
};

export const getAllSubTopicsQuery = async (
  topicId: number,
  transaction: Transaction | null = null
) => {
  const subtopicStruct = await sequelize.query(
    "SELECT * FROM subtopics_struct_eu WHERE topic_id = :topic_id;",
    {
      replacements: { topic_id: topicId },
      mapToModel: true,
      model: SubtopicStructEUModel,
      ...(transaction && { transaction }),
    }
  );
  return subtopicStruct;
};

export const getAllQuestionsQuery = async (
  subtopicId: number,
  assessmentId: number,
  transaction: Transaction | null = null
) => {
  const questionAnswers = (await sequelize.query(
    `SELECT 
      q.id AS question_id,
      q.order_no AS order_no,
      q.question AS question,
      q.hint AS hint,
      q.priority_level AS priority_level,
      q.answer_type AS answer_type,
      q.input_type AS input_type,
      q.evidence_required AS evidence_required,
      q.is_required AS is_required,
      q.subtopic_id AS subtopic_id,
      a.id AS answer_id,
      a.assessment_id AS assessment_id,
      a.answer AS answer,
      a.evidence_files AS evidence_files,
      a.dropdown_options AS dropdown_options,
      a.status AS status,
      a.created_at AS created_at,
      a.is_demo AS is_demo
    FROM questions_struct_eu q JOIN answers_eu a ON q.id = a.question_id WHERE 
      q.subtopic_id = :subtopic_id AND a.assessment_id = :assessment_id
      ORDER BY created_at DESC, question_id ASC;`,
    {
      replacements: { subtopic_id: subtopicId, assessment_id: assessmentId },
      ...(transaction && { transaction }),
    }
  )) as [Partial<QuestionStructEUModel & AnswerEU>[], number];
  return questionAnswers[0];
};

export const getAssessmentsEUByIdQuery = async (
  assessmentId: number,
  transaction: Transaction | null = null
) => {
  const topicStruct = await getAllTopicsQuery(transaction);
  for (let topic of topicStruct) {
    const subtopicStruct = await getAllSubTopicsQuery(topic.id!, transaction);
    (topic.dataValues as any).subTopics = subtopicStruct;
    for (let subtopic of subtopicStruct) {
      const questionAnswers = await getAllQuestionsQuery(
        subtopic.id!,
        assessmentId,
        transaction
      );
      (subtopic.dataValues as any).questions = [];
      for (let question of questionAnswers) {
        (subtopic.dataValues as any).questions.push({ ...question });
      }
    }
  }
  return topicStruct;
};

export const getAllControlCategoriesQuery = async (
  transaction: Transaction | null = null
) => {
  const controlCategoriesStruct = await sequelize.query(
    `SELECT * FROM controlcategories_struct_eu;`,
    {
      mapToModel: true,
      model: ControlCategoryStructEUModel,
      ...(transaction && { transaction }),
    }
  );
  return controlCategoriesStruct;
};

export const getControlStructByControlCategoryIdQuery = async (
  controlCategoryId: number
) => {
  const controlsStruct = await sequelize.query(
    `SELECT * FROM controls_struct_eu WHERE control_category_id = :control_category_id;`,
    {
      replacements: { control_category_id: controlCategoryId },
      mapToModel: true,
      model: ControlStructEUModel,
    }
  );
  return controlsStruct;
};

export const getControlStructByControlCategoryIdForAProjectQuery = async (
  controlCategoryId: number,
  projectFrameworkId: number
) => {
  const controlsStruct = (await sequelize.query(
    `SELECT cs.*, c.id AS control_id, c.owner, c.status FROM controls_struct_eu cs JOIN controls_eu c ON cs.id = c.control_meta_id
      WHERE cs.control_category_id = :control_category_id AND c.projects_frameworks_id = :projects_frameworks_id;`,
    {
      replacements: {
        control_category_id: controlCategoryId,
        projects_frameworks_id: projectFrameworkId,
      },
    }
  )) as [
    Partial<ControlStructEUModel & ControlEUModel & { control_id: number }>[],
    number
  ];
  for (let control of controlsStruct[0]) {
    const subControlsCalculations = await getSubControlsCalculations(
      control.control_id!
    );
    (control as any).numberOfSubcontrols = parseInt(
      subControlsCalculations.numberOfSubcontrols
    );
    (control as any).numberOfDoneSubcontrols = parseInt(
      subControlsCalculations.numberOfDoneSubcontrols
    );
  }
  return controlsStruct[0];
};

export const getControlByIdQuery = async (
  controlId: number,
  transaction: Transaction | null = null
) => {
  const controls = (await sequelize.query(
    `SELECT 
      cs.title AS title,
      cs.description AS description,
      cs.order_no AS order_no,
      cs.control_category_id AS control_category_id,
      c.id AS id,
      c.status AS status,
      c.approver AS approver,
      c.risk_review AS risk_review,
      c.owner AS owner,
      c.reviewer AS reviewer,
      c.due_date AS due_date,
      c.implementation_details AS implementation_details,
      c.created_at AS created_at
    FROM controls_eu c JOIN controls_struct_eu cs ON c.control_meta_id = cs.id WHERE c.id = :control_id
    ORDER BY created_at DESC, id ASC;`,
    {
      replacements: { control_id: controlId },
      ...(transaction && { transaction }),
    }
  )) as [Partial<ControlEUModel & ControlStructEUModel>[], number];
  return controls[0];
};

export const getSubControlsByIdQuery = async (
  subControlId: number,
  transaction: Transaction | null = null
) => {
  const subControls = (await sequelize.query(
    `SELECT 
      scs.title AS title,
      scs.description AS description,
      scs.order_no AS order_no,
      sc.id AS id,
      sc.status AS status,
      sc.approver AS approver,
      sc.risk_review AS risk_review,
      sc.owner AS owner,
      sc.reviewer AS reviewer,
      sc.due_date AS due_date,
      sc.implementation_details AS implementation_details,
      sc.control_id AS control_id,
      sc.is_demo AS is_demo,
      sc.evidence_files AS evidence_files,
      sc.feedback_files AS feedback_files,
      sc.evidence_description AS evidence_description,
      sc.feedback_description AS feedback_description,
      sc.created_at AS created_at
    FROM subcontrols_eu sc JOIN subcontrols_struct_eu scs ON sc.subcontrol_meta_id = scs.id WHERE sc.control_id = :control_id
    ORDER BY created_at DESC, id ASC;`,
    {
      replacements: { control_id: subControlId },
      ...(transaction && { transaction }),
    }
  )) as [Partial<SubcontrolEUModel | ControlStructEUModel>[], number];
  return subControls[0];
};

export const getCompliancesEUByIdQuery = async (
  controlIds: number[],
  transaction: Transaction | null = null
) => {
  const controlCategoriesStruct = await getAllControlCategoriesQuery(
    transaction
  );
  let controlCategoryIdIndexMap = new Map();
  for (let [i, controlCategory] of controlCategoriesStruct.entries()) {
    (controlCategory.dataValues as any).controls = [];
    controlCategoryIdIndexMap.set(controlCategory.id, i);
  }

  for (let controlId of controlIds) {
    const controls = await getControlByIdQuery(controlId, transaction);

    for (let control of controls) {
      (controlCategoriesStruct as any)[
        controlCategoryIdIndexMap.get(control.control_category_id)
      ].dataValues.controls.push(control);
      const subControls = await getSubControlsByIdQuery(
        control.id!,
        transaction
      );
      (control as any).subControls = [];
      for (let subControl of subControls) {
        (control as any).subControls.push({ ...subControl });
      }
    }
  }
  return controlCategoriesStruct;
};

export const getAssessmentsEUByProjectIdQuery = async (
  projectFrameworkId: number
) => {
  const assessmentId = (await sequelize.query(
    `SELECT id FROM assessments WHERE projects_frameworks_id = :projects_frameworks_id`,
    {
      replacements: { projects_frameworks_id: projectFrameworkId },
    }
  )) as [{ id: number }[], number];
  const assessments = await getAssessmentsEUByIdQuery(assessmentId[0][0].id);
  return assessments;
};

export const getComplianceEUByProjectIdQuery = async (
  projectFrameworkId: number
) => {
  const controlIds = (await sequelize.query(
    `SELECT id FROM controls_eu WHERE projects_frameworks_id = :projects_frameworks_id`,
    {
      replacements: { projects_frameworks_id: projectFrameworkId },
    }
  )) as [{ id: number }[], number];

  const compliances = await getCompliancesEUByIdQuery(
    controlIds[0].map((c) => c.id)
  );
  return compliances;
};

export const createNewAssessmentEUQuery = async (
  assessment: AssessmentEU,
  enable_ai_data_insertion: boolean,
  transaction: Transaction,
  is_mock_data: boolean
): Promise<Object> => {
  const projectFrameworkId = (await sequelize.query(
    `SELECT id FROM projects_frameworks WHERE project_id = :project_id AND framework_id = 1`,
    {
      replacements: { project_id: assessment.project_id },
      transaction,
    }
  )) as [{ id: number }[], number];
  // if (projectFrameworkId[0].length === 0) {
  //   throw new Error("Project not added to framework");
  // }
  const result = await sequelize.query(
    `INSERT INTO assessments (projects_frameworks_id, is_demo) VALUES (:projects_frameworks_id, :is_demo) RETURNING *`,
    {
      replacements: {
        projects_frameworks_id: projectFrameworkId[0][0].id,
        is_demo: await findIsDemo(
          "projects",
          assessment.project_id,
          transaction
        ),
      },
      mapToModel: true,
      model: AssessmentEUModel,
      transaction,
    }
  );
  await createNewAnswersEUQuery(
    result[0].id!,
    enable_ai_data_insertion,
    transaction,
    is_mock_data
  );
  const assessments = await getAssessmentsEUByIdQuery(
    result[0].id!,
    transaction
  );
  return { ...result[0].dataValues, topics: assessments };
};

export const createNewAnswersEUQuery = async (
  assessmentId: number,
  enable_ai_data_insertion: boolean,
  transaction: Transaction,
  is_mock_data: boolean
) => {
  let demoAnswers: String[] = [];
  if (enable_ai_data_insertion) demoAnswers = getDemoAnswers();
  const questions = await sequelize.query(
    "SELECT * FROM questions_struct_eu ORDER BY id;",
    {
      mapToModel: true,
      model: QuestionStructEUModel,
      transaction,
    }
  );
  let createdAnswers: (AnswerEUModel | QuestionStructEUModel)[] = [];
  let ansCtr = 0;
  for (let question of questions) {
    const result = await sequelize.query(
      `INSERT INTO answers_eu(assessment_id, question_id, answer, status, is_demo) VALUES (
        :assessment_id, :question_id, :answer, :status, :is_demo
      ) RETURNING *;`,
      {
        replacements: {
          assessment_id: assessmentId,
          question_id: question.id!,
          answer: enable_ai_data_insertion ? demoAnswers[ansCtr++] : null,
          status: is_mock_data
            ? STATUSES_ANSWERS[
                Math.floor(Math.random() * STATUSES_ANSWERS.length)
              ]
            : "Not started",
          is_demo: await findIsDemo("assessments", assessmentId, transaction),
        },
        mapToModel: true,
        model: AnswerEUModel,
        transaction,
      }
    );
    createdAnswers = createdAnswers.concat(
      Object.assign({}, result[0], question)
    );
  }
  return createdAnswers;
};

export const createNewControlsQuery = async (
  projectId: number,
  enable_ai_data_insertion: boolean,
  transaction: Transaction,
  is_mock_data: boolean
) => {
  let demoControls: any[] = [];
  if (enable_ai_data_insertion) demoControls = getDemoControls();

  const controlsStruct = await sequelize.query(
    "SELECT * FROM controls_struct_eu;",
    {
      mapToModel: true,
      model: ControlStructEUModel,
      transaction,
    }
  );
  let controlCtr = 0;
  let controlIds: number[] = [];
  for (let controlStruct of controlsStruct) {
    const projectFrameworkId = (await sequelize.query(
      `SELECT id FROM projects_frameworks WHERE project_id = :project_id AND framework_id = 1`,
      {
        replacements: { project_id: projectId },
        transaction,
      }
    )) as [{ id: number }[], number];
    const result = await sequelize.query(
      `INSERT INTO controls_eu(control_meta_id, implementation_details, status, projects_frameworks_id, is_demo) VALUES (
        :control_meta_id, :implementation_details, :status, :projects_frameworks_id, :is_demo
      ) RETURNING id;`,
      {
        replacements: {
          control_meta_id: controlStruct.id!,
          implementation_details: enable_ai_data_insertion
            ? demoControls[controlCtr].implementation_details
            : null,
          status: enable_ai_data_insertion ? "Waiting" : null,
          projects_frameworks_id: projectFrameworkId[0][0].id,
          is_demo: await findIsDemo("projects", projectId, transaction),
        },
        mapToModel: true,
        model: ControlEUModel,
        transaction,
      }
    );
    controlIds.push(result[0].id!);
    await createNewSubControlsQuery(
      controlStruct.id!,
      demoControls[controlCtr++]?.subControls || [],
      result[0].id!,
      enable_ai_data_insertion,
      transaction,
      is_mock_data
    );
  }
  const compliances = await getCompliancesEUByIdQuery(controlIds, transaction);
  return compliances;
};

export const createNewSubControlsQuery = async (
  controlStructId: number,
  demoSubControls: any[],
  controlId: number,
  enable_ai_data_insertion: boolean,
  transaction: Transaction,
  is_mock_data: boolean
) => {
  const subControlMetaIds = await sequelize.query(
    "SELECT id FROM subcontrols_struct_eu WHERE control_id = :control_id",
    {
      replacements: { control_id: controlStructId },
      transaction,
    }
  );
  let ctr = 0;
  let createdSubControls: SubcontrolEUModel[] = [];
  for (let subControl of subControlMetaIds[0] as { id: number }[]) {
    const result = await sequelize.query(
      `INSERT INTO subcontrols_eu(control_id, subcontrol_meta_id, implementation_details, evidence_description, feedback_description, status, is_demo) VALUES (
        :control_id, :subcontrol_meta_id, :implementation_details, :evidence_description, :feedback_description, :status, :is_demo
      ) RETURNING *`,
      {
        replacements: {
          control_id: controlId,
          subcontrol_meta_id: subControl.id,
          implementation_details: enable_ai_data_insertion
            ? demoSubControls[ctr].implementation_details
            : null,
          evidence_description:
            enable_ai_data_insertion &&
            demoSubControls[ctr].evidence_description
              ? demoSubControls[ctr].evidence_description
              : null,
          feedback_description:
            enable_ai_data_insertion &&
            demoSubControls[ctr].feedback_description
              ? demoSubControls[ctr].feedback_description
              : null,
          status: is_mock_data
            ? STATUSES_COMPLIANCE[
                Math.floor(Math.random() * STATUSES_COMPLIANCE.length)
              ]
            : "Waiting",
          is_demo: await findIsDemo("controls_eu", controlId, transaction),
        },
        mapToModel: true,
        model: SubcontrolEUModel,
        transaction,
      }
    );
    createdSubControls = createdSubControls.concat(result);
    ctr++;
  }
  return createdSubControls;
};

export const createEUFrameworkQuery = async (
  projectId: number,
  enable_ai_data_insertion: boolean,
  transaction: Transaction,
  is_mock_data: boolean = false
) => {
  const assessments: Object = await createNewAssessmentEUQuery(
    { project_id: projectId },
    enable_ai_data_insertion,
    transaction,
    is_mock_data
  );
  const controls = await createNewControlsQuery(
    projectId,
    enable_ai_data_insertion,
    transaction,
    is_mock_data
  );
  return {
    assessment_tracker: assessments,
    compliance_tracker: controls,
  };
};

export const updateControlEUByIdQuery = async (
  id: number,
  control: Partial<ControlEU>,
  transaction: Transaction
): Promise<ControlEU> => {
  const updateControl: Partial<Record<keyof ControlEU, any>> = {};
  const setClause = [
    "status",
    "approver",
    "risk_review",
    "owner",
    "reviewer",
    "due_date",
    "implementation_details",
  ]
    .filter((f) => {
      if (
        control[f as keyof ControlEU] !== undefined &&
        control[f as keyof ControlEU]
      ) {
        updateControl[f as keyof ControlEU] = control[f as keyof ControlEU];
        return true;
      }
    })
    .map((f) => `${f} = :${f}`)
    .join(", ");
  if (!setClause) {
    return control as ControlEU;
  }

  const query = `UPDATE controls_eu SET ${setClause} WHERE id = :id RETURNING *;`;

  updateControl.id = id;

  const result = await sequelize.query(query, {
    replacements: updateControl,
    mapToModel: true,
    model: ControlEUModel,
    // type: QueryTypes.UPDATE,
    transaction,
  });
  return result[0];
};

export const updateSubcontrolEUByIdQuery = async (
  id: number,
  subcontrol: Partial<SubcontrolEU>,
  evidenceUploadedFiles: {
    id: string;
    fileName: string;
    project_id: number;
    uploaded_by: number;
    uploaded_time: Date;
  }[] = [],
  feedbackUploadedFiles: {
    id: string;
    fileName: string;
    project_id: number;
    uploaded_by: number;
    uploaded_time: Date;
  }[] = [],
  deletedFiles: number[] = [],
  transaction: Transaction
): Promise<SubcontrolEU> => {
  const files = await sequelize.query(
    `SELECT evidence_files, feedback_files FROM subcontrols_eu WHERE id = :id`,
    {
      replacements: { id },
      mapToModel: true,
      model: SubcontrolEUModel,
      transaction,
    }
  );

  let currentEvidenceFiles = (
    files[0].evidence_files ? files[0].evidence_files : []
  ) as {
    id: string;
    fileName: string;
    project_id: number;
    uploaded_by: number;
    uploaded_time: Date;
  }[];
  let currentFeedbackFiles = (
    files[0].feedback_files ? files[0].feedback_files : []
  ) as {
    id: string;
    fileName: string;
    project_id: number;
    uploaded_by: number;
    uploaded_time: Date;
  }[];

  currentEvidenceFiles = currentEvidenceFiles.filter(
    (f) => !deletedFiles.includes(parseInt(f.id))
  );
  currentEvidenceFiles = currentEvidenceFiles.concat(evidenceUploadedFiles);

  currentFeedbackFiles = currentFeedbackFiles.filter(
    (f) => !deletedFiles.includes(parseInt(f.id))
  );
  currentFeedbackFiles = currentFeedbackFiles.concat(feedbackUploadedFiles);

  const updateSubControl: Partial<Record<keyof SubcontrolEU, any>> = {};
  const setClause = [
    "status",
    "approver",
    "risk_review",
    "owner",
    "reviewer",
    "due_date",
    "implementation_details",
    "evidence_description",
    "feedback_description",
    "evidence_files",
    "feedback_files",
  ]
    .filter((f) => {
      if (f == "evidence_files" && currentEvidenceFiles.length > 0) {
        updateSubControl["evidence_files"] =
          JSON.stringify(currentEvidenceFiles);
        return true;
      }
      if (f == "feedback_files" && currentFeedbackFiles.length > 0) {
        updateSubControl["feedback_files"] =
          JSON.stringify(currentFeedbackFiles);
        return true;
      }
      if (
        subcontrol[f as keyof SubcontrolEU] !== undefined &&
        subcontrol[f as keyof SubcontrolEU]
      ) {
        updateSubControl[f as keyof SubcontrolEU] =
          subcontrol[f as keyof SubcontrolEU];
        return true;
      }
    })
    .map((f) => {
      return `${f} = :${f}`;
    })
    .join(", ");

  if (setClause.length === 0) {
    return subcontrol as SubcontrolEU;
  }

  const query = `UPDATE subcontrols_eu SET ${setClause} WHERE id = :id RETURNING *;`;

  updateSubControl.id = id;

  const result = await sequelize.query(query, {
    replacements: updateSubControl,
    mapToModel: true,
    model: SubcontrolEUModel,
    // type: QueryTypes.UPDATE,
    transaction,
  });

  return result[0];
};

export const addFileToAnswerEU = async (
  questionId: number,
  projectId: number,
  uploadedFiles: {
    id: string;
    fileName: string;
    project_id: number;
    uploaded_by: number;
    uploaded_time: Date;
  }[],
  deletedFiles: number[],
  transaction: Transaction
): Promise<QuestionStructEUModel & AnswerEUModel> => {
  const projectFrameworkId = (await sequelize.query(
    `SELECT id FROM projects_frameworks WHERE project_id = :project_id AND framework_id = 1`,
    {
      replacements: { project_id: projectId },
      transaction,
    }
  )) as [{ id: number }[], number];
  const assessmentId = (await sequelize.query(
    "SELECT id FROM assessments WHERE projects_frameworks_id = :project_framework_id;",
    {
      replacements: { project_framework_id: projectFrameworkId[0][0].id },
      transaction,
    }
  )) as [{ id: number }[], number];
  // get the existing evidence files
  const evidenceFilesResult = await sequelize.query(
    `SELECT evidence_files FROM answers_eu WHERE question_id = :id AND assessment_id = :assessment_id`,
    {
      replacements: { id: questionId, assessment_id: assessmentId[0][0].id },
      mapToModel: true,
      model: AnswerEUModel,
      transaction,
    }
  );

  // convert to list of objects
  let evidenceFiles = (
    evidenceFilesResult[0].evidence_files
      ? evidenceFilesResult[0].evidence_files
      : []
  ) as {
    id: string;
    fileName: string;
    project_id: number;
    uploaded_by: number;
    uploaded_time: Date;
  }[];

  // remove the deleted file ids
  evidenceFiles = evidenceFiles.filter(
    (f) => !deletedFiles.includes(parseInt(f.id))
  );

  // combine the files lists
  evidenceFiles = evidenceFiles.concat(uploadedFiles);

  // update
  const answer = (await sequelize.query(
    `UPDATE answers_eu SET evidence_files = :evidence_files WHERE question_id = :id AND assessment_id = :assessment_id RETURNING *;`,
    {
      replacements: {
        evidence_files: JSON.stringify(evidenceFiles),
        id: questionId,
        assessment_id: assessmentId[0][0].id,
      },
      transaction,
    }
  )) as [AnswerEUModel[], number];
  const question = (await sequelize.query(
    `SELECT * FROM questions_struct_eu WHERE id = :id`,
    { replacements: { id: answer[0][0].question_id }, transaction }
  )) as [QuestionStructEUModel[], number];
  return {
    ...answer[0][0],
    question: question[0][0].question,
    order_no: question[0][0].order_no,
    hint: question[0][0].hint,
    priority_level: question[0][0].priority_level,
    answer_type: question[0][0].answer_type,
    input_type: question[0][0].input_type,
    evidence_required: question[0][0].evidence_required,
    is_required: question[0][0].is_required,
    subtopic_id: question[0][0].subtopic_id,
  } as QuestionStructEUModel & AnswerEUModel;
};

export const updateQuestionEUByIdQuery = async (
  id: number,
  question: Partial<AnswerEU>,
  transaction: Transaction
): Promise<AnswerEU | null> => {
  const updateQuestion: Partial<Record<keyof AnswerEU, any>> = {};
  const setClause = ["answer", "status"]
    .filter((f) => {
      if (question[f as keyof AnswerEU] !== undefined) {
        updateQuestion[f as keyof AnswerEU] = question[f as keyof AnswerEU];
        if (f === "answer" && !question[f]) {
          updateQuestion[f as keyof AnswerEU] = "";
        }
        return true;
      }
    })
    .map((f) => `${f} = :${f}`)
    .join(", ");

  const query = `UPDATE answers_eu SET ${setClause} WHERE id = :id RETURNING *;`;

  updateQuestion.id = id;

  const result = await sequelize.query(query, {
    replacements: updateQuestion,
    mapToModel: true,
    model: AnswerEUModel,
    // type: QueryTypes.UPDATE,
    transaction,
  });

  return result[0];
};

export const deleteAssessmentEUByProjectIdQuery = async (
  projectFrameworkId: number,
  transaction: Transaction
) => {
  const assessmentId = (await sequelize.query(
    `SELECT id FROM assessments WHERE projects_frameworks_id = :projects_frameworks_id`,
    {
      replacements: { projects_frameworks_id: projectFrameworkId },
      transaction,
    }
  )) as [{ id: number }[], number];
  if (assessmentId[0].length === 0) {
    return false;
  }
  await sequelize.query(
    `DELETE FROM answers_eu WHERE assessment_id = :assessment_id`,
    {
      replacements: { assessment_id: assessmentId[0][0].id },
      transaction,
    }
  );
  const result = await sequelize.query(
    `DELETE FROM assessments WHERE id = :assessment_id RETURNING *`,
    {
      replacements: { assessment_id: assessmentId[0][0].id },
      mapToModel: true,
      model: AssessmentEUModel,
      type: QueryTypes.DELETE,
      transaction,
    }
  );
  return result.length > 0;
};

export const deleteComplianeEUByProjectIdQuery = async (
  projectFrameworkId: number,
  transaction: Transaction
) => {
  const controlIds = (await sequelize.query(
    `SELECT id FROM controls_eu WHERE projects_frameworks_id = :projects_frameworks_id`,
    {
      replacements: { projects_frameworks_id: projectFrameworkId },
      transaction,
    }
  )) as [{ id: number }[], number];
  if (controlIds[0].length === 0) {
    return false;
  }
  for (let control of controlIds[0]) {
    await sequelize.query(
      `DELETE FROM subcontrols_eu WHERE control_id = :control_id`,
      { replacements: { control_id: control.id }, transaction }
    );
  }
  const result = await sequelize.query(
    `DELETE FROM controls_eu WHERE projects_frameworks_id = :projects_frameworks_id RETURNING *`,
    {
      replacements: { projects_frameworks_id: projectFrameworkId },
      mapToModel: true,
      model: ControlEUModel,
      type: QueryTypes.DELETE,
      transaction,
    }
  );
  return result.length > 0;
};

export const deleteProjectFrameworkEUQuery = async (
  projectId: number,
  transaction: Transaction
) => {
  const projectFrameworkId = (await sequelize.query(
    `SELECT id FROM projects_frameworks WHERE project_id = :project_id AND framework_id = 1`,
    {
      replacements: { project_id: projectId },
      transaction,
    }
  )) as [{ id: number }[], number];
  const assessmentDeleted = await deleteAssessmentEUByProjectIdQuery(
    projectFrameworkId[0][0].id,
    transaction
  );
  const complianceDeleted = await deleteComplianeEUByProjectIdQuery(
    projectFrameworkId[0][0].id,
    transaction
  );
  const result = await sequelize.query(
    `DELETE FROM projects_frameworks WHERE project_id = :project_id AND framework_id = 1 RETURNING *`,
    {
      replacements: { project_id: projectId },
      mapToModel: true,
      model: ProjectFrameworksModel,
      type: QueryTypes.DELETE,
      transaction,
    }
  );
  return result.length > 0 && assessmentDeleted && complianceDeleted;
};
