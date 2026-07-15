const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// ---------- 中间件 ----------
app.use(cors());
app.use(express.json());

// ---------- 数据库连接 ----------
// Render 环境使用 DATABASE_URL，本地开发使用本地连接
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:091120@localhost:5432/time_capsule',
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
    // 增加连接池配置，提高稳定性
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

// 测试数据库连接
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
        thumbnail TEXT
    )
`).then(() => {
    console.log('✅ 数据库表已就绪');
}).catch(err => {
    console.error('❌ 创建表失败：', err.message);
});

// ---------- API 路由 ----------

// 获取所有日程
app.get('/api/data', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM schedules ORDER BY date ASC');
        res.json(result.rows);
    } catch (err) {
        console.error('GET /api/data 错误:', err.message);
        res.status(500).json({ error: '服务器错误: ' + err.message });
    }
});

// 新增日程
app.post('/api/data', async (req, res) => {
    const { date, person, tag, shortName, title, links, videoEmbed, thumbnail } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO schedules (date, person, tag, shortName, title, links, videoEmbed, thumbnail)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [date, person, tag || '', shortName || '', title, links || '[]', videoEmbed || '', thumbnail || '']
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
    const { date, person, tag, shortName, title, links, videoEmbed, thumbnail } = req.body;
    try {
        const result = await pool.query(
            `UPDATE schedules SET date=$1, person=$2, tag=$3, shortName=$4, title=$5, links=$6, videoEmbed=$7, thumbnail=$8
             WHERE id=$9 RETURNING *`,
            [date, person, tag || '', shortName || '', title, links || '[]', videoEmbed || '', thumbnail || '', id]
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