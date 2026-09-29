const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const http = require('http');

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// আপনার প্রধান গ্রুপের লিংক
const GROUP_LINK = "https://t.me/ffallbots";

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

// ১. ইনবক্সে শুধু /start কমান্ড এলে বার্তা পাঠাবে
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const chatType = msg.chat.type;

    if (chatType === 'private') {
        const textMessage = 
            "⚠️ **এই বটটি ইনবক্সে কাজ করবে না!**\n\n" +
            "বটটি ব্যবহার করার জন্য আমাদের অফিশিয়াল গ্রুপে যুক্ত হয়ে কমান্ড দিন।";

        const options = {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "📢 গ্রুপে যুক্ত হন", url: GROUP_LINK }
                    ]
                ]
            }
        };

        return bot.sendMessage(chatId, textMessage, options);
    }
});

// ২. /help কমান্ড (গ্রুপে সাহায্য পাওয়ার নির্দেশিকা)
bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    const chatType = msg.chat.type;

    // সাহায্য বার্তাটি শুধু গ্রুপেই দেখাবে
    if (chatType === 'group' || chatType === 'supergroup') {
        const helpMessage = 
            "📖 **বট ব্যবহার করার নির্দেশিকা:**\n\n" +
            " **Player Info দেখতে:**\n" +
            "   • লিখুন: `/info <UID>`\n" +
            "   • উদাহরণ: `/info 884707253`\n\n" +
            "💡 *মনে রাখবেন: বটটি শুধুমাত্র গ্রুপেই কাজ করে!*";

        const options = {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "📢 আমাদের গ্রুপ লিংক", url: GROUP_LINK }
                    ]
                ]
            }
        };

        bot.sendMessage(chatId, helpMessage, options);
    }
});

// ৩. অটো রিয়্যাকশন লজিক (শুধু গ্রুপে কাজ করবে)
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const chatType = msg.chat.type;

    if (chatType !== 'group' && chatType !== 'supergroup') {
        return;
    }

    // /help বা /info কমান্ড দিলে মেসেজে রিঅ্যাকশন দেবে না, সাধারণ মেসেজে দেবে
    if (msg.text && (msg.text.startsWith('/help') || msg.text.startsWith('/info'))) {
        return;
    }

    try {
        const randomEmoji = UNIQUE_EMOJIS[Math.floor(Math.random() * UNIQUE_EMOJIS.length)];
        
        await axios.post(`https://api.telegram.org/bot${token}/setMessageReaction`, {
            chat_id: chatId,
            message_id: msg.message_id,
            reaction: JSON.stringify([{ type: 'emoji', emoji: randomEmoji }])
        });
    } catch (error) {
        console.error('Reaction Error:', error.response ? error.response.data : error.message);
    }
});

// ৪. /info কমান্ড (ইউআইডি চেক করবে)
bot.onText(/\/info (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const chatType = msg.chat.type;

    if (chatType !== 'group' && chatType !== 'supergroup') {
        return;
    }

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

// Render-এর জন্য Port
const PORT = process.env.PORT || 3000;

http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot is alive!');
}).listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
