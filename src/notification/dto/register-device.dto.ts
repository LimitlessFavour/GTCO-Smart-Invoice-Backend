import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { DeviceType } from '../device-token.entity';

export class RegisterDeviceDto {
  @IsNotEmpty()
  @IsString()
  token: string;

  @IsEnum(DeviceType)
  deviceType: DeviceType;
}
