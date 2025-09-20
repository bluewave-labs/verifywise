export interface AssessmentAnswers {
  [key: string]: boolean | string | string[];
}

export interface AssessmentResult {
  result: string;
  headline: string;
  teaching: string;
  color: string;
  obligations?: string[];
  next_steps?: string[];
  links?: { label: string; url: string }[];
}

export class DecisionEngine {
  private answers: AssessmentAnswers = {};

  setAnswers(answers: AssessmentAnswers) {
    this.answers = answers;
  }

  evaluate(): AssessmentResult {
    // Step 1: Scope check
    if (!this.answers.q_scope_eu) {
      return {
        result: "out_of_scope",
        headline: "Outside territorial scope",
        teaching: "You indicated the system is not placed on, put into service, or used in the EU. The EU AI Act may not apply. You can still follow the good practices.",
        color: "#6B7280"
      };
    }

    // Step 2: Prohibited practices check
    const prohibitedPractices = this.answers.q_prohibited as string[];
    if (prohibitedPractices && prohibitedPractices.length > 0 && !prohibitedPractices.includes("none")) {
      return {
        result: "prohibited",
        headline: "Prohibited or tightly restricted practice",
        teaching: "These practices cannot be placed on the EU market except in narrow lawful exceptions.",
        color: "#DC2626",
        links: [
          { label: "Prohibited practices overview", url: "https://digital-strategy.ec.europa.eu/en/policies/eu-artificial-intelligence-act" }
        ],
        next_steps: [
          "Consult legal counsel about exceptions and safeguards",
          "Do not place or use this system in the EU unless a clear legal derogation applies"
        ]
      };
    }

    // Step 3: Annex I check (Product/Safety Component)
    if (this.answers.q_annex_i_sector && this.answers.q_third_party_conformity) {
      return {
        result: "high_risk",
        headline: "High risk AI system (Annex I)",
        teaching: "Your AI is a product or safety component in a regulated sector and requires third party conformity assessment. This is high risk by default.",
        color: "#DC2626",
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
      };
    }

    // Step 4: Annex III check (Specific Use Cases)
    const hasAnnexIIICase = this.checkAnnexIIICases();

    if (hasAnnexIIICase) {
      // Check for profiling
      if (this.answers.q_profiling) {
        return {
          result: "high_risk",
          headline: "High risk AI system (Annex III with profiling)",
          teaching: "Annex III use with profiling of natural persons is treated as high risk.",
          color: "#DC2626",
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
        };
      }

      // Check for material influence
      if (this.answers.q_material_influence || !this.answers.q_procedural_only) {
        return {
          result: "high_risk",
          headline: "High risk AI system (Annex III with material influence)",
          teaching: "Annex III use case where the AI output materially influences decisions or outcomes.",
          color: "#DC2626",
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
        };
      }

      // Check for carve-out conditions
      const biometrics = this.answers.q_biometrics as string[];
      const hasBiometricUse = biometrics && biometrics.length > 0 && !biometrics.includes("none");

      if (!this.answers.q_material_influence &&
          this.answers.q_procedural_only &&
          (!hasBiometricUse || this.answers.q_biometric_verification_only)) {
        return {
          result: "not_high_risk_annex_iii_carveout",
          headline: "Annex III domain, not high risk due to carve out",
          teaching: "Document why the carve out applies, material influence is absent, and controls ensure proper human review.",
          color: "#F59E0B",
          next_steps: [
            "Keep clear records showing limited use and human review",
            "Apply transparency duties if users interact with AI, for example chatbot disclosures",
            "Adopt voluntary codes of conduct and logging"
          ]
        };
      }
    }

    // Default: Limited or minimal risk
    return {
      result: "limited_or_minimal",
      headline: "Limited or minimal risk",
      teaching: "Your system does not meet Annex I with third party conformity and is not an Annex III use case with material influence or profiling.",
      color: "#10B981",
      next_steps: [
        "Maintain basic documentation and a model card",
        "Adopt voluntary codes of conduct",
        "Monitor changes in use cases that might move the system into Annex III",
        "Apply transparency duties if users interact with AI"
      ]
    };
  }

  private checkAnnexIIICases(): boolean {
    // Check biometrics
    const biometrics = this.answers.q_biometrics as string[];
    if (biometrics && biometrics.length > 0 && !biometrics.includes("none")) {
      return true;
    }

    // Check critical infrastructure
    if (this.answers.q_critical_infrastructure) return true;

    // Check education
    if (this.answers.q_education) return true;

    // Check employment
    if (this.answers.q_employment) return true;

    // Check essential services
    const essentialServices = this.answers.q_essential_services as string[];
    if (essentialServices && essentialServices.length > 0 && !essentialServices.includes("none")) {
      return true;
    }

    // Check law enforcement
    if (this.answers.q_law_enforcement) return true;

    // Check migration/border
    if (this.answers.q_migration_border) return true;

    // Check justice/democracy
    const justiceDemocracy = this.answers.q_justice_democracy as string[];
    if (justiceDemocracy && justiceDemocracy.length > 0 && !justiceDemocracy.includes("none")) {
      return true;
    }

    return false;
  }

  generateReport(result: AssessmentResult, answers: AssessmentAnswers): any {
    const timestamp = new Date().toISOString();

    return {
      metadata: {
        tool_id: "eu_ai_act_readiness_v1",
        assessment_date: timestamp,
        version: "1.0"
      },
      classification: {
        result: result.result,
        headline: result.headline,
        risk_level: result.color === "#DC2626" ? "High" :
                    result.color === "#F59E0B" ? "Medium" :
                    result.color === "#10B981" ? "Low" : "N/A"
      },
      assessment_summary: {
        eu_scope: answers.q_scope_eu,
        actor_role: answers.q_actor_role,
        prohibited_practices: answers.q_prohibited || [],
        annex_i_applicable: !!(answers.q_annex_i_sector && answers.q_third_party_conformity),
        annex_iii_applicable: this.checkAnnexIIICases(),
        has_profiling: answers.q_profiling,
        has_material_influence: answers.q_material_influence
      },
      compliance_requirements: {
        obligations: result.obligations || [],
        next_steps: result.next_steps || [],
        resources: result.links || []
      },
      answers: answers
    };
  }
}