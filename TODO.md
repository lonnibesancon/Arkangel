X C1/AS) The original images are visible for a fraction of seconds, after that the images are processed sequentially. Avoid this, e.g., by using a temporary dummy image. One needs to find a good hook in JS before images are rendered.
X C2/AS) The WebGL processing stalls website interactions, maybe this can be done asynchronously or using another JS callback?
X C3/AS) Support dynamically loaded content (images). Currently, the processing is only done once when the original DOM has been built, but a parallel check needs to be done.
X C4/AS) Some images cannot be processed and the extension "crashes": "caught DOMException: Failed to execute 'texImage2D' on 'WebGLRenderingContext': The image element contains cross-origin data, and may not be loaded." Processing cross-origin data is a well-known problem and needs to be resolved, e.g., by shifting the image processing from the content script to the background script (a quick search showed that only the background script has rights to obtain cross-origin image data).
C5/AS) Check limitations: Maximum image size that can be processed with WebGL Flowabs.
X C6/AS) Handle RGBA images (currently the transparency information is lost, important for PNGs etc.)
X C7/AS) The image passed to the WebGL flowabs backend is sometimes empty (width=height=0), all subsequent images are then no longer processed
C8) Images that are used as background are not processed.
X C9/AS) Resolution-dependant parameters
C10) GUI to adjust the parameters
X C11/AS) Add a button to get the original image back
C12) Adjust the parameters based on the likelihood that the image is NSFW

X = done
