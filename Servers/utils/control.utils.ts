import { Control } from "../models/control.model";
import pool from "../database/db";
import { createNewSubControlsQuery } from "./subControl.utils";

export const getAllControlsQuery = async (): Promise<Control[]> => {
  const controls = await pool.query("SELECT * FROM controls");
  return controls.rows;
};

export const getControlByIdQuery = async (
  id: number
): Promise<Control | null> => {
  const result = await pool.query("SELECT * FROM controls WHERE id = $1", [id]);
  return result.rows.length ? result.rows[0] : null;
};

export const getAllControlsByControlGroupQuery = async (
  controlGroupId: any
): Promise<Control[]> => {
  const controls = await pool.query(
    "SELECT * FROM controls WHERE control_category_id = $1",
    [controlGroupId]
  );
  return controls.rows;
};

export const getControlByIdAndControlTitleAndControlDescriptionQuery = async (
  id: number,
  controlTitle: string,
  controlDescription: string
): Promise<Control | null> => {
  const result = await pool.query(
    "SELECT * FROM controls WHERE control_category_id = $1 AND control_title = $2 AND control_description = $3",
    [id, controlTitle, controlDescription]
  );
  return result.rows.length ? result.rows[0] : null;
};

export const createNewControlQuery = async (control: Partial<Control>): Promise<Control> => {
  const result = await pool.query(
    `INSERT INTO controls (
      title, description, order_no, status, approver, risk_review, owner, reviewer, due_date, implementation_details, control_category_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
    [
      control.title,
      control.description,
      control.orderNo,
      control.status,
      control.approver,
      control.riskReview,
      control.owner,
      control.reviewer,
      control.dueDate,
      control.implementationDetails,
      control.controlCategoryId,
    ]
  );
  return result.rows[0];
};

export const updateControlByIdQuery = async (
  id: number,
  control: Partial<Control>
): Promise<Control | null> => {
  console.log("updateControlById", id, control);
  const fields = [];
  const values = [];
  let query = "UPDATE controls SET ";
  if (control.title !== undefined) {
    fields.push(`title = $${fields.length + 1}`);
    values.push(control.title);
  }
  if (control.description !== undefined) {
    fields.push(`description = $${fields.length + 1}`);
    values.push(control.description);
  }
  if (control.orderNo !== undefined) {
    fields.push(`order_no = $${fields.length + 1}`);
    values.push(control.orderNo);
  }
  if (control.status !== undefined) {
    fields.push(`status = $${fields.length + 1}`);
    values.push(control.status);
  }
  if (control.approver !== undefined) {
    fields.push(`approver = $${fields.length + 1}`);
    values.push(control.approver);
  }
  if (control.riskReview !== undefined) {
    fields.push(`risk_review = $${fields.length + 1}`);
    values.push(control.riskReview);
  }
  if (control.owner !== undefined) {
    fields.push(`owner = $${fields.length + 1}`);
    values.push(control.owner);
  }
  if (control.reviewer !== undefined) {
    fields.push(`reviewer = $${fields.length + 1}`);
    values.push(control.reviewer);
  }
  if (control.dueDate !== undefined) {
    fields.push(`due_date = $${fields.length + 1}`);
    values.push(control.dueDate);
  }
  if (control.implementationDetails !== undefined) {
    fields.push(`implementation_details = $${fields.length + 1}`);
    values.push(control.implementationDetails);
  }
  if (control.controlCategoryId !== undefined) {
    fields.push(`control_category_id = $${fields.length + 1}`);
    values.push(control.controlCategoryId);
  }

  query += fields.join(", ");
  query += ` WHERE id = ${id} RETURNING *`;

  const result = await pool.query(query, values);
  return result.rows.length ? result.rows[0] : null;
};

export const deleteControlByIdQuery = async (
  id: number
): Promise<Control | null> => {
  console.log("deleteControlById", id);
  const result = await pool.query(
    "DELETE FROM controls WHERE id = $1 RETURNING *",
    [id]
  );
  return result.rows.length ? result.rows[0] : null;
};

const controlTitlesAndDescriptions = [
  {
    order_no: 1,
    title: "AI Literacy and Responsible AI Training",
    description: "Develop the AI literacy of staff and others who operate or use AI systems on behalf of the organization."
  },
  {
    order_no: 2,
    title: "Regulatory Training and Response Procedures",
    description: "Train personnel on regulatory requirements and procedures for responding to authority requests."
  },
  {
    order_no: 1,
    title: "Intended Use Description",
    description:
      "Review and verify technical documentation from AI system providers.",
  },
  {
    order_no: 2,
    title: "Technical Documentation Review",
    description:
      "Review and verify technical documentation from AI system providers.",
  },
  {
    order_no: 3,
    title: "Record Maintenance of AI System Activities",
    description:
      "Maintain accurate records of all AI system activities, including modifications and third-party involvements.",
  },
  {
    order_no: 4,
    title: "System Information Documentation",
    description:
      "Document all information about the AI system, including its capabilities, limitations, and any relevant technical details.",
  },
  {
    order_no: 5,
    title: "Dataset Description",
    description:
      "Describe training, validation, and testing datasets used in AI systems.",
  },
  {
    order_no: 6,
    title: "Mitigation Strategies and Bias Testing",
    description:
      "Explain mitigation strategies and document bias testing results.",
  },
  {
    order_no: 7,
    title: "AI System Accuracy and Security Information",
    description:
      "Provide accuracy metrics, robustness, and cybersecurity information for AI systems.",
  },
  {
    order_no: 1,
    title: "Human Intervention Mechanisms",
    description: "Assign competent individuals with authority to oversee AI system usage.",
  },
  {
    order_no: 2,
    title: "Oversight Documentation",
    description: "Document system limitations and human oversight options.",
  },
  {
    order_no: 3,
    title: "Oversight Documentation",
    description: "Ensure clear communication of AI system capabilities, limitations, and risks to human operators.",
  },
  {
    order_no: 1,
    title: "Proportionate Oversight Measures",
    description:
      "Take prompt and effective corrective actions for non-conforming high-risk AI systems and ensure ongoing system value post-deployment.",
  },
  {
    order_no: 2,
    title: "System Validation and Reliability Documentation",
    description:
      "Demonstrate and document the system''s validity, reliability, and standards compliance.",
  },
  {
    order_no: 3,
    title: "Prompt Corrective Actions Implementation",
    description:
      "Implement corrective actions promptly and effectively to address identified risks or issues.",
  },
  {
    order_no: 4,
    title: "Documentation of Corrective Actions",
    description:
      "Maintain documentation of corrective actions taken.",
  },
  {
    order_no: 1,
    title:
      "Conduct thorough due diligence before associating with high-risk AI systems.",
    description:
      "Define and allocate responsibilities among distributors, importers, deployers, and third parties to ensure compliance with AI regulations.",
  },
  {
    order_no: 2,
    title:
      "Conduct thorough due diligence before associating with high-risk AI systems.",
    description:
      "Establish clear contractual agreements with AI system providers.",
  },
  {
    order_no: 3,
    title:
      "Conduct thorough due diligence before associating with high-risk AI systems.",
    description:
      "Define responsibilities in agreements with third-party suppliers of AI components.",
  },
  {
    order_no: 4,
    title:
      "Conduct thorough due diligence before associating with high-risk AI systems.",
    description:
      "Specify information, technical access, and support required for regulatory compliance.",
  },
  {
    order_no: 5,
    title:
      "Conduct thorough due diligence before associating with high-risk AI systems.",
    description:
      "We ensure third-party impacts, such as IP infringement, meet organizational standards.",
  },
  {
    order_no: 6,
    title:
      "AI System Deactivation Mechanisms",
    description:
      "Maintain mechanisms to deactivate AI systems if performance deviates from intended use.",
  },
  {
    order_no: 7,
    title:
      "Incident Monitoring for Third-Party Components",
    description:
      "Monitor and respond to incidents involving third-party components.",
  },
  {
    order_no: 8,
    title:
      "Incident Monitoring for Third-Party Components",
    description:
      "Implement measures to enhance AI system resilience against errors and faults.",
  },
  {
    order_no: 9,
    title:
      "Incident Monitoring for Third-Party Components",
    description:
      "Identify and assess potential non-conformities with regulations.",
  },
  {
    order_no: 1,
    title: "AI Act Compliance Policies and Guidelines",
    description:
      "Assign technical and organizational measures, along with human oversight, to ensure compliance with AI regulations and manage associated risks.",
  },
  {
    order_no: 2,
    title: "AI Risk Response Planning",
    description:
      "Plan responses to AI system risks, including defining risk tolerance and mitigation strategies.",
  },
  {
    order_no: 3,
    title: "Compliance with AI System Instructions",
    description:
      "Regularly evaluate transparency and accountability issues related to AI systems.",
  },
  {
    order_no: 4,
    title: "System Risk Controls Documentation",
    description:
      "Document system risk controls, including those for third-party components.",
  },
  {
    order_no: 5,
    title: "Transparency and Explainability Evaluation",
    description:
      "Regularly update compliance measures based on system or regulatory changes.",
  },
  {
    order_no: 6,
    title: "Transparency and Explainability Evaluation",
    description:
      "Explain AI models to ensure responsible use and maintain an AI systems repository.",
  },
  {
    order_no: 7,
    title: "Transparency and Explainability Evaluation",
    description:
      "Maintain and update technical documentation reflecting AI system changes.",
  },
  {
    order_no: 8,
    title: "Transparency and Explainability Evaluation",
    description:
      "Assess the relevance and representativeness of input data used for AI system training and operation.",
  },
  {
    order_no: 9,
    title: "AI System Logging Implementation",
    description:
      "Implement automatic logging of AI system operations and retain logs appropriately.",
  },
  {
    order_no: 1,
    title: "Fundamental Rights Impact Assessment Process Development",
    description:
      "Conduct assessments to evaluate AI systems'' impact on fundamental rights and notify authorities of findings.",
  },
  {
    order_no: 2,
    title: "AI System Usage Process Description",
    description:
      "Describe deployer processes for using high-risk AI systems, outlining intended purposes.",
  },
  {
    order_no: 3,
    title: "Impacted Groups Identification",
    description:
      "Identify all categories of natural persons and groups potentially affected by AI system usage.",
  },
  {
    order_no: 4,
    title: "Data Assessment",
    description:
      "Assess data provided to or acquired by AI systems based on legal definitions (e.g., GDPR Article 3 (32)).",
  },
  {
    order_no: 5,
    title: "Impact Measurement Strategy",
    description:
      "Develop and periodically re-evaluate strategies for measuring AI system impacts, including monitoring unexpected impacts.",
  },
  {
    order_no: 6,
    title: "Bias and Fairness Evaluation",
    description:
      "Develop and periodically re-evaluate strategies for measuring AI system impacts, including monitoring unexpected impacts.",
  },
  {
    order_no: 7,
    title: "Assessment Process Documentation",
    description:
      "Document identified risks and their potential impacts on affected individuals and groups.",
  },
  {
    order_no: 8,
    title: "Assessment Process Documentation",
    description:
      "Maintain documentation of the fundamental rights impact assessment process.",
  },
  {
    order_no: 9,
    title: "Assessment Process Documentation",
    description:
      "Integrate fundamental rights impact assessments with existing data protection impact assessments.",
  },
  {
    order_no: 10,
    title: "Assessment Process Documentation",
    description:
      "Regularly evaluate bias and fairness issues related to AI systems.",
  },
  {
    order_no: 1,
    title: "User Notification of AI System Use",
    description:
      "Ensure clear communication that users are interacting with AI systems and provide comprehensive information about AI system functionalities and impacts.",
  },
  {
    order_no: 2,
    title: "Clear AI Indication for Users",
    description:
      "Ensure AI indications are clear and understandable for reasonably informed users.",
  },
  {
    order_no: 3,
    title: "AI System Scope and Impact Definition",
    description:
      "Define and document AI system scope, goals, methods, and potential impacts.",
  },
  {
    order_no: 4,
    title: "AI System Scope and Impact Definition",
    description:
      "Maintain accurate records of AI system activities, including modifications and third-party involvements.",
  },
  {
    order_no: 1,
    title: "EU Database Registration",
    description:
      "Register providers, authorized representatives, and deployers, along with their AI systems, in the EU database as required by the AI Act.",
  },
  {
    order_no: 2,
    title: "Conformity Assessment Completion",
    description:
      "Complete relevant conformity assessment procedures for AI systems.",
  },
  {
    order_no: 3,
    title: "Conformity Assessment Completion",
    description:
      "Identify necessary technical standards and certifications for AI systems.",
  },
  {
    order_no: 4,
    title: "Conformity Assessment Completion",
    description:
      "To ensure that high-risk AI systems or general-purpose AI models comply with the common specifications established by the Commission.",
  },
  {
    order_no: 5,
    title: "Conformity Assessment Completion",
    description:
      "Comply with common specifications established by the Commission for AI systems.",
  },
  {
    order_no: 6,
    title: "Registration Information Maintenance",
    description:
      "Maintain comprehensive records of high-risk AI systems in the EU database, ensuring compliance with documentation and responsiveness to authorities.",
  },
  {
    order_no: 7,
    title: "Registration Information Maintenance",
    description:
      "Maintain up-to-date registration information and comprehensive conformity documentation.",
  },
  {
    order_no: 1,
    title: "Registration Activity Records Maintenance",
    description:
      "Maintain comprehensive records of high-risk AI systems in the EU database, ensuring compliance with documentation and responsiveness to authorities.",
  },
  {
    order_no: 2,
    title: "Registration Activity Records Maintenance",
    description:
      "Implement and document monitoring systems to track AI system performance and address risks post-deployment.",
  },
  {
    order_no: 3,
    title: "Registration Activity Records Maintenance",
    description:
      "Maintain up-to-date registration information and comprehensive conformity documentation.",
  },
  {
    order_no: 4,
    title: "EU Database Data Entry Timeliness",
    description:
      "Maintain up-to-date registration information and comprehensive conformity documentation.",
  },
  {
    order_no: 1,
    title: "AI Lifecycle Risk Management",
    description:
      "Implement and document monitoring systems to track AI system performance and address risks post-deployment.",
  },
  {
    order_no: 2,
    title: "AI Lifecycle Risk Management",
    description:
      "Establish a system for monitoring AI system operations based on usage instructions.",
  },
  {
    order_no: 3,
    title: "AI Lifecycle Risk Management",
    description:
      "Track and respond to errors and incidents related to AI systems through measurable activities.",
  },
  {
    order_no: 4,
    title: "AI Lifecycle Risk Management",
    description:
      "Consult with domain experts and end-users to inform risk management activities.",
  },
  {
    order_no: 5,
    title: "AI System Change Documentation",
    description:
      "Document changes to AI systems and their performance post-deployment.",
  },
  {
    order_no: 1,
    title: "Unexpected Impact Integration",
    description:
      "Report any serious incidents involving AI systems to relevant market surveillance authorities within specified timeframes.",
  },
  {
    order_no: 2,
    title: "AI Model Capability Assessment",
    description:
      "Conduct comprehensive assessments of AI model capabilities using appropriate tools.",
  },
  {
    order_no: 3,
    title: "Post-Deployment Incident Monitoring",
    description:
      "Monitor incidents related to AI systems and respond post-deployment.",
  },
  {
    order_no: 4,
    title: "AI System Logging Implementation",
    description:
      "Ensure providers implement systems for capturing and storing AI system logs.",
  },
  {
    order_no: 5,
    title: "Serious Incident Immediate Reporting",
    description:
      "Immediately report serious incidents to providers, importers, distributors, and authorities.",
  },
  {
    order_no: 1,
    title: "Unexpected Impact Integration",
    description:
      "Report any serious incidents involving AI systems to relevant market surveillance authorities within specified timeframes.",
  },
  {
    order_no: 2,
    title: "AI Model Capability Assessment",
    description:
      "Conduct comprehensive assessments of AI model capabilities using appropriate tools.",
  },
  {
    order_no: 3,
    title: "Post-Deployment Incident Monitoring",
    description:
      "Monitor incidents related to AI systems and respond post-deployment.",
  },
  {
    order_no: 4,
    title: "AI System Logging Implementation",
    description:
      "Ensure providers implement systems for capturing and storing AI system logs.",
  },
  {
    order_no: 5,
    title: "Serious Incident Immediate Reporting",
    description:
      "Immediately report serious incidents to providers, importers, distributors, and authorities.",
  },
]

const controlsMock = (controlCategoryIds: number[]) => {
  let orderNoCtr = 0
  let controlCategoryCtr = 0
  return [2, 7, 3, 4, 9, 9, 10, 4, 7, 4, 5, 5, 5].flatMap(
    x => {
      let controlCategoryId = controlCategoryIds[controlCategoryCtr++]
      return Array(x).fill({}).flatMap((_) => {
        return {
          title: controlTitlesAndDescriptions[orderNoCtr].title,
          description: controlTitlesAndDescriptions[orderNoCtr].description,
          orderNo: controlTitlesAndDescriptions[orderNoCtr++].order_no,
          controlCategoryId
        }
      })
    }
  )
};

export const createNewControlsQuery = async (controlCategoryIds: number[]) => {
  let query = "INSERT INTO controls(title, description, order_no, control_category_id) VALUES ";
  const data = controlsMock(controlCategoryIds).map((d) => {
    return `('${d.title}', '${d.description}', ${d.orderNo}, ${d.controlCategoryId})`;
  });
  query += data.join(",") + " RETURNING *;";
  const result = await pool.query(query);
  const controls = result.rows;
  const subControls = await createNewSubControlsQuery(
    controls.map((r) => Number(r.id))
  );

  let scPtr = 0,
    cPtr = 0;

  while (scPtr < subControls.length) {
    (controls[cPtr] as any).subcontrols = [];
    while (controls[cPtr].id === (subControls[scPtr] as any)["control_id"]) {
      (controls[cPtr] as any).subcontrols.push(subControls[scPtr]);
      scPtr += 1;
      if (scPtr === subControls.length) break;
    }
    cPtr += 1;
  }
  return controls;
};
