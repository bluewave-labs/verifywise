export const assessmentData = {
  tool_id: "eu_ai_act_readiness_v1",
  title: "EU AI Act Readiness Assessment",
  purpose: "Help users determine if an AI system is high risk under the EU AI Act, teach why each question matters, and return clear next steps.",
  disclaimer: "Educational use only. This does not constitute legal advice.",
  resources: [
    {
      label: "EU AI Act, Official text",
      url: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj"
    },
    {
      label: "EU AI Act, Summary for practitioners",
      url: "https://digital-strategy.ec.europa.eu/en/policies/eu-artificial-intelligence-act"
    }
  ],
  workflow: [
    {
      step_id: "intro",
      type: "content",
      content: "This guided check asks about 10 to 20 short questions. You will get a classification and a one page report at the end."
    },
    {
      step_id: "company_context",
      title: "Company and Scope",
      questions: [
        {
          id: "q_scope_eu",
          text: "Do you place AI systems on the EU market or put them into service in the EU, or use them in the EU?",
          type: "boolean",
          tooltip: "The Act applies when the system is placed on the EU market, put into service, or used in the EU. If not in scope, you can still use the guidance voluntarily.",
          learn_more: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj"
        },
        {
          id: "q_actor_role",
          text: "Which role best describes you for this system?",
          type: "single_select",
          options: [
            { value: "provider", label: "Provider", helper: "You develop an AI system or a general purpose model and place it on the market in your name." },
            { value: "deployer", label: "Deployer", helper: "You use an AI system in your operations." },
            { value: "importer", label: "Importer", helper: "You import an AI system into the EU." },
            { value: "distributor", label: "Distributor", helper: "You make an AI system available on the market without modifying it." }
          ],
          tooltip: "Roles define which obligations apply. A company can have more than one role."
        }
      ]
    },
    {
      step_id: "prohibited_practices",
      title: "Prohibited Practices Check",
      questions: [
        {
          id: "q_prohibited",
          text: "Does your use include any practices that are prohibited or tightly restricted in the EU AI Act?",
          type: "multi_select",
          options: [
            { value: "social_scoring", label: "General social scoring of natural persons by public authorities" },
            { value: "subliminal", label: "Subliminal or manipulative techniques that materially distort behavior causing harm" },
            { value: "exploitation_vulnerable", label: "Exploitation of vulnerabilities of a specific group causing harm" },
            { value: "real_time_rbi_law_enforcement", label: "Real time remote biometric identification in public spaces for law enforcement, outside narrow exceptions" },
            { value: "none", label: "None of the above" }
          ],
          tooltip: "These uses are banned or very restricted. If selected, the tool should flag and stop the high-risk decision flow and return compliance guidance.",
          learn_more: "https://digital-strategy.ec.europa.eu/en/policies/eu-artificial-intelligence-act"
        }
      ]
    },
    {
      step_id: "annex_i_track",
      title: "Product and Safety Component Track",
      questions: [
        {
          id: "q_annex_i_sector",
          text: "Is the AI system a product, or a safety component of a product, regulated under sector laws such as machinery, medical devices, motor vehicles, aviation, rail, marine equipment, lifts, pressure equipment, toys, PPE, gas appliances, radio equipment, or similar?",
          type: "boolean",
          tooltip: "If your AI is a safety component or a product in these sectors, it can be high risk under Article 6 when third party conformity assessment is required.",
          learn_more: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj"
        },
        {
          id: "q_third_party_conformity",
          text: "Is that product required to undergo third party conformity assessment with a notified body under the sector law before CE marking?",
          type: "boolean",
          tooltip: "If both Annex I sector and third party conformity apply, the system is high risk by default.",
          showIf: { field: "q_annex_i_sector", value: true }
        }
      ]
    },
    {
      step_id: "annex_iii_track",
      title: "Annex III Use Case Track",
      questions: [
        {
          id: "q_biometrics",
          text: "Does the system perform any of the following biometric uses, beyond simple one to one login checks?",
          type: "multi_select",
          options: [
            { value: "remote_identification", label: "Remote biometric identification of natural persons" },
            { value: "categorisation_sensitive", label: "Biometric categorisation by sensitive or protected traits" },
            { value: "emotion_recognition", label: "Emotion recognition" },
            { value: "none", label: "None of the above" }
          ],
          tooltip: "Annex III treats these biometric uses as high risk. Pure one to one verification to confirm identity is not in scope here."
        },
        {
          id: "q_critical_infrastructure",
          text: "Is the system used as a safety component in the management or operation of critical infrastructure, for example road traffic, energy, water, gas, heating, or digital infrastructure, where a failure could endanger life or health?",
          type: "boolean"
        },
        {
          id: "q_education",
          text: "Does the system evaluate learners, proctor exams, assign levels, or decide access to education or vocational training?",
          type: "boolean"
        },
        {
          id: "q_employment",
          text: "Does the system support recruitment or worker management decisions, for example job ad targeting, CV screening, testing, performance monitoring, task allocation, promotion, or termination?",
          type: "boolean"
        },
        {
          id: "q_essential_services",
          text: "Does the system determine access or eligibility for essential services, for example public benefits, healthcare triage, emergency dispatch, credit scoring of individuals, or life and health insurance pricing?",
          type: "multi_select",
          options: [
            { value: "public_benefits", label: "Public benefits or services" },
            { value: "healthcare_triage", label: "Healthcare triage or prioritization" },
            { value: "emergency_dispatch", label: "Emergency call triage and dispatch" },
            { value: "credit_scoring", label: "Creditworthiness or credit scoring of natural persons" },
            { value: "insurance_risk", label: "Life or health insurance risk assessment or pricing" },
            { value: "none", label: "None of the above" }
          ]
        },
        {
          id: "q_law_enforcement",
          text: "Is the system intended for law enforcement tasks, for example risk assessment for victims or suspects, evaluation of evidence reliability, detection of crimes, prediction of re-offending, or profiling used in investigations or prosecutions where permitted by law?",
          type: "boolean"
        },
        {
          id: "q_migration_border",
          text: "Is the system used for migration, asylum, or border control, for example risk assessments, reliability checks, or person identification during visa or asylum processing?",
          type: "boolean"
        },
        {
          id: "q_justice_democracy",
          text: "Is the system used to support courts in interpreting or applying the law to concrete facts, or intended to influence the outcome of elections or referenda?",
          type: "multi_select",
          options: [
            { value: "courts", label: "Administration of justice" },
            { value: "elections", label: "Influencing democratic processes" },
            { value: "none", label: "None of the above" }
          ]
        }
      ]
    },
    {
      step_id: "clarifiers",
      title: "Clarifiers the Act Cares About",
      questions: [
        {
          id: "q_material_influence",
          text: "If you answered yes in any Annex III area, does the AI output materially influence decisions or outcomes for individuals, for example it directly decides eligibility, risk, ranking, or triage used in practice?",
          type: "boolean",
          tooltip: "Material influence means the AI output is used in a way that shapes the actual decision, not just as a neutral reference."
        },
        {
          id: "q_profiling",
          text: "Does the system perform profiling of natural persons, automated processing to evaluate personal aspects such as behavior, preferences, risks, or performance?",
          type: "boolean",
          tooltip: "If the system is an Annex III use case and performs profiling, it is treated as high risk."
        },
        {
          id: "q_procedural_only",
          text: "Is the AI limited to a narrow procedural or preparatory task, or only surfaces patterns for human review without influencing the final outcome, with proper human review before decisions?",
          type: "boolean",
          tooltip: "Annex III allows carve outs when the system does not present significant risk because it does not influence outcomes in practice."
        },
        {
          id: "q_biometric_verification_only",
          text: "If you selected biometrics, is your use only one to one biometric verification to confirm identity, for example device unlock or gate access, not categorisation or remote identification?",
          type: "boolean"
        }
      ]
    }
  ],
  results_catalog: {
    out_of_scope: {
      headline: "Outside territorial scope",
      teaching: "You can still use the tool to learn best practices and prepare for future EU rollout.",
      color: "#6B7280"
    },
    prohibited: {
      headline: "Prohibited or tightly restricted",
      teaching: "These practices cannot be placed on the EU market except in narrow lawful exceptions.",
      color: "#DC2626",
      links: [
        { label: "Prohibited practices overview", url: "https://digital-strategy.ec.europa.eu/en/policies/eu-artificial-intelligence-act" }
      ]
    },
    high_risk: {
      headline: "High risk AI system",
      teaching: "High risk systems must implement a risk management system, data and data governance controls, technical documentation, logging, human oversight, robustness and accuracy measures, conformity assessment, registration in the EU database, and post market monitoring.",
      color: "#DC2626",
      links: [
        { label: "EU AI Act obligations, official text", url: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj" }
      ],
      obligations: [
        "Risk management system",
        "Data governance controls",
        "Technical documentation",
        "Logging and record-keeping",
        "Human oversight measures",
        "Conformity assessment",
        "Registration in EU database",
        "Post-market monitoring"
      ],
      next_steps: [
        "Create or update your AI model inventory entry for this system",
        "Perform or update your risk management plan and testing protocol",
        "Prepare technical documentation aligned to intended purpose and lifecycle",
        "Define human oversight roles and escalation paths",
        "Plan conformity assessment and registration in the EU high risk database",
        "Set up incident and post market monitoring"
      ]
    },
    not_high_risk_annex_iii_carveout: {
      headline: "Annex III domain, not high risk due to carve out",
      teaching: "Document why the carve out applies, material influence is absent, and controls ensure proper human review.",
      color: "#F59E0B",
      next_steps: [
        "Keep clear records showing limited use and human review",
        "Apply transparency duties if users interact with AI, for example chatbot disclosures",
        "Adopt voluntary codes of conduct and logging"
      ]
    },
    limited_or_minimal: {
      headline: "Limited or minimal risk",
      teaching: "Transparency duties may apply, for example disclosure that users are interacting with AI, or deepfake labeling.",
      color: "#10B981",
      next_steps: [
        "Maintain basic documentation and a model card",
        "Adopt voluntary codes of conduct",
        "Monitor changes in use cases that might move the system into Annex III"
      ]
    }
  },
  ui_copy: {
    explain_why_header: "Why this question matters",
    learn_more_label: "Learn more",
    result_header: "Your classification",
    obligations_header: "Obligations to plan",
    next_steps_header: "What to do next",
    save_progress_label: "Save progress",
    download_report_label: "Download PDF"
  }
};