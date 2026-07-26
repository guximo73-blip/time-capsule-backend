// ===== 批量导入：JSON 导入 + Excel 导入 =====
// ----- JSON 导入 -----
const importModal = document.getElementById('importModal');
const importClose = document.getElementById('importClose');
const importCancel = document.getElementById('importCancel');
const importDataText = document.getElementById('importDataText');
const importFileBtn = document.getElementById('importFileBtn');
const importFileInput = document.getElementById('importFileInput');
const previewImportBtn = document.getElementById('previewImportBtn');
const importConfirmBtn = document.getElementById('importConfirmBtn');
const importPreviewArea = document.getElementById('importPreviewArea');
const importPreviewBody = document.getElementById('importPreviewBody');
const importTotalCount = document.getElementById('importTotalCount');
const importValidCount = document.getElementById('importValidCount');
const importInvalidCount = document.getElementById('importInvalidCount');
const importProgress = document.getElementById('importProgress');
const importProgressText = document.getElementById('importProgressText');
const importProgressFill = document.getElementById('importProgressFill');
const loadSampleBtn = document.getElementById('loadSampleBtn');

let importPreviewData = [];

function openImportModal() {
    if (!isEditMode) return;
    importDataText.value = '';
    importPreviewArea.style.display = 'none';
    importProgress.classList.remove('active');
    importModal.classList.add('active');
}

function closeImportModal() {
    importModal.classList.remove('active');
    importPreviewArea.style.display = 'none';
    importProgress.classList.remove('active');
}

importClose.onclick = closeImportModal;
importCancel.onclick = closeImportModal;
importModal.addEventListener('click', e => { if (e.target === importModal) closeImportModal(); });

loadSampleBtn.onclick = function() {
    importDataText.value = JSON.stringify([
        { date: "2026-07-20", person: ["Winter"], title: "Winter 新物料发布", links: [{ icon: "📸", text: "Instagram",
                link: "https://www.instagram.com/" }], thumbnail: "https://i.postimg.cc/G38HFjNr/240516.jpg",
            videoEmbed: "" },
        { date: "2026-07-21", person: ["aespa"], title: "aespa 团体回归预告", links: [{ icon: "🎵", text: "YouTube",
                link: "https://www.youtube.com/" }], videoEmbed: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
        { date: "2026-07-22", person: ["Karina", "Winter"], title: "Karina & Winter 双人直播" }
    ], null, 2);
    setTimeout(() => previewImportBtn.click(), 200);
};

importFileBtn.onclick = () => importFileInput.click();
importFileInput.onchange = function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(ev) {
        try { JSON.parse(ev.target.result);
            importDataText.value = ev.target.result;
            setTimeout(() => previewImportBtn.click(), 300); } catch (err) { alert('文件不是有效的 JSON 格式'); }
    };
    reader.readAsText(file);
    importFileInput.value = '';
};

previewImportBtn.onclick = function() {
    const raw = importDataText.value.trim();
    if (!raw) { alert('请先粘贴或上传 JSON 数据。'); return; }
    let parsed;
    try { parsed = JSON.parse(raw); } catch (err) { alert('JSON 解析失败：' + err.message); return; }
    if (!Array.isArray(parsed) || parsed.length === 0) { alert('数据必须是非空数组。'); return; }

    const result = parsed.map((item, idx) => {
        const errors = [];
        const norm = { ...item };
        if (!item.date) errors.push('缺少 date');
        else { norm.date = normalizeDateInput(item.date); if (!isValidDate(norm.date)) errors.push('date 格式无效'); }
        if (!item.person) errors.push('缺少 person');
        else {
            let persons = item.person;
            if (typeof persons === 'string') {
                persons = persons.includes(',') ? persons.split(',').map(s => s.trim()) : [persons.trim()];
            }
            if (!Array.isArray(persons) || persons.length === 0) errors.push('person 至少选一人');
            else {
                const valid = persons.filter(p => personList.includes(p));
                if (valid.length === 0) errors.push('person 不在允许列表中');
                norm.person = valid.length ? valid : persons;
            }
        }
        if (!item.title) errors.push('缺少 title');
        norm.shortName = item.shortName || (item.title ? (item.title.length > 20 ? item.title.slice(0, 18) + '…' : item
            .title) : '未命名');
        if (norm.links && !Array.isArray(norm.links)) {
            try { norm.links = typeof norm.links === 'string' ? JSON.parse(norm.links) : []; } catch { norm.links = []; }
        }
        if (!norm.links) norm.links = [];
        norm.tags = item.tags || [];
        return { index: idx + 1, raw: item, normalized: norm, valid: errors.length === 0, errors };
    });

    importPreviewData = result;
    const tbody = importPreviewBody;
    tbody.innerHTML = '';
    let valid = 0,
        invalid = 0;
    result.forEach(r => {
        const tr = document.createElement('tr');
        tr.className = r.valid ? 'valid' : 'invalid';
        const personsDisplay = Array.isArray(r.normalized.person) ?
            r.normalized.person.map(p => personDisplayMap[p] || p).join(', ') :
            String(r.normalized.person || '');
        const statusHtml = r.valid ?
            `<span class="status-badge valid">✅ 有效</span>` :
            `<span class="status-badge invalid">❌ 无效</span><div class="err-msg">${r.errors.join('; ')}</div>`;
        tr.innerHTML =
            `<td>${r.index}</td><td>${r.normalized.date || '-'}</td><td>${personsDisplay || '-'}</td><td>${r.normalized.title || '-'}</td><td>${statusHtml}</td>`;
        tbody.appendChild(tr);
        if (r.valid) valid++;
        else invalid++;
    });
    importTotalCount.textContent = result.length;
    importValidCount.textContent = valid;
    importInvalidCount.textContent = invalid;
    importPreviewArea.style.display = 'block';
    importProgress.classList.remove('active');
    importConfirmBtn.disabled = valid === 0;
    importConfirmBtn.style.opacity = valid === 0 ? '0.5' : '1';
};

