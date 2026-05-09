import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);

export const generateQRCode = async (data: string, filename: string): Promise<string> => {
  try {
    // Ensure qr-codes directory exists
    const qrDir = path.join(process.cwd(), 'public', 'qr-codes');
    if (!fs.existsSync(qrDir)) {
      await mkdirAsync(qrDir, { recursive: true });
    }

    const filePath = path.join(qrDir, `${filename}.png`);
    
    // Generate QR code
    await QRCode.toFile(filePath, data, {
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      width: 300,
      margin: 2,
      errorCorrectionLevel: 'H',
    });

    return `/qr-codes/${filename}.png`;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};