const DEFAULT_FRONTEND_URL = "http://localhost:8082,http://localhost:5175,http://localhost:5173,http://localhost:3000";

export const frontEndUrl = process.env.FRONTEND_URL || DEFAULT_FRONTEND_URL;