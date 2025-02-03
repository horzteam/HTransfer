const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const QRCode = require('qrcode');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// 存储连接配对
const connections = new Map();
//const basedomain = "www.transfer.cool"
const basedomain = "cuddly-space-giggle-v5jjgq64wgwcx6pr-3000.app.github.dev"

const MAX_CONNECTIONS_PER_PAIR = 2;

// 提供静态文件
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors({
    origin: '*', 
    credentials: true
}));

function consolemsg(msg){
    console.log(msg);
}

// WebSocket连接处理
/*wss.on('connection', (ws, req) => {
    const connectionId = req.url.split('?id=')[1];
    
    if (!connections.has(connectionId)) {
        connections.set(connectionId, { initiator: ws });
        // 通知发起方等待连接
        sendStatusMessage(ws, 'waiting');
    } else {
        const conn = connections.get(connectionId);
        conn.receiver = ws;
        
        // 通知双方连接已建立
        sendStatusMessage(conn.initiator, 'connected');
        sendStatusMessage(conn.receiver, 'connected');
        
        // 设置双向通信
        setupCommunication(conn.initiator, conn.receiver);
    }

    ws.on('close', () => {
        const conn = findConnectionBySocket(ws);
        if (conn) {
            const [connId, { initiator, receiver }] = conn;
            
            // 通知另一方连接断开
            if (ws === initiator && receiver) {
                sendStatusMessage(receiver, 'disconnected');
            } else if (ws === receiver && initiator) {
                sendStatusMessage(initiator, 'disconnected');
            }
            
            connections.delete(connId);
        }
    });
});
*/

wss.on('connection', (ws, req) => {
    const connectionId = req.url.split('?id=')[1];
    //new
    if (!connectionId) {
        console.log(`[HT-REFU]连接被拒绝: 无效的连接ID`);
        ws.close(1008, '无效的连接ID');
        return;
    }
    //new
    consolemsg(`[HT-OPEN][${connectionId}] 新连接建立`);
    //new
    const existingConnection = connections.get(connectionId);
    if (existingConnection && existingConnection.receiver) {
        console.log(`[HT-REFU][${connectionId}] 连接被拒绝: 连接已满`);
        ws.close(1008, '连接已满');
        return;
    }
    // new
    if (!connections.has(connectionId)) {
        connections.set(connectionId, { initiator: ws });
        consolemsg(`[HT-CONN1][${connectionId}] 发送端已连接`);
        sendStatusMessage(ws, 'waiting');
    } else {
        /*
        const conn = connections.get(connectionId);
        conn.receiver = ws;
        consolemsg(`[HT-CONN2][${connectionId}] 接收端已连接`);
        
        sendStatusMessage(conn.initiator, 'connected');
        sendStatusMessage(conn.receiver, 'connected');
        
        setupCommunication(conn.initiator, conn.receiver);*/
        //new
        const conn = connections.get(connectionId);
        if (!conn.receiver) {
            conn.receiver = ws;
            console.log(`[${connectionId}] 接收端已连接`);
            sendStatusMessage(conn.initiator, 'connected');
            sendStatusMessage(conn.receiver, 'connected');
        } else {
            console.log(`[${connectionId}] 连接被拒绝: 意外的连接尝试`);
            ws.close(1008, '连接已满');
            return;
        }
        //new
    }

    ws.on('close', () => {
        const conn = findConnectionBySocket(ws);
        if (conn) {
            const [connId, { initiator, receiver }] = conn;
            consolemsg(`[HT-DISC][${connId}] ${ws === initiator ? '发送端' : '接收端'}断开连接`);
            
            if (ws === initiator && receiver) {
                sendStatusMessage(receiver, 'disconnected');
            } else if (ws === receiver && initiator) {
                sendStatusMessage(initiator, 'disconnected');
            }
            
            connections.delete(connId);
        }
    });
    ws.on('message', (message) => {
        const conn = findConnectionBySocket(ws);
        if (conn) {
            const [connId, { initiator, receiver }] = conn;
            const role = ws === initiator ? '发送端' : '接收端';
            const target = ws === initiator ? receiver : initiator;
            console.log(`[HT-T][${connId}] ${role} 发送消息:`, message.toString());
            
            if (target && target.readyState === WebSocket.OPEN) {
                target.send(message.toString());
            }
        }
    });
});



function findConnectionBySocket(ws) {
    for (const [connId, conn] of connections.entries()) {
        if (conn.initiator === ws || conn.receiver === ws) {
            return [connId, conn];
        }
    }
    return null;
}

function sendStatusMessage(ws, status) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        const statusMessage = {
            type: 'status',
            status: status,
            timestamp: new Date().toISOString()
        };
        ws.send(JSON.stringify(statusMessage));
    }
}

/*function setupCommunication(initiator, receiver) {*/
    /*initiator.on('message', (message) => {
        if (receiver && receiver.readyState === WebSocket.OPEN) {
            receiver.send(message.toString());
        }
    });

    receiver.on('message', (message) => {
        if (initiator && initiator.readyState === WebSocket.OPEN) {
            initiator.send(message.toString());
        }
    });*/
        // 找到当前连接的ID
        /*
        const connectionPair = findConnectionBySocket(initiator);
        const connectionId = connectionPair ? connectionPair[0] : 'unknown';
    
        initiator.on('message', (message) => {
            consolemsg(`[HT-T1][${connectionId}] 发送端 -> 接收端:`, message.toString());
            if (receiver && receiver.readyState === WebSocket.OPEN) {
                receiver.send(message.toString());
            }
        });
    
        receiver.on('message', (message) => {
            consolemsg(`[HT-T2][${connectionId}] 接收端 -> 发送端:`, message.toString());
            if (initiator && initiator.readyState === WebSocket.OPEN) {
                initiator.send(message.toString());
            }
        });
}*/

function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }
  function getConnectionCount(connectionId) {
    const conn = connections.get(connectionId);
    if (!conn) return 0;
    return (conn.initiator ? 1 : 0) + (conn.receiver ? 1 : 0);
}
app.get('/create-connection', async (req, res) => {
    /*const connectionId = generateRandomString(9);
    const url = `https://`+basedomain+`/receiver.html?id=${connectionId}`;
    const qrCode = await QRCode.toDataURL(url);
    consolemsg("[HT-新建链接ID]Connection ID: "+connectionId)
    res.json({ connectionId, qrCode, url });*/

    // 生成一个未被使用的连接ID
    let connectionId;
    do {
        connectionId = generateRandomString(9);
    } while (connections.has(connectionId));
    
    const url = `${req.protocol}://${basedomain}/receiver.html?id=${connectionId}`;
    const qrCode = await QRCode.toDataURL(url);
    console.log(`[HT-新建链接ID][${connectionId}] 创建新连接`);
    res.json({ connectionId, qrCode, url });

});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    consolemsg(`HTransfer - transfer.cool
Copyright 2025 HoRzTeam [i@horz.team]
Computed by MZCompute GmbH. [wang@mingze.de]\n`)
    consolemsg(`Server running on port ${PORT} \n`);
});
