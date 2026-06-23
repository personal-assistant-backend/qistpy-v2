import { IsBoolean, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class UpsertSeoPageDto {
  @IsString()
  @Matches(/^\/[a-z0-9\-\/]*$/, { message: 'Path must start with / and be url-safe' })
  @MaxLength(200)
  path!: string;

  @IsString()
  categoryId!: string;

  @IsString()
  cityId!: string;

  @IsString() @MinLength(2) @MaxLength(160)
  title!: string;

  @IsString() @MinLength(10) @MaxLength(300)
  metaDescription!: string;

  @IsString() @MinLength(10)
  introHtml!: string;

  @IsOptional() @IsBoolean()
  isPublished?: boolean;
}
