const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const expenseController = require('./modules/expense/expense.controller');
const receiptController = require('./modules/receipt/receipt.controller');
const errorHandler = require('./middlewares/error.middleware');
const idempotencyMiddleware = require('./middlewares/idempotency.middleware');
const authMiddleware = require('./middlewares/auth.middleware');
const authorize = require('./middlewares/role.middleware');
const authController = require('./modules/auth/auth.controller');
const userController = require('./modules/user/user.controller');
const app = express();

// Security and Logging Middlwares
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup Multer for local storage (mimicks S3 loosely)
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and PDF are allowed.'));
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB limit
});

// App Routes
const apiRouter = express.Router();

// Auth routes (Public/Unauthenticated + Authenticated endpoints)
apiRouter.post('/auth/signup', idempotencyMiddleware, authController.signupAdmin);
apiRouter.post('/auth/login', authController.login);
apiRouter.post('/auth/set-password', idempotencyMiddleware, authController.setPassword);
apiRouter.post('/auth/change-password', authMiddleware, authController.changePassword);
apiRouter.get('/auth/me', authMiddleware, authController.me);

const approvalController = require('./modules/approval/approval.controller');
// ... 
// User Management Routes (Protected + Role-Bound)
apiRouter.post('/users', authMiddleware, authorize(['ADMIN']), idempotencyMiddleware, userController.createUser);
apiRouter.get('/users', authMiddleware, authorize(['ADMIN']), userController.getUsers);

// Expenses routes (Protected structurally)
apiRouter.post('/expenses', authMiddleware, idempotencyMiddleware, expenseController.createExpense);
apiRouter.get('/expenses', authMiddleware, expenseController.getExpenses);
apiRouter.post('/expenses/:expenseId/declaration', authMiddleware, idempotencyMiddleware, expenseController.declareMissingReceipt);
apiRouter.post('/expenses/:id/submit', authMiddleware, idempotencyMiddleware, expenseController.submitExpense);

// Receipts routes (Protected structurally)
apiRouter.post('/receipts/extract', authMiddleware, upload.single('receipt'), receiptController.extractData);
apiRouter.post('/receipts/upload', authMiddleware, idempotencyMiddleware, upload.single('receipt'), receiptController.uploadReceipt);

// Approvals Engine routes (Protected structurally)
apiRouter.get('/approvals/pending', authMiddleware, (req, res, next) => approvalController.getPendingApprovals(req, res, next));
apiRouter.post('/approvals/:id/approve', authMiddleware, idempotencyMiddleware, (req, res, next) => approvalController.approveExpense(req, res, next));
apiRouter.post('/approvals/:id/reject', authMiddleware, idempotencyMiddleware, (req, res, next) => approvalController.rejectExpense(req, res, next));
apiRouter.post('/approvals/:id/send-back', authMiddleware, idempotencyMiddleware, (req, res, next) => approvalController.sendBackExpense(req, res, next));

app.use('/api/v1', apiRouter);

// Health check
app.get('/health', (req, res) => res.status(200).json({ status: 'OK' }));

// Global Error Handler
app.use(errorHandler);

module.exports = app;
