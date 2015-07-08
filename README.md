# [agar-mini-map](https://github.com/dimotsai/agar-mini-map)
A mini map which is able to show your location on http://agar.io/

## Installation

### Install for user script managers

The user script managers will automatically load agar-mini-map for you.

1. Install the user script manager
    * Chrome, Chromium: [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
    * Firefox: [greasemonkey](https://addons.mozilla.org/zh-TW/firefox/addon/greasemonkey/)
    * Opera: [Tampermonkey](https://addons.opera.com/zh-tw/extensions/details/tampermonkey-beta/?display=en)
    * Safari: [Tampermonkey](https://tampermonkey.net)
2. Install agar-mini-map
    1. Go to https://greasyfork.org/en/scripts/10286-agar-mini-map
    2. Click `Install this script`

### Manually install for other browsers

1. Simply open up JavaScript Console
2. Enter the code in [agar-mini-map.js](https://raw.githubusercontent.com/dimotsai/agar-mini-map/master/agar-mini-map.js) into console

Note: If you are taking this approach, you might have to re-select server to make it work.

### Shared your map data to others
#### Minimap Server
To build a server
```
cd src
npm install && npm run build
```

To host a server
```
npm run start
```

#### Client
* Simply enter an address of a minimap server, and click `connect`.
  e.g. ws://127.0.0.1:34343

## Screenshots

### Latest
![screenshot_2](http://i.imgur.com/35d7m5y.png)
![screenshot_3](http://i.imgur.com/xUz7xx0.png)

### Old Versions
(<= v0.24)![screenshot_1](http://i.imgur.com/FgujOgA.png)

## Issues

* https://github.com/dimotsai/agar-mini-map/issues

## Related projects

* [iamgyz/Agar-server-selection](https://github.com/iamgyz/Agar-server-selection)
