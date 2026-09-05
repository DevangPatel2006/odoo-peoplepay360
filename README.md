# PeoplePay360 🚀

> **Enterprise HR & Payroll Management Platform**  
> An end-to-end open-source inspired Human Resource Management (HRM) and Payroll Engine system designed for modern organizations.

---

## 📌 Features Overview

### 👥 1. Employee Management
- Complete Employee Lifecycle & Master Records.
- Department, Job Position, and Role assignments.
- Interactive Kanban, List, and Detail views.
- Quick navigation with smart buttons to Contracts, Attendance, and Time Off.

### 📜 2. Contract History & Applicable Resolver
- Dynamic Contract tracking (Running, Expired, Draft, Cancelled).
- Automatic resolver engine to determine the active contract for any pay period.
- Historical wage and terms audit trail.

### ⏰ 3. Working Schedules & Attendance
- Weekly schedule pattern builder with auto-computed weekly working hours.
- Check-in / Check-out tracking with worked hours calculation.
- Correction workflows and attendance dispute resolution.

### 🌴 4. Time Off & Allocation Management
- Time Off Types definition (Paid Leave, Sick Leave, Unpaid Leave).
- Allocation balance allocation and management.
- Request & Approval workflows with automatic balance deduction.

### 💰 5. Comprehensive Payroll Engine
- **Salary Structures & Rules**: Configurable rule evaluation engine (Fixed, Percentage, Custom Formula).
- **Payrun Wizard**: 2-step payrun creation wizard (Scope selection & Employee targeting).
- **Payslip Processing**: Automated calculation, validation, payment status tracking, PDF generation, and bulk email distribution.
- **Payroll Warnings**: Built-in anomaly detection for missing bank details, duplicate entries, and expiring contracts.

### 📊 6. Dashboard & Analytics
- Executive KPI summaries.
- Salary cost breakdown by department.
- Monthly cost trend analysis.
- Attendance & Time Off overview cards.

---

## 📁 Repository Structure

```text
peoplepay360/
├── README.md
├── .env.example
├── docker-compose.yml                 # PostgreSQL + Backend + Frontend orchestration
├── package.json                       # Root workspace configuration
│
├── database/                          # Database DDL, Views, Triggers, and Seed Scripts
│   ├── schema.sql
│   ├── views.sql
│   ├── triggers_and_functions.sql
│   ├── seed/
│   └── migrations/
│
├── backend/                           # Node.js / Express REST API Engine
│   ├── src/
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── modules/                   # Auth, Users, Employees, Contracts, Payroll, etc.
│   │   ├── dashboard/
│   │   └── common/
│   └── tests/                         # Unit and integration test suites
│
└── frontend/                          # React + Modern UI Workspace
    └── src/
        ├── api/
        ├── auth/
        ├── features/                  # Module-based React components & pages
        ├── layouts/
        └── store/
```

---

## 🛠️ Tech Stack

- **Frontend**: React, Modern Vanilla CSS Design Tokens, Context/State Management
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL (Views, Triggers, Stored Functions)
- **Containerization**: Docker & Docker Compose

---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/DevangPatel2006/odoo-peoplepay360.git
cd odoo-peoplepay360
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your local PostgreSQL credentials and secret keys.
```bash
cp .env.example .env
```

### 3. Launch with Docker Compose
```bash
docker-compose up -d --build
```

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
