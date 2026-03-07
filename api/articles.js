const https = require('https');

// 飞书配置
const FEISHU_CONFIG = {
    app_id: process.env.FEISHU_APP_ID,
    app_secret: process.env.FEISHU_APP_SECRET,
    app_token: 'Aw5FbsB2oaMNWqsIbXqcZBQ8nhe',
    table_id: 'tblKGEhDcZiUk6ju'
};

// 字段 ID 映射
const FIELD_IDS = {
    title: 'fldNeHmY2M',
    url: 'fldali4otI',
    category: 'fldxSjf6f0',
    summary: 'fldQqS0fWg',
    source: 'fld32nc9aG',
    time: 'fldvDnYQW7'
};

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

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

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
}
### 2. 删除 `server.js`（可选）
- 找到 `server.js` 文件
- 点击 `...` → Delete file
- 确认删除
### 3. 确认文件结构
你的 GitHub 仓库应该是这样：
article-collection/
├── package.json
├── public/
│   ├── index.html
│   └── js/
│       └── main.js
└── api/
└── articles.js
