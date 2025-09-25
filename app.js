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
    loadLocalData();
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

// Logo upload system - Mobile-only file upload - Fixed version
function initializeLogoUploads() {
    const homeLogoFile = document.getElementById('homeLogoFile');
    const homeLogoDisplay = document.getElementById('homeLogo');
    const awayLogoFile = document.getElementById('awayLogoFile');
    const awayLogoDisplay = document.getElementById('awayLogo');

    // Make sure the file inputs are properly set up
    console.log('Logo inputs found:', homeLogoFile, awayLogoFile);

    // Direct event listeners on file inputs
    homeLogoFile.addEventListener('change', (e) => {
        console.log('Home logo file changed:', e.target.files);
        if (e.target.files && e.target.files[0]) {
            handleLogoFileUpload(e.target.files[0], 'home', homeLogoDisplay);
        }
    });

    awayLogoFile.addEventListener('change', (e) => {
        console.log('Away logo file changed:', e.target.files);
        if (e.target.files && e.target.files[0]) {
            handleLogoFileUpload(e.target.files[0], 'away', awayLogoDisplay);
        }
    });

    // Also add click handlers to the labels as backup
    const homeLabel = document.querySelector('label[for="homeLogoFile"]');
    const awayLabel = document.querySelector('label[for="awayLogoFile"]');

    if (homeLabel) {
        homeLabel.addEventListener('click', (e) => {
            console.log('Home logo label clicked');
            e.preventDefault();
            homeLogoFile.click();
        });
    }

    if (awayLabel) {
        awayLabel.addEventListener('click', (e) => {
            console.log('Away logo label clicked');
            e.preventDefault();
            awayLogoFile.click();
        });
    }
}

function handleLogoFileUpload(file, team, displayElement) {
    console.log('Processing logo file:', file.name, 'for team:', team);
    
    if (!file || !file.type.startsWith('image/')) {
        alert('Veuillez sélectionner un fichier image valide');
        return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('L\'image est trop volumineuse. Veuillez choisir une image de moins de 5MB.');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        processAndDisplayLogo(e.target.result, team, displayElement);
    };
    reader.onerror = () => {
        alert('Erreur lors de la lecture du fichier');
    };
    reader.readAsDataURL(file);
}

function processAndDisplayLogo(src, team, displayElement) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
        // Set canvas size to 80x80 for better mobile display
        canvas.width = 80;
        canvas.height = 80;
        
        // Clear canvas with white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 80, 80);
        
        // Calculate dimensions to fit image while maintaining aspect ratio
        const scale = Math.min(80 / img.width, 80 / img.height);
        const width = img.width * scale;
        const height = img.height * scale;
        const x = (80 - width) / 2;
        const y = (80 - height) / 2;
        
        // Draw the image
        ctx.drawImage(img, x, y, width, height);
        
        // Convert to data URL for storage
        const dataUrl = canvas.toDataURL('image/png', 0.8);
        
        // Clean up previous blob URL if exists
        if (team === 'home' && matchState.homeLogoBlobUrl) {
            if (matchState.homeLogoBlobUrl.startsWith('blob:')) {
                URL.revokeObjectURL(matchState.homeLogoBlobUrl);
            }
        } else if (team === 'away' && matchState.awayLogoBlobUrl) {
            if (matchState.awayLogoBlobUrl.startsWith('blob:')) {
                URL.revokeObjectURL(matchState.awayLogoBlobUrl);
            }
        }
        
        // Store the data URL
        if (team === 'home') {
            matchState.homeLogoBlobUrl = dataUrl;
        } else {
            matchState.awayLogoBlobUrl = dataUrl;
        }
        
        // Display the logo immediately
        displayElement.innerHTML = `<img src="${dataUrl}" alt="Logo ${team}" style="width: 100%; height: 100%; object-fit: contain;">`;
        
        // Save to local storage
        saveLocalData();
        
        // Show visual feedback
        displayElement.style.transform = 'scale(1.05)';
        setTimeout(() => {
            displayElement.style.transform = 'scale(1)';
        }, 200);
        
        console.log(`Logo ${team} mis à jour avec succès`);
    };
    
    img.onerror = () => {
        alert('Erreur lors du traitement de l\'image');
    };
    
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
            
            // Visual feedback
            btn.style.transform = 'scale(0.95)';
            setTimeout(() => {
                btn.style.transform = 'scale(1)';
            }, 100);
            
            saveLocalData();
        });
    });
}

// Chrono controls - Fixed reset function
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
        saveLocalData();
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
        saveLocalData();
    }
}

