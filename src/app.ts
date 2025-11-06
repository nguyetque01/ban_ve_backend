import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db";
import contentRoutes from "./models/content/content.routes";
import userRoutes from "./models/user/user.routes";
import searchRoutes from "./models/search/search.routes";
import commentRoutes from "./models/comment/comment.routes";
import paymentRoutes from "./models/payment/payment.routes";
import copyrightRoutes from "./models/copyright/copyright.routes";
import resourceRoutes from "./models/resource/resource.routes";
import socialRoutes from "./models/social/social.routes";
import adminRoutes from "./models/admin/admin.routes";
import categoryRoutes from "./models/category/category.routes";
import { setupSwagger } from "./config/swagger";
import fileRoutes from './models/file/file.routes';
import collaboratorRoutes from './models/collaborator/collaborator.routes';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200
}));

// Body parser
app.use(express.json());

// Kết nối database
connectDB();

// Routes
app.use("/api/content", contentRoutes);
app.use('/api/auth', userRoutes);
app.use('/api/search', searchRoutes);
app.use('/api', commentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', copyrightRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/file', fileRoutes);
app.use('/api/collaborators', collaboratorRoutes);

// Setup Swagger - Đặt sau tất cả các route khác
setupSwagger(app);

export default app;