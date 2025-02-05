/*

$$\   $$\ $$$$$$$$\                                      $$$$$$\                     
$$ |  $$ |\__$$  __|                                    $$  __$$\                    
$$ |  $$ |   $$ | $$$$$$\  $$$$$$\  $$$$$$$\   $$$$$$$\ $$ /  \__|$$$$$$\   $$$$$$\  
$$$$$$$$ |   $$ |$$  __$$\ \____$$\ $$  __$$\ $$  _____|$$$$\    $$  __$$\ $$  __$$\ 
$$  __$$ |   $$ |$$ |  \__|$$$$$$$ |$$ |  $$ |\$$$$$$\  $$  _|   $$$$$$$$ |$$ |  \__|
$$ |  $$ |   $$ |$$ |     $$  __$$ |$$ |  $$ | \____$$\ $$ |     $$   ____|$$ |      
$$ |  $$ |   $$ |$$ |     \$$$$$$$ |$$ |  $$ |$$$$$$$  |$$ |     \$$$$$$$\ $$ |      
\__|  \__|   \__|\__|      \_______|\__|  \__|\_______/ \__|      \_______|\__|      
                                                                                     
                                                                                     
                                                                                     
HTransfer - transfer.cool

Copyright 2025 HoRzTeam [i@horz.team]

Computed by MZCompute GmbH. [wang@mingze.de]

*/


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
    origin: 'https://'+basedomain, 
    credentials: true
}));

function consolemsg(msg){
    console.log(msg);
}

wss.on('connection', (ws, req) => {
    const connectionId = req.url.split('?id=')[1];
    if (!connectionId) {
        console.log(`[HT-REFU]连接被拒绝: 无效的连接ID`);
        ws.close(1008, '无效的连接ID');
        return;
    }
    consolemsg(`[HT-OPEN][${connectionId}] 新连接建立`);
    const existingConnection = connections.get(connectionId);
    if (existingConnection && existingConnection.receiver) {
        console.log(`[HT-REFU][${connectionId}] 连接被拒绝: 连接已满`);
        ws.close(1008, '连接已满');
        return;
    }
    if (!connections.has(connectionId)) {
        connections.set(connectionId, { initiator: ws });
        consolemsg(`[HT-CONN1][${connectionId}] 发送端已连接`);
        sendStatusMessage(ws, 'waiting');
    } else {

        const conn = connections.get(connectionId);
        if (!conn.receiver) {
            conn.receiver = ws;
            console.log(`[HT-CONN][${connectionId}] 接收端已连接`);
            sendStatusMessage(conn.initiator, 'connected');
            sendStatusMessage(conn.receiver, 'connected');
        } else {
            console.log(`[${connectionId}] 连接被拒绝: 意外的连接尝试`);
            ws.close(1008, '连接已满');
            return;
        }

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
        const msg=message.toString();
        try {
            if(JSON.parse(message.toString()).type!="h"){
                const conn = findConnectionBySocket(ws);
                if (conn) {
                    const [connId, { initiator, receiver }] = conn;
                    const role = ws === initiator ? '发送端' : '接收端';
                    const target = ws === initiator ? receiver : initiator;
                    console.log(`[HT-T][${connId}] ${role} 发送消息:` + msg);
                    
                    if (target && target.readyState === WebSocket.OPEN) {
                        target.send(message.toString());
                    };
                }}
        }
        catch(err) {
            const conn = findConnectionBySocket(ws);
            if(conn){
                const [connId, { initiator }] = conn;
                const role = ws === initiator ? '发送端' : '接收端';
                console.log(`[HT-T][[${connId}] ${role} 非标准消息] `, + message.toString());
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
    let connectionId;
    do {
        connectionId = generateRandomString(9);
    } while (connections.has(connectionId));
    
    const url = `${req.protocol}://${basedomain}/receiver.html?id=${connectionId}`;
    const qrCode = await QRCode.toDataURL(url);
    console.log(`[HT-新建链接ID][${connectionId}] 创建新连接`);
    res.json({ connectionId, qrCode, url });

});
app.get('/create-connection-byid', async (req, res) => {
    try{
        let connectionId = req.query.id;
        if(connections.has(connectionId)){
            res.json({ msg:"bad" });
        }
        
        const url = `${req.protocol}://${basedomain}/receiver.html?id=${connectionId}`;
        const qrCode = await QRCode.toDataURL(url);
        console.log(`[HT-DIY链接ID][${connectionId}] 创建新连接`);
        res.json({ connectionId, qrCode, url, msg:"ok" });
    }catch{

    }


});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    consolemsg(`HTransfer - transfer.cool
Copyright 2025 HoRzTeam [i@horz.team]
Computed by MZCompute GmbH. [wang@mingze.de]\n`)
    consolemsg(`Server running on port ${PORT} \n`);
});
