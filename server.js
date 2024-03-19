
// ENVIRONMENT VARIABLES
require('dotenv').config({ path: `${__dirname}/.env` });
const discordBotToken = process.env['DISCORD_BOT_TOKEN'];
const discordGuildId = process.env['DISCORD_GUILD_ID'];
const discordChannelId = process.env['DISCORD_CHANNEL_ID'];
const discordWebhookURL = process.env['DISCORD_WEBHOOK_URL'];

const telegramBotToken = process.env['TELEGRAM_BOT_TOKEN'];
const telegramChatId = process.env['TELEGRAM_CHAT_ID'];
const telegramChatURL = process.env['TELEGRAM_CHAT_URL'];

// Essential libraries
const path = require('path');
const https = require('https'); // or 'https' for https:// URLs
const fs = require('fs');
const fsp = require('fs').promises;

// DISCORD CLIENT
const { Client, GatewayIntentBits, WebhookClient, EmbedBuilder } = require('discord.js');
const discordClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildWebhooks
  ],
});

const discordWebhookClient = new WebhookClient({ "url": discordWebhookURL });

discordClient.once("ready", () => { console.log(`Discord bot ready! Logged in as ${discordClient.user.tag}`); });
discordClient.login(discordBotToken);











/**
 * 
 * $$$$$$$\   $$$$$$\              $$\          $$$$$$$$\  $$$$$$\  
 * $$  __$$\ $$  __$$\             \$$\         \__$$  __|$$  __$$\ 
 * $$ |  $$ |$$ /  \__|             \$$\           $$ |   $$ /  \__|
 * $$ |  $$ |$$ |            $$$$$$\ \$$\          $$ |   $$ |$$$$\ 
 * $$ |  $$ |$$ |            \______|$$  |         $$ |   $$ |\_$$ |
 * $$ |  $$ |$$ |  $$\              $$  /          $$ |   $$ |  $$ |
 * $$$$$$$  |\$$$$$$  |            $$  /           $$ |   \$$$$$$  |
 * \_______/  \______/             \__/            \__|    \______/ 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * Intercept messages created in Discord
 * 
 * Types of messages entered in Discord:
 * 
 * - Text/emoji only
 * - Text with file/s
 * - Single URL (Twitter share, Tenor Gif)
 * - 
 *   
 */
discordClient.on("messageCreate", async (message) => {

  try {
    

  // Process messages that are not bot/webhook generated i.e. human messages
  if (message.channel.id == discordChannelId && message.author.bot === false) {

    console.log("[DC] ", message.content);

    // Replace twitter links with fxtwitter
    var discordMessageText = message.content
      .replace("https://twitter", "https://fxtwitter").trim()
      .replace("https://x.com", "https://fixupx.com").trim();

    // Replace <@> tags with corresponding roles or names
    if (message.mentions) {
      message.mentions.roles.forEach(role => {
        discordMessageText = discordMessageText
          .replace(`<@&${role.id}>`, `<b><i>@${role.name}</i></b>`);
      });
      message.mentions.users.forEach(user => {
        discordMessageText = discordMessageText
          .replace(`<@${user.id}>`, `<b><i>@${user.displayName}</i></b>`);
      });
    }

    if (discordMessageText.length > 0) {

      var originMessageText = ``
      /****************************************************************
         * Message Reply
         * 
         * Format the quote for later
         ****************************************************************/
      originMessageText = '';
      var originMessageId = 0;

      if (message.reference) {


        // Get the text content of the discord origin
        const originMessage = await message.channel.messages.fetch(message.reference.messageId);
        originMessageText = originMessage.content;

        // Get msg id if exists
        if (originMessageText.includes('](https://msg.id')) {
          originMessageId = getMsgIdFromLink(originMessageText);
          originMessageText = originMessageText.split(')')[1].trim()
        }

        
        if (originMessageId == 0) {
          originMessageText = ``
          + `<blockquote><b>${originMessage.author.username}</b>\n`
          + `${originMessageText}</blockquote>\n`;
        } else {
          originMessageText = ``;
        }
      }

      // Send the discord reply to Telegram
      telegramBot.telegram.sendMessage(
        telegramChatId,

        ``
        + originMessageText
        + `<b>${message.author.username}<a href='https://msg.id/${message.id}/'>:</a></b> `
        + `${discordMessageText} `,

        {
          parse_mode: 'HTML',
          reply_to_message_id: originMessageId,
        }
      );

    } else {
      console.log('Discord message text empty. Is this an upload?');
    }
  }

} catch (error) {
    console.log("[ERROR]", error.message);
}
});










