import { Request, Response } from 'express';
import MeasureController from '../../../controllers/MeasureController';
import MeasureService from '../../../services/MeasureService';
import { AppError } from '../../../utils/errors';
import * as validators from '../../../utils/validators';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });
jest.mock('../../../services/MeasureService');
jest.mock('../../../utils/validators');

describe('MeasureController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseJson: jest.Mock;
  let responseStatus: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    responseJson = jest.fn().mockReturnValue({});
    responseStatus = jest.fn().mockReturnThis();

    mockResponse = {
      status: responseStatus,
      json: responseJson
    };

    mockRequest = {
      body: {},
      params: {},
      query: {}
    };
  });

  describe('upload', () => {
    it('deve retornar status 200 e resultado quando upload for bem-sucedido', async () => {
      const mockBody = {
        measure_type: 'WATER',
        value: 123,
        customer_code: 'ABC123'
      };
      mockRequest.body = mockBody;

      const expectedResult = {
        measure_uuid: '123e4567-e89b-12d3-a456-426614174000',
        status: 'PENDING'
      };

      (validators.validateMeasureRequest as jest.Mock).mockReturnValue({ isValid: true });
      (MeasureService.createMeasure as jest.Mock).mockResolvedValue(expectedResult);

      await MeasureController.upload(mockRequest as Request, mockResponse as Response);

      expect(validators.validateMeasureRequest).toHaveBeenCalledWith(mockBody);
      expect(MeasureService.createMeasure).toHaveBeenCalledWith(mockBody);
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith(expectedResult);
    });

    it('deve retornar status 400 quando a validação falhar', async () => {
      const errorMessage = 'Dados de solicitação inválidos';
      (validators.validateMeasureRequest as jest.Mock).mockReturnValue({ isValid: false, errorMessage });

      await MeasureController.upload(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
        error_code: 'INVALID_DATA',
        error_description: errorMessage
      }));
      expect(MeasureService.createMeasure).not.toHaveBeenCalled();
    });

    it('deve retornar status 500 quando ocorrer erro inesperado', async () => {
      const mockError = new Error('Erro de teste');
      (validators.validateMeasureRequest as jest.Mock).mockReturnValue({ isValid: true });
      (MeasureService.createMeasure as jest.Mock).mockRejectedValue(mockError);

      await MeasureController.upload(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
        error_code: 'SERVER_ERROR',
        error_description: expect.stringContaining('Ocorreu um erro inesperado')
      }));
    });

    it('deve retornar status correto quando AppError for lançado', async () => {
        const appError = new AppError('Erro personalizado', 422, 'CUSTOM_ERROR');
        (validators.validateMeasureRequest as jest.Mock).mockReturnValue({ isValid: true });
        (MeasureService.createMeasure as jest.Mock).mockRejectedValue(appError);
      
        await MeasureController.upload(mockRequest as Request, mockResponse as Response);
      
        expect(responseStatus).toHaveBeenCalledWith(422);
        expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
          error_code: 'CUSTOM_ERROR',
          error_description: 'Erro personalizado'
        }));
      });
      
  });

  describe('confirm', () => {
    it('deve retornar status 200 quando confirmação for bem-sucedida', async () => {
      mockRequest.body = {
        measure_uuid: '123e4567-e89b-12d3-a456-426614174000',
        confirmed_value: 123
      };

      (validators.isValidUUID as jest.Mock).mockReturnValue(true);
      (validators.isValidConfirmedValue as jest.Mock).mockReturnValue(true);
      (MeasureService.confirmMeasure as jest.Mock).mockResolvedValue(undefined);

      await MeasureController.confirm(mockRequest as Request, mockResponse as Response);

      expect(validators.isValidUUID).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
      expect(validators.isValidConfirmedValue).toHaveBeenCalledWith(123);
      expect(MeasureService.confirmMeasure).toHaveBeenCalledWith({
        measure_uuid: '123e4567-e89b-12d3-a456-426614174000',
        confirmed_value: 123
      });
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith({ success: true });
    });

    it('deve retornar status 400 para measure_uuid inválido', async () => {
      mockRequest.body = {
        measure_uuid: 'invalid-uuid',
        confirmed_value: 123
      };

      (validators.isValidUUID as jest.Mock).mockReturnValue(false);

      await MeasureController.confirm(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
        error_code: 'INVALID_DATA',
        error_description: 'É necessário um measure_uuid válido'
      }));
      expect(MeasureService.confirmMeasure).not.toHaveBeenCalled();
    });

    it('deve retornar status 400 para confirmed_value inválido', async () => {
      mockRequest.body = {
        measure_uuid: '123e4567-e89b-12d3-a456-426614174000',
        confirmed_value: 'abc'
      };

      (validators.isValidUUID as jest.Mock).mockReturnValue(true);
      (validators.isValidConfirmedValue as jest.Mock).mockReturnValue(false);

      await MeasureController.confirm(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
        error_code: 'INVALID_DATA',
        error_description: 'O valor de confirmação deve ser um inteiro válido'
      }));
      expect(MeasureService.confirmMeasure).not.toHaveBeenCalled();
    });

    it('deve retornar status 500 para erro inesperado', async () => {
      mockRequest.body = {
        measure_uuid: '123e4567-e89b-12d3-a456-426614174000',
        confirmed_value: 123
      };

      const mockError = new Error('Erro de teste');
      (validators.isValidUUID as jest.Mock).mockReturnValue(true);
      (validators.isValidConfirmedValue as jest.Mock).mockReturnValue(true);
      (MeasureService.confirmMeasure as jest.Mock).mockRejectedValue(mockError);

      await MeasureController.confirm(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
        error_code: 'SERVER_ERROR',
        error_description: 'Ocorreu um erro inesperado'
      }));
    });
  });

  describe('list', () => {
    it('deve retornar status 200 com medições listadas', async () => {
      const customerCode = 'ABC123';
      const expectedMeasures = [
        { measure_uuid: '123e4567-e89b-12d3-a456-426614174000', value: 100 },
        { measure_uuid: '223e4567-e89b-12d3-a456-426614174000', value: 200 }
      ];

      mockRequest.params = { customerCode };
      mockRequest.query = {};

      (MeasureService.listMeasures as jest.Mock).mockResolvedValue(expectedMeasures);

      await MeasureController.list(mockRequest as Request, mockResponse as Response);

      expect(MeasureService.listMeasures).toHaveBeenCalledWith(customerCode, undefined);
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith({
        customer_code: customerCode,
        measures: expectedMeasures
      });
    });

    it('deve filtrar por measure_type quando fornecido', async () => {
      const customerCode = 'ABC123';
      const measureType = 'WATER';
      const expectedMeasures = [
        { measure_uuid: '123e4567-e89b-12d3-a456-426614174000', value: 100 }
      ];

      mockRequest.params = { customerCode };
      mockRequest.query = { measure_type: measureType };

      (MeasureService.listMeasures as jest.Mock).mockResolvedValue(expectedMeasures);

      await MeasureController.list(mockRequest as Request, mockResponse as Response);

      expect(MeasureService.listMeasures).toHaveBeenCalledWith(customerCode, measureType.toUpperCase());
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith({
        customer_code: customerCode,
        measures: expectedMeasures
      });
    });

    it('deve retornar status 400 para measure_type inválido', async () => {
      const customerCode = 'ABC123';

      mockRequest.params = { customerCode };
      mockRequest.query = { measure_type: 'INVALID_TYPE' };

      await MeasureController.list(mockRequest as Request, mockResponse as Response);

      expect(MeasureService.listMeasures).not.toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
        error_code: 'INVALID_TYPE',
        error_description: 'Tipo de medição não permitida'
      }));
    });

    it('deve tratar formatos de retorno do MeasureService', async () => {
      const customerCode = 'ABC123';
      const serviceMeasures = {
        measures: [
          { measure_uuid: '123e4567-e89b-12d3-a456-426614174000', value: 100 }
        ]
      };

      mockRequest.params = { customerCode };
      mockRequest.query = {};

      (MeasureService.listMeasures as jest.Mock).mockResolvedValue(serviceMeasures);

      await MeasureController.list(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith({
        customer_code: customerCode,
        measures: serviceMeasures.measures
      });
    });

    it('deve retornar status 500 para erro inesperado', async () => {
      const customerCode = 'ABC123';
      const mockError = new Error('Erro de teste');

      mockRequest.params = { customerCode };
      mockRequest.query = {};

      (MeasureService.listMeasures as jest.Mock).mockRejectedValue(mockError);

      await MeasureController.list(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
        error_code: 'SERVER_ERROR',
        error_description: 'Ocorreu um erro inesperado'
      }));
    });
  });
});
