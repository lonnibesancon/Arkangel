# Arkangel: A Browser Extension To Reduce Affective Responses To Surgical Media

## About

Arkangel is a Google Chrome extension to reduce the affective responses (aversion, disgust,...) to surgical images while browsing the web. It automatically processes images on webpages with a WebGL implementation of Flowabs, a filtering technique initially proposed by Kyprianidis and  Döllner. 

It will transform an image such as a lasagna picture into a cartoon-like image of lasagna. 

![Example of Flowabs](https://i.imgur.com/z2oHoXk.jpg)

We chose this specific technique and the default parameters based on published research. 
The research paper(s) and material are listed below:
- [A TEDx talk of our research project](https://youtu.be/pDHomZ8FEoU).
- [Reducing Affective Responses to Surgical Images and Videos Through Stylization](https://hal.inria.fr/hal-02381513v2/document) (extended journal paper).
- [Reducing Affective Responses to Surgical Images through Color Manipulation and Stylization](https://hal.inria.fr/hal-01795744/file/Besancon_2018_RAR.pdf) (initial conference paper).
- [Service-based Analysis and Abstraction for Content Moderation of Digital Images](https://openreview.net/pdf?id=4j3avB-mrk) (new "system" paper).
- [The pre-registered study and all supplementary materials used in this paper](https://osf.io/4pfes/).

The current version of this software is only available for Google Chrome, but we are looking to port this to other browsers too (see point C14 of the ```TODO.md```). The extension has not been released yet to the Chrome Web Store but will soon be released.

## How to?

To try the extension before its release to the Chrome Web Store, please download this repository and follow the steps described by [the getting started on google chrome extensions](https://developer.chrome.com/extensions/getstarted).
Once you have it running, all images visible in webpages will be automatically processed. Since the processing of images may take time, images are first heavily blurred before their processed version is displayed.

- To revert back to an original image:
	- Right click on the image
	- Left click on the "Show Original Image"
- To adjust the strength of the stylization of the image:
	- Left click on the icon of the extension (visible on the right side of the url bar).
	- Left click on "Options"
	- A new page and a pop up are displayed with two values.
		1. "Level of Abstraction". It controls the strength of the "blur" effect on the image.
		2. "Edge enhancement". It controls the strength of the accentuated contours on the image.
	- Use the sliders to adjust these two values and quit.

## Contributions

Contributions are welcome to improve this work. Feel free to fork it and work on the points already proposed in ```TODO.md```, or suggest new ones by opening an issue.

## Help

To get started on developing for google chrome extension, [this link](https://developer.chrome.com/extensions/getstarted) will be helpful.


## Credits and contact
- WebGL Implementation of Flowabs by Heiko Thiel from the Hasso-Plattner-Institut, extended and modified by [Amir Semmo](http://asemmo.github.io).

- The project main investigators are [Lonni Besançon](http://lonnibesancon.me), [Amir Semmo](http://asemmo.github.io), [Tobias Isenberg](https://tobias.isenberg.cc), and [Pierre Dragicevic](http://dragice.fr).

If you have questions concerning the research project, feel free to contact lonni.besancon[at]gmail.com
