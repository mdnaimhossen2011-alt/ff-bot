const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const http = require('http');

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

const GROUP_LINK = "https://t.me/ffallbots";

const UNIQUE_EMOJIS = [
    "👍", "❤️", "🔥", "🥰", "👏", "😁", "🎉", "🤩", "🙏", "👌"
];

// ১. স্টার্ট কমান্ড (/start)
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const chatType = msg.chat.type;

    if (chatType === 'private') {
        const textMessage = "⚠️ **এই বটটি পার্সোনাল কাজ করে না!**\n\nবটটি ব্যবহার করার জন্য আমাদের অফিশিয়াল গ্রুপে যুক্ত হয়ে কমান্ড দিন।";
        const options = {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '📢 গ্রুপে যুক্ত হন', url: GROUP_LINK }]
                ]
            }
        };
        return bot.sendMessage(chatId, textMessage, options);
    }
});

// ২. হেল্প কমান্ড (/help)
bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    const chatType = msg.chat.type;

    if (chatType === 'group' || chatType === 'supergroup') {
        const helpMessage = "📖 **বট ব্যবহার করার নিয়মাবলী:**\n\n" +
            "📌 Player Info দেখতে:\n" +
            "• নিয়ম: `/info <UID>`\n" +
            "• উদাহরণ: `/info 1720799848`\n\n" +
            "💡 মনে রাখবেন: বটটি শুধুমাত্র গ্রুপেই কাজ করে!";
        bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
    }
});

// ৩. অটো রিঅ্যাকশন (Auto Reaction)
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const chatType = msg.chat.type;

    if (chatType !== 'group' && chatType !== 'supergroup') return;

    if (msg.text && (msg.text.startsWith('/help') || msg.text.startsWith('/info'))) return;

    try {
        const randomEmoji = UNIQUE_EMOJIS[Math.floor(Math.random() * UNIQUE_EMOJIS.length)];
        await axios.post(`https://api.telegram.org/bot${token}/setMessageReaction`, {
            chat_id: chatId,
            message_id: msg.message_id,
            reaction: JSON.stringify([{ type: 'emoji', emoji: randomEmoji }])
        });
    } catch (error) {
        console.error("Reaction Error:", error.response ? error.response.data : error.message);
    }
});

// ৪. /info কমান্ড (প্লেয়ার ইনফো ও আউটফিট সহ)
bot.onText(/\/info (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const chatType = msg.chat.type;

    if (chatType !== 'group' && chatType !== 'supergroup') return;

    const uid = match[1].trim();
    const loadingMsg = await bot.sendMessage(chatId, "🔍 তথ্য খোঁজা হচ্ছে, দয়া করে অপেক্ষা করুন...");

    try {
        const infoUrl = `https://ff.emonaxc.com/info/?ajax=info&uid=${uid}`;
        const outfitUrl = `https://ff.emonaxc.com/info/?ajax=outfit&uid=${uid}&details=true`;

        const [infoRes, outfitRes] = await Promise.all([
            axios.get(infoUrl),
            axios.get(outfitUrl)
        ]);

        const data = infoRes.data;
        const outfitData = outfitRes.data;

        if (!data || (!data.basicInfo && !data.nickname && !data.accountId)) {
            await bot.deleteMessage(chatId, loadingMsg.message_id);
            return bot.sendMessage(chatId, "❌ কোনো তথ্য পাওয়া যায়নি! সঠিক UID দিন।");
        }

        const basic = data.basicInfo || data; 
        const clan = data.clanBasicInfo || data.clan || {};
        const pet = data.petInfo || data.pet || {};
        const social = data.socialInfo || data.social || {};

        const responseText = 
`🎮 *Free Fire Player Information*

👤 *Basic Info:*
• Name: ${basic.nickname || 'N/A'}
• UID: ${basic.accountId || basic.uid || uid}
• Level: ${basic.level || 'N/A'}
• Likes: ${basic.liked || 'N/A'}
• Region: ${basic.region || 'N/A'}
• Account Type: ${basic.accountType || 'N/A'}
• Created: ${basic.createAt || 'N/A'}

🏆 *Rank Information:*
• BR Rank: ${basic.brRank || 'Unranked'} (${basic.brRankPoint || 0} pts)
• CS Rank: ${basic.csRank || 'Unranked'} (${basic.csRankPoint || 0}★)
• Max BR Rank: ${basic.maxBrRank || 'Unranked'}
• Max CS Rank: ${basic.maxCsRank || 'Unranked'}

🏠 *Guild Information:*
• Name: ${clan.clanName || 'None'}
• ID: ${clan.clanId || 'N/A'}
• Level: ${clan.clanLevel || 'N/A'}
• Members: ${clan.memberNum || 0}/${clan.capacity || 0}

🐾 *Pet Information:*
• Name: ${pet.name || 'No Pet'}
• Level: ${pet.level || 'N/A'}
• Skin: ${pet.skinId || 'N/A'}

📊 *Other Stats:*
• Badges: ${basic.badgeCnt || 0}
• EXP: ${basic.exp || 0}
• Honor Score: ${basic.honorScore || 100}
• Season ID: ${basic.seasonId || 'N/A'}
• Version: ${basic.version || 'N/A'}
• Last Login: ${basic.lastLoginAt || 'N/A'}

🔰 *Social Info:*
• Gender: ${social.gender || 'Unknown'}
• Language: ${social.language || 'EN'}
• Active Time: ${social.activeTime || 'Unknown'}
• Online Time: ${social.onlineTime || 'Unknown'}
• Mode Prefer: ${social.modePrefer || 'Unknown'}`;

        await bot.deleteMessage(chatId, loadingMsg.message_id);

        // ব্যানার বা আউটফিটের ছবি খোঁজা
        const bannerUrl = outfitData?.bannerUrl || outfitData?.outfitUrl || outfitData?.image || outfitData?.url;

        if (bannerUrl) {
            await bot.sendPhoto(chatId, bannerUrl, {
                caption: responseText,
                parse_mode: 'Markdown'
            });
        } else {
            await bot.sendMessage(chatId, responseText, { parse_mode: 'Markdown' });
        }

    } catch (error) {
        console.error("Info Fetch Error:", error.message);
        try {
            await bot.deleteMessage(chatId, loadingMsg.message_id);
        } catch (e) {}
        bot.sendMessage(chatId, "❌ তথ্য নিতে সমস্যা হয়েছে, আবার চেষ্টা করুন।");
    }
});

// Render সার্ভার চালু রাখার জন্য বেসিক পোর্ট সার্ভার
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot is running successfully');
}).listen(PORT);
