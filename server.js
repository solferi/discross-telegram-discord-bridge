/**
 * Discross Telegram Discord Bridge Server
 * by solferi
 */

// ENVIRONMENT VARIABLES
require('dotenv').config({ path: `${__dirname}/.env` });
const discordBotToken = process.env['DISCORD_BOT_TOKEN'];
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
const crypto = require('crypto');

// Temp folder initialize
tempDir = path.join(__dirname, "/temp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
  console.log(`[INFO] Temp dir created.`);
}

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
discordClient.once("ready", () => { console.log(`[INFO] Discord bot ready! Logged in as ${discordClient.user.tag}`); });
discordClient.login(discordBotToken);
const discordWebhookClient = new WebhookClient({ "url": discordWebhookURL });

// TELEGRAM CLIENT
const { Telegraf } = require("telegraf");
const telegramClient = new Telegraf(telegramBotToken);
telegramClient.start((ctx) => ctx.reply('Welcome!'));
renameTGSelf();

async function renameTGSelf() {
  tgBotDisplayName = await telegramClient.telegram.getMyName();
  tgBotName = 'discord bridge'
  if (tgBotDisplayName.name != tgBotName) {
    telegramClient.telegram.setMyName(tgBotName);
    console.log(`[INFO] Renaming bot to '${tgBotName}'`);
  }

}

console.log("[INFO] Telegram bot ready!");



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

  console.log();

  sourceMessage = ``;
  sourceMessageURL = ``;
  senderName = ``;
  messageQuote = ``;
  telegramMessageID = 0;

  // Handle reply-type discord messages
  if (message.reference) {

    // Get the source discord message
    messageReferenceID = message.reference.messageId;
    const fetchedMessage = await message.channel.messages.fetch(messageReferenceID);
    sourceMessage = fetchedMessage.content;

    // Parse the telegram message ID
    sourceMessageSplit = sourceMessage.split('?');
    telegramMessageID = sourceMessageSplit[sourceMessageSplit.length - 1].replace(")", "");

    senderName = fetchedMessage.author.username;
    messageQuote = fetchedMessage.content;

    // Handle Discord replies on non-text i.e. gifs
    if (!messageQuote) {

      // Make reply reference empty not null
      messageQuote = `(non-text)`;

      // Handle replies on long text
    } else if (messageQuote.length > 80) {

      // Truncate long text to make 80 characters (including ellipses)
      messageQuote = `${fetchedMessage.content.substring(0, 77)}...`;

      // Handle replies on normal text
    } else {

      // Quote the full text
      messageQuote = fetchedMessage.content;

    }

    if (fetchedMessage.mentions) {
      fetchedMessage.mentions.roles.forEach(role => {
        messageQuote = messageQuote ? messageQuote.replace(`<@&${role.id}>`, `<b><i>@${role.name}</i></b>`) : ``;
      });
      fetchedMessage.mentions.users.forEach(user => {
        messageQuote = messageQuote ? messageQuote.replace(`<@${user.id}>`, `<b><i>@${user.displayName}</i></b>`) : ``;
      });


    }

  }

  // the program currently check if the message's from a bot to check for duplicates.
  // This isn't the best method but it's good enough.
  // A webhook counts as a bot in the discord api, don't ask me why.
  if (message.channel.id == discordChannelId && message.author.bot === false) {

    console.log("[DC] ", message.content);
    var composedMessage = message.content
      .replace("https://twitter", "https://fxtwitter").trim()
      .replace("https://x.com", "https://fixupx.com").trim();

    // Format "<@>"" mentioned roles and users
    if (message.mentions) {
      message.mentions.roles.forEach(role => {
        composedMessage = composedMessage
          .replace(`<@&${role.id}>`, `<b><i>@${role.name}</i></b>`);
      });
      message.mentions.users.forEach(user => {
        composedMessage = composedMessage
          .replace(`<@${user.id}>`, `<b><i>@${user.displayName}</i></b>`);
      });
    }

    if (composedMessage.length > 0) {

      quotedMessage = ``
      if (message.reference) {

        quotedMessage = ``
          + `<blockquote><b>${senderName}</b>\n`
          + `${messageQuote}</blockquote>\n`;

      }


      // NEW: Send message and reply if necessary
      // 564 test, 0 disable

      // Get Telegram message reference id
      replyToMessageId = 0;
      if(message.reference) { // TODO: and content .startswith
        const originMessage = await message.channel.messages.fetch(message.reference.messageId);
        if (originMessage.content.startsWith('[|](')) {
          omSplitArray = originMessage.content.split(')');
          idSplitArray = omSplitArray[0].split('/');
          replyToMessageId = idSplitArray[idSplitArray.length-1];
          console.log();
        }
      }
      
      messageWithUsername = ``
        + `<b>${message.author.username}</b>`
        + `<a href='https://msg.id/${message.id}/'>:</a> `
        + `${composedMessage}`;

      telegramClient.telegram.sendMessage(
        telegramChatId,
        messageWithUsername,
        {
          reply_to_message_id: replyToMessageId,
          parse_mode: 'HTML'
        }
      );

      // telegramClient.telegram.sendMessage(
      //   telegramChatId,

      //   ``
      //   + quotedMessage
      //   + `<b>${message.author.username}:</b> `
      //   + `${composedMessage} ${message.id} <a href='http://example.com?msgid=${message.id}' >.</a>`,

      //   { parse_mode: 'HTML' }
      // );


    }
  }
});












