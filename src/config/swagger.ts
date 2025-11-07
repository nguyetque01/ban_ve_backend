import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";

const options: swaggerJSDoc.Options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Multi Content API",
            version: "1.0.0",
            description: "API tài liệu cho hệ thống chia sẻ đa nội dung",
        },
        servers: [
            {
                url: process.env.APP_URL || "http://localhost:3000",
                description: process.env.NODE_ENV === "production" ? "Production server" : "Local server",
            },
        ],
        tags: [
            {
                name: 'Files',
                description: 'API quản lý file'
            },
            {
                name: 'Collaborators',
                description: 'API quản lý cộng tác viên'
            },
            // Các tags khác...
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                }
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        _id: {
                            type: 'string',
                            description: 'ID của người dùng'
                        },
                        username: {
                            type: 'string',
                            description: 'Tên đăng nhập'
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'Email người dùng'
                        },
                        role: {
                            type: 'string',
                            enum: ['user', 'admin'],
                            description: 'Vai trò người dùng',
                            default: 'user'
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Thời gian tạo tài khoản'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Thời gian cập nhật cuối cùng'
                        }
                    }
                },
                LoginInput: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        email: {
                            type: 'string',
                            format: 'email',
                            example: 'user@example.com'
                        },
                        password: {
                            type: 'string',
                            format: 'password',
                            example: 'yourpassword123'
                        }
                    }
                },
                RegisterInput: {
                    type: 'object',
                    required: ['username', 'email', 'password'],
                    properties: {
                        username: {
                            type: 'string',
                            example: 'johndoe',
                            minLength: 3
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            example: 'user@example.com'
                        },
                        password: {
                            type: 'string',
                            format: 'password',
                            minLength: 6,
                            example: 'yourpassword123'
                        }
                    }
                },
                AuthResponse: {
                    type: 'object',
                    properties: {
                        user: {
                            $ref: '#/components/schemas/User'
                        },
                        token: {
                            type: 'string',
                            description: 'JWT token for authentication'
                        }
                    }
                },
                Category: {
                    type: 'object',
                    description: 'Danh mục bản vẽ',
                    required: ['name', 'slug'],
                    properties: {
                        _id: {
                            type: 'string',
                            description: 'ID của danh mục'
                        },
                        name: {
                            type: 'string',
                            description: 'Tên danh mục (phải là duy nhất)',
                            maxLength: 100
                        },
                        slug: {
                            type: 'string',
                            description: 'URL-friendly name của danh mục (tự động tạo từ name)'
                        },
                        description: {
                            type: 'string',
                            description: 'Mô tả chi tiết về danh mục',
                            maxLength: 500
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Thời gian tạo danh mục'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Thời gian cập nhật danh mục'
                        }
                    }
                },
                File: {
                    type: 'object',
                    properties: {
                        _id: {
                            type: 'string',
                            description: 'ID của file',
                            example: '60d5ec9f5824b70015f8e7a1'
                        },
                        name: {
                            type: 'string',
                            description: 'Tên gốc của file',
                            example: 'hinh-anh-dep.jpg'
                        },
                        url: {
                            type: 'string',
                            description: 'Đường dẫn đầy đủ để truy cập file',
                            format: 'uri',
                            example: 'http://localhost:3000/uploads/images/file-1624567890123.jpg'
                        },
                        type: {
                            type: 'string',
                            enum: ['3D', 'PDF', 'PNG', 'JPG', 'JPEG', 'DWG', 'SKP', 'RVT', 'IFC', 'OTHER'],
                            description: 'Định dạng/loại file',
                            example: 'JPG'
                        },
                        size: {
                            type: 'number',
                            description: 'Kích thước file (tính bằng bytes)',
                            example: 102400
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Thời điểm tạo bản ghi',
                            example: '2023-01-01T00:00:00.000Z'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Thời điểm cập nhật lần cuối',
                            example: '2023-01-01T00:00:00.000Z'
                        }
                    },
                    required: ['name', 'url', 'type']
                },
                Stats: {
                    type: "object",
                    description: "Thống kê tổng quan hệ thống",
                    properties: {
                        _id: {
                            type: "string",
                            description: "ID của bản ghi thống kê"
                        },
                        totalContents: {
                            type: "integer",
                            description: "Tổng số nội dung"
                        },
                        totalUsers: {
                            type: "integer",
                            description: "Tổng số người dùng"
                        },
                        totalTransactions: {
                            type: "integer",
                            description: "Tổng số giao dịch"
                        },
                        totalReports: {
                            type: "integer",
                            description: "Tổng số báo cáo"
                        },
                        pendingContents: {
                            type: "integer",
                            description: "Số nội dung chờ duyệt"
                        },
                        approvedContents: {
                            type: "integer",
                            description: "Số nội dung đã duyệt"
                        },
                        rejectedContents: {
                            type: "integer",
                            description: "Số nội dung bị từ chối"
                        },
                        lastUpdated: {
                            type: "string",
                            format: "date-time",
                            description: "Thời gian cập nhật cuối cùng"
                        }
                    }
                },
                FileUploadResponse: {
                    type: 'object',
                    properties: {
                        success: { 
                            type: 'boolean',
                            example: true,
                            description: 'Trạng thái thực hiện yêu cầu'
                        },
                        data: {
                            $ref: '#/components/schemas/File',
                            description: 'Thông tin file đã tải lên'
                        },
                        message: {
                            type: 'string',
                            example: 'Tải lên file thành công',
                            description: 'Thông báo kết quả'
                        }
                    }
                },
                Content: {
                    type: "object",
                    properties: {
                        _id: {
                            type: "string",
                            description: "ID của nội dung"
                        },
                        title: {
                            type: "string",
                            description: "Tiêu đề nội dung"
                        },
                        description: {
                            type: "string",
                            description: "Mô tả chi tiết"
                        },
                        field: {
                            type: "string",
                            description: "Lĩnh vực của nội dung"
                        },
                        file_type: {
                            type: "string",
                            description: "Loại file (image, video, document, ...)"
                        },
                        file_url: {
                            type: "string",
                            description: "Đường dẫn đến file"
                        },
                        status: {
                            type: "string",
                            enum: ["pending", "approved", "rejected"],
                            description: "Trạng thái phê duyệt"
                        },
                        createdAt: {
                            type: "string",
                            format: "date-time",
                            description: "Thời gian tạo"
                        },
                        updatedAt: {
                            type: "string",
                            format: "date-time",
                            description: "Thời gian cập nhật"
                        }
                    }
                },
                ContentInput: {
                    type: "object",
                    required: ["title", "field", "file_type", "file_url"],
                    properties: {
                        title: {
                            type: "string",
                            description: "Tiêu đề bắt buộc"
                        },
                        description: {
                            type: "string",
                            description: "Mô tả (không bắt buộc)"
                        },
                        field: {
                            type: "string",
                            description: "Lĩnh vực của nội dung"
                        },
                        file_type: {
                            type: "string",
                            description: "Loại file (image, video, document, ...)"
                        },
                        file_url: {
                            type: "string",
                            description: "Đường dẫn đến file"
                        }
                    }
                }
            }
        }
    },
    apis: process.env.NODE_ENV === "production"
        ? ["dist/models/**/*.routes.js"]
        : ["./src/models/**/*.routes.ts"],
};

