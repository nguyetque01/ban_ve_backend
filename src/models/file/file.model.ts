import { Schema, model, Document } from 'mongoose';

export interface IFile extends Document {
    name: string;
    path: string;  // Đường dẫn tương đối
    type: string;
    size?: number;
    createdAt: Date;
    updatedAt: Date;
}

const fileSchema = new Schema<IFile>(
    {
        name: {
            type: String,
            required: [true, 'Tên file là bắt buộc'],
            trim: true,
        },
        path: {
            type: String,
            required: [true, 'Đường dẫn file là bắt buộc'],
            trim: true,
        },
        type: {
            type: String,
            required: [true, 'Loại file là bắt buộc'],
            enum: ['3D', 'PDF', 'PNG', 'JPG', 'JPEG', 'DWG', 'SKP', 'RVT', 'IFC', 'OTHER'],
            trim: true,
        },
        size: {
            type: Number,
            min: 0,
            default: 0,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// Tạo index để tìm kiếm nhanh hơn
fileSchema.index({ name: 'text' });

const File = model<IFile>('File', fileSchema);

export default File;
