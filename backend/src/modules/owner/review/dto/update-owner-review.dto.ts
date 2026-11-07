import { PartialType } from '@nestjs/swagger';
import { CreateOwnerReviewDto } from './create-owner-review.dto';

export class UpdateOwnerReviewDto extends PartialType(CreateOwnerReviewDto) {}
