import { getDatabase } from '../config/database';
import { Measure, MeasureType } from '../types';
import { getMonthYear } from '../utils/validators';

export class MeasureRepository {
  async create(measure: Measure): Promise<Measure> {
    const existingMeasure = await this.findByCustomerCode(measure.customer_code);
    if (existingMeasure) {
      throw new Error(`Já existe um registro para o consumer_code: ${measure.customer_code}`);
    }
    const db = await getDatabase();
    const result = await db.run(
      `INSERT INTO measures (
        measure_uuid, 
        customer_code, 
        measure_datetime, 
        measure_type, 
        measure_value, 
        image_path
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        measure.measure_uuid,
        measure.customer_code,
        measure.measure_datetime,
        measure.measure_type,
        measure.measure_value,
        measure.image_path
      ]
    );
    
    return {
      ...measure,
      id: result.lastID
    };
  }
  
  async findByCustomerCode(customerCode: string): Promise<Measure | undefined> {
    const db = await getDatabase();
    
    return db.get<Measure>(
      'SELECT * FROM measures WHERE customer_code = ?',
      [customerCode]
    );
  }
  
  async findByUUID(uuid: string): Promise<Measure | undefined> {
    const db = await getDatabase();
    
    return db.get<Measure>(
      'SELECT * FROM measures WHERE measure_uuid = ?',
      [uuid]
    );
  }
  
  async updateConfirmedValue(uuid: string, confirmedValue: number): Promise<void> {
    const db = await getDatabase();
    
    await db.run(
      'UPDATE measures SET confirmed_value = ? WHERE measure_uuid = ?',
      [confirmedValue, uuid]
    );
  }
  
  async findByCustomerAndMonth(
    customerCode: string, 
    measureDatetime: string, 
    measureType: MeasureType
  ): Promise<Measure | undefined> {
    const db = await getDatabase();
    const targetMonth = getMonthYear(measureDatetime);
    
    const measures = await db.all<Measure[]>(
      'SELECT * FROM measures WHERE customer_code = ? AND measure_type = ?',
      [customerCode, measureType]
    );
    
    return measures.find(measure => {
      const measureMonth = getMonthYear(measure.measure_datetime);
      return measureMonth === targetMonth;
    });
  }
  
  async findByCustomer(customerCode: string, measureType?: MeasureType): Promise<Measure[]> {
    const db = await getDatabase();
    
    if (measureType) {
      return db.all<Measure[]>(
        'SELECT * FROM measures WHERE customer_code = ? AND measure_type = ? ORDER BY measure_datetime DESC',
        [customerCode, measureType]
      );
    }
    
    return db.all<Measure[]>(
      'SELECT * FROM measures WHERE customer_code = ? ORDER BY measure_datetime DESC',
      [customerCode]
    );
  }
}

export default new MeasureRepository();