# Vital Sensing API - Flow va Cach Su Dung Dung

> Cap nhat: 2026-02-16
> Pham vi: Moi truong demo `jvit-demo.ishachoku.com`

## 1) Muc tieu

Tai lieu nay tom tat:
- Flow goi API dung de lay ket qua Vital Sensing.
- Cach su dung script test tu dong trong repo.
- Cac quy tac auth/base URL de tranh goi sai endpoint.

---

## 2) Thong tin ket noi

- Swagger xac thuc (web): `https://jvit-demo.ishachoku.com/swagger/2.0/`
- Swagger vital sensing (web): `https://jvit-demo.ishachoku.com/swagger/vital_sensing_api/`
- Base URL cho login/get-signal/save-data: `https://jvit-demo.ishachoku.com/y-api/v1`
- Base URL cho history PHP: `https://jvit-demo.ishachoku.com`

Auth:
- Basic Auth chi dung cho truy cap trang Swagger va endpoint PHP history.
- Bearer token (JWT) dung cho API trong `/y-api/v1`.

Tai lieu API goc trong repo:
- `docs/online-doctor/online-doctor-api.md`
- `docs/online-doctor/ishachoku_demo_api.json`
- `docs/online-doctor/vital_sensing_api.json`
- `docs/online-doctor/api-investigation-report.md`

---

## 3) Flow dung (end-to-end)

### Buoc 1 - Login lay token

- Endpoint: `POST /y-api/v1/user/user-login`
- Body (`multipart/form-data`):
  - `mailaddress`
  - `password`
- Ket qua:
  - `data.access_token`
  - `data.user.user_id`

### Buoc 2 - Goi get-signal de phan tich video

- Endpoint: `POST /y-api/v1/user/vital-sensing/get-signal`
- Header:
  - `Authorization: Bearer <access_token>`
- Body (`multipart/form-data`):
  - `file` (bat buoc, MP4, toi da 10MB)
  - `patientId` (swagger ghi optional)
- Ghi nhan thuc te tren demo:
  - Neu khong gui `patientId`, co truong hop tra loi service (`code=400`).
  - Neu gui `patientId` hop le, request co the thanh cong (`code=200`).
  - Khuyen nghi: xem `patientId` la bat buoc tren demo.
- Response thanh cong hien tai thuong nam o nested path:
  - `data.enhance_response.data.bpm`
  - `data.enhance_response.data.bpv1`
  - `data.enhance_response.data.bpv0`
  - `data.enhance_response.data.S2`
  - `data.enhance_response.data.LTv`

### Buoc 3 - Luu du lieu (optional)

- Endpoint: `POST /y-api/v1/user/vital-sensing/save-data`
- Header:
  - `Authorization: Bearer <access_token>`
- Body (`multipart/form-data`):
  - `vital_sensing_data[bpm]`
  - `vital_sensing_data[bpv1]`
  - `vital_sensing_data[bpv0]`
  - `vital_sensing_data[S2]`
  - `vital_sensing_data[LTv]`
  - `user_id`
  - `reception_id` (optional)

Nguon gia tri cho save-data nen map tu ket qua get-signal:
- `vital_sensing_data[bpm]` <- `data.enhance_response.data.bpm`
- `vital_sensing_data[bpv1]` <- `data.enhance_response.data.bpv1`
- `vital_sensing_data[bpv0]` <- `data.enhance_response.data.bpv0`
- `vital_sensing_data[S2]` <- `data.enhance_response.data.S2`
- `vital_sensing_data[LTv]` <- `data.enhance_response.data.LTv`

### Buoc 4 - Truy van lich su (optional)

- Endpoint:
  - `GET /api/vital_sensing/get_vital_signal_by_userid.php`
- Full URL:
  - `https://jvit-demo.ishachoku.com/api/vital_sensing/get_vital_signal_by_userid.php`
- Auth:
  - Basic Auth (khong dung Bearer token)
- Query:
  - `userid` (thuong dung dang `293_0`)
  - `limit`, `offset`, `start_date`, `end_date` (optional)

---

## 4) Script test trong repo

Script:
- `scripts/test-online-doctor-vital-sensing.ts` (flow chinh end-to-end)
- `scripts/probe-online-doctor-get-signal.ts` (probe nhieu loai file cho field `file`)

### Lenh chay nhanh

```bash
bun scripts/test-online-doctor-vital-sensing.ts --save-data --json
```

Lenh khuyen nghi cho moi truong demo (co patientId):

```bash
bun scripts/test-online-doctor-vital-sensing.ts \
  --video ./sample_video_face-ok.mp4 \
  --email "a1123324sc430+demouser@googlemail.com" \
  --password "password1234" \
  --patient-id 293_0 \
  --save-data \
  --json
```

### Cac option chinh

- `--video <path>`: file video input (mac dinh `sample_video_1.mp4`)
- `--save-data`: goi them buoc save-data
- `--skip-history`: bo qua buoc history PHP
- `--json`: in full JSON response
- `--patient-id <id>`: truyen `patientId` cho get-signal
- `--user-id <id>`: override `user_id` khi save-data/history

### Luu y ky thuat da duoc xu ly trong script

- Tu parse `user_id` dung tu login response (`data.user.user_id`).
- Tu nhan dien business error (`code >= 400` hoac `error=true`) du HTTP co the van la 200.
- Tu nen video neu lon hon 10MB truoc khi upload.
- Tu parse vital tu nested payload `data.enhance_response.data`.

### Script probe de xac dinh format field file

```bash
bun scripts/probe-online-doctor-get-signal.ts \
  --email "a1123324sc430+demouser@googlemail.com" \
  --password "password1234"
```

Ket qua probe hien tai:
- Chi MP4 duoc chap nhan.
- JPG/PNG/RAW/TXT/JSON/CSV/WAV/BIN deu bi reject voi message chi cho phep MP4.

---

## 5) Mapping auth dung theo endpoint

| API | Basic Auth | Bearer Token |
|---|---|---|
| Swagger UI (web) | Co | Khong |
| `POST /user/user-login` | Khong | Khong |
| `POST /user/vital-sensing/get-signal` | Khong | Co |
| `POST /user/vital-sensing/save-data` | Khong | Co |
| `GET /api/vital_sensing/get_vital_signal_by_userid.php` | Co | Khong |

---

## 6) Tieu chi "goi dung"

Flow duoc coi la dung khi:
- Login tra ve `access_token` va `user.user_id`.
- get-signal tra ve `code=200` va co du 5 chi so vital (tu `data.enhance_response.data.*`).
- save-data (neu goi) tra ve `code=200`.
- history PHP doc duoc ban ghi theo `userid`.

Neu get-signal tra `code=400` voi message loi he thong, tham khao tai lieu troubleshooting.
