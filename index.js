const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "👋 **Free Fire Info Bot-এ স্বাগতম!**\n\nযেকোনো প্লেয়ারের তথ্য জানতে টাইপ করুন:\n`/info <UID>`\n\nউদাহরণ: `/info 8847072531`",
    { parse_mode: 'Markdown' }
  );
});

bot.onText(/\/info (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const uid = match[1].trim();

  // ১. প্রথমে ওয়েটিং মেসেজটি পাঠানো হচ্ছে এবং মেসেজটির আইডি সেভ করা হচ্ছে
  const loadingMsg = await bot.sendMessage(chatId, "🔍 তথ্য খোঁজা হচ্ছে, দয়া করে অপেক্ষা করুন...");

  try {
    const response = await axios.get(`https://nirob-x-info.vercel.app/info?uid=${uid}`);
    const data = response.data;

    if (!data || !data.basicInfo) {
      // ওয়েটিং মেসেজটি ডিলিট করা
      bot.deleteMessage(chatId, loadingMsg.message_id);
      return bot.sendMessage(chatId, "❌ কোনো তথ্য পাওয়া যায়নি। সঠিক UID দিন।");
    }

    const basic = data.basicInfo;
    const clan = data.clanBasicInfo || {};

    // ২. শুধুমাত্র আপনার প্রয়োজনীয় তথ্যগুলো কাস্টমাইজ করে সাজানো হয়েছে
    const text = `🎮 **Free Fire Player Information**

👤 **Basic Info:**
• **Name:** ${basic.nickname || 'N/A'}
• **UID:** ${basic.accountId || uid}
• **Level:** ${basic.level || 'N/A'}
• **Likes:** ${basic.liked || 0}
• **Region:** ${basic.region || 'N/A'}

🏠 **Guild Information:**
• **Name:** ${clan.clanName || 'None'}
• **ID:** ${clan.clanId || 'N/A'}
• **Level:** ${clan.clanLevel || 'N/A'}
• **Members:** ${clan.memberNum || 0}/${clan.capacity || 0}`;

    // ৩. ওয়েটিং মেসেজটি মুছে ফেলা
    await bot.deleteMessage(chatId, loadingMsg.message_id);

    // ৪. মূল মেসেজ পাঠাল
    bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });

  } catch (error) {
    console.error(error);
    await bot.deleteMessage(chatId, loadingMsg.message_id);
    bot.sendMessage(chatId, "❌ তথ্য নিয়ে আসার সময় একটি সমস্যা হয়েছে।");
  }
});
