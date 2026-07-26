// ===== 初始化 =====
function initYMSelects() {
    const ymYear = document.getElementById('ymYearSelect');
    const ymMonth = document.getElementById('ymMonthSelect');
    const cy = new Date().getFullYear();
    ymYear.innerHTML = '';
    for (let y = 2020; y <= cy + 2; y++) {
        const opt = document.createElement('option');
        opt.value = y;
        opt.textContent = y + '年';
        ymYear.appendChild(opt);
    }
    ymMonth.innerHTML = '';
    for (let m = 1; m <= 12; m++) {
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = m + '月';
        ymMonth.appendChild(opt);
    }
    ymYear.value = viewYear;
    ymMonth.value = viewMonth;
}

document.getElementById('ymDisplay').onclick = function() {
    document.getElementById('ymYearSelect').value = viewYear;
    document.getElementById('ymMonthSelect').value = viewMonth;
    document.getElementById('ymPickerOverlay').classList.add('active');
};

document.getElementById('ymConfirm').onclick = function() {
    const y = parseInt(document.getElementById('ymYearSelect').value);
    const m = parseInt(document.getElementById('ymMonthSelect').value);
    if (y >= 2020 && m >= 1 && m <= 12) {
        viewYear = y;
        viewMonth = m;
        syncJumpSelect();
        renderAll();
        document.getElementById('ymPickerOverlay').classList.remove('active');
    }
};

document.getElementById('ymCancel').onclick = () => document.getElementById('ymPickerOverlay').classList.remove('active');
document.getElementById('ymPickerOverlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) e.target.classList.remove('active');
});

document.getElementById('prevMonth').addEventListener('click', function() {
    if (currentView === 'dashboard') switchToCalendar();
    viewMonth--;
    if (viewMonth < 1) { viewMonth = 12;
        viewYear--; }
    if (viewYear < 2020) viewYear = 2020;
    syncJumpSelect();
    renderAll();
});

document.getElementById('nextMonth').addEventListener('click', function() {
    if (currentView === 'dashboard') switchToCalendar();
    viewMonth++;
    if (viewMonth > 12) { viewMonth = 1;
        viewYear++; }
    syncJumpSelect();
    renderAll();
});

document.getElementById('addBtn').onclick = function() {
    if (!isEditMode) return;
    renderPersonCheckboxes([]);
    openForm(null);
};

// 折叠面板绑定
function initTogglePanels() {
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const targetId = this.dataset.target;
            const panel = document.getElementById(targetId);
            if (panel) {
                panel.classList.toggle('collapsed');
            }
        });
    });
}

// 切换到日历视图（由 dashboard.js 调用）
function switchToCalendar() {
    currentView = 'calendar';
    document.getElementById('dashboard-view').classList.remove('active');
    document.getElementById('calendar-view').classList.add('active');
    document.getElementById('calendar-view').classList.add('view-fade-in');
    document.getElementById('goToDashboard').style.display = 'inline-block';
    document.querySelector('.person-filter-bar').style.display = 'flex';
    document.querySelector('.calendar-control').style.display = 'flex';
    // 渲染日历
    renderAll();
}

// 切换到仪表盘（由 main.js 初始化调用）
function switchToDashboard() {
    currentView = 'dashboard';
    document.getElementById('dashboard-view').classList.add('active');
    document.getElementById('dashboard-view').classList.add('view-fade-in');
    document.getElementById('calendar-view').classList.remove('active');
    document.getElementById('goToDashboard').style.display = 'none';
    document.querySelector('.person-filter-bar').style.display = 'none';
    document.querySelector('.calendar-control').style.display = 'none';
    // 渲染仪表盘
    renderDashboard();
}

window.onload = async function() {
    loadTagsFromStorage();
    loadMilestonesFromStorage();
    initYMSelects();
    await loadScheduleData();
    syncJumpSelect();

    // 初始化折叠面板
    initTogglePanels();

    // 默认显示仪表盘
    switchToDashboard();

    renderPersonCheckboxes([]);
    renderFormTagCheckboxes([]);

    // 返回仪表盘按钮
    document.getElementById('goToDashboard').addEventListener('click', function() {
        switchToDashboard();
    });

    // 添加按钮在日历视图中
    document.getElementById('addBtn').onclick = function() {
        if (!isEditMode) return;
        renderPersonCheckboxes([]);
        openForm(null);
    };

    if (!isEditMode) console.log('🔒 只读模式。添加 ?key=20010101 开启编辑');
    else console.log('🔓 编辑模式已启用');
};
