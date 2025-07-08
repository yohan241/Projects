document.addEventListener("DOMContentLoaded", function () {
  const candle = document.getElementById("mainCandle");
  const flame = candle.querySelector(".flame");
  const audio = new Audio('hbd.mp3');

  let audioContext;
  let analyser;
  let microphone;

  // Threshold for detecting a "blow" to extinguish the candle
  const blowThreshold = 90; // This value might need adjustment based on microphone sensitivity and environment
  // Threshold for detecting "blowing" to make the flame wave
  const waveThreshold = 40; // Lower than blowThreshold to show waving before extinguishing

  function getAverageVolume() {
    if (!analyser) return 0; // Return 0 if analyser is not ready

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i];
    }
    return sum / bufferLength;
  }

  function checkAudioLevel() {
    const averageVolume = getAverageVolume();

    // If the candle is not yet out
    if (!candle.classList.contains("out")) {
      // Apply waving effect if volume is above waveThreshold but below blowThreshold
      if (averageVolume > waveThreshold && averageVolume < blowThreshold) {
        flame.classList.add("blowing");
      } else {
        flame.classList.remove("blowing");
      }

      // Extinguish candle if volume is above blowThreshold
      if (averageVolume > blowThreshold) {
        blowOutCandle();
      }
    }
  }

  function blowOutCandle() {
    // Only extinguish if the candle is not already out
    if (!candle.classList.contains("out")) {
      candle.classList.add("out"); // Add 'out' class to hide flame
      flame.classList.remove("blowing"); // Remove blowing animation
      triggerConfetti();
      endlessConfetti();
      audio.play(); // Play birthday song
    }
  }

  // Microphone setup
  if (navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(function (stream) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);
        analyser.fftSize = 256; // Smaller FFT size for quicker response

        // Continuously check audio level for waving and extinguishing
        setInterval(checkAudioLevel, 100); // Check more frequently for smoother waving effect
      })
      .catch(function (err) {
        console.log("Unable to access microphone: " + err);
        // Optionally, display a message to the user if microphone access is denied
      });
  } else {
    console.log("getUserMedia not supported on your browser!");
    // Optionally, display a message to the user that microphone is required
  }
});

// Confetti functions (unchanged)
function triggerConfetti() {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.42 }
  });
}

function endlessConfetti() {
  setInterval(function () {
    confetti({
      particleCount: 400,
      spread: 300,
      origin: { y: 0 }
    });
  }, 1000);
}
