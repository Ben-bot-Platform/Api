const express = require('express');
const path = require('path');
const ytSearch = require('yt-search');

const app = express();
const port = process.env.PORT || 8080;

// تعریف فونت‌ها
const fontStyles = {
    Bold: text => text.toUpperCase(),
    Italic: text => text.split('').map(c => c + '̶').join(''),
    Fancy: text => text.split('').map(c => '✦' + c + '✦').join('')
};

// API: تبدیل متن به فونت
app.get('/api/maker/font-txt', (req, res) => {
    const text = req.query.text;
    if (!text) {
        return res.status(400).json({ status: false, message: 'No text provided' });
    }

    const convertedFonts = {};
    Object.keys(fontStyles).forEach(fontName => {
        convertedFonts[fontName] = fontStyles[fontName](text);
    });

    res.json({
        status: true,
        creator: 'nothing',
        data: convertedFonts
    });
});


app.get('/api/downloader/ytsearch', async (req, res) => {
    const query = req.query.text;
    if (!query) {
        return res.status(400).json({ status: false, message: 'No search query provided' });
    }

    try {
        const results = await ytSearch(query);
        const videos = results.videos
            .sort((a, b) => b.views - a.views) // مرتب‌سازی بر اساس تعداد بازدید (نزولی)
            .slice(0, 3) // گرفتن 3 نتیجه اول
            .map(video => ({
                type: "video",
                videoId: video.videoId,
                url: video.url,
                title: video.title,
                thumbnail: video.thumbnail,
                timestamp: video.duration.timestamp || "0:00",
                views: video.views,
                author: video.author.name
            }));

        res.json({
            status: true,
            creator: 'nothing',
            data: videos
        });
    } catch (err) {
        res.status(500).json({ status: false, message: 'Error fetching YouTube data', error: err.message });
    }
});
// ارائه فایل HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// راه‌اندازی سرور
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
