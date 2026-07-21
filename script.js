const API_BASE = 'https://time-capsule-backend-1-3mzs.onrender.com/api';
const urlParams = new URLSearchParams(window.location.search);
const isEditMode = urlParams.get('edit') === 'true' || urlParams.get('key') === '20010101';
if (!isEditMode) document.body.classList.add('readonly');

let scheduleList = [],
    currentFilterPerson = "all",
    searchKeyword = "",
    viewYear = new Date().getFullYear(),
    viewMonth = new Date().getMonth() + 1;
const weekCN = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"],
    personList = ['Winter', 'aespa', 'Karina', 'Giselle', 'NingNing'],
    displayPersonList = ['Winter', 'aespa'];
const personColorRule = { Winter: "#4FC3F7", aespa: "#66BB6A", Karina: "#FF6B9D", Giselle: "#B47EDC", NingNing: "#F9A95A" };
const personDisplayMap = { Winter: "⭐Winter", aespa: "aespa", Karina: "💙Karina", Giselle: "🌙Giselle", NingNing: "🦋NingNing" };
const MULTI_PERSON_COLOR = "#F9A95A";

function getPersonColor(p) { return personColorRule[p] || '#4FC3F7' }

function getTextColorForPerson(p) { return ['Winter', 'aespa', 'Karina', 'NingNing'].includes(p) ? '#000' : '#fff' }

function extractPersonKey(raw) { if (!raw || typeof raw != 'string') return null; for (let name of personList) if (raw.includes(name)) return name; return null }

function ensurePersonArray(item) { if (!item) return []; let persons = item.person; if (typeof persons === 'string') { try { let parsed = JSON.parse(persons);
        persons = Array.isArray(parsed) ? parsed : (typeof parsed === 'object' ? Object.values(parsed) : [parsed]) } catch { persons = persons.includes(',') ? persons
            .split(',').map(s => s.trim()) : [persons.trim()] } } else if (!Array.isArray(persons)) persons = []; persons = persons.map(p => { if (typeof p ===
            'string') { const key = extractPersonKey(p); return key || p } return p }).filter(p => p && typeof p === 'string' && p.trim() !== '').map(p => p
        .trim()); persons = persons.map(p => personList.includes(p) ? p : (extractPersonKey(p) || p)); item.person = persons; return persons }

function normalizeScheduleData(data) { return data.map(item => { ensurePersonArray(item); return item }) }

async function loadScheduleData() { try { const resp = await fetch(`${API_BASE}/data`); if (!resp.ok) throw new Error('加载失败'); const data = await resp
        .json(); scheduleList = normalizeScheduleData(data) || []; renderAll(); return scheduleList } catch (err) { console.error('加载数据异常：', err);
        scheduleList = []; renderAll(); return [] } }

async function addSchedule(formData) { if (!isEditMode) return null; try { const resp = await fetch(`${API_BASE}/data`, { method: 'POST', headers: {
                'Content-Type': 'application/json' }, body: JSON.stringify(formData) }); if (!resp.ok) throw new Error('添加失败'); const newItem = await resp
            .json(); ensurePersonArray(newItem); scheduleList.push(newItem); renderAll(); return newItem } catch (err) { console.error('添加失败：', err);
        alert('添加失败，请检查后端是否启动'); return null } }

async function updateScheduleById(id, formData) { if (!isEditMode) return null; try { const resp = await fetch(`${API_BASE}/data/${id}`, { method: 'PUT',
            headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) }); if (!resp.ok) throw new Error('更新失败'); const updated =
        await resp.json(); ensurePersonArray(updated); const idx = scheduleList.findIndex(item => item.id === id); if (idx !== -1) scheduleList[idx] =
        updated; renderAll(); return updated } catch (err) { console.error('更新失败：', err); alert('更新失败'); return null } }

async function deleteScheduleById(id) { if (!isEditMode) return; try { const resp = await fetch(`${API_BASE}/data/${id}`, { method: 'DELETE' }); if (!resp
        .ok) throw new Error('删除失败'); scheduleList = scheduleList.filter(item => item.id !== id); renderAll() } catch (err) { console.error('删除失败：',
        err); alert('删除失败') } }

