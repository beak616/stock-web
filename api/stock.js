export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    
    const { symbol } = req.query;
    if (!symbol) {
        return res.status(400).json({ error: '缺少股票代號' });
    }

    try {
        let cleanSymbol = symbol.trim().toLowerCase();
        
        // 轉換代碼符合 Stooq 規範 (台股 2330.tw，美股 nvda.us)
        if (/^\d+$/.test(cleanSymbol)) {
            cleanSymbol = cleanSymbol + '.tw';
        } else {
            if (!cleanSymbol.includes('.')) {
                cleanSymbol = cleanSymbol + '.us';
            }
        }

        const targetUrl = `https://stooq.com{cleanSymbol}&i=d`;
        
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            }
        });
        
        if (!response.ok) {
            return res.status(404).json({ error: 'Stooq 資料庫回應錯誤' });
        }

        const text = await response.text();
        const lines = text.split('\n');
        
        if (lines.length <= 1 || lines.includes("No data")) {
            return res.status(404).json({ error: '查無此股票代號' });
        }
        
        let closePrices = [];
        
        // 解析 Stooq 回傳的 CSV（欄位: Date,Open,High,Low,Close,Volume）
        // 資料是由舊到新排列（最下方是今天），跳過第 0 行標頭
        for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',');
            if (cols.length >= 5) {
                const closeVal = parseFloat(cols[4]); // 第 4 欄為收盤價
                if (!isNaN(closeVal)) {
                    closePrices.push(closeVal);
                }
            }
        }
        
        if (closePrices.length === 0) {
            return res.status(404).json({ error: '收盤價數據解析失敗' });
        }

        // 僅保留最新 90 天
        if (closePrices.length > 90) {
            closePrices = closePrices.slice(-90);
        }

        // 為了相容原本 index.html 的格式，我們把陣列包裝成原本的 chart 格式傳回
        return res.status(200).json({
            chart: {
                result: [{
                    indicators: {
                        quote: [{
                            close: closePrices
                        }]
                    }
                }]
            }
        });

    } catch (error) {
        return res.status(500).json({ error: `後端調度資料失敗: ${error.message}` });
    }
}
