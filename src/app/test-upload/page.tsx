'use client';

import React, { useState } from 'react';
import ImageUpload from '@/components/admin/ImageUpload';

export default function TestUploadPage() {
  const [images, setImages] = useState<string[]>([]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Image Upload Test Page
          </h1>
          
          <div className="space-y-4">
            <p className="text-gray-600">
              This is a test page to debug image upload functionality without authentication.
            </p>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Image Upload Component</h2>
              <ImageUpload
                images={images}
                onImagesChange={setImages}
                maxImages={5}
              />
            </div>
            
            {images.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Uploaded Images:</h3>
                <div className="bg-gray-100 p-4 rounded-lg">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                    {JSON.stringify(images, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}