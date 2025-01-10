import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEmail } from 'class-validator';

export class CreateClientDto {
  @ApiProperty({
    description: 'First name of the client',
    example: 'John',
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    description: 'Last name of the client',
    example: 'Snow',
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    description: 'Email address of the client',
    example: 'john.snow@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Primary phone number',
    example: '+2349012345678',
  })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({
    description: 'Alternative mobile number',
    example: '+2348012345678',
  })
  @IsString()
  @IsNotEmpty()
  mobileNumber: string;

  @ApiProperty({
    description: 'Physical address of the client',
    example: 'No 3 Peaceville estate, Badore, Ajah, Lagos',
  })
  @IsString()
  @IsNotEmpty()
  address: string;
}