importConfirmBtn.onclick = async function() {
    if (this.disabled) return;
    const validItems = importPreviewData.filter(r => r.valid);
    if (!validItems.length) { alert('没有有效数据可导入。'); return; }
    if (!confirm(`确定要导入 ${validItems.length} 条日程吗？`)) return;

    importProgress.classList.add('active');
    importProgressText.textContent = `正在导入 0 / ${validItems.length} ...`;
    importProgressFill.style.width = '0%';
    this.disabled = true;

    let success = 0,
        fail = 0;
    for (let i = 0; i < validItems.length; i++) {
        const item = validItems[i].normalized;
        try {
            const formData = {
                date: item.date,
                person: item.person,
                tag: item.tag || '',
                shortName: item.shortName,
                title: item.title,
                links: JSON.stringify(item.links || []),
                videoEmbed: item.videoEmbed || '',
                thumbnail: item.thumbnail || '',
                tags: item.tags || []
            };
            const resp = await fetch(`${API_BASE}/data`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const newItem = await resp.json();
            ensurePersonArray(newItem);
            ensureExtraFields(newItem);
            scheduleList.push(newItem);
            success++;
        } catch (err) {
            fail++;
            console.error(`第 ${i + 1} 条导入失败:`, err);
        }
        const done = i + 1;
        importProgressText.textContent = `正在导入 ${done} / ${validItems.length} ...`;
        importProgressFill.style.width = `${(done / validItems.length) * 100}%`;
    }

    importProgressText.textContent = `✅ 导入完成！成功 ${success} 条，失败 ${fail} 条。`;
    importProgressFill.style.width = '100%';
    let msg = `📥 批量导入完成：成功 ${success} 条`;
    if (fail > 0) msg += `，失败 ${fail} 条`;
    showToast(msg, fail === 0 ? 'success' : 'error');
    renderAll();
    setTimeout(() => {
        closeImportModal();
        importConfirmBtn.disabled = false;
        importProgress.classList.remove('active');
    }, 1200);
};

document.getElementById('importBtn').onclick = openImportModal;

// ----- Excel 导入 -----
const excelImportModal = document.getElementById('excelImportModal');
const excelFileInput = document.getElementById('excelFileInput');
const excelPreviewArea = document.getElementById('excelPreviewArea');
const excelPreviewBody = document.getElementById('excelPreviewBody');
const excelTotalCount = document.getElementById('excelTotalCount');
const excelValidCount = document.getElementById('excelValidCount');
const excelInvalidCount = document.getElementById('excelInvalidCount');
const excelConfirmBtn = document.getElementById('excelConfirmBtn');
const excelImportCancel = document.getElementById('excelImportCancel');
const excelImportClose = document.getElementById('excelImportClose');
const excelTemplateLink = document.getElementById('excelTemplateLink');
let excelPreviewData = [];

document.getElementById('importExcelBtn').addEventListener('click', function() {
    excelFileInput.value = '';
    excelPreviewArea.style.display = 'none';
    excelPreviewData = [];
    excelImportModal.classList.add('active');
});

excelImportClose.onclick = () => excelImportModal.classList.remove('active');
excelImportCancel.onclick = () => excelImportModal.classList.remove('active');
excelImportModal.addEventListener('click', e => { if (e.target === excelImportModal) excelImportModal.classList.remove(
        'active'); });

excelTemplateLink.onclick = function(e) {
    e.preventDefault();
    const wb = XLSX.utils.book_new();
    const data = [
        ["date", "person", "title", "links", "thumbnail", "videoEmbed"],
        ["2026-07-20", "Winter", "Winter 新物料发布", '{"icon":"📸","text":"Instagram","link":"https://instagram.com/p/xxx"}',
            "https://i.postimg.cc/G38HFjNr/240516.jpg", ""
        ],
        ["2026-07-21", "aespa", "aespa 团体回归预告", '{"icon":"🎵","text":"YouTube","link":"https://youtube.com/watch?v=xxx"}',
            "", "https://www.youtube.com/embed/dQw4w9WgXcQ"
        ],
        ["2026-07-22", "Karina,Winter", "Karina & Winter 双人直播", "", "", ""]
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "日程");
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = '日程导入模板.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
};

excelFileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(ev) {
        try {
            const data = new Uint8Array(ev.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(sheet);
            if (!jsonData || jsonData.length === 0) {
                alert('Excel 文件为空或格式不正确');
                return;
            }
            const result = jsonData.map((row, idx) => {
                const errors = [];
                const norm = {};
                norm.date = row.date ? normalizeDateInput(String(row.date).trim()) : '';
                if (!norm.date || !isValidDate(norm.date)) errors.push('日期无效');
                if (row.person) {
                    const persons = String(row.person).split(',').map(s => s.trim()).filter(s => s);
                    norm.person = persons.length ? persons : [];
                    if (!persons.length) errors.push('人物为空');
                } else {
                    errors.push('缺少 person');
                    norm.person = [];
                }
                norm.title = row.title ? String(row.title).trim() : '';
                if (!norm.title) errors.push('缺少 title');
                norm.shortName = norm.title.length > 20 ? norm.title.slice(0, 18) + '…' : norm.title;
                norm.tags = [];
                if (row.links) {
                    try { norm.links = typeof row.links === 'string' ? JSON.parse(row.links) : row.links; } catch { norm
                            .links = []; }
                } else norm.links = [];
                norm.thumbnail = row.thumbnail ? String(row.thumbnail).trim() : '';
                norm.videoEmbed = row.videoEmbed ? String(row.videoEmbed).trim() : '';
                norm.tag = '';
                return { index: idx + 1, raw: row, normalized: norm, valid: errors.length === 0, errors };
            });
            excelPreviewData = result;
            const tbody = excelPreviewBody;
            tbody.innerHTML = '';
            let valid = 0,
                invalid = 0;
            result.forEach(r => {
                const tr = document.createElement('tr');
                tr.className = r.valid ? 'valid' : 'invalid';
                const personsDisplay = r.normalized.person && r.normalized.person.length ? r.normalized.person
                    .join(', ') : '-';
                const statusHtml = r.valid ?
                    `<span class="status-badge valid">✅ 有效</span>` :
                    `<span class="status-badge invalid">❌ 无效</span><div class="err-msg">${r.errors.join('; ')}</div>`;
                tr.innerHTML =
                    `<td>${r.index}</td><td>${r.normalized.date || '-'}</td><td>${personsDisplay}</td><td>${r.normalized.title || '-'}</td><td>${statusHtml}</td>`;
                tbody.appendChild(tr);
                if (r.valid) valid++;
                else invalid++;
            });
            excelTotalCount.textContent = result.length;
            excelValidCount.textContent = valid;
            excelInvalidCount.textContent = invalid;
            excelPreviewArea.style.display = 'block';
            excelConfirmBtn.disabled = valid === 0;
            excelConfirmBtn.style.opacity = valid === 0 ? '0.5' : '1';
        } catch (err) {
            alert('解析 Excel 失败：' + err.message);
        }
    };
    reader.readAsArrayBuffer(file);
});

