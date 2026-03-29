# ClaimSync

A modern **Expense Reimbursement Management System** designed to eliminate manual, error-prone processes and introduce a scalable, transparent, and rule-based approval workflow.

---

## 📌 Problem Statement

Organizations struggle with:
- Manual reimbursement processes
- Lack of transparency
- No flexible approval workflows
- Poor tracking of expenses

**ClaimSync-Oddo** solves this by providing:
- Multi-level approval system
- Role-based dashboards
- Conditional approval rules
- Real-time tracking & validation

---

## ✨ Features

### 🔐 Authentication & Security
- Secure Login (JWT आधारित authentication)
- Forgot Password via email (Resend)
- Change Password flow
- Role-based access control

---

### 👤 Employee
- Submit expense claims
- Upload receipts (OCR-ready)
- Currency conversion support
- Create & manage reports
- Track approval status (timeline view)

---

### 🧑‍💼 Manager
- First-level approval
- Approve/Reject with comments
- View team expenses

---

### 💰 Finance
- Validate expenses
- Check compliance & flags
- Second-level approval

---

### 🧠 CFO
- Final approval authority
- Override approvals
- Handle high-value transactions

---

### 🏢 Admin
- Create company (auto on signup)
- Manage users & roles
- Define approval workflows
- Configure policy rules
- View analytics

---

## 🔁 Approval Workflow

Supports:

### Sequential Flow
Manager → Finance → CFO


### Parallel Flow
Multiple approvers at the same time

### Conditional Rules
- % based approval (e.g., 60%)
- Special approver (e.g., CFO override)
- Hybrid (percentage OR special approver)

---

## 💡 Tech Stack

### Frontend
- React + TypeScript
- Tailwind CSS

### Backend
- Node.js + Express
- MongoDB + Mongoose

### Authentication
- JWT (jsonwebtoken)
- bcrypt

### Services
- Resend (Email)
- Cloudinary (Media Storage)
- Tesseract.js (OCR - optional)

---

## 🔐 Authentication Flow
Forgot Password → Temporary Password via Email
↓
Login → mustChangePassword = true
↓
Redirect to Change Password
↓
Update Password → Normal usage


---

## ⚙️ Installation

### 1. Clone the repo
```
git clone https://github.com/your-username/ClaimSync-Oddo.git
cd ClaimSync-Oddo
```

### 2 .Backend Setup
```
cd backend
npm install
```
- Create .env:
```
PORT=3000
MONGO_URI=mongodb_uri
JWT_SECRET= secret-key-for-dev
BASE_CURRENCY=USD
USE_REDIS=true
REDIS_URL=redis://127.0.0.1:6379
RESEND_API_KEY=resend_api_key_here
```
- Run server:
```
npm run dev
```

### 3. Frontend Setup
```
cd frontend
npm install
npm run dev
```
## 📡 APIs Overview
- Auth (login, forgot password, change password)
- Users & Roles
- Expenses
- Reports
- Approval workflows
- Policy rules

---

## 🎯 Key Highlights
- Real-world SaaS architecture
- Role-based dashboards (Admin, Employee, Manager, Finance, CFO)
- Flexible approval engine
- Clean and minimal UI
- Scalable backend design

---

## 📌 Future Improvements
- Real-time notifications
- Advanced analytics dashboard
- AI-based fraud detection
- Mobile app support

---

## 👨‍💻 Team
- Shreyash Shinde (https://github.com/Shreyash-30)
- Prathmesh Alkute (https://github.com/ghostmonk17)
