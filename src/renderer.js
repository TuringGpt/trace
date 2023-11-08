
let childrenAdded = 0

const startButton = document.getElementById('startButton')
startButton.addEventListener('click', async () => {
  console.log("start button clicked...")

  const res = await electronAPI.ping()

  const pingElement = document.createElement("p")
  pingElement.innerText = res
  pingElement.className = "text-center"

  const response = document.getElementById('response')
  response.appendChild(pingElement)
  childrenAdded++
  pingElement.id = childrenAdded.toString()
  console.log("children added:", childrenAdded)
})

const stopButton = document.getElementById('stopButton')
stopButton.addEventListener('click', async () => {
  console.log("stop button clicked...")

  if (!childrenAdded) {
    console.log("no children found..."); return;
  }
  const response = document.getElementById('response')
  response.removeChild(document.getElementById(childrenAdded.toString()))
  childrenAdded--
  console.log("child removed, remaining:", childrenAdded)
})