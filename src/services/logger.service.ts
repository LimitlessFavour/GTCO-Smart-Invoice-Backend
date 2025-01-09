import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class LoggerService extends Logger {
  error(message: string, trace: string, context?: string) {
    super.error(
      `
----------------------------------------
Message: ${message}
Trace: ${trace}
----------------------------------------`,
      context,
    );
  }

  debug(message: string, context?: string) {
    super.debug(
      `
----------------------------------------
Debug: ${message}
----------------------------------------`,
      context,
    );
  }
}
