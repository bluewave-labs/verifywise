export interface FormValues {
  vendorName: number;
  actionOwner: number;
  riskName: string;
  reviewDate: string;
  riskDescription: string;
}

export interface FormErrors {
  vendorName?: string;
  actionOwner?: string;
  riskName?: string;
  reviewDate?: string;
  riskDescription?: string;
}
