const maxhb = 3; //最大心跳数
const maxhbinconn = 10; //连接二端最大心跳数（每次发信刷新）


let ws;
var cid;
var cstatus;
var hbs = 0;
const o1 = document.querySelector("#output1");
const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
document.querySelector(".c1").style = "display: none";
document.querySelector(".c2").style = "display: none";

async function init(initv = 1) {
    hbs = 0;
    if (initv == 2) {
        o1.innerHTML = "更换ID中<br>(´⊙ω⊙`)"
    }
    if (initv == 1 || initv == 2) {
        const response = await fetch('https://' + basedomain + '/create-connection');
        const { connectionId, qrCode, url } = await response.json();
        cid = connectionId
        document.getElementById('qrcode').src = qrCode;
        document.getElementById("iddisplayoutput2").innerHTML = "ID: " + connectionId;
        document.getElementById("iddisplayoutput").href = url;
    }

    ws = new WebSocket(`wss://${basedomain}?id=${cid}`);
    ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        displayMessage(message, 'received');
    };

    ws.onopen = function (event) {
        console.log("[HT-WS]WebSocket is open now.");
        setInterval(function () {
            if (ws.readyState === WebSocket.OPEN) {
                if (hbs < maxhb) {
                    hbs += 1
                    ws.send(JSON.stringify({ type: 'h' }));
                    console.log("[HT-HB]Heartbeat sent");
                } else {
                    if (cstatus == 1 && hbs < maxhbinconn) {                     
                        hbs += 1
                        ws.send(JSON.stringify({ type: 'h' }));
                        console.log("[HT-HB]Heartbeat sent");
                     } else {
                        document.querySelector(".c2").style = "display:block;";
                        ws.close(1000, '{"type":"n"}');
                        displayMessage({ "type": "status", "status": "disconnected_noinit" ,"timestamp": new Date().toISOString() }, "receive");
                    }
                }
            }
        }, 30000);
    }

}

function sendMessage(text, method = "message") {
    const message = {
        type: method,
        text: text,
        timestamp: new Date().toISOString()
    };

    ws.send(JSON.stringify(message));
    displayMessage(message, 'sent');
    messageInput.value = '';
    hbs = 0;
}

function displayStatus(message) {
    if (message.status == "waiting") {
        return "连接服务器成功，等待连接！ o(*^▽^*)┛";
    }
    else if (message.status == "connected") {
        return "连接第二端成功，等待数据！ (*￣3￣)╭";
    }
    else if (message.status == "disconnected") {
        return "已断开连接！ （；´д｀）ゞ";
    }
    return void (0);
}
function displayMessage(message, type) {
    if (message.type != "h") {
        const div = document.createElement('div');
        div.className = `message ${type}`;
        div.textContent = `${message.text || displayStatus(message)} (${new Date(message.timestamp).toLocaleTimeString()})`;
        messagesDiv.appendChild(div);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }


    if (message.type == "message") {
        document.querySelector(".c1").style = "display: block"
    }

    if (message.type == "status") {
        if (message.status == "waiting") {
            cstatus = 0;
            o1.innerHTML = "连接服务器成功，等待连接！<br>o(*^▽^*)┛"
            document.getElementById("urlinfo").innerHTML = "使用教程<br><br>1. 另一个设备扫描二维码或点击链接<br>2. 进行操作"
        }
        if (message.status == "connected") {
            o1.innerHTML = "连接第二端成功，等待数据！<br>(*￣3￣)╭"
            document.getElementById("urlinfo").innerHTML = "等待第二端进行操作"
            cstatus = 1;
        }
        if (message.status == "disconnected") {
            o1.innerHTML = "已断开连接！<br>（；´д｀）ゞ"
            cstatus = 2;
            init(0)
        }
        if (message.status == "disconnected_noinit") {
            o1.innerHTML = "已断开连接！<br>（；´д｀）ゞ"
            cstatus = 2;
        }
    }
    if (message.type == "sharelink") {
        sendMessage("done", "sharelinkcallback");
        o1.innerHTML = "收到指令sharelink，等待跳转<br>(*´∀ ˋ*)"
        setTimeout("location.href='" + message.text + "'", 3000)
    }
}

init();

// 添加回车发送功能
messageInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        sendMessage(messageInput.value, 'message');
    }
});

function imhere() {
    init(0);
    hbs = 0;
    document.querySelector(".c2").style = "display: none";
};

function togglechat(elem){
    if(elem.innerHTML=="打开信息框"){
        document.querySelector(".c1").style = "display: block";
        elem.innerHTML="关闭信息框";
    }else{
document.querySelector(".c1").style = "display: none";
elem.innerHTML="打开信息框";
    }
}