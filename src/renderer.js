// src/renderer.js

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
let recordingStartTime;
let intervalId;

function formatTime(time) {
  return time.toString().padStart(2, '0');
}

function updateRecordingTime() {
  const elapsedTime = Date.now() - recordingStartTime;
  const seconds = Math.floor((elapsedTime / 1000) % 60);
  const minutes = Math.floor((elapsedTime / (1000 * 60)) % 60);
  const hours = Math.floor((elapsedTime / (1000 * 60 * 60)));

  const hoursStr = formatTime(hours);
  const minutesStr = formatTime(minutes);
  const secondsStr = formatTime(seconds);

  document.getElementById('recordingTime').textContent = `${hoursStr}:${minutesStr}:${secondsStr}`;
}

const recordVideo = async () => {
  const videoElement = document.querySelector('video');
  const stream = videoElement.srcObject;

  if (!stream) {
    console.error('No stream found to record.');
    return;
  }

  const options = {
    mimeType: 'video/webm; codecs=vp9',
    bitsPerSecond: 113778 // calculated for 1 hour recording to be under 100MB.
  };
  mediaRecorder = new MediaRecorder(stream, options);

  mediaRecorder.ondataavailable = event => {
    if (event.data.size > 0) {
      recordedChunks.push(event.data);
    }
  };

  mediaRecorder.onstop = async () => {
    clearInterval(intervalId);
    document.getElementById('recordingTime').textContent = '00:00:00';
    document.querySelector('.recording-dot').classList.remove('is-recording');  

    console.log('mediaRecorder stopped');
    const blob = new Blob(recordedChunks, { type: 'video/webm; codecs=vp9' });
    const arrayBuffer = await blob.arrayBuffer();

    const { directoryPath, timestamp } = await electronAPI.stopKeystrokesLogging();
    console.log('keylogging file saved to ', directoryPath);
    const fileName = `${timestamp}-video.webm`;

    const videoFilePath = await electronAPI.saveFile(new Uint8Array(arrayBuffer), directoryPath, fileName);
    console.log('keylogging file saved to ', videoFilePath);

    recordedChunks = [];
  };
  
  recordingStartTime = Date.now();
  intervalId = setInterval(updateRecordingTime, 1000);
  document.querySelector('.recording-dot').classList.add('is-recording');
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
