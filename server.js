const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const QRCode = require('qrcode');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// 存储连接配对
const connections = new Map();
const basedomain = "cuddly-space-giggle-v5jjgq64wgwcx6pr-3000.app.github.dev"
// 提供静态文件
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors({
    origin: '*', 
    credentials: true
}));

// WebSocket连接处理
wss.on('connection', (ws, req) => {
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
    initiator.on('message', (message) => {
        if (receiver && receiver.readyState === WebSocket.OPEN) {
            receiver.send(message.toString());
        }
    });

    receiver.on('message', (message) => {
        if (initiator && initiator.readyState === WebSocket.OPEN) {
            initiator.send(message.toString());
        }
    });
}

app.get('/create-connection', async (req, res) => {
    const connectionId = uuidv4();
    const url = `https://`+basedomain+`/receiver.html?id=${connectionId}`;
    const qrCode = await QRCode.toDataURL(url);
    res.json({ connectionId, qrCode, url });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
