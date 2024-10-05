const LOG_LEVEL = import.meta.env.VITE_APP_LOG_LEVEL;

class Logger {
  error: (message?: any, ...optionalParams: any[]) => void;
  warn: (message?: any, ...optionalParams: any[]) => void;
  info: (message?: any, ...optionalParams: any[]) => void;
  debug: (message?: any, ...optionalParams: any[]) => void;
  log: (message?: any, ...optionalParams: any[]) => void;

  constructor(logLevel: string) {
    const NO_OP = () => {};

    if (logLevel === "none") {
      this.error = NO_OP;
      this.warn = NO_OP;
      this.info = NO_OP;
      this.debug = NO_OP;
      this.log = NO_OP;
      return;
    }

    this.error = console.error.bind(console);

    if (logLevel === "error") {
      this.warn = NO_OP;
      this.info = NO_OP;
      this.debug = NO_OP;
      this.log = NO_OP;
      return;
    }

    this.warn = console.warn.bind(console);

    if (logLevel === "warn") {
      this.info = NO_OP;
      this.debug = NO_OP;
      this.log = NO_OP;
      return;
    }

    this.info = console.info.bind(console);
    this.debug = console.debug.bind(console);
    this.log = console.log.bind(console);
  }
}

export const logger = new Logger(LOG_LEVEL);
