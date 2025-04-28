import { v4 as uuidv4 } from 'uuid';
import { 
  Measure, 
  MeasureRequest, 
  MeasureResponse, 
  MeasureConfirmRequest,
  MeasureListResponse,
  MeasureType
} from '../types';
import MeasureRepository from '../repositories/MeasureRepository';
import GeminiService from './GeminiService';
import ImageService from './ImageService';
import { 
  DoubleReportError, 
  MeasureNotFoundError, 
  ConfirmationDuplicateError,
  InvalidTypeError,
  MeasuresNotFoundError
} from '../utils/errors';
import { isValidMeasureType } from '../utils/validators';
function generateUniqueCode(length = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
export class MeasureService {
  async createMeasure(data: MeasureRequest): Promise<MeasureResponse> {
    const now = new Date().toISOString(); 
    
    const existingMeasure = await MeasureRepository.findByCustomerAndMonth(
      data.customer_code,
      now,
      data.measure_type
    );
    
    if (existingMeasure) {
      throw new DoubleReportError();
    }
    
    const measureUuid = uuidv4();
    const measureCode = generateUniqueCode();
    const imagePath = await ImageService.saveImage(data.image);
    const measureValue = await GeminiService.extractMeterValue(data.image);
    
    const measure: Measure = {
      measure_uuid: measureUuid,
      customer_code: data.customer_code===''?measureCode:data.customer_code,
      measure_datetime: now, 
      measure_type: data.measure_type,
      measure_value: measureValue,
      image_path: imagePath
    };
    
    await MeasureRepository.create(measure);
    
    return {
      image_url: ImageService.getImageUrl(imagePath),
      measure_value: measureValue,
      measure_uuid: measureUuid
    };
  }
  
  async confirmMeasure(data: MeasureConfirmRequest): Promise<void> {
    const measure = await MeasureRepository.findByUUID(data.measure_uuid);
    if (!measure) {
      throw new MeasureNotFoundError();
    }
    if (measure.confirmed_value !== null && measure.confirmed_value !== undefined) {
      throw new ConfirmationDuplicateError();
    } 
    await MeasureRepository.updateConfirmedValue(data.measure_uuid, data.confirmed_value);
  }
  
  async listMeasures(customerCode: string, measureType?: string): Promise<MeasureListResponse> {
    if (measureType && !isValidMeasureType(measureType)) {
      throw new InvalidTypeError();
    }
    const validMeasureType = measureType?.toUpperCase() as MeasureType | undefined;
    const measures = await MeasureRepository.findByCustomer(customerCode, validMeasureType);
    if (measures.length === 0) {
      throw new MeasuresNotFoundError();
    }
    return {
        customer_code: customerCode,
        measures: measures.map(measure => ({
        measure_uuid: measure.measure_uuid ?? '',
        measure_datetime: measure.measure_datetime ?? '',
        measure_type: measure.measure_type ?? '',
        has_confirmed: measure.confirmed_value !== null && measure.confirmed_value !== undefined,
        image_url: ImageService.getImageUrl(measure.image_path)
      }))
    };
  }
}

export default new MeasureService();
