export interface Overview {
    id: number
    subrequirement_id: number
    control_name: string
    control_description: string
    control_owner: string
    control_status: string
    implementation_description: string
    implementation_evidence: string
    effective_date: Date
    review_date: Date
    comments: string
}