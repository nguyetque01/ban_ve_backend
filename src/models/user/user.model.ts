import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
    username: string;
    email: string;
    password: string;
    role: 'user' | 'collaborator' | 'admin';
    isActive: boolean;
    bankAccount?: string;
    bankName?: string;
    commissionRate?: number;
    isApproved?: boolean;
    approvedAt?: Date;
    approvedBy?: Schema.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
    isCollaborator(): boolean;
}

const userSchema = new Schema<IUser>({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ']
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
        select: false
    },
    role: {
        type: String,
        enum: ['user', 'collaborator', 'admin'],
        default: 'user'
    },
    bankAccount: {
        type: String,
        trim: true
    },
    bankName: {
        type: String,
        trim: true
    },
    commissionRate: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    isApproved: {
        type: Boolean,
        default: false
    },
    approvedAt: {
        type: Date
    },
    approvedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    isActive: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    toJSON: {
        transform: function (doc, ret) {
            // Create a new object with only the fields we want to include
            const { password, __v, ...userData } = ret;
            return userData;
        }
    }
});

// Mã hóa mật khẩu trước khi lưu
userSchema.pre<IUser>('save', async function (next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error as Error);
    }
});

// Phương thức so sánh mật khẩu
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Phương thức kiểm tra có phải là cộng tác viên không
userSchema.methods.isCollaborator = function (): boolean {
    return this.role === 'collaborator' && this.isApproved === true;
};

export default model<IUser>('User', userSchema);