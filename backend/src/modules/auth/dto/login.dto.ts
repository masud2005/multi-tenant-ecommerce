import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginDto {
    @ApiPropertyOptional({
        example: 'john.doe@example.com',
        description: 'Email address. Provide this or a mobile number.',
    })
    @IsString()
    @IsOptional()
    email?: string;

    @ApiPropertyOptional({
        example: '01700000000',
        description: 'Mobile number. Provide this or an email address.',
    })
    @IsString()
    @IsOptional()
    phone?: string;

    @ApiProperty({ example: 'password123' })
    @IsString()
    @IsNotEmpty()
    password: string;
}