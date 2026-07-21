// ===== 模态框：详情、表单、标签管理、重要日管理 =====
const modalMask = document.getElementById('modalMask');
const modalTitle = document.getElementById('modalTitle');
const modalLinkList = document.getElementById('modalLinkList');
const modalMediaBox = document.getElementById('modalMediaBox');
const modalPersonTags = document.getElementById('modalPersonTags');
const modalClose = document.getElementById('modalClose');
const modalDeleteBtn = document.getElementById('modalDeleteBtn');
const modalEditBtn = document.getElementById('modalEditBtn');
const modalTagDisplay = document.getElementById('modalTagDisplay');
let currentDeleteId = null;

const formModal = document.getElementById('formModal');
const formClose = document.getElementById('formClose');
const formCancel = document.getElementById('formCancel');
const scheduleForm = document.getElementById('scheduleForm');
const formTitleEl = document.getElementById('formTitle');
const formSubmitBtn = document.getElementById('formSubmitBtn');
const personCheckboxContainer = document.getElementById('personCheckboxContainer');
const formTagCheckboxContainer = document.getElementById('formTagCheckboxContainer');
let editModeId = null;

// ----- 详情模态框 -----
function closeModal() {
    modalMask.classList.remove('active');
    modalMediaBox.innerHTML = '<span class="no-media">暂无媒体</span>';
    currentDeleteId = null;
}

function openModal(itemData) {
    currentDeleteId = itemData.id;
    modalTitle.innerText = itemData.title;
    const persons = ensurePersonArray(itemData);
    modalPersonTags.innerHTML = '';
    if (persons.length === 0) {
        const tag = document.createElement('span');
        tag.className = 'modal-person-tag';
        tag.innerText = '未分类';
        tag.style.background = '#888';
        tag.style.color = '#fff';
        modalPersonTags.appendChild(tag);
    } else {
        persons.forEach(p => {
            let key = personList.includes(p) ? p : (extractPersonKey(p) || p);
            const tag = document.createElement('span');
            tag.className = 'modal-person-tag';
            tag.innerText = personDisplayMap[key] || key;
            tag.style.background = getPersonColor(key);
            tag.style.color = getTextColorForPerson(key);
            modalPersonTags.appendChild(tag);
        });
    }

    modalTagDisplay.innerHTML = '';
    if (itemData.tags && itemData.tags.length) {
        itemData.tags.forEach(tagId => {
            const tag = tags.find(t => t.id === tagId);
            if (tag) {
                const span = document.createElement('span');
                span.style.display = 'inline-block';
                span.style.padding = '2px 10px';
                span.style.borderRadius = '12px';
                span.style.background = tag.color + '33';
                span.style.border = '1px solid ' + tag.color;
                span.style.color = '#fff';
                span.textContent = tag.name + (tag.isTravel ? ' 🚗' : '');
                modalTagDisplay.appendChild(span);
            }
        });
    } else {
        const span = document.createElement('span');
        span.style.color = '#666';
        span.textContent = '无行程';
        modalTagDisplay.appendChild(span);
    }

    // ============================================================
    // 🔧 修复：微博图片使用代理加载
    // ============================================================
    modalMediaBox.innerHTML = '';
    const thumb = (itemData.thumbnail || '').trim();
    const video = (itemData.videoEmbed || itemData.videoembed || '').trim();

    if (thumb) {
        const img = document.createElement('img');
        // ✅ 使用代理地址（解决防盗链）
        const proxyUrl = getProxiedImageUrl(thumb);
        img.src = proxyUrl;
        img.alt = itemData.title || '缩略图';
        img.setAttribute('referrerpolicy', 'no-referrer');

        // 如果代理加载失败，尝试直接加载原图
        img.onerror = function() {
            if (this.src.includes('images.weserv.nl')) {
                this.src = thumb;
                this.onerror = function() {
                    this.style.display = 'none';
                    modalMediaBox.innerHTML = `<span class="no-media">图片加载失败</span>`;
                };
            } else {
                this.style.display = 'none';
                modalMediaBox.innerHTML = `<span class="no-media">图片加载失败</span>`;
            }
        };
        modalMediaBox.appendChild(img);
    } else if (video) {
        const embed = urlToEmbed(video);
        if (embed === null) {
            modalMediaBox.innerHTML =
                `<span class="no-media">此平台不支持内嵌，<a href="${video}" target="_blank" class="fallback-link">点击跳转</a></span>`;
        } else {
            const iframe = document.createElement('iframe');
            iframe.width = '100%';
            iframe.height = '100%';
            iframe.src = embed;
            iframe.frameBorder = '0';
            iframe.allow = 'accelerometer, autoplay, clipboard-write, encrypted-media, gyroscope, picture-in-picture';
            iframe.allowFullscreen = true;
            iframe.onerror = function() {
                modalMediaBox.innerHTML =
                    `<span class="no-media">无法嵌入，<a href="${video}" target="_blank" class="fallback-link">点击跳转</a></span>`;
            };
            modalMediaBox.appendChild(iframe);
        }
    } else {
        modalMediaBox.innerHTML = '<span class="no-media">暂无媒体</span>';
    }

    modalLinkList.innerHTML = '';
    let links = itemData.links;
    if (typeof links === 'string') try { links = JSON.parse(links); } catch { links = []; }
    if (!Array.isArray(links)) links = [];
    if (links.length) {
        links.forEach(link => {
            const div = document.createElement('div');
            div.className = 'modal-link-item';
            if (link.link) {
                div.innerHTML =
                    `<span class="link-icon">${link.icon || '🔗'}</span> <a href="${link.link}" target="_blank">${link.text || '查看'}</a>`;
            } else {
                div.innerText = `${link.icon || ''} ${link.text || ''}`;
            }
            modalLinkList.appendChild(div);
        });
    } else {
        const empty = document.createElement('div');
        empty.style.color = '#666';
        empty.style.fontSize = '14px';
        empty.innerText = '暂无链接';
        modalLinkList.appendChild(empty);
    }

    modalMask.classList.add('active');
}

