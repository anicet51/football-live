// Variables globales
let matchStartTime = null;
let matchTimer = null;
let isPaused = false;
let currentEventType = '';
let currentTeam = '';
let homeScore = 0;
let awayScore = 0;
let homeGoals = 0;
let awayGoals = 0;
let totalYellows = 0;
let totalReds = 0;
let events = {
    home: [],
    away: []
};

// Éléments DOM
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const matchTime = document.getElementById('matchTime');
const matchStatus = document.getElementById('matchStatus');
const homeScoreEl = document.getElementById('homeScore');
const awayScoreEl = document.getElementById('awayScore');
const homeEventsEl = document.getElementById('homeEvents');
const awayEventsEl = document.getElementById('awayEvents');
const eventModal = document.getElementById('eventModal');
const eventForm = document.getElementById('eventForm');
const substitutionDetails = document.getElementById('substitutionDetails');
const generateVisualBtn = document.getElementById('generateVisualBtn');
const downloadImageBtn = document.getElementById('downloadImageBtn');
const matchCanvas = document.getElementById('matchCanvas');
const canvasPreview = document.getElementById('canvasPreview');

// Initialisation des event listeners
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    initializeTabNavigation();
    updateDisplay();
    renderEvents();
    renderTimeline();
});

function initializeEventListeners() {
    startBtn.addEventListener('click', startMatch);
    pauseBtn.addEventListener('click', pauseMatch);
    resetBtn.addEventListener('click', resetMatch);
    eventForm.addEventListener('submit', handleEventSubmission);
    generateVisualBtn.addEventListener('click', generateMatchVisual);
    downloadImageBtn.addEventListener('click', downloadMatchImage);
    
    // Gestion de la fermeture du modal en cliquant à l'extérieur
    eventModal.addEventListener('click', function(e) {
        if (e.target === eventModal) {
            closeModal();
        }
    });
}

function initializeTabNavigation() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            // Retirer la classe active de tous les boutons et contenus
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(content => {
                content.classList.add('hidden');
                content.classList.remove('active');
            });
            
            // Activer le bouton et le contenu sélectionnés
            this.classList.add('active');
            const targetContent = document.getElementById(targetTab + 'Tab');
            if (targetContent) {
                targetContent.classList.remove('hidden');
                targetContent.classList.add('active');
            }
            
            // Mettre à jour la timeline si on bascule dessus
            if (targetTab === 'timeline') {
                renderTimeline();
            }
        });
    });
}

// Gestion du chronomètre
function startMatch() {
    if (!matchStartTime) {
        matchStartTime = Date.now();
    } else if (isPaused) {
        matchStartTime = Date.now() - (matchStartTime - matchStartTime);
    }
    
    isPaused = false;
    matchTimer = setInterval(updateTimer, 1000);
    
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    matchStatus.textContent = 'En cours';
    matchStatus.style.color = 'var(--color-success)';
}

function pauseMatch() {
    clearInterval(matchTimer);
    isPaused = true;
    
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    matchStatus.textContent = 'Pause';
    matchStatus.style.color = 'var(--color-warning)';
}

function resetMatch() {
    clearInterval(matchTimer);
    matchStartTime = null;
    isPaused = false;
    
    // Reset des scores et statistiques
    homeScore = 0;
    awayScore = 0;
    homeGoals = 0;
    awayGoals = 0;
    totalYellows = 0;
    totalReds = 0;
    
    // Reset des événements
    events.home = [];
    events.away = [];
    
    // Reset de l'interface
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    matchStatus.textContent = 'En attente';
    matchStatus.style.color = 'var(--color-text-secondary)';
    
    // Reset des noms d'équipes
    document.getElementById('homeTeamName').value = '';
    document.getElementById('awayTeamName').value = '';
    
    // Reset du canvas d'export
    downloadImageBtn.disabled = true;
    canvasPreview.innerHTML = '<p>Cliquez sur "Générer le Visuel" pour créer l\'image</p>';
    canvasPreview.classList.remove('has-image');
    
    updateDisplay();
    renderEvents();
    renderTimeline();
}

