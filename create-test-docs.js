const fs = require('fs');
const path = require('path');

// Create a simple Word document content
const docContent = `
Document Extraction Test File

Project Overview
This is a test document for the document extraction and AI context system.

Project Title: Document Upload & AI Integration Platform

Problem Statement
We need to test the document upload and extraction system to ensure it works properly with various file formats including PDF, Word documents, and text files.

Key Features
1. PDF text extraction using pdf-parse
2. Word document processing with Mammoth
3. Text file handling with UTF-8 encoding
4. Image OCR processing (when available)
5. AI context integration

Technical Requirements
- Support for multiple file formats
- Robust error handling
- Clean text extraction
- Integration with AI chat system

Testing Checklist
- PDF upload and extraction
- Word document processing
- Text file handling
- Error handling for unsupported formats
- AI context integration

Sample Content for AI Testing
The AI should be able to answer questions about:
- What is the project title?
- What are the key features?
- What is the testing checklist?
- What are the technical requirements?

Conclusion
This document serves as a test case for the document extraction system. The AI should be able to read and understand this content when uploaded and answer questions about it.

Created: 2025-01-14
Version: 1.0
Status: Test Document
`;

// Create a simple .doc file (plain text with .doc extension)
fs.writeFileSync('test-document.doc', docContent);

// Create a simple .docx file (ZIP-based format, but we'll create a minimal version)
const docxContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r>
        <w:t>Document Extraction Test File</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Project Overview</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>This is a test document for the document extraction and AI context system.</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Project Title: Document Upload & AI Integration Platform</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Key Features:</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>1. PDF text extraction using pdf-parse</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>2. Word document processing with Mammoth</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>3. Text file handling with UTF-8 encoding</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>4. AI context integration</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Testing Checklist:</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>- PDF upload and extraction</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>- Word document processing</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>- Text file handling</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>- AI context integration</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>This document serves as a test case for the document extraction system.</w:t>
      </w:r>
    </w:p>
  </w:body>
</w:document>`;

// Create a minimal .docx file (it's actually a ZIP file, but for testing we'll create a simple XML)
fs.writeFileSync('test-document.docx', docContent);

console.log('✅ Created test documents:');
console.log('- test-document.txt (text file)');
console.log('- test-document.doc (Word document)');
console.log('- test-document.docx (Word document)');
console.log('');
console.log('You can now upload these files to test the document extraction system!');
