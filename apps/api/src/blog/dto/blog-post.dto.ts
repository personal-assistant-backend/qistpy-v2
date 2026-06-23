import { IsBoolean, IsIn, IsOptional, IsString, Length } from 'class-validator';

export class CreateBlogPostDto {
  @IsString()
  @Length(5, 160)
  title!: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsString()
  @Length(10, 300)
  excerpt!: string;

  @IsString()
  @Length(50)
  content!: string;

  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsIn(['en', 'ur'])
  language?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsString()
  metaTitle?: string;

  @IsOptional()
  @IsString()
  metaDescription?: string;
}

export class UpdateBlogPostDto {
  @IsOptional()
  @IsString()
  @Length(5, 160)
  title?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  @Length(10, 300)
  excerpt?: string;

  @IsOptional()
  @IsString()
  @Length(50)
  content?: string;

  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsIn(['en', 'ur'])
  language?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsString()
  metaTitle?: string;

  @IsOptional()
  @IsString()
  metaDescription?: string;
}
