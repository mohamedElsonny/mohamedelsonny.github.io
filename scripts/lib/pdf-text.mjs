import { extractText, getDocumentProxy } from 'unpdf';

/**
 * @param {Buffer | Uint8Array} buffer
 * @returns {Promise<{ text: string, pages: number }>}
 */
export async function pdfText(buffer) {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text, totalPages } = await extractText(pdf, { mergePages: true });
  return { text, pages: totalPages };
}
