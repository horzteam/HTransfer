const maxhb = 10; //最大心跳数
const maxhbinconn = 30; //连接二端最大心跳数（每次发信刷新）

let ws;
var cid;
var cstatus;
var textApplyCallbackFunc;
var hbs = 0;
const o1 = document.querySelector("#output1");
const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
document.querySelector(".c1").style = "display: none";
document.querySelector(".c2").style = "display: none";
document.querySelector(".c4").style = "display: none";
document.querySelector(".c5").style = "display: none";
document.querySelector(".c7").style = "display: none";
function initinput(title,onclickfunc){
    document.querySelector(".c5").style = "display: block";
    document.querySelector("#text-input-title").innerHTML=title;
    document.querySelector("#text-input").value="";
    textApplyCallbackFunc=onclickfunc;
}

function displayImageINF(message){
    document.querySelector(".transferpic").src=message.text;
    document.querySelector(".picture_download").href=message.text;
    document.querySelector(".c7").style = "display: block";
}

function textApplyCallback(){
    eval(textApplyCallbackFunc+"()");
    document.getElementById('inputcbase').style='display: none';
}

function downloadtxt(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
   
    element.style.display = 'none';
    document.body.appendChild(element);
   
    element.click();
   
    document.body.removeChild(element);
  }

function copy(id){
    var copyText = document.getElementById(id);
    copyText.select();
    copyText.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(copyText.value);
}

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
    if(initv==5){
        o1.innerHTML = "更换ID中<br>(´⊙ω⊙`)";
        const response = await fetch('https://' + basedomain + '/create-connection-byid?id='+localStorage.getItem("DIYID"));
        const { connectionId, qrCode, url, msg } = await response.json();
        if(msg=="bad"){
            ChangeDIYIDCallbackBad();
            return;
        }
        cid = connectionId;
        document.getElementById('qrcode').src = qrCode;
        document.getElementById("iddisplayoutput2").innerHTML = "ID: " + connectionId;
        document.getElementById("iddisplayoutput").href = url;
    }

    ws = new WebSocket(`wss://${basedomain}?id=${cid}`);
    document.querySelector(".c5").style = "display: none";
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



function displayText(message){
    document.getElementById("text-filename").value=message.title;
    document.getElementById("text-text").value=message.text;
    document.querySelector(".c4").style = "display: block";
}

function displayMessage(message, type) {
    console.log(message)
    if (message.type != "h") {
        hbs = 0;
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
            document.getElementById("urlinfo").innerHTML = "使用教程<br><br>1. 另一个设备扫描二维码或访问 <a href='https://5432.xin/conn'>5432.xin/conn</a><br>2. 点击功能即可与本机通讯"
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
    if(message.type=="text"){displayText(message)};
    if(message.type=="pic"){displayImageINF(message)}
}

function reload(){
    if(localStorage.getItem("DIYID")){
        init(5);
    }else{
        init();
    }
}


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

function ChangeDIYID(){
    initinput("请输入自定义ID (设置为空为随机)","ChangeDIYIDCallback")
}

function ChangeDIYIDCallback(){
    var b = document.querySelector("#text-input").value;
    document.querySelector(".c2").style = "display: none";
    localStorage.setItem("DIYID",b);
    reload();
}
function ChangeDIYIDCallbackBad(){
    initinput("五秒后本页面自动使用随机ID<br>已被占用的连接，请重新输入新ID<br>请输入自定义ID (设置为空为随机)","ChangeDIYIDCallback");
    setTimeout("init()", 5000)
    
}
function togglechat(elem){
    if(elem.innerHTML=="打开信息框"){
        document.querySelector(".c1").style = "display: block";
        elem.innerHTML="关闭信息框";
    }else{
document.querySelector(".c1").style = "display: none";
elem.innerHTML="打开信息框";
    }
}

reload()