const swaggerSpec = swaggerJSDoc(options);

function setupSwagger(app: Express) {
    // Route cho Swagger UI
    const swaggerUiHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>API Documentation</title>
        <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui.css">
        <style>
            .swagger-ui .topbar { display: none }
            body { margin: 0; padding: 0; }
        </style>
    </head>
    <body>
        <div id="swagger-ui"></div>
        <script src="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui-bundle.js"></script>
        <script src="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui-standalone-preset.js"></script>
        <script>
            window.onload = function() {
                window.ui = SwaggerUIBundle({
                    url: '/api-docs.json',
                    dom_id: '#swagger-ui',
                    deepLinking: true,
                    presets: [
                        SwaggerUIBundle.presets.apis,
                        SwaggerUIStandalonePreset
                    ],
                    plugins: [
                        SwaggerUIBundle.plugins.DownloadUrl
                    ],
                    layout: "StandaloneLayout"
                });
            };
        </script>
    </body>
    </html>
    `;

    // Route cho Swagger UI
    app.get('/api-docs', (req, res) => {
        res.send(swaggerUiHtml);
    });

    // Route cho file tĩnh
    app.get('/api-docs/swagger-ui.css', (req, res) => {
        res.redirect('https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui.css');
    });

    app.get('/api-docs/swagger-ui-bundle.js', (req, res) => {
        res.redirect('https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui-bundle.js');
    });

    app.get('/api-docs/swagger-ui-standalone-preset.js', (req, res) => {
        res.redirect('https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui-standalone-preset.js');
    });

    // JSON endpoint
    app.get('/api-docs.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerSpec);
    });

    console.log('📚 API Documentation available at /api-docs');
}

export { setupSwagger };