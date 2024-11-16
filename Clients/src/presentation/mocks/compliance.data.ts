
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
            { id: "1", data: "AI Literacy and Responsible AI Training" ,subControler:[
              {id: 1, subControlerTitle:"We ensure executive leadership takes responsibility for decisions related to AI risks."}, 
              {id: 2, subControlerTitle:"We provide AI literacy and ethics training to relevant personnel."},
              {id: 3, subControlerTitle:"We develop a clear and concise communication plan for informing workers about the use of high-risk AI systems in the workplace"} 
            ]

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
            { id: "1", data: "Regulatory Training and Response Procedures" },
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
            { id: "1", data: "Intended Use Description", subControler:[

            ] },
            { id: "2", data: "John Doe" },
            { id: "3", data: "4 (all completed)" },
            { id: "4", data: "100%" },
          ],
        },
        {
          id: 4,
          icon: Checked,
          data: [
            { id: "1", data: "Technical Documentation Review" },
            { id: "2", data: "Jane Smith" },
            { id: "3", data: "6 (3 left)" },
            { id: "4", data: "50%" },
          ],
        },
        {
          id: 5,
          icon: Checked,
          data: [
            { id: "1", data: "Record Maintenance of AI System Activities" },
            { id: "2", data: "Jane Smith" },
            { id: "3", data: "6 (3 left)" },
            { id: "4", data: "10%" },
          ],
        },
        {
          id: 6,
          icon: Checked,
          data: [
            { id: "1", data: "System Information Documentation" },
            { id: "2", data: "Jane Smith" },
            { id: "3", data: "6 (3 left)" },
            { id: "4", data: "30%" },
          ],
        },
        {
          id: 7,
          icon: Checked,
          data: [
            { id: "1", data: "Dataset Description" },
            { id: "2", data: "Jane Smith" },
            { id: "3", data: "6 (3 left)" },
            { id: "4", data: "30%" },
          ],
        },
        {
          id: 8,
          icon: Checked,
          data: [
            { id: "1", data: "Mitigation Strategies and Bias Testing" },
            { id: "2", data: "Jane Smith" },
            { id: "3", data: "6 (3 left)" },
            { id: "4", data: "39%" },
          ],
        },
        {
          id: 9,
          icon: Checked,
          data: [
            { id: "1", data: "AI System Accuracy and Security Information" },
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
            { id: "1", data: "Human Intervention Mechanisms" },
            { id: "2", data: "John Doe" },
            { id: "3", data: "4 (all completed)" },
            { id: "4", data: "100%" },
          ],
        },
        {
          id: 11,
          icon: Checked,
          data: [
            { id: "1", data: "Oversight Documentation" },
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
            { id: "1", data: "Proportionate Oversight Measures" },
            { id: "2", data: "John Doe" },
            { id: "3", data: "4 (all completed)" },
            { id: "4", data: "100%" },
          ],
        },
        {
          id: 13,
          icon: Checked,
          data: [
            { id: "1", data: "System Validation and Reliability Documentation" },
            { id: "2", data: "Jane Smith" },
            { id: "3", data: "6 (3 left)" },
            { id: "4", data: "50%" },
          ],
        },
        {
          id: 14,
          icon: Checked,
          data: [
            { id: "1", data: "Prompt Corrective Actions Implementation" },
            { id: "2", data: "Jane Smith" },
            { id: "3", data: "6 (3 left)" },
            { id: "4", data: "50%" },
          ],
        },
        {
          id: 15,
          icon: Checked,
          data: [
            { id: "1", data: "Documentation of Corrective Actions" },
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
            { id: "1", data: "Conduct thorough due diligence before associating with high-risk AI systems" },
            { id: "2", data: "John Doe" },
            { id: "3", data: "4 (all completed)" },
            { id: "4", data: "100%" },
          ],
        },
        {
          id: 17,
          icon: Checked,
          data: [
            { id: "1", data: "AI System Deactivation Mechanisms" },
            { id: "2", data: "Jane Smith" },
            { id: "3", data: "6 (3 left)" },
            { id: "4", data: "50%" },
          ],
        },
        {
          id: 18,
          icon: Checked,
          data: [
            { id: "1", data: "Incident Monitoring for Third-Party Components" },
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
            { id: "1", data: "AI Act Compliance Policies and Guidelines" },
            { id: "2", data: "John Doe" },
            { id: "3", data: "4 (all completed)" },
            { id: "4", data: "100%" },
          ],
        },
        {
          id: 20,
          icon: Checked,
          data: [
            { id: "1", data: "AI Risk Response Planning" },
            { id: "2", data: "Jane Smith" },
            { id: "3", data: "6 (3 left)" },
            { id: "4", data: "50%" },
          ],
        },
        {
          id: 21,
          icon: Checked,
          data: [
            { id: "1", data: "Compliance with AI System Instructions" },
            { id: "2", data: "Jane Smith" },
            { id: "3", data: "6 (3 left)" },
            { id: "4", data: "50%" },
          ],
        },
        {
          id: 22,
          icon: Checked,
          data: [
            { id: "1", data: "System Risk Controls Documentation" },
            { id: "2", data: "Jane Smith" },
            { id: "3", data: "6 (3 left)" },
            { id: "4", data: "50%" },
          ],
        },
        {
          id: 23,
          icon: Checked,
          data: [
            { id: "1", data: "Transparency and Explainability Evaluation" },
            { id: "2", data: "Jane Smith" },
            { id: "3", data: "6 (3 left)" },
            { id: "4", data: "50%" },
          ],
        },
        {
          id: 24,
          icon: Checked,
          data: [
            { id: "1", data: "AI System Logging Implementation" },
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
            { id: "1", data: "Fundamental Rights Impact Assessment Process Development" },
            { id: "2", data: "John Doe" },
            { id: "3", data: "4 (all completed)" },
            { id: "4", data: "100%" },
          ],
        },
        {
          id: 26,
          icon: Checked,
          data: [
            { id: "1", data: "AI System Usage Process Description" },
            { id: "2", data: "Jane Smith" },
            { id: "3", data: "6 (3 left)" },
            { id: "4", data: "50%" },
          ],
        },
        {
          id: 27,
          icon: Checked,
          data: [
            { id: "1", data: "Impacted Groups Identification" },
            { id: "2", data: "Jane Smith" },
            { id: "3", data: "6 (3 left)" },
            { id: "4", data: "50%" },
          ],
        },
        {
          id: 28,
          icon: Checked,
          data: [
            { id: "1", data: "Data Assessment" },
            { id: "2", data: "Jane Smith" },
            { id: "3", data: "6 (3 left)" },
            { id: "4", data: "50%" },
          ],
        },
        {
          id: 29,
          icon: Checked,
          data: [
            { id: "1", data: "Impacted Groups Identification" },
            { id: "2", data: "Jane Smith" },
            { id: "3", data: "6 (3 left)" },
            { id: "4", data: "50%" },
          ],
        },
        {
          id: 30,
          icon: Checked,
          data: [
            { id: "1", data: "Impacted Groups Identification" },
            { id: "2", data: "Jane Smith" },
            { id: "3", data: "6 (3 left)" },
            { id: "4", data: "50%" },
          ],
        },
        {
          id: 31,
          icon: Checked,
          data: [
            { id: "1", data: "Impacted Groups Identification" },
            { id: "2", data: "Jane Smith" },
            { id: "3", data: "6 (3 left)" },
            { id: "4", data: "50%" },
          ],
        },
        {
          id: 32,
          icon: Checked,
          data: [
            { id: "1", data: "Impacted Groups Identification" },
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
            { id: "1", data: "User Notification of AI System Use" },
            { id: "2", data: "John Doe" },
            { id: "3", data: "4 (all completed)" },
            { id: "4", data: "100%" },
          ],
        },
        {
          id: 34,
          icon: Checked,
          data: [
            { id: "1", data: "Clear AI Indication for Users" },
            { id: "2", data: "Jane Smith" },
            { id: "3", data: "6 (3 left)" },
            { id: "4", data: "50%" },
          ],
        },
        {
          id: 35,
          icon: Checked,
          data: [
            { id: "1", data: "AI System Scope and Impact Definition" },
            { id: "2", data: "Jane Smith" },
            { id: "3", data: "6 (3 left)" },
            { id: "4", data: "50%" },
          ],
        },
        
      ],
    },
    "Registration": {
      cols: [
        { id: "icon", name: "Icon" },
        { id: "SUBCONTROL NAME", name: "Subcontrol Name" },
        { id: "OWNER", name: "Owner" },
        { id: "# OF SUBCONTROLS", name: "# of Subcontrols" },
        { id: "COMPLETION", name: "Completion" },
      ],
      rows: [
        {
          id:36,
          icon: Exclamation,
          data: [
            { id: "1", data: "EU Database Registration" },
            { id: "2", data: "John Doe" },
            { id: "3", data: "4 (all completed)" },
            { id: "4", data: "100%" },
          ],
        },
        {
          id:37,
          icon: Checked,
          data: [
            { id: "1", data: "Conformity Assessment Completion" },
            { id: "2", data: "Jane Smith" },
            { id: "3", data: "6 (3 left)" },
            { id: "4", data: "50%" },
          ],
        },
        {
          id: 38,
          icon: Checked,
          data: [
            { id: "1", data: "Registration Information Maintenance" },
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
            { id: "1", data: "Registration Activity Records Maintenance" },
            { id: "2", data: "John Doe" },
            { id: "3", data: "4 (all completed)" },
            { id: "4", data: "10%" },
          ],
        },
        {
          id: 40,
          icon: Checked,
          data: [
            { id: "1", data: "EU Database Data Entry Timeliness" },
            { id: "2", data: "Jane Smith" },
            { id: "3", data: "6 (3 left)" },
            { id: "4", data: "80%" },
          ],
        },
      ],
    },
    "Post-market monitoring by providers and post-market monitoring plan for high-risk AI systems": {
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
            { id: "1", data: "AI Lifecycle Risk Management" },
            { id: "2", data: "John Doe" },
            { id: "3", data: "4 (all completed)" },
            { id: "4", data: "100%" },
          ],
        },
        {
          id: 42,
          icon: Checked,
          data: [
            { id: "1", data: "AI System Change Documentation" },
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
            { id: "1", data: "Unexpected Impact Integration" },
            { id: "2", data: "John Doe" },
            { id: "3", data: "4 (all completed)" },
            { id: "4", data: "100%" },
          ],
        },
        {
          id: 44,
          icon: Checked,
          data: [
            { id: "1", data: "AI Model Capability Assessment" },
            { id: "2", data: "Jane Smith" },
            { id: "3", data: "6 (3 left)" },
            { id: "4", data: "50%" },
          ],
        },
        {
          id: 45,
          icon: Checked,
          data: [
            { id: "1", data: "Post-Deployment Incident Monitoring" },
            { id: "2", data: "Jane Smith" },
            { id: "3", data: "6 (3 left)" },
            { id: "4", data: "50%" },
          ],
        },
        {
          id: 46,
          icon: Checked,
          data: [
            { id: "1", data: "AI System Logging Implementation" },
            { id: "2", data: "Jane Smith" },
            { id: "3", data: "6 (3 left)" },
            { id: "4", data: "50%" },
          ],
        },
        {
          id: 47,
          icon: Checked,
          data: [
            { id: "1", data: "Serious Incident Immediate Reporting" },
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
            { id: "1", data: "Intended Use Description for General-Purpose AI Models" },
            { id: "2", data: "John Doe" },
            { id: "3", data: "4 (all completed)" },
            { id: "4", data: "100%" },
          ],
        },
        {
          id: 49,
          icon: Checked,
          data: [
            { id: "1", data: "Comprehensive AI System Documentation" },
            { id: "2", data: "Jane Smith" },
            { id: "3", data: "6 (3 left)" },
            { id: "4", data: "50%" },
          ],
        },
        {
          id: 50,
          icon: Exclamation,
          data: [
            { id: "1", data: "Post-Market AI System Modification Management" },
            { id: "2", data: "John Doe" },
            { id: "3", data: "4 (all completed)" },
            { id: "4", data: "100%" },
          ],
        },
        {
          id: 51,
          icon: Exclamation,
          data: [
            { id: "1", data: "Illegal Content Prevention Countermeasures" },
            { id: "2", data: "John Doe" },
            { id: "3", data: "4 (all completed)" },
            { id: "4", data: "100%" },
          ],
        },
        {
          id: 52,
          icon: Exclamation,
          data: [
            { id: "1", data: "Synthetic Content Marking Mechanisms" },
            { id: "2", data: "John Doe" },
            { id: "3", data: "4 (all completed)" },
            { id: "4", data: "100%" },
          ],
        },
        {
          id: 53,
          icon: Exclamation,
          data: [
            { id: "1", data: "Datasets Used Documentation" },
            { id: "2", data: "John Doe" },
            { id: "3", data: "4 (all completed)" },
            { id: "4", data: "11%" },
          ],
        },
      ],
    },
    
    // Add additional titles and rows as necessary
  };
  
  