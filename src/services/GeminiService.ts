import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });  // Carrega as variáveis de ambiente antes de qualquer coisa

import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiService {
  private apiKey: string;
  private genAI: GoogleGenerativeAI;
  
  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY não está definido nas variáveis ​​de ambiente');
    }
    
    this.apiKey = apiKey;
    this.genAI = new GoogleGenerativeAI(this.apiKey);
  }
  
  async extractMeterValue(base64Image: string): Promise<number> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const result = await model.generateContent([
        "You are a utility meter reading assistant. Extract the numeric value shown on the meter in the image. Return ONLY the numeric value with no other text or explanation.",
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Image
          }
        }
      ]);
      
      const response = result.response;
      const textResponse = response.text().trim();
      
      const numericValue = parseInt(textResponse.replace(/\D/g, ''), 10);
      
      if (isNaN(numericValue)) {
        throw new Error('Falha ao extrair um valor numérico válido da imagem');
      }
      
      return numericValue;
    } catch (error) {
      console.error('Erro ao extrair valor do medidor da imagem:', error);
      throw new Error('Falha ao processar Imagem');
    }
  }
}

export default new GeminiService();
