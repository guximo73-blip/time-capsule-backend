// ===== 仪表盘渲染（圆形进度表） =====
const REGRESSION_LIST = [
    { name: 'LEMONADE', year: 2026, month: 5, start: '2026-05-01', end: '2026-05-31' },
    { name: 'WHIPLASH', year: 2024, month: 11, start: '2024-11-01', end: '2024-11-30' },
    { name: 'DRAMA',    year: 2024, month: 5, start: '2024-05-01', end: '2024-05-31' },
    { name: 'SPICY',    year: 2024, month: 2, start: '2024-02-01', end: '2024-02-29' },
    { name: 'GIRLS',    year: 2023, month: 12, start: '2023-12-01', end: '2023-12-31' },
    { name: 'SAVAGE',   year: 2023, month: 10, start: '2023-10-01', end: '2023-10-31' },
    { name: 'NEXT LEVEL', year: 2023, month: 7, start: '2023-07-01', end: '2023-07-31' },
];

function renderDashboard() {
    const grid = document.getElementById('dashboardGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const sorted = [...REGRESSION_LIST].sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
    });

    sorted.forEach(reg => {
        const regStart = new Date(reg.year, reg.month - 1, 1);
        const regEnd = new Date(reg.year, reg.month, 0);
        const items = scheduleList.filter(item => {
            const d = new Date(item.date);
            return d >= regStart && d <= regEnd;
        });

        const total = items.length;
        const done = items.filter(item => {
            return item.title && (item.thumbnail || item.videoEmbed || (item.links && JSON.stringify(item.links) !== '[]'));
        }).length;
        const progress = total > 0 ? Math.round((done / total) * 100) : 0;
        const remaining = total - done;
        const circumference = 2 * Math.PI * 44;
        const offset = circumference * (1 - progress / 100);

        const card = document.createElement('div');
        card.className = 'dashboard-card glass-card';
        card.innerHTML = `
            <div class="card-title">${reg.name}</div>
            <div class="card-date">${reg.year}年${reg.month}月</div>
            <div class="circular-progress">
                <svg viewBox="0 0 100 100">
                    <circle class="bg-circle" cx="50" cy="50" r="44"/>
                    <circle class="progress-circle" cx="50" cy="50" r="44"
                        stroke-dasharray="${circumference}"
                        stroke-dashoffset="${offset}"
                        style="stroke:#000;"
                    />
                </svg>
                <div class="center-text">${progress}%</div>
            </div>
            <div class="card-footer">
                <span>${remaining > 0 ? `剩余 ${remaining} 件` : '✅ 已毕业'}</span>
                <span>📅 ${total} 件</span>
            </div>
        `;

        card.addEventListener('click', function() {
            viewYear = reg.year;
            viewMonth = reg.month;
            switchToCalendar();
            syncJumpSelect();
            renderAll();
        });

        grid.appendChild(card);
    });

    // 更新出道天数
    updateDaysDisplay();
}

function updateDaysDisplay() {
    const daysEl = document.getElementById('daysDisplay');
    if (!daysEl) return;
    const debutDate = new Date('2020-11-17');
    const now = new Date();
    const diff = Math.floor((now - debutDate) / (1000 * 60 * 60 * 24));
    daysEl.textContent = `D+${diff}`;
}

// 导出给 main.js 使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { renderDashboard, updateDaysDisplay };
}