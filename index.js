const express = require('express');
const path = require('path');
const ytSearch = require('yt-search');
const QRCode = require('qrcode');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const fetch = require('node-fetch');
const { fromBuffer } = require('file-type');

const app = express();
const port = process.env.PORT || 8080;


// FONT TEXT API STYLE
const fontStyles = {
    Bold: text => text.toUpperCase(),
    Italic: text => text.split('').map(c => c + '̶').join(''),
    Fancy: text => text.split('').map(c => '✦' + c + '✦').join('')
};

// FONT TEXT API
app.get('/api/maker/font-txt', (req, res) => {
    const text = req.query.text;
    if (!text) {
        return res.status(400).json({
            status: false,
            creator: 'Nothing-Ben',
            result: 'No text provided'
        });
    }

    // تبدیل متن به فونت‌های مختلف
    const convertedFonts = {};
    Object.keys(fontStyles).forEach(fontName => {
        convertedFonts[fontName] = fontStyles[fontName](text);
    });

    // ساختن پاسخ JSON مرتب‌شده
    const jsonResponse = {
        status: true,
        creator: 'Nothing-Ben',
        result: convertedFonts
    };

    // ارسال پاسخ JSON مرتب‌شده
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(jsonResponse, null, 4)); // تنظیم فاصله 4 برای فرمت مرتب
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

        // ساختن پاسخ JSON
        const jsonResponse = {
            status: true,
            creator: 'Nothing-Ben',
            result: videos
        };

        // ارسال پاسخ JSON مرتب‌شده
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(jsonResponse, null, 4)); // تنظیم فاصله 4 برای فرمت مرتب
    } catch (err) {
        // ارسال خطا با فرمت مرتب
        const errorResponse = {
            status: false,
            creator: 'Nothing-Ben',
            result: 'Error fetching YouTube search api',
            error: err.message
        };
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(errorResponse, null, 4));
    }
});

// YT to MP3 Downloader API
app.get('/api/downloader/ytmp3', async (req, res) => {
    const videoUrl = req.query.url;

    if (!videoUrl) {
        return res.status(400).json({
            status: false,
            message: 'No YouTube video URL provided'
        });
    }

    try {
        // ارسال درخواست به YTMP3 API
        const apiResponse = await axios.get(`https://api.vevioz.com/api/button/mp3?url=${encodeURIComponent(videoUrl)}`);
        const downloadUrl = apiResponse.data?.button?.mp3;

        if (!downloadUrl) {
            throw new Error('Failed to fetch MP3 download URL');
        }

        // کوتاه کردن لینک با TinyURL
        const tinyUrlResponse = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(downloadUrl)}`);
        const tinyUrl = tinyUrlResponse.data;

        // بازگشت لینک کوتاه‌شده
        return res.json({
            status: true,
            creator: 'Nothing-Ben',
            result: {
                original_url: videoUrl,
                download_url: tinyUrl
            }
        });
    } catch (err) {
        return res.status(500).json({
            status: false,
            creator: 'Nothing-Ben',
            result: 'Error converting YouTube video to MP3',
            error: err.message
        });
    }
});

//QR CODE API
app.get('/api/maker/qrcode', async (req, res) => {
    const text = req.query.text;
    if (!text) {
        return res.status(400).json({ status: false, message: 'No text provided' });
    }

    try {
        // ساختن لینک برای API QR Code
        const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(text)}`;

        // ارسال درخواست به TinyURL برای کوتاه کردن لینک
        const tinyUrlResponse = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(apiUrl)}`);

        // اگر درخواست به TinyURL موفقیت‌آمیز بود
        if (tinyUrlResponse.data) {
            const tinyUrl = tinyUrlResponse.data; // لینک کوتاه شده

            // بازگرداندن لینک کوتاه شده در پاسخ با فرمت JSON مرتب
            const jsonResponse = {
                status: true,
                creator: 'Nothing-Ben',
                result: {
                    download_url: tinyUrl
                }
            };

            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(jsonResponse, null, 4)); // فرمت JSON مرتب با فاصله 4
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
