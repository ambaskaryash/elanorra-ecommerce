import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

// Common validation schemas
export const emailSchema = z.string().email().max(254);
export const passwordSchema = z.string().min(8).max(128);
export const nameSchema = z.string().min(1).max(100).regex(/^[a-zA-Z\s'-]+$/);
export const phoneSchema = z.string().regex(/^\+?[\d\s\-\(\)]+$/).min(10).max(20).optional();

// Product validation schemas
export const productNameSchema = z.string().min(1).max(200);
export const productDescriptionSchema = z.string().min(1).max(5000);
export const priceSchema = z.number().positive().max(999999.99);
export const quantitySchema = z.number().int().min(0).max(99999);

// Review validation schemas
export const reviewRatingSchema = z.number().int().min(1).max(5);
export const reviewCommentSchema = z.string().min(1).max(1000);

// Search and filter schemas
export const searchQuerySchema = z.string().max(100);
export const sortOrderSchema = z.enum(['asc', 'desc']);
export const categorySchema = z.string().max(50);

// Pagination schemas
export const pageSchema = z.number().int().min(1).max(1000);
export const limitSchema = z.number().int().min(1).max(100);

// Input sanitization functions
export function sanitizeHtml(input: string): string {
  return DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
}

export function sanitizeText(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .substring(0, 1000); // Limit length
}

export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

export function sanitizeSearchQuery(query: string): string {
  return query
    .trim()
    .replace(/[^\w\s\-_.]/g, '') // Only allow alphanumeric, spaces, hyphens, underscores, dots
    .substring(0, 100);
}

// Validation helper functions
export function validateAndSanitizeUser(data: any) {
  const userSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
    firstName: nameSchema,
    lastName: nameSchema,
    phone: z.string().optional().refine((val) => {
      if (!val || val.trim() === '') return true; // Allow empty/undefined
      return /^\+?[\d\s\-\(\)]+$/.test(val) && val.length >= 10 && val.length <= 20;
    }, {
      message: "Phone number must be 10-20 characters and contain only digits, spaces, hyphens, parentheses, and optional + prefix"
    }),
  });

  const validated = userSchema.parse(data);
  
  return {
    email: sanitizeEmail(validated.email),
    password: validated.password, // Don't sanitize password
    firstName: sanitizeText(validated.firstName),
    lastName: sanitizeText(validated.lastName),
    phone: validated.phone && validated.phone.trim() !== '' ? sanitizeText(validated.phone) : undefined,
  };
}

export function validateAndSanitizeProduct(data: any) {
  const productSchema = z.object({
    name: productNameSchema,
    description: productDescriptionSchema,
    price: priceSchema,
    quantity: quantitySchema,
    category: categorySchema,
  });

  const validated = productSchema.parse(data);
  
  return {
    name: sanitizeText(validated.name),
    description: sanitizeHtml(validated.description),
    price: validated.price,
    quantity: validated.quantity,
    category: sanitizeText(validated.category),
  };
}

export function validateAndSanitizeReview(data: any) {
  const reviewSchema = z.object({
    rating: reviewRatingSchema,
    comment: reviewCommentSchema,
    productId: z.string().uuid(),
  });

  const validated = reviewSchema.parse(data);
  
  return {
    rating: validated.rating,
    comment: sanitizeHtml(validated.comment),
    productId: validated.productId,
  };
}

export function validatePagination(data: any) {
  const paginationSchema = z.object({
    page: pageSchema.default(1),
    limit: limitSchema.default(10),
  });

  return paginationSchema.parse(data);
}

export function validateSearch(data: any) {
  const searchSchema = z.object({
    query: searchQuerySchema.optional(),
    category: categorySchema.optional(),
    sortBy: z.string().max(50).optional(),
    sortOrder: sortOrderSchema.default('asc'),
    minPrice: z.number().min(0).optional(),
    maxPrice: z.number().min(0).optional(),
  });

  const validated = searchSchema.parse(data);
  
  return {
    ...validated,
    query: validated.query ? sanitizeSearchQuery(validated.query) : undefined,
    category: validated.category ? sanitizeText(validated.category) : undefined,
    sortBy: validated.sortBy ? sanitizeText(validated.sortBy) : undefined,
  };
}

// SQL injection prevention helpers
export function escapeForLike(input: string): string {
  return input.replace(/[%_\\]/g, '\\$&');
}

// XSS prevention helpers
export function stripScripts(input: string): string {
  return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
}

// File upload validation
export function validateFileUpload(file: File, allowedTypes: string[], maxSize: number) {
  const errors: string[] = [];
  
  if (!allowedTypes.includes(file.type)) {
    errors.push(`File type ${file.type} is not allowed`);
  }
  
  if (file.size > maxSize) {
    errors.push(`File size ${file.size} exceeds maximum allowed size of ${maxSize}`);
  }
  
  // Check for potentially dangerous file extensions
  const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com'];
  const fileName = file.name.toLowerCase();
  
  if (dangerousExtensions.some(ext => fileName.endsWith(ext))) {
    errors.push('File type is not allowed for security reasons');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Rate limiting key generation
export function generateRateLimitKey(identifier: string, endpoint: string): string {
  return `rate_limit:${endpoint}:${identifier}`;
}

// CSRF token validation (for future implementation)
export function validateCSRFToken(token: string, sessionToken: string): boolean {
  // This is a placeholder - implement proper CSRF validation
  return token === sessionToken;
}