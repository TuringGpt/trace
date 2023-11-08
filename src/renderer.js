async function openContextMenu(sources) {
  try {
    await window.electronAPI.invokeContextMenu(JSON.stringify(sources));
  } catch (error) {
    console.log("ERROR : RENDERER : openContextMenu > ", error);
    throw error;
  }
}

async function fetchVideoSources() {
  try {
    return await window.electronAPI.getVideoSources();
  } catch (error) {
    console.log("ERROR : RENDERER : fetchVideoSources > ", error);
    throw error;
  }
}

const videoSelectBtn = document.getElementById('videoSelectBtn')
videoSelectBtn.addEventListener('click', async () => {
  const sources = await fetchVideoSources();
  console.log("SUCCESS : RENDERER : getVideoSources > ", JSON.stringify(sources));
  await openContextMenu(sources);
})

const playVideo = async (source) => {
  try {
    const videoSelectBtn = document.getElementById('videoSelectBtn')
    videoSelectBtn.textContent = source.name
    
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: source.id
        }
      }
    });
    const videoElement = document.querySelector('video')
    videoElement.srcObject = stream
    videoElement.play()
    const startButton = document.querySelector('#startButton')
    startButton.disabled = false
    const videoPlaceholder = document.getElementById('videoPlaceholder');
    videoElement.classList.remove('hidden');
    videoPlaceholder.classList.add('hidden');
  } catch (error) {
    console.log("ERROR : RENDERER : playVideo > ", error);
    throw error;
  }
}

window.electronAPI.selectSource(async (event, value) => {
  const source = value
  console.log("SUCCESS : RENDERER : selectSource callback : selected source > ", source);
  await playVideo(source);
  console.log("SUCCESS : RENDERER : playVideo > ", source);
})

let mediaRecorder;
let recordedChunks = [];

const recordVideo = async () => {
  const videoElement = document.querySelector('video');
  const stream = videoElement.srcObject;

  if (!stream) {
    console.error('No stream found to record.');
    return;
  }

  const options = { mimeType: 'video/webm; codecs=vp9' };
  mediaRecorder = new MediaRecorder(stream, options);

  mediaRecorder.ondataavailable = event => {
    if (event.data.size > 0) {
      recordedChunks.push(event.data);
    }
  };

  mediaRecorder.onstop = async () => {
    electronAPI.stopKeystrokesLogging();
    console.log('mediaRecorder stopped');
    const blob = new Blob(recordedChunks, { type: 'video/webm; codecs=vp9' });
    recordedChunks = [];
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recorded-video-${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  electronAPI.startKeystrokesLogging();
  mediaRecorder.start();
};

const startButton = document.getElementById('startButton')
startButton.addEventListener('click', async () => {
  console.log("SUCCESS : RENDERER : startButton > clicked");
  const stopButton = document.querySelector('#stopButton')
  stopButton.disabled = false
  startButton.disabled = true
  await recordVideo()
})

const stopButton = document.getElementById('stopButton')
stopButton.addEventListener('click', async () => {
  console.log("SUCCESS : RENDERER : stopButton > clicked");
  const stopButton = document.querySelector('#stopButton')
  stopButton.disabled = true
  startButton.disabled = false

  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();
    console.log("Recording stopped");
  }
})