/**
 * $$$$$$$$\  $$$$$$\              $$\          $$$$$$$\   $$$$$$\  
 * \__$$  __|$$  __$$\             \$$\         $$  __$$\ $$  __$$\ 
 *    $$ |   $$ /  \__|             \$$\        $$ |  $$ |$$ /  \__|
 *    $$ |   $$ |$$$$\       $$$$$$\ \$$\       $$ |  $$ |$$ |      
 *    $$ |   $$ |\_$$ |      \______|$$  |      $$ |  $$ |$$ |      
 *    $$ |   $$ |  $$ |             $$  /       $$ |  $$ |$$ |  $$\ 
 *    $$ |   \$$$$$$  |            $$  /        $$$$$$$  |\$$$$$$  |
 *    \__|    \______/             \__/         \_______/  \______/ 
 *
 * 
 * 
 * 
 * TELEGRAM TO DISCORD
 */

// var photoUrl = "";
const { Telegraf } = require("telegraf");
const telegramBot = new Telegraf(telegramBotToken);
telegramBot.start((ctx) => ctx.reply('Welcome!'));
console.log("Telegram bot ready!");

telegramBot.on("message", function (message) {

  const updateMsg = message.update.message;

  // Message from a user
  if (updateMsg.chat.id == telegramChatId && updateMsg.from.is_bot === false) {

    // Get sender's pfp
    const getProfilePic = new Promise(function (resolve, reject) {
      var profilePhotos = telegramBot.telegram.getUserProfilePhotos(updateMsg.from.id);
      profilePhotos.then(function (data) {

        // If user has a profile photo, store it for discord pfp
        if (data.total_count > 0) {
          var file = telegramBot.telegram.getFileLink(data.photos[0][0].file_id);
          file.then(function (result) {
            resolve(result);
          });
        }

        // else default telegram pfp
        else {
          resolve("https://telegram.org/img/t_logo.png");
        }
      });
    });

    // Handle various message types
    getProfilePic.then(function (profileUrl) {

      var originMessageText = ``;
      var msgID = '';

      /***********************************************************************
       * Message Reply
       * 
       * Quote the reply before responding
       ***********************************************************************/

      // Handle "reply-type messages" by displaying a quote on user message
      if (updateMsg.reply_to_message) {

        senderName = updateMsg.reply_to_message.from.first_name;
        originMessageText = updateMsg.reply_to_message.text;

        // Try to get discord msg ID if existing
        if (updateMsg.reply_to_message.link_preview_options) {
          msgID = getMsgIdFromLink(updateMsg.reply_to_message.link_preview_options.url);
        }

        // Handle Telegram replies on non-text i.e. Tenor GIFs
        if (!originMessageText) {

          // Make reply reference empty not null
          if (updateMsg.reply_to_message.caption) {

            originMessageText = `[with media] ${updateMsg.reply_to_message.caption}`;

          } else {

            originMessageText = `[media]`;

          }

          // Handle replies on long text
        } else if (originMessageText.length > 80) {

          // Truncate long text to make 80 characters (including ellipses)
          originMessageText = `${updateMsg.reply_to_message.text.substring(0, 77)}...`;

          // Handle replies on normal text
        } else {

          // Quote the full text
          originMessageText = `${updateMsg.reply_to_message.text}`;

        }

        // Erase bot name in quoted messages
        if (senderName === telegramBot.botInfo.first_name) {
          senderName = ``;
        } else {
          senderName = `${senderName}: `;
        }

        const quotedText = new EmbedBuilder()
          .setAuthor({
            name: `${senderName}${originMessageText}`,
            url: `https://discord.com/channels/${discordGuildId}/${discordChannelId}/${msgID}`
          });

        discordWebhookClient.send({
          username: `${updateMsg.from.first_name}`,
          avatarURL: profileUrl.toString(),
          embeds: [quotedText]
        });

      }

      // If message is a POLL, format a poll announcement
      if (updateMsg.poll) {

        /************************************************************************
         * POLLS
         * 
         * announce then show them the link to TG
         * Construct an announcement
         * TODO: make it a formatted embed
         ***********************************************************************/
        announcementString = ``
          + `\u{FEFF}\n`
          + `A poll has been started in Telegram:\n`;

        optionList = ``;
        updateMsg.poll.options.forEach(option => {
          optionList += `\u{25EF}\u{2007}${option.text}\n`;
        });

        const embed = new EmbedBuilder()
          .setColor(0x0ea8fc)
          .setTitle(`Telegram Poll`)
          .setURL(telegramChatURL)
          .setDescription(``
            + `**${updateMsg.poll.question}**\n\ \ \n`
            + optionList
            + `\n[Vote in Telegram now!](${telegramChatURL})`
          )
          .setThumbnail('https://telegram.org/img/t_logo.png');

        discordWebhookClient.send({ content: announcementString, embeds: [embed] });

      } else if (updateMsg.document || updateMsg.sticker || updateMsg.photo) {

        if (updateMsg.document) {

          /***********************************************************************
           * FILE/DOCUMENT/MEDIA/TENOR GIFS
           * 
           * give URL
           * need to send the url, so hide it with markdown "[]()" tags
          ***********************************************************************/

          telegramBot.telegram
            .getFileLink(updateMsg.document.file_id)
            .then(function (documentURL) {

              console.log("[TG] [TENOR/FILE/DOC]", documentURL.toString());

              // Save the file
              const localFileName = `./temp/${updateMsg.document.file_unique_id}${path.extname(documentURL.toString())}`;
              console.log(`    [FILE] localfile: ${localFileName}`);
              const file = fs.createWriteStream(localFileName);
              // Download the file
              const request = https.get(documentURL.toString(), function (response) {
                response.pipe(file);
                // after download completed close filestream
                file.on("finish", () => {
                  file.close();
                  console.log(`    [FILE] Download Completed: ${localFileName}`);

                  discordWebhookClient.send({
                    content: `${updateMsg.caption ? updateMsg.caption : ""}`,
                    username: `${updateMsg.from.first_name}`,
                    avatarURL: profileUrl.toString(),
                    files: [localFileName]
                  }).then(function () {

                    deleteFile(localFileName);

                  });

                });

              });

            });
        }

        if (updateMsg.sticker) {

          /********************************************************************
           * STICKERS
           * 
           * .webp support only. animated stickers not implemented
           * download file, send to discord then delete the file
           * result: clean image displays. no url display
           ********************************************************************/

          telegramBot.telegram
            .getFileLink(updateMsg.sticker.file_id)
            .then(function (photoUrl) {

              // webp support. TODO: tgs support
              if (photoUrl.toString().endsWith("webp")) {

                console.log("[TG] [STICKER]", photoUrl.toString());

                const localFileName = `./temp/${updateMsg.sticker.thumbnail.file_unique_id}${path.extname(photoUrl.toString())}`;

                const file = fs.createWriteStream(localFileName);
                // Download the file
                const request = https.get(photoUrl.toString(), function (response) {
                  response.pipe(file);
                  // after download completed close filestream
                  file.on("finish", () => {
                    file.close();
                    console.log(`     [FILE] Download Completed: ${localFileName}`);

                    discordWebhookClient.send({
                      // content: `${updateMsg.caption ? updateMsg.caption : ""}`,
                      username: `${updateMsg.from.first_name}`,
                      avatarURL: profileUrl.toString(),
                      files: [localFileName]
                    }).then(function () {

                      deleteFile(localFileName);

                    });

                  });

                });

              }

            });
        }

        if (updateMsg.photo) {

          /********************************************************************
           * PHOTO UPLOADS
           * 
           * method: download the actual file,
           *         upload it from local
           *         then delete the local file
           * result: clean image displays. no url display
           ********************************************************************/
          telegramBot.telegram
            .getFileLink(updateMsg.photo[updateMsg.photo.length - 1].file_id)
            .then(function (photoUrl) {

              console.log("[TG] [PHOTO]", photoUrl.toString());

              // Save the file
              const localFileName = `./temp/${updateMsg.photo[updateMsg.photo.length - 1].file_unique_id}${path.extname(photoUrl.toString())}`;
              console.log(`     [FILE] localfile: ${localFileName}`);
              const file = fs.createWriteStream(localFileName);
              // Download the file
              const request = https.get(photoUrl.toString(), function (response) {
                response.pipe(file);
                // after download completed close filestream
                file.on("finish", () => {
                  file.close();
                  console.log(`     [FILE] Download Completed: ${localFileName}`);

                  discordWebhookClient.send({
                    content: `${updateMsg.caption ? updateMsg.caption : ""}`,
                    username: `${updateMsg.from.first_name}`,
                    avatarURL: profileUrl.toString(),
                    files: [localFileName]
                  }).then(function () {

                    deleteFile(localFileName);

                  });

                });

              });

            });
        }

      } else {

        /********************************************************************
         * REGULAR TEXT MESSAGES AND EMOJIS
         * 
         * Clean the text and post it
         ********************************************************************/

        if (updateMsg.text) {

          // Format text
          msgText = updateMsg.text
            // Replace twitter links with fxtwitter
            .replace("https://twitter", "https://fxtwitter").trim()
            .replace("https://x.com", "https://fixupx.com").trim();


          // If this is a message reply, populate message reference parameter
          var msgReference;
          if (updateMsg.reply_to_message) {
            msgReference = {
              message_id: msgID,
              channel_id: discordChannelId,
              guild_id: discordGuildId
            }
          }

          tgMsgIdTag = `[:black_small_square:](https://msg.id/${updateMsg.message_id}/) `;
          console.log(`[TG] ${updateMsg.from.first_name}: ${msgText}`);

          discordWebhookClient.send({
            content: tgMsgIdTag + msgText,
            username: `${updateMsg.from.first_name}`,
            avatarURL: profileUrl.toString(),
          });

        }
      }
    });
  }
});

function getMsgIdFromLink(msgIdURL) {
  console.log();
  
  if (msgIdURL) {
    return msgIdURL.split('/')[3];
  } else {
    return 0;
  }
}

telegramBot.launch();

async function deleteFile(filePath) {
  try {
    await fsp.unlink(filePath);
    console.log(`     [FILE] ${filePath} has been deleted.`);
  } catch (err) {
    //console.error(err);
  }
}
