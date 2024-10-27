type StatusCodeFunction = (data: any) => {
  message: string;
  data?: any;
  error?: any;
};

export const STATUS_CODES: Record<number, StatusCodeFunction> = {
  // 1XX informational responses
  100: (data) => ({ message: "Continue", data }),
  101: (data) => ({ message: "Switching Protocols", data }),
  102: (data) => ({ message: "Processing", data }),
  103: (data) => ({ message: "Early Hints", data }),

  // 2XX success
  200: (data) => ({ message: "OK", data }),
  201: (data) => ({ message: "Created", data }),
  202: (data) => ({ message: "Accepted", data }),
  203: (data) => ({ message: "Non-Authoritative Information", data }),
  204: (data) => ({ message: "No Content", data }),

  // 3XX redirection
  300: (data) => ({ message: "Multiple Choices", data }),
  301: (data) => ({ message: "Moved Permanently", data }),
  302: (data) => ({ message: "Found", data }),

  // 4XX client errors
  400: (data) => ({ message: "Bad Request", data }),
  401: (data) => ({ message: "Unauthorized", data }),
  402: (data) => ({ message: "Payment Required", data }),
  403: (data) => ({ message: "Forbidden", data }),
  404: (data) => ({ message: "Not Found", data }),
  405: (data) => ({ message: "Method Not Allowed", data }),
  406: (data) => ({ message: "Not Acceptable", data }),
  407: (data) => ({ message: "Proxy Authentication Required", data }),
  408: (data) => ({ message: "Request Timeout", data }),
  409: (data) => ({ message: "Conflict", data }),

  // 5XX server errors
  500: (error) => ({ message: "Internal Server Error", error }),
  501: (error) => ({ message: "Not Implemented", error }),
  502: (error) => ({ message: "Bad Gateway", error }),
  503: (error) => ({ message: "Service Unavailable", error }),
  504: (error) => ({ message: "Gateway Timeout", error }),
};