excelConfirmBtn.onclick = async function() {
    if (this.disabled) return;
    const validItems = excelPreviewData.filter(r => r.valid);
    if (!validItems.length) { alert('没有有效数据可导入。'); return; }
    if (!confirm(`确定要导入 ${validItems.length} 条日程吗？`)) return;
    this.disabled = true;
    this.textContent = '⏳ 导入中...';
    let success = 0,
        fail = 0;
    for (let i = 0; i < validItems.length; i++) {
        const item = validItems[i].normalized;
        try {
            const formData = {
                date: item.date,
                person: item.person,
                tag: item.tag || '',
                shortName: item.shortName,
                title: item.title,
                links: JSON.stringify(item.links || []),
                videoEmbed: item.videoEmbed || '',
                thumbnail: item.thumbnail || '',
                tags: item.tags || []
            };
            const resp = await fetch(`${API_BASE}/data`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const newItem = await resp.json();
            ensurePersonArray(newItem);
            ensureExtraFields(newItem);
            scheduleList.push(newItem);
            success++;
        } catch (err) {
            fail++;
            console.error(`第 ${i + 1} 条导入失败:`, err);
        }
    }
    let msg = `📊 Excel 导入完成：成功 ${success} 条`;
    if (fail > 0) msg += `，失败 ${fail} 条`;
    showToast(msg, fail === 0 ? 'success' : 'error');
    renderAll();
    this.textContent = '📥 确认导入';
    this.disabled = false;
    setTimeout(() => {
        excelImportModal.classList.remove('active');
        excelPreviewArea.style.display = 'none';
    }, 800);
};