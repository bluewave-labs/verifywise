interface Vendor {
    id: string;
    name: string;
    type: string;
    description: string;
    website: string;
    contactPerson: string;
    assignee: string;
    status: string;
    reviewResult: string;
    reviewer: string;
    reviewDate: Date;
    reviewStatus: string;
    riskStatus: string;
    risks: Risk[];
    project: Project;
}

interface Risk {
    id: string;
    description: string;
    impactDescription: string;
    impact: string;
    probability: string;
    actionOwner: string;
    actionPlan: string;
    riskSeverity: string;
    riskLevel: string;
    likelihood: string;
}

interface Project {
    id: string;
    name: string;
    description: string;
}

const mockData: Vendor[] = [
    {
        id: "v1",
        name: "Apex Technologies",
        type: "Contractor",
        description: "AI model training and deployment services",
        website: "www.apextech.com",
        contactPerson: "John McAllen",
        assignee: "Sarah Wilson",
        status: "Active",
        reviewResult: "Passed security assessment",
        reviewer: "Michael Chang",
        reviewDate: new Date("2024-01-12"),
        reviewStatus: "Completed",
        riskStatus: "High",
        risks: [
            {
                id: "r1",
                description: "Data security vulnerability",
                impactDescription: "Potential exposure of sensitive training data",
                impact: "High",
                probability: "Medium",
                actionOwner: "Security Team",
                actionPlan: "Implement additional encryption layers and regular security audits",
                riskSeverity: "High",
                riskLevel: "Critical",
                likelihood: "Moderate"
            },
            {
                id: "r2",
                description: "Service availability issues",
                impactDescription: "System downtime affecting model training",
                impact: "Medium",
                probability: "Low",
                actionOwner: "Operations Team",
                actionPlan: "Implement redundancy and failover systems",
                riskSeverity: "Medium",
                riskLevel: "Moderate",
                likelihood: "Low"
            }
        ],
        project: {
            id: "p1",
            name: "AI Model Optimization",
            description: "Enhance existing AI models for better performance"
        }
    },
    {
        id: "v2",
        name: "Nexus Solutions",
        type: "Supplier",
        description: "AI hardware components and infrastructure",
        website: "www.nexussol.com",
        contactPerson: "Jessica Parker",
        assignee: "Robert Brown",
        status: "Active",
        reviewResult: "Conditional approval",
        reviewer: "David Lee",
        reviewDate: new Date("2024-01-12"),
        reviewStatus: "In Progress",
        riskStatus: "Moderate",
        risks: [
            {
                id: "r3",
                description: "Supply chain delay",
                impactDescription: "Delayed hardware delivery affecting project timeline",
                impact: "Medium",
                probability: "High",
                actionOwner: "Procurement Team",
                actionPlan: "Establish alternative suppliers and buffer stock",
                riskSeverity: "Medium",
                riskLevel: "High",
                likelihood: "High"
            }
        ],
        project: {
            id: "p2",
            name: "Infrastructure Upgrade",
            description: "Modernize AI computing infrastructure"
        }
    },
    {
        id: "v3",
        name: "DataCore Analytics",
        type: "Service Provider",
        description: "Data preprocessing and analysis services",
        website: "www.datacore.com",
        contactPerson: "Alex Martinez",
        assignee: "Emma Thompson",
        status: "Pending",
        reviewResult: "Under technical review",
        reviewer: "James Wilson",
        reviewDate: new Date("2024-01-10"),
        reviewStatus: "Pending",
        riskStatus: "Low",
        risks: [
            {
                id: "r4",
                description: "Data quality issues",
                impactDescription: "Inconsistent data preprocessing results",
                impact: "Medium",
                probability: "Low",
                actionOwner: "Data Quality Team",
                actionPlan: "Implement additional data validation checks",
                riskSeverity: "Low",
                riskLevel: "Low",
                likelihood: "Low"
            },
            {
                id: "r5",
                description: "Integration complexity",
                impactDescription: "Challenges in API integration",
                impact: "Low",
                probability: "Medium",
                actionOwner: "Technical Team",
                actionPlan: "Develop detailed integration documentation and testing",
                riskSeverity: "Low",
                riskLevel: "Moderate",
                likelihood: "Medium"
            }
        ],
        project: {
            id: "p3",
            name: "Data Pipeline Enhancement",
            description: "Improve data processing workflow efficiency"
        }
    }
];

export default mockData;
