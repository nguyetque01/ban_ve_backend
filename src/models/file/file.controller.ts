import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import File, { IFile } from './file.model';
import upload from '../../services/fileUpload.service';
import { createResponse } from '../../common/response.helper';

// Middleware xử lý upload file
export const uploadFile = upload.single('file');

// Tạo mới file thông qua upload
export const createFile = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return createResponse(res, 400, {
                message: 'Vui lòng chọn file để tải lên',
                message_en: 'Please select a file to upload',
                status: 'fail'
            });
        }

        const { originalname, mimetype, size, filename } = req.file;
        
        // Lấy phần đuôi file từ tên gốc
        const fileExtension = path.extname(originalname);
        const fileTypeFromExt = fileExtension.toUpperCase().slice(1);
        
        // Xác định tên file: ưu tiên lấy từ req.body.filename nếu có, không thì dùng originalname
        const customName = req.body.filename?.trim();
        // Nếu có custom name thì thêm đuôi file vào nếu chưa có
        const displayName = customName 
            ? customName + (customName.endsWith(fileExtension) ? '' : fileExtension)
            : originalname;
        
        // Xác định loại file dựa trên phần mở rộng
        const allowedTypes = ['3D', 'PDF', 'PNG', 'JPG', 'JPEG', 'DWG', 'SKP', 'RVT', 'IFC'];
        const fileType = allowedTypes.includes(fileTypeFromExt) ? fileTypeFromExt : 'OTHER';

        // Lưu đường dẫn tương đối của file (trực tiếp trong thư mục uploads)
        const filePath = `/uploads/${filename}`;

        // Tạo đối tượng file mới
        const newFile = new File({
            name: displayName,
            path: filePath,
            type: fileType,
            size: size
        });
        
        // Lưu tên file gốc vào object để trả về
        const savedFile = await newFile.save();
        
        // Tạo response data với tên file đã được xử lý
        const responseData = {
            ...savedFile.toObject(),
            name: displayName // Đảm bảo tên file trả về chính xác
        };

        return createResponse(res, 201, {
            message: 'Tải lên file thành công',
            message_en: 'File uploaded successfully',
            data: responseData,
            status: 'success'
        });
    } catch (error: unknown) {
        // Xóa file đã upload nếu có lỗi
        if (req.file?.path) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error('Lỗi khi xóa file tạm:', err);
            });
        }

        console.error('Lỗi khi tải lên file:', error);
        return createResponse(res, 500, {
            message: 'Lỗi khi tải lên file',
            message_en: 'Error uploading file',
            status: 'error'
        });
    }
};

// Hàm hỗ trợ xác định loại file
function getFileType(mimetype: string): string {
    if (mimetype.startsWith('image/')) return 'images';
    if (mimetype.startsWith('video/')) return 'videos';
    if (mimetype.startsWith('application/pdf') || mimetype.includes('word') || mimetype.includes('excel')) return 'documents';
    if (mimetype.includes('octet-stream') || mimetype.includes('dwg') || mimetype.includes('step') || mimetype.includes('ifc')) return 'models';
    if (mimetype.includes('zip') || mimetype.includes('rar') || mimetype.includes('7z')) return 'archives';
    return 'other';
}

// Lấy tất cả file
export const getAllFiles = async (req: Request, res: Response) => {
    try {
        const files = await File.find().sort({ createdAt: -1 });
        return createResponse(res, 200, {
            message: 'Lấy danh sách file thành công',
            message_en: 'Get files list successfully',
            data: files,
            status: 'success'
        });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách file:', error);
        return createResponse(res, 500, {
            message: 'Lỗi khi lấy danh sách file',
            message_en: 'Error getting files list',
            status: 'error'
        });
    }
};

// Lấy chi tiết file theo ID
export const getFileById = async (req: Request, res: Response) => {
    try {
        const file = await File.findById(req.params.id);
        
        if (!file) {
            return createResponse(res, 404, {
                message: 'Không tìm thấy file',
                message_en: 'File not found',
                status: 'fail'
            });
        }
        
        return createResponse(res, 200, {
            message: 'Lấy thông tin file thành công',
            message_en: 'Get file info successfully',
            data: file,
            status: 'success'
        });
    } catch (error) {
        console.error('Lỗi khi lấy thông tin file:', error);
        return createResponse(res, 500, {
            message: 'Lỗi khi lấy thông tin file',
            message_en: 'Error getting file info',
            status: 'error'
        });
    }
};

// Xóa file
export const deleteFile = async (req: Request, res: Response) => {
    try {
        const file = await File.findById(req.params.id);
        
        if (!file) {
            return createResponse(res, 404, {
                message: 'Không tìm thấy file để xóa',
                message_en: 'File not found for deletion',
                status: 'fail'
            });
        }
        
        // Xóa file vật lý
        const filePath = path.join(__dirname, '..', '..', '..', file.path);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        
        // Xóa thông tin trong database
        await File.findByIdAndDelete(req.params.id);
        
        return createResponse(res, 200, {
            message: 'Xóa file thành công',
            message_en: 'File deleted successfully',
            data: null,
            status: 'success'
        });
    } catch (error) {
        console.error('Lỗi khi xóa file:', error);
        return createResponse(res, 500, {
            message: 'Lỗi khi xóa file',
            message_en: 'Error deleting file',
            status: 'error'
        });
    }
};
