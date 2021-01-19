function createAudioContext() {
  return new (window.AudioContext || window.webkitAudioContext)();
}
function createMixedStream(...streams) {
  const audioContext = createAudioContext();
  const gainNode = audioContext.createGain();
  gainNode.connect(audioContext.destination);
  gainNode.gain.value = 1;

  const audioDestination = audioContext.createMediaStreamDestination
    ? audioContext.createMediaStreamDestination()
    : audioContext.destination;
  const audioSourcesToClean = [];

  streams.forEach(s => {
    const audioSource = audioContext.createMediaStreamSource(s);

    audioSource.connect(gainNode);
    audioSourcesToClean.push(audioSource);
  });

  audioSourcesToClean.forEach(s => {
    s.connect(audioDestination);
  });

  return {
    audioContext,
    stream: streams[0],
    clean() {
      audioDestination.stream.getTracks().forEach(i => i.stop());
      audioDestination.disconnect();
      audioSourcesToClean.forEach(a => {
        a.disconnect();
      });

      if (audioContext.state !== 'closed') {
        audioContext.close().then(() => {
          console.log(audioContext)
          console.log(audioDestination)
        });
      }

    },
  };
}

function getUserMedia() {
  return navigator.mediaDevices.getUserMedia({
    audio: {
      autoGainControl: true,
      echoCancellation: true,
      echoCancellationType: 'system',
      noiseSuppression: true,
      latency: 0.01,
      sampleRate: 44100,
      sampleSize: {
        ideal: 16,
      },
    },
    video: false,
  });
}

getUserMedia()
  .then(stream => {
    let mixedStream = createMixedStream(stream);
    console.log('MIXED', stream.getTracks()[0].getSettings(), mixedStream.audioContext.sampleRate)

    setTimeout(() => {
      mixedStream.clean();
      console.log('MIXED clean')

      setTimeout(() => {
        mixedStream = createMixedStream(stream);
        console.log('MIXED', stream.getTracks()[0].getSettings(), mixedStream.audioContext.sampleRate)

      }, 3000)
    }, 3000);
  })
  .catch(err => {
    console.warn(err);
  });