function getScheduleById(id) { return scheduleList.find(item => item.id === id) }
const modalMask = document.getElementById('modalMask'),
    modalTitle = document.getElementById('modalTitle'),
    modalLinkList = document.getElementById('modalLinkList'),
    modalMediaBox = document.getElementById('modalMediaBox'),
    modalPersonTags = document.getElementById('modalPersonTags'),
    modalClose = document.getElementById('modalClose'),
    modalDeleteBtn = document.getElementById('modalDeleteBtn'),
    modalEditBtn = document.getElementById('modalEditBtn');
let currentDeleteId = null;

function closeModal() { modalMask.classList.remove('active'); modalMediaBox.innerHTML = '<span class="no-media">暂无媒体</span>'; currentDeleteId = null }
modalClose.onclick = closeModal;
modalMask.addEventListener('click', (e) => { if (e.target === modalMask) closeModal() });
modalDeleteBtn.onclick = function() { if (!isEditMode) return; if (currentDeleteId && confirm('确定要删除此日程吗？')) { deleteScheduleById(
        currentDeleteId); closeModal() } };
modalEditBtn.onclick = function() { if (!isEditMode) return; if (currentDeleteId) { const item = getScheduleById(currentDeleteId); if (item) { closeModal();
        openForm(item) } } };

function urlToEmbed(rawUrl) { if (!rawUrl) return ""; const url = rawUrl.trim(); if (url.includes('player.bilibili.com/player.html') || url.includes(
        'youtube.com/embed/')) return url; const bv = url.match(/BV\w{10}/); if (bv) { const page = (url.match(/[?&]p=(\d+)/) || [])[1] || 1; return
        `https://player.bilibili.com/player.html?bvid=${bv[0]}&page=${page}&danmaku=0` } const yt = url.match(/youtu\.be\/([A-Za-z0-9_-]{11})/) || url
    .match(/[?&]v=([A-Za-z0-9_-]{11})/); if (yt) return `https://www.youtube.com/embed/${yt[1]}`; return null }

function openModal(itemData) { currentDeleteId = itemData.id; modalTitle.innerText = itemData.title; const persons = ensurePersonArray(itemData);
    modalPersonTags.innerHTML = ''; if (persons.length === 0) { const tag = document.createElement('span'); tag.className = 'modal-person-tag'; tag
        .innerText = '未分类'; tag.style.background = '#888'; tag.style.color = '#fff'; modalPersonTags.appendChild(tag) } else { persons.forEach(p => {
            let key = personList.includes(p) ? p : (extractPersonKey(p) || p); const tag = document.createElement('span'); tag.className =
            'modal-person-tag'; tag.innerText = personDisplayMap[key] || key; tag.style.background = getPersonColor(key); tag.style.color =
            getTextColorForPerson(key); modalPersonTags.appendChild(tag) }) } modalMediaBox.innerHTML = ''; const thumb = (itemData.thumbnail || '')
        .trim(); const video = (itemData.videoEmbed || itemData.videoembed || '').trim(); if (thumb) { const img = document.createElement('img');
        img.src = thumb; img.alt = itemData.title || '缩略图'; img.onerror = function() { this.style.display = 'none'; modalMediaBox.innerHTML =
            '<span class="no-media">图片加载失败</span>' }; modalMediaBox.appendChild(img) } else if (video) { const embed = urlToEmbed(video); if (
        embed === null) { modalMediaBox.innerHTML =
            `<span class="no-media">此平台不支持内嵌，<a href="${video}" target="_blank" class="fallback-link">点击跳转</a></span>` } else { const iframe =
            document.createElement('iframe'); iframe.width = '100%'; iframe.height = '100%'; iframe.src = embed; iframe.frameBorder = '0'; iframe
        .allow = 'accelerometer, autoplay, clipboard-write, encrypted-media, gyroscope, picture-in-picture'; iframe.allowFullscreen = true;
        iframe.onerror = function() { modalMediaBox.innerHTML =
                `<span class="no-media">无法嵌入，<a href="${video}" target="_blank" class="fallback-link">点击跳转</a></span>` }; modalMediaBox
            .appendChild(iframe) } } else { modalMediaBox.innerHTML = '<span class="no-media">暂无媒体</span>' } modalLinkList.innerHTML = '';
    let links = itemData.links; if (typeof links === 'string') try { links = JSON.parse(links) } catch { links = [] } if (!Array.isArray(links)) links =
        []; if (links.length) { links.forEach(link => { const div = document.createElement('div'); div.className = 'modal-link-item'; if (link.link) {
            div.innerHTML =
                `<span class="link-icon">${link.icon||'🔗'}</span> <a href="${link.link}" target="_blank">${link.text||'查看'}</a>` } else { div
                .innerText = `${link.icon||''} ${link.text||''}` } modalLinkList.appendChild(div) }) } else { const empty = document.createElement(
            'div'); empty.style.color = '#666'; empty.style.fontSize = '14px'; empty.innerText = '暂无链接'; modalLinkList.appendChild(empty) }
    modalMask.classList.add('active') }
