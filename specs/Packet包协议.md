# Packet包协议

实时文档见 https://kylith.atlassian.net/wiki/spaces/m78rqGL1Q4UV/pages/387679131/Packet

## 标准消息体

```ts
{
    "id": "123", // 发起方生成 uuid
    "mid": "234234", // 投递服务生成消息服务端 id
    "upid" : "234234" // 上一条消息id
    "from": { // 发送人
        "app": "fox_collect.waiter", // 租户
        "pin": "123323",  // 用户/UID/电话/邮箱
        "clientType" : "pc", // 可选字段，设备类型
        "channelType": "SMS", // 渠道
    },
    "to": {  // 接收人
        "app": "im.waiter", // 租户
        "pin": "13214", // 用户/UID/电话/邮箱
        "clientType" : "pc", // 可选字段
        "channelType": "WhatsApp", // 渠道
    },
    "ptype" : "chat_message", // 【必填】协议消息类型（packet type），用于标识协议层面的消息类型
    "body": {
       // 消息内容， 约定的消息格式，自定义消息，
       // 消息内容，提供固定几个模版， ack/ 撤回 这些是固定消息格式
       // 注意：body.type 是消息内容类型（如 text/image/video），与 ptype 不同
       // 在 chat_message 中有 chatInfo 数据结构
    },
    "ver": "1.0", // 协议版本
    "timestamp": "124324242"， // 服务端生成时间戳
    "entry": "", // SDK 入口(枚举)：fox.system, fox.collect 电催详情, fox.telesales 电销
    "chatId" : "" // 会话id
}
```

> **重要说明：**
> - **ptype**（协议类型）：必填字段，用于标识协议层面的消息类型（如 `chat_message`、`ack`、`client_heartbeat` 等）
> - **body.type**（内容类型）：可选字段，用于标识消息内容的类型（如 `text`、`image`、`video` 等）
> - 所有 socket 通信协议必须包含 `ptype` 字段

## 催收场景

SESSION ID: 债务 ID

```json
{
  "from": { // 发送人
        "app": "fox_collect.waiter", // fox 租户
        "pin": "8dn48fd30djr42de3",  // UID：坐席 ID
        "clientType" : "pc", // 可选字段，设备类型
        "channelType": "WhatsApp", // 渠道
    },
    "to": {  // 接收人用户
        "app": "im.waiter", // 租户
        "pin": "13214", // 电话/邮箱
        "clientType" : "pc", // 可选字段
        "channelType": "WhatsApp", // 渠道
    },
}
```

## 客服场景

SESSION ID: 用户 ID （用户 ID = 客户身份证+包）

```json
{
  "from": { // 发送人
        "app": "fox_argus.customer", // 客户端用户
        "pin": "8dn48fd30djr42de3",  // UID：用户 ID = 客户身份证+包
        "clientType" : "h5", // 可选字段，设备类型
        "channelType": "金银花 App", // 渠道
    },
    "to": {  // 接收人
        "app": "fox_argus.waiter", // Argus 客服客诉坐席
        "pin": "${WAITER_UID}", // UID: 动态分配客服 ID
        "clientType" : "pc", // 可选字段
        "channelType": "金银花 App", // 渠道
    },
}
```

## Entry 字段枚举

```json
{
  "entry": "fox.system", // SDK 入口(枚举)：fox.system, fox.collect.detail 电催详情, fox.telesales.detail 电销
}
```

## Type 字段枚举

```
登录：auth
登录失败：auth_fail
聊天消息: chat_message
ack ： ack
客户端已收：msg_receive_ack
客户端已读：msg_read_ack
心跳： client_heartbeat
状态切换：status_switch
触达回复消息发送结果：fox_message_ack
```

## Tenant 租户枚举

定义规则：`{业务}.{角色}`

```
催收坐席端：fox_collect.waiter / 用户：fox_collect.customer
Argus 客服客诉坐席：fox_argus.waiter / 用户：fox_argus.customer
```

## chatInfo 数据结构
body.chatInfo 字段为 json 格式，具体内容如下：

```json
{
  "subjectId" : "资产编号",    // 电催场景下是资产编号， 其他业务待定
  "userName" : "人名（关系）",
  "chatId" : "会话ID"
}
```