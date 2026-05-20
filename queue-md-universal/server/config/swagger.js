const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '🏥 QueueMD API',
      version: '1.0.0',
      description: `
REST API documentation for **QueueMD Clinic Management System**.

## Authentication
All protected routes require a **Bearer JWT** token in the Authorization header.

Use \`POST /api/auth/login\` to obtain an \`accessToken\`, then include it as:
\`\`\`
Authorization: Bearer <your_access_token>
\`\`\`

Tokens expire in **15 minutes**. Use \`POST /api/auth/refresh\` (with HTTP-only cookie) to get a new one.
      `,
      contact: {
        name: 'QueueMD Team',
      },
    },
    servers: [
      { url: 'http://localhost:5000/api', description: 'Development Server' },
      { url: process.env.BASE_URL || 'http://localhost:5000/api', description: 'Current Environment' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT access token here'
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error description' },
          }
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
          }
        }
      }
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Authentication - Login, Register, Refresh Token' },
      { name: 'Queue', description: 'Patient Queue Management - Add, Call Next, Complete' },
      { name: 'Patients', description: 'Patient Directory - Search, Add, Update' },
      { name: 'Billing', description: 'Invoice Management - Create, List, Update Status' },
      { name: 'Analytics', description: 'Statistics, Charts, and AI Insights' },
      { name: 'Appointments', description: 'Schedule and manage appointments' },
      { name: 'Notifications', description: 'Facility notifications' },
      { name: 'Subscription', description: 'Razorpay subscription plans' },
      { name: 'Health', description: 'Health check endpoints' },
    ]
  },
  apis: [
    path.join(__dirname, '../routes/*.js'),
    path.join(__dirname, '../controllers/*.js'),
  ],
};

const specs = swaggerJsdoc(options);

module.exports = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customSiteTitle: 'QueueMD API Docs',
    customCss: `.swagger-ui .topbar { background: linear-gradient(135deg, #1e40af, #3b82f6); }`,
  }));
  console.log('📄 Swagger Docs available at: http://localhost:5000/api-docs');
};
