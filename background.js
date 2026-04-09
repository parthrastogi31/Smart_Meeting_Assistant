chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "process_transcript") {
        
        // Use a placeholder title or clean up document title
        const meetingTitle = request.title.replace(' - Google Meet', '').trim() || "Captured Meeting";

        fetch('http://localhost:8000/api/meetings/capture', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                transcript: request.transcript,
                meeting_title: meetingTitle
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log("Successfully processed meeting:", data);
            // Could trigger a chrome notification here
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icon.png', // Requires an icon.png in extension folder, will fail silently if missing and no default is set
                title: 'Meeting Analyzed',
                message: 'Your meeting notes and action items are ready!'
            });
        })
        .catch(err => {
            console.error("Error sending transcript to backend:", err);
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icon.png',
                title: 'Analysis Failed',
                message: 'Could not connect to the Backend API. Ensure python server is running.'
            });
        });
        
        sendResponse({status: "processing"});
    }
    return true;
});
