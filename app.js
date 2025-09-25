// Application state
let matchState = {
    homeTeam: '',
    awayTeam: '',
    homeScore: 0,
    awayScore: 0,
    homeLogoBlobUrl: null,
    awayLogoBlobUrl: null,
    matchStartTime: null,
    currentTime: 0,
    isRunning: false,
    status: 'En attente',
    events: [],
    timerInterval: null
};

// DOM elements
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');
const chronoTime = document.getElementById('chronoTime');
const matchStatus = document.getElementById('matchStatus');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const homeScoreEl = document.getElementById('homeScore');
const awayScoreEl = document.getElementById('awayScore');
const eventsList = document.getElementById('eventsList');
const exportCanvas = document.getElementById('exportCanvas');

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeTabs();
    initializeScoreControls();
    initializeChronoControls();
    initializeEventButtons();
    initializeLogoUploads();
    initializeExport();
    initializeTimeline();
});

// Tab system
function initializeTabs() {
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.dataset.tab;
            
            // Update active states
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            button.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// Logo upload system - Gallery only, no camera
function initializeLogoUploads() {
    // Home team logo elements
    const homeLogoFile = document.getElementById('homeLogoFile');
    const homeLogoBtn = document.getElementById('homeLogoBtn');
    const homeLogoUrl = document.getElementById('homeLogoUrl');
    const homeLogoUrlBtn = document.getElementById('homeLogoUrlBtn');
    const homeLogoDisplay = document.getElementById('homeLogo');

    // Away team logo elements
    const awayLogoFile = document.getElementById('awayLogoFile');
    const awayLogoBtn = document.getElementById('awayLogoBtn');
    const awayLogoUrl = document.getElementById('awayLogoUrl');
    const awayLogoUrlBtn = document.getElementById('awayLogoUrlBtn');
    const awayLogoDisplay = document.getElementById('awayLogo');

    // Button click handlers to trigger file input
    homeLogoBtn.addEventListener('click', (e) => {
        e.preventDefault();
        homeLogoFile.click();
    });

    awayLogoBtn.addEventListener('click', (e) => {
        e.preventDefault();
        awayLogoFile.click();
    });

    // File upload handlers - Gallery only
    homeLogoFile.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            handleLogoFileUpload(e.target.files[0], 'home', homeLogoDisplay);
        }
    });

    awayLogoFile.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            handleLogoFileUpload(e.target.files[0], 'away', awayLogoDisplay);
        }
    });

    // URL button handlers
    homeLogoUrlBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const url = homeLogoUrl.value.trim();
        if (url) {
            handleLogoUrlUpload(url, 'home', homeLogoDisplay);
        } else {
            alert('Veuillez entrer une URL valide');
        }
    });

    awayLogoUrlBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const url = awayLogoUrl.value.trim();
        if (url) {
            handleLogoUrlUpload(url, 'away', awayLogoDisplay);
        } else {
            alert('Veuillez entrer une URL valide');
        }
    });

    // Enter key for URL inputs
    homeLogoUrl.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const url = homeLogoUrl.value.trim();
            if (url) {
                handleLogoUrlUpload(url, 'home', homeLogoDisplay);
            }
        }
    });

    awayLogoUrl.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const url = awayLogoUrl.value.trim();
            if (url) {
                handleLogoUrlUpload(url, 'away', awayLogoDisplay);
            }
        }
    });
}

function handleLogoFileUpload(file, team, displayElement) {
    if (!file || !file.type.startsWith('image/')) {
        alert('Veuillez sélectionner un fichier image valide');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        createAndDisplayLogo(e.target.result, team, displayElement);
    };
    reader.onerror = () => {
        alert('Erreur lors de la lecture du fichier');
    };
    reader.readAsDataURL(file);
}

