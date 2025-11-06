import { Request, Response } from 'express';
import User, { IUser } from '../user/user.model';
import CollaboratorRequest from './collaborator-request.model';
import { Types } from 'mongoose';
import { createResponse } from '../../common/response.helper';

// Middleware to check if user is admin
export const isAdmin = (req: Request, res: Response, next: Function) => {
    if ((req.user as IUser)?.role !== 'admin') {
        return createResponse(res, 403, {
            message: 'Chỉ có admin mới có quyền thực hiện thao tác này',
            message_en: 'Only admin can perform this action',
            status: 'error',
            violations: [{
                message: {
                    vi: 'Chỉ có admin mới có quyền thực hiện thao tác này',
                    en: 'Only admin can perform this action'
                },
                type: 'PermissionDenied',
                code: 403
            }]
        });
    }
    next();
};

// Middleware to check if user is collaborator
export const isCollaborator = (req: Request, res: Response, next: Function) => {
    const user = req.user as IUser;
    if (!user || user.role !== 'collaborator' || !user.isApproved) {
        return createResponse(res, 403, {
            message: 'Bạn không phải là cộng tác viên',
            message_en: 'You are not a collaborator',
            status: 'error',
            violations: [{
                message: {
                    vi: 'Bạn không phải là cộng tác viên',
                    en: 'You are not a collaborator'
                },
                type: 'NotACollaborator',
                code: 403
            }]
        });
    }
    next();
};

// Apply to become a collaborator
export const applyAsCollaborator = async (req: Request, res: Response) => {
    const session = await CollaboratorRequest.startSession();
    session.startTransaction();
    
    try {
        const userId = (req.user as IUser)._id;
        const { bankAccount, bankName, commissionRate } = req.body;

        console.log('Applying as collaborator:', { userId, bankAccount, bankName, commissionRate });

        // Check if user already has a pending or approved request
        const existingRequest = await CollaboratorRequest.findOne({
            user: userId,
            status: { $in: ['pending', 'approved'] }
        }).session(session);

        if (existingRequest) {
            await session.abortTransaction();
            session.endSession();
            return createResponse(res, 400, {
                message: 'Bạn đã gửi yêu cầu trước đó',
                message_en: 'You have already submitted a request',
                status: 'error',
                data: { request: existingRequest },
                violations: [{
                    message: {
                        vi: 'Bạn đã gửi yêu cầu trước đó',
                        en: 'You have already submitted a request'
                    },
                    type: 'DuplicateRequest',
                    code: 400
                }]
            });
        }

        const collaboratorRequest = new CollaboratorRequest({
            user: userId,
            bankAccount: bankAccount.trim(),
            bankName: bankName.trim(),
            commissionRate: Number(commissionRate),
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date()
        });

        await collaboratorRequest.save({ session });
        await session.commitTransaction();
        session.endSession();

        console.log('Collaborator request created:', collaboratorRequest);

        return createResponse(res, 201, {
            message: 'Đã gửi yêu cầu trở thành cộng tác viên thành công',
            message_en: 'Request to become a collaborator has been submitted successfully',
            status: 'success',
            data: collaboratorRequest
        });
    } catch (error: unknown) {
        await session.abortTransaction();
        session.endSession();
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error applying as collaborator:', error);
        
        return createResponse(res, 500, {
            message: 'Đã xảy ra lỗi khi gửi yêu cầu',
            message_en: 'An error occurred while processing your request',
            status: 'error',
            data: process.env.NODE_ENV === 'development' ? { error: errorMessage } : null,
            violations: [{
                message: {
                    vi: 'Đã xảy ra lỗi khi gửi yêu cầu',
                    en: 'An error occurred while processing your request'
                },
                type: 'ServerError',
                code: 500
            }]
        });
    }
};

