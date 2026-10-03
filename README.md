# GTO Wizard → Discord on/off notifier

A browser userscript. When you open **gtowizard.com**, it posts **🟢 on** to a Discord channel. When you close the app, it posts **🔴 off**. The group can then see when someone is using the shared account, so two people don't use it at the same time. You don't need to log in for it to work. Opening the website is enough.

## What you need

- **Tampermonkey**, a free browser extension: [Chrome](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) · [Edge](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd) · [Firefox](https://addons.mozilla.org/firefox/addon/tampermonkey/) · [Safari](https://apps.apple.com/app/tampermonkey/id1482490089)
- **A Discord webhook URL** for the channel. This is the only "key". You don't need a bot, a server, Python or Node.

## Setup

### 1. Create the Discord webhook (one person, once)
1. In Discord, go to **Server Settings → Integrations → Webhooks → New Webhook**. You need the *Manage Webhooks* permission.
2. Choose the channel the messages should go to, then click **Copy Webhook URL**.
3. Share the URL privately with the group. **Anyone who has this URL can post to the channel**, so don't put it anywhere public.

### 2. Install the script (everyone)
1. Install Tampermonkey. On **Chrome or Edge**, also open the extension's *Details* page and turn on **Allow user scripts**.
2. Click this link, and Tampermonkey opens its install screen. Click **Install**.
   **https://raw.githubusercontent.com/bluemoonblublu-art/discord-login-notifier/main/login-notifier.user.js**
3. Open https://gtowizard.com. The script asks for the **webhook URL** and **your name**, and it only asks once.

To change the webhook or your name later, click the Tampermonkey icon and choose **Set webhook / name**.

## How it behaves

| You do | Discord gets |
|---|---|
| Open gtowizard.com or app.gtowizard.com | 🟢 on — *name* opened GTO Wizard |
| Go to other pages, open more tabs, go from the homepage to the app | nothing (same session) |
| Close the last GTO Wizard app tab | 🔴 off — *name* closed GTO Wizard |
| Click the **Send OFF** button (bottom-right of the page) | 🔴 off — *name* is done |
| Click **Send ON** after that | 🟢 on |

## Known limits

- **Reloading the app** posts an "off" followed right away by an "on". When a page unloads, the browser doesn't tell scripts whether it's a reload or a tab close.
- **Leaving from the homepage** (gtowizard.com, not the app) sends no automatic "off". Use the **Send OFF** button there.
- **If the browser crashes or the computer shuts down**, no "off" is sent. The next visit posts a fresh "on".
- It only covers browsers that have the script installed.

## Updates

Tampermonkey checks this repo for new versions and installs them automatically. Your webhook and name are stored in Tampermonkey, not in the file, so updates don't wipe them.
