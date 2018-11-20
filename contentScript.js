//
//  contentScript.js
//  Arkangel
//
//  Contributors: Amir Semmo, Lonni Besançon
//  Copyright (c) 2018 Hasso Plattner Institute, Linköping University and Digital Masterpieces GmbH.
//  All rights reserved.
//

var images_processing = [];

function isCurrentlyProcessing(image) {
	return images_processing.includes(image);
}

function setAsProcessing(image) {
	images_processing.push(image);
}

function setAsProcessed(image) {
	var index = images_processing.indexOf(image);
	if (index > -1) {
		images_processing.splice(index, 1);
	}
}

function hideSingleImage(image){
	//image.style.visibility = 'hidden';
	if(!image.classList.contains("loading")) {
		image.classList.add("loading");
	}
}

function showSingleImage(image) {
	//image.style.visibility = 'visible';
	if(image.classList.contains("loading")) {
		image.classList.remove("loading");
	}
}

function imageShowOriginal(image) {
	console.log("Switching to original image: " + image.src_original);
	image.showOriginal = true;
	image.src = image.src_original;
	if(image.srcset != "") {
		image.srcset = image.src_original;
	}
}

function hasString(a, at) {
    var position = a.indexOf(at); 
    return position !== -1;
}

function insertString(a, b, at) {
    var position = a.indexOf(at); 

    if (position !== -1) {
		position += at.length;
        return a.substr(0, position) + b + a.substr(position);    
    }  

    return a;
}

function filterSingleImage(image, parent) {
	if(image.showOriginal) {
		// do not filter if explicitly stated
		return;
	}

	if(image.src == "") {
		console.log("ARKANGEL ERROR: IMAGE SRC IS NOT DEFINED");
		return;
	}
	
	// workaround for Picture: remove the srcset elements to let the browser select the img for default rendering
	if(parent instanceof HTMLPictureElement) {
		for (idx = 0; idx < parent.childNodes.length; idx++) {
			childNode = parent.childNodes[idx];
			if(childNode instanceof HTMLSourceElement) {
				parent.removeChild(childNode);
			}
		}
	}
	
	// workaround for Image srcsets: remove to let the browser select src for default rendering
	if(image.srcset != "") {
		image.srcset = "";
	}
	
	// check if this image has already been processed
	if(hasString(image.src, "base64;arkangel")) {
		return;
	}
	
	hideSingleImage(image);
	
	if(!isCurrentlyProcessing(image)) {
		setAsProcessing(image);
		
		chrome.extension.sendMessage({'action' : 'filterImageKernel', 'src' : image.src},
			function(data) {
				// double check if this image has already been processed
				if(hasString(image.src, "base64;arkangel")) {
					showSingleImage(image);
					return;
				}
				
				// encode in the data uri that this is an image processed with Arkangel
				var dataTagged = insertString(data, ";arkangel", "base64");
				
				console.log("ARKANGEL PROCESSED: " + image.src);
				image.src_original = image.src;
				image.src = dataTagged;
				if(image.srcset != "") {
					image.srcset = dataTagged;
				}
				
				showSingleImage(image);
				setAsProcessed(image);
			}
		);
	}
}

function dynamicallyFilterNode(node) {
	if (node instanceof HTMLImageElement) {
		filterSingleImage(node, node.parentNode);
	}
	
	if (typeof node.getElementsByTagName !== 'function') {
		return;
	}
	
	var imgs = node.getElementsByTagName('img');
	for (iidx = 0, ilen = imgs.length; iidx < ilen; iidx++) {
		filterSingleImage(imgs[iidx], imgs[iidx].parentNode);
	}
}

//whenever uncached images are added to the dom tree within target,
//replace them with a spinner gif until they're loaded
function dynamicallyFilterImages(target) {
    var spinner, observer;
	
    // detect support
    if (window.MutationObserver) {
        // setup callback for mutations
        observer = new MutationObserver(function (mutations) {
            //check to see if image was added, and add onload check
            for (var idx = 0; idx < mutations.length; idx++) {
                var mut = mutations[idx];
				
				if (mut.type == 'attributes') {
					var node = mut.target;
					
					if(node instanceof HTMLImageElement && (mut.attributeName == 'src' || mut.attributeName == 'srcset')) { //  && !node.src.startsWith("data:")
						//console.log("Changed an attribute");
						
						// mark as processed to trigger re-processing
						setAsProcessed(node);
						
						filterSingleImage(node, node.parentNode);
					}
				}
				else if (mut.type == 'childList') {
					for (var nidx = 0; nidx < mut.addedNodes.length; nidx++) {
						// Check if we appended a node type that isn't
						// an element that we can search for images inside.
						//if (!mut.addedNodes[nidx].getElementsByTagName) {
							
						var node = mut.addedNodes[nidx];
						
						dynamicallyFilterNode(node);
					}
				}
			}
        });

        //bind mutation observer to a specific element (probably a div somewhere)
        observer.observe(target, {attributes: true, childList: true, subtree: true});
    }
};

var clickedElement;
document.addEventListener("mousedown", function(event) { clickedElement = event.target; }, true);

chrome.extension.onMessage.addListener(function(msg, sender, sendResponse) {
	if (msg.action == 'imageShowOriginal') {
		if(clickedElement instanceof HTMLImageElement) {
			imageShowOriginal(clickedElement);
		}
	}
});

dynamicallyFilterImages(document);
