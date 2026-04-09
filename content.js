let recognition = null;
let finalTranscript = '';
let isRecording = false;

// Initialize SpeechRecognition if available
if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript + ' ';
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }
        // Could technically send interim updates to a live dashboard here
        // console.log("Real-time transcript:", finalTranscript + interimTranscript);
    };

    recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
    };

    // Auto-restart if stopped abruptly while still recording
    recognition.onend = () => {
        if (isRecording) {
            recognition.start();
        }
    };
} else {
    console.warn("Speech Recognition API not supported in this browser.");
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "start_capture") {
        if (!recognition) {
            sendResponse({ status: "error", message: "Not supported" });
            return true;
        }
        
        finalTranscript = '';
        isRecording = true;
        try {
            recognition.start();
        } catch(e) {
            console.log(e);
        }
        sendResponse({ status: "started" });
    } 
    else if (request.action === "stop_capture") {
        isRecording = false;
        if (recognition) {
            recognition.stop();
        }
        
        // Send transcript to background script for processing
        if (finalTranscript.trim().length > 0) {
            chrome.runtime.sendMessage({
                action: "process_transcript",
                transcript: finalTranscript,
                title: document.title
            });
        }
        
        sendResponse({ status: "stopped" });
    }
    return true;
});
