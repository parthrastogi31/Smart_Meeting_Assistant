const API_BASE = 'http://localhost:8000/api';

document.addEventListener('DOMContentLoaded', () => {
    const refreshBtn = document.getElementById('refresh-btn');
    const copyNotesBtn = document.getElementById('copy-notes-btn');
    
    refreshBtn.addEventListener('click', fetchMeetings);
    copyNotesBtn.addEventListener('click', copyNotes);

    // Initial fetch
    fetchMeetings();
});

async function fetchMeetings() {
    const listEl = document.getElementById('meetings-list');
    listEl.innerHTML = '<div class="loading-state">Loading meetings...</div>';
    
    try {
        const response = await fetch(`${API_BASE}/meetings`);
        if (!response.ok) throw new Error('Network response was not ok');
        const meetings = await response.json();
        
        renderMeetingsList(meetings);
    } catch (error) {
        console.error('Error fetching meetings:', error);
        listEl.innerHTML = '<div class="loading-state" style="color: var(--danger)">Make sure the backend is running!</div>';
    }
}

function renderMeetingsList(meetings) {
    const listEl = document.getElementById('meetings-list');
    listEl.innerHTML = '';
    
    if (meetings.length === 0) {
        listEl.innerHTML = '<div class="loading-state">No meetings captured yet. Use the extension to capture one!</div>';
        return;
    }
    
    meetings.forEach((meeting, index) => {
        const dateObj = new Date(meeting.date);
        const dateStr = dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        const itemEl = document.createElement('div');
        itemEl.className = 'meeting-item';
        itemEl.innerHTML = `
            <div class="meeting-item-title">${meeting.title || 'Untitled Meeting'}</div>
            <div class="meeting-item-date">${dateStr}</div>
        `;
        
        itemEl.addEventListener('click', () => {
            // Remove selected class from all
            document.querySelectorAll('.meeting-item').forEach(el => el.classList.remove('selected'));
            itemEl.classList.add('selected');
            
            showMeetingDetails(meeting);
        });
        
        listEl.appendChild(itemEl);
        
        // Auto-select the first one
        if (index === 0) {
            itemEl.click();
        }
    });
}

function showMeetingDetails(meeting) {
    document.getElementById('empty-state').classList.add('hidden');
    const detailsEl = document.getElementById('meeting-details');
    detailsEl.classList.remove('hidden');
    
    // Add simple entrance animation by re-triggering class
    detailsEl.style.animation = 'none';
    detailsEl.offsetHeight; /* trigger reflow */
    detailsEl.style.animation = 'fadeInUp 0.4s ease-out forwards';
    
    const dateObj = new Date(meeting.date);
    document.getElementById('detail-title').textContent = meeting.title || 'Untitled Meeting';
    document.getElementById('detail-date').textContent = dateObj.toLocaleString();
    
    document.getElementById('detail-summary').textContent = meeting.analysis.executive_summary;
    document.getElementById('detail-decisions').textContent = meeting.analysis.context_and_decisions;
    
}

function copyNotes() {
    const title = document.getElementById('detail-title').textContent;
    const date = document.getElementById('detail-date').textContent;
    const summary = document.getElementById('detail-summary').textContent;
    const decisions = document.getElementById('detail-decisions').textContent;
    
    const textToCopy = `Meeting: ${title}\nDate: ${date}\n\nExecutive Summary:\n${summary}\n\nContext & Decisions:\n${decisions}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(textToCopy).then(() => {
        const btn = document.getElementById('copy-notes-btn');
        const originalText = btn.textContent;
        btn.textContent = 'Copied!';
        btn.classList.add('primary');
        btn.classList.remove('secondary');
        
        setTimeout(() => {
            btn.textContent = originalText;
            btn.classList.remove('primary');
            btn.classList.add('secondary');
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
}

