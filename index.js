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

// ৩. অটো রিঅ্যাকশন
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

// ৪. /info কমান্ড
bot.onText(/\/info (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const chatType = msg.chat.type;

    if (chatType !== 'group' && chatType !== 'supergroup') return;

    const uid = match[1].trim();
    const loadingMsg = await bot.sendMessage(chatId, "🔍 তথ্য খোঁজা হচ্ছে, দয়া করে অপেক্ষা করুন...");

    try {
        const infoUrl = `https://ff.emonaxc.com/info/?ajax=info&uid=${uid}`;
        const outfitUrl = `https://ff.emonaxc.com/info/?ajax=outfit&details=true&speed=fast&uid=${uid}`;

        const axiosConfig = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
            },
            timeout: 10000
        };

        const [infoRes, outfitRes] = await Promise.all([
            axios.get(infoUrl, axiosConfig).catch(e => ({ data: null })),
            axios.get(outfitUrl, axiosConfig).catch(e => ({ data: null }))
        ]);

        const data = infoRes.data;
        const outfitData = outfitRes.data;

        if (!data) {
            await bot.deleteMessage(chatId, loadingMsg.message_id);
            return bot.sendMessage(chatId, "❌ কোনো তথ্য পাওয়া যায়নি! সঠিক UID দিন।");
        }

        const basic = data.basicInfo || data.BasicInfo || data; 
        const clan = data.clanBasicInfo || data.ClanInfo || data.clan || {};
        const pet = data.petInfo || data.PetInfo || data.pet || {};
        const social = data.socialInfo || data.SocialInfo || data.social || {};

        const responseText = 
`🎮 *Free Fire Player Information*

👤 *Basic Info:*
• Name: ${basic.nickname || basic.Name || 'N/A'}
• UID: ${basic.accountId || basic.UID || uid}
• Level: ${basic.level || basic.Level || 'N/A'}
• Likes: ${basic.liked || basic.Likes || 0}
• Region: ${basic.region || basic.Region || 'BD'}
• Account Type: ${basic.accountType || basic.AccountType || 'Guest'}
• Created: ${basic.createAt || basic.Created || 'N/A'}

🏆 *Rank Information:*
• BR Rank: ${basic.brRank || 'Unranked'} (${basic.brRankPoint || 0} pts)
• CS Rank: ${basic.csRank || 'Unranked'} (${basic.csRankPoint || 0}★)
• Max BR Rank: ${basic.maxBrRank || 'Unranked'}
• Max CS Rank: ${basic.maxCsRank || 'Unranked'}

🏠 *Guild Information:*
• Name: ${clan.clanName || clan.Name || 'None'}
• ID: ${clan.clanId || clan.ID || 'N/A'}
• Level: ${clan.clanLevel || clan.Level || 'N/A'}
• Members: ${clan.memberNum || clan.Members || 0}/${clan.capacity || 50}

🐾 *Pet Information:*
• Name: ${pet.name || pet.Name || 'No Pet'}
• Level: ${pet.level || pet.Level || 'N/A'}
• Skin: ${pet.skinId || pet.Skin || 'N/A'}

📊 *Other Stats:*
• Badges: ${basic.badgeCnt || basic.Badges || 0}
• EXP: ${basic.exp || basic.EXP || 0}
• Honor Score: ${basic.honorScore || 100}
• Season ID: ${basic.seasonId || 'N/A'}
• Version: ${basic.version || 'OB55'}
• Last Login: ${basic.lastLoginAt || 'N/A'}

🔰 *Social Info:*
• Gender: ${social.gender || social.Gender || 'MALE'}
• Language: ${social.language || 'EN'}
• Active Time: ${social.activeTime || 'Unknown'}
• Online Time: ${social.onlineTime || 'Unknown'}
• Mode Prefer: ${social.modePrefer || 'CS'}`;

        await bot.deleteMessage(chatId, loadingMsg.message_id);

        // ব্যানার বা ইমেজ লিংক ইউআরএল থেকে সংগ্রহ করা
        const bannerUrl = outfitData?.image || outfitData?.outfitUrl || outfitData?.bannerUrl || outfitData?.url || outfitData?.outfit;

        if (bannerUrl && typeof bannerUrl === 'string' && bannerUrl.startsWith('http')) {
            await bot.sendPhoto(chatId, bannerUrl, {
                caption: responseText,
                parse_mode: 'Markdown'
            });
        } else {
            await bot.sendMessage(chatId, responseText, { parse_mode: 'Markdown' });
        }

    } catch (error) {
        console.error("Info Error Details:", error);
        try {
            await bot.deleteMessage(chatId, loadingMsg.message_id);
        } catch (e) {}
        bot.sendMessage(chatId, "❌ তথ্য নিতে সমস্যা হয়েছে, আবার চেষ্টা করুন।");
    }
});

// Render Keep-Alive Port
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot is running');
}).listen(PORT);
