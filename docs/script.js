document.addEventListener("DOMContentLoaded", function () {
  const secretKey = "your-secret-passphrase"; // Change to a secure passphrase

  const isMobile = /Mobi|Android/i.test(navigator.userAgent);
  const blowThreshold = isMobile ? 30 : 80;
  const waveThreshold = isMobile ? 20 : 60;

  const candle = document.getElementById("mainCandle");
  const flame = candle.querySelector(".flame");
  const audio = new Audio('hbd.mp3');

  let audioContext;
  let analyser;
  let microphone;

  const makeContainer = document.getElementById('makecontainer');
  const linkMaker = document.getElementById('linkmaker');
  const shareLinkInput = document.getElementById('shareLinkInput');
  const copyLinkButton = document.getElementById('copyLinkButton');
  const vignette = document.getElementById('vignette');
  const textPath = document.getElementById('textPath');
  const svgText = document.getElementById('svgText');
  const fontSlider = document.getElementById('fontSlider');
  const hueSlider = document.getElementById('hueShift');
  const input = document.getElementById('textInput');
  const body = document.body;
  const cakeImage = document.getElementById('cakeImage');

  // Optional: fallback blow button

  function getAverageVolume() {
    if (!analyser) return 0;
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
    if (!candle.classList.contains("out")) {
      if (averageVolume > waveThreshold && averageVolume < blowThreshold) {
        flame.classList.add("blowing");
      } else {
        flame.classList.remove("blowing");
      }

      if (averageVolume > blowThreshold) {
        blowOutCandle();
      }
    }
  }

  function blowOutCandle() {
    if (!candle.classList.contains("out")) {
      candle.classList.add("out");
      flame.classList.remove("blowing");
      triggerConfetti();
      endlessConfetti();
      audio.play();

      if (!vignette.classList.contains('hidden')) {
        vignette.classList.add('hidden');
      }

      if (decryptedText) {
        textPath.textContent = decryptedText;
      }

      blowButton.style.display = "none"; // Hide fallback after used
    }
  }

  function triggerConfetti() {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.42 } });
  }

  function endlessConfetti() {
    setInterval(() => {
      confetti({ particleCount: 400, spread: 300, origin: { y: 0 } });
    }, 1000);
  }

  function applyCustomizations(text, fontSize, hueShift) {
    textPath.textContent = text || " ";
    svgText.style.fontSize = `${fontSize}px`;
    body.style.filter = `hue-rotate(${hueShift}deg)`;
    cakeImage.style.filter = `hue-rotate(${hueShift}deg)`;
  }

  function generateShareLink() {
    const originalText = input.value || "Happiest Birthday To You!";
    const encrypted = CryptoJS.AES.encrypt(originalText, secretKey).toString();
    const safeEncrypted = encodeURIComponent(encrypted);
    const currentFontSize = fontSlider.value;
    const currentHueShift = hueSlider.value;
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?text=${safeEncrypted}&fontSize=${currentFontSize}&hueShift=${currentHueShift}`;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const paramText = urlParams.get('text');
  const paramFontSize = urlParams.get('fontSize');
  const paramHueShift = urlParams.get('hueShift');

  let decryptedText = null;

  if (paramText && paramFontSize && paramHueShift) {
    makeContainer.classList.add('hidden');
    linkMaker.classList.add('hidden');
    vignette.classList.remove('hidden');

    try {
      const bytes = CryptoJS.AES.decrypt(decodeURIComponent(paramText), secretKey);
      decryptedText = bytes.toString(CryptoJS.enc.Utf8);
      applyCustomizations("Blow the candle!", paramFontSize, paramHueShift);
      textPath.textContent = "Blow the candle!";
    } catch (e) {
      console.error("Failed to decrypt text:", e);
      textPath.textContent = "Error loading message!";
    }

    // Show fallback on mobile
    if (isMobile) {
      setTimeout(() => {
        blowButton.style.display = "block";
      }, 3000); // Give user a few seconds to try blowing
    }

  } else {
    makeContainer.classList.remove('hidden');
    linkMaker.classList.remove('hidden');
    vignette.classList.add('hidden');

    input.value = textPath.textContent;
    applyCustomizations(input.value, fontSlider.value, hueSlider.value);
    shareLinkInput.value = generateShareLink();

    input.addEventListener('input', () => {
      applyCustomizations(input.value, fontSlider.value, hueSlider.value);
      shareLinkInput.value = generateShareLink();
    });

    fontSlider.addEventListener('input', () => {
      applyCustomizations(input.value, fontSlider.value, hueSlider.value);
      shareLinkInput.value = generateShareLink();
    });

    hueSlider.addEventListener('input', () => {
      applyCustomizations(input.value, fontSlider.value, hueSlider.value);
      shareLinkInput.value = generateShareLink();
    });

    copyLinkButton.addEventListener('click', () => {
      shareLinkInput.select();
      document.execCommand('copy');
      copyLinkButton.textContent = 'Copied!';
      setTimeout(() => {
        copyLinkButton.textContent = 'Copy Link';
      }, 2000);
    });
  }

  // Mic setup
  if (navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);
        analyser.fftSize = 256;
        setInterval(checkAudioLevel, 100);
      })
      .catch(err => {
        console.log("Unable to access microphone: " + err);
        if (isMobile) {
          blowButton.style.display = "block"; // fallback if mic denied
        }
      });
  } else {
    console.log("getUserMedia not supported!");
    if (isMobile) {
      blowButton.style.display = "block";
    }
  }
});
