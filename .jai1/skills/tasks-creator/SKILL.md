---
name: tasks-creator
description: Create well-structured tasks for features, plans, or bug fixes using `j t` CLI. Use PROACTIVELY when creating implementation tasks from TDD, FRD, or planning output. Ensures unique IDs, component-based grouping, proper dependencies, and clean task titles without file paths.
---

# Tasks Creator

Create well-structured tasks using `j t` CLI with proper naming, grouping, and dependency management.

## Pre-Creation Checklist

Before creating any task, always run these checks:

```bash
# 1. Check existing tasks (avoid duplicates)
j t list -P <parent>

# 2. Check pending tasks (find potential dependencies)
j t list -s todo -j
j t list -s in_progress -j
```

Analyze pending tasks to determine if new tasks depend on any of them.

## Task Naming Convention

### Rules

1. **Title = mục đích logic**, không chứa file path
2. **Mô tả component/layer**, không mô tả file 
3. **Ngắn gọn** — tối đa ~60 ký tự
4. **Nhất quán ngôn ngữ** — Vietnamese hoặc English trong cùng feature

### ❌ SAI — file-per-task

```bash
j t add "[jwt.ts] Tao helper ky/verify JWT" -p 1 -P feature/auth
j t add "[auth.types.ts] Tao DTO va types auth" -p 1 -P feature/auth
j t add "[auth.errors.ts] Tao auth error classes" -p 1 -P feature/auth
j t add "[auth.controller.ts] Tao auth controller" -p 3 -P feature/auth
j t add "[auth.route.ts] Tao auth routes" -p 3 -P feature/auth
j t add "[auth.middleware.ts] Tao middleware auth" -p 3 -P feature/auth
```

Problems: title chứa filepath, 1 file = 1 task → quá nhiều tasks, ID collision khi re-run.

### ✅ ĐÚNG — component-per-task

```bash
j t add "Tạo domain types và error classes" -p 1 -P feature/auth
j t add "Implement JWT security helper" -p 1 -P feature/auth
j t add "Implement repositories (user, refresh-token)" -p 2 -P feature/auth
j t add "Implement auth service" -p 2 -P feature/auth
j t add "Implement API layer (controller, routes, validators)" -p 3 -P feature/auth
j t add "Implement auth middleware (requireAuth, RBAC)" -p 3 -P feature/auth
j t add "Đăng ký routes vào router tổng" -p 3 -P feature/auth
```

## Component Grouping Strategy

Group files by **layer** then by **concern**:

| Layer | Gộp khi | Tách khi |
|-------|---------|----------|
| Domain (types, errors, interfaces) | Cùng feature → 1 task | Khác feature domain |
| Infrastructure (JWT, hash, config) | Cùng concern → 1 task | Logic phức tạp, test riêng |
| Repository (DB access) | Cùng feature → 1 task | >3 repositories |
| Service (business logic) | Mỗi service = 1 task | Service đơn giản gộp được |
| API (controller, route, validator) | Cùng resource → 1 task | Controller >200 LOC |
| Middleware | Cùng concern → 1 task | Middleware phức tạp |

**Nguyên tắc**: 1 task nên bao gồm **2-5 files** liên quan. Nếu >5 files → tách. Nếu 1 file → gộp với task cùng layer.

## File Tracking via Notes

Sau khi tạo task, ghi danh sách files vào `notes`:

```bash
j t update T-004 -n "files: auth.types.ts, auth.errors.ts, auth.interfaces.ts"
j t update T-005 -n "files: jwt.ts"
j t update T-006 -n "files: user.repository.ts, refresh-token.repository.ts"
j t update T-008 -n "files: auth.controller.ts, auth.route.ts, auth.validator.ts"
```

Agent đọc notes khi implement để biết cần tạo/sửa files nào.

## Dependency Setup

### Within Feature

Set dependency **theo layer order**: domain → infra → repo → service → API → integration

```bash
# Repos depend on domain types
j t dep T-006 T-004    # repos ← domain types

# Service depends on repos + JWT
j t dep T-007 T-005    # service ← JWT
j t dep T-007 T-006    # service ← repos

# API depends on service
j t dep T-008 T-007    # API ← service

# Route registration depends on API
j t dep T-009 T-008    # routes ← API
```

### Cross-Feature

Kiểm tra pending tasks từ features khác:

```bash
j t list -s todo -j       # all pending todos
j t list -s in_progress -j  # all in-progress
```

Nếu feature mới phụ thuộc feature khác chưa xong:
```bash
j t dep T-010 T-003    # new feature task ← pending task from other feature
```

## Complete Workflow

```
1. j t list -P <parent>              # check existing
2. j t list -s todo -j                # check pending (find deps)
3. j t list -s in_progress -j         # check in-progress
4. Plan tasks: group by component, name by purpose
5. j t add "..." -p <pri> -P <parent>  # create tasks
6. j t update <id> -n "files: ..."     # track files
7. j t dep <child> <parent>            # set dependencies
8. j t ready -P <parent>               # verify task order
```

## Priority Guide

| Priority | Khi nào |
|----------|---------|
| p0 (🔥 Critical) | Block cả team, prod down |
| p1 (🔴 High) | Foundation: types, config, core utils |
| p2 (🟡 Medium) | Business logic: services, repos |
| p3 (🟢 Low) | Integration: API, routes, docs |
