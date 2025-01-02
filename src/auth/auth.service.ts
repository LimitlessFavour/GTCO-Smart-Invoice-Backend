import { Injectable } from '@nestjs/common';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  private supabase: SupabaseClient;

  constructor(
    private configService: ConfigService,
    private jwtService: JwtService,
  ) {
    this.supabase = createClient(
      this.configService.get<string>('SUPABASE_URL'),
      this.configService.get<string>('SUPABASE_KEY'),
    );
  }

  async login(loginDto: LoginDto) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: loginDto.email,
      password: loginDto.password,
    });

    if (error) throw new Error(error.message);

    const payload = {
      sub: data.user.id,
      email: data.user.email,
      roles: ['user'],
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async signup(signupDto: SignupDto) {
    const { data, error } = await this.supabase.auth.signUp({
      email: signupDto.email,
      password: signupDto.password,
    });

    if (error) throw new Error(error.message);

    const payload = {
      sub: data.user.id,
      email: data.user.email,
      roles: ['user'],
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
