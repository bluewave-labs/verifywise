export class ApiError extends Error {
    statusCode: number;
    data: any;
  
    constructor(message: string, statusCode: number, data: any = null) {
      super(message);
      this.name = 'ApiError';
      this.statusCode = statusCode;
      this.data = data;
    }
  }
  