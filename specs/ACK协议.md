# ACK 协议

实时文档见 https://kylith.atlassian.net/wiki/spaces/m78rqGL1Q4UV/pages/389939787/ACK

## 上行协议

```json
{
    "ptype": "ack",
    "body": {
        "type": "msg_read_ack",
        "sender" : "12424",
        "app" : "fox_collect.waiter",
        "mid" ： "* 服务端消息id",
        "sessionId" "会话组装规则",
        "datetime": 1769063160893
    }
}
```

## 下行协议
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
 收到消息ACK ： msg_receive_ack
 已读消息ACK ： msg_read_ack
 消息发送失败ACK：msg_send_failed
```

## 上行协议 demo
```json
{
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
