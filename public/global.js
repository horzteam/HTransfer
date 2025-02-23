console.log(`HTransfer - transfer.cool
Copyright 2025 HoRzTeam [i@horz.team]
Computed by MZCompute GmbH. [wang@mingze.de]`)
//const basedomain = "www.transfer.cool"
const basedomain = location.hostname
const imgbaseurl = "https://imagepwdbymzc01.transfer.cool"
// 检查本地存储中的暗色模式设置
const darkMode = localStorage.getItem('darkmode') === 'true';
if (darkMode) {
    document.body.classList.add('dark-mode');
}

// 切换暗色模式
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkmode', document.body.classList.contains('dark-mode'));
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
    else if(message.status=="disconnected_noinit"){
        return "已断开连接（超时）！ （；´д｀）ゞ";
    }
    return void (0);
}
