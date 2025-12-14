export function closeAllOpenPopovers() {
    if (document) {
        const popovers = document.querySelectorAll(".popover");
        if (popovers) {
            popovers.forEach((popover) => {
                popover.classList.add("opacity-0", "hidden");
            });
        }
    }
}

export function isFirefox() {
    return navigator.userAgent.toLowerCase().indexOf("firefox") > -1;
}

export function isChromium() {
    return navigator.userAgent.toLowerCase().indexOf("chrome") > -1;
}

async function getAudioStream(
    videoElement: HTMLVideoElement
): Promise<MediaStream> {
    //TODO: Fix safari audio streaming issue
    if (!videoElement) {
        throw new Error(
            "Unable to capture audiostream since video element is null or undefined."
        );
    }
    const AudioCtx =
        (window as any).AudioContext || (window as any).webkitAudioContext;
    const audioContext = new AudioCtx();
    if (
        window.confirm(
            "Safari browser requires user permission before sharing audio.Click yes below if you would like to share the audio with others in this watchparty.If you click cancel, nobody in this watch party will be able to hear the audio."
        )
    ) {
        console.log("Awaiting audio context hydration ", audioContext.state);
        await audioContext.resume();
        console.log("Audio context state is ", audioContext.state);
    }
    const sourceNode = audioContext.createMediaElementSource(videoElement);
    const destination = audioContext.createMediaStreamDestination();
    sourceNode.connect(destination);
    sourceNode.connect(audioContext.destination);
    return Promise.resolve(destination.stream);
}

async function recordMedia(
    videoElement: HTMLVideoElement
): Promise<MediaStream> {
    if (!videoElement) {
        throw new Error(
            "Unable to capture mediastream since video element is null or undefined."
        );
    }
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    const fps = 30;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    function processFrame(_now: number, _metadata: VideoFrameCallbackMetadata) {
        if (!videoElement.paused && !videoElement.ended) {
            ctx?.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
            videoElement.requestVideoFrameCallback(processFrame);
        }
    }
    videoElement.requestVideoFrameCallback(processFrame);

    const videoStream = canvas.captureStream(fps);
    const stream = new MediaStream();
    videoStream.getVideoTracks().forEach((track) => stream.addTrack(track));
    try {
        console.log("Before audio steam capture");
        const audioStream = await getAudioStream(videoElement);
        audioStream.getAudioTracks().forEach((track) => stream.addTrack(track));
    } catch (error) {
        console.warn("Could not capture audio stream:", error);
    }
    return Promise.resolve(stream);
}

export async function captureStream(
    videoElement: HTMLVideoElement
): Promise<MediaStream> {
    if (!videoElement) {
        throw new Error(
            "Unable to capture mediastream since video element is null or undefined."
        );
    }
    let mediastream;
    if (isFirefox()) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        mediastream = videoElement.mozCaptureStream();
    } else if (isChromium()) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        mediastream = videoElement.captureStream();
    } else {
        mediastream = await recordMedia(videoElement);
    }
    return Promise.resolve(mediastream);
}
