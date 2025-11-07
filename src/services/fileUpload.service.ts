import multer from 'multer';
import path from 'path';
import { Request } from 'express';
import fs from 'fs';

// Định nghĩa các loại file được phép upload
const MIME_TYPES: Record<string, string[]> = {
  IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  DOCUMENT: [
    'application/pdf', 
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ],
  MODEL: [
    'application/octet-stream', // Cho các file 3D
    'application/sla', // Cho file STL
    'application/x-dwg', // Cho file DWG
    'model/step', // Cho file STEP
    'application/ifc' // Cho file IFC
  ],
  ARCHIVE: [
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed'
  ]
};

// Đảm bảo thư mục uploads tồn tại
const ensureUploadsDir = (dir: string) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

// Cấu hình lưu trữ file
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    const uploadPath = path.join(__dirname, '..', '..', 'uploads');
    ensureUploadsDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    // Tạo tên file ngẫu nhiên để tránh xung đột
    cb(null, `file-${uniqueSuffix}${ext}`);
    
    // Lưu tên file gốc vào request để sử dụng nếu cần
    (req as any).originalFileName = file.originalname;
  }
});

// Kiểm tra loại file có được phép upload không
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = Object.values(MIME_TYPES).flat();
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Loại file không được hỗ trợ'));
  }
};

// Cấu hình multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // Giới hạn 100MB
    files: 5 // Giới hạn 5 file mỗi lần upload
  }
});

export default upload;
