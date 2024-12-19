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
// YT to MP4 Downloader API
app.get('/api/downloader/ytmp4', async (req, res) => {
    const videoUrl = req.query.url;

    if (!videoUrl) {
        return res.status(400).json({
            status: false,
            creator: 'Nothing-Ben',
            result: 'No YouTube video URL provided'
        });
    }

    try {
        // ارسال درخواست به API
        const response = await axios.get(`https://api-pink-venom.vercel.app/api/ytdl?url=${encodeURIComponent(videoUrl)}`);
        const data = response.data.response;

        // بررسی داده‌های API
        if (!data || !data.mp4) {
            return res.status(500).json({
                status: false,
                creator: 'Nothing-Ben',
                result: 'Error fetching MP4 download URL'
            });
        }

        // کوتاه کردن لینک MP4
        const tinyMp4UrlResponse = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(data.mp4)}`);
        const mp4DownloadUrl = tinyMp4UrlResponse.data || data.mp4;

        // ساختار JSON خروجی
        const video = {
            type: "video",
            quality: "480p", // کیفیت پیش‌فرض
            title: data.title || 'No Title Available',
            description: data.description || 'No Description Available',
            duration: data.duration || 'Unknown',
            views: data.views || 'Unknown',
            channel: {
                name: data.name || 'Unknown',
                url: data.channel || 'No Channel URL Available'
            },
            url: videoUrl,
            thumbnail: data.thumbnail || 'No Thumbnail Available',
            download_url: mp4DownloadUrl // لینک کوتاه‌شده
        };

        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({
            status: true,
            creator: 'Nothing-Ben',
            result: [video]
        }, null, 3));

    } catch (err) {
        res.status(500).json({
            status: false,
            creator: 'Nothing-Ben',
            result: 'Error processing request',
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
        // ارسال درخواست به API
        const response = await axios.get(`https://api-pink-venom.vercel.app/api/ytdl?url=${encodeURIComponent(videoUrl)}`);
        const data = response.data.response;

        // بررسی داده‌های API
        if (!data || !data.mp3) {
            return res.status(500).json({
                status: false,
                creator: 'Nothing-Ben',
                result: 'Error fetching MP3 download URL'
            });
        }

        // استفاده از TinyURL برای کوتاه‌کردن لینک
        const tinyUrlResponse = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(data.mp3)}`);
        const tinyUrl = tinyUrlResponse.data;

        // ساختار JSON خروجی
        const video = {
            type: "audio",
            quality: "320kbps",
            title: data.title || 'No Title Available',
            duration: data.duration || 'Unknown',
            thumbnail: data.thumbnail || 'No Thumbnail Available',
            download_url: tinyUrl || data.mp3
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
            result: 'Error processing your request',
            error: err.message
        });
    }
});
// FBDL Video Downloader API
app.get('/api/downloader/fbdl', async (req, res) => {
    const videoUrl = req.query.url;

    if (!videoUrl) {
        return res.status(400).json({
            status: false,
            creator: 'Nothing-Ben',
            result: 'No Facebook video URL provided'
        });
    }

    try {
        // ارسال درخواست به API فیسبوک
        const response = await axios.get(`https://api-pink-venom.vercel.app/api/fbdl?url=${encodeURIComponent(videoUrl)}`);
        const data = response.data;

        if (!data.status || !data.links || data.links.length === 0) {
            return res.status(500).json({
                status: false,
                creator: 'Nothing-Ben',
                result: 'Error fetching Facebook video details'
            });
        }

        // کوتاه کردن لینک‌ها با TinyURL
        const tinyUrls = await Promise.all(data.links.map(async (link) => {
            const tinyUrlResponse = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(link.url)}`);
            return {
                quality: link.quality,
                download_url: tinyUrlResponse.data || link.url
            };
        }));

        // ساختار JSON خروجی
        const video = {
            title: data.title || 'No Title Available',
            download_url: tinyUrls
        };

        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({
            status: true,
            creator: 'Nothing-Ben',
            result: [video]
        }, null, 3));

    } catch (err) {
        res.status(500).json({
            status: false,
            creator: 'Nothing-Ben',
            result: 'Error processing request',
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
