import { Subcontrol } from "../models/subcontrol.model";
import pool from "../database/db";
import { UploadedFile } from "./question.utils";
import { uploadFile } from "./fileUpload.utils";

export const getAllSubcontrolsQuery = async (): Promise<Subcontrol[]> => {
  console.log("getAllSubcontrols");
  const subcontrols = await pool.query("SELECT * FROM subcontrols");
  return subcontrols.rows;
};

export const getAllSubcontrolsByControlIdQuery = async (
  controlId: number
): Promise<Subcontrol[]> => {
  console.log("getAllSubcontrolsByControlId", controlId);
  const subcontrols = await pool.query(
    "SELECT * FROM subcontrols WHERE control_id = $1",
    [controlId]
  );
  return subcontrols.rows;
};

export const getSubcontrolByIdQuery = async (
  id: number
): Promise<Subcontrol | null> => {
  console.log("getSubcontrolById", id);
  const result = await pool.query("SELECT * FROM subcontrols WHERE id = $1", [
    id,
  ]);
  return result.rows.length ? result.rows[0] : null;
};

export const createNewSubcontrolQuery = async (
  controlId: number,
  subcontrol: Partial<Subcontrol>,
  evidenceFiles?: UploadedFile[],
  feedbackFiles?: UploadedFile[]
): Promise<Subcontrol> => {
  let uploadedEvidenceFiles: { id: number; fileName: string }[] = [];
  await Promise.all(
    evidenceFiles!.map(async (file) => {
      const uploadedFile = await uploadFile(file);
      uploadedEvidenceFiles.push({
        id: uploadedFile.id.toString(),
        fileName: uploadedFile.filename,
      });
    })
  );

  let uploadedFeedbackFiles: { id: number; fileName: string }[] = [];
  await Promise.all(
    feedbackFiles!.map(async (file) => {
      const uploadedFile = await uploadFile(file);
      uploadedFeedbackFiles.push({
        id: uploadedFile.id.toString(),
        fileName: uploadedFile.filename,
      });
    })
  );

  const result = await pool.query(
    `INSERT INTO subcontrols (
      control_id, title, description, order_no, status, approver, risk_review, owner, reviewer, due_date, 
      implementation_details, evidence_description, feedback_description, evidenceFiles, feedbackFiles
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`,
    [
      controlId,
      subcontrol.title,
      subcontrol.description,
      subcontrol.orderNo,
      subcontrol.status,
      subcontrol.approver,
      subcontrol.riskReview,
      subcontrol.owner,
      subcontrol.reviewer,
      subcontrol.dueDate,
      subcontrol.implementationDetails,
      subcontrol.evidenceDescription,
      subcontrol.feedbackDescription,
      uploadedEvidenceFiles,
      uploadedFeedbackFiles,
    ]
  );
  return result.rows[0];
};

export const updateSubcontrolByIdQuery = async (
  id: number,
  subcontrol: Partial<Subcontrol>,
  evidenceFiles?: UploadedFile[],
  feedbackFiles?: UploadedFile[]
): Promise<Subcontrol | null> => {
  console.log("updateSubcontrolById", id, subcontrol);

  let uploadedEvidenceFiles: { id: number; fileName: string }[] = [];
  await Promise.all(
    evidenceFiles!.map(async (file) => {
      const uploadedFile = await uploadFile(file);
      uploadedEvidenceFiles.push({
        id: uploadedFile.id.toString(),
        fileName: uploadedFile.filename,
      });
    })
  );

  let uploadedFeedbackFiles: { id: number; fileName: string }[] = [];
  await Promise.all(
    feedbackFiles!.map(async (file) => {
      const uploadedFile = await uploadFile(file);
      uploadedFeedbackFiles.push({
        id: uploadedFile.id.toString(),
        fileName: uploadedFile.filename,
      });
    })
  );

  // control_id, subControlTitle, subControlDescription, status, approver, risk_review, owner, reviewer, due_date,
  //     implementation_details, evidence, feedback, evidenceFiles, feedbackFiles
  const result = await pool.query(
    `UPDATE subcontrols SET 
      control_id = $1, title = $2, description = $3, status = $4, approver = $5, 
      risk_review = $6, owner = $7, reviewer = $8, due_date = $9, implementation_details = $10, evidence_description = $11, 
      feedback_description = $12, evidenceFiles = $13, feedbackFiles = $14, order_no = $15 WHERE id = $16 RETURNING *`,
    [
      subcontrol.controlId,
      subcontrol.title,
      subcontrol.description,
      subcontrol.status,
      subcontrol.approver,
      subcontrol.riskReview,
      subcontrol.owner,
      subcontrol.reviewer,
      subcontrol.dueDate,
      subcontrol.implementationDetails,
      subcontrol.evidenceDescription,
      subcontrol.feedbackDescription,
      uploadedEvidenceFiles,
      uploadedFeedbackFiles,
      subcontrol.orderNo,
      id,
    ]
  );
  return result.rows.length ? result.rows[0] : null;
};