// Get all collaborator requests (admin only)
export const getCollaboratorRequests = async (req: Request, res: Response) => {
    try {
        const { status } = req.query;
        const query: any = {};
        
        if (status) {
            query.status = status;
        }

        const requests = await CollaboratorRequest.find(query)
            .populate('user', 'username email')
            .populate('approvedBy', 'username')
            .sort({ createdAt: -1 });

        return createResponse(res, 200, {
            message: 'Lấy danh sách yêu cầu thành công',
            message_en: 'Successfully retrieved collaborator requests',
            status: 'success',
            data: requests
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error getting collaborator requests:', error);
        
        return createResponse(res, 500, {
            message: 'Đã xảy ra lỗi khi lấy danh sách yêu cầu',
            message_en: 'An error occurred while retrieving requests',
            status: 'error',
            data: process.env.NODE_ENV === 'development' ? { error: errorMessage } : null,
            violations: [{
                message: {
                    vi: 'Đã xảy ra lỗi khi lấy danh sách yêu cầu',
                    en: 'An error occurred while retrieving requests'
                },
                type: 'ServerError',
                code: 500
            }]
        });
    }
};

// Approve collaborator request (admin only)
export const approveCollaboratorRequest = async (req: Request, res: Response) => {
    const session = await User.startSession();
    session.startTransaction();
    
    try {
        const { requestId } = req.params;
        const adminId = (req.user as IUser)._id;

        const request = await CollaboratorRequest.findById(requestId).session(session);
        
        if (!request) {
            await session.abortTransaction();
            session.endSession();
            return createResponse(res, 404, {
                message: 'Không tìm thấy yêu cầu',
                message_en: 'Request not found',
                status: 'error',
                violations: [{
                    message: {
                        vi: 'Không tìm thấy yêu cầu',
                        en: 'Request not found'
                    },
                    type: 'NotFound',
                    code: 404
                }]
            });
        }

        if (request.status !== 'pending') {
            await session.abortTransaction();
            session.endSession();
            return createResponse(res, 400, {
                message: 'Yêu cầu đã được xử lý trước đó',
                message_en: 'Request has already been processed',
                status: 'error',
                data: { status: request.status },
                violations: [{
                    message: {
                        vi: 'Yêu cầu đã được xử lý trước đó',
                        en: 'Request has already been processed'
                    },
                    type: 'AlreadyProcessed',
                    code: 400
                }]
            });
        }

        // Update request
        request.status = 'approved';
        request.approvedBy = adminId as unknown as Types.ObjectId;
        request.approvedAt = new Date();
        await request.save({ session });

        // Update user role
        const updatedUser = await User.findByIdAndUpdate(
            request.user,
            { 
                $set: { 
                    role: 'collaborator',
                    bankAccount: request.bankAccount,
                    bankName: request.bankName,
                    commissionRate: request.commissionRate,
                    isApproved: true
                } 
            },
            { session, new: true }
        ).select('-password');

        await session.commitTransaction();
        session.endSession();

        return createResponse(res, 200, {
            message: 'Đã duyệt yêu cầu thành công',
            message_en: 'Request approved successfully',
            status: 'success',
            data: {
                request,
                user: updatedUser
            }
        });

    } catch (error: unknown) {
        await session.abortTransaction();
        session.endSession();
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error approving collaborator request:', error);
        
        return createResponse(res, 500, {
            message: 'Đã xảy ra lỗi khi duyệt yêu cầu',
            message_en: 'An error occurred while approving the request',
            status: 'error',
            data: process.env.NODE_ENV === 'development' ? { error: errorMessage } : null,
            violations: [{
                message: {
                    vi: 'Đã xảy ra lỗi khi duyệt yêu cầu',
                    en: 'An error occurred while approving the request'
                },
                type: 'ServerError',
                code: 500
            }]
        });
    }
};

// Reject collaborator request (admin only)
export const rejectCollaboratorRequest = async (req: Request, res: Response) => {
    const session = await User.startSession();
    session.startTransaction();
    
    try {
        const { requestId } = req.params;
        const { reason } = req.body;
        const adminId = (req.user as IUser)._id;

        const request = await CollaboratorRequest.findById(requestId).session(session);
        
        if (!request) {
            await session.abortTransaction();
            session.endSession();
            return createResponse(res, 404, {
                message: 'Không tìm thấy yêu cầu',
                message_en: 'Request not found',
                status: 'error',
                violations: [{
                    message: {
                        vi: 'Không tìm thấy yêu cầu',
                        en: 'Request not found'
                    },
                    type: 'NotFound',
                    code: 404
                }]
            });
        }

        if (request.status !== 'pending') {
            await session.abortTransaction();
            session.endSession();
            return createResponse(res, 400, {
                message: 'Yêu cầu đã được xử lý trước đó',
                message_en: 'Request has already been processed',
                status: 'error',
                data: { status: request.status },
                violations: [{
                    message: {
                        vi: 'Yêu cầu đã được xử lý trước đó',
                        en: 'Request has already been processed'
                    },
                    type: 'AlreadyProcessed',
                    code: 400
                }]
            });
        }

        request.status = 'rejected';
        request.approvedBy = adminId as unknown as Types.ObjectId;
        request.approvedAt = new Date();
        request.rejectionReason = reason;
        await request.save({ session });

        await session.commitTransaction();
        session.endSession();

        return createResponse(res, 200, {
            message: 'Đã từ chối yêu cầu thành công',
            message_en: 'Request rejected successfully',
            status: 'success',
            data: { request }
        });

    } catch (error: unknown) {
        await session.abortTransaction();
        session.endSession();
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error rejecting collaborator request:', error);
        
        return createResponse(res, 500, {
            message: 'Đã xảy ra lỗi khi từ chối yêu cầu',
            message_en: 'An error occurred while rejecting the request',
            status: 'error',
            data: process.env.NODE_ENV === 'development' ? { error: errorMessage } : null,
            violations: [{
                message: {
                    vi: 'Đã xảy ra lỗi khi từ chối yêu cầu',
                    en: 'An error occurred while rejecting the request'
                },
                type: 'ServerError',
                code: 500
            }]
        });
    }
};

// Get my collaborator info
export const getMyCollaboratorInfo = async (req: Request, res: Response) => {
    try {
        const userId = (req.user as IUser)._id;
        
        const user = await User.findById(userId)
            .select('-password')
            .lean();

        if (!user || user.role !== 'collaborator' || !user.isApproved) {
            return createResponse(res, 403, {
                message: 'Bạn không phải là cộng tác viên',
                message_en: 'You are not a collaborator',
                status: 'error',
                violations: [{
                    message: {
                        vi: 'Bạn không phải là cộng tác viên',
                        en: 'You are not a collaborator'
                    },
                    type: 'NotACollaborator',
                    code: 403
                }]
            });
        }

        return createResponse(res, 200, {
            message: 'Lấy thông tin cộng tác viên thành công',
            message_en: 'Successfully retrieved collaborator information',
            status: 'success',
            data: user
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error getting collaborator info:', error);
        
        return createResponse(res, 500, {
            message: 'Đã xảy ra lỗi khi lấy thông tin cộng tác viên',
            message_en: 'An error occurred while retrieving collaborator information',
            status: 'error',
            data: process.env.NODE_ENV === 'development' ? { error: errorMessage } : null,
            violations: [{
                message: {
                    vi: 'Đã xảy ra lỗi khi lấy thông tin cộng tác viên',
                    en: 'An error occurred while retrieving collaborator information'
                },
                type: 'ServerError',
                code: 500
            }]
        });
    }
};

// Get collaborator stats (for admin)
export const getCollaboratorStats = async (req: Request, res: Response) => {
    try {
        // Get all collaborators with their stats
        const collaborators = await User.aggregate([
            { $match: { role: 'collaborator', isApproved: true } },
            {
                $lookup: {
                    from: 'resources',
                    localField: '_id',
                    foreignField: 'uploadedBy',
                    as: 'resources'
                }
            },
            {
                $project: {
                    _id: 1,
                    username: 1,
                    email: 1,
                    bankAccount: 1,
                    bankName: 1,
                    commissionRate: 1,
                    totalResources: { $size: '$resources' },
                    totalEarnings: {
                        $multiply: [
                            { $sum: '$resources.price' },
                            { $divide: ['$commissionRate', 100] }
                        ]
                    }
                }
            },
            { $sort: { totalEarnings: -1 } }
        ]);

        return createResponse(res, 200, {
            message: 'Lấy thống kê cộng tác viên thành công',
            message_en: 'Successfully retrieved collaborator statistics',
            status: 'success',
            data: collaborators
        });    
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error getting collaborator stats:', error);
        
        return createResponse(res, 500, {
            message: 'Đã xảy ra lỗi khi lấy thống kê cộng tác viên',
            message_en: 'An error occurred while retrieving collaborator statistics',
            status: 'error',
            data: process.env.NODE_ENV === 'development' ? { error: errorMessage } : null,
            violations: [{
                message: {
                    vi: 'Đã xảy ra lỗi khi lấy thống kê cộng tác viên',
                    en: 'An error occurred while retrieving collaborator statistics'
                },
                type: 'ServerError',
                code: 500
            }]
        });
    }
};
