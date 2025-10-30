import { ReviewStatus } from "../../../enums/status.enum";

export class VendorModel {
  id?: number;
  order_no?: number;
  vendor_name!: string;
  vendor_provides!: string;
  assignee!: number;
  website!: string;
  vendor_contact_person!: string;
  review_result!: string;
  review_status!: ReviewStatus;
  reviewer!: number;
  review_date!: Date;
  is_demo?: boolean;
  created_at?: Date;
  projects?: number[];

  constructor(data: VendorModel) {
    this.id = data.id;
    this.order_no = data.order_no;
    this.vendor_name = data.vendor_name;
    this.vendor_provides = data.vendor_provides;
    this.assignee = data.assignee;
    this.website = data.website;
    this.vendor_contact_person = data.vendor_contact_person;
    this.review_result = data.review_result;
    this.review_status = data.review_status;
    this.reviewer = data.reviewer;
    this.review_date = data.review_date;
    this.is_demo = data.is_demo;
    this.created_at = data.created_at;
    this.projects = data.projects;
  }

  static createNewVendor(data: VendorModel): VendorModel {
    return new VendorModel(data);
  }
}
