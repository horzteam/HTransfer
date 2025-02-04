console.log(`HTransfer - transfer.cool
Copyright 2025 HoRzTeam [i@horz.team]
Computed by MZCompute GmbH. [wang@mingze.de]`)
//const basedomain = "www.transfer.cool"
const basedomain = location.hostname
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
