# ACK 协议

实时文档见 https://kylith.atlassian.net/wiki/spaces/m78rqGL1Q4UV/pages/389939787/ACK

## 上行协议

```json
{
  "type": "* msg_read_ack",
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
```json
"id": "bced3b54-1d08-cd89-c596-c85c517fb65f" // 和上行协议ID一致
"body": {
        "type": "msg_read_ack" // chat_message/client_heatbeat/auth
    }
```

# ACK Type

```
 收到消息ACK ： msg_receive_ack
 已读消息ACK ： msg_read_ack
```

## 上行协议 demo
```json
{
    "body": 
        {
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
    "body": {
        "type": "msg_read_ack"
    },
    "datetime": "2026-01-22 14:27:59",
    "from": {
        "app": "fox_collect.customer",
        "pin": "@im.kn.com"   // 官方账号
    },
    "id": "bced3b54-1d08-cd89-c596-c85c517fb65f",
    "timestamp": 1769063279192,
    "to": {
        "app": "fox_collect.customer",
        "clientType": "",
        "pin": "1234"
    },
    "type": "ack",
    "ver": "1.0"
}
```
