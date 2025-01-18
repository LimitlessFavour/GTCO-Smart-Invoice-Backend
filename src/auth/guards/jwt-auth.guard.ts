/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  //   private readonly logger = new Logger(JwtAuthGuard.name);
  //   handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
  //     const request = context.switchToHttp().getRequest();
  //     const token = this.extractTokenFromHeader(request);
  //     this.logger.debug(`Token present: ${!!token}`);
  //     if (err || !user) {
  //       this.logger.error(
  //         `Authentication failed: ${err?.message || 'No user found'}`,
  //       );
  //       this.logger.error(`Token info: ${JSON.stringify(info)}`);
  //       throw (
  //         err ||
  //         new UnauthorizedException('Authentication token is invalid or expired')
  //       );
  //     }
  //     return user;
  //   }
  //   private extractTokenFromHeader(request: any): string | undefined {
  //     const [type, token] = request.headers.authorization?.split(' ') ?? [];
  //     return type === 'Bearer' ? token : undefined;
  //   }
}
