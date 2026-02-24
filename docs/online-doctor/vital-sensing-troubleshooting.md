# Vital Sensing API - Troubleshooting va Du Doan Nguyen Nhan

> Cap nhat: 2026-02-16
> Pham vi: Script `scripts/test-online-doctor-vital-sensing.ts` va `scripts/probe-online-doctor-get-signal.ts`

## 1) Trieu chung gap trong qua trinh test

Trong qua trinh chay script, da gap 4 nhom loi:

1. Loi parse login response (da fix trong script)
- Trieu chung: script bao thieu `user_id`.
- Nguyen nhan: API tra `data.user.user_id` thay vi `data.user_id`.

2. Loi get-signal khi file vuot gioi han
- Trieu chung:
  - HTTP status: `200`
  - JSON body: `code=400`, `error=true`
  - `data.file` co `validation.max.file`
- Nguyen nhan: file > 10MB.

3. Loi get-signal khi khong phai MP4
- Trieu chung:
  - HTTP status: `200`
  - JSON body: `code=400`, `error=true`
  - Message: `MP4形式の動画ファイルのみ許可されています。`
- Nguyen nhan: endpoint chi chap nhan MP4.

4. Loi get-signal tu backend demo (co dieu kien)
- Trieu chung:
  - HTTP status: `200`
  - JSON body: `code=400`, `error=true`
  - Message:
    - `「Vital Sign」のサービスは今エラーが発生しています。申し訳ありません。このステップは無視してください。`
- Nhan dinh cap nhat:
  - Loi nay xuat hien ro rang hon khi khong gui `patientId`.
  - Khi gui `patientId` hop le, request co the tra `code=200`.

---

## 2) Decision tree debug nhanh

### A. Login fail

Kiem tra:
- Email/password co dung khong.
- Dang gui `multipart/form-data` voi key `mailaddress`, `password`.
- Khong gui Bearer token cho login.

Neu login ok nhung khong thay `user_id`:
- Doc tu `data.user.user_id`.

### B. get-signal fail voi `validation.max.file`

Y nghia:
- File upload vuot gioi han (swagger ghi toi da 10MB).

Huong xu ly:
- Dung file nho hon 10MB.
- Hoac de script tu nen video (ban script hien tai da auto nen).

### C. get-signal fail voi thong diep "Vital Sign service error"

Y nghia:
- Khong phai validation thong thuong (thieu field/format sai), ma la loi service noi bo.

Kiem tra de loai tru yeu to client:
- Da login va token hop le.
- Da upload file nho (<10MB).
- Da test voi/khong voi `patientId`.
- Da test nhieu lan, ket qua message loi giong nhau.

Ket luan tam thoi:
- Kiem tra them xem request co gui `patientId` hay chua.
- Neu da gui `patientId` van loi lap lai, kha nang cao la backend vital engine dang gap su co.

### C2. get-signal fail khi co `patientId`

Trieu chung co the gap:
- `code=403`
- message: `ご利用回数の上限に達しました。`

Y nghia:
- Account/tenant da dat gioi han su dung.

Huong xu ly:
- Thu account khac.
- Hoac doi reset quota tu doi van hanh.

### D. save-data fail

Y nghia:
- Thuong la he qua tu buoc get-signal khong ra du lieu vital.

Huong xu ly:
- Chi goi save-data khi get-signal tra du 5 truong:
  - `bpm`, `bpv1`, `bpv0`, `S2`, `LTv`

### E. history PHP fail

Kiem tra:
- Goi dung base URL goc: `https://jvit-demo.ishachoku.com`
- Dung Basic Auth, khong dung Bearer token.
- `userid` dung format nhu `293_0`.

---

## 3) Du doan nguyen nhan cho loi hien tai

Du lieu thuc te tu cac lan test:
- Login thanh cong on dinh.
- History PHP tra du lieu on dinh.
- Probe cho thay endpoint chi chap nhan MP4.
- Voi account cu, co luc gap loi service/hoac quota.
- Voi account moi, goi MP4 + `patientId=293_0` da tra `code=200` va co ket qua vital.

Du doan uu tien cao:
1. Endpoint get-signal tren demo co phu thuoc `patientId` (du swagger ghi optional).
2. Quota duoc ap theo account/tenant va co the tra `code=403` khi vuot nguong.
3. Backend vital service co the on dinh khong dong deu theo account/context.

Du doan uu tien trung binh:
1. Rule rang buoc theo account/demo tenant dang thay doi hanh vi khi co/khong co patientId.
2. Dinh tuyen route toi service Vital Sign sai cau hinh o mot so context request.

Du doan uu tien thap:
1. Loi do file format co ban (vi da co bang chung MP4 + patientId tra ket qua thanh cong).

---

## 4) Cach thu thap bang chung gui provider

Can gui cac thong tin sau cho doi API:
- Timestamp test (JST/VN).
- Endpoint da goi: `POST /y-api/v1/user/vital-sensing/get-signal`.
- User test: email demo.
- Request metadata:
  - file size upload (truoc/sau nen)
  - co/khong `patientId` va gia tri `patientId`
- Full response body loi:
  - `code`, `error`, `message`
- Full response body thanh cong (de doi chieu nested payload):
  - `data.enhance_response.data.*`
- Xac nhan login va history endpoint van hoat dong.

Muc dich:
- Giup provider khoanh vung nhanh: loi he thong vital engine thay vi loi xac thuc/request client.

---

## 5) Goi y van hanh tam thoi

Trong khi cho provider fix:
- Van dung script de monitor tinh trang endpoint get-signal theo chu ky.
- Tach luong test:
  - Test auth/flow ky thuat (login + history) de dam bao ket noi.
  - Test vital signal voi MP4 + `patientId`.

Mau lenh test on dinh hien tai:

```bash
bun scripts/test-online-doctor-vital-sensing.ts \
  --video ./sample_video_face-ok.mp4 \
  --email "a1123324sc430+demouser@googlemail.com" \
  --password "password1234" \
  --patient-id 293_0 \
  --save-data \
  --json
```

Lenh probe format file:

```bash
bun scripts/probe-online-doctor-get-signal.ts \
  --email "a1123324sc430+demouser@googlemail.com" \
  --password "password1234"
```

Khi provider thong bao da fix:
1. Chay lai:
   - `bun scripts/test-online-doctor-vital-sensing.ts --video ./sample_video_face-ok.mp4 --patient-id 293_0 --save-data --json`
2. Xac nhan:
   - get-signal `code=200` co du 5 chi so.
   - save-data `code=200`.
   - history co ban ghi moi.
