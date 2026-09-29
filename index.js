const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const http = require('http');

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// রিয়্যাকশন দেওয়ার জন্য ইমোজি লিস্ট
const UNIQUE_EMOJIS = [
    "👍", "👎", "❤️", "🔥", "🥰", "👏", "😁", "🤔", 
    "🤯", "😱", "😢", "🎉", "🤩", "🤮", "💩", "🙏", 
    "👌", "🕊", "🥱", "🥴", "😍", "🐳", "❤️‍🔥", "🌚", 
    "🌭", "💯", "🤣", "⚡", "🏆", "💔", "😤", "😐", 
    "🍓", "🍾", "💋", "😈", "😴", "😭", "🤓", "👻", 
    "💻", "👀", "🎃", "🙈", "😇", "😨", "🤝", "✍️", 
    "🫠", "🤌", "🎅", "🎄", "☃️", "🤪", "🗿", "🆒", 
    "💖", "😘", "💊", "😎", "👾", "🤷", "🤷‍♂️", "🤷‍♀️", 
    "😡"
];

// ১. অটো রিয়্যাকশন লজিক (সব মেসেজে রিয়্যাকশন দেবে)
bot.on('message', async (msg) => {
    try {
        const randomEmoji = UNIQUE_EMOJIS[Math.floor(Math.random() * UNIQUE_EMOJIS.length)];
        await bot.setMessageReaction(msg.chat.id, msg.message_id, {
            reaction: [{ type: 'emoji', emoji: randomEmoji }]
        });
    } catch (error) {
        console.error('Reaction Error:', error.message);
    }
});

// ২. /start কমান্ড
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(
        msg.chat.id,
        "🎮 **Free Fire Info Bot-এ স্বাগতম!**\n\nতথ্য জানতে কমান্ড লিখুন: `/info <UID>`\nউদাহরণ: `/info 884707253`",
        { parse_mode: 'Markdown' }
    );
});

// ৩. /info কমান্ড (UID Checker)
bot.onText(/\/info (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const uid = match[1].trim();

    const loadingMsg = await bot.sendMessage(chatId, "🔍 তথ্য খোঁজা হচ্ছে, দয়া করে অপেক্ষা করুন...");

    try {
        const response = await axios.get(`https://nirob-x-info.vercel.app/info?uid=${uid}`);
        const data = response.data;

        if (!data || !data.basicInfo) {
            await bot.deleteMessage(chatId, loadingMsg.message_id);
            return bot.sendMessage(chatId, "❌ কোনো তথ্য পাওয়া যায়নি! সঠিক UID দিন।");
        }

        const basic = data.basicInfo;
        const clan = data.clanBasicInfo || {};

        const text = `🎮 **Free Fire Player Information**\n\n` +
            `👤 **Basic Info:**\n` +
            `• **Name:** ${basic.nickname || 'N/A'}\n` +
            `• **UID:** ${basic.accountId || uid}\n` +
            `• **Level:** ${basic.level || 'N/A'}\n` +
            `• **Likes:** ${basic.liked || 0}\n` +
            `• **Region:** ${basic.region || 'N/A'}\n\n` +
            `🏰 **Guild Information:**\n` +
            `• **Name:** ${clan.clanName || 'None'}\n` +
            `• **ID:** ${clan.clanId || 'N/A'}\n` +
            `• **Level:** ${clan.clanLevel || 'N/A'}\n` +
            `• **Members:** ${clan.memberNum || 0}/${clan.capacity || 0}`;

        await bot.deleteMessage(chatId, loadingMsg.message_id);
        bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });

    } catch (error) {
        console.error(error);
        try {
            await bot.deleteMessage(chatId, loadingMsg.message_id);
        } catch (e) {}
        bot.sendMessage(chatId, "❌ তথ্য নিতে সমস্যা হয়েছে আবার চেষ্টা করুন।");
    }
});

// Render-এর জন্য Port তৈরি করা
const PORT = process.env.PORT || 3000;

http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot is alive!');
}).listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
