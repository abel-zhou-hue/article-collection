// 飞书 API 密钥配置
const FEISHU_APP_ID = process.env.FEISHU_APP_ID || 'xxx';
const FEISHU_APP_SECRET = process.env.FEISHU_APP_SECRET || 'xxx';
const FEISHU_APP_TOKEN = 'Aw5FbsB2oaMNWqsIbXqcZBQ8nhe';
const FEISHU_TABLE_ID = 'tblKGEhDcZiUk6ju';

// 获取访问令牌
async function getAccessToken() {
    const response = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            app_id: FEISHU_APP_ID,
            app_secret: FEISHU_APP_SECRET,
        }),
    });

    const data = await response.json();
    if (data.code !== 0) {
        throw new Error('获取访问令牌失败: ' + data.msg);
    }

    return data.tenant_access_token;
}

// 获取字段映射
async function getFieldMapping(accessToken) {
    const response = await fetch(
        `https://open.feishu.cn/open-apis/bitable/v1/apps/${FEISHU_APP_TOKEN}/tables/${FEISHU_TABLE_ID}/fields`,
        {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        }
    );

    const data = await response.json();
    if (data.code !== 0) {
        throw new Error('获取字段失败: ' + data.msg);
    }

    const fieldMap = {};
    data.data.items.forEach(field => {
        fieldMap[field.field_name] = field.field_id;
    });

    return fieldMap;
}

// 获取所有记录
async function getAllRecords(accessToken, fieldMap) {
    let allRecords = [];
    let pageToken = '';

    do {
        let url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${FEISHU_APP_TOKEN}/tables/${FEISHU_TABLE_ID}/records?`;
        if (pageToken) {
            url += `page_token=${encodeURIComponent(pageToken)}`;
        }

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        const data = await response.json();
        if (data.code !== 0) {
            throw new Error('获取记录失败: ' + data.msg);
        }

        allRecords = allRecords.concat(data.data.items);
        pageToken = data.data.page_token;
    } while (pageToken);

    return allRecords;
}

// 转换记录格式
function transformRecord(record, fieldMap) {
    const fields = record.fields;

    return {
        title: fields[fieldMap['文章标题']] || '',
        url: fields[fieldMap['文章链接']]?.link || fields[fieldMap['文章链接']] || '',
        category: fields[fieldMap['分类']]?.[0] || '其他',
        summary: fields[fieldMap['文章摘要']] || '',
        source: fields[fieldMap['来源']] || '',
        time: fields[fieldMap['收藏时间']] || '',
    };
}

// API 端点处理
export async function onRequestGet(context) {
    try {
        // 获取访问令牌
        const accessToken = await getAccessToken();

        // 获取字段映射
        const fieldMap = await getFieldMapping(accessToken);

        // 获取所有记录
        const records = await getAllRecords(accessToken, fieldMap);

        // 转换记录格式
        const articles = records.map(record => transformRecord(record, fieldMap));

        // 返回响应
        return new Response(
            JSON.stringify({
                success: true,
                articles: articles,
                count: articles.length,
            }),
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
            }
        );
    } catch (error) {
        console.error('API 错误:', error);
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message,
                articles: [],
            }),
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
            }
        );
    }
}
