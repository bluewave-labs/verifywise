// Purpose: Driver to insert mock data into the database.

import { Assessments } from "../mocks/assessment.mock.data";
import { mockControls } from "../mocks/control.mock.data";
import { ControlCategories } from "../mocks/controlCategory.mock.data";
import Projects from "../mocks/project.mock.data";
import mockProjectRisks from "../mocks/projectRisks.mock.data";
import { projectScopes } from "../mocks/projectScope.mock.data";
import { questions } from "../mocks/question.mock.data";
import { roles } from "../mocks/role.mock.data";
import { subcontrols } from "../mocks/subcontrol.mock.data";
import { subtopics } from "../mocks/subtopic.mock.data";
import { topics } from "../mocks/topic.mock.data";
import { users } from "../mocks/users.data";
import { vendors } from "../mocks/vendor.mock.data";
import mockVendorRisks from "../mocks/vendorRisk.mock.data";
import { vendorsProjects } from "../mocks/vendorsProjects.mock.data";

import { Assessment } from "../models/assessment.model";
import { Control } from "../models/control.model";
import { ControlCategory } from "../models/controlCategory.model";
import { File } from "../models/file.model";
import { Project } from "../models/project.model";
import { ProjectRisk } from "../models/projectRisk.model";
import { ProjectScope } from "../models/projectScope.model";
import { Question } from "../models/question.model";
import { Role } from "../models/role.model";
import { Subcontrol } from "../models/subcontrol.model";
import { Subtopic } from "../models/subtopic.model";
import { Topic } from "../models/topic.model";
import { User } from "../models/user.model";
import { Vendor } from "../models/vendor.model";
import { VendorRisk } from "../models/vendorRisk.model";
import { VendorsProjects } from "../models/vendorsProjects.model";

import {
  deleteExistingData,
  checkTableExists,
  createTable,
  insertData,
  dropTable,
  checkDataExists,
  getDEMOProjects,
} from "../utils/autoDriver.util";
import { deleteProjectByIdQuery } from "../utils/project.utils";

