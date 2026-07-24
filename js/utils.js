// ===== 工具函数 =====
function getPersonColor(p) {
    return personColorRule[p] || '#4FC3F7';
}

function getTextColorForPerson(p) {
    return ['Winter', 'aespa', 'Karina', 'NingNing'].includes(p) ? '#000' : '#fff';
}

function extractPersonKey(raw) {
    if (!raw || typeof raw !== 'string') return null;
    for (let name of personList) {
        if (raw.includes(name)) return name;
    }
    return null;
}

function ensurePersonArray(item) {
    if (!item) return [];
    let persons = item.person;
    if (typeof persons === 'string') {
        try {
            let parsed = JSON.parse(persons);
            persons = Array.isArray(parsed) ? parsed : (typeof parsed === 'object' ? Object.values(parsed) : [parsed]);
        } catch {
            persons = persons.includes(',') ? persons.split(',').map(s => s.trim()) : [persons.trim()];
        }
    } else if (!Array.isArray(persons)) persons = [];
    persons = persons.map(p => {
        if (typeof p === 'string') {
            const key = extractPersonKey(p);
            return key || p;
        }
        return p;
    }).filter(p => p && typeof p === 'string' && p.trim() !== '').map(p => p.trim());
    persons = persons.map(p => personList.includes(p) ? p : (extractPersonKey(p) || p));
    item.person = persons;
    return persons;
}

function ensureExtraFields(item) {
    if (!item.tags) item.tags = [];
    return item;
}

function hexToRgba(hex, alpha) {
    let h = hex.trim();
    if (h.startsWith('#')) h = h.slice(1);
    if (h.length === 3) {
        h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    }
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}

function genId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function isValidDate(dateStr) {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return false;
    const y = parseInt(parts[0]),
        m = parseInt(parts[1]) - 1,
        d = parseInt(parts[2]);
    const dt = new Date(y, m, d);
    return dt.getFullYear() === y && dt.getMonth() === m && dt.getDate() === d;
}

function normalizeDateInput(raw) {
    const s = raw.trim();
    if (!s) return s;
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    if (/^\d{6}$/.test(s)) {
        const yy = s.slice(0, 2),
            mm = s.slice(2, 4),
            dd = s.slice(4, 6);
        if (parseInt(mm) >= 1 && parseInt(mm) <= 12 && parseInt(dd) >= 1 && parseInt(dd) <= 31)
            return `20${yy}-${mm}-${dd}`;
        return s;
    }
    if (/^\d{8}$/.test(s)) {
        const yyyy = s.slice(0, 4),
            mm = s.slice(4, 6),
            dd = s.slice(6, 8);
        if (parseInt(mm) >= 1 && parseInt(mm) <= 12 && parseInt(dd) >= 1 && parseInt(dd) <= 31)
            return `${yyyy}-${mm}-${dd}`;
        return s;
    }
    return s;
}

function urlToEmbed(rawUrl) {
    if (!rawUrl) return "";
    const url = rawUrl.trim();
    if (url.includes('player.bilibili.com/player.html') || url.includes('youtube.com/embed/')) return url;
    const bv = url.match(/BV\w{10}/);
    if (bv) {
        const page = (url.match(/[?&]p=(\d+)/) || [])[1] || 1;
        return `https://player.bilibili.com/player.html?bvid=${bv[0]}&page=${page}&danmaku=0`;
    }
    const yt = url.match(/youtu\.be\/([A-Za-z0-9_-]{11})/) || url.match(/[?&]v=([A-Za-z0-9_-]{11})/);
    if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
    return null;
}

function showToast(msg, type) {
    const toast = document.getElementById('importResultToast');
    const msgEl = document.getElementById('importResultMsg');
    msgEl.textContent = msg;
    toast.className = 'import-result-toast show ' + type;
    setTimeout(() => toast.classList.remove('show'), 6000);
}

// ============================================================
// 🖼️ 图片代理：通过您自己的后端代理加载受限图片
// ============================================================
function getProxiedImageUrl(url) {
    if (!url) return '';

    // 检测是否为需要代理的图片平台
    const needsProxy = url.includes('instagram.com') || url.includes('cdninstagram.com') ||
                       url.includes('twitter.com') || url.includes('twimg.com') || url.includes('x.com') ||
                       url.includes('sinaimg.cn') || url.includes('pic.sinaimg.cn') ||
                       url.includes('doubanio.com') || url.includes('douban.com');

    if (needsProxy) {
        // 使用您自己的后端代理接口
        return `/api/image-proxy?url=${encodeURIComponent(url)}`;
    }

    return url;
}

// 带重试的图片加载
function loadImageWithRetry(imgElement, originalUrl, retryCount) {
    if (retryCount === undefined) retryCount = 0;
    if (retryCount >= 3) {
        imgElement.style.display = 'none';
        const parent = imgElement.parentElement;
        if (parent) {
            parent.innerHTML = `<span class="no-media">图片加载失败<br><span style="font-size:12px;color:#666;word-break:break-all;">${originalUrl}</span></span>`;
        }
        return;
    }

    const proxyUrl = getProxiedImageUrl(originalUrl);
    imgElement.src = proxyUrl;

    // 超时重试
    let timeoutId = setTimeout(() => {
        loadImageWithRetry(imgElement, originalUrl, retryCount + 1);
    }, 10000);

    imgElement.onload = function() {
        clearTimeout(timeoutId);
        imgElement.style.display = '';
    };

    imgElement.onerror = function() {
        clearTimeout(timeoutId);
        loadImageWithRetry(imgElement, originalUrl, retryCount + 1);
    };
}