function handleLogoUrlUpload(url, team, displayElement) {
    if (!url.trim()) {
        alert('Veuillez entrer une URL valide');
        return;
    }

    // Create image element to test URL
    const img = new Image();
    
    img.onload = () => {
        createAndDisplayLogo(url, team, displayElement);
    };
    
    img.onerror = () => {
        alert('Impossible de charger l\'image depuis cette URL. Vérifiez que l\'URL est correcte et accessible.');
    };

    // Handle CORS by trying to load the image
    img.crossOrigin = 'anonymous';
    img.src = url;
}

function createAndDisplayLogo(src, team, displayElement) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
        // Set canvas size to 64x64
        canvas.width = 64;
        canvas.height = 64;
        
        // Clear canvas with white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 64, 64);
        
        // Calculate dimensions to fit image in 64x64 while maintaining aspect ratio
        const scale = Math.min(64 / img.width, 64 / img.height);
        const width = img.width * scale;
        const height = img.height * scale;
        const x = (64 - width) / 2;
        const y = (64 - height) / 2;
        
        // Draw the image
        ctx.drawImage(img, x, y, width, height);
        
        // Convert to data URL for storage
        const dataUrl = canvas.toDataURL('image/png');
        
        // Clean up previous blob URL if exists
        if (team === 'home' && matchState.homeLogoBlobUrl) {
            URL.revokeObjectURL(matchState.homeLogoBlobUrl);
        } else if (team === 'away' && matchState.awayLogoBlobUrl) {
            URL.revokeObjectURL(matchState.awayLogoBlobUrl);
        }
        
        // Store the data URL
        if (team === 'home') {
            matchState.homeLogoBlobUrl = dataUrl;
        } else {
            matchState.awayLogoBlobUrl = dataUrl;
        }
        
        // Display the logo immediately
        displayElement.innerHTML = `<img src="${dataUrl}" alt="Logo ${team}" style="width: 100%; height: 100%; object-fit: contain;">`;
        
        console.log(`Logo ${team} mis à jour avec succès depuis la galerie`);
    };
    
    img.onerror = () => {
        alert('Erreur lors du traitement de l\'image');
    };
    
    // Handle CORS for external URLs
    if (src.startsWith('http')) {
        img.crossOrigin = 'anonymous';
    }
    
    img.src = src;
}

// Score controls
function initializeScoreControls() {
    const scoreButtons = document.querySelectorAll('.score-btn');
    
    scoreButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const team = btn.dataset.team;
            const action = btn.dataset.action;
            
            if (team === 'home') {
                if (action === 'plus') {
                    matchState.homeScore++;
                } else if (action === 'minus' && matchState.homeScore > 0) {
                    matchState.homeScore--;
                }
                homeScoreEl.textContent = matchState.homeScore;
            } else {
                if (action === 'plus') {
                    matchState.awayScore++;
                } else if (action === 'minus' && matchState.awayScore > 0) {
                    matchState.awayScore--;
                }
                awayScoreEl.textContent = matchState.awayScore;
            }
        });
    });
}

// Chrono controls - Complete reset functionality
function initializeChronoControls() {
    startBtn.addEventListener('click', startChrono);
    pauseBtn.addEventListener('click', pauseChrono);
    resetBtn.addEventListener('click', resetChrono);
}

function startChrono() {
    if (!matchState.isRunning) {
        if (matchState.matchStartTime === null) {
            matchState.matchStartTime = Date.now() - matchState.currentTime;
        } else {
            matchState.matchStartTime = Date.now() - matchState.currentTime;
        }
        
        matchState.isRunning = true;
        matchState.status = 'En cours';
        
        matchState.timerInterval = setInterval(updateChrono, 1000);
        
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        
        updateStatusDisplay();
    }
}

function pauseChrono() {
    if (matchState.isRunning) {
        matchState.isRunning = false;
        matchState.status = 'En pause';
        
        clearInterval(matchState.timerInterval);
        matchState.timerInterval = null;
        
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        
        updateStatusDisplay();
    }
}

