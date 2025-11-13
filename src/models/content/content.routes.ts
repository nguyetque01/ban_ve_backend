import express from "express";
import {
    uploadContent,
    getContents,
    getContentById,
    approveContent,
    deleteContent
} from "./content.controller";
import { authenticate, isAdmin } from "../../middleware/auth"; // Giả sử đã có middleware xác thực

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Content:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: ID của nội dung
 *         title:
 *           type: string
 *           description: Tiêu đề nội dung
 *         description:
 *           type: string
 *           description: Mô tả chi tiết
 *         field:
 *           type: string
 *           description: Lĩnh vực
 *         file_type:
 *           type: string
 *           description: Loại file
 *         file_url:
 *           type: string
 *           description: Đường dẫn file
 *         status:
 *           type: string
 *           enum: [pending, approved, rejected]
 *           description: Trạng thái duyệt
 *         createdBy:
 *           $ref: '#/components/schemas/User'
 *         approvedBy:
 *           $ref: '#/components/schemas/User'
 *         approvedAt:
 *           type: string
 *           format: date-time
 *         rejectionReason:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     ContentInput:
 *       type: object
 *       required:
 *         - title
 *         - field
 *         - file_type
 *         - file_url
 *       properties:
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         field:
 *           type: string
 *         file_type:
 *           type: string
 *         file_url:
 *           type: string
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         username:
 *           type: string
 *         email:
 *           type: string
 */

/**
 * @swagger
 * tags:
 *   name: Content
 *   description: Quản lý nội dung
 */

/**
 * @swagger
 * /api/content:
 *   get:
 *     summary: Lấy danh sách nội dung đã được duyệt
 *     tags: [Content]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *         description: Trang hiện tại
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *         description: Số lượng bản ghi mỗi trang
 *       - in: query
 *         name: field
 *         schema: { type: string }
 *         description: Lọc theo lĩnh vực (slug của category)
 *       - in: query
 *         name: category_id
 *         schema: { type: string }
 *         description: Lọc theo ID của category
 *       - in: query
 *         name: file_type
 *         schema: { type: string }
 *         description: Lọc theo loại file
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Tìm kiếm theo tiêu đề hoặc mô tả
 *     responses:
 *       200:
 *         description: Danh sách nội dung
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Content'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total: { type: integer }
 *                     totalPages: { type: integer }
 *                     currentPage: { type: integer }
 *                     itemsPerPage: { type: integer }
 *                     hasNext: { type: boolean }
 *                     hasPrev: { type: boolean }
 */
router.get("/", getContents);

/**
 * @swagger
 * /api/content/{id}:
 *   get:
 *     summary: Lấy chi tiết một nội dung
 *     tags: [Content]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: ID của nội dung
 *     responses:
 *       200:
 *         description: Chi tiết nội dung
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Content'
 *       400:
 *         description: ID không hợp lệ
 *       404:
 *         description: Không tìm thấy nội dung
 */
router.get("/:id", getContentById);

/**
 * @swagger
 * /api/content/upload:
 *   post:
 *     summary: Tải lên nội dung mới
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ContentInput'
 *     responses:
 *       201:
 *         description: Đã tạo nội dung thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Content'
 *       401:
 *         description: Chưa đăng nhập
 */
router.post("/upload", authenticate, uploadContent);

/**
 * @swagger
 * /api/content/{id}/approve:
 *   put:
 *     summary: Duyệt nội dung (chỉ admin)
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: ID của nội dung cần duyệt
 *     responses:
 *       200:
 *         description: Đã duyệt nội dung thành công
 *       400:
 *         description: ID không hợp lệ
 *       401:
 *         description: Chưa đăng nhập hoặc không có quyền
 *       404:
 *         description: Không tìm thấy nội dung
 */
router.put("/:id/approve", authenticate, isAdmin, approveContent);

/**
 * @swagger
 * /api/content/{id}:
 *   delete:
 *     summary: Xóa nội dung
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: ID của nội dung cần xóa
 *     responses:
 *       200:
 *         description: Đã xóa nội dung thành công
 *       400:
 *         description: ID không hợp lệ
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Không tìm thấy nội dung
 */
router.delete("/:id", authenticate, isAdmin, deleteContent);

export default router;