const insertQuery = {
  roles: {
    mockData: roles,
    tableName: "roles",
    insertString: "INSERT INTO roles(name, description) VALUES ",
    generateValuesString: function (role: Role) {
      return `(
        'DEMO - ${role.name}',
        '${role.description}'
      )`;
    },
  },
  users: {
    mockData: users,
    tableName: "users",
    insertString:
      "INSERT INTO users(name, surname, email, password_hash, role, created_at, last_login) VALUES ",
    generateValuesString: function (user: User) {
      return `(
        'DEMO - ${user.name}',
        '${user.surname}',
        '${user.email}',
        '${user.password_hash}',
        ${user.role},
        '${user.created_at.toISOString().split("T")[0]}',
        '${user.last_login.toISOString().split("T")[0]}'
      )`;
    },
  },
  projects: {
    mockData: Projects,
    tableName: "projects",
    insertString:
      "INSERT INTO projects(project_title, owner, members, start_date, ai_risk_classification, type_of_high_risk_role, goal, last_updated, last_updated_by) VALUES ",
    generateValuesString: function (project: Project) {
      return `(
        'DEMO - ${project.project_title}',
        '${project.owner}',
        '{${project.members}}',
        '${project.start_date.toISOString().split("T")[0]}',
        '${project.ai_risk_classification}',
        '${project.type_of_high_risk_role}',
        '${project.goal}',
        '${project.last_updated.toISOString().split("T")[0]}',
        '${project.last_updated_by}'
      )`;
    },
  },
  vendors: {
    mockData: vendors,
    tableName: "vendors",
    insertString:
      "INSERT INTO vendors(vendor_name, assignee, vendor_provides, website, vendor_contact_person, review_result, review_status, reviewer, risk_status, review_date, risk_description, impact_description, impact, probability, action_owner, action_plan, risk_severity, risk_level, likelihood) VALUES ",
    generateValuesString: function (vendor: Vendor) {
      return `(
        'DEMO - ${vendor.vendorName}',
        '${vendor.assignee}',
        '${vendor.vendorProvides}',
        '${vendor.website}',
        '${vendor.vendorContactPerson}',
        '${vendor.reviewResult}',
        '${vendor.reviewStatus}',
        '${vendor.reviewer}',
        '${vendor.riskStatus}',
        '${vendor.reviewDate.toISOString().split("T")[0]}',
        '${vendor.riskDescription}',
        '${vendor.impactDescription}',
        ${vendor.impact},
        '${vendor.probability}',
        '${vendor.actionOwner}',
        '${vendor.actionPlan}',
        ${vendor.riskSeverity},
        '${vendor.riskLevel}',
        '${vendor.likelihood}'
      )`;
    },
  },
  assessments: {
    mockData: Assessments,
    tableName: "assessments",
    insertString: "INSERT INTO assessments(project_id) VALUES ",
    generateValuesString: function (assessment: Assessment) {
      return `(
        '${assessment.project_id}'
      )`;
    },
  },
  controlCategories: {
    mockData: ControlCategories,
    tableName: "controlcategories",
    insertString: "INSERT INTO controlcategories(project_id, title) VALUES ",
    generateValuesString: function (controlCategory: ControlCategory) {
      return `(
        '${controlCategory.project_id}',
        'DEMO - ${controlCategory.title}'
      )`;
    },
  },
  mockControls: {
    mockData: mockControls,
    tableName: "controls",
    insertString:
      `INSERT INTO controls(
        title, description, order_no,
        status, approver, risk_review, 
        owner, reviewer, due_date, 
        implementation_details, control_category_id) VALUES `,
    generateValuesString: function (control: Control) {
      return `(
        '${control.title}',
        '${control.description}',
        ${control.order_no},
        '${control.status}',
        '${control.approver}',
        '${control.risk_review}',
        '${control.owner}',
        '${control.reviewer}',
        '${control.due_date!.toISOString().split("T")[0]}',
        'DEMO - ${control.implementation_details}',
        ${control.control_category_id}
      )`;
    },
  },
  subcontrols: {
    mockData: subcontrols,
    tableName: "subcontrols",
    insertString:
      `INSERT INTO subcontrols(
        title, description, order_no, 
        status, approver, risk_review, 
        owner, reviewer, due_date, 
        implementation_details, evidence_description, feedback_description, 
        evidence_files, feedback_files, control_id) VALUES `,
    generateValuesString: function (subControl: Subcontrol) {
      return `(
        '${subControl.title}',
        '${subControl.description}',
        ${subControl.order_no},
        '${subControl.status}',
        '${subControl.approver}',
        '${subControl.risk_review}',
        '${subControl.owner}',
        '${subControl.reviewer}',
        '${subControl.due_date!.toISOString().split("T")[0]}',
        'DEMO - ${subControl.implementation_details}',
        '${subControl.evidence_description}',
        '${subControl.feedback_description}',
        ARRAY[]::TEXT[],
        ARRAY[]::TEXT[],
        '${subControl.control_id}'
      )`;
    },
  },
  mockProjectRisks: {
    mockData: mockProjectRisks,
    tableName: "projectrisks",
    insertString:
      "INSERT INTO projectrisks(project_id, risk_name, risk_owner, ai_lifecycle_phase, risk_description, risk_category, impact, assessment_mapping, controls_mapping, likelihood, severity, risk_level_autocalculated, review_notes, mitigation_status, current_risk_level, deadline, mitigation_plan, implementation_strategy, mitigation_evidence_document, likelihood_mitigation, risk_severity, final_risk_level, risk_approval, approval_status, date_of_assessment) VALUES ",
    generateValuesString: function (projectRisk: ProjectRisk) {
      return `(
        '${projectRisk.project_id}',
        'DEMO - ${projectRisk.risk_name}',
        '${projectRisk.risk_owner}',
        '${projectRisk.ai_lifecycle_phase}',
        '${projectRisk.risk_description}',
        '${projectRisk.risk_category}',
        '${projectRisk.impact}',
        '${projectRisk.assessment_mapping}',
        '${projectRisk.controls_mapping}',
        '${projectRisk.likelihood}',
        '${projectRisk.severity}',
        '${projectRisk.risk_level_autocalculated}',
        '${projectRisk.review_notes}',
        '${projectRisk.mitigation_status}',
        '${projectRisk.current_risk_level}',
        '${projectRisk.deadline.toISOString().split("T")[0]}',
        '${projectRisk.mitigation_plan}',
        '${projectRisk.implementation_strategy}',
        '${projectRisk.mitigation_evidence_document}',
        '${projectRisk.likelihood_mitigation}',
        '${projectRisk.risk_severity}',
        '${projectRisk.final_risk_level}',
        '${projectRisk.risk_approval}',
        '${projectRisk.approval_status}',
        '${projectRisk.date_of_assessment.toISOString().split("T")[0]}'
      )`;
    },
  },
  mockVendorRisks: {
    mockData: mockVendorRisks,
    tableName: "vendorrisks",
    insertString:
      "INSERT INTO vendorrisks(project_id, vendor_name, risk_name, owner, risk_level, review_date) VALUES ",
    generateValuesString: function (vendorRisk: VendorRisk) {
      return `(
        '${vendorRisk.project_id}',
        'DEMO - ${vendorRisk.vendor_name}',
        '${vendorRisk.risk_name}',
        '${vendorRisk.owner}',
        '${vendorRisk.risk_level}',
        '${vendorRisk.review_date.toISOString().split("T")[0]}'
      )`;
    },
  },
  projectScopes: {
    mockData: projectScopes,
    tableName: "projectscopes",
    insertString:
      "INSERT INTO projectscopes(assessment_id, describe_ai_environment, is_new_ai_technology, uses_personal_data, project_scope_documents, technology_type, has_ongoing_monitoring, unintended_outcomes, technology_documentation) VALUES ",
    generateValuesString: function (projectScope: ProjectScope) {
      return `(
        '${projectScope.assessmentId}',
        'DEMO - ${projectScope.describeAiEnvironment}',
        '${projectScope.isNewAiTechnology}',
        '${projectScope.usesPersonalData}',
        '${projectScope.projectScopeDocuments}',
        '${projectScope.technologyType}',
        '${projectScope.hasOngoingMonitoring}',
        '${projectScope.unintendedOutcomes}',
        '${projectScope.technologyDocumentation}'
      )`;
    },
  },
  topics: {
    mockData: topics,
    tableName: "topics",
    insertString: "INSERT INTO topics(assessment_id, title, order_no) VALUES ",
    generateValuesString: function (topic: Topic) {
      return `(${topic.assessment_id}, 'DEMO - ${topic.title}', ${topic.order_no})`;
    },
  },
  subtopics: {
    mockData: subtopics,
    tableName: "subtopics",
    insertString: "INSERT INTO subtopics(topic_id, title, order_no) VALUES ",
    generateValuesString: function (subTopic: Subtopic) {
      return `(
        ${subTopic.topic_id},
        'DEMO - ${subTopic.title}',
        ${subTopic.order_no}
      )`;
    },
  },
  questions: {
    mockData: questions,
    tableName: "questions",
    insertString:
      `INSERT INTO questions(subtopic_id, question, 
        answer_type, evidence_required, hint, 
        is_required, priority_level, evidence_files,
        dropdown_options, answer, input_type, order_id) VALUES `,
    generateValuesString: function (question: Question) {
      return `(
        ${question.subtopic_id},
        'DEMO - ${question.question}',
        '${question.answer_type}',
        ${question.evidence_required},
        '${question.hint}',
        ${question.is_required},
        '${question.priority_level}',
        ARRAY[]::TEXT[],
        ARRAY[]::TEXT[],
        '${question.answer}',
        '${question.input_type}',
        ${question.order_no}
      )`;
    },
  },
  files: {
    mockData: [] as File[],
    tableName: "files",
    insertString: "INSERT INTO files(filename, content) VALUES ",
    generateValuesString: (file: File) => {
      return `(
        '${file.filename}',
        '${file.content}'
      )`;
    },
  },
  vendorsProjects: {
    mockData: vendorsProjects,
    tableName: "vendors_projects",
    insertString: "INSERT INTO vendors_projects(vendor_id, project_id) VALUES ",
    generateValuesString: (vendors_projects: VendorsProjects) => {
      return `(
        '${vendors_projects.vendor_id}',
        '${vendors_projects.project_id}'
      )`;
    },
  },
};

