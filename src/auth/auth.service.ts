import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
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
import { v4 as uuidv4 } from 'uuid';
import { add } from 'date-fns';
import { RefreshToken } from './entities/refresh-token.entity';
import { EmailService } from 'src/services/email.service';
import { MoreThan } from 'typeorm';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private supabase: SupabaseClient;
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private configService: ConfigService,
    private jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    private readonly emailService: EmailService,
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
          // case 'Email not confirmed':
          //   throw new UnauthorizedException({
          //     message: 'Please verify your email before logging in',
          //     statusCode: 401,
          //   });
          default:
            throw new BadRequestException({
              message: error.message,
              statusCode: 400,
            });
        }
      }

      // Get full user details
      const user = await this.userRepository.findOne({
        where: { id: data.user.id },
        relations: ['company'],
      });
      const tokens = await this.generateTokens(data.user);

      if (!user) {
        // throw new NotFoundException(`User not found`);
        return {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          user: {
            id: user.id,
            email: user.email,
            onboardingStep: 0,
            onboardingCompleted: false,
          },
        };
      }

      // Only modify the response structure
      return {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phoneNumber: user.phoneNumber,
          location: user.location,
          onboardingStep: user.onboardingStep,
          onboardingCompleted: user.onboardingCompleted,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          company: user.company,
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

      // Get user details first
      const user = await this.userRepository.findOne({ where: { email } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Generate a secure token using Node.js crypto
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = add(new Date(), { hours: 1 }); // Using date-fns

      // Store the reset token
      await this.userRepository.update(user.id, {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetTokenExpiry,
      });

      // Create reset link
      const resetLink = `${this.configService.get<string>('FRONTEND_URL')}/auth/reset-password?token=${resetToken}`;

      // Send email
      await this.emailService.sendPasswordResetEmail(
        email,
        user.firstName,
        resetLink,
      );

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
      this.logger.error(
        'Email verification error',
        error?.stack || 'No stack trace',
        'verifyEmail',
      );

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException({
        message: 'Failed to verify email',
        statusCode: 500,
      });
    }
  }

  private async generateTokens(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      roles: ['user'],
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = await this.createRefreshToken(user.id);

    return {
      access_token: accessToken,
      refresh_token: refreshToken.token,
      user: {
        id: user.id,
        email: user.email,
      },
    };
  }

  private async createRefreshToken(userId: string): Promise<RefreshToken> {
    const token = uuidv4();
    const refreshToken = this.refreshTokenRepository.create({
      userId,
      token,
      expiresAt: add(new Date(), { days: 7 }),
    });

    return this.refreshTokenRepository.save(refreshToken);
  }

  async refreshAccessToken(refreshToken: string) {
    const token = await this.refreshTokenRepository.findOne({
      where: { token: refreshToken, isRevoked: false },
      relations: ['user'],
    });

    if (!token || new Date() > token.expiresAt) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Revoke the used refresh token
    await this.refreshTokenRepository.update(token.id, { isRevoked: true });

    // Generate new tokens
    return this.generateTokens(token.user);
  }

  async handleOAuthCallback(provider: string, code: string) {
    try {
      const { data, error } =
        await this.supabase.auth.exchangeCodeForSession(code);

      if (error) {
        throw new BadRequestException(
          `Failed to authenticate with ${provider}`,
        );
      }

      // Create or update user in our database
      let user = await this.userRepository.findOne({
        where: { id: data.user.id },
        relations: ['company'],
      });

      if (!user) {
        user = this.userRepository.create({
          id: data.user.id,
          email: data.user.email,
          firstName: data.user.user_metadata?.full_name?.split(' ')[0] || '',
          lastName: data.user.user_metadata?.full_name?.split(' ')[1] || '',
        });
        await this.userRepository.save(user);
      }

      return this.generateTokens(user);
    } catch (error) {
      this.logger.error(
        `OAuth callback error for ${provider}`,
        error?.stack || 'No stack trace',
        'handleOAuthCallback',
      );

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException({
        message: 'Failed to complete authentication',
        statusCode: 500,
      });
    }
  }

  async logout(refreshToken: string) {
    try {
      // Revoke the refresh token
      await this.refreshTokenRepository.update(
        { token: refreshToken },
        { isRevoked: true },
      );

      // Sign out from Supabase
      const { error } = await this.supabase.auth.signOut();

      if (error) {
        throw new BadRequestException({
          message: 'Failed to logout',
          statusCode: 400,
        });
      }

      return {
        message: 'Logged out successfully',
        statusCode: 200,
      };
    } catch (error) {
      this.logger.error(
        'Logout error',
        error?.stack || 'No stack trace',
        'logout',
      );

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException({
        message: 'Failed to logout',
        statusCode: 500,
      });
    }
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      // Find user with valid reset token
      const user = await this.userRepository.findOne({
        where: {
          resetPasswordToken: token,
          resetPasswordExpires: MoreThan(new Date()),
        },
      });

      if (!user) {
        throw new BadRequestException('Invalid or expired reset token');
      }

      // Update password in Supabase
      const { error } = await this.supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      // Clear reset token
      await this.userRepository.update(user.id, {
        resetPasswordToken: null,
        resetPasswordExpires: null,
      });

      return {
        message: 'Password updated successfully',
        statusCode: 200,
      };
    } catch (error) {
      this.logger.error('Reset password error', error);
      throw new BadRequestException('Failed to reset password');
    }
  }
}
