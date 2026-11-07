import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { ReviewStatus } from '../../../../../prisma/generated/client';

export class UpdateReviewStatusDto {
  @ApiProperty({ enum: ReviewStatus, example: ReviewStatus.PUBLISHED })
  @IsEnum(ReviewStatus)
  @IsNotEmpty()
  status: ReviewStatus;
}
