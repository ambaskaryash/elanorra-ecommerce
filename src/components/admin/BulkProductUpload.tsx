'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CloudArrowUpIcon, 
  DocumentIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  ArrowPathIcon 
} from '@heroicons/react/24/outline';

export function BulkProductUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setSelectedFile(file);
      } else {
        toast.error('Please select a CSV file.');
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a CSV file to upload.');
      return;
    }

    setLoading(true);
    setUploadProgress(0);
    const formData = new FormData();
    formData.append('file', selectedFile);

    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + Math.random() * 15;
      });
    }, 200);

    try {
      const response = await fetch('/api/admin/products/bulk-upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setUploadProgress(100);

      if (response.ok) {
        toast.success(data.message || 'Products uploaded successfully!');
        console.log('Upload results:', data.results);
        setSelectedFile(null);
      } else {
        toast.error(data.message || 'Failed to upload products.');
        console.error('Upload error:', data.error);
      }
    } catch (error) {
      console.error('Network or unexpected error:', error);
      toast.error('An unexpected error occurred during upload.');
    } finally {
      clearInterval(progressInterval);
      setLoading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* File Upload Area */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <CloudArrowUpIcon className="h-5 w-5 text-blue-600" />
          <Label htmlFor="csv-file" className="text-lg font-semibold text-gray-900">
            Select CSV File
          </Label>
        </div>
        
        {/* Drag & Drop Zone */}
        <motion.div
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
            dragActive 
              ? 'border-blue-500 bg-blue-50' 
              : selectedFile 
                ? 'border-green-400 bg-green-50' 
                : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <Input
            id="csv-file"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          
          <div className="space-y-4">
            {selectedFile ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center space-y-3"
              >
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <DocumentIcon className="h-8 w-8 text-green-600" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-gray-900">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                </div>
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircleIcon className="h-5 w-5" />
                  <span className="text-sm font-medium">File ready for upload</span>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-3">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <CloudArrowUpIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    Drop your CSV file here, or <span className="text-blue-600">browse</span>
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Supports CSV files up to 10MB
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Upload Progress */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200"
          >
            <div className="flex items-center space-x-3 mb-4">
              <ArrowPathIcon className="h-5 w-5 text-blue-600 animate-spin" />
              <span className="font-semibold text-gray-900">Uploading Products...</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${uploadProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">{Math.round(uploadProgress)}% complete</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button 
          onClick={handleUpload} 
          disabled={!selectedFile || loading}
          className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center space-x-2">
              <ArrowPathIcon className="h-5 w-5 animate-spin" />
              <span>Processing...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <CloudArrowUpIcon className="h-5 w-5" />
              <span>Upload Products</span>
            </div>
          )}
        </Button>
        
        {selectedFile && !loading && (
          <Button 
            variant="outline"
            onClick={() => setSelectedFile(null)}
            className="px-6 py-3 border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 rounded-xl transition-all duration-300"
          >
            Clear File
          </Button>
        )}
      </div>

      {/* File Requirements */}
       <motion.div
         initial={{ opacity: 0, y: 10 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ delay: 0.2 }}
         className="bg-amber-50 border border-amber-200 rounded-xl p-4"
       >
         <div className="flex items-start space-x-3">
           <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
           <div className="flex-1">
             <div className="flex items-center justify-between mb-2">
               <h4 className="font-semibold text-amber-900">File Requirements</h4>
               <a 
                 href="/sample-products.csv" 
                 download="sample-products.csv"
                 className="text-xs bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded-full transition-colors duration-200 flex items-center space-x-1"
               >
                 <DocumentIcon className="h-3 w-3" />
                 <span>Download Example</span>
               </a>
             </div>
             <ul className="text-sm text-amber-800 space-y-1">
               <li>• File must be in CSV format (.csv)</li>
               <li>• Maximum file size: 10MB</li>
               <li>• First row should contain column headers</li>
               <li>• Ensure data follows the specified format</li>
             </ul>
           </div>
         </div>
       </motion.div>
    </div>
  );
}
