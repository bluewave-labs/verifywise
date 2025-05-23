// Define the RootState type
export type RootState = {
  auth: {
    authToken: string;
    user: string;
    userExists: boolean;
    isLoading: boolean;
    success: boolean | null;
    message: string | null;
    expirationDate: number | null;
  };
  ui: any; // You should replace 'any' with the actual UI state type
  files: any; // You should replace 'any' with the actual files state type
};
