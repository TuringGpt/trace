# Trace - Screen Recorder

Welcome to Trace, the intuitive, cross-platform screen recording application that not only captures your screen but also records your clicks and keystrokes to provide a comprehensive viewing experience.

![screenshot](.erb/img/ss.png)

## Features

- Cross-Platform: Runs on Windows, macOS, and Linux.
- Screen Recording: Capture your entire screen.
- Clicks and Keystrokes: Records all mouse clicks and keystrokes alongside the video.
- Simple Interface: Start and stop recording with just a click of a button.

## Download and Installation

To get started with Trace, please visit the [Releases page](https://github.com/suraj-turing/trace/releases) on our GitHub repository.

Depending on your operating system, download the respective executable:

- **Windows**: Download `Trace-Setup-x.x.x.exe`.
- **macOS**:
  - For Intel processors, download `Trace-x.x.x.dmg`.
  - For M1/M2 (ARM) processors, download `Trace-x.x.x-arm64.dmg`.
- **Linux**:
  - Debian-based distributions: Download `Trace_x.x.x_amd64.deb`.
  - Red Hat-based distributions: Download `Trace-x.x.x.x86_64.rpm`.

After downloading the correct file for your operating system, run the installer or executable to install Trace on your machine.

## How to Use Trace

1. Open Trace.
2. Click on the "Choose a Video Source" button to select your video source.
3. Once the video source is selected, the "Start" button will be enabled.
4. Click "Start" to begin recording your screen.
5. Click "Stop" to end the recording. You will be prompted to choose a location to save your zip file containing video and keystroke logs file.
6. You can save/discard the recording (zip file).
7. Once saved/discarded, You'll be redirected to home page where upload feature is available in top right corner.
8. Select zip file and start the upload. It'll show finished status when file is uploaded completely.

## Getting Started

Follow these instructions to get the project up and running on your local machine for development and testing.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.x)
- Python (v3.11 or lower) (required for `node-gyp` to build native modules, python 3.12 is not supported)

## Starting Development

Start the app in the `dev` environment:

```bash
npm start
```

## Packaging for Production

To package apps for the local platform:

```bash
npm run package
```
