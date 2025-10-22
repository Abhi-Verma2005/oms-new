'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Upload, File, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Document {
  id: string;
  originalName: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  mimeType?: string;
  uploadedAt: string;
  accessCount: number;
}

interface DocumentUploadProps {
  onDocumentSelect?: (documents: Document[]) => void;
  selectedDocuments?: Document[];
  className?: string;
}

export function DocumentUpload({ 
  onDocumentSelect, 
  selectedDocuments = [], 
  className 
}: DocumentUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload-document', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      
      if (result.success) {
        setDocuments(prev => [result.document, ...prev]);
        toast.success('Document uploaded successfully');
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload document');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/upload-document?search=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDocumentToggle = (document: Document) => {
    const isSelected = selectedDocuments.some(doc => doc.id === document.id);
    
    if (isSelected) {
      onDocumentSelect?.(selectedDocuments.filter(doc => doc.id !== document.id));
    } else {
      onDocumentSelect?.([...selectedDocuments, document]);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  React.useEffect(() => {
    loadDocuments();
  }, [searchQuery]);

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <File className="h-5 w-5" />
          Document Upload
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Section */}
        <div className="space-y-2">
          <Label htmlFor="file-upload">Upload Document</Label>
          <div className="flex items-center gap-2">
            <Input
              ref={fileInputRef}
              id="file-upload"
              type="file"
              onChange={handleFileUpload}
              accept=".pdf,.doc,.docx,.xlsx,.xls,.txt,.md,.csv"
              disabled={isUploading}
              className="flex-1"
            />
            {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
        </div>

        {/* Search Section */}
        <div className="space-y-2">
          <Label htmlFor="document-search">Search Documents</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="document-search"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Documents List */}
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No documents found
            </div>
          ) : (
            documents.map((document) => {
              const isSelected = selectedDocuments.some(doc => doc.id === document.id);
              
              return (
                <div
                  key={document.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors",
                    isSelected 
                      ? "bg-primary/10 border-primary" 
                      : "hover:bg-muted/50"
                  )}
                  onClick={() => handleDocumentToggle(document)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {document.originalName}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <span>{formatFileSize(document.fileSize)}</span>
                        <span>•</span>
                        <span>{formatDate(document.uploadedAt)}</span>
                        {document.accessCount > 0 && (
                          <>
                            <span>•</span>
                            <span>{document.accessCount} uses</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <Badge variant="secondary" className="ml-2">
                      Selected
                    </Badge>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Selected Documents Summary */}
        {selectedDocuments.length > 0 && (
          <div className="pt-2 border-t">
            <div className="text-sm text-muted-foreground">
              {selectedDocuments.length} document(s) selected
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

