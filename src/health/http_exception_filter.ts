import {
  Logger,
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  ExceptionFilter,
} from '@nestjs/common';
// Add this class for better error logging
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : 'Internal server error';

    // Log detailed error information
    this.logger.error({
      path: request.url,
      method: request.method,
      status,
      message,
      timestamp: new Date().toISOString(),
      stack: exception.stack,
      body: request.body,
      params: request.params,
      query: request.query,
    });

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
