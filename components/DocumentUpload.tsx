'use client'

import { useState, useCallback } from 'react'
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react'

interface UploadedFile {
  id: string
  name: string
  type: string
  size: number
  extractedText: string
  success: boolean
  method: string
  uploadedAt: string
}

export default function DocumentUpload({ 
  onFilesUploaded 
}: { 
  onFilesUploaded: (files: UploadedFile[]) => void 
}) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const uploadFile = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/upload-documents', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error('Upload failed')
    }

    return await response.json()
  }

  const handleFiles = useCallback(async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return

    setUploading(true)
    const uploadedFiles: UploadedFile[] = []

    for (let i = 0; i < fileList.length; i++) {
      try {
        const result = await uploadFile(fileList[i])
        uploadedFiles.push(result)
      } catch (error) {
        console.error('Upload failed:', fileList[i].name, error)
      }
    }

    setFiles(prev => [...prev, ...uploadedFiles])
    onFilesUploaded(uploadedFiles)
    setUploading(false)
  }, [onFilesUploaded])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          Drop files here or{' '}
          <label className="text-blue-600 hover:text-blue-500 cursor-pointer">
            browse
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
              accept=".pdf,.doc,.docx,.txt,.md,.png,.jpg,.jpeg"
            />
          </label>
        </p>
        <p className="text-xs text-gray-500 mt-1">
          PDF, Word, Images, Text files
        </p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map(file => (
            <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3 flex-1">
                <File className="h-5 w-5 text-gray-600" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {file.success ? (
                      <span className="text-green-600">✓ {file.extractedText.length} chars extracted</span>
                    ) : (
                      <span className="text-red-600">✗ Extraction failed</span>
                    )}
                  </p>
                </div>
                {file.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
              <button
                onClick={() => removeFile(file.id)}
                className="ml-2 p-1 hover:bg-gray-200 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {uploading && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600" />
          <p className="mt-2 text-sm text-gray-600">Processing documents...</p>
        </div>
      )}
    </div>
  )
}
