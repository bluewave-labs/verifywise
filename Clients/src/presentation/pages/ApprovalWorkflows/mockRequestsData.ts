export interface ApprovalRequest {
    id: number;
    request_name: string;
    workflow_name: string;
    status: 'Active' | 'Archived' | 'Pending' | 'Approved' | 'Withdrawn' | 'Rejected';
    date_requested: Date;
}

export const MOCK_REQUESTS: ApprovalRequest[] = [
    {
        id: 1,
        request_name: "AI Marketing Tool Access",
        workflow_name: "Use case intake v1",
        status: 'Pending',
        date_requested: new Date('2024-11-25T10:15:00'),
    },
    {
        id: 2,
        request_name: "Medical AI platform",
        workflow_name: "Use case intake v1",
        status: "Active",
        date_requested: new Date("2025-11-10"),
    },
];