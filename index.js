const express = require('express');
const path = require('path');
const ytSearch = require('yt-search');
const QRCode = require('qrcode');
const axios = require('axios');
const ytdl = require('ytdl-core');
const app = express();
const port = process.env.PORT || 8080;

// ارائه فایل index.html به‌عنوان صفحه پیش‌فرض
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// FONT TEXT API STYLE
const fontStyles = {
    Bold: text => text.toUpperCase(),
    Italic: text => text.split('').map(c => c + '̶').join(''),
    Fancy: text => text.split('').map(c => '✦' + c + '✦').join('')
};

// FONT TEXT API
app.get('/api/maker/font-txt', async (req, res) => {
    const text = req.query.text;
    if (!text) {
        return res.status(400).json({
            status: false,
            creator: 'Nothing-Ben',
            result: 'No text provided'
        });
    }

    const convertedFonts = {};

    // اضافه کردن فونت‌های پیش‌فرض
    Object.keys(fontStyles).forEach(fontName => {
        convertedFonts[fontName] = fontStyles[fontName](text);
    });

    // اضافه کردن فونت‌های ASCII با استفاده از figlet
    try {
        const figlet = require('figlet');
        const fonts = await new Promise((resolve, reject) => {
            figlet.fonts((err, fontsList) => {
                if (err) reject(err);
                else resolve(fontsList);
            });
        });

        fonts.slice(0, 50).forEach(fontName => {
            try {
                convertedFonts[fontName] = figlet.textSync(text, { font: fontName });
            } catch (err) {
                console.log(`Error with font ${fontName}: ${err.message}`);
            }
        });
    } catch (err) {
        return res.status(500).json({
            status: false,
            creator: 'Nothing-Ben',
            result: 'Error loading fonts',
            error: err.message
        });
    }

    // ارسال نتیجه
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({
        status: true,
        creator: 'Nothing-Ben',
        result: convertedFonts
    }, null, 3)); // مرتب کردن JSON با فاصله 4
});

// SEARCH YOUTUBE API
app.get('/api/downloader/ytsearch', async (req, res) => {
    const query = req.query.text;
    if (!query) {
        return res.status(400).json({ status: false, message: 'No search query provided' });
    }

    try {
        const results = await ytSearch(query);
        const videos = results.videos
            .sort((a, b) => b.views - a.views)
            .slice(0, 3)
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

        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({
            status: true,
            creator: 'Nothing-Ben',
            result: videos
        }, null, 3)); // مرتب کردن JSON با فاصله 4
    } catch (err) {
        res.status(500).json({
            status: false,
            creator: 'Nothing-Ben',
            result: 'Error fetching YouTube search API',
            error: err.message
        });
    }
});

// YT to MP3 Downloader API
app.get('/api/downloader/ytmp3', async (req, res) => {
    const videoUrl = req.query.url;

    if (!videoUrl) {
        return res.status(400).json({
            status: false,
            creator: 'Nothing-Ben',
            result: 'No YouTube video URL provided'
        });
    }

    try {
        // بررسی اینکه آیا URL معتبر یوتیوب است یا نه
        if (!ytdl.validateURL(videoUrl)) {
            return res.status(400).json({
                status: false,
                creator: 'Nothing-Ben',
                result: 'Invalid YouTube URL'
            });
        }

        // استخراج اطلاعات ویدیو
        const info = await ytdl.getInfo(videoUrl);
        const audioFormat = ytdl.chooseFormat(info.formats, { quality: 'highestaudio' });

        // ساختار مشابه با خروجی ytsearch
        const video = {
            type: "audio",
            videoId: info.videoDetails.videoId,
            url: videoUrl,
            title: info.videoDetails.title,
            thumbnail: info.videoDetails.thumbnails[0].url,
            timestamp: info.videoDetails.lengthSeconds,
            views: info.videoDetails.viewCount,
            author: info.videoDetails.author.name,
            download_url: audioFormat.url  // لینک دانلود MP3
        };

        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({
            status: true,
            creator: 'Nothing-Ben',
            result: [video]  // ارسال یک آرایه که شامل یک ویدیو است
        }, null, 3)); // مرتب کردن JSON با فاصله 3

    } catch (err) {
        res.status(500).json({
            status: false,
            creator: 'Nothing-Ben',
            result: 'Error converting YouTube video to MP3',
            error: err.message
        });
    }
});
// QR CODE API
app.get('/api/maker/qrcode', async (req, res) => {
    const text = req.query.text;
    if (!text) {
        return res.status(400).json({ status: false, message: 'No text provided' });
    }

    try {
        const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(text)}`;
        const tinyUrlResponse = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(apiUrl)}`);

        if (tinyUrlResponse.data) {
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify({
                status: true,
                creator: 'Nothing-Ben',
                result: {
                    type: "qrcode",
                    download_url: tinyUrlResponse.data
                }
            }, null, 3)); // مرتب کردن JSON با فاصله 4
        } else {
            throw new Error('TinyURL API response error');
        }
    } catch (err) {
        res.status(500).json({
            status: false,
            creator: 'Nothing-Ben',
            result: 'Error generating QR code',
            error: err.message
        });
    }
});

// راه‌اندازی سرور
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