function resetChrono() {
    // Complete reset as requested
    matchState.isRunning = false;
    
    // Clear interval completely
    if (matchState.timerInterval) {
        clearInterval(matchState.timerInterval);
        matchState.timerInterval = null;
    }
    
    // Reset all time variables to initial state
    matchState.matchStartTime = null;
    matchState.currentTime = 0;
    matchState.status = 'En attente';
    
    // Reset display to 00:00
    chronoTime.textContent = '00:00';
    
    // Reset button states to initial state
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    
    updateStatusDisplay();
    
    console.log('Chrono complètement remis à zéro - 00:00');
}

function updateChrono() {
    if (matchState.isRunning && matchState.matchStartTime) {
        matchState.currentTime = Date.now() - matchState.matchStartTime;
        const minutes = Math.floor(matchState.currentTime / 60000);
        const seconds = Math.floor((matchState.currentTime % 60000) / 1000);
        chronoTime.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}

function updateStatusDisplay() {
    matchStatus.textContent = matchState.status;
    matchStatus.className = 'status';
    
    if (matchState.status === 'En cours') {
        matchStatus.classList.add('status--playing');
    } else if (matchState.status === 'En pause') {
        matchStatus.classList.add('status--paused');
    } else {
        matchStatus.classList.add('status--info');
    }
}

// Event system
function initializeEventButtons() {
    const eventButtons = document.querySelectorAll('.event-btn');
    
    eventButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const team = btn.dataset.team;
            const eventType = btn.dataset.event;
            addEvent(team, eventType);
        });
    });
}

function addEvent(team, eventType) {
    const currentMinute = Math.floor(matchState.currentTime / 60000);
    const teamName = team === 'home' ? 
        (document.getElementById('homeTeam').value || 'Domicile') : 
        (document.getElementById('awayTeam').value || 'Visiteur');
    
    const eventIcons = {
        goal: '⚽',
        yellow: '🟡',
        red: '🟥',
        substitution: '🔄'
    };
    
    const eventNames = {
        goal: 'But',
        yellow: 'Carton jaune',
        red: 'Carton rouge',
        substitution: 'Remplacement'
    };
    
    const event = {
        time: currentMinute,
        team: team,
        teamName: teamName,
        type: eventType,
        icon: eventIcons[eventType],
        name: eventNames[eventType],
        timestamp: Date.now()
    };
    
    matchState.events.push(event);
    updateTimeline();
}

// Timeline
function initializeTimeline() {
    document.getElementById('clearTimeline').addEventListener('click', () => {
        matchState.events = [];
        updateTimeline();
    });
}

function updateTimeline() {
    if (matchState.events.length === 0) {
        eventsList.innerHTML = '<p class="no-events">Aucun événement pour le moment</p>';
        return;
    }
    
    const sortedEvents = [...matchState.events].sort((a, b) => b.timestamp - a.timestamp);
    
    eventsList.innerHTML = sortedEvents.map(event => `
        <div class="timeline-event ${event.team}">
            <span class="timeline-time">${event.time}'</span>
            <span class="timeline-description">${event.icon} ${event.name} - ${event.teamName}</span>
        </div>
    `).join('');
}

// Export system - Properly handle logos from gallery
function initializeExport() {
    document.getElementById('generateExport').addEventListener('click', generateExportImage);
    document.getElementById('downloadExport').addEventListener('click', downloadExport);
    document.getElementById('shareWhatsApp').addEventListener('click', shareToWhatsApp);
}

