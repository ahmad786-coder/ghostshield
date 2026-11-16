import Papa from 'papaparse';
import { sanitizeText, type DetectionToggles } from './sanitizerEngine';
import type { CustomEntityDefinition, SanitizationResult } from '../types/ghostshield';

/**
 * Extracts plain text locally from a PDF ArrayBuffer or File.
 * Dynamically loads pdfjs-dist and its worker URL only when a PDF is provided.
 */
export async function extractTextFromPdf(fileOrBuffer: File | ArrayBuffer): Promise<string> {
  const [pdfjsLib, { default: workerUrl }] = await Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
  ]);

  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

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
  const text = await file.text();
  const parsed = Papa.parse<string[]>(text, {
    skipEmptyLines: false,
  });

  const serializedRaw = Papa.unparse(parsed.data);
  const sanitizedResult = sanitizeText(serializedRaw, options);

  return {
    sanitizedCsvString: sanitizedResult.sanitizedText,
    sanitizationResult: sanitizedResult,
  };
}
