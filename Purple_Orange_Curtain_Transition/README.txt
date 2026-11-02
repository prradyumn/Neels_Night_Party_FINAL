PURPLE + ORANGE CURTAIN OPENING

curtain-opening.svg: standalone animated transparent overlay, 1920x1080.
Closed initially; movement starts at 0.3 seconds and completes at 2.65 seconds.
The curtains part and the upper valance rises until the canvas is fully transparent. Plays once.

Open preview.html to see the animation and replay it.
curtain-closed.svg and curtain-half-open.svg are static editing/reference states.

HTML use:
<img id="curtain" src="curtain-opening.svg" style="position:fixed;inset:0;width:100%;height:100%;object-fit:fill;pointer-events:none;z-index:9999" alt="">

To replay, recreate the img element or update its src with a fresh query string.
To change timing, edit begin=".3s" and dur="2.35s" in the animated SVG (three animation elements).
No external images, fonts, libraries, or network requests are required.

preview.gif is a looping visual preview on a checkerboard; the animated SVG itself has a transparent background.
