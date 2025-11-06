import { Router, type Request, type Response, type NextFunction } from 'express';
import * as collaboratorController from './collaborator.controller';
import { authenticate } from '../../middleware/auth';

// Create a new router instance
const collaboratorRouter = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     CollaboratorApplyInput:
 *       type: object
 *       required:
 *         - bankAccount
 *         - bankName
 *         - commissionRate
 *       properties:
 *         bankAccount:
 *           type: string
 *           description: Số tài khoản ngân hàng
 *           example: "1234567890"
 *         bankName:
 *           type: string
 *           description: Tên ngân hàng
 *           example: "Vietcombank"
 *         commissionRate:
 *           type: number
 *           description: Tỷ lệ hoa hồng (từ 0-100)
 *           example: 30
 *
 *     CollaboratorResponse:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: ID của yêu cầu
 *         user:
 *           $ref: '#/components/schemas/User'
 *         status:
 *           type: string
 *           enum: [pending, approved, rejected]
 *           description: Trạng thái yêu cầu
 *         bankAccount:
 *           type: string
 *           description: Số tài khoản ngân hàng
 *         bankName:
 *           type: string
 *           description: Tên ngân hàng
 *         commissionRate:
 *           type: number
 *           description: Tỷ lệ hoa hồng (%)
 *         approvedBy:
 *           $ref: '#/components/schemas/User'
 *         approvedAt:
 *           type: string
 *           format: date-time
 *         rejectionReason:
 *           type: string
 *           description: Lý do từ chối (nếu có)
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     CollaboratorStats:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: ID của cộng tác viên
 *         username:
 *           type: string
 *           description: Tên đăng nhập
 *         totalResources:
 *           type: number
 *           description: Tổng số tài nguyên đã đăng
 *         totalEarnings:
 *           type: number
 *           description: Tổng thu nhập
 *         commissionRate:
 *           type: number
 *           description: Tỷ lệ hoa hồng (%)
 */

/**
 * @swagger
 * /api/collaborators/apply:
 *   post:
 *     summary: Nộp đơn trở thành cộng tác viên
 *     tags: [Collaborators]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CollaboratorApplyInput'
 *     responses:
 *       201:
 *         description: Đã gửi yêu cầu thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CollaboratorResponse'
 *       400:
 *         description: Đã có yêu cầu trước đó hoặc dữ liệu không hợp lệ
 *       401:
 *         description: Chưa đăng nhập
 */
collaboratorRouter.post(
    '/apply',
    authenticate,
    collaboratorController.applyAsCollaborator
);

/**
 * @swagger
 * /api/collaborators/me:
 *   get:
 *     summary: Xem thông tin cộng tác viên của tôi
 *     tags: [Collaborators]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin cộng tác viên
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CollaboratorResponse'
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không phải là cộng tác viên
 */
collaboratorRouter.get(
    '/me',
    authenticate,
    collaboratorController.isCollaborator,
    collaboratorController.getMyCollaboratorInfo
);

// Admin routes
collaboratorRouter.use(authenticate, collaboratorController.isAdmin);

/**
 * @swagger
 * /api/collaborators/requests:
 *   get:
 *     summary: Xem danh sách yêu cầu trở thành cộng tác viên (Admin)
 *     tags: [Collaborators]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *         description: Lọc theo trạng thái yêu cầu
 *     responses:
 *       200:
 *         description: Danh sách yêu cầu
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CollaboratorResponse'
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 */
collaboratorRouter.get('/requests', collaboratorController.getCollaboratorRequests);

/**
 * @swagger
 * /api/collaborators/requests/{requestId}/approve:
 *   put:
 *     summary: Duyệt yêu cầu trở thành cộng tác viên (Admin)
 *     tags: [Collaborators]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của yêu cầu
 *     responses:
 *       200:
 *         description: Đã duyệt yêu cầu thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CollaboratorResponse'
 *       400:
 *         description: Yêu cầu đã được xử lý trước đó
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy yêu cầu
 */
collaboratorRouter.put(
    '/requests/:requestId/approve',
    collaboratorController.approveCollaboratorRequest
);

/**
 * @swagger
 * /api/collaborators/requests/{requestId}/reject:
 *   put:
 *     summary: Từ chối yêu cầu trở thành cộng tác viên (Admin)
 *     tags: [Collaborators]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của yêu cầu
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Lý do từ chối
 *     responses:
 *       200:
 *         description: Đã từ chối yêu cầu thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CollaboratorResponse'
 *       400:
 *         description: Yêu cầu đã được xử lý trước đó
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy yêu cầu
 */
collaboratorRouter.put(
    '/requests/:requestId/reject',
    collaboratorController.rejectCollaboratorRequest
);

/**
 * @swagger
 * /api/collaborators/stats:
 *   get:
 *     summary: Xem thống kê cộng tác viên (Admin)
 *     tags: [Collaborators]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thống kê cộng tác viên
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CollaboratorStats'
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 */
collaboratorRouter.get('/stats', collaboratorController.getCollaboratorStats);

export default collaboratorRouter;