function generateExportImage() {
    const canvas = exportCanvas;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = 400;
    canvas.height = 300;
    
    // Clear canvas and set background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw header
    ctx.fillStyle = '#1f2121';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('⚽ Match Live Score', canvas.width / 2, 30);
    
    // Get team names
    const homeTeamName = document.getElementById('homeTeam').value || 'Domicile';
    const awayTeamName = document.getElementById('awayTeam').value || 'Visiteur';
    
    // Draw team info
    const teamY = 80;
    const logoSize = 48;
    
    let loadedImages = 0;
    const totalImages = 2;
    
    function checkAllLoaded() {
        loadedImages++;
        if (loadedImages >= totalImages) {
            finishDrawing();
        }
    }
    
    // Home team logo
    if (matchState.homeLogoBlobUrl) {
        const homeImg = new Image();
        homeImg.onload = () => {
            ctx.drawImage(homeImg, 50, teamY, logoSize, logoSize);
            checkAllLoaded();
        };
        homeImg.onerror = () => {
            drawDefaultHomeLogo();
            checkAllLoaded();
        };
        homeImg.src = matchState.homeLogoBlobUrl;
    } else {
        drawDefaultHomeLogo();
        checkAllLoaded();
    }
    
    // Away team logo
    if (matchState.awayLogoBlobUrl) {
        const awayImg = new Image();
        awayImg.onload = () => {
            ctx.drawImage(awayImg, canvas.width - 50 - logoSize, teamY, logoSize, logoSize);
            checkAllLoaded();
        };
        awayImg.onerror = () => {
            drawDefaultAwayLogo();
            checkAllLoaded();
        };
        awayImg.src = matchState.awayLogoBlobUrl;
    } else {
        drawDefaultAwayLogo();
        checkAllLoaded();
    }
    
    function drawDefaultHomeLogo() {
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(50, teamY, logoSize, logoSize);
        ctx.fillStyle = '#666';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🏠', 50 + logoSize/2, teamY + logoSize/2 + 8);
    }
    
    function drawDefaultAwayLogo() {
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(canvas.width - 50 - logoSize, teamY, logoSize, logoSize);
        ctx.fillStyle = '#666';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('✈️', canvas.width - 50 - logoSize/2, teamY + logoSize/2 + 8);
    }
    
    function finishDrawing() {
        // Team names
        ctx.fillStyle = '#1f2121';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(homeTeamName, 74, teamY + logoSize + 20);
        ctx.fillText(awayTeamName, canvas.width - 74, teamY + logoSize + 20);
        
        // Score
        ctx.fillStyle = '#21808d';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${matchState.homeScore} - ${matchState.awayScore}`, canvas.width / 2, 120);
        
        // Time and status
        ctx.fillStyle = '#626c71';
        ctx.font = '18px Arial';
        ctx.fillText(chronoTime.textContent, canvas.width / 2, 150);
        ctx.fillText(matchState.status, canvas.width / 2, 175);
        
        // Recent events
        if (matchState.events.length > 0) {
            ctx.fillStyle = '#1f2121';
            ctx.font = 'bold 14px Arial';
            ctx.fillText('Derniers événements:', canvas.width / 2, 210);
            
            const recentEvents = [...matchState.events].slice(-3).reverse();
            recentEvents.forEach((event, index) => {
                ctx.font = '12px Arial';
                ctx.fillText(`${event.time}' ${event.icon} ${event.name} - ${event.teamName}`, 
                    canvas.width / 2, 230 + (index * 18));
            });
        }
        
        // Show download and share buttons
        document.getElementById('downloadExport').style.display = 'block';
        document.getElementById('shareWhatsApp').style.display = 'block';
    }
}

function downloadExport() {
    const link = document.createElement('a');
    link.download = 'match-score.png';
    link.href = exportCanvas.toDataURL();
    link.click();
}

function shareToWhatsApp() {
    exportCanvas.toBlob((blob) => {
        if (navigator.share) {
            const file = new File([blob], 'match-score.png', { type: 'image/png' });
            navigator.share({
                files: [file],
                title: 'Score du Match',
                text: 'Voici le score en direct !'
            });
        } else {
            // Fallback: download the image
            downloadExport();
            alert('Partagez l\'image téléchargée sur WhatsApp');
        }
    });
}

// Team name tracking
document.getElementById('homeTeam').addEventListener('input', (e) => {
    matchState.homeTeam = e.target.value;
});

document.getElementById('awayTeam').addEventListener('input', (e) => {
    matchState.awayTeam = e.target.value;
});