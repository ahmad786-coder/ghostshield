import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import Papa from 'papaparse';
import { sanitizeText, type DetectionToggles } from './sanitizerEngine';
import type { CustomEntityDefinition, SanitizationResult } from '../types/ghostshield';

// Safely configure pdf.js web worker for local Vite runtime
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;
}

/**
 * Extracts plain text locally from a PDF ArrayBuffer or File
 */
export async function extractTextFromPdf(fileOrBuffer: File | ArrayBuffer): Promise<string> {
  const arrayBuffer =
    fileOrBuffer instanceof File ? await fileOrBuffer.arrayBuffer() : fileOrBuffer;

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    useSystemFonts: true,
  });

  const pdf = await loadingTask.promise;
  let fullText = '';

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str || '')
      .join(' ');
    fullText += `--- Page ${pageNum} ---\n` + pageText + '\n\n';
  }

  return fullText.trim();
}

/**
 * Parses and sanitizes a CSV file column-by-column while preserving exact RFC-4180 structure.
 */
export async function sanitizeCsvFile(
  file: File,
  options: {
    toggles?: Partial<DetectionToggles>;
    customEntities?: CustomEntityDefinition[];
    whitelistTokens?: string[];
  } = {}
): Promise<{
  sanitizedCsvString: string;
  sanitizationResult: SanitizationResult;
}> {
  return new Promise((resolve, reject) => {
    Papa.parse<string[]>(file, {
      skipEmptyLines: false,
      complete: (results) => {
        try {
          const rows = results.data;
          // Flatten all cells with row & column markers, or serialize to text
          const serializedRaw = Papa.unparse(rows);

          // Run through GhostShield sanitizer engine
          const sanitizedResult = sanitizeText(serializedRaw, options);

          resolve({
            sanitizedCsvString: sanitizedResult.sanitizedText,
            sanitizationResult: sanitizedResult,
          });
        } catch (err) {
          reject(err);
        }
      },
      error: (err) => reject(err),
    });
  });
}