export const deleteSubcontrolByIdQuery = async (
  id: number
): Promise<Subcontrol | null> => {
  console.log("deleteSubcontrolById", id);
  const result = await pool.query(
    "DELETE FROM subcontrols WHERE id = $1 RETURNING *",
    [id]
  );
  return result.rows.length ? result.rows[0] : null;
};

const subControlTitlesAndDescriptions = [
  {
    order_no: 1,
    title:
      "We ensure executive leadership takes responsibility for decisions related to AI risks",
    description:
      "Leadership is accountable for oversight and strategic decisions regarding AI risks, ensuring alignment with compliance.",
  },
  {
    order_no: 2,
    title:
      "We provide AI literacy and ethics training to relevant personnel.",
    description:
      "Training equips employees to responsibly manage and understand AI systems, fostering ethics and legal adherence.",
  },
  {
    order_no: 3,
    title:
      "We develop a clear and concise communication plan for informing workers about the use of high-risk AI systems in the workplace.",
    description:
      "A concise plan ensures employees are informed of AI system impacts in their workplace roles and rights.",
  },
  {
    order_no: 1,
    title:
      "We clearly define roles and responsibilities related to AI risk management.",
    description:
      "Roles and responsibilities streamline risk management and assign clear accountability for compliance efforts.",
  },
  {
    order_no: 2,
    title:
      "We train personnel on the requirements of the regulation and the process for responding to requests from competent authorities.",
    description:
      "Personnel training ensures efficient regulatory responses and familiarity with legal requirements for AI systems.",
  },
  {
    order_no: 1,
    title:
      "We provide detailed descriptions of the AI system''s intended use.",
    description:
      "Describing intended use prevents misuse, aligning AI deployment with specified legal and ethical boundaries.",
  },
  {
    order_no: 1,
    title: "We review and verify technical documentation from providers.",
    description:
      "Reviewing documentation confirms provider accuracy and ensures adherence to standards and compliance needs.",
  },
  {
    order_no: 1,
    title:
      "We maintain accurate records of all AI system activities, including modifications and third-party involvements.",
    description:
      "Accurate records enhance traceability, support audits, and provide accountability for AI system activities.",
  },
  {
    order_no: 1,
    title:
      "We document system information, including functionality, limitations, and risk controls.",
    description:
      "System documentation clarifies operations, limitations, and controls, aiding informed decision-making and safety.",
  },
  {
    order_no: 2,
    title:
      "We define and document forbidden uses and foresee potential misuse.",
    description:
      "Defining forbidden uses helps anticipate misuse and mitigate risks proactively for safe AI applications.",
  },
  {
    order_no: 1,
    title: "We describe training, validation, and testing datasets used.",
    description:
      "Dataset descriptions provide transparency in training, validation, and testing, ensuring alignment with standards.",
  },
  {
    order_no: 1,
    title: "We explain mitigation strategies and bias testing results.",
    description:
      "Explaining bias testing and mitigation highlights fairness measures and prevents harmful or unethical outcomes.",
  },
  {
    order_no: 1,
    title:
      "We provide accuracy metrics, robustness, and cybersecurity information.",
    description:
      "Providing metrics ensures systems meet robustness and security criteria while fostering trust through transparency.",
  },
  {
    order_no: 1,
    title:
      "We define mechanisms for human intervention or override of AI outputs.",
    description:
      "Human intervention mechanisms ensure appropriate oversight, preventing harmful or unintended AI outcomes.",
  },
  {
    order_no: 2,
    title:
      "We assign competent individuals with authority to oversee AI system usage.",
    description:
      "Competent oversight personnel are essential for monitoring and ensuring safe and lawful AI usage.",
  },
  {
    order_no: 3,
    title:
      "We align oversight measures with provider''s instructions for use.",
    description:
      "Aligning measures with provider instructions ensures system use remains within intended boundaries and purposes.",
  },
  {
    order_no: 1,
    title: "We document system limitations and human oversight options.",
    description:
      "Documentation ensures clarity on system boundaries and how human operators can intervene if needed.",
  },
  {
    order_no: 2,
    title: "We establish appeal processes related to AI system decisions.",
    description:
      "Appeals processes provide a structured method for addressing disputes or adverse outcomes from AI system decisions.",
  },
  {
    order_no: 1,
    title:
      "We ensure clear communication of AI system capabilities, limitations, and risks to human operators.",
    description:
      "Clear communication helps operators understand the system’s scope and manage risks effectively.",
  },
  {
    order_no: 2,
    title:
      "We proportion oversight measures to match AI system''s risk level and autonomy.",
    description:
      "Oversight measures are scaled appropriately to reflect the system''s complexity, risk, and decision-making autonomy.",
  },
  {
    order_no: 1,
    title:
      "We consult with diverse experts and end-users to inform corrective measures.",
    description:
      "Consulting experts and end-users ensures corrective measures are comprehensive and address real-world implications.",
  },
  {
    order_no: 1,
    title:
      "We validate and document system reliability and standards compliance.",
    description:
      "Validation and documentation demonstrate that systems operate reliably and meet required compliance standards.",
  },
  {
    order_no: 2,
    title:
      "We sustain AI system value post-deployment through continuous improvements.",
    description:
      "Continuous improvements ensure AI systems remain effective, compliant, and aligned with user needs after deployment.",
  },
  {
    order_no: 1,
    title:
      "We implement corrective actions as required by Article 20 to address identified risks or issues.",
    description:
      "Prompt corrective actions address risks to maintain compliance and prevent harm resulting from system flaws.",
  },
  {
    order_no: 2,
    title:
      "We ensure mechanisms are in place to withdraw, disable, or recall non-conforming AI systems.",
    description:
      "Effective mechanisms ensure non-conforming systems can be removed or disabled to prevent further risks.",
  },
  {
    order_no: 1,
    title: "We maintain documentation of corrective actions taken.",
    description:
      "Detailed records of corrective actions provide accountability and support audits or regulatory reviews.",
  },
  {
    order_no: 1,
    title:
      "We conduct thorough due diligence before associating with high-risk AI systems.",
    description:
      "Comprehensive due diligence ensures third-party AI systems meet legal and ethical standards before adoption.",
  },
  {
    order_no: 1,
    title:
      "We establish clear contractual agreements with AI system providers.",
    description:
      "Contracts define obligations and responsibilities, ensuring all parties comply with AI-related requirements.",
  },
  {
    order_no: 1,
    title:
      "We define responsibilities in agreements with third-party suppliers of AI components.",
    description:
      "Specifying roles and responsibilities prevents gaps in accountability and ensures compliance along the AI supply chain.",
  },
  {
    order_no: 1,
    title:
      "We specify information, technical access, and support required for regulatory compliance.",
    description:
      "Clear specifications for information and support ensure smooth regulatory processes and timely compliance responses.",
  },
  {
    order_no: 1,
    title:
      "We ensure third-party impacts, such as IP infringement, meet organizational standards.",
    description:
      "Third-party compliance with organizational standards prevents risks like intellectual property violations.",
  },
  {
    order_no: 1,
    title:
      "We maintain mechanisms to deactivate AI systems if performance deviates from intended use.",
    description:
      "Deactivation mechanisms ensure systems can be stopped to mitigate risks if they perform outside intended parameters.",
  },
  {
    order_no: 1,
    title:
      "We monitor and respond to incidents involving third-party components.",
    description:
      "Monitoring ensures timely detection and resolution of issues with third-party AI components to maintain compliance.",
  },
  {
    order_no: 1,
    title:
      "We implement measures to enhance AI system resilience against errors and faults.",
    description:
      "Validation and documentation demonstrate that systems operate reliably and meet required compliance standards.",
  },
  {
    order_no: 1,
    title:
      "We identify and assess potential non-conformities with regulations.",
    description:
      "Identifying non-conformities proactively reduces regulatory risks and ensures continued compliance.",
  },
  {
    order_no: 1,
    title:
      "We document roles, responsibilities, and communication lines for AI risk management.",
    description:
      "Clear documentation streamlines accountability and coordination in managing AI-related risks.",
  },
  {
    order_no: 2,
    title: "We develop policies and guidelines for AI Act compliance.",
    description:
      "Policies and guidelines provide a structured framework for meeting AI Act requirements across the organization.",
  },
  {
    order_no: 1,
    title:
      "We plan responses to AI system risks, including defining risk tolerance and mitigation strategies.",
    description:
      "Risk response plans prepare organizations to manage and mitigate AI-related risks effectively and within acceptable limits.",
  },
  {
    order_no: 1,
    title:
      "We implement technical and organizational measures to adhere to AI system instructions for use.",
    description:
      "These measures ensure systems operate within their intended scope and comply with provided instructions.",
  },
  {
    order_no: 2,
    title:
      "We regularly evaluate safety, transparency, accountability, security, and resilience of AI systems.",
    description:
      "Regular evaluations help maintain system integrity and alignment with evolving regulatory and operational standards.",
  },
  {
    order_no: 1,
    title:
      "We conduct thorough legal reviews relevant to AI system deployment.",
    description:
      "Legal reviews ensure AI systems comply with all applicable laws, minimizing regulatory and legal risks.",
  },
  {
    order_no: 2,
    title:
      "We prioritize risk responses based on impact, likelihood, and resources.",
    description:
      "Prioritizing risks helps allocate resources effectively and address the most critical threats first.",
  },
  {
    order_no: 3,
    title: "We identify residual risks to users and stakeholders.",
    description:
      "Identifying residual risks ensures informed decisions about mitigation and system deployment.",
  },
  {
    order_no: 4,
    title:
      "We evaluate if AI systems meet objectives and decide on deployment continuation.",
    description:
      "Regular evaluations verify that systems are achieving their goals and remain suitable for continued use.",
  },
  {
    order_no: 5,
    title: "We implement cybersecurity controls to protect AI models.",
    description:
      "Robust cybersecurity measures safeguard AI systems from breaches, tampering, and malicious exploitation.",
  },
  {
    order_no: 6,
    title:
      "We document system risk controls, including third-party components.",
    description:
      "Comprehensive documentation of risk controls ensures accountability and supports audits or compliance checks.",
  },
  {
    order_no: 1,
    title:
      "We regularly update compliance measures based on system or regulatory changes.",
    description:
      "Ongoing updates ensure compliance measures remain aligned with evolving technologies and legal requirements.",
  },
  {
    order_no: 1,
    title:
      "We explain AI models to ensure responsible use and maintain an AI systems repository.",
    description:
      "Clear explanations of AI models support transparency and facilitate responsible usage across stakeholders.",
  },
  {
    order_no: 1,
    title:
      "We maintain and update technical documentation reflecting system changes.",
    description:
      "Up-to-date documentation ensures accurate representation of system functionalities and compliance status.",
  },
  {
    order_no: 1,
    title: "We assess input data relevance and representativeness.",
    description:
      "Data assessments ensure that AI inputs are appropriate, unbiased, and aligned with the intended purpose.",
  },
  {
    order_no: 1,
    title:
      "We implement automatic logging of AI system operations and retain logs appropriately.",
    description:
      "Automatic logging ensures traceability of system activities, aiding in audits, troubleshooting, and compliance.",
  },
  {
    order_no: 1,
    title:
      "We develop a comprehensive process for fundamental rights impact assessments.",
    description:
      "A structured assessment process identifies and mitigates risks to fundamental rights posed by AI systems.",
  },
  {
    order_no: 1,
    title:
      "We describe deployer processes for using high-risk AI systems, outlining intended purposes.",
    description:
      "Detailed process descriptions ensure transparency in how high-risk systems are deployed and their intended use cases.",
  },
  {
    order_no: 1,
    title:
      "Identify all natural persons and groups potentially affected by AI system usage.",
    description:
      "Identifying impacted individuals and groups helps address potential risks and design systems responsibly.",
  },
  {
    order_no: 1,
    title:
      "We assess data used by AI systems based on legal definitions (e.g., GDPR Article 3 (32)).",
    description:
      "Data assessments ensure compliance with legal frameworks and support ethical use of personal data in AI systems.",
  },
  {
    order_no: 1,
    title:
      "We create and periodically re-evaluate strategies for measuring AI system impacts.",
    description:
      "Re-evaluating strategies ensures continued relevance and effectiveness in managing AI system impacts.",
  },
  {
    order_no: 1,
    title:
      "We regularly evaluate bias, fairness, privacy, and environmental issues related to AI systems.",
    description:
      "Regular evaluations help ensure AI systems are ethical, equitable, and environmentally sustainable.",
  },
  {
    order_no: 1,
    title:
      "We document known or foreseeable risks to health, safety, or fundamental rights.",
    description:
      "Documenting risks provides transparency and helps stakeholders make informed decisions regarding system deployment.",
  },
  {
    order_no: 1,
    title:
      "We maintain assessment documentation, including dates, results, and actions taken.",
    description:
      "Detailed assessment records ensure accountability and facilitate compliance reviews or audits.",
  },
  {
    order_no: 1,
    title:
      "We integrate fundamental rights impact assessments with existing data protection assessments.",
    description:
      "Combining assessments provides a holistic view of risks and ensures consistency across regulatory compliance efforts.",
  },
  {
    order_no: 1,
    title:
      "We specify input data and details about training, validation, and testing datasets.",
    description:
      "Clear documentation of datasets ensures transparency and supports validation of AI system performance.",
  },
  {
    order_no: 2,
    title:
      "We ensure representative evaluations when using human subjects.",
    description:
      "Representative evaluations protect fairness and ensure that findings are applicable across relevant user groups.",
  },
  {
    order_no: 1,
    title:
      "We design AI systems to clearly indicate user interaction with AI.",
    description:
      "Clear indicators help users understand when they are interacting with AI, promoting transparency and trust.",
  },
  {
    order_no: 1,
    title: "We inform users when they are subject to AI system usage.",
    description:
      "Transparent communication ensures users are aware of and consent to AI system interactions affecting them.",
  },
  {
    order_no: 2,
    title:
      "We ensure AI indications are clear and understandable for reasonably informed users.",
    description:
      "Providing clear, simple AI indications allows users to make informed decisions and understand system limitations.",
  },
  {
    order_no: 1,
    title:
      "We define and document AI system scope, goals, methods, and potential impacts.",
    description:
      "Comprehensive documentation helps align AI deployment with intended goals and prepares for potential risks.",
  },
  {
    order_no: 1,
    title:
      "We maintain accurate records of AI system activities, modifications, and third-party involvements.",
    description:
      "Accurate records ensure accountability and support audits, troubleshooting, and regulatory compliance.",
  },
  {
    order_no: 1,
    title: "We complete the relevant conformity assessment procedures.",
    description:
      "Completing assessments ensures that AI systems meet required safety and compliance standards before deployment.",
  },
  {
    order_no: 2,
    title:
      "We verify that high-risk AI systems have the required CE marking.",
    description:
      "CE marking confirms that high-risk AI systems meet EU regulatory requirements, ensuring safety and compliance.",
  },
  {
    order_no: 1,
    title:
      "We ensure AI systems are registered in the EU database per Article 71.",
    description:
      "Registering systems ensures compliance with EU AI Act requirements and facilitates monitoring and transparency.",
  },
  {
    order_no: 1,
    title:
      "We identify necessary technical standards and certifications for AI systems.",
    description:
      "Identifying relevant standards ensures systems are developed and deployed in compliance with industry and legal requirements.",
  },
  {
    order_no: 1,
    title:
      "We comply with common specifications established by the Commission.",
    description:
      "Adhering to common specifications ensures systems meet regulatory benchmarks for safety, reliability, and performance.",
  },
  {
    order_no: 1,
    title: "We keep records of all registration activities and updates.",
    description:
      "Maintaining detailed records supports transparency, accountability, and regulatory compliance during system registration.",
  },
  {
    order_no: 1,
    title: "Ensure timely and accurate data entry into the EU database.",
    description:
      "Accurate and timely data entry ensures compliance with regulatory requirements and keeps the database current.",
  },
  {
    order_no: 1,
    title:
      "We maintain up-to-date registration information and comprehensive conformity documentation.",
    description:
      "Keeping documentation updated ensures alignment with changes in regulations and system configurations.",
  },
  {
    order_no: 1,
    title:
      "We engage with notified bodies or conduct internal conformity assessments.",
    description:
      "Collaboration with notified bodies or conducting internal reviews ensures rigorous evaluation of AI system compliance.",
  },
  {
    order_no: 1,
    title:
      "We establish processes to respond to national authority requests.",
    description:
      "Well-defined processes enable efficient and accurate responses to regulatory inquiries or audits.",
  },
  {
    order_no: 1,
    title: "We maintain thorough documentation of AI system conformity.",
    description:
      "Comprehensive conformity documentation demonstrates adherence to legal standards and supports regulatory reporting.",
  },
  {
    order_no: 2,
    title: "We keep records of registration and any subsequent updates.",
    description:
      "Detailed records of registration activities provide transparency and facilitate compliance verification.",
  },
  {
    order_no: 1,
    title: "We ensure timely and accurate data entry into the EU database.",
    description:
      "Ensuring timely updates maintains regulatory compliance and fosters trust in system integrity and monitoring processes.",
  },
  {
    order_no: 1,
    title: "We define methods and tools for measuring AI system impacts.",
    description:
      "Establishing methods and tools ensures consistent evaluation of AI system effects on users, stakeholders, and society.",
  },
  {
    order_no: 1,
    title: "We monitor AI system operations based on usage instructions.",
    description:
      "Monitoring ensures systems operate within intended parameters and quickly identifies deviations.",
  },
  {
    order_no: 1,
    title:
      "We track and respond to errors and incidents through measurable activities.",
    description:
      "Effective tracking and response minimize the impact of errors and improve system resilience and compliance.",
  },
  {
    order_no: 1,
    title:
      "We consult with experts and end-users to inform risk management.",
    description:
      "Input from diverse perspectives ensures risk management strategies are comprehensive and practical.",
  },
  {
    order_no: 1,
    title:
      "We continuously evaluate if AI systems meet objectives and decide on ongoing deployment.",
    description:
      "Regular evaluations ensure systems continue to fulfill their intended purpose and remain aligned with organizational goals.",
  },
  {
    order_no: 2,
    title: "We document pre-determined changes and performance metrics.",
    description:
      "Documentation of changes and metrics supports traceability and ensures that modifications are aligned with compliance.",
  },
  {
    order_no: 3,
    title:
      "We regularly review and update AI systems to maintain regulatory compliance.",
    description:
      "Regular reviews ensure AI systems evolve in line with regulatory changes and industry standards.",
  },
  {
    order_no: 4,
    title:
      "We ensure that any system changes are documented and assessed for compliance.",
    description:
      "Thorough documentation and assessment of changes prevent compliance gaps and support accountability.",
  },
  {
    order_no: 1,
    title:
      "We implement processes to capture and integrate unexpected impact inputs.",
    description:
      "Capturing unforeseen impacts helps refine systems and address emerging risks proactively.",
  },
  {
    order_no: 1,
    title: "We assess AI model capabilities using appropriate tools.",
    description:
      "Capability assessments verify that AI models perform as intended and meet required safety and quality standards.",
  },
  {
    order_no: 1,
    title: "We develop plans to address unexpected risks as they arise.",
    description:
      "Proactive risk plans ensure quick and effective responses to emerging challenges or unforeseen issues.",
  },
  {
    order_no: 2,
    title: "We monitor and respond to incidents post-deployment.",
    description:
      "Post-deployment monitoring identifies and mitigates issues, ensuring continued compliance and system reliability.",
  },
  {
    order_no: 1,
    title:
      "We ensure providers implement systems for capturing and storing AI system logs.",
    description:
      "Logging systems provide traceability, aiding audits and troubleshooting while supporting regulatory requirements.",
  },
  {
    order_no: 1,
    title:
      "We immediately report serious incidents to providers, importers, distributors, and relevant authorities.",
    description:
      "Prompt reporting ensures accountability and timely resolution of incidents, minimizing potential harm.",
  },
  {
    order_no: 1,
    title:
      "We implement processes to capture and integrate unexpected impact inputs.",
    description:
      "Capturing unforeseen impacts helps refine systems and address emerging risks proactively.",
  },
  {
    order_no: 1,
    title: "We assess AI model capabilities using appropriate tools.",
    description:
      "Capability assessments verify that AI models perform as intended and meet required safety and quality standards.",
  },
  {
    order_no: 1,
    title: "We develop plans to address unexpected risks as they arise.",
    description:
      "Proactive risk plans ensure quick and effective responses to emerging challenges or unforeseen issues.",
  },
  {
    order_no: 2,
    title: "We monitor and respond to incidents post-deployment.",
    description:
      "Post-deployment monitoring identifies and mitigates issues, ensuring continued compliance and system reliability.",
  },
  {
    order_no: 1,
    title:
      "We ensure providers implement systems for capturing and storing AI system logs.",
    description:
      "Logging systems provide traceability, aiding audits and troubleshooting while supporting regulatory requirements.",
  },
  {
    order_no: 1,
    title:
      "We immediately report serious incidents to providers, importers, distributors, and relevant authorities.",
    description:
      "Prompt reporting ensures accountability and timely resolution of incidents, minimizing potential harm.",
  },
]

const subControlsMock = (controlIds: number[]) => {
  let controlIdsCtr = 0;
  let ctr = 0
  return [3, 2, 1, 1, 1, 2, 1, 1, 1, 3, 2, 2, 1, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 2, 6, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 4, 1, 1, 2, 1, 1, 1, 1, 2, 1, 1].flatMap(
    x => {
      let controlId = controlIds[controlIdsCtr++]
      return Array(x).fill({}).flatMap((_) => {
        return {
          title: subControlTitlesAndDescriptions[ctr].title,
          description: subControlTitlesAndDescriptions[ctr].description,
          orderNo: subControlTitlesAndDescriptions[ctr++].order_no,
          controlId
        }
      }
      )
    }
  )
}

export const createNewSubControlsQuery = async (controlIds: number[]) => {
  let query = "INSERT INTO subcontrols(title, description, control_id, order_no) VALUES ";
  const data = subControlsMock(controlIds).map((d) => {
    return `('${d.title}', '${d.description}', ${d.controlId}, ${d.orderNo})`;
  });
  query += data.join(",") + " RETURNING *;";
  const result = await pool.query(query);
  return result.rows;
};
