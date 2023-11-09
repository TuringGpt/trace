const startButton = document.getElementById('startButton')
const stopButton = document.getElementById('stopButton')
const videoSelectBtn = document.getElementById('videoSelectBtn')

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

videoSelectBtn.addEventListener('click', async () => {
  const sources = await fetchVideoSources();
  console.log("SUCCESS : RENDERER : getVideoSources > ", JSON.stringify(sources));
  await openContextMenu(sources);
})

const playVideo = async (source) => {
  try {
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
  enableButton(startButton);
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

startButton.addEventListener('click', async () => {
  console.log("SUCCESS : RENDERER : startButton > clicked");
  const stopButton = document.querySelector('#stopButton')
  enableButton(stopButton)
  disableButton(startButton)
  disableButton(videoSelectBtn);
  await recordVideo()
})

stopButton.addEventListener('click', async () => {
  console.log("SUCCESS : RENDERER : stopButton > clicked");
  const stopButton = document.querySelector('#stopButton')
  enableButton(startButton)
  enableButton(videoSelectBtn);
  disableButton(stopButton)

  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();
    console.log("Recording stopped");
  }
})

function disableButton(button) {
  button.disabled = true;
  button.classList.add('opacity-50', 'cursor-not-allowed');
}

function enableButton(button) {
  button.disabled = false;
  button.classList.remove('opacity-50', 'cursor-not-allowed');
}