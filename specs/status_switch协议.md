# status_switch协议

当前坐席人员的状态变更消息

```json
{
  "ptype": "status_switch",
  "id": "status-123",
  "from": {
    "app": "fox_collect.waiter",
    "pin": "agent-456"
  },
  "to": {
    "app": "fox.collect"
  },
  "body": {
    "status": "ready",
    "ext": "扩展字段"
  },
  "ver": "1.0",
  "timestamp": 1769063279192
}
```

当前坐席的状态枚举

```ts
public enum AgentStatus {
  offline,
  ready,
  rest,
  busy,
  hang_up,
}
```
