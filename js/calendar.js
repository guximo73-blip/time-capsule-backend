// ===== 日历渲染 =====
// 使用 window 对象存储，方便跨脚本访问
window.viewYear = window.viewYear || new Date().getFullYear();
window.viewMonth = window.viewMonth || (new Date().getMonth() + 1);
let viewYear = window.viewYear;
let viewMonth = window.viewMonth;
let currentFilterPerson = "all";
let searchDateKeyword = "";
let currentView = 'dashboard';

// 行程图标映射
const TAG_ICON_MAP = {
    '打歌舞台': '🎤',
    '演唱会/拼盘': '🎵',
    '综艺录制': '📺',
    '颁奖礼/红毯': '🏆',
    '机场出境/入境': '✈️',
    '品牌活动': '💄',
    '签售会（线上/线下）': '📸',
    '杂志/画报拍摄': '🎬',
    '直播/VLOG': '📱',
    '电台录制': '🎙️',
    '生日/周年活动': '🎂',
    '粉丝见面会': '🤝',
    '舞蹈练习室/cover': '🩰',
    '官咖/社交媒体更新': '📝',
    '特别舞台/节日特辑': '🎄',
    '周边/快闪店活动': '🎁'
};

function getTagIcon(tagName) {
    return TAG_ICON_MAP[tagName] || '📌';
}

// 渲染行程图标侧栏
function renderTagLegend() {
    const container = document.getElementById('tagLegendBody');
    if (!container) return;
    container.innerHTML = '';
    const tagCounts = {};
    scheduleList.forEach(item => {
        (item.tags || []).forEach(tagId => {
            const tag = tags.find(t => t.id === tagId);
            if (tag) {
                tagCounts[tag.name] = (tagCounts[tag.name] || 0) + 1;
            }
        });
    });
    const sortedTags = [...tags].sort((a, b) => (tagCounts[b.name] || 0) - (tagCounts[a.name] || 0));
    sortedTags.forEach(tag => {
        const div = document.createElement('div');
        div.className = 'tag-legend-item';
        const icon = getTagIcon(tag.name);
        const count = tagCounts[tag.name] || 0;
        div.innerHTML = `
            <span class="legend-icon">${icon}</span>
            <span class="legend-name">${tag.name}</span>
            <span class="legend-count">${count}</span>
        `;
        container.appendChild(div);
    });
    if (sortedTags.length === 0) {
        container.innerHTML = '<div style="text-align:center;opacity:0.2;font-size:11px;padding:12px 0;font-family:Courier New,monospace;">暂无行程</div>';
    }
}

