import { readFile } from 'fs/promises';
import * as path from 'path';
import { DocumentParseResult } from '../src/types/extraction';
import { safeLog, safeError } from './safeConsole.js';

// Dynamic imports for document parsers
let pdfParse: any;
let mammoth: any;

async function loadParsers() {
  if (!pdfParse) {
    const pdfModule = await import('pdf-parse');
    // pdf-parse v2.x exports PDFParse as a named export
    pdfParse = pdfModule.PDFParse;
  }
  if (!mammoth) {
    mammoth = await import('mammoth');
  }
}

/**
 * Parse PDF document to extract text content
 */
async function parsePDF(filePath: string): Promise<DocumentParseResult> {
  try {
    await loadParsers();

    const dataBuffer = await readFile(filePath);
    // pdf-parse v2.x requires 'new' keyword with document initialization
    const parser = new pdfParse({ data: dataBuffer });
    const textResult = await parser.getText();

    const text = textResult.text;
    const pageCount = textResult.pages.length;

    return {
      success: true,
      content: text,
      metadata: {
        pageCount: pageCount,
        wordCount: text.split(/\s+/).length,
        hasImages: false, // pdf-parse doesn't extract this easily
        hasTables: text.includes('|') || /\t.*\t/.test(text)
      }
    };
  } catch (error) {
    safeError('[DocumentParser] PDF parsing error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown PDF parsing error'
    };
  }
}

/**
 * Parse Word document (.docx) to extract text content
 */
async function parseWord(filePath: string): Promise<DocumentParseResult> {
  try {
    await loadParsers();

    const dataBuffer = await readFile(filePath);
    const result = await mammoth.extractRawText({ buffer: dataBuffer });

    const wordCount = result.value.split(/\s+/).length;

    return {
      success: true,
      content: result.value,
      metadata: {
        wordCount,
        hasImages: false, // mammoth doesn't easily expose this
        hasTables: result.value.includes('\t')
      }
    };
  } catch (error) {
    safeError('[DocumentParser] Word parsing error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown Word parsing error'
    };
  }
}

/**
 * Read plain text file
 */
async function parseText(filePath: string): Promise<DocumentParseResult> {
  try {
    const content = await readFile(filePath, 'utf-8');
    const wordCount = content.split(/\s+/).length;

    return {
      success: true,
      content,
      metadata: {
        wordCount,
        hasImages: false,
        hasTables: content.includes('\t') || content.includes('|')
      }
    };
  } catch (error) {
    safeError('[DocumentParser] Text parsing error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown text parsing error'
    };
  }
}

/**
 * Main document parser - routes to appropriate parser based on file extension
 */
export async function parseDocument(filePath: string): Promise<DocumentParseResult> {
  const ext = path.extname(filePath).toLowerCase();

  safeLog('[DocumentParser] Parsing document:', filePath);
  safeLog('[DocumentParser] File extension:', ext);

  switch (ext) {
    case '.pdf':
      return parsePDF(filePath);

    case '.docx':
    case '.doc':
      return parseWord(filePath);

    case '.txt':
    case '.md':
    case '.markdown':
      return parseText(filePath);

    default:
      return {
        success: false,
        error: `Unsupported file format: ${ext}. Supported formats: .pdf, .docx, .doc, .txt, .md`
      };
  }
}

/**
 * Validate that a file exists and is readable
 */
export async function validateDocumentFile(filePath: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const ext = path.extname(filePath).toLowerCase();
    const supportedExtensions = ['.pdf', '.docx', '.doc', '.txt', '.md', '.markdown'];

    if (!supportedExtensions.includes(ext)) {
      return {
        valid: false,
        error: `Unsupported file format: ${ext}. Supported formats: ${supportedExtensions.join(', ')}`
      };
    }

    // Try to read the file to ensure it exists and is accessible
    await readFile(filePath);

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown validation error'
    };
  }
}

/**
 * Get file info without parsing the full content
 */
export async function getDocumentInfo(filePath: string): Promise<{
  name: string;
  extension: string;
  size: number;
  supported: boolean;
}> {
  const ext = path.extname(filePath).toLowerCase();
  const name = path.basename(filePath);
  const supportedExtensions = ['.pdf', '.docx', '.doc', '.txt', '.md', '.markdown'];

  try {
    const stats = await readFile(filePath);

    return {
      name,
      extension: ext,
      size: stats.length,
      supported: supportedExtensions.includes(ext)
    };
  } catch (error) {
    throw new Error(`Failed to get document info: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
