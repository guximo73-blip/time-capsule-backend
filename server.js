const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// ---------- 中间件 ----------
app.use(cors());
app.use(express.json());

// ---------- 数据库连接 ----------
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:091120@localhost:5432/time_capsule',
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ 数据库连接失败:', err.message);
        return;
    }
    console.log('✅ 数据库连接成功');
    release();
});

// ---------- 初始化表结构 ----------
pool.query(`
    CREATE TABLE IF NOT EXISTS schedules (
        id SERIAL PRIMARY KEY,
        date TEXT NOT NULL,
        person TEXT NOT NULL,
        tag TEXT,
        shortName TEXT,
        title TEXT NOT NULL,
        links TEXT,
        videoEmbed TEXT,
        thumbnail TEXT,
        tags TEXT[] DEFAULT '{}'
    )
`).then(() => {
    console.log('✅ 数据库表已就绪');
}).catch(err => {
    console.error('❌ 创建表失败：', err.message);
});

// ============================================================
// 🖼️ 图片代理接口（解决 Instagram / Twitter 等防盗链）
// ============================================================
app.get('/api/image-proxy', async (req, res) => {
    const imageUrl = req.query.url;
    if (!imageUrl) {
        return res.status(400).json({ error: 'Missing url parameter' });
    }

    // 安全限制：只允许代理图片链接，防止被滥用
    const allowedDomains = [
        'instagram.com', 'cdninstagram.com', 'fbcdn.net',
        'twitter.com', 'twimg.com', 'x.com',
        'sinaimg.cn', 'pic.sinaimg.cn',
        'doubanio.com', 'douban.com'
    ];
    const isAllowed = allowedDomains.some(domain => imageUrl.includes(domain));
    if (!isAllowed) {
        return res.status(403).json({ error: 'Domain not allowed' });
    }

    try {
        const response = await fetch(imageUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
                'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
                'Referer': 'https://www.instagram.com/',
                'Sec-Fetch-Dest': 'image',
                'Sec-Fetch-Mode': 'no-cors',
                'Sec-Fetch-Site': 'cross-site'
            }
        });

        if (!response.ok) {
            console.error(`图片代理失败 [${response.status}]: ${imageUrl}`);
            return res.status(response.status).json({ error: `Failed to fetch image: ${response.status}` });
        }

        const imageBuffer = await response.arrayBuffer();
        const contentType = response.headers.get('content-type') || 'image/jpeg';
        
        res.set('Content-Type', contentType);
        res.set('Cache-Control', 'public, max-age=86400'); // 缓存1天
        res.set('Access-Control-Allow-Origin', '*');
        res.send(Buffer.from(imageBuffer));
    } catch (error) {
        console.error('图片代理错误:', error.message);
        res.status(500).json({ error: 'Failed to load image' });
    }
});

// ---------- API 路由 ----------

// 获取所有日程
app.get('/api/data', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM schedules ORDER BY date ASC');
        const rows = result.rows.map(row => ({
            ...row,
            tags: row.tags || []
        }));
        res.json(rows);
    } catch (err) {
        console.error('GET /api/data 错误:', err.message);
        res.status(500).json({ error: '服务器错误: ' + err.message });
    }
});

// 新增日程
app.post('/api/data', async (req, res) => {
    const { date, person, tag, shortName, title, links, videoEmbed, thumbnail, tags } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO schedules (date, person, tag, shortName, title, links, videoEmbed, thumbnail, tags)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [
                date,
                person,
                tag || '',
                shortName || '',
                title,
                links || '[]',
                videoEmbed || '',
                thumbnail || '',
                tags || []
            ]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('POST /api/data 错误:', err.message);
        res.status(500).json({ error: '添加失败: ' + err.message });
    }
});

// 修改日程
app.put('/api/data/:id', async (req, res) => {
    const id = req.params.id;
    const { date, person, tag, shortName, title, links, videoEmbed, thumbnail, tags } = req.body;
    try {
        const result = await pool.query(
            `UPDATE schedules 
             SET date=$1, person=$2, tag=$3, shortName=$4, title=$5, links=$6, videoEmbed=$7, thumbnail=$8, tags=$9
             WHERE id=$10 RETURNING *`,
            [
                date,
                person,
                tag || '',
                shortName || '',
                title,
                links || '[]',
                videoEmbed || '',
                thumbnail || '',
                tags || [],
                id
            ]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: '日程不存在' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('PUT /api/data 错误:', err.message);
        res.status(500).json({ error: '更新失败: ' + err.message });
    }
});

// 删除日程
app.delete('/api/data/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const result = await pool.query('DELETE FROM schedules WHERE id=$1 RETURNING id', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: '日程不存在' });
        }
        res.status(204).send();
    } catch (err) {
        console.error('DELETE /api/data 错误:', err.message);
        res.status(500).json({ error: '删除失败: ' + err.message });
    }
});

// ---------- 启动服务器 ----------
app.listen(PORT, () => {
    console.log(`🚀 后端服务运行在 http://localhost:${PORT}`);
});
