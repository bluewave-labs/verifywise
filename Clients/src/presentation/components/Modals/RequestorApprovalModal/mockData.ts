
import { IMenuGroupExtended, IStepDetails, ITimelineStep } from ".";

export const getMenuGroups = (): IMenuGroupExtended[] => [
    {
        name: "WAITING FOR APPROVAL",
        items: [
            {
                id: 1,
                name: "AI Marketing Tool",
                path: "/overview",
                icon: "<Layers size={16} strokeWidth={1.5} />",
                highlightPaths: ["/project-view"],
                status: 'pending',
            },
            {
                id: 2,
                name: "Medical AI Platform",
                icon: "<Layers size={16} strokeWidth={1.5} />",
                path: "/framework",
                status: 'rejected',
            },
        ],

    },
    {
        name: "APPROVED REQUESTS",
        items: [
            {
                id: 3,
                name: "Ecommerce AI Solution online test",
                path: "/overview",
                icon: "<Layers size={16} strokeWidth={1.5} />",
                highlightPaths: ["/project-view"],
                status: 'approved',
            },
            {
                id: 4,
                name: "HR Analytics Tool",
                icon: "<Layers size={16} strokeWidth={1.5} />",
                path: "/framework",
                status: 'pending',
            },
        ],

    },
];

export const timelineDataMap: Record<number, ITimelineStep[]> = {
    1: [
        {
            id: 1,
            stepNumber: 1,
            title: "Request submitted",
            status: 'completed',
            approverName: "Mary Johnson",
            date: "2024-11-28T09:30:00",
            showDetailsLink: true,
        },
        {
            id: 2,
            stepNumber: 2,
            title: "Manager Approval",
            status: 'pending',
            approverName: "John Smith",
            date: "2024-11-29T14:15:00",
            comment: "Please provide additional documentation about the marketing use case.",
            approvalResult: 'pending',
        },
        {
            id: 3,
            stepNumber: 3,
            title: "Compliance Review",
            status: 'pending',
            approverName: "Sarah Williams",
        },
    ],

    2: [
        {
            id: 1,
            stepNumber: 1,
            title: "Request submitted",
            status: 'completed',
            approverName: "David Brown",
            date: "2024-11-25T10:00:00",
            showDetailsLink: true,
        },
        {
            id: 2,
            stepNumber: 2,
            title: "Manager Approval",
            status: 'completed',
            approverName: "Emily Davis",
            date: "2024-11-26T11:45:00",
            approvalResult: 'approved',
        },
        {
            id: 3,
            stepNumber: 3,
            title: "Medical Board Review",
            status: 'rejected',
            approverName: "Dr. Michael Chen",
            date: "2024-11-27T16:20:00",
            comment: "This AI system requires additional safety certifications before approval.",
            approvalResult: 'rejected',
        },
    ],
    3: [
        {
            id: 1,
            stepNumber: 1,
            title: "Request submitted",
            status: 'completed',
            approverName: "Lisa Anderson",
            date: "2024-11-20T08:30:00",
            showDetailsLink: true,
        },
        {
            id: 2,
            stepNumber: 2,
            title: "Manager Approval",
            status: 'completed',
            approverName: "Robert Taylor",
            date: "2024-11-21T10:15:00",
            approvalResult: 'approved',
        },
        {
            id: 3,
            stepNumber: 3,
            title: "Security Review",
            status: 'completed',
            approverName: "Jennifer Martinez",
            date: "2024-11-22T14:30:00",
            approvalResult: 'approved',
        },
        {
            id: 4,
            stepNumber: 4,
            title: "Final Approval",
            status: 'completed',
            approverName: "Thomas Wilson",
            date: "2024-11-23T16:00:00",
            approvalResult: 'approved',
        },
    ],

    4: [
        {
            id: 1,
            stepNumber: 1,
            title: "Request submitted",
            status: 'completed',
            approverName: "Patricia Moore",
            date: "2024-11-24T09:00:00",
            showDetailsLink: true,
        },
        {
            id: 2,
            stepNumber: 2,
            title: "HR Manager Approval",
            status: 'completed',
            approverName: "James Robinson",
            date: "2024-11-25T13:30:00",
            approvalResult: 'approved',
        },
        {
            id: 3,
            stepNumber: 3,
            title: "Data Privacy Review",
            status: 'pending',
            approverName: "Amanda Lee",
            date: "2024-11-26T15:45:00",
            comment: "Reviewing data handling procedures for employee analytics.",
            approvalResult: 'pending',
        },
        {
            id: 4,
            stepNumber: 4,
            title: "Legal Review",
            status: 'pending',
            approverName: "Christopher Rice",
        },
    ],
};

export const stepDetailsMap: Record<number, IStepDetails> = {
    1: {
        stepId: 1,
        owner: "John Doe",
        teamMembers: ["John Doe", "James Smith"],
        location: "Global",
        startDate: "2024-11-28T09:30:00",
        targetIndustry: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
    },
};