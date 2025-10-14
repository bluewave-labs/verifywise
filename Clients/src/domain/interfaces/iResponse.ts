export interface ApiResponse {
  message: string;
  error: string;
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}
