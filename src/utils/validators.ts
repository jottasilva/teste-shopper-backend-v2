import { MeasureRequest, MeasureType } from '../types';

export function isValidBase64(str: string): boolean {
  try {
    return Buffer.from(str, 'base64').toString('base64') === str;
  } catch (e) {
    return false;
  }
}

export function isValidMeasureType(type: string): type is MeasureType {
  return /^(WATER|GAS)$/i.test(type);
}

export function isValidDatetime(datetime: string): boolean {
  const date = new Date(datetime);
  return !isNaN(date.getTime());
}

export function isValidCustomerCode(code: string): boolean {
  return typeof code === 'string' && code.length > 0;
}

export function validateMeasureRequest(data: Partial<MeasureRequest>): { isValid: boolean; errorMessage?: string } {
  if (!data.image) {
    return { isValid: false, errorMessage: 'Image is required' };
  }
  
  if (!isValidBase64(data.image)) {
    return { isValid: false, errorMessage: 'Invalid base64 image' };
  }
  
  if (!data.customer_code || !isValidCustomerCode(data.customer_code)) {
    return { isValid: false, errorMessage: 'Valid customer code is required' };
  }
  
  if (!data.measure_type || !isValidMeasureType(data.measure_type)) {
    return { isValid: false, errorMessage: 'Measure type must be WATER or GAS' };
  }
  
  return { isValid: true };
}

export function isValidConfirmedValue(value: any): boolean {
  return Number.isInteger(Number(value));
}

export function isValidUUID(uuid: string): boolean {
  return typeof uuid === 'string' && uuid.length > 0;
}

export function getMonthYear(dateString: string): string {
  const date = new Date(dateString);
  return `${date.getMonth() + 1}-${date.getFullYear()}`;
}