# Design for Riso testing

This code isn't really for public consumption, it's horribly hacked together so I can kinda sorta do stuff, but you know, good luck!

## version_01

This is broken down into two parts the webpage bit, and the merging part. The first part is easy, the second part less so!

### WEB UI

![Screenshot of the web UI showing the design interface with controls](version_01/Screenshot%202025-06-05%20at%2011.30.45.png)

You can probably get this up and running just by opening the index.html file. I normally run it via a webserver, but ymmv.

It defaults to A3, cool, and you should probably only use the settings that are open on the right. "save_SVG" doesn't do anything useful and the "layout" stuff will probably break. You can open the top-most "settings" to adjust the margins I guess, if you're brave.

Once you've dialed in your settings, hit the "Save 64 outputs" link on the left and the page will attempt to download 64 png files, you may need to enable multipul file downloads in the browers.

### MERGE.JS

The second part is nodejs stuff, which is a bit more involved, you'll need to `cd` into the `version_01` folder and from there...

`npm install`

...then create a `inputs` folder and copy all the `.png` files from the previous step, which are probably in your downloads folder into that `inputs` folder.

Then run...

`node merge.js`

...which will pick a couple at random and merge them together.

To make things easier it spits out `thumbnails` which you can preview, then use the name of the thumbnail to find the original files to use for riso printing in the `outputs` folder.

So if the file is called `03 Bright Red + 01 Yellow - 0002 - thumb.png` then look in the `01 Yellow - 03 Bright Red` folder for the `0002` folder and the files you need will be in there.

Note...

`03 Bright Red + 01 Yellow - 0002 - thumb.png`  
`01 Yellow + 03 Bright Red - 0002 - thumb.png`  

...are the same thumbnail, I've just done it like that to make it easier to review outputs of a certain colour combination. So when you look for the full sized outputs, but the colours into numerical order and then you'll find them.
