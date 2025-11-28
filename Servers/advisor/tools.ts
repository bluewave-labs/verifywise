export const toolsDefinition: any[] = [
    {
        type: "function",
        function: {
            name: "fetch_risks",
            description: "Retrieve and filter risks from the database. Use this tool to search for specific risks based on project, framework, severity, likelihood, category, mitigation status, risk level, or AI lifecycle phase. Returns an array of risk objects matching the specified criteria.",
            parameters: {
                type: "object",
                properties: {
                    projectId: {
                        type: "number",
                        description: "Filter risks by project ID. Use this to get risks associated with a specific project."
                    },
                    frameworkId: {
                        type: "number",
                        description: "Filter risks by framework ID (e.g., ISO-42001, ISO-27001, EU AI Act). Use this to get risks mapped to a specific compliance framework."
                    },
                    severity: {
                        type: "string",
                        enum: ["Negligible", "Minor", "Moderate", "Major", "Catastrophic"],
                        description: "Filter by risk severity level. Catastrophic is the highest severity, Negligible is the lowest."
                    },
                    likelihood: {
                        type: "string",
                        enum: ["Rare", "Unlikely", "Possible", "Likely", "Almost Certain"],
                        description: "Filter by likelihood of occurrence. Almost Certain is the highest probability, Rare is the lowest."
                    },
                    category: {
                        type: "string",
                        description: "Filter by risk category (e.g., 'Data Privacy', 'Model Bias', 'Security', 'Performance'). Supports partial matching."
                    },
                    mitigationStatus: {
                        type: "string",
                        enum: ["Not Started", "In Progress", "Completed", "On Hold", "Deferred", "Canceled", "Requires review"],
                        description: "Filter by current mitigation status. Use this to find risks that need attention or have been resolved."
                    },
                    riskLevel: {
                        type: "string",
                        enum: ["No risk", "Very low risk", "Low risk", "Medium risk", "High risk", "Very high risk"],
                        description: "Filter by auto-calculated risk level (based on severity × likelihood). Use this to find high-priority risks."
                    },
                    aiLifecyclePhase: {
                        type: "string",
                        enum: [
                            "Problem definition & planning",
                            "Data collection & processing",
                            "Model development & training",
                            "Model validation & testing",
                            "Deployment & integration",
                            "Monitoring & maintenance",
                            "Decommissioning & retirement"
                        ],
                        description: "Filter by AI lifecycle phase where the risk occurs."
                    },
                    limit: {
                        type: "number",
                        description: "Maximum number of risks to return. Default is to return all matching risks. Use this to get a preview or top N results."
                    }
                },
                required: []
            }
        }
    },
    {
        type: "function",
        function: {
            name: "get_risk_analytics",
            description: "Get comprehensive analytics and distributions for risk data. Use this tool to understand the risk landscape, identify patterns, and generate insights about risk distribution across different dimensions. Returns aggregated statistics, risk matrix data, category breakdowns, and phase distributions.",
            parameters: {
                type: "object",
                properties: {
                    projectId: {
                        type: "number",
                        description: "Optional: Scope analytics to a specific project. If not provided, returns analytics for all risks in the tenant."
                    }
                },
                required: []
            }
        }
    },
    {
        type: "function",
        function: {
            name: "get_executive_summary",
            description: "Get a high-level executive summary of the risk landscape. Use this tool for quick overview of critical metrics, urgent risks, mitigation progress, and top risk areas. Ideal for answering questions about overall risk posture, priorities, and what needs immediate attention.",
            parameters: {
                type: "object",
                properties: {
                    projectId: {
                        type: "number",
                        description: "Optional: Scope summary to a specific project. If not provided, returns summary for all risks in the tenant."
                    }
                },
                required: []
            }
        }
    }
];
