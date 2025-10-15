'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button'; // Assuming a shadcn/ui button component
import { Input } from '@/components/ui/input';   // Assuming a shadcn/ui input component
import { Label } from '@/components/ui/label';   // Assuming a shadcn/ui label component
import { toast } from 'sonner'; // Assuming sonner for notifications

export function BulkProductUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a CSV file to upload.');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('/api/admin/products/bulk-upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Products uploaded successfully!');
        console.log('Upload results:', data.results);
        setSelectedFile(null); // Clear selected file after successful upload
      } else {
        toast.error(data.message || 'Failed to upload products.');
        console.error('Upload error:', data.error);
      }
    } catch (error) {
      console.error('Network or unexpected error:', error);
      toast.error('An unexpected error occurred during upload.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-4">
      <Label htmlFor="csv-file">Upload Product CSV</Label>
      <Input
        id="csv-file"
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="col-span-2"
      />
      <Button onClick={handleUpload} disabled={!selectedFile || loading}>
        {loading ? 'Uploading...' : 'Upload CSV'}
      </Button>
      {selectedFile && (
        <p className="text-sm text-muted-foreground">Selected file: {selectedFile.name}</p>
      )}
      <p className="text-sm text-muted-foreground">
        Expected CSV columns: `name,slug,description,price,compareAtPrice,category,tags,inStock,inventory,weight,dimensions`
      </p>
    </div>
  );
}