const formModal = document.getElementById('formModal'),
    formClose = document.getElementById('formClose'),
    formCancel = document.getElementById('formCancel'),
    scheduleForm = document.getElementById('scheduleForm'),
    formTitleEl = document.getElementById('formTitle'),
    formSubmitBtn = document.getElementById('formSubmitBtn'),
    personCheckboxContainer = document.getElementById('personCheckboxContainer');
let editModeId = null;

function renderPersonCheckboxes(selected) { personCheckboxContainer.innerHTML = ''; personList.forEach(p => { const label = document.createElement(
        'label'); const cb = document.createElement('input'); cb.type = 'checkbox'; cb.value = p; cb.checked = selected ? selected.includes(p) :
        false; const dot = document.createElement('span'); dot.className = 'person-color-dot'; dot.style.background = getPersonColor(p); label
        .appendChild(cb); label.appendChild(dot); label.appendChild(document.createTextNode(personDisplayMap[p] || p));
        personCheckboxContainer.appendChild(label) }) }

function getSelectedPersons() { return Array.from(personCheckboxContainer.querySelectorAll('input:checked')).map(cb => cb.value) }

function setSelectedPersons(persons) { personCheckboxContainer.querySelectorAll('input').forEach(cb => cb.checked = persons ? persons.includes(cb
    .value) : false) }

function openForm(itemData) { if (!isEditMode) return; if (itemData) { editModeId = itemData.id; formTitleEl.textContent = '✏️ 编辑日程';
        formSubmitBtn.textContent = '💾 更新'; document.getElementById('formDate').value = itemData.date || ''; setSelectedPersons(
        ensurePersonArray(itemData)); document.getElementById('formTitleInput').value = itemData.title || ''; document.getElementById(
        'formLinks').value = itemData.links || ''; document.getElementById('formVideo').value = itemData.videoEmbed || itemData.videoembed ||
        ''; document.getElementById('formThumbnail').value = itemData.thumbnail || '' } else { editModeId = null; formTitleEl.textContent =
        '📝 新建日程'; formSubmitBtn.textContent = '✅ 保存'; document.getElementById('formDate').value = ''; setSelectedPersons([]); document
        .getElementById('formTitleInput').value = ''; document.getElementById('formLinks').value = ''; document.getElementById('formVideo')
        .value = ''; document.getElementById('formThumbnail').value = '' } formModal.classList.add('active') }

function closeForm() { formModal.classList.remove('active'); editModeId = null }
formClose.onclick = closeForm;
formCancel.onclick = closeForm;
formModal.addEventListener('click', (e) => { if (e.target === formModal) closeForm() });

function isValidDate(dateStr) { const parts = dateStr.split('-'); if (parts.length !== 3) return false; const y = parseInt(parts[0]),
        m = parseInt(parts[1]) - 1,
        d = parseInt(parts[2]); const dt = new Date(y, m, d); return dt.getFullYear() === y && dt.getMonth() === m && dt.getDate() === d }

function normalizeDateInput(raw) { const s = raw.trim(); if (!s) return s; if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s; if (/^\d{6}$/.test(s)) {
        const yy = s.slice(0, 2),
            mm = s.slice(2, 4),
            dd = s.slice(4, 6); if (parseInt(mm) >= 1 && parseInt(mm) <= 12 && parseInt(dd) >= 1 && parseInt(dd) <= 31) return
            `20${yy}-${mm}-${dd}`; return s } if (/^\d{8}$/.test(s)) { const yyyy = s.slice(0, 4),
            mm = s.slice(4, 6),
            dd = s.slice(6, 8); if (parseInt(mm) >= 1 && parseInt(mm) <= 12 && parseInt(dd) >= 1 && parseInt(dd) <= 31) return
            `${yyyy}-${mm}-${dd}`; return s } return s }
