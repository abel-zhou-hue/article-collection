/ 全局变量
let allArticles = [];
let currentCategory = '全部';
let searchQuery = '';

// 自动分类关键词库
const CATEGORY_KEYWORDS = {
    '科技': ['AI', '人工智能', 'GPT', '机器学习', '深度学习', '区块链', '加密货币', '技术', '编程', '代码', '算法', '软件', '硬件', '5G', '物联网', '大数据', '云计算', '芯片', '华为', '苹果', '特斯拉', '自动驾驶'],
    '生活': ['生活', '美食', '旅游', '旅行', '健身', '运动', '健康', '养生', '家居', '装修', '穿搭', '时尚', '美妆', '摄影', '音乐', '电影', '电视剧', '综艺', '娱乐', '游戏'],
    '干货': ['干货', '教程', '指南', '技巧', '方法', '经验', '总结', '复盘', '案例', '实践', '操作', '步骤', '流程', '方法', '攻略', '秘籍', '技巧'],
    '商业': ['商业', '创业', '投资', '理财', '股票', '基金', '金融', '经济', '管理', '营销', '品牌', '战略', '商业模式', '创业', '职场', '求职', '招聘', '薪资', 'KPI', 'OKR'],
    '读书': ['读书', '书籍', '阅读', '书评', '推荐书单', '书单', '经典', '名著', '小说', '散文', '诗歌', '传记', '历史', '哲学', '心理学', '经济学', '管理学'],
    '工具': ['工具', '软件', 'App', '应用', '插件', '浏览器', '办公', '效率', '自动化', '脚本', '工具箱', '神器', '黑科技', '开源', '免费', '破解'],
    '其他': []
};

// 自动分类函数
function autoCategorize(title, summary = '') {
    const text = (title + ' ' + summary).toLowerCase();

    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        if (category === '其他') continue;

        for (const keyword of keywords) {
            if (text.includes(keyword.toLowerCase())) {
                return category;
            }
        }
    }

    return '其他';
}

// 从API获取文章数据
async function fetchArticles() {
    try {
        const response = await fetch('/api/articles');
        if (!response.ok) {
            throw new Error('获取数据失败');
        }
        const data = await response.json();
        return data.articles || [];
    } catch (error) {
        console.error('获取文章失败:', error);
        return [];
    }
}

// 渲染文章卡片
function renderArticles(articles) {
    const articleList = document.getElementById('articleList');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const emptyState = document.getElementById('emptyState');

    // 隐藏加载动画
    loadingSpinner.classList.add('hidden');

    // 检查是否有文章
    if (!articles || articles.length === 0) {
        articleList.innerHTML = '';
        articleList.appendChild(emptyState);
        emptyState.classList.remove('hidden');
        return;
    }

    // 隐藏空状态
    emptyState.classList.add('hidden');

    // 生成文章卡片 HTML
const articlesHTML = articles.map((article, index) => {
const { title, url, category, summary, source, time } = article;
    return `
        <div class="glass-card rounded-2xl p-6 fade-in" style="animation-delay: ${index * 0.1}s">
            <div class="flex items-start justify-between mb-4">
                <div class="flex-1">
                    <h3 class="text-lg font-semibold mb-2 line-clamp-2">${escapeHtml(title)}</h3>
                    <p class="text-sm text-gray-400 line-clamp-3 mb-3">${escapeHtml(summary || '暂无摘要')}</p>
                </div>
            </div>
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                    <span class="category-tag px-3 py-1 rounded-full text-xs font-medium">${escapeHtml(category)}</span>
                    ${source ? `<span class="text-xs text-gray-500">${escapeHtml(source)}</span>` : ''}
                </div>
                <a
                    href="${escapeHtml(url)}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm font-medium transition-colors flex items-center space-x-2"
                >
                    <span>阅读</span>
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                    </svg>
                </a>
            </div>
            ${time ? `<div class="mt-4 pt-4 border-t border-white/10 text-xs text-gray-500">收藏于 ${escapeHtml(time)}</div>` : ''}
        </div>
    `;
}).join('');
articleList.innerHTML = articlesHTML;
}

// 过滤文章
function filterArticles() {
let filtered = [...allArticles];
// 分类过滤
if (currentCategory !== '全部') {
    filtered = filtered.filter(article => article.category === currentCategory);
}
// 搜索过滤
if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(query) ||
        (article.summary && article.summary.toLowerCase().includes(query)) ||
        (article.source && article.source.toLowerCase().includes(query))
    );
}
// 排序（按时间倒序）
filtered.sort((a, b) => {
    if (a.time && b.time) {
        return new Date(b.time) - new Date(a.time);
    }
    return 0;
});
return filtered;
}

// 切换分类
function filterByCategory(category) {
currentCategory = category;
// 更新按钮状态
document.querySelectorAll('.category-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.category === category) {
        btn.classList.add('active');
    }
});
// 过滤并渲染
const filtered = filterArticles();
renderArticles(filtered);
}

// 搜索功能
document.getElementById('searchInput').addEventListener('input', (e) => {
searchQuery = e.target.value;
const filtered = filterArticles();
renderArticles(filtered);
});

// 刷新文章
async function refreshArticles() {
const loadingSpinner = document.getElementById('loadingSpinner');
loadingSpinner.classList.remove('hidden');
allArticles = await fetchArticles();
// 更新文章数量
document.getElementById('articleCount').textContent = allArticles.length;
// 过滤并渲染
const filtered = filterArticles();
renderArticles(filtered);
}

// HTML 转义
function escapeHtml(text) {
if (!text) return '';
const div = document.createElement('div');
div.textContent = text;
return div.innerHTML;
}

// 初始化
async function init() {
// 获取文章数据
allArticles = await fetchArticles();
// 更新文章数量
document.getElementById('articleCount').textContent = allArticles.length;
// 过滤并渲染
const filtered = filterArticles();
renderArticles(filtered);
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);
---
## 📋 操作步骤
1. 在GitHub点击 **`Add file`** → **`Create new file`**
2. 在 **`Name your file...`** 里输入：**`public/js/main.js`**
3. 在下面的编辑框里，粘贴上面的代码
4. 在 **`Commit new file:`** 里输入：**`Add main.js`**
5. 点击绿色按钮 **`Commit changes`**
---
## ✅ 完成后告诉我
完成了告诉我，我发最后一个文件：`api/articles.js`** 🐾
