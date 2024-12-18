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
    .sort((a, b) => b.views - a.views) // مرتب کردن بر اساس بازدید (نزولی)
    .slice(0, 5) // گرفتن ۵ نتیجه اول
    .map(video => ({
        title: video.title,
        link: video.url,
        thumbnail: video.thumbnail,
        views: video.views,
        uploadedBy: video.author.name
        duration: video.timestamp,
        uploaded: video.ago,
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
