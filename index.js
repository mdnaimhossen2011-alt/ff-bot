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

  bot.sendMessage(chatId, "🔍 তথ্য খোঁজা হচ্ছে, দয়া করে অপেক্ষা করুন...");

  try {
    const response = await axios.get(`https://nirob-x-info.vercel.app/info?uid=${uid}`);
    const data = response.data;

    if (!data || !data.basicInfo) {
      return bot.sendMessage(chatId, "❌ কোনো তথ্য পাওয়া যায়নি। সঠিক UID দিন।");
    }

    const basic = data.basicInfo;
    const clan = data.clanBasicInfo || {};
    const pet = data.petInfo || {};
    const social = data.socialInfo || {};

    const text = `
🎮 **Free Fire Player Information**

👤 **Basic Info:**
• **Name:** ${basic.nickname || 'N/A'}
• **UID:** ${basic.accountId || uid}
• **Level:** ${basic.level || 'N/A'}
• **Likes:** ${basic.liked || 0}
• **Region:** ${basic.region || 'N/A'}

🏆 **Rank Information:**
• **BR Points:** ${basic.rankingPoints || 'N/A'}
• **CS Points:** ${basic.csRankingPoints || 'N/A'}

🏠 **Guild Information:**
• **Name:** ${clan.clanName || 'None'}
• **ID:** ${clan.clanId || 'N/A'}
• **Level:** ${clan.clanLevel || 'N/A'}
• **Members:** ${clan.memberNum || 0}/${clan.capacity || 0}

🐾 **Pet Information:**
• **Name:** ${pet.name || 'None'}
• **Level:** ${pet.level || 'N/A'}

📊 **Other Stats:**
• **Badges:** ${basic.badgeCnt || 0}
• **Version:** ${basic.releaseVersion || 'N/A'}

🔰 **Social Info:**
• **Gender:** ${social.gender ? social.gender.replace('Gender_', '') : 'N/A'}
• **Language:** ${social.language ? social.language.replace('Language_', '') : 'N/A'}
• **Mode Prefer:** ${social.modePrefer ? social.modePrefer.replace('ModePrefer_', '') : 'N/A'}
`;

    bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });

  } catch (error) {
    console.error(error);
    bot.sendMessage(chatId, "❌ তথ্য নিয়ে আসার সময় একটি সমস্যা হয়েছে।");
  }
});