function resetChrono() {
    // Stop the timer completely
    matchState.isRunning = false;
    
    // Clear any existing interval
    if (matchState.timerInterval) {
        clearInterval(matchState.timerInterval);
        matchState.timerInterval = null;
    }
    
    // Reset all time-related variables to initial state
    matchState.matchStartTime = null;
    matchState.currentTime = 0;
    matchState.status = 'En attente';
    
    // Reset display to 00:00
    chronoTime.textContent = '00:00';
    
    // Reset button states to initial state
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    
    updateStatusDisplay();
    saveLocalData();
    
    console.log('Chrono complètement remis à zéro');
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
    saveLocalData();
    
    // Show success feedback
    const btn = document.querySelector(`[data-team="${team}"][data-event="${eventType}"]`);
    if (btn) {
        btn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            btn.style.transform = 'scale(1)';
        }, 150);
    }
}

// Timeline
function initializeTimeline() {
    document.getElementById('clearTimeline').addEventListener('click', () => {
        if (confirm('Êtes-vous sûr de vouloir vider la timeline ?')) {
            matchState.events = [];
            updateTimeline();
            saveLocalData();
        }
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

// Export system
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
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], 'match-score.png', { type: 'image/png' })] })) {
            const file = new File([blob], 'match-score.png', { type: 'image/png' });
            navigator.share({
                files: [file],
                title: 'Score du Match',
                text: 'Voici le score en direct !'
            }).catch((error) => {
                console.log('Erreur lors du partage:', error);
                downloadExport();
                alert('Partagez l\'image téléchargée sur WhatsApp');
            });
        } else {
            // Fallback: download the image
            downloadExport();
            alert('Partagez l\'image téléchargée sur WhatsApp');
        }
    });
}

// Local storage functions
function saveLocalData() {
    try {
        const dataToSave = {
            homeTeam: document.getElementById('homeTeam').value,
            awayTeam: document.getElementById('awayTeam').value,
            homeScore: matchState.homeScore,
            awayScore: matchState.awayScore,
            homeLogoBlobUrl: matchState.homeLogoBlobUrl,
            awayLogoBlobUrl: matchState.awayLogoBlobUrl,
            currentTime: matchState.currentTime,
            status: matchState.status,
            events: matchState.events
        };
        localStorage.setItem('footballMatch', JSON.stringify(dataToSave));
    } catch (error) {
        console.log('Erreur sauvegarde locale:', error);
    }
}

function loadLocalData() {
    try {
        const savedData = localStorage.getItem('footballMatch');
        if (savedData) {
            const data = JSON.parse(savedData);
            
            // Restore team names
            if (data.homeTeam) document.getElementById('homeTeam').value = data.homeTeam;
            if (data.awayTeam) document.getElementById('awayTeam').value = data.awayTeam;
            
            // Restore scores
            if (data.homeScore !== undefined) {
                matchState.homeScore = data.homeScore;
                homeScoreEl.textContent = matchState.homeScore;
            }
            if (data.awayScore !== undefined) {
                matchState.awayScore = data.awayScore;
                awayScoreEl.textContent = matchState.awayScore;
            }
            
            // Restore logos
            if (data.homeLogoBlobUrl) {
                matchState.homeLogoBlobUrl = data.homeLogoBlobUrl;
                document.getElementById('homeLogo').innerHTML = `<img src="${data.homeLogoBlobUrl}" alt="Logo home" style="width: 100%; height: 100%; object-fit: contain;">`;
            }
            if (data.awayLogoBlobUrl) {
                matchState.awayLogoBlobUrl = data.awayLogoBlobUrl;
                document.getElementById('awayLogo').innerHTML = `<img src="${data.awayLogoBlobUrl}" alt="Logo away" style="width: 100%; height: 100%; object-fit: contain;">`;
            }
            
            // Restore events
            if (data.events) {
                matchState.events = data.events;
                updateTimeline();
            }
            
            // Restore time (but not running state)
            if (data.currentTime) {
                matchState.currentTime = data.currentTime;
                const minutes = Math.floor(matchState.currentTime / 60000);
                const seconds = Math.floor((matchState.currentTime % 60000) / 1000);
                chronoTime.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        }
    } catch (error) {
        console.log('Erreur chargement données locales:', error);
    }
}

// Team name tracking
document.getElementById('homeTeam').addEventListener('input', (e) => {
    matchState.homeTeam = e.target.value;
    saveLocalData();
});

document.getElementById('awayTeam').addEventListener('input', (e) => {
    matchState.awayTeam = e.target.value;
    saveLocalData();
});