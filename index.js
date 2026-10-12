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

// ৪. /info কমান্ড (কাস্টম টেমপ্লেট)
bot.onText(/\/info (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const chatType = msg.chat.type;

    if (chatType !== 'group' && chatType !== 'supergroup') return;

    const uid = match[1].trim();
    const loadingMsg = await bot.sendMessage(chatId, "🔍 তথ্য খোঁজা হচ্ছে, দয়া করে অপেক্ষা করুন...");

    try {
        const infoUrl = `https://ff.emonaxc.com/info/?ajax=info&uid=${uid}`;
        const outfitUrl = `https://ff.emonaxc.com/info/?ajax=outfit&uid=${uid}&details=true`;

        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
        };

        let data = null;
        let outfitData = null;

        try {
            const infoRes = await axios.get(infoUrl, { headers, timeout: 8000 });
            data = infoRes.data;
        } catch (e) {
            console.error("Info API Error:", e.message);
        }

        try {
            const outfitRes = await axios.get(outfitUrl, { headers, timeout: 8000 });
            outfitData = outfitRes.data;
        } catch (e) {
            console.error("Outfit API Error:", e.message);
        }

        if (!data) {
            await bot.deleteMessage(chatId, loadingMsg.message_id);
            return bot.sendMessage(chatId, "❌ কোনো তথ্য পাওয়া যায়নি! সঠিক UID দিন।");
        }

        // ঢাকা টাইমজোনে ডেট ফরম্যাট করার ফাংশন
        function formatDhakaDate(timestamp) {
            if (!timestamp || isNaN(timestamp)) return 'N/A';
            const date = new Date(timestamp > 10000000000 ? timestamp : timestamp * 1000);
            return date.toLocaleString('en-US', { 
                timeZone: 'Asia/Dhaka',
                day: '2-digit', 
                month: 'short', 
                year: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
            });
        }

        // অ্যাকাউন্টের বয়স (Years, Months, Days) হিসেব করার ফাংশন
        function calculateAccountAge(timestamp) {
            if (!timestamp || isNaN(timestamp)) return { years: 0, months: 0, days: 0 };
            const createDate = new Date(timestamp > 10000000000 ? timestamp : timestamp * 1000);
            const now = new Date();

            let years = now.getFullYear() - createDate.getFullYear();
            let months = now.getMonth() - createDate.getMonth();
            let days = now.getDate() - createDate.getDate();

            if (days < 0) {
                months--;
                const lastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
                days += lastMonth.getDate();
            }
            if (months < 0) {
                years--;
                months += 12;
            }

            return { years, months, days };
        }

        const basic = data.basicInfo || data.accountInfo || data.data || data;
        const clan = data.clanBasicInfo || data.guildInfo || data.clan || {};
        const social = data.socialInfo || data.social || {};

        const cleanGender = (social.gender || basic.gender || 'MALE').replace('Gender_', '');
        const cleanLang = (social.language || basic.language || 'EN').replace('Language_', '');
        const cleanMode = (social.modePrefer || '').replace('ModePrefer_', '') || 'CS';

        const createTimestamp = basic.createAt || basic.createdAt;
        const age = calculateAccountAge(createTimestamp);

        // আপনার দেওয়া সুনির্দিষ্ট ফরম্যাট
        const responseText = 
`╔═══『 🎮 PLAYER INFO 』═══╗

👤 BASIC INFO
➤ Name: ${basic.nickname || basic.name || 'N/A'}
➤ UID: ${basic.accountId || basic.uid || uid}
➤ Level: ${basic.level || 'N/A'}
➤ Likes: ${basic.liked || basic.likes || 0}
➤ Region: ${basic.region || 'BD'}
➤ Account Type: ${basic.accountType || 'Guest'}
➤ Created: ${formatDhakaDate(createTimestamp)}

╠═══『 📝 BIO & SIGNATURE 』═══╣
💬 Bio: ${social.signature || basic.signature || social.bio || 'None'}

╠═══『 📅 ACCOUNT DETAILS 』═══╣
🗓️ Account Created (Dhaka Time): ${formatDhakaDate(createTimestamp)}

⏳ Account Age:
➤ Years: ${age.years}
➤ Months: ${age.months}
➤ Days: ${age.days}

╠═══『 🏆 GUILD INFORMATION 』═══╣
🛡️ Name: ${clan.clanName || clan.name || 'None'}
➤ ID: ${clan.clanId || clan.id || 'N/A'}
➤ Level: ${clan.clanLevel || clan.level || 'N/A'}
➤ Members: ${clan.memberNum || clan.members || 0}/${clan.capacity || 50}

╠═══『 🌐 SOCIAL INFO 』═══╣
🚻 Gender: ${cleanGender}
🗣️ Language: ${cleanLang}
🕒 Active Time: ${social.activeTime || 'Unknown'}
⏰ Online Time: ${social.onlineTime || 'Unknown'}
🎯 Mode Prefer: ${cleanMode}

╚══════『 👑 FF 』══════╝`;

        await bot.deleteMessage(chatId, loadingMsg.message_id);

        let imageUrl = null;
        if (outfitData) {
            imageUrl = outfitData.outfitUrl || outfitData.bannerUrl || outfitData.image || outfitData.url;
        }

        if (imageUrl && typeof imageUrl === 'string' && imageUrl.startsWith('http')) {
            await bot.sendPhoto(chatId, imageUrl, {
                caption: responseText
            });
        } else {
            await bot.sendMessage(chatId, responseText);
        }

    } catch (error) {
        console.error("Main Error:", error);
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
