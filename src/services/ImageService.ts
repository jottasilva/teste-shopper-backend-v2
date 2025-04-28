import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export class ImageService {
  private storageDir: string;
  
  constructor() {
    this.storageDir = path.resolve(__dirname, '../../data/images');
    this.ensureDirectoryExists();
  }
  
  private ensureDirectoryExists(): void {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }
  
  async saveImage(base64Image: string): Promise<string> {
    const imageData = Buffer.from(base64Image, 'base64');
    const fileName = `${uuidv4()}.jpg`;
    const filePath = path.join(this.storageDir, fileName);
    
    await fs.promises.writeFile(filePath, imageData);
    
    return filePath;
  }
  
  getImageUrl(filePath: string): string {
    const fileName = path.basename(filePath);
    return `/images/${fileName}`;
  }
}

export default new ImageService();