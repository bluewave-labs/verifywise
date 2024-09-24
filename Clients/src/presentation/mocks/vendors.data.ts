/**
 * TYPE: 
Contractor
Partner
Supplier
Data source
AI model provider
 */

/**
 * STATUS: 
Active
Under review
Not active
 */

/**
 * RISKS
Very high risk
High risk
Medium risk
Low risk
Very low risk
 */
const listOfVendors = [
  {
    name: "Apex",
    type: "Contractor",
    assignee: "John McAllen",
    status: "Active",
    risk: "High risk",
    review_date: "12 January 2024",
  },
  {
    name: "BuildCorp",
    type: "Supplier",
    assignee: "Jane Doe",
    status: "Not active",
    risk: "Medium risk",
    review_date: "23 March 2023",
  },
  {
    name: "ConstructCo",
    type: "Contractor",
    assignee: "Alice Johnson",
    status: "Active",
    risk: "Low risk",
    review_date: "15 July 2023",
  },
  {
    name: "DevPartners",
    type: "Data source",
    assignee: "Bob Smith",
    status: "Active",
    risk: "High risk",
    review_date: "30 September 2023",
  },
];

export default listOfVendors;
