# status_switch协议


当前坐席人员的状态变更消息

```json
{
  "type": "* msg_read_ack",
  "body": {
    "status" : "ready",
    "ext" : "扩展字段",
  }
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
