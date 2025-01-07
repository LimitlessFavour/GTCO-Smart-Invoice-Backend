import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { Logger } from '@nestjs/common';

@Injectable()
export class AuthService {
  private supabase: SupabaseClient;
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private configService: ConfigService,
    private jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    this.supabase = createClient(
      this.configService.get<string>('SUPABASE_URL'),
      this.configService.get<string>('SUPABASE_KEY'),
    );
  }

  async login(loginDto: LoginDto) {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: loginDto.email,
        password: loginDto.password,
      });

      if (error) {
        switch (error.message) {
          case 'Invalid login credentials':
            throw new UnauthorizedException({
              message: 'Invalid email or password',
              statusCode: 401,
            });
          //TODO: Comment out or remove this case temporarily
          case 'Email not confirmed':
            throw new UnauthorizedException({
              message: 'Please verify your email before logging in',
              statusCode: 401,
            });
          default:
            throw new BadRequestException({
              message: error.message,
              statusCode: 400,
            });
        }
      }

      const payload = {
        sub: data.user.id,
        email: data.user.email,
        roles: ['user'],
      };

      return {
        access_token: this.jwtService.sign(payload),
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      };
    } catch (error) {
      // Re-throw NestJS HTTP exceptions
      if (
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      console.error('Login error:', error);
      throw new InternalServerErrorException({
        message: 'An unexpected error occurred',
        statusCode: 500,
      });
    }
  }

  async signup(signupDto: SignupDto) {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email: signupDto.email,
        password: signupDto.password,
      });

      if (error) {
        switch (error.message) {
          case 'User already registered':
            throw new ConflictException({
              message: 'Email already registered',
              statusCode: 409,
            });
          case 'Password should be at least 6 characters':
            throw new BadRequestException({
              message: 'Password must be at least 6 characters long',
              statusCode: 400,
            });
          default:
            throw new BadRequestException({
              message: error.message,
              statusCode: 400,
            });
        }
      }

      // Create user record in our database
      const user = this.userRepository.create({
        id: data.user.id, // Use Supabase user ID
        email: data.user.email,
        firstName: '', // These will be filled during onboarding
        lastName: '',
      });

      await this.userRepository.save(user);

      const payload = {
        sub: data.user.id,
        email: data.user.email,
        roles: ['user'],
      };

      return {
        access_token: this.jwtService.sign(payload),
        user: {
          id: data.user.id,
          email: data.user.email,
        },
        message: 'Please check your email for verification instructions',
      };
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      console.error('Signup error:', error);
      throw new InternalServerErrorException({
        message: 'An unexpected error occurred',
        statusCode: 500,
      });
    }
  }

  async forgotPassword(email: string) {
    try {
      this.logger.debug(`Attempting to send password reset email to: ${email}`);

      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${this.configService.get<string>('FRONTEND_URL')}/auth/reset-password`,
      });

      if (error) {
        this.logger.error(
          `Failed to send password reset email: ${error.message}`,
          error.stack,
          'forgotPassword',
        );
        throw new BadRequestException({
          message: 'Failed to send password reset email: ' + error.message,
          statusCode: 400,
        });
      }

      return {
        message: 'Password reset instructions sent to your email',
        statusCode: 200,
      };
    } catch (error) {
      this.logger.error(
        'Password reset error',
        error?.stack || 'No stack trace',
        'forgotPassword',
      );

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException({
        message: 'An unexpected error occurred',
        statusCode: 500,
      });
    }
  }

  async signInWithGoogle() {
    try {
      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider: 'google',
      });

      if (error) {
        throw new BadRequestException({
          message: 'Failed to authenticate with Google',
          statusCode: 400,
        });
      }

      return {
        url: data.url,
        provider: 'google',
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      console.error('Google auth error:', error);
      throw new InternalServerErrorException({
        message: 'An unexpected error occurred',
        statusCode: 500,
      });
    }
  }

  async signInWithApple() {
    try {
      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider: 'apple',
      });

      if (error) {
        throw new BadRequestException({
          message: 'Failed to authenticate with Apple',
          statusCode: 400,
        });
      }

      return {
        url: data.url,
        provider: 'apple',
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      console.error('Apple auth error:', error);
      throw new InternalServerErrorException({
        message: 'An unexpected error occurred',
        statusCode: 500,
      });
    }
  }

  async verifyEmail(token: string) {
    try {
      const { error } = await this.supabase.auth.verifyOtp({
        token_hash: token,
        type: 'email',
      });

      if (error) {
        throw new BadRequestException({
          message: 'Invalid or expired verification token',
          statusCode: 400,
        });
      }

      return {
        message: 'Email verified successfully',
        statusCode: 200,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException({
        message: 'Failed to verify email',
        statusCode: 500,
      });
    }
  }
}
