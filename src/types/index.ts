export type MeasureType = 'WATER' | 'GAS';

export interface MeasureRequest {
  image: string;
  customer_code: string;
  measure_datetime: string;
  measure_type: MeasureType;
}

export interface MeasureConfirmRequest {
  measure_uuid: string;
  confirmed_value: number;
}

export interface MeasureResponse {
  image_url: string;
  measure_value: number;
  measure_uuid: string;
}

export interface MeasureListItem {
  measure_uuid: string;
  measure_datetime: string;
  measure_type: MeasureType;
  has_confirmed: boolean;
  image_url: string;
}

export interface MeasureListResponse {
  customer_code: string;
  measures: MeasureListItem[];
}

export interface ErrorResponse {
  error_code: string;
  error_description: string;
}

export interface Measure {
  id?: number;
  measure_uuid: string;
  customer_code: string;
  measure_datetime: string;
  measure_type: MeasureType;
  measure_value?: number;
  confirmed_value?: number;
  image_path: string;
  created_at?: string;
}