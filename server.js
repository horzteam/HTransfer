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
const basedomain = "www.transfer.cool"
//const basedomain = "cuddly-space-giggle-v5jjgq64wgwcx6pr-3000.app.github.dev"
// 提供静态文件
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors({
    origin: '*', 
    credentials: true
}));

function consolemsg(msg){
    console.log(msg)
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
    consolemsg(`[HT-OPEN][${connectionId}] 新连接建立`);
    
    if (!connections.has(connectionId)) {
        connections.set(connectionId, { initiator: ws });
        consolemsg(`[HT-CONN1][${connectionId}] 发送端已连接`);
        sendStatusMessage(ws, 'waiting');
    } else {
        const conn = connections.get(connectionId);
        conn.receiver = ws;
        consolemsg(`[HT-CONN2][${connectionId}] 接收端已连接`);
        
        sendStatusMessage(conn.initiator, 'connected');
        sendStatusMessage(conn.receiver, 'connected');
        
        setupCommunication(conn.initiator, conn.receiver);
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

function setupCommunication(initiator, receiver) {
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
}

function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }

app.get('/create-connection', async (req, res) => {
    const connectionId = generateRandomString(9);
    const url = `https://`+basedomain+`/receiver.html?id=${connectionId}`;
    const qrCode = await QRCode.toDataURL(url);
    consolemsg("[HT-新建链接ID]Connection ID: "+connectionId)
    res.json({ connectionId, qrCode, url });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    consolemsg(`HTransfer - transfer.cool
Copyright 2025 HoRzTeam [i@horz.team]
Computed by MZCompute GmbH. [wang@mingze.de]\n`)
    consolemsg(`Server running on port ${PORT} \n`);
});
