# vital-sensing-demo

> Demo application cho dịch vụ đo lường thông số sức khỏe (vital sensing) từ xa qua camera trên trình duyệt.

## 🚀 Quick Start

### Prerequisites
- Node.js v20+
- Firebase Project

### Installation
```bash
# Clone repository
git clone [url]

# Cài đặt dependencies
npm install

# Setup environment
cp .env.example .env.local
# (Cập nhật các API key của Firebase và External API trong .env.local)

# Chạy development server
npm run dev
```

## 📁 Project Structure

```
vital-sensing-demo/
├── app/               # Ứng dụng gốc (App Router), chứa API routes và giao diện chính
├── lib/               # Chứa utilities dùng chung, Firebase API SDK integration
└── public/            # Static assets (face-api models, ffmpeg wasm files)
```

## 🔗 Links

- **Architecture**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Features Documentation**: [features/](./features/)

## 👥 Team

| Role | Responsibility |
|------|----------------|
| PM | Project management |
| Leader | Technical decisions |
| Developer | Implementation |
| QC | Testing |
