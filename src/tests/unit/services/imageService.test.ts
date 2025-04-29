import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import ImageService from '../../../../src/services/ImageService';

// Mock dos módulos externos
jest.mock('fs', () => ({
  promises: {
    writeFile: jest.fn().mockResolvedValue(undefined),
    access: jest.fn()
  },
  constants: { F_OK: 4 }
}));

jest.mock('path', () => ({
  join: jest.fn().mockImplementation((...args) => args.join('/'))
}));

jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mocked-uuid')
}));

describe('ImageService', () => {
  beforeEach(() => {
    // Configurações de ambiente para testes
    process.env.UPLOADS_PATH = '/fake/uploads/path';
    process.env.BASE_URL = 'http://test.example.com';
    
    // Reset dos mocks antes de cada teste
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Limpar variáveis de ambiente depois de cada teste
    delete process.env.UPLOADS_PATH;
    delete process.env.BASE_URL;
  });

  describe('saveImage', () => {
    it('should save base64 image correctly', async () => {
      // Arrange
      const base64Data = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/';
      const expectedFilePath = '/fake/uploads/path/images/water/mocked-uuid.jpg';
      
      // Act
      const result = await ImageService.saveImage(base64Data, 'WATER');
      
      // Assert
      expect(path.join).toHaveBeenCalledWith(
        process.env.UPLOADS_PATH,
        'images',
        'water',
        'mocked-uuid.jpg'
      );
      expect(fs.promises.writeFile).toHaveBeenCalledWith(
        expectedFilePath,
        expect.any(Buffer),
        expect.any(Object)
      );
      expect(result).toBe('images/water/mocked-uuid.jpg');
    });

    it('should handle different measure types correctly', async () => {
      // Arrange
      const base64Data = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/';
      
      // Act
      const result = await ImageService.saveImage(base64Data, 'GAS');
      
      // Assert
      expect(path.join).toHaveBeenCalledWith(
        process.env.UPLOADS_PATH,
        'images',
        'gas',
        'mocked-uuid.jpg'
      );
      expect(result).toBe('images/gas/mocked-uuid.jpg');
    });

    it('should throw error if base64 format is invalid', async () => {
      // Arrange
      const invalidBase64 = 'invalid-base64-format';
      
      // Act & Assert
      await expect(ImageService.saveImage(invalidBase64, 'WATER'))
        .rejects
        .toThrow('Formato de imagem inválido');
    });

    it('should throw error if UPLOADS_PATH is not defined', async () => {
      // Arrange
      delete process.env.UPLOADS_PATH;
      const base64Data = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/';
      
      // Act & Assert
      await expect(ImageService.saveImage(base64Data, 'WATER'))
        .rejects
        .toThrow('UPLOADS_PATH não está definido nas variáveis de ambiente');
    });

    it('should handle filesystem write errors', async () => {
      // Arrange
      const base64Data = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/';
      const writeError = new Error('Disk full');
      (fs.promises.writeFile as jest.Mock).mockRejectedValueOnce(writeError);
      
      // Act & Assert
      await expect(ImageService.saveImage(base64Data, 'WATER'))
        .rejects
        .toThrow('Erro ao salvar imagem: Disk full');
    });
  });

  describe('getImageUrl', () => {
    it('should return correct URL for an image path', () => {
      // Arrange
      const imagePath = 'images/water/some-uuid.jpg';
      const expectedUrl = 'http://test.example.com/images/water/some-uuid.jpg';
      
      // Act
      const result = ImageService.getImageUrl(imagePath);
      
      // Assert
      expect(result).toBe(expectedUrl);
    });

    it('should return null if image path is null', () => {
      // Act
      const result = ImageService.getImageUrl(null);
      
      // Assert
      expect(result).toBeNull();
    });

    it('should throw error if BASE_URL is not defined', () => {
      // Arrange
      delete process.env.BASE_URL;
      const imagePath = 'images/water/some-uuid.jpg';
      
      // Act & Assert
      expect(() => ImageService.getImageUrl(imagePath))
        .toThrow('BASE_URL não está definido nas variáveis de ambiente');
    });
  });

  describe('checkIfFileExists', () => {
    it('should return true if file exists', async () => {
      // Arrange
      (fs.promises.access as jest.Mock).mockResolvedValueOnce(undefined);
      const filePath = 'images/test.jpg';
      
      // Act
      const result = await ImageService.checkIfFileExists(filePath);
      
      // Assert
      expect(result).toBe(true);
      expect(fs.promises.access).toHaveBeenCalledWith(
        expect.stringContaining(filePath),
        fs.constants.F_OK
      );
    });

    it('should return false if file does not exist', async () => {
      // Arrange
      (fs.promises.access as jest.Mock).mockRejectedValueOnce(new Error('ENOENT'));
      const filePath = 'images/nonexistent.jpg';
      
      // Act
      const result = await ImageService.checkIfFileExists(filePath);
      
      // Assert
      expect(result).toBe(false);
    });

    it('should handle unexpected errors during file check', async () => {
      // Arrange
      const unexpectedError = new Error('Permission denied');
      (fs.promises.access as jest.Mock).mockRejectedValueOnce(unexpectedError);
      const filePath = 'images/protected.jpg';
      
      // Act & Assert
      await expect(ImageService.checkIfFileExists(filePath))
        .rejects
        .toThrow('Erro ao verificar se o arquivo existe: Permission denied');
    });
  });
});