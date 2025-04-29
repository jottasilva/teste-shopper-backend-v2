import { Request, Response } from 'express';
import MeasureController from '../controllers/MeasureController';
import MeasureService from '../services/MeasureService';
import { AppError, InvalidDataError } from '../utils/errors';
import * as validators from '../utils/validators';

// Mock do MeasureService
jest.mock('../services/MeasureService', () => ({
  createMeasure: jest.fn(),
  confirmMeasure: jest.fn(),
  listMeasures: jest.fn()
}));

// Mock dos validadores
jest.mock('../utils/validators', () => ({
  validateMeasureRequest: jest.fn(),
  isValidConfirmedValue: jest.fn(),
  isValidUUID: jest.fn()
}));

describe('MeasureController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseJson: jest.Mock;
  let responseStatus: jest.Mock;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Setup response mock
    responseJson = jest.fn().mockReturnThis();
    responseStatus = jest.fn().mockReturnValue({ json: responseJson });
    mockResponse = {
      status: responseStatus,
      json: responseJson
    };
  });

  describe('upload', () => {
    it('should upload a measure successfully', async () => {
      // Arrange
      const mockData = { measure_type: 'WATER', value: 100 };
      const mockResult = { id: 'uuid', ...mockData };
      
      mockRequest = {
        body: mockData
      };

      (validators.validateMeasureRequest as jest.Mock).mockReturnValue({ isValid: true });
      (MeasureService.createMeasure as jest.Mock).mockResolvedValue(mockResult);

      // Act
      await MeasureController.upload(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(validators.validateMeasureRequest).toHaveBeenCalledWith(mockData);
      expect(MeasureService.createMeasure).toHaveBeenCalledWith(mockData);
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith(mockResult);
    });

    it('should return 400 when validation fails', async () => {
      // Arrange
      const mockData = { measure_type: 'INVALID' };
      const errorMessage = 'Dados de solicitação inválidos';
      
      mockRequest = {
        body: mockData
      };

      (validators.validateMeasureRequest as jest.Mock).mockReturnValue({ 
        isValid: false, 
        errorMessage 
      });

      // Act
      await MeasureController.upload(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(validators.validateMeasureRequest).toHaveBeenCalledWith(mockData);
      expect(MeasureService.createMeasure).not.toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(400); // InvalidDataError tem statusCode 400
      expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
        error_code: 'INVALID_DATA',
        error_description: errorMessage
      }));
    });

    it('should handle service errors properly', async () => {
      // Arrange
      const mockData = { measure_type: 'WATER', value: 100 };
      const serviceError = new AppError('SERVICE_ERROR', 'Erro no serviço', 422);
      
      mockRequest = {
        body: mockData
      };

      (validators.validateMeasureRequest as jest.Mock).mockReturnValue({ isValid: true });
      (MeasureService.createMeasure as jest.Mock).mockRejectedValue(serviceError);

      // Act
      await MeasureController.upload(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(responseStatus).toHaveBeenCalledWith(422);
      expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
        error_code: 'SERVICE_ERROR',
        error_description: 'Erro no serviço'
      }));
    });

    it('should handle unexpected errors', async () => {
      // Arrange
      const mockData = { measure_type: 'WATER', value: 100 };
      const unexpectedError = new Error('Unexpected error');
      
      mockRequest = {
        body: mockData
      };

      (validators.validateMeasureRequest as jest.Mock).mockReturnValue({ isValid: true });
      (MeasureService.createMeasure as jest.Mock).mockRejectedValue(unexpectedError);

      // Spy on console.error
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      await MeasureController.upload(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
        error_code: 'SERVER_ERROR',
        error_description: expect.stringContaining('Ocorreu um erro inesperado')
      }));
      
      // Restore console.error
      consoleErrorSpy.mockRestore();
    });
  });

  describe('confirm', () => {
    it('should confirm a measure successfully', async () => {
      // Arrange
      const mockData = { 
        measure_uuid: '123e4567-e89b-12d3-a456-426614174000', 
        confirmed_value: 100 
      };
      
      mockRequest = {
        body: mockData
      };

      (validators.isValidUUID as jest.Mock).mockReturnValue(true);
      (validators.isValidConfirmedValue as jest.Mock).mockReturnValue(true);
      (MeasureService.confirmMeasure as jest.Mock).mockResolvedValue({ success: true });

      // Act
      await MeasureController.confirm(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(validators.isValidUUID).toHaveBeenCalledWith(mockData.measure_uuid);
      expect(validators.isValidConfirmedValue).toHaveBeenCalledWith(mockData.confirmed_value);
      expect(MeasureService.confirmMeasure).toHaveBeenCalledWith({
        measure_uuid: mockData.measure_uuid,
        confirmed_value: Number(mockData.confirmed_value)
      });
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith({ success: true });
    });

    it('should return 400 when measure_uuid is invalid', async () => {
      // Arrange
      const mockData = { 
        measure_uuid: 'invalid-uuid', 
        confirmed_value: 100 
      };
      
      mockRequest = {
        body: mockData
      };

      (validators.isValidUUID as jest.Mock).mockReturnValue(false);

      // Act
      await MeasureController.confirm(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
        error_code: 'INVALID_DATA',
        error_description: 'É necessário um measure_uuid válido'
      }));
      expect(MeasureService.confirmMeasure).not.toHaveBeenCalled();
    });

    it('should return 400 when confirmed_value is invalid', async () => {
      // Arrange
      const mockData = { 
        measure_uuid: '123e4567-e89b-12d3-a456-426614174000', 
        confirmed_value: 'not-a-number' 
      };
      
      mockRequest = {
        body: mockData
      };

      (validators.isValidUUID as jest.Mock).mockReturnValue(true);
      (validators.isValidConfirmedValue as jest.Mock).mockReturnValue(false);

      // Act
      await MeasureController.confirm(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
        error_code: 'INVALID_DATA',
        error_description: 'O valor de confirmação deve ser um inteiro válido'
      }));
      expect(MeasureService.confirmMeasure).not.toHaveBeenCalled();
    });

    it('should handle unexpected errors in confirm', async () => {
      // Arrange
      const mockData = { 
        measure_uuid: '123e4567-e89b-12d3-a456-426614174000', 
        confirmed_value: 100 
      };
      
      mockRequest = {
        body: mockData
      };

      (validators.isValidUUID as jest.Mock).mockReturnValue(true);
      (validators.isValidConfirmedValue as jest.Mock).mockReturnValue(true);
      (MeasureService.confirmMeasure as jest.Mock).mockRejectedValue(new Error('Unexpected error'));

      // Spy on console.error
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      await MeasureController.confirm(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
        error_code: 'SERVER_ERROR'
      }));
      
      // Restore console.error
      consoleErrorSpy.mockRestore();
    });
  });

  describe('list', () => {
    it('should list measures for a customer successfully', async () => {
      // Arrange
      const customerCode = 'CUST123';
      const mockMeasures = [
        { id: 'uuid1', measure_type: 'WATER', value: 100 },
        { id: 'uuid2', measure_type: 'GAS', value: 200 }
      ];
      
      mockRequest = {
        params: { customerCode },
        query: {}
      };

      (MeasureService.listMeasures as jest.Mock).mockResolvedValue(mockMeasures);

      // Act
      await MeasureController.list(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(MeasureService.listMeasures).toHaveBeenCalledWith(customerCode, undefined);
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith({
        customer_code: customerCode,
        measures: mockMeasures
      });
    });

    it('should list measures filtered by measure_type', async () => {
      // Arrange
      const customerCode = 'CUST123';
      const measureType = 'water';
      const mockMeasures = [
        { id: 'uuid1', measure_type: 'WATER', value: 100 }
      ];
      
      mockRequest = {
        params: { customerCode },
        query: { measure_type: measureType }
      };

      (MeasureService.listMeasures as jest.Mock).mockResolvedValue(mockMeasures);

      // Act
      await MeasureController.list(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(MeasureService.listMeasures).toHaveBeenCalledWith(customerCode, 'WATER');
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith({
        customer_code: customerCode,
        measures: mockMeasures
      });
    });

    it('should return 400 for invalid measure_type', async () => {
      // Arrange
      const customerCode = 'CUST123';
      const invalidMeasureType = 'ELECTRICITY';
      
      mockRequest = {
        params: { customerCode },
        query: { measure_type: invalidMeasureType }
      };

      // Act
      await MeasureController.list(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(MeasureService.listMeasures).not.toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
        error_code: 'INVALID_TYPE',
        error_description: 'Tipo de medição não permitida'
      }));
    });

    it('should handle service errors in list', async () => {
      // Arrange
      const customerCode = 'CUST123';
      const serviceError = new AppError('NOT_FOUND', 'Cliente não encontrado', 404);
      
      mockRequest = {
        params: { customerCode },
        query: {}
      };

      (MeasureService.listMeasures as jest.Mock).mockRejectedValue(serviceError);

      // Act
      await MeasureController.list(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
        error_code: 'NOT_FOUND',
        error_description: 'Cliente não encontrado'
      }));
    });

    it('should handle unexpected errors in list', async () => {
      // Arrange
      const customerCode = 'CUST123';
      
      mockRequest = {
        params: { customerCode },
        query: {}
      };

      (MeasureService.listMeasures as jest.Mock).mockRejectedValue(new Error('Database connection error'));

      // Spy on console.error
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      await MeasureController.list(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
        error_code: 'SERVER_ERROR'
      }));
      
      // Restore console.error
      consoleErrorSpy.mockRestore();
    });

    it('should handle measures returned as an object with measures property', async () => {
      // Arrange
      const customerCode = 'CUST123';
      const mockMeasuresObject = {
        measures: [
          { id: 'uuid1', measure_type: 'WATER', value: 100 },
          { id: 'uuid2', measure_type: 'GAS', value: 200 }
        ],
        total: 2
      };
      
      mockRequest = {
        params: { customerCode },
        query: {}
      };

      (MeasureService.listMeasures as jest.Mock).mockResolvedValue(mockMeasuresObject);

      // Act
      await MeasureController.list(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith({
        customer_code: customerCode,
        measures: mockMeasuresObject.measures
      });
    });
  });
});