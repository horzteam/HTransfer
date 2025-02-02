const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const QRCode = require('qrcode');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// 存储连接配对
const connections = new Map();

// 提供静态文件
app.use(express.static(path.join(__dirname, 'public')));

// WebSocket连接处理
wss.on('connection', (ws, req) => {
    const connectionId = req.url.split('?id=')[1];
    
    if (!connections.has(connectionId)) {
        connections.set(connectionId, { initiator: ws });
    } else {
        const conn = connections.get(connectionId);
        conn.receiver = ws;
        
        // 设置双向通信
        setupCommunication(conn.initiator, conn.receiver);
    }

    ws.on('close', () => {
        connections.delete(connectionId);
    });
});

function setupCommunication(initiator, receiver) {
    initiator.on('message', (message) => {
        if (receiver.readyState === WebSocket.OPEN) {
            receiver.send(message);
        }
    });

    receiver.on('message', (message) => {
        if (initiator.readyState === WebSocket.OPEN) {
            initiator.send(message);
        }
    });
}

// 生成连接ID和对应的二维码
app.get('/create-connection', async (req, res) => {
    const connectionId = uuidv4();
    const url = `https://cuddly-space-giggle-v5jjgq64wgwcx6pr-3000.app.github.dev/receiver.html?id=${connectionId}`;
    const qrCode = await QRCode.toDataURL(url);
    res.json({ connectionId, qrCode });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
