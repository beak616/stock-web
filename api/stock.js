export default async function handler(req, res) {
    // 允許跨域請求
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    
    const { symbol } = req.query;
    if (!symbol) {
        return res.status(400).json({ error: '缺少股票代號' });
    }

    try {
        // 由 Vercel 後端節點發出請求，這絕對不會觸發瀏覽器的 CORS 阻擋
        const targetUrl = `https://yahoo.com{symbol.toUpperCase()}?range=90d&interval=1d`;
        const response = await fetch(targetUrl);
        
        if (!response.ok) {
            return res.status(404).json({ error: '找不到該股票數據' });
        }

        const json = await response.json();
        return res.status(200).json(json);
    } catch (error) {
        return res.status(500).json({ error: '伺服器內部錯誤' });
    }
}
