const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 静态文件服务
app.use('/js', express.static(path.join(__dirname, 'public', 'js')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// API 路由
app.get('/api/articles', async (req, res) => {
    try {
        // 暂时返回示例数据
        const articles = [
            {
                title: '示例文章标题',
                url: 'https://example.com/article',
                category: '科技',
                summary: '这是一个示例文章摘要...',
                source: '示例来源',
                time: '2024-03-07 00:00:00'
            }
        ];

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

// 默认路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404 处理
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
});
