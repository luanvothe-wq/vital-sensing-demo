---
name: latest-version
description: Lấy version mới nhất của package/library. Sử dụng khi cần kiểm tra hoặc cập nhật dependency lên phiên bản mới nhất. Hỗ trợ Node.js (npm/pnpm/yarn), Python (pip), Ruby (gem), Go modules.
---

# Latest Version

Skill để tra cứu version mới nhất của các package.

## Commands

### Node.js (npm/pnpm/yarn)

```bash
pnpm info <package-name> version
# hoặc
npm view <package-name> version
```

**Ví dụ:**
```bash
pnpm info react version        # → 18.2.0
pnpm info typescript version   # → 5.3.2
```

### Python (pip)

```bash
pip index versions <package-name> 2>/dev/null | head -1
# hoặc
pip show <package-name> | grep Version
```

**Ví dụ:**
```bash
pip index versions requests
```

### Ruby (gem)

```bash
gem search ^<package-name>$ --remote
```

### Go

```bash
go list -m -versions <module-path> | awk '{print $NF}'
```

## Workflow

1. Xác định loại package (nodejs/python/ruby/go)
2. Chạy command tương ứng
3. Trả về version mới nhất

## Notes

- Ưu tiên `pnpm` cho Node.js packages
- Nếu cần xem tất cả versions: `pnpm info <package> versions`
