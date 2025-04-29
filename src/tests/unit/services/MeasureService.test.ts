import { v4 as uuidv4 } from 'uuid';
import { MeasureService } from '../../../../src/services/MeasureService';
import MeasureRepository from '../../../../src/repositories/MeasureRepository';
import GeminiService from '../../../../src/services/GeminiService';
import ImageService from '../../../../src/services/ImageService';
import {
  DoubleReportError,
  MeasureNotFoundError,
  ConfirmationDuplicateError,
  InvalidTypeError,
  MeasuresNotFoundError
} from '../../../../src/utils/errors';
import * as validators from '../../../../src/utils/validators';

// Mocks dos módulos
jest.mock('uuid');
jest.mock('../src/repositories/MeasureRepository');
jest.mock('../src/services/GeminiService');
jest.mock('../src/services/ImageService');
jest.mock('../src/utils/validators');

describe('MeasureService', () => {
  let measureService: MeasureService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Configurar mock de UUID para retornar valor previsível
    (uuidv4 as jest.Mock).mockReturnValue('test-uuid-1234');
    
    // Inicializar o serviço
    measureService = new MeasureService();
  });

  describe('createMeasure', () => {
    it('should create a measure successfully with customer code', async () => {
      // Arrange
      const mockRequest = {
        customer_code: 'CUST123',
        image: 'base64-image-data',
        measure_type: 'WATER'
      };
      
      const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
      
      // Mock das dependências
      (MeasureRepository.findByCustomerAndMonth as jest.Mock).mockResolvedValue(null);
      (ImageService.saveImage as jest.Mock).mockResolvedValue('/path/to/saved/image.jpg');
      (GeminiService.extractMeterValue as jest.Mock).mockResolvedValue(123.45);
      (MeasureRepository.create as jest.Mock).mockResolvedValue(undefined);
      (ImageService.getImageUrl as jest.Mock).mockReturnValue('http://example.com/images/image.jpg');
      
      // Act
      const result = await measureService.createMeasure(mockRequest);
      
      // Assert
      expect(MeasureRepository.findByCustomerAndMonth).toHaveBeenCalledWith(
        mockRequest.customer_code,
        expect.stringMatching(isoDateRegex),
        mockRequest.measure_type
      );
      
      expect(ImageService.saveImage).toHaveBeenCalledWith(mockRequest.image);
      expect(GeminiService.extractMeterValue).toHaveBeenCalledWith(mockRequest.image);
      
      expect(MeasureRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        measure_uuid: 'test-uuid-1234',
        customer_code: 'CUST123',
        measure_type: 'WATER',
        measure_value: 123.45,
        image_path: '/path/to/saved/image.jpg',
        measure_datetime: expect.stringMatching(isoDateRegex)
      }));
      
      expect(result).toEqual({
        image_url: 'http://example.com/images/image.jpg',
        measure_value: 123.45,
        measure_uuid: 'test-uuid-1234'
      });
    });
    
    it('should create a measure with generated customer code when empty', async () => {
      // Arrange
      const mockRequest = {
        customer_code: '',
        image: 'base64-image-data',
        measure_type: 'GAS'
      };
      
      // Mock das dependências
      (MeasureRepository.findByCustomerAndMonth as jest.Mock).mockResolvedValue(null);
      (ImageService.saveImage as jest.Mock).mockResolvedValue('/path/to/saved/image.jpg');
      (GeminiService.extractMeterValue as jest.Mock).mockResolvedValue(789.01);
      (MeasureRepository.create as jest.Mock).mockResolvedValue(undefined);
      (ImageService.getImageUrl as jest.Mock).mockReturnValue('http://example.com/images/image.jpg');
      
      // Mock Math.random para garantir um código gerado previsível
      const originalMathRandom = Math.random;
      Math.random = jest.fn().mockReturnValue(0.1); // Isso vai fazer generateUniqueCode retornar 'BBBBBBBB'
      
      // Act
      const result = await measureService.createMeasure(mockRequest);
      
      // Assert
      expect(MeasureRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customer_code: expect.stringMatching(/^[A-Z0-9]{8}$/), // Verifica que um código de 8 caracteres foi gerado
        })
      );
      
      // Restaurar o Math.random original
      Math.random = originalMathRandom;
    });
    
    it('should throw DoubleReportError if measure exists for customer and month', async () => {
      // Arrange
      const mockRequest = {
        customer_code: 'CUST123',
        image: 'base64-image-data',
        measure_type: 'WATER'
      };
      
      // Mock das dependências
      (MeasureRepository.findByCustomerAndMonth as jest.Mock).mockResolvedValue({
        measure_uuid: 'existing-uuid',
        customer_code: 'CUST123',
        measure_type: 'WATER'
      });
      
      // Act & Assert
      await expect(measureService.createMeasure(mockRequest))
        .rejects
        .toThrow(DoubleReportError);
      
      expect(ImageService.saveImage).not.toHaveBeenCalled();
      expect(GeminiService.extractMeterValue).not.toHaveBeenCalled();
      expect(MeasureRepository.create).not.toHaveBeenCalled();
    });
  });
  
  describe('confirmMeasure', () => {
    it('should confirm measure successfully', async () => {
      // Arrange
      const confirmRequest = {
        measure_uuid: 'test-uuid-1234',
        confirmed_value: 125
      };
      
      (MeasureRepository.findByUUID as jest.Mock).mockResolvedValue({
        measure_uuid: 'test-uuid-1234',
        confirmed_value: null
      });
      
      (MeasureRepository.updateConfirmedValue as jest.Mock).mockResolvedValue(undefined);
      
      // Act
      await measureService.confirmMeasure(confirmRequest);
      
      // Assert
      expect(MeasureRepository.findByUUID).toHaveBeenCalledWith('test-uuid-1234');
      expect(MeasureRepository.updateConfirmedValue).toHaveBeenCalledWith(
        'test-uuid-1234',
        125
      );
    });
    
    it('should throw MeasureNotFoundError if measure does not exist', async () => {
      // Arrange
      const confirmRequest = {
        measure_uuid: 'nonexistent-uuid',
        confirmed_value: 125
      };
      
      (MeasureRepository.findByUUID as jest.Mock).mockResolvedValue(null);
      
      // Act & Assert
      await expect(measureService.confirmMeasure(confirmRequest))
        .rejects
        .toThrow(MeasureNotFoundError);
      
      expect(MeasureRepository.updateConfirmedValue).not.toHaveBeenCalled();
    });
    
    it('should throw ConfirmationDuplicateError if measure already confirmed', async () => {
      // Arrange
      const confirmRequest = {
        measure_uuid: 'test-uuid-1234',
        confirmed_value: 125
      };
      
      (MeasureRepository.findByUUID as jest.Mock).mockResolvedValue({
        measure_uuid: 'test-uuid-1234',
        confirmed_value: 120 // Já tem um valor confirmado
      });
      
      // Act & Assert
      await expect(measureService.confirmMeasure(confirmRequest))
        .rejects
        .toThrow(ConfirmationDuplicateError);
      
      expect(MeasureRepository.updateConfirmedValue).not.toHaveBeenCalled();
    });
  });
  
  describe('listMeasures', () => {
    it('should list measures successfully', async () => {
      // Arrange
      const customerCode = 'CUST123';
      const mockMeasures = [
        {
          measure_uuid: 'uuid1',
          customer_code: 'CUST123',
          measure_datetime: '2023-03-15T10:30:00Z',
          measure_type: 'WATER',
          measure_value: 123.45,
          confirmed_value: 125,
          image_path: '/path/to/image1.jpg'
        },
        {
          measure_uuid: 'uuid2',
          customer_code: 'CUST123',
          measure_datetime: '2023-04-15T11:45:00Z',
          measure_type: 'GAS',
          measure_value: 789.01,
          confirmed_value: null,
          image_path: '/path/to/image2.jpg'
        }
      ];
      
      (MeasureRepository.findByCustomer as jest.Mock).mockResolvedValue(mockMeasures);
      (ImageService.getImageUrl as jest.Mock)
        .mockReturnValueOnce('http://example.com/images/image1.jpg')
        .mockReturnValueOnce('http://example.com/images/image2.jpg');
      
      // Act
      const result = await measureService.listMeasures(customerCode);
      
      // Assert
      expect(MeasureRepository.findByCustomer).toHaveBeenCalledWith(customerCode, undefined);
      expect(result).toEqual({
        customer_code: customerCode,
        measures: [
          {
            measure_uuid: 'uuid1',
            measure_datetime: '2023-03-15T10:30:00Z',
            measure_type: 'WATER',
            has_confirmed: true,
            image_url: 'http://example.com/images/image1.jpg'
          },
          {
            measure_uuid: 'uuid2',
            measure_datetime: '2023-04-15T11:45:00Z',
            measure_type: 'GAS',
            has_confirmed: false,
            image_url: 'http://example.com/images/image2.jpg'
          }
        ]
      });
    });
    
    it('should filter measures by type when provided', async () => {
      // Arrange
      const customerCode = 'CUST123';
      const measureType = 'WATER';
      const mockMeasures = [
        {
          measure_uuid: 'uuid1',
          customer_code: 'CUST123',
          measure_datetime: '2023-03-15T10:30:00Z',
          measure_type: 'WATER',
          measure_value: 123.45,
          confirmed_value: 125,
          image_path: '/path/to/image1.jpg'
        }
      ];
      
      (validators.isValidMeasureType as jest.Mock).mockReturnValue(true);
      (MeasureRepository.findByCustomer as jest.Mock).mockResolvedValue(mockMeasures);
      (ImageService.getImageUrl as jest.Mock).mockReturnValue('http://example.com/images/image1.jpg');
      
      // Act
      const result = await measureService.listMeasures(customerCode, measureType);
      
      // Assert
      expect(validators.isValidMeasureType).toHaveBeenCalledWith(measureType);
      expect(MeasureRepository.findByCustomer).toHaveBeenCalledWith(customerCode, measureType);
      expect(result.measures.length).toBe(1);
      expect(result.measures[0].measure_type).toBe('WATER');
    });
    
    it('should throw InvalidTypeError for invalid measure type', async () => {
      // Arrange
      const customerCode = 'CUST123';
      const invalidMeasureType = 'INVALID_TYPE';
      
      (validators.isValidMeasureType as jest.Mock).mockReturnValue(false);
      
      // Act & Assert
      await expect(measureService.listMeasures(customerCode, invalidMeasureType))
        .rejects
        .toThrow(InvalidTypeError);
      
      expect(MeasureRepository.findByCustomer).not.toHaveBeenCalled();
    });
    
    it('should throw MeasuresNotFoundError when no measures exist', async () => {
      // Arrange
      const customerCode = 'EMPTY_CUSTOMER';
      
      (MeasureRepository.findByCustomer as jest.Mock).mockResolvedValue([]);
      
      // Act & Assert
      await expect(measureService.listMeasures(customerCode))
        .rejects
        .toThrow(MeasuresNotFoundError);
    });
    
    it('should handle measures with missing properties', async () => {
      // Arrange
      const customerCode = 'CUST123';
      const mockMeasures = [
        {
          // Alguns campos ausentes
          measure_uuid: 'uuid1',
          measure_type: 'WATER',
          image_path: '/path/to/image1.jpg'
        }
      ];
      
      (MeasureRepository.findByCustomer as jest.Mock).mockResolvedValue(mockMeasures);
      (ImageService.getImageUrl as jest.Mock).mockReturnValue('http://example.com/images/image1.jpg');
      
      // Act
      const result = await measureService.listMeasures(customerCode);
      
      // Assert
      expect(result.measures[0]).toEqual({
        measure_uuid: 'uuid1',
        measure_datetime: '',
        measure_type: 'WATER',
        has_confirmed: false,
        image_url: 'http://example.com/images/image1.jpg'
      });
    });
  });
});