// ----- 表单模态框 -----
function renderPersonCheckboxes(selected) {
    personCheckboxContainer.innerHTML = '';
    personList.forEach(p => {
        const label = document.createElement('label');
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.value = p;
        cb.checked = selected ? selected.includes(p) : false;
        const dot = document.createElement('span');
        dot.className = 'person-color-dot';
        dot.style.background = getPersonColor(p);
        label.appendChild(cb);
        label.appendChild(dot);
        label.appendChild(document.createTextNode(personDisplayMap[p] || p));
        personCheckboxContainer.appendChild(label);
    });
}

function renderFormTagCheckboxes(selected) {
    formTagCheckboxContainer.innerHTML = '';
    tags.forEach(tag => {
        const label = document.createElement('label');
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.value = tag.id;
        cb.checked = selected ? selected.includes(tag.id) : false;
        const dot = document.createElement('span');
        dot.style.display = 'inline-block';
        dot.style.width = '10px';
        dot.style.height = '10px';
        dot.style.borderRadius = '50%';
        dot.style.background = tag.color;
        dot.style.marginRight = '4px';
        label.appendChild(cb);
        label.appendChild(dot);
        label.appendChild(document.createTextNode(tag.name + (tag.isTravel ? ' 🚗' : '')));
        formTagCheckboxContainer.appendChild(label);
    });
}

function getSelectedPersons() {
    return Array.from(personCheckboxContainer.querySelectorAll('input:checked')).map(cb => cb.value);
}

function setSelectedPersons(persons) {
    personCheckboxContainer.querySelectorAll('input').forEach(cb => cb.checked = persons ? persons.includes(cb.value) : false);
}

function openForm(itemData) {
    if (!isEditMode) return;
    if (itemData) {
        editModeId = itemData.id;
        formTitleEl.textContent = '✏️ 编辑日程';
        formSubmitBtn.textContent = '💾 更新';
        document.getElementById('formDate').value = itemData.date || '';
        setSelectedPersons(ensurePersonArray(itemData));
        document.getElementById('formTitleInput').value = itemData.title || '';
        document.getElementById('formLinks').value = itemData.links || '';
        document.getElementById('formVideo').value = itemData.videoEmbed || itemData.videoembed || '';
        document.getElementById('formThumbnail').value = itemData.thumbnail || '';
        renderFormTagCheckboxes(itemData.tags || []);
    } else {
        editModeId = null;
        formTitleEl.textContent = '📝 新建日程';
        formSubmitBtn.textContent = '✅ 保存';
        document.getElementById('formDate').value = '';
        setSelectedPersons([]);
        document.getElementById('formTitleInput').value = '';
        document.getElementById('formLinks').value = '';
        document.getElementById('formVideo').value = '';
        document.getElementById('formThumbnail').value = '';
        renderFormTagCheckboxes([]);
    }
    formModal.classList.add('active');
}

function closeForm() {
    formModal.classList.remove('active');
    editModeId = null;
}

// ----- 标签管理 -----
function renderTagManager() {
    const container = document.getElementById('tagListContainer');
    container.innerHTML = '';
    tags.forEach(tag => {
        const div = document.createElement('div');
        div.className = 'tag-item';
        div.innerHTML = `
            <span class="color-preview" style="background:${tag.color}"></span>
            ${tag.name}
            <label class="travel-toggle">
                <input type="checkbox" ${tag.isTravel ? 'checked' : ''} data-id="${tag.id}" />
                🚗 行程
            </label>
            <button class="del-tag" data-id="${tag.id}">✕</button>
        `;
        container.appendChild(div);
        div.querySelector('input[type=checkbox]').addEventListener('change', function(e) {
            e.stopPropagation();
            const id = this.dataset.id;
            const found = tags.find(t => t.id === id);
            if (found) {
                found.isTravel = this.checked;
                saveTagsToStorage();
                renderTagManager();
                renderAll();
            }
        });
        div.querySelector('.del-tag').onclick = function(e) {
            e.stopPropagation();
            if (confirm(`删除行程 "${tag.name}" ？`)) {
                tags = tags.filter(t => t.id !== tag.id);
                saveTagsToStorage();
                renderTagManager();
                renderAll();
            }
        };
    });
}

