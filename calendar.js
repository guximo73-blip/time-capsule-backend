// ===== 日历渲染 =====
let viewYear = new Date().getFullYear();
let viewMonth = new Date().getMonth() + 1;
let currentFilterPerson = "all";
let searchKeyword = "";
let currentView = 'dashboard'; // 'dashboard' | 'calendar'

// ===== 回归期配置（按实际回归时间修改） =====
const REGRESSION_LIST = [
    { name: 'LEMONADE', year: 2026, month: 5, start: '2026-05-01', end: '2026-05-31' },
    { name: 'WHIPLASH', year: 2024, month: 11, start: '2024-11-01', end: '2024-11-30' },
    { name: 'DRAMA',    year: 2024, month: 5, start: '2024-05-01', end: '2024-05-31' },
    { name: 'SPICY',    year: 2024, month: 2, start: '2024-02-01', end: '2024-02-29' },
    { name: 'GIRLS',    year: 2023, month: 12, start: '2023-12-01', end: '2023-12-31' },
    { name: 'SAVAGE',   year: 2023, month: 10, start: '2023-10-01', end: '2023-10-31' },
    { name: 'NEXT LEVEL', year: 2023, month: 7, start: '2023-07-01', end: '2023-07-31' },
];

function renderPersonButtons() {
    const bar = document.getElementById('personBar');
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
    if (searchKeyword) {
        arr = arr.filter(item =>
            (item.tag || '' + item.shortName || '' + item.title || '' + JSON.stringify(item.links || {})).toLowerCase()
            .includes(searchKeyword)
        );
    }
    arr.sort((a, b) => new Date(a.date) - new Date(b.date));
    return arr;
}

function renderCalendar() {
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

        // 数字角标：当日多行程
        if (dateGroup[fullDate] && dateGroup[fullDate].length > 1) {
            const badge = document.createElement('span');
            badge.className = 'cell-badge';
            badge.textContent = dateGroup[fullDate].length;
            td.style.position = 'relative';
            td.appendChild(badge);
        }

        if (dateGroup[fullDate]) {
            const content = document.createElement('div');
            content.className = 'calendar-content';
            dateGroup[fullDate].forEach(item => {
                const persons = ensurePersonArray(item);
                let primaryColor = persons.length === 1 ? getPersonColor(persons[0]) : MULTI_PERSON_COLOR;
                const textColor = primaryColor;
                const bgColor = hexToRgba(primaryColor, 0.25);
                const fullTitle = item.title || '未命名';

                const block = document.createElement('div');
                block.className = 'calendar-block';
                block.style.background = bgColor;
                block.style.color = textColor;

                const travelTag = (item.tags || []).map(tid => tags.find(t => t.id === tid))
                    .filter(t => t && t.isTravel);
                if (travelTag.length > 0) {
                    const firstTravel = travelTag[0];
                    block.style.borderLeftColor = firstTravel.color;
                    block.classList.add('is-travel');
                    block.style.background = `linear-gradient(135deg, ${hexToRgba(firstTravel.color, 0.3)}, ${hexToRgba(firstTravel.color, 0.1)})`;
                }

                const hasThumb = (item.thumbnail || '').trim() !== '';
                const hasVideo = (item.videoEmbed || '').trim() !== '';
                const icon = hasThumb ? '🖼️' : (hasVideo ? '▶️' : '');
                if (icon) {
                    const iconSpan = document.createElement('span');
                    iconSpan.className = 'block-icon';
                    iconSpan.textContent = icon;
                    block.appendChild(iconSpan);
                }

                const textOuter = document.createElement('span');
                textOuter.className = 'block-text';
                const textInner = document.createElement('span');
                textInner.className = 'text-inner';
                textInner.textContent = fullTitle;
                textOuter.appendChild(textInner);
                block.appendChild(textOuter);

                if (isEditMode) {
                    const tagDots = document.createElement('span');
                    tagDots.className = 'tag-dots';
                    (item.tags || []).forEach(tagId => {
                        const tag = tags.find(t => t.id === tagId);
                        if (tag) {
                            const dot = document.createElement('span');
                            dot.className = 'tag-dot';
                            dot.style.background = tag.color;
                            dot.title = tag.name;
                            tagDots.appendChild(dot);
                        }
                    });
                    block.appendChild(tagDots);
                }

                block.onclick = () => openModal(item);

                block.addEventListener('mouseenter', function() {
                    const inner = this.querySelector('.text-inner');
                    const outer = this.querySelector('.block-text');
                    if (inner && outer && inner.scrollWidth > outer.clientWidth) {
                        const distance = inner.scrollWidth - outer.clientWidth;
                        inner.style.transition = 'transform 3s linear';
                        inner.style.transform = `translateX(-${distance}px)`;
                    }
                });
                block.addEventListener('mouseleave', function() {
                    const inner = this.querySelector('.text-inner');
                    if (inner) {
                        inner.style.transition = 'transform 0.3s ease';
                        inner.style.transform = 'translateX(0)';
                    }
                });

                content.appendChild(block);
            });
            td.appendChild(content);
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

    requestAnimationFrame(() => {
        document.querySelectorAll('.block-text').forEach(outer => {
            const inner = outer.querySelector('.text-inner');
            if (inner && inner.scrollWidth > outer.clientWidth) {
                outer.setAttribute('data-overflow', 'true');
            } else {
                outer.setAttribute('data-overflow', 'false');
            }
        });
    });
}

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

        const card = document.createElement('div');
        card.className = 'dashboard-card glass-card';
        card.innerHTML = `
            <div class="card-title">${reg.name}</div>
            <div class="card-date">${reg.year}年${reg.month}月</div>
            <div class="card-progress">
                <div class="progress-bar-bg">
                    <div class="progress-bar-fill" style="width:${progress}%"></div>
                </div>
                <span class="progress-text">${progress}%</span>
            </div>
            <div class="card-footer">
                <span>${remaining > 0 ? `剩余 ${remaining} 件` : '✅ 已毕业'}</span>
                <span>📅 共 ${total} 件</span>
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
}

function switchToDashboard() {
    currentView = 'dashboard';
    document.getElementById('dashboard-view').classList.add('active');
    document.getElementById('dashboard-view').classList.add('view-fade-in');
    document.getElementById('calendar-view').classList.remove('active');
    document.getElementById('goToDashboard').style.display = 'none';
    document.querySelector('.person-filter-bar').style.display = 'none';
    document.querySelector('.calendar-control').style.display = 'none';
    renderDashboard();
}

function switchToCalendar() {
    currentView = 'calendar';
    document.getElementById('dashboard-view').classList.remove('active');
    document.getElementById('calendar-view').classList.add('active');
    document.getElementById('calendar-view').classList.add('view-fade-in');
    document.getElementById('goToDashboard').style.display = 'inline-block';
    document.querySelector('.person-filter-bar').style.display = 'flex';
    document.querySelector('.calendar-control').style.display = 'flex';
}

function renderAll() {
    if (currentView === 'dashboard') {
        renderDashboard();
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
}