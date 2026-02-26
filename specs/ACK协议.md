# ACK 协议

实时文档见 https://kylith.atlassian.net/wiki/spaces/m78rqGL1Q4UV/pages/389939787/ACK

## 上行协议

客户端发往服务端的上行消息的 ptype 只有 2 个：

枚举定义：

```ts
/**
 * ACK 类型枚举
 */
export enum AckMessageTypeEnum {
  /** 收到消息 ACK */
  MsgReceiveAck = 'msg_receive_ack',
  /** 已读消息 ACK */
  MsgReadAck = 'msg_read_ack',
}
```

数据结构:

```json
{
    "ptype": "msg_read_ack",
    "body": {
        "sender" : "12424",
        "app" : "fox_collect.waiter",
        "mid" ： "* 服务端消息id",
        "sessionId" "会话组装规则",
        "datetime": 1769063160893
    }
}
```

## 下行协议

客户端发送任何消息服务端都会返回 ACK 消息即 ptype 为 ack 表明已收到该消息。而在下行的时候，区别是 ptype 永远是 ack, 但是 body 中的 type 是上一条上行消息的 ptype，表明该消息被服务端接收和处理。

```json
{
  "id": "bced3b54-1d08-cd89-c596-c85c517fb65f", // 和上行协议ID一致
  "ptype": "ack",
  "body": {
    "type": "msg_read_ack" // 对应上行请求的 ACK 类型（msg_read_ack/msg_receive_ack/msg_send_failed）
  },
  "ver": "1.0",
  "timestamp": 1769063279192
}
```

# ACK Type

```
 收到消息ACK ： msg_receive_ack,  // 客户端收到消息 - 发送已收 ACK
 已读消息ACK ： msg_read_ack, // 用户已读该消息 - 发送已读 ACK
 消息发送失败 ACK：msg_send_failed, // 客户端发送消息 - 发送失败 ACK
```

## 上行协议 demo
```json
{
    "ptype": "msg_receive_ack",
    "body": {
        "sender": "xjjsx888",
        "app": "im.waiter",
        "mid": 380406782,
        "sessionId": "大头鹅712:im.customer:14695971",
        "id": "",
        "datetime": 1769063160893
    }
}
```

## 下行协议 demo
```json
{
    "id": "bced3b54-1d08-cd89-c596-c85c517fb65f",
    "from": {
        "app": "fox_collect.customer",
        "pin": "@im.kn.com"
    },
    "to": {
        "app": "fox_collect.customer",
        "clientType": "",
        "pin": "1234"
    },
    "ptype": "ack",
    "body": {
        "type": "msg_read_ack"
    },
    "ver": "1.0",
    "timestamp": 1769063279192
}
```
