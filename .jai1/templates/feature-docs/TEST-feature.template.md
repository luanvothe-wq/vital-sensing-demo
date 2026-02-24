# TEST: [Feature Name]

> **Feature**: [Feature Name] | **FRD**: [FRD](./FRD-[feature-name].md) | **TDD**: [TDD](./TDD-[feature-name].md)

---

## Summary

| Loại | Số lượng |
|------|----------|
| Happy Path | [X] |
| Error Cases | [X] |
| Edge Cases | [X] |

---

## 1. Happy Path

### SC-001: [Main Success Scenario]

```gherkin
Given [precondition - trạng thái ban đầu]
When [action - hành động chính]
Then [expected result - kết quả mong đợi]
And [additional verification nếu cần]
```

### SC-002: [Secondary Success Scenario]

```gherkin
Given [precondition]
When [action]
Then [expected result]
```

---

## 2. Error Cases

### SC-00X: [Error Scenario Name]

```gherkin
Given [setup để trigger error]
When [invalid action]
Then [expected error response/behavior]
```

### SC-00X: [Validation Error]

```gherkin
When [action với invalid input]
Then response [status code] với message [error message]
```

---

## 3. Edge Cases

> **INCLUDE IF**: Feature có boundary conditions, special states cần test
> **SKIP IF**: Simple feature không có edge cases đặc biệt

### SC-00X: [Edge Case Name]

```gherkin
Given [boundary condition setup]
When [action at boundary]
Then [expected handling]
```

---

## Test Execution

| Date | Tester | Pass | Fail | Notes |
|------|--------|------|------|-------|
| | | | | |
