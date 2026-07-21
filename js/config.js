// ===== 配置与常量 =====
const API_BASE = 'https://time-capsule-backend-1-3mzs.onrender.com/api';
const urlParams = new URLSearchParams(location.search);
const isEditMode = urlParams.get('edit') === 'true' || urlParams.get('key') === '20010101';

if (!isEditMode) document.body.classList.add('readonly');

// 编辑模式下搜索框显示"搜索日程"，只读模式显示"筛选日程"
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.placeholder = isEditMode ? '搜索日程...' : '筛选日程...';
    }
});

const weekCN = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
const personList = ['Winter', 'aespa', 'Karina', 'Giselle', 'NingNing'];
const displayPersonList = ['Winter', 'aespa'];

const personColorRule = {
    "Winter": "#4FC3F7",
    "aespa": "#66BB6A",
    "Karina": "#FF6B9D",
    "Giselle": "#B47EDC",
    "NingNing": "#F9A95A"
};

const personDisplayMap = {
    "Winter": "⭐Winter",
    "aespa": "aespa",
    "Karina": "💙Karina",
    "Giselle": "🌙Giselle",
    "NingNing": "🦋NingNing"
};

const MULTI_PERSON_COLOR = "#F9A95A";
const STORAGE_TAGS = 'winter_tags';
const STORAGE_MILESTONES = 'winter_milestones';