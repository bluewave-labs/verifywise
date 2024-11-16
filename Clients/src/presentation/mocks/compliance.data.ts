import Checked from "../../presentation/assets/icons/check-circle-green.svg";
import Exclamation from "../../presentation/assets/icons/alert-circle-orange.svg";

export const complianceMetrics = [
  {
    name: "Compliance Status",
    amount: "15%",
  },
  {
    name: "Total number of subcontrols",
    amount: "184",
  },
  {
    name: "Implemented subcontrols",
    amount: "31",
  },
  {
    name: "Auditor completed",
    amount: "17",
  },
];

export const complianceDetails = {
  "AI literacy": {
    cols: [
      { id: "icon", name: "Icon" },
      { id: "SUBCONTROL NAME", name: "Subcontrol Name" },
      { id: "OWNER", name: "Owner" },
      { id: "# OF SUBCONTROLS", name: "# of Subcontrols" },
      { id: "COMPLETION", name: "Completion" },
    ],
    rows: [
      {
        id: 1,
        icon: Checked,
        data: [
          {
            id: "1",
            data: "AI Literacy and Responsible AI Training",
            controlDes:
              "Develop the AI literacy of staff and others who operate or use AI systems on behalf of the organization.",
            subControler: [
              {
                id: 1,
                subControlerTitle:
                  "We ensure executive leadership takes responsibility for decisions related to AI risks.",
              },
              {
                id: 2,
                subControlerTitle:
                  "We provide AI literacy and ethics training to relevant personnel.",
              },
              {
                id: 3,
                subControlerTitle:
                  "We develop a clear and concise communication plan for informing workers about the use of high-risk AI systems in the workplace",
              },
            ],
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
            data: "Regulatory Training and Response Procedures",
            controlDes:
              "Train personnel on regulatory requirements and procedures for responding to authority requests.",
          },
          { id: "2", data: "Mike Arthurs" },
          { id: "3", data: "3 (1 left)" },
          { id: "4", data: "22%" },
        ],
      },
    ],
  },
  "Transparency and provision of information to deployers": {
    cols: [
      { id: "icon", name: "Icon" },
      { id: "SUBCONTROL NAME", name: "Subcontrol Name" },
      { id: "OWNER", name: "Owner" },
      { id: "# OF SUBCONTROLS", name: "# of Subcontrols" },
      { id: "COMPLETION", name: "Completion" },
    ],
    rows: [
      {
        id: 3,
        icon: Exclamation,
        data: [
          { id: "1", data: "Intended Use Description" , controlDes: "Review and verify technical documentation from AI system providers." ,subControler: [] 
          },
          { id: "2", data: "John Doe" },
          { id: "3", data: "4 (all completed)" },
          { id: "4", data: "100%" },
        ],
      },
      {
        id: 4,
        icon: Checked,
        data: [
          { id: "1", data: "Technical Documentation Review" , controlDes: "Review and verify technical documentation from AI system providers."},
          { id: "2", data: "Jane Smith" },
          { id: "3", data: "6 (3 left)" },
          { id: "4", data: "50%" },
        ],
      },
      {
        id: 5,
        icon: Checked,
        data: [
          { id: "1", data: "Record Maintenance of AI System Activities" , controlDes: "Maintain accurate records of all AI system activities, including modifications and third-party involvements."},
          { id: "2", data: "Jane Smith" },
          { id: "3", data: "6 (3 left)" },
          { id: "4", data: "10%" },
        ],
      },
      {
        id: 6,
        icon: Checked,
        data: [
          { id: "1", data: "System Information Documentation" , controlDes: "Document system information, including functionality, limitations, and risk controls."},
          { id: "2", data: "Jane Smith" },
          { id: "3", data: "6 (3 left)" },
          { id: "4", data: "30%" },
        ],
      },
      {
        id: 7,
        icon: Checked,
        data: [
          { id: "1", data: "Dataset Description" , controlDes: "Describe training, validation, and testing datasets used in AI systems."},
          { id: "2", data: "Jane Smith" },
          { id: "3", data: "6 (3 left)" },
          { id: "4", data: "30%" },
        ],
      },
      {
        id: 8,
        icon: Checked,
        data: [
          { id: "1", data: "Mitigation Strategies and Bias Testing" , controlDes: "Explain mitigation strategies and document bias testing results."},
          { id: "2", data: "Jane Smith" },
          { id: "3", data: "6 (3 left)" },
          { id: "4", data: "39%" },
        ],
      },
      {
        id: 9,
        icon: Checked,
        data: [
          { id: "1", data: "AI System Accuracy and Security Information" , controlDes: "Explain mitigation strategies and document bias testing results."},
          { id: "2", data: "Jane Smith" },
          { id: "3", data: "6 (3 left)" },
          { id: "4", data: "89%" },
        ],
      },
    ],
  },
  "Human oversight": {
    cols: [
      { id: "icon", name: "Icon" },
      { id: "SUBCONTROL NAME", name: "Subcontrol Name" },
      { id: "OWNER", name: "Owner" },
      { id: "# OF SUBCONTROLS", name: "# of Subcontrols" },
      { id: "COMPLETION", name: "Completion" },
    ],
    rows: [
      {
        id: 10,
        icon: Exclamation,
        data: [
          { id: "1", data: "Human Intervention Mechanisms" , controlDes:"Assign competent individuals with authority to oversee AI system usage."},
          { id: "2", data: "John Doe" },
          { id: "3", data: "4 (all completed)" },
          { id: "4", data: "100%" },
        ],
      },
      {
        id: 11,
        icon: Checked,
        data: [
          { id: "1", data: "Oversight Documentation" , controlDes:"Document system limitations and human oversight options."},
          { id: "2", data: "Jane Smith" },
          { id: "3", data: "6 (3 left)" },
          { id: "4", data: "50%" },
        ],
      },
    ],
  },
  "Corrective actions and duty of information": {
    cols: [
      { id: "icon", name: "Icon" },
      { id: "SUBCONTROL NAME", name: "Subcontrol Name" },
      { id: "OWNER", name: "Owner" },
      { id: "# OF SUBCONTROLS", name: "# of Subcontrols" },
      { id: "COMPLETION", name: "Completion" },
    ],
    rows: [
      {
        id: 12,
        icon: Exclamation,
        data: [
          { id: "1", data: "Proportionate Oversight Measures" , controlDes:"Take prompt and effective corrective actions for non-conforming high-risk AI systems and ensure ongoing system value post-deployment.        "},
          { id: "2", data: "John Doe" },
          { id: "3", data: "4 (all completed)" },
          { id: "4", data: "100%" },
        ],
      },
      {
        id: 13,
        icon: Checked,
        data: [
          { id: "1", data: "System Validation and Reliability Documentation" , controlDes:"Demonstrate and document the system's validity, reliability, and standards compliance."},
          { id: "2", data: "Jane Smith" },
          { id: "3", data: "6 (3 left)" },
          { id: "4", data: "50%" },
        ],
      },
      {
        id: 14,
        icon: Checked,
        data: [
          { id: "1", data: "Prompt Corrective Actions Implementation" , controlDes:"Implement corrective actions promptly and effectively to address identified risks or issues."},
          { id: "2", data: "Jane Smith" },
          { id: "3", data: "6 (3 left)" },
          { id: "4", data: "50%" },
        ],
      },
      {
        id: 15,
        icon: Checked,
        data: [
          { id: "1", data: "Documentation of Corrective Actions" , controlDes:"Maintain documentation of corrective actions taken."},
          { id: "2", data: "Jane Smith" },
          { id: "3", data: "6 (3 left)" },
          { id: "4", data: "50%" },
        ],
      },
    ],
  },
  "Responsibilities along the AI value chain": {
    cols: [
      { id: "icon", name: "Icon" },
      { id: "SUBCONTROL NAME", name: "Subcontrol Name" },
      { id: "OWNER", name: "Owner" },
      { id: "# OF SUBCONTROLS", name: "# of Subcontrols" },
      { id: "COMPLETION", name: "Completion" },
    ],
    rows: [
      {
        id: 16,
        icon: Exclamation,
        data: [
          {
            id: "1",
            data: "Conduct thorough due diligence before associating with high-risk AI systems",
            controlDes:"Define and allocate responsibilities among distributors, importers, deployers, and third parties to ensure compliance with AI regulations."
          },
          { id: "2", data: "John Doe" },
          { id: "3", data: "4 (all completed)" },
          { id: "4", data: "100%" },
        ],
      },
      {
        id: 17,
        icon: Checked,
        data: [
          { id: "1", data: "AI System Deactivation Mechanisms" , contorlDes: "Maintain mechanisms to deactivate AI systems if performance deviates from intended use."},
          { id: "2", data: "Jane Smith" },
          { id: "3", data: "6 (3 left)" },
          { id: "4", data: "50%" },
        ],
      },
      {
        id: 18,
        icon: Checked,
        data: [
          { id: "1", data: "Incident Monitoring for Third-Party Components" , contorlDes: "Monitor and respond to incidents involving third-party components."},
          { id: "2", data: "Jane Smith" },
          { id: "3", data: "6 (3 left)" },
          { id: "4", data: "50%" },
        ],
      },
    ],
  },
  "Obligations of deployers of high-risk AI systems": {
    cols: [
      { id: "icon", name: "Icon" },
      { id: "SUBCONTROL NAME", name: "Subcontrol Name" },
      { id: "OWNER", name: "Owner" },
      { id: "# OF SUBCONTROLS", name: "# of Subcontrols" },
      { id: "COMPLETION", name: "Completion" },
    ],
    rows: [
      {
        id: 19,
        icon: Exclamation,
        data: [
          { id: "1", data: "AI Act Compliance Policies and Guidelines" , controlDes:"Assign technical and organizational measures, along with human oversight, to ensure compliance with AI regulations and manage associated risks.        "},
          { id: "2", data: "John Doe" },
          { id: "3", data: "4 (all completed)" },
          { id: "4", data: "100%" },
        ],
      },
      {
        id: 20,
        icon: Checked,
        data: [
          { id: "1", data: "AI Risk Response Planning" , controlDes:"Plan responses to AI system risks, including defining risk tolerance and mitigation strategies."},
          { id: "2", data: "Jane Smith" },
          { id: "3", data: "6 (3 left)" },
          { id: "4", data: "50%" },
        ],
      },
      {
        id: 21,
        icon: Checked,
        data: [
          { id: "1", data: "Compliance with AI System Instructions" , controlDes:"Regularly evaluate transparency and accountability issues related to AI systems."},
          { id: "2", data: "Jane Smith" },
          { id: "3", data: "6 (3 left)" },
          { id: "4", data: "50%" },
        ],
      },
      {
        id: 22,
        icon: Checked,
        data: [
          { id: "1", data: "System Risk Controls Documentation" , controlDes:"Document system risk controls, including those for third-party components."},
          { id: "2", data: "Jane Smith" },
          { id: "3", data: "6 (3 left)" },
          { id: "4", data: "50%" },
        ],
      },
      {
        id: 23,
        icon: Checked,
        data: [
          { id: "1", data: "Transparency and Explainability Evaluation" , controlDes:"Regularly update compliance measures based on system or regulatory changes."},
          { id: "2", data: "Jane Smith" },
          { id: "3", data: "6 (3 left)" },
          { id: "4", data: "50%" },
        ],
      },
      {
        id: 24,
        icon: Checked,
        data: [
          { id: "1", data: "AI System Logging Implementation" , controlDes:"Implement automatic logging of AI system operations and retain logs appropriately."},
          { id: "2", data: "Jane Smith" },
          { id: "3", data: "6 (3 left)" },
          { id: "4", data: "50%" },
        ],
      },
    ],
  },
  "Fundamental rights impact assessments for high-risk AI systems": {
    cols: [
      { id: "icon", name: "Icon" },
      { id: "SUBCONTROL NAME", name: "Subcontrol Name" },
      { id: "OWNER", name: "Owner" },
      { id: "# OF SUBCONTROLS", name: "# of Subcontrols" },
      { id: "COMPLETION", name: "Completion" },
    ],
    rows: [
      {
        id: 25,
        icon: Exclamation,
        data: [
          {
            id: "1",
            data: "Fundamental Rights Impact Assessment Process Development", controlDes:"Conduct assessments to evaluate AI systems' impact on fundamental rights and notify authorities of findings."
          },
          { id: "2", data: "John Doe" },
          { id: "3", data: "4 (all completed)" },
          { id: "4", data: "100%" },
        ],
      },
      {
        id: 26,
        icon: Checked,
        data: [
          { id: "1", data: "AI System Usage Process Description" , controlDes:"Describe deployer processes for using high-risk AI systems, outlining intended purposes."},
          { id: "2", data: "Jane Smith" },
          { id: "3", data: "6 (3 left)" },
          { id: "4", data: "50%" },
        ],
      },
      {
        id: 27,
        icon: Checked,
        data: [
          { id: "1", data: "Impacted Groups Identification" , controlDes:"Identify all categories of natural persons and groups potentially affected by AI system usage."},
          { id: "2", data: "Jane Smith" },
          { id: "3", data: "6 (3 left)" },
          { id: "4", data: "50%" },
        ],
      },
      {
        id: 28,
        icon: Checked,
        data: [
          { id: "1", data: "Data Assessment" , controlDes:"Assess data provided to or acquired by AI systems based on legal definitions (e.g., GDPR Article 3 (32))."},
          { id: "2", data: "Jane Smith" },
          { id: "3", data: "6 (3 left)" },
          { id: "4", data: "50%" },
        ],
      },
      {
        id: 29,
        icon: Checked,
        data: [
          { id: "1", data: "Impact Measurement Strategy" , controlDes:"Develop and periodically re-evaluate strategies for measuring AI system impacts, including monitoring unexpected impacts."},
          { id: "2", data: "Jane Smith" },
          { id: "3", data: "6 (3 left)" },
          { id: "4", data: "50%" },
        ],
      },
      {
        id: 30,
        icon: Checked,
        data: [
          { id: "1", data: "Bias and Fairness Evaluation" , controlDes:"Develop and periodically re-evaluate strategies for measuring AI system impacts, including monitoring unexpected impacts."},
          { id: "2", data: "Jane Smith" },
          { id: "3", data: "6 (3 left)" },
          { id: "4", data: "50%" },
        ],
      },
      {
        id: 31,
        icon: Checked,
        data: [
          { id: "1", data: "Assessment Process Documentation" , controlDes:"Document identified risks and their potential impacts on affected individuals and groups."},
          { id: "2", data: "Jane Smith" },
          { id: "3", data: "6 (3 left)" },
          { id: "4", data: "50%" },
        ],
      },
      
    ],
  },
  "Transparency obligations for providers and users of certain AI systems": {
    cols: [
      { id: "icon", name: "Icon" },
      { id: "SUBCONTROL NAME", name: "Subcontrol Name" },
      { id: "OWNER", name: "Owner" },
      { id: "# OF SUBCONTROLS", name: "# of Subcontrols" },
      { id: "COMPLETION", name: "Completion" },
    ],
    rows: [
      {
        id: 33,
        icon: Exclamation,
        data: [
          { id: "1", data: "User Notification of AI System Use" , controlDes:"Ensure clear communication that users are interacting with AI systems and provide comprehensive information about AI system functionalities and impacts.        "},
          { id: "2", data: "John Doe" },
          { id: "3", data: "4 (all completed)" },
          { id: "4", data: "100%" },
        ],
      },
      {
        id: 34,
        icon: Checked,
        data: [
          { id: "1", data: "Clear AI Indication for Users" , controlDes:"Ensure AI indications are clear and understandable for reasonably informed users."},
          { id: "2", data: "Jane Smith" },
          { id: "3", data: "6 (3 left)" },
          { id: "4", data: "50%" },
        ],
      },
      {
        id: 35,
        icon: Checked,
        data: [
          { id: "1", data: "AI System Scope and Impact Definition" , controlDes:"Define and document AI system scope, goals, methods, and potential impacts."},
          { id: "2", data: "Jane Smith" },
          { id: "3", data: "6 (3 left)" },
          { id: "4", data: "50%" },
        ],
      },
    ],
  },
  Registration: {
    cols: [
      { id: "icon", name: "Icon" },
      { id: "SUBCONTROL NAME", name: "Subcontrol Name" },
      { id: "OWNER", name: "Owner" },
      { id: "# OF SUBCONTROLS", name: "# of Subcontrols" },
      { id: "COMPLETION", name: "Completion" },
    ],
    rows: [
      {
        id: 36,
        icon: Exclamation,
        data: [
          { id: "1", data: "EU Database Registration" , controlDes:"Register providers, authorized representatives, and deployers, along with their AI systems, in the EU database as required by the AI Act."},
          { id: "2", data: "John Doe" },
          { id: "3", data: "4 (all completed)" },
          { id: "4", data: "100%" },
        ],
      },
      {
        id: 37,
        icon: Checked,
        data: [
          { id: "1", data: "Conformity Assessment Completion" , controlDes:"Complete relevant conformity assessment procedures for AI systems."},
          { id: "2", data: "Jane Smith" },
          { id: "3", data: "6 (3 left)" },
          { id: "4", data: "50%" },
        ],
      },
      {
        id: 38,
        icon: Checked,
        data: [
          { id: "1", data: "Registration Information Maintenance" , controlDes:"Maintain comprehensive records of high-risk AI systems in the EU database, ensuring compliance with documentation and responsiveness to authorities."},
          { id: "2", data: "Jane Smith" },
          { id: "3", data: "6 (3 left)" },
          { id: "4", data: "50%" },
        ],
      },
    ],
  },
  "EU database for high-risk AI systems listed in Annex III": {
    cols: [
      { id: "icon", name: "Icon" },
      { id: "SUBCONTROL NAME", name: "Subcontrol Name" },
      { id: "OWNER", name: "Owner" },
      { id: "# OF SUBCONTROLS", name: "# of Subcontrols" },
      { id: "COMPLETION", name: "Completion" },
    ],
    rows: [
      {
        id: 39,
        icon: Exclamation,
        data: [
          { id: "1", data: "Registration Activity Records Maintenance" , controlDes:"Maintain comprehensive records of high-risk AI systems in the EU database, ensuring compliance with documentation and responsiveness to authorities."},
          { id: "2", data: "John Doe" },
          { id: "3", data: "4 (all completed)" },
          { id: "4", data: "10%" },
        ],
      },
      {
        id: 40,
        icon: Checked,
        data: [
          { id: "1", data: "EU Database Data Entry Timeliness" , controlDes:"Maintain up-to-date registration information and comprehensive conformity documentation."},
          { id: "2", data: "Jane Smith" },
          { id: "3", data: "6 (3 left)" },
          { id: "4", data: "80%" },
        ],
      },
    ],
  },
  "Post-market monitoring by providers and post-market monitoring plan for high-risk AI systems":
    {
      cols: [
        { id: "icon", name: "Icon" },
        { id: "SUBCONTROL NAME", name: "Subcontrol Name" },
        { id: "OWNER", name: "Owner" },
        { id: "# OF SUBCONTROLS", name: "# of Subcontrols" },
        { id: "COMPLETION", name: "Completion" },
      ],
      rows: [
        {
          id: 41,
          icon: Exclamation,
          data: [
            { id: "1", data: "AI Lifecycle Risk Management" , controlDes:"Implement and document monitoring systems to track AI system performance and address risks post-deployment."},
            { id: "2", data: "John Doe" },
            { id: "3", data: "4 (all completed)" },
            { id: "4", data: "100%" },
          ],
        },
        {
          id: 42,
          icon: Checked,
          data: [
            { id: "1", data: "AI System Change Documentation" , controlDes:"Document changes to AI systems and their performance post-deployment."},
            { id: "2", data: "Jane Smith" },
            { id: "3", data: "6 (3 left)" },
            { id: "4", data: "50%" },
          ],
        },
      ],
    },
  "Reporting of serious incidents": {
    cols: [
      { id: "icon", name: "Icon" },
      { id: "SUBCONTROL NAME", name: "Subcontrol Name" },
      { id: "OWNER", name: "Owner" },
      { id: "# OF SUBCONTROLS", name: "# of Subcontrols" },
      { id: "COMPLETION", name: "Completion" },
    ],
    rows: [
      {
        id: 43,
        icon: Exclamation,
        data: [
          { id: "1", data: "Unexpected Impact Integration" , controlDes:"Report any serious incidents involving AI systems to relevant market surveillance authorities within specified timeframes."},
          { id: "2", data: "John Doe" },
          { id: "3", data: "4 (all completed)" },
          { id: "4", data: "100%" },
        ],
      },
      {
        id: 44,
        icon: Checked,
        data: [
          { id: "1", data: "AI Model Capability Assessment" , controlDes:"Conduct comprehensive assessments of AI model capabilities using appropriate tools.        "},
          { id: "2", data: "Jane Smith" },
          { id: "3", data: "6 (3 left)" },
          { id: "4", data: "50%" },
        ],
      },
      {
        id: 45,
        icon: Checked,
        data: [
          { id: "1", data: "Post-Deployment Incident Monitoring", controlDes:"Monitor incidents related to AI systems and respond post-deployment.        " },
          { id: "2", data: "Jane Smith" },
          { id: "3", data: "6 (3 left)" },
          { id: "4", data: "50%" },
        ],
      },
      {
        id: 46,
        icon: Checked,
        data: [
          { id: "1", data: "AI System Logging Implementation" , controlDes:"Ensure providers implement systems for capturing and storing AI system logs."},
          { id: "2", data: "Jane Smith" },
          { id: "3", data: "6 (3 left)" },
          { id: "4", data: "50%" },
        ],
      },
      {
        id: 47,
        icon: Checked,
        data: [
          { id: "1", data: "Serious Incident Immediate Reporting" , controlDes:"Immediately report serious incidents to providers, importers, distributors, and authorities."},
          { id: "2", data: "Jane Smith" },
          { id: "3", data: "6 (3 left)" },
          { id: "4", data: "50%" },
        ],
      },
    ],
  },
  "General-purpose AI models": {
    cols: [
      { id: "icon", name: "Icon" },
      { id: "SUBCONTROL NAME", name: "Subcontrol Name" },
      { id: "OWNER", name: "Owner" },
      { id: "# OF SUBCONTROLS", name: "# of Subcontrols" },
      { id: "COMPLETION", name: "Completion" },
    ],
    rows: [
      {
        id: 48,
        icon: Exclamation,
        data: [
          {
            id: "1",
            data: "Intended Use Description for General-Purpose AI Models", controlDes:"Define and manage the intended and forbidden uses of general-purpose AI models, including modifications and content marking."
          },
          { id: "2", data: "John Doe" },
          { id: "3", data: "4 (all completed)" },
          { id: "4", data: "100%" },
        ],
      },
      {
        id: 49,
        icon: Checked,
        data: [
          { id: "1", data: "Comprehensive AI System Documentation" , controlDes:"Ensure comprehensive documentation of AI system purposes and restrictions."},
          { id: "2", data: "Jane Smith" },
          { id: "3", data: "6 (3 left)" },
          { id: "4", data: "50%" },
        ],
      },
      {
        id: 50,
        icon: Exclamation,
        data: [
          { id: "1", data: "Post-Market AI System Modification Management" , controlDes:"Manage and document any modifications to AI systems after placing on market or service."},
          { id: "2", data: "John Doe" },
          { id: "3", data: "4 (all completed)" },
          { id: "4", data: "100%" },
        ],
      },
      {
        id: 51,
        icon: Exclamation,
        data: [
          { id: "1", data: "Illegal Content Prevention Countermeasures" , controlDes:"List and implement countermeasures to prevent the generation of illegal content by AI systems."},
          { id: "2", data: "John Doe" },
          { id: "3", data: "4 (all completed)" },
          { id: "4", data: "100%" },
        ],
      },
      {
        id: 52,
        icon: Exclamation,
        data: [
          { id: "1", data: "Synthetic Content Marking Mechanisms" , controlDes:"Implement machine-readable watermarks for AI-generated synthetic content."},
          { id: "2", data: "John Doe" },
          { id: "3", data: "4 (all completed)" },
          { id: "4", data: "100%" },
        ],
      },
      {
        id: 53,
        icon: Exclamation,
        data: [
          { id: "1", data: "Datasets Used Documentation" , controlDes:"Describe datasets used, including owned, free, and copyrighted data."},
          { id: "2", data: "John Doe" },
          { id: "3", data: "4 (all completed)" },
          { id: "4", data: "11%" },
        ],
      },
    ],
  },

  // Add additional titles and rows as necessary
};
