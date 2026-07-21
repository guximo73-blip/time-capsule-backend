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
    viewMonth--;
    if (viewMonth < 1) { viewMonth = 12;
        viewYear--; }
    if (viewYear < 2020) viewYear = 2020;
    syncJumpSelect();
    renderAll();
});

document.getElementById('nextMonth').addEventListener('click', function() {
    viewMonth++;
    if (viewMonth > 12) { viewMonth = 1;
        viewYear++; }
    syncJumpSelect();
    renderAll();
});

document.getElementById('searchInput').addEventListener('input', function(e) {
    searchKeyword = e.target.value.trim().toLowerCase();
    renderAll();
});

document.getElementById('addBtn').onclick = function() {
    if (!isEditMode) return;
    if (!personCheckboxContainer.children.length) renderPersonCheckboxes([]);
    openForm(null);
};

window.onload = async function() {
    loadTagsFromStorage();
    loadMilestonesFromStorage();
    initYMSelects();
    await loadScheduleData();
    syncJumpSelect();
    renderAll();
    renderPersonCheckboxes([]);
    renderFormTagCheckboxes([]);
    if (!isEditMode) console.log('只读模式。添加 ?key=20010101 开启编辑');
    else console.log('编辑模式已启用');
};