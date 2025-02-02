const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const QRCode = require('qrcode');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// 服务静态文件
app.use(express.static(path.join(__dirname, 'public')));

// 存储连接
let connections = new Map();

// WebSocket 连接处理
wss.on('connection', (ws, req) => {
    const id = Math.random().toString(36).substring(7);
    
    // 存储连接
    connections.set(id, ws);
    
    // 发送ID给客户端
    ws.send(JSON.stringify({
        type: 'id',
        id: id
    }));

    // 处理消息
    ws.on('message', (message) => {
        try {
            const data = JSON.stringify(message.toString());
            const targetId = data.targetId;
            const targetWs = connections.get(targetId);
            
            if (targetWs) {
                targetWs.send(JSON.stringify({
                    type: 'message',
                    content: data.content,
                    from: id
                }));
            }
        } catch (e) {
            console.error('Error processing message:', e);
        }
    });

    // 处理断开连接
    ws.on('close', () => {
        connections.delete(id);
    });
});

// 创建二维码的端点
app.get('/qr/:id', async (req, res) => {
    const id = req.params.id;
    const url = `http://${req.headers.host}/chat.html?id=${id}`;
    try {
        const qrcode = await QRCode.toDataURL(url);
        res.json({ qrcode });
    } catch (err) {
        res.status(500).json({ error: 'QR Code generation failed' });
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
