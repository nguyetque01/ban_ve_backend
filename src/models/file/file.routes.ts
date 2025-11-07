import express from 'express';
import { getAllFiles, getFileById, deleteFile, uploadFile, createFile } from './file.controller';
import { authenticate, isAdminOrCollaborator } from '../../middleware/auth';

const router = express.Router();

/**
 * @swagger
 * /api/file/upload:
 *   post:
 *     security:
 *       - bearerAuth: []
 *     tags: [Files]
 *     summary: Tải lên file (Yêu cầu quyền admin hoặc cộng tác viên)
 *     description: |
 *       Tải lên file lên máy chủ và lưu thông tin vào cơ sở dữ liệu.
 *       Yêu cầu phải đăng nhập với quyền admin hoặc cộng tác viên.
 *       Hỗ trợ các định dạng: 3D, PDF, hình ảnh, tài liệu văn bản, v.v.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: |
 *                   File cần tải lên (bắt buộc, tối đa 100MB)
 *                   Hỗ trợ các định dạng: 3D, PDF, hình ảnh, tài liệu văn bản
 *               filename:
 *                 type: string
 *                 description: Tên file tùy chỉnh (nếu không nhập sẽ tự động sinh)
 *               dir:
 *                 type: string
 *                 description: |
 *                   Để trống (không cần điền)
 *                   Mọi file sẽ được lưu vào thư mục /uploads/document/
 *               private:
 *                 type: boolean
 *                 default: false
 *                 description: Đặt true nếu muốn file riêng tư
 *               compress:
 *                 type: boolean
 *                 default: false
 *                 description: |
 *                   Có nén file không (chỉ áp dụng cho ảnh)
 *                   - true: Nén ảnh trước khi lưu
 *                   - false: Giữ nguyên chất lượng ảnh
 *     responses:
 *       201:
 *         description: Tải lên file thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FileUploadResponse'
 *       400:
 *         description: Lỗi do người dùng (thiếu file, file quá lớn, định dạng không hỗ trợ)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: 'Vui lòng chọn file để tải lên'
 *       401:
 *         description: Chưa đăng nhập hoặc token không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Vui lòng đăng nhập để tiếp tục'
 *       500:
 *         description: Lỗi máy chủ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: 'Lỗi khi tải lên file'
 *                 error:
 *                   type: string
 *                   example: 'Error message details'
 */
router.post('/upload', authenticate, isAdminOrCollaborator, uploadFile, createFile);

/**
 * @swagger
 * /api/file:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     tags: [Files]
 *     summary: Lấy danh sách tất cả file (Yêu cầu đăng nhập)
 *     responses:
 *       200:
 *         description: Danh sách file
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/File'
 *       401:
 *         description: Chưa đăng nhập hoặc token không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Vui lòng đăng nhập để tiếp tục'
 */
router.get('/', authenticate, getAllFiles);

/**
 * @swagger
 * /api/file/{id}:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     tags: [Files]
 *     summary: Lấy thông tin chi tiết file (Yêu cầu đăng nhập)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: 60d5ec9f5824b70015f8e7a1
 *         description: ID của file
 *     responses:
 *       200:
 *         description: Thông tin chi tiết file
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/File'
 *       401:
 *         description: Chưa đăng nhập hoặc token không hợp lệ
 *       404:
 *         description: Không tìm thấy file
 */
router.get('/:id', authenticate, getFileById);

/**
 * @swagger
 * /api/file/{id}:
 *   delete:
 *     security:
 *       - bearerAuth: []
 *     tags: [Files]
 *     summary: Xóa file (Yêu cầu đăng nhập)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: 60d5ec9f5824b70015f8e7a1
 *         description: ID của file cần xóa
 *     responses:
 *       200:
 *         description: Đã xóa file thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/File'
 *       401:
 *         description: Chưa đăng nhập hoặc token không hợp lệ
 *       404:
 *         description: Không tìm thấy file để xóa
 */
router.delete('/:id', authenticate, deleteFile);

export default router;