import { Request, Response } from 'express';
import MeasureService from '../services/MeasureService';
import {
  validateMeasureRequest,
  isValidConfirmedValue,
  isValidUUID 
} from '../utils/validators';
import { AppError, InvalidDataError } from '../utils/errors';

const upload = async (req: Request, res: Response): Promise<Response> => {
  try {
    const validation = validateMeasureRequest(req.body);
    if (!validation.isValid) {
      throw new InvalidDataError(validation.errorMessage || 'Dados de solicitação inválidos');
    }
    const result = await MeasureService.createMeasure(req.body);
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json(error.toResponse());
    }
    
    console.error('Erro ao tentar realizar upload no endpoint:', error);
    return res.status(500).json({
      error_code: 'SERVER_ERROR',
      error_description: 'Ocorreu um erro inesperado: ' + error,
    });
  }
};

const confirm = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { measure_uuid, confirmed_value } = req.body;
    if (!measure_uuid || !isValidUUID(measure_uuid)) {
      throw new InvalidDataError('É necessário um measure_uuid válido');
    }
    if (!isValidConfirmedValue(confirmed_value)) {
      throw new InvalidDataError('O valor de confirmação deve ser um inteiro válido');
    }
    await MeasureService.confirmMeasure({
      measure_uuid,
      confirmed_value: Number(confirmed_value)
    });
    return res.status(200).json({ success: true });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json(error.toResponse());
    }
    console.error('Erro ao confirmar ponto final:', error);
    return res.status(500).json({
      error_code: 'SERVER_ERROR',
      error_description: 'Ocorreu um erro inesperado'
    });
  }
};

const list = async (req: Request, res: Response): Promise<Response> => {
  try {
    const customerCode = req.params.customerCode;
    const measureType = req.query.measure_type as string | undefined;
    if (measureType && !['WATER', 'GAS'].includes(measureType.toUpperCase())) {
      return res.status(400).json({
        error_code: 'INVALID_TYPE',
        error_description: 'Tipo de medição não permitida'
      });
    }

    const normalizedMeasureType = measureType ? measureType.toUpperCase() : undefined;
    
    const measures = await MeasureService.listMeasures(customerCode, normalizedMeasureType);

    return res.status(200).json({
      customer_code: customerCode,
      measures: Array.isArray(measures) ? measures : measures.measures 
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json(error.toResponse());
    }
    console.error('Error in list endpoint:', error);
    return res.status(500).json({
      error_code: 'SERVER_ERROR',
      error_description: 'Ocorreu um erro inesperado'
    });
  }
};

const MeasureController = {
  upload,
  confirm,
  list
};

export default MeasureController;