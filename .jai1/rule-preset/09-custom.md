---
trigger: always_on
description: Khung tuy bien rule dac thu cho team vital-sensing-demo
---

# Project Customizations

File nay de team bo sung quy tac rieng theo van hanh noi bo.
No khong nen bi overwrite khi regenerate preset.

## Team Conventions

- [ ] Dinh nghia quy uoc review code (so nguoi review, SLA, muc do bat buoc).
- [ ] Dinh nghia quy uoc branch/commit message chi tiet hon neu can.
- [ ] Dinh nghia checklist release demo/prod theo quy trinh noi bo.

## Product-Specific Rules

- [ ] Nguong danh gia vital score (excellent/good/fair/caution/check) co can dieu chinh?
- [ ] Quy tac hien thi thong diep canh bao y te theo phap ly noi bo.
- [ ] Danh sach locale bat buoc ngoai `ja` va `en`.

## External Integration Notes

- [ ] Chinh sach rotate credentials cho external vital API.
- [ ] Chinh sach fallback khi Firestore khong kha dung.
- [ ] Danh sach environment variables bat buoc theo tung moi truong.

## Performance and Observability

- [ ] KPI can theo doi: thoi gian start camera, thoi gian analyze, ty le fail API.
- [ ] Quy tac log level cho dev/staging/prod.
- [ ] Neu can, them telemetry events cho moi state transition quan trong.

## Security and Compliance

- [ ] Quy tac xu ly du lieu video tam thoi (retention, xoa du lieu).
- [ ] Quy tac mask/anonymize thong tin nhay cam trong logs.
- [ ] Danh sach doi tuong duoc phep truy cap dashboard/bao cao team.

## Notes

- Giu noi dung gon, huong dan hanh dong ro, tranh viet thanh tai lieu huong dan dai dong.
- Moi thay doi lon trong file nay nen duoc review boi owner ky thuat + product.
