import { ErrorResponse } from '../types';

export class AppError extends Error {
  statusCode: number;
  errorCode: string;
  
  constructor(message: string, statusCode: number, errorCode: string) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
  
  toResponse(): ErrorResponse {
    return {
      error_code: this.errorCode,
      error_description: this.message
    };
  }
}

export class InvalidDataError extends AppError {
  constructor(message: string) {
    super(message, 400, 'INVALID_DATA');
  }
}

export class DoubleReportError extends AppError {
  constructor() {
    super('Leitura do mês já realizada', 409, 'DOUBLE_REPORT');
  }
}

export class MeasureNotFoundError extends AppError {
  constructor() {
    super('Leitura não encontrada', 404, 'MEASURE_NOT_FOUND');
  }
}

export class ConfirmationDuplicateError extends AppError {
  constructor() {
    super('Leitura já confirmada', 409, 'CONFIRMATION_DUPLICATE');
  }
}

export class InvalidTypeError extends AppError {
  constructor() {
    super('Tipo de medição não permitida', 400, 'INVALID_TYPE');
  }
}

export class MeasuresNotFoundError extends AppError {
  constructor() {
    super('Nenhuma leitura encontrada', 404, 'MEASURES_NOT_FOUND');
  }
}