export async function insertMockData() {
  // var {
  //   mockData: roleMockData,
  //   tableName,
  //   insertString,
  //   generateValuesString: roleGenerateValuesString,
  // } = insertQuery["roles"];
  // let roles;
  // if (roleMockData.length !== 0) {
  //   const values = roleMockData.map((d) => roleGenerateValuesString(d as any));
  //   insertString += values.join(",") + "RETURNING id;";
  //   roles = await insertData(insertString as string);
  // }

  var {
    mockData: userMockData,
    tableName,
    insertString,
    generateValuesString: userGenerateValuesString,
  } = insertQuery["users"];
  let users;
  if (userMockData.length !== 0) {
    const values = userMockData(1, 2, 3, 4).map((d) => userGenerateValuesString(d as any));
    insertString += values.join(",") + "RETURNING id;";
    users = await insertData(insertString as string);
  }

  var {
    mockData: projectMockData,
    tableName,
    insertString,
    generateValuesString: projectGenerateValuesString,
  } = insertQuery["projects"];
  let projects;
  if (projectMockData.length !== 0) {
    const values = projectMockData(users![0].id, users![1].id).map((d) => projectGenerateValuesString(d as any));
    insertString += values.join(",") + "RETURNING id;";
    projects = await insertData(insertString as string);
  }

  var {
    mockData: vendorMockData,
    tableName,
    insertString,
    generateValuesString: vendorGenerateValuesString,
  } = insertQuery["vendors"];
  let vendors;
  if (vendorMockData.length !== 0) {
    const values = vendorMockData.map((d) => vendorGenerateValuesString(d as any));
    insertString += values.join(",") + "RETURNING id;";
    vendors = await insertData(insertString as string);
  }

  var {
    mockData: vendorsProjectsMockData,
    tableName,
    insertString,
    generateValuesString: vendorsProjectsGenerateValuesString,
  } = insertQuery["vendorsProjects"];
  let vendorsProjects;
  if (vendorsProjectsMockData.length !== 0) {
    const values = vendorsProjectsMockData(
      vendors![0].id,
      vendors![1].id,
      vendors![2].id,
      vendors![3].id,
      projects![0].id,
      projects![1].id
    ).map((d) => vendorsProjectsGenerateValuesString(d as any));
    insertString += values.join(",") + ";";
    vendorsProjects = await insertData(insertString as string);
  }

  var {
    mockData: assessmentMockData,
    tableName,
    insertString,
    generateValuesString: assessmentGenerateValuesString,
  } = insertQuery["assessments"];
  let assessments;
  if (assessmentMockData.length !== 0) {
    const values = assessmentMockData(projects![0].id, projects![1].id).map((d) => assessmentGenerateValuesString(d as any));
    insertString += values.join(",") + "RETURNING id;";
    assessments = await insertData(insertString as string);
  }

  var {
    mockData: controlCategoriesMockData,
    tableName,
    insertString,
    generateValuesString: controlCategoriesGenerateValuesString,
  } = insertQuery["controlCategories"];
  let controlCategories;
  if (controlCategoriesMockData.length !== 0) {
    const values = controlCategoriesMockData(projects![0].id, projects![1].id).map((d) => controlCategoriesGenerateValuesString(d as any));
    insertString += values.join(",") + "RETURNING id;";
    controlCategories = await insertData(insertString as string);
  }

  var {
    mockData: controlMockData,
    tableName,
    insertString,
    generateValuesString: controlGenerateValuesString,
  } = insertQuery["mockControls"];
  let controls;
  if (controlMockData.length !== 0) {
    const values = controlMockData(controlCategories![0].id, controlCategories![1].id).map((d) => controlGenerateValuesString(d as any));
    insertString += values.join(",") + "RETURNING id;";
    controls = await insertData(insertString as string);
  }

  var {
    mockData: subControlMockData,
    tableName,
    insertString,
    generateValuesString: subControlGenerateValuesString,
  } = insertQuery["subcontrols"];
  let subControls;
  if (controlMockData.length !== 0) {
    const values = subControlMockData(
      controls![0].id,
      controls![1].id,
      controls![2].id,
      controls![3].id,
      controls![4].id,
      controls![5].id,
    ).map((d) => subControlGenerateValuesString(d as any));
    insertString += values.join(",") + "RETURNING id;";
    subControls = await insertData(insertString as string);
  }

  var {
    mockData: projectRisksMockData,
    tableName,
    insertString,
    generateValuesString: projectRisksGenerateValuesString,
  } = insertQuery["mockProjectRisks"];
  let projectRisks;
  if (controlMockData.length !== 0) {
    const values = projectRisksMockData(
      projects![0].id,
    ).map((d) => projectRisksGenerateValuesString(d as any));
    insertString += values.join(",") + "RETURNING id;";
    projectRisks = await insertData(insertString as string);
  }

  var {
    mockData: vendorRisksMockData,
    tableName,
    insertString,
    generateValuesString: vendorRisksGenerateValuesString,
  } = insertQuery["mockVendorRisks"];
  let vendorRisks;
  if (controlMockData.length !== 0) {
    const values = vendorRisksMockData(
      projects![0].id,
      projects![0].id,
    ).map((d) => vendorRisksGenerateValuesString(d as any));
    insertString += values.join(",") + "RETURNING id;";
    vendorRisks = await insertData(insertString as string);
  }

  var {
    mockData: projectScopeMockData,
    tableName,
    insertString,
    generateValuesString: projectScopeGenerateValuesString,
  } = insertQuery["projectScopes"];
  let projectScopes;
  if (projectScopeMockData.length !== 0) {
    const values = projectScopeMockData(assessments![0].id).map((d) => projectScopeGenerateValuesString(d as any));
    insertString += values.join(",") + "RETURNING id;";
    projectScopes = await insertData(insertString as string);
  }

  var {
    mockData: topicMockData,
    tableName,
    insertString,
    generateValuesString: topicGenerateValuesString,
  } = insertQuery["topics"];
  let topics;
  if (topicMockData.length !== 0) {
    const values = topicMockData(assessments![0].id, assessments![1].id).map((d) => topicGenerateValuesString(d as any));
    insertString += values.join(",") + "RETURNING id;";
    topics = await insertData(insertString as string);
  }

  var {
    mockData: subTopicMockData,
    tableName,
    insertString,
    generateValuesString: subTopicGenerateValuesString,
  } = insertQuery["subtopics"];
  let subTopics;
  if (subTopicMockData.length !== 0) {
    const values = subTopicMockData(topics!.map(t => t.id)).map((d) => subTopicGenerateValuesString(d as any));
    insertString += values.join(",") + "RETURNING id;";
    subTopics = await insertData(insertString as string);
  }

  var {
    mockData: questionMockData,
    tableName,
    insertString,
    generateValuesString: questionGenerateValuesString,
  } = insertQuery["questions"];
  let questions;
  if (questionMockData.length !== 0) {
    const values = questionMockData(subTopics!.map(s => s.id)).map((d) => questionGenerateValuesString(d as any));
    insertString += values.join(",") + "RETURNING id;";
    questions = await insertData(insertString as string);
  }
}

export async function deleteMockData() {
  const projects = await getDEMOProjects()
  for (let project of projects) {
    await deleteProjectByIdQuery(project.id)
  };
  await deleteExistingData("vendors", "vendor_name");
  await deleteExistingData("users", "name");
  // await deleteExistingData("roles", "name");
}