scheduleForm.onsubmit = async function(e) { e.preventDefault(); if (!isEditMode) return; const date = normalizeDateInput(document.getElementById(
        'formDate').value.trim()); const persons = getSelectedPersons(); const title = document.getElementById('formTitleInput').value.trim();
    const linksRaw = document.getElementById('formLinks').value.trim(); const videoEmbed = document.getElementById('formVideo').value.trim();
    const thumbnail = document.getElementById('formThumbnail').value.trim(); if (!date || !isValidDate(date)) { alert(
        '请填写有效日期 (YYYY-MM-DD 或 6/8位数字)'); return } if (!persons.length) { alert('请至少选择一个人物'); return } if (!title) { alert(
        '请填写标题'); return } let links = '[]'; if (linksRaw) { try { const parsed = JSON.parse(linksRaw); if (!Array.isArray(parsed)) throw new Error();
        links = JSON.stringify(parsed) } catch { alert('链接 JSON 格式错误'); return } } const shortName = title.length > 20 ? title.slice(0,
        18) + '…' : title; const formData = { date, person: persons, tag: '', shortName, title, links, videoEmbed, thumbnail }; if (
        editModeId) await updateScheduleById(editModeId, formData); else await addSchedule(formData); closeForm() };
const ymPicker = document.getElementById('ymPickerOverlay'),
    ymYear = document.getElementById('ymYearSelect'),
    ymMonth = document.getElementById('ymMonthSelect'),
    ymConfirmBtn = document.getElementById('ymConfirm'),
    ymCancelBtn = document.getElementById('ymCancel');

function initYMSelects() { const cy = new Date().getFullYear(); ymYear.innerHTML = ''; for (let y = 2020; y <= cy + 2; y++) { const opt =
        document.createElement('option'); opt.value = y; opt.textContent = y + '年'; ymYear.appendChild(opt) } ymMonth.innerHTML = ''; for (
        let m = 1; m <= 12; m++) { const opt = document.createElement('option'); opt.value = m; opt.textContent = m + '月'; ymMonth.appendChild(
            opt) } ymYear.value = viewYear; ymMonth.value = viewMonth }
document.getElementById('ymDisplay').onclick = function() { ymYear.value = viewYear; ymMonth.value = viewMonth; ymPicker.classList.add(
    'active') };
ymConfirmBtn.onclick = function() { const y = parseInt(ymYear.value),
        m = parseInt(ymMonth.value); if (y >= 2020 && m >= 1 && m <= 12) { viewYear = y;
        viewMonth = m;
        syncJumpSelect();
        renderCalendar();
        ymPicker.classList.remove('active') } };
ymCancelBtn.onclick = () => ymPicker.classList.remove('active');
ymPicker.addEventListener('click', (e) => { if (e.target === ymPicker) ymPicker.classList.remove('active') });

function syncJumpSelect() { document.getElementById('ymDisplay').innerText = `${viewYear}年${viewMonth}月` }

function renderPersonButtons() { const bar = document.getElementById('personBar'); bar.innerHTML = ''; const counts = {};
    personList.forEach(p => counts[p] = 0); let multiCount = 0;
    scheduleList.forEach(item => { const persons = ensurePersonArray(item); if (persons.length > 1) multiCount++;
        persons.forEach(p => { let key = personList.includes(p) ? p : (extractPersonKey(p) || p); if (counts[key] !== undefined) counts[
            key]++ }) }); const allBtn = document.createElement('button'); allBtn.className = 'person-btn active'; allBtn.dataset.val =
        'all'; allBtn.innerText = `全部 (${scheduleList.length})`; bar.appendChild(allBtn);
    displayPersonList.forEach(p => { const btn = document.createElement('button'); btn.className = 'person-btn'; btn.dataset.val = p;
        btn.innerText = `${personDisplayMap[p]||p} (${counts[p]||0})`; btn.style.background = getPersonColor(p); btn.style.color =
        getTextColorForPerson(p); if (currentFilterPerson === p) btn.classList.add('active'); bar.appendChild(btn) }); const multiBtn =
        document.createElement('button'); multiBtn.className = 'person-btn'; multiBtn.dataset.val = 'multi'; multiBtn.innerText =
        `👥 多人 (${multiCount})`; multiBtn.style.background = MULTI_PERSON_COLOR; multiBtn.style.color = '#000'; if (currentFilterPerson ===
        'multi') multiBtn.classList.add('active'); bar.appendChild(multiBtn);
    bar.querySelectorAll('.person-btn').forEach(btn => { btn.onclick = function() { bar.querySelectorAll('.person-btn').forEach(b => b
                .classList.remove('active')); this.classList.add('active'); currentFilterPerson = this.dataset.val;
            renderAll() } }) }