function updateTimer() {
    if (!matchStartTime || isPaused) return;
    
    const elapsed = Date.now() - matchStartTime;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    
    matchTime.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function getCurrentMatchTime() {
    if (!matchStartTime) return 1;
    const elapsed = Date.now() - matchStartTime;
    return Math.max(1, Math.floor(elapsed / 60000));
}

// Gestion des événements
function addEvent(team, eventType) {
    currentTeam = team;
    currentEventType = eventType;
    
    // Pré-remplir le temps avec le temps actuel du match
    document.getElementById('eventTime').value = getCurrentMatchTime();
    
    // Afficher/masquer les détails de remplacement
    if (eventType === 'substitution') {
        substitutionDetails.classList.remove('hidden');
        document.getElementById('playerOut').required = true;
        document.getElementById('playerIn').required = true;
    } else {
        substitutionDetails.classList.add('hidden');
        document.getElementById('playerOut').required = false;
        document.getElementById('playerIn').required = false;
    }
    
    // Ouvrir le modal
    eventModal.classList.remove('hidden');
    document.getElementById('playerName').focus();
}

function handleEventSubmission(e) {
    e.preventDefault();
    
    const playerName = document.getElementById('playerName').value;
    const eventTime = document.getElementById('eventTime').value;
    const playerOut = document.getElementById('playerOut').value;
    const playerIn = document.getElementById('playerIn').value;
    
    const eventData = {
        type: currentEventType,
        player: playerName,
        time: parseInt(eventTime),
        timestamp: Date.now()
    };
    
    if (currentEventType === 'substitution') {
        eventData.playerOut = playerOut;
        eventData.playerIn = playerIn;
        eventData.player = `${playerOut} ↔ ${playerIn}`;
    }
    
    // Ajouter l'événement à la liste appropriée
    events[currentTeam].push(eventData);
    
    // Mettre à jour les scores et statistiques
    updateScoresAndStats(currentTeam, currentEventType);
    
    // Mettre à jour l'affichage
    updateDisplay();
    renderEvents();
    renderTimeline();
    
    // Fermer le modal et réinitialiser le formulaire
    closeModal();
    eventForm.reset();
}

function updateScoresAndStats(team, eventType) {
    switch (eventType) {
        case 'goal':
            if (team === 'home') {
                homeScore++;
                homeGoals++;
            } else {
                awayScore++;
                awayGoals++;
            }
            break;
        case 'yellow':
            totalYellows++;
            break;
        case 'red':
            totalReds++;
            break;
    }
}

function updateDisplay() {
    homeScoreEl.textContent = homeScore;
    awayScoreEl.textContent = awayScore;
    document.getElementById('homeGoals').textContent = homeGoals;
    document.getElementById('awayGoals').textContent = awayGoals;
    document.getElementById('totalYellows').textContent = totalYellows;
    document.getElementById('totalReds').textContent = totalReds;
}

function renderEvents() {
    // Effacer les listes existantes
    homeEventsEl.innerHTML = '';
    awayEventsEl.innerHTML = '';
    
    // Trier les événements par temps (plus récent en premier)
    const sortedHomeEvents = [...events.home].sort((a, b) => b.time - a.time);
    const sortedAwayEvents = [...events.away].sort((a, b) => b.time - a.time);
    
    // Rendre les événements domicile
    sortedHomeEvents.forEach(event => {
        homeEventsEl.appendChild(createEventElement(event));
    });
    
    // Rendre les événements visiteur
    sortedAwayEvents.forEach(event => {
        awayEventsEl.appendChild(createEventElement(event));
    });
    
    // Afficher un message si aucun événement
    if (sortedHomeEvents.length === 0) {
        homeEventsEl.innerHTML = '<p style="text-align: center; color: var(--color-text-secondary); margin: var(--space-16) 0;">Aucun événement</p>';
    }
    
    if (sortedAwayEvents.length === 0) {
        awayEventsEl.innerHTML = '<p style="text-align: center; color: var(--color-text-secondary); margin: var(--space-16) 0;">Aucun événement</p>';
    }
}

function renderTimeline() {
    const timelineEvents = document.getElementById('timelineEvents');
    timelineEvents.innerHTML = '';
    
    // Combiner tous les événements et les trier par temps
    const allEvents = [];
    
    events.home.forEach(event => {
        allEvents.push({...event, team: 'home'});
    });
    
    events.away.forEach(event => {
        allEvents.push({...event, team: 'away'});
    });
    
    allEvents.sort((a, b) => a.time - b.time);
    
    if (allEvents.length === 0) {
        timelineEvents.innerHTML = '<p style="text-align: center; color: var(--color-text-secondary); padding: var(--space-24);">Aucun événement à afficher</p>';
        return;
    }
    
    allEvents.forEach(event => {
        const timelineItem = document.createElement('div');
        timelineItem.className = 'timeline-event';
        
        const homeTeamName = document.getElementById('homeTeamName').value || 'Équipe Domicile';
        const awayTeamName = document.getElementById('awayTeamName').value || 'Équipe Visiteur';
        const teamName = event.team === 'home' ? homeTeamName : awayTeamName;
        
        timelineItem.innerHTML = `
            <div class="timeline-time">${event.time}'</div>
            <div class="timeline-content">
                <div class="timeline-team">${teamName}</div>
                <div class="timeline-description">
                    ${getEventIcon(event.type)} ${getEventTypeText(event.type)} - ${event.player}
                    ${event.type === 'substitution' && event.playerOut && event.playerIn ? 
                        `<br><small>Sortie: ${event.playerOut}, Entrée: ${event.playerIn}</small>` : ''}
                </div>
            </div>
        `;
        
        timelineEvents.appendChild(timelineItem);
    });
}

function createEventElement(event) {
    const eventDiv = document.createElement('div');
    eventDiv.className = 'event-item';
    
    const eventIcon = getEventIcon(event.type);
    const eventTypeText = getEventTypeText(event.type);
    
    let eventContent = `
        <div class="event-header">
            <span class="event-type">${eventIcon} ${eventTypeText}</span>
            <span class="event-time">${event.time}'</span>
        </div>
        <div class="event-player">${event.player}</div>
    `;
    
    if (event.type === 'substitution' && event.playerOut && event.playerIn) {
        eventContent += `
            <div class="event-details">
                Sortie: ${event.playerOut}<br>
                Entrée: ${event.playerIn}
            </div>
        `;
    }
    
    eventDiv.innerHTML = eventContent;
    return eventDiv;
}

function getEventIcon(eventType) {
    const icons = {
        goal: '⚽',
        yellow: '🟨',
        red: '🟥',
        substitution: '🔄'
    };
    return icons[eventType] || '📝';
}

function getEventTypeText(eventType) {
    const texts = {
        goal: 'But',
        yellow: 'Carton Jaune',
        red: 'Carton Rouge',
        substitution: 'Remplacement'
    };
    return texts[eventType] || 'Événement';
}

function closeModal() {
    eventModal.classList.add('hidden');
    eventForm.reset();
    substitutionDetails.classList.add('hidden');
}

// Fonctions d'export pour WhatsApp
function generateMatchVisual() {
    const canvas = matchCanvas;
    const ctx = canvas.getContext('2d');
    
    // Dimensions du canvas
    canvas.width = 800;
    canvas.height = 1000;
    
    // Couleurs
    const bgColor = '#f5f5f5';
    const primaryColor = '#218d8d';
    const textColor = '#134252';
    const cardBgColor = '#ffffff';
    
    // Fond
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Titre
    ctx.fillStyle = textColor;
    ctx.font = 'bold 32px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Match de Football', canvas.width / 2, 60);
    
    // Noms des équipes et scores
    const homeTeamName = document.getElementById('homeTeamName').value || 'Équipe Domicile';
    const awayTeamName = document.getElementById('awayTeamName').value || 'Équipe Visiteur';
    
    // Fond du score
    ctx.fillStyle = cardBgColor;
    ctx.fillRect(50, 100, canvas.width - 100, 120);
    ctx.strokeStyle = '#e5e5e5';
    ctx.lineWidth = 1;
    ctx.strokeRect(50, 100, canvas.width - 100, 120);
    
    // Équipe domicile
    ctx.fillStyle = textColor;
    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(homeTeamName, 80, 140);
    
    // Score domicile
    ctx.fillStyle = primaryColor;
    ctx.font = 'bold 48px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(homeScore.toString(), canvas.width / 2 - 60, 175);
    
    // Séparateur
    ctx.fillStyle = textColor;
    ctx.font = 'bold 36px Arial, sans-serif';
    ctx.fillText('-', canvas.width / 2, 175);
    
    // Score visiteur
    ctx.fillStyle = primaryColor;
    ctx.font = 'bold 48px Arial, sans-serif';
    ctx.fillText(awayScore.toString(), canvas.width / 2 + 60, 175);
    
    // Équipe visiteur
    ctx.fillStyle = textColor;
    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(awayTeamName, canvas.width - 80, 140);
    
    // Temps de match
    ctx.fillStyle = textColor;
    ctx.font = '20px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(matchTime.textContent, canvas.width / 2, 200);
    
    // Événements
    let yOffset = 280;
    
    // Titre des événements
    ctx.fillStyle = textColor;
    ctx.font = 'bold 28px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Événements du Match', canvas.width / 2, yOffset);
    yOffset += 40;
    
    // Combiner et trier tous les événements
    const allEvents = [];
    events.home.forEach(event => allEvents.push({...event, team: 'home'}));
    events.away.forEach(event => allEvents.push({...event, team: 'away'}));
    allEvents.sort((a, b) => a.time - b.time);
    
    if (allEvents.length === 0) {
        ctx.fillStyle = '#888';
        ctx.font = '18px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Aucun événement enregistré', canvas.width / 2, yOffset + 30);
    } else {
        allEvents.forEach((event, index) => {
            if (yOffset > canvas.height - 100) return; // Éviter de dépasser
            
            // Fond de l'événement
            ctx.fillStyle = '#f8f9fa';
            ctx.fillRect(60, yOffset, canvas.width - 120, 60);
            ctx.strokeStyle = '#e9ecef';
            ctx.lineWidth = 1;
            ctx.strokeRect(60, yOffset, canvas.width - 120, 60);
            
            // Temps de l'événement
            ctx.fillStyle = primaryColor;
            ctx.font = 'bold 16px Arial, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(`${event.time}'`, 80, yOffset + 25);
            
            // Équipe
            const teamName = event.team === 'home' ? homeTeamName : awayTeamName;
            ctx.fillStyle = textColor;
            ctx.font = 'bold 16px Arial, sans-serif';
            ctx.fillText(teamName, 140, yOffset + 25);
            
            // Type d'événement et joueur
            ctx.fillStyle = '#666';
            ctx.font = '14px Arial, sans-serif';
            ctx.fillText(`${getEventIcon(event.type)} ${getEventTypeText(event.type)} - ${event.player}`, 80, yOffset + 45);
            
            yOffset += 70;
        });
    }
    
    // Statistiques finales
    yOffset += 20;
    if (yOffset < canvas.height - 150) {
        ctx.fillStyle = cardBgColor;
        ctx.fillRect(50, yOffset, canvas.width - 100, 100);
        ctx.strokeStyle = '#e5e5e5';
        ctx.lineWidth = 1;
        ctx.strokeRect(50, yOffset, canvas.width - 100, 100);
        
        ctx.fillStyle = textColor;
        ctx.font = 'bold 20px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Statistiques', canvas.width / 2, yOffset + 30);
        
        ctx.font = '16px Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`Buts: ${homeGoals} - ${awayGoals}`, 80, yOffset + 55);
        ctx.fillText(`Cartons: ${totalYellows} jaunes, ${totalReds} rouges`, 80, yOffset + 75);
    }
    
    // Convertir en image et afficher
    const imageData = canvas.toDataURL('image/png');
    canvasPreview.innerHTML = `<img src="${imageData}" alt="Visuel du match">`;
    canvasPreview.classList.add('has-image');
    downloadImageBtn.disabled = false;
}

function downloadMatchImage() {
    const canvas = matchCanvas;
    const homeTeamName = document.getElementById('homeTeamName').value || 'Equipe_Domicile';
    const awayTeamName = document.getElementById('awayTeamName').value || 'Equipe_Visiteur';
    const fileName = `Match_${homeTeamName}_vs_${awayTeamName}_${homeScore}-${awayScore}.png`;
    
    // Créer un lien de téléchargement
    const link = document.createElement('a');
    link.download = fileName;
    link.href = canvas.toDataURL('image/png');
    
    // Déclencher le téléchargement
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Fonctions utilitaires
function formatTime(timestamp) {
    const date = new Date(timestamp);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

// Gestion du clavier pour le modal
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && !eventModal.classList.contains('hidden')) {
        closeModal();
    }
});