function renderPersonButtons() {
    const bar = document.getElementById('personBar');
    if (!bar) return;
    bar.innerHTML = '';
    const counts = {};
    personList.forEach(p => counts[p] = 0);
    let multiCount = 0;
    scheduleList.forEach(item => {
        const persons = ensurePersonArray(item);
        if (persons.length > 1) multiCount++;
        persons.forEach(p => {
            let key = personList.includes(p) ? p : (extractPersonKey(p) || p);
            if (counts[key] !== undefined) counts[key]++;
        });
    });
    const allBtn = document.createElement('button');
    allBtn.className = 'person-btn active';
    allBtn.dataset.val = 'all';
    allBtn.innerText = `全部 (${scheduleList.length})`;
    bar.appendChild(allBtn);
    displayPersonList.forEach(p => {
        const btn = document.createElement('button');
        btn.className = 'person-btn';
        btn.dataset.val = p;
        btn.innerText = `${personDisplayMap[p] || p} (${counts[p] || 0})`;
        btn.style.background = 'rgba(255,255,255,0.08)';
        if (currentFilterPerson === p) btn.classList.add('active');
        bar.appendChild(btn);
    });
    const multiBtn = document.createElement('button');
    multiBtn.className = 'person-btn';
    multiBtn.dataset.val = 'multi';
    multiBtn.innerText = `👥 多人 (${multiCount})`;
    multiBtn.style.background = 'rgba(249,169,90,0.25)';
    if (currentFilterPerson === 'multi') multiBtn.classList.add('active');
    bar.appendChild(multiBtn);
    bar.querySelectorAll('.person-btn').forEach(btn => {
        btn.onclick = function() {
            bar.querySelectorAll('.person-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilterPerson = this.dataset.val;
            renderAll();
        };
    });
}

function getFilterData() {
    let arr = [...scheduleList];
    if (currentFilterPerson === 'multi') {
        arr = arr.filter(item => ensurePersonArray(item).length > 1);
    } else if (currentFilterPerson !== 'all') {
        arr = arr.filter(item => ensurePersonArray(item).includes(currentFilterPerson));
    }
    if (searchDateKeyword) {
        arr = arr.filter(item => item.date && item.date.includes(searchDateKeyword));
    }
    arr.sort((a, b) => new Date(a.date) - new Date(b.date));
    return arr;
}

function renderCalendar() {
    // 从 window 同步最新的年月
    if (window.viewYear && window.viewMonth) {
        viewYear = window.viewYear;
        viewMonth = window.viewMonth;
    }
    const calDom = document.getElementById('calendar-area');
    calDom.innerHTML = '';
    syncJumpSelect();
    const data = getFilterData();
    const targetYM = `${viewYear}-${String(viewMonth).padStart(2, '0')}`;
    const monthData = data.filter(item => item.date && item.date.startsWith(targetYM));
    const dateGroup = {};
    monthData.forEach(item => {
        if (!dateGroup[item.date]) dateGroup[item.date] = [];
        dateGroup[item.date].push(item);
    });

    const monthMilestones = milestones.filter(m => m.date && m.date.startsWith(targetYM));

    const table = document.createElement('table');
    table.className = 'calendar-table';
    const thead = document.createElement('thead');
    const trHead = document.createElement('tr');
    weekCN.forEach(w => { const th = document.createElement('th');
        th.innerText = w;
        trHead.appendChild(th); });
    thead.appendChild(trHead);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    const firstDay = new Date(viewYear, viewMonth - 1, 1).getDay();
    const totalDays = new Date(viewYear, viewMonth, 0).getDate();
    let tr = document.createElement('tr');
    for (let i = 0; i < firstDay; i++) { tr.appendChild(document.createElement('td')); }
    let col = firstDay;

    for (let d = 1; d <= totalDays; d++) {
        const td = document.createElement('td');
        const fullDate = `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const headerDiv = document.createElement('div');
        headerDiv.className = 'cell-header';
        const dateSpan = document.createElement('span');
        dateSpan.className = 'date-num';
        dateSpan.textContent = `${d}日`;
        headerDiv.appendChild(dateSpan);

        if (isEditMode) {
            const ms = monthMilestones.find(m => m.date === fullDate);
            if (ms) {
                const iconSpan = document.createElement('span');
                iconSpan.className = 'milestone-icon';
                iconSpan.textContent = ms.icon || '🌟';
                iconSpan.title = ms.title;
                headerDiv.appendChild(iconSpan);
            }
        }
        td.appendChild(headerDiv);

        if (dateGroup[fullDate]) {
            const content = document.createElement('div');
            content.className = 'calendar-content';
            const items = dateGroup[fullDate];
            const total = items.length;

            const displayItems = items.slice(0, 3);
            displayItems.forEach(item => {
                const block = document.createElement('div');
                block.className = 'calendar-icon-block';
                const tagId = (item.tags || [])[0];
                let icon = '📌';
                if (tagId) {
                    const tag = tags.find(t => t.id === tagId);
                    if (tag) icon = getTagIcon(tag.name);
                }
                block.textContent = icon;
                block.title = item.title || '未命名';
                block.onclick = (e) => {
                    e.stopPropagation();
                    openModal(item);
                };
                const travelTag = (item.tags || []).map(tid => tags.find(t => t.id === tid))
                    .filter(t => t && t.isTravel);
                if (travelTag.length > 0) {
                    block.classList.add('is-travel');
                }
                content.appendChild(block);
            });

            if (total > 3) {
                const moreBlock = document.createElement('div');
                moreBlock.className = 'calendar-icon-block';
                moreBlock.style.background = 'rgba(0,255,255,0.05)';
                moreBlock.style.fontSize = '11px';
                moreBlock.style.fontWeight = '700';
                moreBlock.style.color = '#00ffff';
                moreBlock.textContent = `+${total - 3}`;
                moreBlock.title = `点击查看全部 ${total} 件物料`;
                moreBlock.onclick = (e) => {
                    e.stopPropagation();
                    showDateDetail(fullDate, items);
                };
                content.appendChild(moreBlock);
            }

            td.appendChild(content);

            if (total > 1) {
                const badge = document.createElement('span');
                badge.className = 'cell-badge';
                badge.textContent = total;
                td.style.position = 'relative';
                td.appendChild(badge);
            }
        }

        tr.appendChild(td);
        col++;
        if (col >= 7) { tbody.appendChild(tr);
            tr = document.createElement('tr');
            col = 0; }
    }
    if (tr.children.length) tbody.appendChild(tr);
    table.appendChild(tbody);
    calDom.appendChild(table);

    renderTagLegend();
}

function showDateDetail(date, items) {
    if (items.length === 1) {
        openModal(items[0]);
        return;
    }
    let listHtml = items.map((item, idx) =>
        `<div style="padding:6px 10px;margin:3px 0;background:rgba(255,255,255,0.03);border-radius:6px;cursor:pointer;display:flex;align-items:center;gap:8px;transition:background .2s;border:1px solid rgba(0,255,255,0.03);font-family:Courier New,monospace;" 
              onmouseover="this.style.background='rgba(0,255,255,0.06)'" 
              onmouseout="this.style.background='rgba(255,255,255,0.03)'"
              onclick="openModal(scheduleList.find(s=>s.id===${item.id}))">
            <span style="color:rgba(255,255,255,0.3);font-size:12px;">${idx+1}.</span>
            <span style="color:#fff;">${item.title || '未命名'}</span>
            <span style="font-size:11px;opacity:0.3;margin-left:auto;">${item.date}</span>
        </div>`
    ).join('');

    const tempModal = document.createElement('div');
    tempModal.className = 'modal-mask active';
    tempModal.style.display = 'flex';
    tempModal.innerHTML = `
        <div class="modal-wrap" style="max-width:480px;flex-direction:column;padding:20px;border-color:rgba(0,255,255,0.15);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                <h3 style="margin:0;font-size:16px;color:#00ffff;font-family:Courier New,monospace;">📅 ${date}</h3>
                <button class="modal-close" style="position:static;background:rgba(100,100,100,0.15);">×</button>
            </div>
            <div style="max-height:400px;overflow-y:auto;padding:2px;">
                ${listHtml}
            </div>
            <div style="margin-top:12px;text-align:center;font-size:12px;opacity:0.3;font-family:Courier New,monospace;">共 ${items.length} 件物料</div>
        </div>
    `;
    document.body.appendChild(tempModal);
    tempModal.querySelector('.modal-close').onclick = () => tempModal.remove();
    tempModal.onclick = (e) => { if (e.target === tempModal) tempModal.remove(); };
}

function renderAll() {
    if (currentView === 'dashboard') {
        return;
    }
    renderPersonButtons();
    renderCalendar();
    const manageBtns = document.querySelectorAll('.manage-btn');
    if (!isEditMode) {
        manageBtns.forEach(btn => btn.style.display = 'none');
    } else {
        manageBtns.forEach(btn => btn.style.display = '');
    }
    syncJumpSelect();
}

function syncJumpSelect() {
    document.getElementById('ymDisplay').innerText = `${viewYear}年${viewMonth}月`;
    window.viewYear = viewYear;
    window.viewMonth = viewMonth;
}

document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchDateInput');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            searchDateKeyword = e.target.value.trim();
            renderAll();
        });
    }
});
