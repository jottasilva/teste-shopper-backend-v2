import { GeminiService } from '../../../../src/services/GeminiService';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Mock da biblioteca externa
jest.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: jest.fn().mockResolvedValue({
          response: {
            text: jest.fn().mockReturnValue('12345')
          }
        })
      })
    }))
  };
});

describe('GeminiService', () => {
  beforeEach(() => {
    process.env.GEMINI_API_KEY = 'fake-api-key'; // Define uma variável fake
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should instantiate GeminiService correctly', () => {
    const service = new GeminiService();
    expect(service).toBeInstanceOf(GeminiService);
  });

  it('should extract meter value from image successfully', async () => {
    const service = new GeminiService();
    const base64Image = 'fake_base64_image_data';
    const value = await service.extractMeterValue(base64Image);

    expect(value).toBe(12345);
  });

  it('should throw error if GEMINI_API_KEY is missing', () => {
    delete process.env.GEMINI_API_KEY;
    expect(() => new GeminiService()).toThrow('GEMINI_API_KEY não está definido nas variáveis ​​de ambiente');
  });

  it('should throw error if returned value is not numeric', async () => {
    // sobrescreve o mock para simular uma resposta inválida
    (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: jest.fn().mockResolvedValue({
          response: {
            text: jest.fn().mockReturnValue('invalid response text')
          }
        })
      })
    }));

    const service = new GeminiService();
    const base64Image = 'fake_base64_image_data';

    await expect(service.extractMeterValue(base64Image))
      .rejects
      .toThrow('Falha ao processar Imagem');
  });
});