document.getElementById('prevMonth').onclick = function() { viewMonth--; if (viewMonth < 1) { viewMonth = 12;
        viewYear-- } if (viewYear < 2020) viewYear = 2020;
    syncJumpSelect();
    renderCalendar() };
document.getElementById('nextMonth').onclick = function() { viewMonth++; if (viewMonth > 12) { viewMonth = 1;
        viewYear++ }
    syncJumpSelect();
    renderCalendar() };
document.getElementById('searchInput').addEventListener('input', (e) => { searchKeyword = e.target.value.trim().toLowerCase();
    renderAll() });

function getFilterData() { let arr = [...scheduleList]; if (currentFilterPerson === 'multi') { arr = arr.filter(item => ensurePersonArray(
            item).length > 1) } else if (currentFilterPerson !== 'all') { arr = arr.filter(item => ensurePersonArray(item).includes(
            currentFilterPerson)) } if (searchKeyword) { arr = arr.filter(item => (item.tag || '' + item.shortName || '' + item.title ||
            '' + JSON.stringify(item.links || {})).toLowerCase().includes(searchKeyword)) } arr.sort((a, b) => new Date(a.date) - new Date(
        b.date)); return arr }

function renderCalendar() { const calDom = document.getElementById('calendar-area'); calDom.innerHTML = '';
    syncJumpSelect(); const data = getFilterData(); const targetYM =
        `${viewYear}-${String(viewMonth).padStart(2,'0')}`; const monthData = data.filter(item => item.date && item.date.startsWith(
        targetYM)); const dateGroup = {};
    monthData.forEach(item => { if (!dateGroup[item.date]) dateGroup[item.date] = [];
        dateGroup[item.date].push(item) }); const table = document.createElement('table'); table.className = 'calendar-table'; const thead =
        document.createElement('thead'); const trHead = document.createElement('tr');
    weekCN.forEach(w => { const th = document.createElement('th');
        th.innerText = w;
        trHead.appendChild(th) });
    thead.appendChild(trHead);
    table.appendChild(thead); const tbody = document.createElement('tbody'); const firstDay = new Date(viewYear, viewMonth - 1, 1)
    .getDay(); const totalDays = new Date(viewYear, viewMonth, 0).getDate(); let tr = document.createElement('tr'); for (let i = 0; i <
        firstDay; i++) { tr.appendChild(document.createElement('td')) } let col = firstDay; for (let d = 1; d <= totalDays; d++) { const td =
            document.createElement('td'); const fullDate =
            `${viewYear}-${String(viewMonth).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        td.innerHTML = `<div class="cell-header">${d}日</div>`; if (dateGroup[fullDate]) { const content = document.createElement(
            'div'); content.className = 'calendar-content';
            dateGroup[fullDate].forEach(item => { const persons = ensurePersonArray(item); let bgColor = persons.length === 1 ?
                getPersonColor(persons[0]) : MULTI_PERSON_COLOR; let displayText = (item.shortName || item.title || '未命名'); if (
                    displayText.length > 20) displayText = displayText.slice(0, 18) + '…'; const block = document.createElement(
                    'div'); block.className = 'calendar-block'; block.style.background = bgColor; const hasThumb = (item
                    .thumbnail || '').trim() !== ''; const hasVideo = (item.videoEmbed || '').trim() !== ''; const icon =
                hasThumb ? '🖼️' : (hasVideo ? '▶️' : ''); block.innerHTML = icon ?
                `<span class="block-icon">${icon}</span> ${displayText}` :
                displayText;
                block.onclick = () => openModal(item);
                content.appendChild(block) });
            td.appendChild(content) }
        tr.appendChild(td);
        col++; if (col >= 7) { tbody.appendChild(tr);
            tr = document.createElement('tr');
            col = 0 } } if (tr.children.length) tbody.appendChild(tr);
    table.appendChild(tbody);
    calDom.appendChild(table) }

function renderAll() { renderPersonButtons();
    renderCalendar() }
const importModal = document.getElementById('importModal'),
    importClose = document.getElementById('importClose'),
    importCancel = document.getElementById('importCancel'),
    importDataText = document.getElementById('importDataText'),
    importFileBtn = document.getElementById('importFileBtn'),
    importFileInput = document.getElementById('importFileInput'),
    importExcelBtn = document.getElementById('importExcelBtn'),
    importExcelInput = document.getElementById('importExcelInput'),
    previewImportBtn = document.getElementById('previewImportBtn'),
    importConfirmBtn = document.getElementById('importConfirmBtn'),
    importPreviewArea = document.getElementById('importPreviewArea'),
    importPreviewBody = document.getElementById('importPreviewBody'),
    importTotalCount = document.getElementById('importTotalCount'),
    importValidCount = document.getElementById('importValidCount'),
    importDuplicateCount = document.getElementById('importDuplicateCount'),
    importInvalidCount = document.getElementById('importInvalidCount'),
    importProgress = document.getElementById('importProgress'),
    importProgressText = document.getElementById('importProgressText'),
    importProgressFill = document.getElementById('importProgressFill'),
    importResultToast = document.getElementById('importResultToast'),
    importResultMsg = document.getElementById('importResultMsg'),
    importToastClose = document.getElementById('importToastClose'),
    loadSampleBtn = document.getElementById('loadSampleBtn');
let importPreviewData = [];

function isDuplicateWithExisting(newItem) { const newVideo = (newItem.videoEmbed || '').trim(); const newThumb = (newItem.thumbnail || '')
        .trim(); if (!newVideo && !newThumb) return false; return scheduleList.some(ex => { const exVideo = (ex.videoEmbed || '')
            .trim(); const exThumb = (ex.thumbnail || '').trim(); if (newVideo && exVideo && newVideo === exVideo) return true; if (
            newThumb && exThumb && newThumb === exThumb) return true; return false }) }

function openImportModal() { if (!isEditMode) return;
    importDataText.value = '';
    importPreviewArea.style.display = 'none';
    importProgress.classList.remove('active');
    importModal.classList.add('active') }

function closeImportModal() { importModal.classList.remove('active');
    importPreviewArea.style.display = 'none';
    importProgress.classList.remove('active') }
importClose.onclick = closeImportModal;
importCancel.onclick = closeImportModal;
importModal.addEventListener('click', (e) => { if (e.target === importModal) closeImportModal() });
loadSampleBtn.onclick = function() {
    importDataText.value = JSON.stringify([
        { date: "2026-07-20", person: ["Winter"], title: "Winter 新物料发布", links: [{ icon: "📸", text: "Instagram", link: "https://www.instagram.com/" }],
            thumbnail: "https://i.postimg.cc/G38HFjNr/240516.jpg", videoEmbed: "" },
        { date: "2026-07-21", person: ["aespa"], title: "aespa 团体回归预告", links: [{ icon: "🎵", text: "YouTube",
                link: "https://www.youtube.com/" }], videoEmbed: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
        { date: "2026-07-22", person: ["Karina", "Winter"], title: "Karina & Winter 双人直播" }
    ], null, 2);
    setTimeout(() => previewImportBtn.click(), 200)
};
importFileBtn.onclick = () => importFileInput.click();
importFileInput.onchange = function(e) { const file = e.target.files[0]; if (!file) return; const reader = new FileReader();
    reader.onload = function(ev) { try { JSON.parse(ev.target.result);
            importDataText.value = ev.target.result;
            setTimeout(() => previewImportBtn.click(), 300) } catch (err) { alert('文件不是有效的 JSON 格式') } };
    reader.readAsText(file);
    importFileInput.value = '' };
importExcelBtn.onclick = () => importExcelInput.click();
importExcelInput.onchange = function(e) { const file = e.target.files[0]; if (!file) return; const reader = new FileReader();
    reader.onload = function(ev) { try { const data = new Uint8Array(ev.target.result); const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]]; const rows = XLSX.utils.sheet_to_json(firstSheet); if (!rows ||
                rows.length === 0) { alert('Excel 文件为空或格式不正确。'); return } const mapped = rows.map(row => { const date = row[
                    '日期'] || row['date'] || row['Date'] || ''; let person = row['人物'] || row['person'] || row['Person'] || '';
                if (typeof person === 'string' && person.includes(',')) { person = person.split(',').map(s => s.trim()) } else if (
                    typeof person === 'string') { person = [person.trim()] } else if (!Array.isArray(person)) { person = [] }
                const title = row['标题'] || row['title'] || row['Title'] || ''; let links = row['链接'] || row['links'] || '';
                if (typeof links === 'string' && links.trim().startsWith('[')) { try { links = JSON.parse(links) } catch {} }
                const thumbnail = row['缩略图'] || row['thumbnail'] || ''; const videoEmbed = row['视频嵌入'] || row[
                    'videoEmbed'] || ''; return { date, person, title, links, thumbnail, videoEmbed } }); const filtered =
                mapped.filter(item => item.date && item.title); if (filtered.length === 0) { alert(
                    'Excel 中未找到有效数据，请确保列名包含：日期、人物、标题（或 date, person, title）'); return }
            importDataText.value = JSON.stringify(filtered, null, 2);
            setTimeout(() => previewImportBtn.click(), 300) } catch (err) { alert('解析 Excel 失败：' + err.message) } };
    reader.readAsArrayBuffer(file);
    importExcelInput.value = '' };
previewImportBtn.onclick = function() { const raw = importDataText.value.trim(); if (!raw) { alert('请先粘贴或上传数据。'); return } let parsed;
    try { parsed = JSON.parse(raw) } catch (err) { alert('JSON 解析失败：' + err.message); return } if (!Array.isArray(parsed) || parsed
        .length === 0) { alert('数据必须是非空数组。'); return } const result = parsed.map((item, idx) => { const errors = [];
        const norm = {...item }; if (!item.date) errors.push('缺少 date'); else { norm.date = normalizeDateInput(item.date); if (!
                isValidDate(norm.date)) errors.push('date 格式无效') } if (!item.person) errors.push('缺少 person'); else { let persons =
                item.person; if (typeof persons === 'string') { persons = persons.includes(',') ? persons.split(',').map(s => s
                .trim()) : [persons.trim()] } if (!Array.isArray(persons) || persons.length === 0) errors.push(
                'person 至少选一人'); else { const valid = persons.filter(p => personList.includes(p)); if (valid.length === 0)
                errors.push('person 不在允许列表中');
                norm.person = valid.length ? valid : persons } } if (!item.title) errors.push('缺少 title');
        norm.shortName = item.shortName || (item.title ? (item.title.length > 20 ? item.title.slice(0, 18) + '…' : item
            .title) : '未命名'); if (norm.links && !Array.isArray(norm.links)) { try { norm.links = typeof norm.links ===
                'string' ? JSON.parse(norm.links) : [] } catch { norm.links = [] } } if (!norm.links) norm.links = [];
        let isDuplicate = false; if (errors.length === 0) { isDuplicate = isDuplicateWithExisting(norm) } return { index: idx +
                1, raw: item, normalized: norm, valid: errors.length === 0, duplicate: isDuplicate, errors } });
    importPreviewData = result; const tbody = importPreviewBody;
    tbody.innerHTML = ''; let valid = 0,
        invalid = 0,
        duplicate = 0;
    result.forEach(r => { const tr = document.createElement('tr'); if (r.duplicate) { tr.className = 'duplicate' } else if (r
            .valid) { tr.className = 'valid' } else { tr.className = 'invalid' } const personsDisplay = Array.isArray(r
            .normalized.person) ? r.normalized.person.map(p => personDisplayMap[p] || p).join(', ') : String(r.normalized
            .person || ''); let statusHtml = ''; if (r.duplicate) { statusHtml =
                `<span class="status-badge duplicate">⚠️ 重复（将跳过）</span><div class="dup-msg">视频或缩略图已存在</div>` } else if (r
                .valid) { statusHtml = `<span class="status-badge valid">✅ 可导入</span>` } else { statusHtml =
                `<span class="status-badge invalid">❌ 无效</span><div class="err-msg">${r.errors.join('; ')}</div>` }
        tr.innerHTML =
            `<td>${r.index}</td><td>${r.normalized.date||'-'}</td><td>${personsDisplay||'-'}</td><td>${r.normalized.title||'-'}</td><td>${statusHtml}</td>`;
        tbody.appendChild(tr); if (r.duplicate) duplicate++;
        else if (r.valid) valid++;
        else invalid++ });
    importTotalCount.textContent = result.length;
    importValidCount.textContent = valid;
    importDuplicateCount.textContent = duplicate;
    importInvalidCount.textContent = invalid;
    importPreviewArea.style.display = 'block';
    importProgress.classList.remove('active');
    importConfirmBtn.disabled = valid === 0;
    importConfirmBtn.style.opacity = valid === 0 ? '0.5' : '1' };
importConfirmBtn.onclick = async function() { if (this.disabled) return; const validItems = importPreviewData.filter(r => r.valid && !r
        .duplicate); if (!validItems.length) { alert('没有可导入的有效数据（所有条目均无效或重复）。'); return } if (!confirm(
        `确定要导入 ${validItems.length} 条日程吗？（重复的 ${importPreviewData.filter(r=>r.duplicate).length} 条将被跳过）`)) return;
    importProgress.classList.add('active');
    importProgressText.textContent = `正在导入 0 / ${validItems.length} ...`;
    importProgressFill.style.width = '0%'; this.disabled = true; let success = 0,
        fail = 0; for (let i = 0; i < validItems.length; i++) { const item = validItems[i].normalized; try { const formData = {
                date: item.date,
                person: item.person,
                tag: item.tag || '',
                shortName: item.shortName,
                title: item.title,
                links: JSON.stringify(item.links || []),
                videoEmbed: item.videoEmbed || '',
                thumbnail: item.thumbnail || ''
            }; const resp = await fetch(`${API_BASE}/data`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData) }); if (!resp.ok) throw new Error(`HTTP ${resp.status}`); const newItem =
                await resp.json();
            ensurePersonArray(newItem);
            scheduleList.push(newItem);
            success++ } catch (err) { fail++;
            console.error(`第 ${i+1} 条导入失败:`, err) } const done = i + 1;
        importProgressText.textContent = `正在导入 ${done} / ${validItems.length} ...`;
        importProgressFill.style.width = `${(done/validItems.length)*100}%` } const totalDuplicate = importPreviewData.filter(
        r => r.duplicate).length;
    importProgressText.textContent =
        `✅ 导入完成！成功 ${success} 条，失败 ${fail} 条，跳过重复 ${totalDuplicate} 条。`;
    importProgressFill.style.width = '100%'; let msg = `📥 批量导入完成：成功 ${success} 条`; if (fail > 0) msg += `，失败 ${fail} 条`; if (
        totalDuplicate > 0) msg += `，跳过重复 ${totalDuplicate} 条`;
    showToast(msg, fail === 0 ? 'success' : 'error');
    renderAll();
    setTimeout(() => { closeImportModal();
        importConfirmBtn.disabled = false;
        importProgress.classList.remove('active') }, 1200) };

function showToast(msg, type) { importResultMsg.textContent = msg;
    importResultToast.className = `import-result-toast show ${type}`;
    setTimeout(() => importResultToast.classList.remove('show'), 6000) }
importToastClose.onclick = () => importResultToast.classList.remove('show');
document.getElementById('importBtn').onclick = openImportModal;
document.getElementById('addBtn').onclick = function() { if (!isEditMode) return; if (!personCheckboxContainer.children.length)
        renderPersonCheckboxes([]);
    openForm(null) };
window.onload = async function() {
    initYMSelects();
    await loadScheduleData();
    syncJumpSelect();
    renderAll();
    renderPersonCheckboxes([]);
    if (!isEditMode) console.log('只读模式。添加 ?key=20010101 开启编辑');
    else console.log('编辑模式已启用')
};