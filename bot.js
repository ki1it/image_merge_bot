const { Telegraf } = require('telegraf');
const Sharp = require('sharp');
const needle = require('needle');
const sizeOf = require('image-size')

const stickers = [
    'https://s3.getstickerpack.com/storage/uploads/sticker-pack/baby-yoda/sticker_2.png',
    'https://s3.getstickerpack.com/storage/uploads/sticker-pack/baby-yoda/sticker_6.png',
    'https://s3.getstickerpack.com/storage/uploads/sticker-pack/meme-pack-1/sticker_19.png',
    'https://s3.getstickerpack.com/storage/uploads/sticker-pack/meme-pack-1/sticker_3.png'
]

const masks = [
    'https://thypix.com/wp-content/uploads/photo-frame-166-408x407.png'
]

async function handlePhoto(ctx, fileId) {
    try {
        const photoLink = await bot.telegram.getFileLink(fileId)
        let [photo] = await Promise.all([needle('get', photoLink.toString())])
        const photoSize = sizeOf(photo.body);

        let compositeLayer;
        if (photoSize.height === photoSize.width) {
            const maskNumber = Math.floor(Math.random() * masks.length);
            let mask = await needle('get', masks[maskNumber]);
            mask = await Sharp(mask.body).resize({
                width: photoSize.width
            }).toBuffer(),
                compositeLayer = {
                    input: mask,
                    gravity: 'center'
                }
        } else {
            const stickerNumber = Math.floor(Math.random() * stickers.length);
            let sticker = await needle('get', stickers[stickerNumber]);
            const scale = photoSize.height / photoSize.width > 1.5 ? 0.8 : 0.55
            sticker = await Sharp(sticker.body).resize({
                width: Math.floor(photoSize.width * scale)
            }).toBuffer();
            compositeLayer = {
                input: sticker,
                gravity: 'southeast'
            }
        }

        const res = await Sharp(photo.body)
            .composite([compositeLayer])
            .toBuffer();
        await ctx.replyWithPhoto({source: res});
    } catch (e) {
        await ctx.reply('Ой! Что-то пошло не так, давайте еще раз. Мне нужна ваша фотография 🦇');
    }
}

const token = process.env.BOT_TOKEN
if (token === undefined) {
    throw new Error('BOT_TOKEN must be provided!')
}

const bot = new Telegraf(token, {
    telegram: { webhookReply: false }
})

// Optional - set webhook url on start
bot.telegram.setWebhook(process.env.BOT_WEBHOOK_URL)

bot.start((ctx) => ctx.reply('Просто отправьте мне свое фото'))
bot.command('ping', (ctx) => {
    return ctx.replyWithMarkdown('*Pong!*');
})

bot.on('photo',async (ctx) => {
    const fileId = ctx.update.message.photo[ctx.update.message.photo.length - 1].file_id;
    await handlePhoto(ctx, fileId);
});



bot.on('document', async (ctx) => {
    const fileId = ctx.update.message.document.file_id;
    if (["image/png", "image/jpeg"].includes(ctx.update.message.document.mime_type)) {
        if(ctx.update.message.document.file_size < 5000000) {
            await handlePhoto(ctx, fileId);
        } else {
            await ctx.reply('Файл слишком большой, попробуй поменьше!');
        }
    } else {
        await ctx.reply('Не похоже на фотографию, отправь мне фото!');
    }

});

bot.on('message', (ctx) => ctx.reply('Ой! Что-то пошло не так, давайте еще раз. Мне нужна ваша фотография 🦇'))

module.exports = {
    bot
}