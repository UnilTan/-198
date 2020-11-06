 # Interserver
### Download
```bash 
git clone https://github.com/oddyamill/interserverbot
```
### Modules 
```bash
npm install discord.js@12.2.0 enmap@3.1.4 enmap-mongo@2.0.2
```
### Config
```js
module.exports = {
  "token": "discord-bot token",
  "prefix": "!", // or null.
  "embedColor": "#36393f", // embed color.
  "channels": [
    "first channel id.", 
    "second channel id", 
    "..."
  ], // channels id.
  "mongodb": "", // mongodb uri.
  "cooldown": 5 // messages cooldown in seconds.
}
```

if you find a bug, write me - [email](mailto:oddyamill@gmail.com) [discord](https://discord.com/users/477733320583544838/)