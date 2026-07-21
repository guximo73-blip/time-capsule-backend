// ===== API 操作 =====
let scheduleList = [];

async function loadScheduleData() {
    try {
        const resp = await fetch(`${API_BASE}/data`);
        if (!resp.ok) throw new Error('加载失败');
        let data = await resp.json();
        data = data.map(item => {
            ensurePersonArray(item);
            ensureExtraFields(item);
            return item;
        });
        scheduleList = data;
        renderAll();
        return scheduleList;
    } catch (err) {
        console.error('加载数据异常：', err);
        scheduleList = [];
        renderAll();
        return [];
    }
}

async function addSchedule(formData) {
    if (!isEditMode) return null;
    try {
        const resp = await fetch(`${API_BASE}/data`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        if (!resp.ok) throw new Error('添加失败');
        const newItem = await resp.json();
        ensurePersonArray(newItem);
        ensureExtraFields(newItem);
        scheduleList.push(newItem);
        renderAll();
        return newItem;
    } catch (err) {
        console.error('添加失败：', err);
        alert('添加失败，请检查后端是否启动');
        return null;
    }
}

async function updateScheduleById(id, formData) {
    if (!isEditMode) return null;
    try {
        const resp = await fetch(`${API_BASE}/data/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        if (!resp.ok) throw new Error('更新失败');
        const updated = await resp.json();
        ensurePersonArray(updated);
        ensureExtraFields(updated);
        const idx = scheduleList.findIndex(item => item.id === id);
        if (idx !== -1) scheduleList[idx] = updated;
        renderAll();
        return updated;
    } catch (err) {
        console.error('更新失败：', err);
        alert('更新失败');
        return null;
    }
}

async function deleteScheduleById(id) {
    if (!isEditMode) return;
    try {
        const resp = await fetch(`${API_BASE}/data/${id}`, { method: 'DELETE' });
        if (!resp.ok) throw new Error('删除失败');
        scheduleList = scheduleList.filter(item => item.id !== id);
        renderAll();
    } catch (err) {
        console.error('删除失败：', err);
        alert('删除失败');
    }
}

function getScheduleById(id) {
    return scheduleList.find(item => item.id === id);
}