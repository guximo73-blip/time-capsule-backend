// ===== 本地存储：标签/重要日 =====
let tags = [];
let milestones = [];

function loadTagsFromStorage() {
    const stored = localStorage.getItem(STORAGE_TAGS);
    if (stored) {
        try { tags = JSON.parse(stored); } catch { tags = []; }
    } else {
        tags = [
            { id: 'tag1', name: '演唱会', color: '#ff6b9d', isTravel: true },
            { id: 'tag2', name: '飞行', color: '#ffaa00', isTravel: true },
            { id: 'tag3', name: '直播', color: '#4FC3F7', isTravel: false },
            { id: 'tag4', name: '画报', color: '#B47EDC', isTravel: false },
        ];
        saveTagsToStorage();
    }
    tags = tags.map(t => ({ ...t, isTravel: t.isTravel || false }));
    saveTagsToStorage();
}

function saveTagsToStorage() {
    localStorage.setItem(STORAGE_TAGS, JSON.stringify(tags));
}

function loadMilestonesFromStorage() {
    const stored = localStorage.getItem(STORAGE_MILESTONES);
    if (stored) {
        try { milestones = JSON.parse(stored); } catch { milestones = []; }
    } else {
        milestones = [
            { id: 'ms1', date: '2020-11-17', title: '出道日', icon: '🌟' },
            { id: 'ms2', date: '2001-01-01', title: '生日', icon: '🎂' },
        ];
        saveMilestonesToStorage();
    }
}

function saveMilestonesToStorage() {
    localStorage.setItem(STORAGE_MILESTONES, JSON.stringify(milestones));
}