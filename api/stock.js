export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    
    const { symbol } = req.query;
    if (!symbol) {
        return res.status(400).json({ error: '缺少股票代號' });
    }

    try {
        const targetUrl = `https://yahoo.com{symbol.toUpperCase()}?range=90d&interval=1d`;
        
        // 【修正】加入 User-Agent 偽裝瀏覽器請求，防止被 Yahoo Finance 封鎖
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        
        if (!response.ok) {
            return res.status(404).json({ error: '找不到該股票數據' });
        }

        const json = await response.json();
        
        // 確保 Yahoo 有回傳正確的資料結構
        if (!json.chart || !json.chart.result || json.chart.result === null) {
            return res.status(404).json({ error: 'Yahoo 查無此代號' });
        }

        return res.status(200).json(json);
    } catch (error) {
        // 返回具體的錯誤訊息，方便我們排查
        return res.status(500).json({ error: `後端連線失敗: ${error.message}` });
    }
}
