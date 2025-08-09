export interface IModelInventory{
    id?: number,
    model: string,
    version: string,
    approver: string,
    capabilities: "Vision"|"Caching"|"Tools"|"Code"| "Multimodal"|"Audio"|"Video",
    security_assessments: "Yes" | "No",
    status: "Approved" | "Pending" | "Restricted"| "Blocked",
    status_date:Date
} 