import { Schema, model, Document, Types } from 'mongoose';

export interface ICollaboratorRequest extends Document {
    user: Types.ObjectId;
    status: 'pending' | 'approved' | 'rejected';
    bankAccount: string;
    bankName: string;
    commissionRate: number;
    approvedBy?: Types.ObjectId;
    approvedAt?: Date;
    rejectionReason?: string;
    createdAt: Date;
    updatedAt: Date;
}

const collaboratorRequestSchema = new Schema<ICollaboratorRequest>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending'
        },
        bankAccount: {
            type: String,
            required: true,
            trim: true
        },
        bankName: {
            type: String,
            required: true,
            trim: true
        },
        commissionRate: {
            type: Number,
            required: true,
            min: 0,
            max: 100
        },
        approvedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        approvedAt: {
            type: Date
        },
        rejectionReason: {
            type: String,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

// Index for faster querying
collaboratorRequestSchema.index({ user: 1, status: 1 });

export default model<ICollaboratorRequest>('CollaboratorRequest', collaboratorRequestSchema);
