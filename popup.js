document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('start-btn');
    const stopBtn = document.getElementById('stop-btn');
    const statusText = document.getElementById('status-text');
    const indicator = document.getElementById('status-indicator');

    // Check current state
    chrome.storage.local.get(['isRecording'], (result) => {
        if (result.isRecording) {
            setRecordingUI();
        }
    });

    startBtn.addEventListener('click', async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        chrome.tabs.sendMessage(tab.id, { action: "start_capture" }, (response) => {
            if (response && response.status === "started") {
                chrome.storage.local.set({ isRecording: true });
                setRecordingUI();
            } else {
                statusText.innerText = "Error starting capture. Ensure you are on a webpage.";
            }
        });
    });

    stopBtn.addEventListener('click', async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        statusText.innerText = "Analyzing...";
        indicator.classList.remove('on');
        indicator.classList.add('off');
        startBtn.classList.add('hidden');
        stopBtn.classList.add('hidden');
        
        chrome.tabs.sendMessage(tab.id, { action: "stop_capture" }, (response) => {
            chrome.storage.local.set({ isRecording: false });
            if (response && response.status === "stopped") {
                statusText.innerText = "Analysis sent to Dashboard!";
                setTimeout(() => {
                    setReadyUI();
                }, 3000);
            } else {
                statusText.innerText = "Error stopping capture.";
                setReadyUI();
            }
        });
    });

    function setRecordingUI() {
        startBtn.classList.add('hidden');
        stopBtn.classList.remove('hidden');
        statusText.innerText = "Listening to Meeting...";
        indicator.classList.remove('off');
        indicator.classList.add('on');
    }

    function setReadyUI() {
        startBtn.classList.remove('hidden');
        stopBtn.classList.add('hidden');
        statusText.innerText = "Ready to capture";
        indicator.classList.add('off');
        indicator.classList.remove('on');
    }
});
