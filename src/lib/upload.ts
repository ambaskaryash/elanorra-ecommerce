import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

export async function ensureUploadDir(): Promise<void> {
  if (!existsSync(uploadsDir)) {
    await mkdir(uploadsDir, { recursive: true });
  }
}

export async function saveUploadedFile(file: File): Promise<UploadResult> {
  try {
    await ensureUploadDir();
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.',
      };
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: 'File too large. Maximum size is 5MB.',
      };
    }

    // Generate unique filename
    const fileExtension = path.extname(file.name);
    const fileName = `${nanoid()}-${Date.now()}${fileExtension}`;
    const filePath = path.join(uploadsDir, fileName);

    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save file
    await writeFile(filePath, buffer);

    return {
      success: true,
      url: `/uploads/${fileName}`,
    };
  } catch (error) {
    console.error('Error saving file:', error);
    return {
      success: false,
      error: 'Failed to save file',
    };
  }
}

export function getFileUrl(relativePath: string): string {
  if (relativePath.startsWith('http')) {
    return relativePath;
  }
  return relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
}