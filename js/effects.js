// ===== 星星鼠标 + 冰晶点击特效 =====

(function() {
    // ---------- 星星鼠标（已通过CSS自定义光标实现） ----------
    // CSS中已定义 cursor: url(...)，此处无需额外代码

    // ---------- 冰晶点击特效 ----------
    const ICONS = ['❄️', '✨', '💠', '❇️', '✦', '⬡'];
    const container = document.getElementById('ice-particle-container');

    function createIceBurst(x, y) {
        const count = 8 + Math.floor(Math.random() * 8);
        for (let i = 0; i < count; i++) {
            const el = document.createElement('div');
            el.className = 'ice-particle';
            el.textContent = ICONS[Math.floor(Math.random() * ICONS.length)];

            const angle = Math.random() * 2 * Math.PI;
            const distance = 40 + Math.random() * 90;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance - 20;

            el.style.left = x + 'px';
            el.style.top = y + 'px';
            el.style.setProperty('--tx', tx + 'px');
            el.style.setProperty('--ty', ty + 'px');
            el.style.fontSize = (14 + Math.random() * 16) + 'px';
            el.style.color = Math.random() > 0.5 ? '#A8D8EA' : '#F0F4F8';
            el.style.textShadow = '0 0 12px rgba(168,216,234,0.4)';

            container.appendChild(el);

            setTimeout(() => {
                if (el.parentNode) el.remove();
            }, 1400);
        }
    }

    // 监听点击事件（在非交互元素上触发）
    document.addEventListener('click', function(e) {
        const target = e.target.closest('.modal-mask, .modal-wrap, button, .btn-back, .cal-btn, .person-btn, .dashboard-card, .calendar-block');
        if (target) return;

        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        createIceBurst(x, y);
    });

    // 在仪表盘卡片上点击时也触发（但卡片本身有跳转逻辑，不重复触发，此处额外在卡片上触发）
    document.addEventListener('click', function(e) {
        const card = e.target.closest('.dashboard-card');
        if (card) {
            const rect = container.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            createIceBurst(x, y);
        }
    });

    console.log('❄️ 冰晶特效已加载');
})();