const express = require('express');
const path = require('path');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;

// 飞书配置
const FEISHU_CONFIG = {
    app_id: process.env.FEISHU_APP_ID,
    app_secret: process.env.FEISHU_APP_SECRET,
    app_token: 'Aw5FbsB2oaMNWqsIbXqcZBQ8nhe',
    table_id: 'tblKGEhDcZiUk6ju'
};

// 字段 ID 映射
const FIELD_IDS = {
    title: 'fldNeHmY2M',      // 文章标题
    url: 'fldali4otI',         // 文章链接
    category: 'fldxSjf6f0',    // 分类
    summary: 'fldQqS0fWg',     // 文章摘要
    source: 'fld32nc9aG',       // 来源
    time: 'fldvDnYQW7'         // 收藏时间
};

// 自动分类关键词
const CATEGORY_KEYWORDS = {
    '科技': ['AI', '人工智能', 'GPT', '机器学习', '深度学习', '区块链', '加密货币', '技术', '编程', '代码', '算法', '软件', '硬件', '5G', '物联网', '大数据', '云计算', '芯片', '华为', '苹果', '特斯拉', '自动驾驶'],
    '生活': ['生活', '美食', '旅游', '旅行', '健身', '运动', '健康', '养生', '家居', '装修', '穿搭', '时尚', '美妆', '摄影', '音乐', '电影', '电视剧', '综艺', '娱乐', '游戏'],
    '干货': ['干货', '教程', '指南', '技巧', '方法', '经验', '总结', '复盘', '案例', '实践', '操作', '步骤', '流程', '方法', '攻略', '秘籍', '技巧'],
    '商业': ['商业', '创业', '投资', '理财', '股票', '基金', '金融', '经济', '管理', '营销', '品牌', '战略', '商业模式', '创业', '职场', '求职', '招聘', '薪资', 'KPI', 'OKR'],
    '读书': ['读书', '书籍', '阅读', '书评', '推荐书单', '书单', '经典', '名著', '小说', '散文', '诗歌', '传记', '历史', '哲学', '心理学', '经济学', '管理学'],
    '工具': ['工具', '软件', 'App', '应用', '插件', '浏览器', '办公', '效率', '自动化', '脚本', '工具箱', '神器', '黑科技', '开源', '免费', '破解'],
    '其他': []
};

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

// HTTP 请求函数
function httpRequest(options, data = null) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let body = '';

            res.on('data', (chunk) => {
                body += chunk;
            });

            res.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    resolve(body);
                }
            });
        });

        req.on('error', reject);

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

// 获取飞书访问令牌
async function getFeishuAccessToken() {
    const options = {
        hostname: 'open.feishu.cn',
        path: '/open-apis/auth/v3/tenant_access_token/internal',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const data = {
        app_id: FEISHU_CONFIG.app_id,
        app_secret: FEISHU_CONFIG.app_secret
    };

    const response = await httpRequest(options, data);

    if (response.code !== 0) {
        throw new Error(`获取访问令牌失败: ${response.msg}`);
    }

    return response.tenant_access_token;
}

// 从飞书表格读取数据
async function fetchArticlesFromFeishu() {
    try {
        const accessToken = await getFeishuAccessToken();

        const options = {
            hostname: 'open.feishu.cn',
            path: `/open-apis/bitable/v1/apps/${FEISHU_CONFIG.app_token}/tables/${FEISHU_CONFIG.table_id}/records?page_size=100`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        };

        const response = await httpRequest(options);

        if (response.code !== 0) {
            throw new Error(`读取飞书数据失败: ${response.msg}`);
        }

        // 转换数据格式
const articles = response.data.items.map(record => {
const fields = record.fields;
return {
title: fields[FIELD_IDS.title] || '未命名',
url: fields[FIELD_IDS.url] || '',
category: fields[FIELD_IDS.category] || '其他',
summary: fields[FIELD_IDS.summary] || '',
source: fields[FIELD_IDS.source] || '',
time: fields[FIELD_IDS.time] || ''
};
});
    return articles;
} catch (error) {
    console.error('从飞书读取数据失败:', error);
    // 返回示例数据作为备选
    return [
        {
            title: '示例文章标题',
            url: 'https://example.com/article',
            category: '科技',
            summary: '这是一个示例文章摘要...',
            source: '示例来源',
            time: new Date().toISOString().replace('T', ' ').substring(0, 19)
        }
    ];
}
}

// 静态文件服务
app.use('/js', express.static(path.join(__dirname, 'public', 'js')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// API 路由
app.get('/api/articles', async (req, res) => {
try {
const articles = await fetchArticlesFromFeishu();
    res.json({
        success: true,
        articles: articles,
        count: articles.length
    });
} catch (error) {
    console.error('API 错误:', error);
    res.status(500).json({
        success: false,
        error: error.message,
        articles: []
    });
}
});

// 健康检查
app.get('/health', (req, res) => {
res.json({ status: 'ok' });
});

// 默认路由 - 返回主页
app.get('/', (req, res) => {
res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404 处理
app.use((req, res) => {
res.status(404).json({ error: 'Not found' });
});

// 启动服务器
app.listen(PORT, () => {
console.log(`服务器运行在 http://localhost:${PORT}`);
});
