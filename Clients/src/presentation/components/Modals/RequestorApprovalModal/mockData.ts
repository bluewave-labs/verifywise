import {
    Layers
} from "lucide-react";

import { IMenuGroup, IMenuItem } from "../../../../domain/interfaces/i.menu";


export interface ITimelineStep {
    id: number;
    stepNumber: number;
    title: string;
    status: 'completed' | 'pending' | 'rejected';
    approverName?: string;
    approverRole?: string;
    date?: string;
    comment?: string;
    showDetailsLink?: boolean;
    approvalResult?: "approved" | 'rejected' | 'pending';
}

export interface IMenuItemExtended extends IMenuItem  {
    id: number;
}

export interface IMenuGroupExtended {
    name: string;
    items: IMenuItemExtended[];
}

export type MenuItemId = number;

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
            },
            {
                id: 2,
                name: "Medical AI Platform",
                icon: "<Layers size={16} strokeWidth={1.5} />",
                path: "/framework",
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
            },
            {
                id: 4,
                name: "HR Analytics Tool",
                icon: "<Layers size={16} strokeWidth={1.5} />",
                path: "/framework",
            },
        ],

    },
];


export const getMockTimelineData = (itemId?: MenuItemId): ITimelineStep[] => {
    if (itemId === undefined || itemId === null) {
        return [];
    }
    return timelineDataMap[itemId] || [];
};


export const timelineDataMap: Record<MenuItemId, ITimelineStep[]> = {
    1: [
        {
            id: 1,
            stepNumber: 1,
            title: "Request submitted",
            status: 'completed',
            approverName: "Mary Johnson",
            approverRole: 'Requestor',
            date: "2024/01/15",
            showDetailsLink: true,
        },
        {
            id: 2,
            stepNumber: 2,
            title: "Manager Approval",
            status: 'pending',
            approverName: "John Smith",
            approverRole: "Manager",
            date: "2024/01/16",
            comment: "Please provide additional documentation about the marketing use case.",
            approvalResult: 'pending',
        },
        {
            id: 3,
            stepNumber: 3,
            title: "Compliance Review",
            status: 'pending',
            approverName: "Sarah Williams",
            approverRole: 'Compliance Officer',
        },
    ],
    
    2: [
        {
            id: 1,
            stepNumber: 1,
            title: "Request submitted",
            status: 'completed',
            approverName: "David Brown",
            approverRole: 'Requestor',
            date: "2024/01/10",
            showDetailsLink: true,
        },
        {
            id: 2,
            stepNumber: 2,
            title: "Manager Approval",
            status: 'completed',
            approverName: "Emily Davis",
            approverRole: "Manager",
            date: "2024/01/12",
            approvalResult: 'approved',
        },
        {
            id: 3,
            stepNumber: 3,
            title: "Medical Board Review",
            status: 'rejected',
            approverName: "Dr. Michael Chen",
            approverRole: 'Medical Board Member',
            date: "2024/01/14",
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
            approverRole: 'Requestor',
            date: "2024/01/05",
            showDetailsLink: true,
        },
        {
            id: 2,
            stepNumber: 2,
            title: "Manager Approval",
            status: 'completed',
            approverName: "Robert Taylor",
            approverRole: "Manager",
            date: "2024/01/07",
            approvalResult: 'approved',
        },
        {
            id: 3,
            stepNumber: 3,
            title: "Security Review",
            status: 'completed',
            approverName: "Jennifer Martinez",
            approverRole: 'Security Officer',
            date: "2024/01/09",
            approvalResult: 'approved',
        },
        {
            id: 4,
            stepNumber: 4,
            title: "Final Approval",
            status: 'completed',
            approverName: "Thomas Wilson",
            approverRole: 'Director',
            date: "2024/01/11",
            approvalResult: 'approved',
        },
    ],

    4: [
        {
            id: 1,
            stepNumber: 1,
            title: "Request submitted",
            status: 'completed',
            approverName: "Patricia Garcia",
            approverRole: 'Requestor',
            date: "2024/01/20",
            showDetailsLink: true,
        },
        {
            id: 2,
            stepNumber: 2,
            title: "HR Manager Approval",
            status: 'completed',
            approverName: "James Rodriguez",
            approverRole: "HR Manager",
            date: "2024/01/22",
            approvalResult: 'approved',
        },
        {
            id: 3,
            stepNumber: 3,
            title: "Data Privacy Review",
            status: 'pending',
            approverName: "Amanda Lee",
            approverRole: 'Privacy Officer',
            date: "2024/01/24",
            comment: "Reviewing data handling procedures for employee analytics.",
            approvalResult: 'pending',
        },
        {
            id: 4,
            stepNumber: 4,
            title: "Legal Review",
            status: 'pending',
            approverName: "Christopher White",
            approverRole: 'Legal Counsel',
        },
    ],
};