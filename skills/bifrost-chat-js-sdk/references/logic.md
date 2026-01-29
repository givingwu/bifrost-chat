# 逻辑层规范

## Store & ClientBus

- Store 使用 Zustand，管理 UI 状态与行为。
- ClientBus 对外暴露 SDK API。

## DataLayer (Repository/Service)

- 选择渠道并决定走 HTTP 还是 Socket。
- 离线队列：网络断开时写入 IndexedDB/localStorage/内存，恢复后重发。
- 乐观 UI：先让 UI 变绿，失败再回滚。
- 去重：同一时间内重复文本消息去重。

## ChannelAdapter & DataMapper

- 每个渠道一个 Adapter（SMS/VoIP/WhatsApp/Email/Waba）。
- Mapper 必须使用 Zod 做 Schema 校验。
- Mapper 为纯函数，保证可测试与防腐。

## NetLayer

- 协议热切：Socket/SSE/Polling 自动切换。
- 统一接口：`INetwork { connect(); send(); }`。
- 可替换协议：HTTP/Socket.io/MQTT/SignalR。