// ----- 重要日管理 -----
function renderMilestoneManager() {
    const container = document.getElementById('milestoneListContainer');
    container.innerHTML = '';
    milestones.forEach(ms => {
        const div = document.createElement('div');
        div.className = 'milestone-item';
        div.innerHTML = `
            ${ms.icon || '🌟'} ${ms.date} ${ms.title}
            <button class="del-milestone" data-id="${ms.id}">✕</button>
        `;
        container.appendChild(div);
        div.querySelector('.del-milestone').onclick = function(e) {
            e.stopPropagation();
            if (confirm(`删除重要日 "${ms.title}" ？`)) {
                milestones = milestones.filter(m => m.id !== ms.id);
                saveMilestonesToStorage();
                renderMilestoneManager();
                renderAll();
            }
        };
    });
}

// ----- 事件绑定 -----
modalClose.onclick = closeModal;
modalMask.addEventListener('click', e => { if (e.target === modalMask) closeModal(); });
modalDeleteBtn.onclick = function() {
    if (!isEditMode) return;
    if (currentDeleteId && confirm('确定要删除此日程吗？')) {
        deleteScheduleById(currentDeleteId);
        closeModal();
    }
};
modalEditBtn.onclick = function() {
    if (!isEditMode) return;
    if (currentDeleteId) {
        const item = getScheduleById(currentDeleteId);
        if (item) { closeModal();
            openForm(item); }
    }
};

formClose.onclick = closeForm;
formCancel.onclick = closeForm;
formModal.addEventListener('click', e => { if (e.target === formModal) closeForm(); });

scheduleForm.onsubmit = async function(e) {
    e.preventDefault();
    if (!isEditMode) return;
    const date = normalizeDateInput(document.getElementById('formDate').value.trim());
    const persons = getSelectedPersons();
    const title = document.getElementById('formTitleInput').value.trim();
    const linksRaw = document.getElementById('formLinks').value.trim();
    const videoEmbed = document.getElementById('formVideo').value.trim();
    const thumbnail = document.getElementById('formThumbnail').value.trim();
    const selectedTags = Array.from(formTagCheckboxContainer.querySelectorAll('input:checked')).map(cb => cb.value);

    if (!date || !isValidDate(date)) { alert('请填写有效日期 (YYYY-MM-DD 或 6/8位数字)'); return; }
    if (!persons.length) { alert('请至少选择一个人物'); return; }
    if (!title) { alert('请填写标题'); return; }
    let links = '[]';
    if (linksRaw) {
        try { const parsed = JSON.parse(linksRaw); if (!Array.isArray(parsed)) throw new Error();
            links = JSON.stringify(parsed); } catch { alert('链接 JSON 格式错误'); return; }
    }
    const shortName = title.length > 20 ? title.slice(0, 18) + '…' : title;
    const formData = { date, person: persons, tag: '', shortName, title, links, videoEmbed, thumbnail, tags: selectedTags };
    if (editModeId) {
        await updateScheduleById(editModeId, formData);
    } else {
        await addSchedule(formData);
    }
    closeForm();
};

document.getElementById('addTagBtn').onclick = function() {
    const nameInput = document.getElementById('newTagName');
    const colorInput = document.getElementById('newTagColor');
    const name = nameInput.value.trim();
    if (!name) { alert('请输入行程名称'); return; }
    if (tags.some(t => t.name === name)) { alert('行程已存在'); return; }
    tags.push({ id: genId(), name, color: colorInput.value, isTravel: false });
    saveTagsToStorage();
    nameInput.value = '';
    renderTagManager();
    renderAll();
};

document.getElementById('addMilestoneBtn').onclick = function() {
    const dateInput = document.getElementById('newMilestoneDate');
    const titleInput = document.getElementById('newMilestoneTitle');
    const iconInput = document.getElementById('newMilestoneIcon');
    const date = dateInput.value.trim();
    const title = titleInput.value.trim();
    const icon = iconInput.value.trim() || '🌟';
    if (!date || !title) { alert('请填写日期和名称'); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { alert('日期格式必须为 YYYY-MM-DD'); return; }
    milestones.push({ id: genId(), date, title, icon });
    saveMilestonesToStorage();
    dateInput.value = '';
    titleInput.value = '';
    renderMilestoneManager();
    renderAll();
};

document.getElementById('manageTagsBtn').addEventListener('click', function() {
    renderTagManager();
    document.getElementById('tagManagerModal').classList.add('active');
});
document.getElementById('tagManagerClose').addEventListener('click', function() {
    document.getElementById('tagManagerModal').classList.remove('active');
});
document.getElementById('tagManagerModal').addEventListener('click', function(e) {
    if (e.target === this) this.classList.remove('active');
});

document.getElementById('manageMilestonesBtn').addEventListener('click', function() {
    renderMilestoneManager();
    document.getElementById('milestoneManagerModal').classList.add('active');
});
document.getElementById('milestoneManagerClose').addEventListener('click', function() {
    document.getElementById('milestoneManagerModal').classList.remove('active');
});
document.getElementById('milestoneManagerModal').addEventListener('click', function(e) {
    if (e.target === this) this.classList.remove('active');
});
