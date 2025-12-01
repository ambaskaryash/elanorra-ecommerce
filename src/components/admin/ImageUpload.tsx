'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';
import { X, Upload, Plus } from 'lucide-react';

interface ImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  className?: string;
}

export default function ImageUpload({
  images = [],
  onImagesChange,
  maxImages = 5,
  className = '',
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Fetch a CSRF token before making POST requests to CSRF-protected APIs
  const fetchCsrfToken = async (): Promise<string | null> => {
    try {
      const res = await fetch('/api/csrf', { method: 'GET' });
      if (!res.ok) {
        // Try read as JSON, else text
        let body: any = {};
        try {
          body = await res.json();
        } catch {
          const text = await res.text().catch(() => '');
          body = text ? { error: text } : {};
        }
        console.error('Failed to obtain CSRF token:', { status: res.status, body });
        return null;
      }
      const data = await res.json();
      return data?.csrfToken ?? null;
    } catch (err) {
      console.error('Error fetching CSRF token:', err);
      return null;
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      console.log('Uploading file:', file.name, 'Size:', file.size, 'Type:', file.type);
      
      // Ensure we have a CSRF token (required by the upload API)
      const csrfToken = await fetchCsrfToken();

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        headers: csrfToken ? { 'x-csrf-token': csrfToken } : undefined,
      });

      console.log('Upload response status:', response.status);

      if (!response.ok) {
        let errorBody: any = {};
        try {
          errorBody = await response.json();
        } catch (_) {
          const text = await response.text().catch(() => '');
          errorBody = text ? { error: text } : {};
        }
        const message =
          errorBody.error || errorBody.message || `Upload failed (${response.status})`;
        console.error('Upload failed:', { status: response.status, body: errorBody });
        throw new Error(message);
      }

      const result = await response.json();
      console.log('Upload successful, result:', result);
      console.log('Returned URL:', result.url);
      
      // Test if the URL is accessible
      if (result.url) {
        const testImg = new window.Image();
        testImg.onload = () => console.log('✅ URL is accessible:', result.url);
        testImg.onerror = () => console.error('❌ URL is not accessible:', result.url);
        testImg.src = result.url;
      }
      
      return result.url;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (images.length + acceptedFiles.length > maxImages) {
        setUploadError(`Maximum ${maxImages} images allowed`);
        return;
      }

      setUploading(true);
      setUploadError(null);

      try {
        const uploadPromises = acceptedFiles.map(uploadImage);
        const uploadedUrls = await Promise.all(uploadPromises);
        const newImages = [...images, ...uploadedUrls.filter(Boolean) as string[]];
        onImagesChange(newImages);
      } catch (error) {
        setUploadError(error instanceof Error ? error.message : 'Upload failed');
      } finally {
        setUploading(false);
      }
    },
    [images, maxImages, onImagesChange]
  );

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...images];
    const [removed] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, removed);
    onImagesChange(newImages);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
    },
    multiple: true,
    disabled: uploading || images.length >= maxImages,
  });

  return (
    <div className={className}>
      <div className="space-y-4">
        {/* Current Images */}
        {images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div
                key={index}
                className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200"
                style={{ minHeight: '150px' }}
              >
                <Image
                  src={image}
                  alt={`Product image ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  priority={index === 0}
                  onError={(e) => {
                    console.error('Image failed to load:', image);
                    e.currentTarget.style.display = 'none';
                  }}
                  onLoad={() => {
                    console.log('Image loaded successfully:', image);
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200">
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex gap-1">
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => moveImage(index, index - 1)}
                          className="bg-gray-900 text-white text-xs px-2 py-1 rounded hover:bg-gray-800 transition-colors"
                        >
                          ←
                        </button>
                      )}
                      {index < images.length - 1 && (
                        <button
                          type="button"
                          onClick={() => moveImage(index, index + 1)}
                          className="bg-gray-900 text-white text-xs px-2 py-1 rounded hover:bg-gray-800 transition-colors"
                        >
                          →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                {index === 0 && (
                  <div className="absolute top-2 left-2">
                    <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">
                      Primary
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Upload Error */}
        {uploadError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <X className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Upload Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{uploadError}</p>
                </div>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => setUploadError(null)}
                    className="bg-red-100 px-2 py-1 rounded text-sm text-red-800 hover:bg-red-200"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && images.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Debug: Image URLs</h4>
            <div className="text-xs text-blue-700 space-y-1">
              {images.map((url, index) => (
                <div key={index} className="break-all">
                  {index + 1}: {url}
                </div>
              ))}
            </div>
          </div>
        )}
        {images.length < maxImages && (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            } ${
              uploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <input {...getInputProps()} />
            <div className="space-y-2">
              {uploading ? (
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <p className="text-sm text-gray-600 mt-2">Uploading...</p>
                </div>
              ) : (
                <>
                  <div className="mx-auto w-12 h-12 text-gray-400">
                    {images.length === 0 ? <Upload className="w-12 h-12" /> : <Plus className="w-12 h-12" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {isDragActive
                        ? 'Drop images here...'
                        : images.length === 0
                        ? 'Upload product images'
                        : 'Add more images'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Drag & drop or click to select ({images.length}/{maxImages})
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      PNG, JPG, WebP up to 5MB
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {uploadError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {uploadError}
          </div>
        )}

        {/* Help Text */}
        <div className="text-xs text-gray-500">
          <p>• First image will be used as the primary product image</p>
          <p>• Use high-quality images for better product presentation</p>
          <p>• You can reorder images by clicking the arrow buttons on hover</p>
        </div>
      </div>
    </div>
  );
}