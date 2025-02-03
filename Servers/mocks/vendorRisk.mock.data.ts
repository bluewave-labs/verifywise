import { VendorRisk } from "../models/vendorRisk.model";

// Sample mock data for VendorRisk
const mockVendorRisks = (project1: number, project2: number): VendorRisk[] => {
  return [
    {
      id: 1,
      project_id: project1, // Refers to the project with id 1
      vendor_name: "Tech Solutions Inc.",
      risk_name: "Data Security",
      owner: "Alice",
      risk_level: "High risk",
      review_date: new Date("2024-10-20"),
    },
    {
      id: 2,
      project_id: project1, // Refers to the project with id 2
      vendor_name: "Cloud Services Ltd.",
      risk_name: "Service Reliability",
      owner: "Bob",
      risk_level: "Medium risk",
      review_date: new Date("2024-11-05"),
    },
    {
      id: 3,
      project_id: project1, // Refers to the project with id 1
      vendor_name: "Data Analytics Co.",
      risk_name: "Compliance Risk",
      owner: "Charlie",
      risk_level: "Low risk",
      review_date: new Date("2024-09-15"),
    },
    {
      id: 4,
      project_id: project2, // Refers to the project with id 3
      vendor_name: "Network Solutions LLC",
      risk_name: "Network Vulnerability",
      owner: "David",
      risk_level: "Very high risk",
      review_date: new Date("2024-12-01"),
    },
    {
      id: 5,
      project_id: project2, // Refers to the project with id 2
      vendor_name: "Software Innovators",
      risk_name: "Software Bugs",
      owner: "Eve",
      risk_level: "No risk",
      review_date: new Date("2024-08-22"),
    },
    {
      id: 6,
      project_id: project2, // Refers to the project with id 3
      vendor_name: "Hardware Suppliers Inc.",
      risk_name: "Hardware Failure",
      owner: "Frank",
      risk_level: "High risk",
      review_date: new Date("2024-07-30"),
    },
  ]
};

// Export the mock data for use in other files
export default mockVendorRisks;
