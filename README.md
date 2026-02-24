# Vital Sensing DEMO

## Getting Started
### 1. Install packages
```bash
npm install
# or
pnpm install
# or
bun install
```

### 2. run the development server:

```bash
npm run dev
# or
pnpm dev
# or
bun dev
```

### 2. Setup env files
- chạy lệnh: `cp .env.example .env.local`
- Thay đổi thông tin LOGIN_EMAIL, LOGIN_PASSWORD trong file `.env.local` đúng với thông tin kết nối vào API của Online Doctor.


## Deployment
### 1. Setup Permission, chạy lệnh `npx alchemy configure`

- Khi hỏi `profile name`
> thì nhập là: `maker-basic`, Enter

- Select a login method for Cloudflare
> chọn `API Token`, Enter

- Tiếp theo nhập `API Token` mà Đạt cung cấp riêng.

- Tiếp theo, Select `JV-IT Holdings Inc.`, Enter.

- Thông báo `✅ Configured profile maker-basic` là xong.

### 2. Deploy lên môi trường demo
- Chạy lệnh `npm run deploy`, và đợi...

- Khi chạy sẽ thấy thông tin ở đầu như bên dưới là đúng môi trường `demo`
```
App: vital-sensing
Phase: up
Stage: demo
```

- Khoảng 2-3 phút sẽ deploy xong, và thông báo như bên dưới:
```
✅ Deployment configured
   Website → https://vital-sensing-web-demo.royal-salad-185f.workers.dev
```  


## Troubleshootings
1. Error: Environment variable ...
chưa cấu hình file env, hãy xem phần `Setup env files` ở trên.