// $$$$$$$$\  $$$$$$\              $$\          $$$$$$$\   $$$$$$\  
// \__$$  __|$$  __$$\             \$$\         $$  __$$\ $$  __$$\ 
//    $$ |   $$ /  \__|             \$$\        $$ |  $$ |$$ /  \__|
//    $$ |   $$ |$$$$\       $$$$$$\ \$$\       $$ |  $$ |$$ |      
//    $$ |   $$ |\_$$ |      \______|$$  |      $$ |  $$ |$$ |      
//    $$ |   $$ |  $$ |             $$  /       $$ |  $$ |$$ |  $$\ 
//    $$ |   \$$$$$$  |            $$  /        $$$$$$$  |\$$$$$$  |
//    \__|    \______/             \__/         \_______/  \______/ 












/********************************
 * TELEGRAM TO DISCORD
 ********************************/

// var photoUrl = "";

telegramClient.on("message", function (message) {

  const updateMsg = message.update.message;

  // Message from a user
  if (updateMsg.chat.id == telegramChatId && updateMsg.from.is_bot === false) {

    // Get sender's pfp
    const getProfilePic = new Promise(function (resolve, reject) {
      var profilePhotos = telegramClient.telegram.getUserProfilePhotos(updateMsg.from.id);
      profilePhotos.then(function (data) {

        // If user has a profile photo, store it for discord pfp
        if (data.total_count > 0) {
          var file = telegramClient.telegram.getFileLink(data.photos[0][0].file_id);
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

      var messageQuote = ``;

      /***********************************************************************
       * Message Reply
       * 
       * Quote the reply before responding
       ***********************************************************************/

      // Handle "reply-type messages" by displaying a quote on user message
      if (updateMsg.reply_to_message) {

        senderName = updateMsg.reply_to_message.from.first_name;
        messageQuote = updateMsg.reply_to_message.text;
        messageRefId = updateMsg.reply_to_message.link_preview_options.url.split('=')[1];
        console.log(messageRefId);

        // Handle Telegram replies on non-text i.e. Tenor GIFs
        if (!messageQuote) {

          // Make reply reference empty not null
          if (updateMsg.reply_to_message.caption) {

            messageQuote = `[with media] ${updateMsg.reply_to_message.caption}`;

          } else {

            messageQuote = `[media]`;

          }
          // console.log(updateMsg.reply_to_message.photo);
          // console.log(updateMsg.reply_to_message.photoUrl);
          // TODO: Get thumbnail of reference if it was a Tenor gif/photo

          // Handle replies on long text
        } else if (messageQuote.length > 80) {

          // Truncate long text to make 80 characters (including ellipses)
          messageQuote = `${updateMsg.reply_to_message.text.substring(0, 77)}...`;

          // Handle replies on normal text
        } else {

          // Quote the full text
          messageQuote = updateMsg.reply_to_message.text;

        }

        // Erase bot name in quoted messages
        if (senderName === telegramClient.botInfo.first_name) {
          senderName = ``;
        } else {
          senderName = `***${senderName}:***`;
        }

        const quotedText = new EmbedBuilder()
          .setDescription(`${senderName} *${messageQuote}*`);

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

          telegramClient.telegram
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

          telegramClient.telegram
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
          telegramClient.telegram
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


          console.log(`[TG] ${updateMsg.from.first_name}: ${msgText}`);
          discordWebhookClient.send({
            content: `[|](https://msg.id/${updateMsg.message_id}) ${msgText}`, // \u200b
            username: `${updateMsg.from.first_name}`,
            avatarURL: profileUrl.toString(),
          });

        }
      }
    });
  }
});







telegramClient.launch();

async function deleteFile(filePath) {
  try {
    await fsp.unlink(filePath);
    console.log(`    [FILE] ${filePath} has been deleted.`);
  } catch (err) {
    //console.error(err);
  }
}