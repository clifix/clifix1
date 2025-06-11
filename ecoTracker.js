const EcoTracker = (() => {
    // DOM Elements
    const elements = {
        loginPrompt: document.querySelector('.login-prompt'),
        trackerDashboard: document.querySelector('.tracker-dashboard'),
        usernameDisplay: document.getElementById('username-display'),
        greenScore: document.getElementById('green-score'),
        carbonSaved: document.getElementById('carbon-saved'),
        energySaved: document.getElementById('energy-saved'),
        waterSaved: document.getElementById('water-saved'),
        actionsGrid: document.querySelector('.actions-grid'),
        challengeDescription: document.getElementById('challenge-description'),
        challengeProgress: document.getElementById('challenge-progress'),
        challengeCurrent: document.getElementById('challenge-current'),
        challengeTarget: document.getElementById('challenge-target'),
        claimRewardBtn: document.getElementById('claim-reward-btn'),
        streakCount: document.getElementById('streak-count'),
        progressRingFill: document.querySelector('.progress-ring-fill'),
        progressText: document.querySelector('.progress-text'),
        climateImpactSection: document.getElementById('climate-impact')
    };

    // Challenge templates
    const allChallenges = [
        { name: "Reduce plastic use by 50% this week", action: "reusable", target: 10 },
        { name: "Take 5 bike trips this week", action: "bike", target: 5 },
        { name: "Have 3 vegetarian meals this week", action: "vegetarian", target: 3 },
        { name: "Use public transport 3 times this week", action: "publicTransport", target: 3 },
        { name: "Recycle 10 items this week", action: "recycle", target: 10 }
    ];

    // App state
    let state = {
        user: {
            name: '',
            level: 'Bronze',
            streak: 1,
            lastActive: null
        },
        stats: {
            carbonSaved: 0,
            energySaved: 0,
            waterSaved: 0,
            greenScore: 0,
            treesSaved: 0
        },
        actions: {
            bike: { count: 0, points: 5, co2: 0.4, energy: 0.3, water: 0 },
            recycle: { count: 0, points: 3, co2: 0.125, energy: 0.1, water: 0.5 },
            vegetarian: { count: 0, points: 7, co2: 1.5, energy: 0.8, water: 1.2 },
            publicTransport: { count: 0, points: 4, co2: 0.8, energy: 0.5, water: 0 },
            reusable: { count: 0, points: 2, co2: 0.1, energy: 0.05, water: 0.1 }
        },
        challenge: {
            name: "",
            action: "",
            current: 0,
            target: 0,
            reward: 50,
            claimed: false,
            index: 0
        },
        achievements: [
            { id: 'starter', name: 'Green Starter', description: 'Logged your first eco action', unlocked: false },
            { id: 'champion', name: 'Eco Champion', description: 'Complete 50 actions', unlocked: false },
            { id: 'hero', name: 'Planet Hero', description: 'Reach 1000kg CO₂ saved', unlocked: false },
            { id: 'streak7', name: '1-Week Streak', description: 'Log an action 7 days in a row', unlocked: false },
            { id: 'streak14', name: 'Consistency Star', description: 'Log an action 14 days in a row', unlocked: false },
            { id: 'streak30', name: 'Monthly Hero', description: 'Log an action 30 days in a row', unlocked: false },
            { id: 'actions200', name: 'Action Master', description: 'Perform 200 eco actions', unlocked: false },
            { id: 'water500', name: 'Water Saver', description: 'Save 500 liters of water', unlocked: false },
            { id: 'energy500', name: 'Energy Saver', description: 'Save 500 kWh of energy', unlocked: false }
        ],
        history: []
    };

    // Helper: YYYY-MM-DD for today
    const getToday = () => {
        const d = new Date();
        return d.toISOString().split('T')[0];
    };

    // Hide climate impact section by default (on load)
    if (elements.climateImpactSection)
        elements.climateImpactSection.style.display = 'none';

    // Initialize from localStorage or fresh for new users
    const initState = (username) => {
        const savedUser = JSON.parse(localStorage.getItem('user'));
        const savedState = JSON.parse(localStorage.getItem('ecoTrackerState'));
        if (savedState && savedUser && savedUser.email && state.user.name === username) {
            state = { ...state, ...savedState };
            updateStats();
        } else {
            state.user.name = username;
            state.user.level = 'Bronze';
            state.user.streak = 1;
            state.user.lastActive = null;
            state.stats = {
                carbonSaved: 0,
                energySaved: 0,
                waterSaved: 0,
                greenScore: 0,
                treesSaved: 0
            };
            state.actions = {
                bike: { count: 0, points: 5, co2: 0.4, energy: 0.3, water: 0 },
                recycle: { count: 0, points: 3, co2: 0.125, energy: 0.1, water: 0.5 },
                vegetarian: { count: 0, points: 7, co2: 1.5, energy: 0.8, water: 1.2 },
                publicTransport: { count: 0, points: 4, co2: 0.8, energy: 0.5, water: 0 },
                reusable: { count: 0, points: 2, co2: 0.1, energy: 0.05, water: 0.1 }
            };
            state.achievements = [
                { id: 'starter', name: 'Green Starter', description: 'Logged your first eco action', unlocked: false },
                { id: 'champion', name: 'Eco Champion', description: 'Complete 50 actions', unlocked: false },
                { id: 'hero', name: 'Planet Hero', description: 'Reach 1000kg CO₂ saved', unlocked: false },
                { id: 'streak7', name: '1-Week Streak', description: 'Log an action 7 days in a row', unlocked: false },
                { id: 'streak14', name: 'Consistency Star', description: 'Log an action 14 days in a row', unlocked: false },
                { id: 'streak30', name: 'Monthly Hero', description: 'Log an action 30 days in a row', unlocked: false },
                { id: 'actions200', name: 'Action Master', description: 'Perform 200 eco actions', unlocked: false },
                { id: 'water500', name: 'Water Saver', description: 'Save 500 liters of water', unlocked: false },
                { id: 'energy500', name: 'Energy Saver', description: 'Save 500 kWh of energy', unlocked: false }
            ];
            state.history = [];
            setWeeklyChallenge(0);
            saveState();
        }
    };

    // Save to localStorage
    const saveState = () => {
        localStorage.setItem('ecoTrackerState', JSON.stringify(state));
    };

    // Update derived stats
    const updateStats = () => {
        let totalCO2 = 0, totalEnergy = 0, totalWater = 0, totalPoints = 0;
        Object.values(state.actions).forEach(action => {
            totalCO2 += action.count * action.co2;
            totalEnergy += action.count * action.energy;
            totalWater += action.count * action.water;
            totalPoints += action.count * action.points;
        });
        state.stats.carbonSaved = totalCO2;
        state.stats.energySaved = totalEnergy;
        state.stats.waterSaved = totalWater;
        const maxPossiblePoints = Object.values(state.actions).reduce((sum, action) => sum + (action.points * 7), 0);
        state.stats.greenScore = Math.min(Math.round((totalPoints / maxPossiblePoints) * 100), 100);
        state.stats.treesSaved = Math.floor(totalCO2 / 5);
        checkAchievements();
        saveState();
    };

    // Check & unlock achievements
    const checkAchievements = () => {
        const totalActions = Object.values(state.actions).reduce((sum, action) => sum + action.count, 0);
        const { streak } = state.user;
        if (totalActions > 0 && !getAch('starter').unlocked) unlockAch('starter');
        if (totalActions >= 50 && !getAch('champion').unlocked) unlockAch('champion');
        if (state.stats.carbonSaved >= 1000 && !getAch('hero').unlocked) unlockAch('hero');
        if (streak >= 7 && !getAch('streak7').unlocked) unlockAch('streak7');
        if (streak >= 14 && !getAch('streak14').unlocked) unlockAch('streak14');
        if (streak >= 30 && !getAch('streak30').unlocked) unlockAch('streak30');
        if (totalActions >= 200 && !getAch('actions200').unlocked) unlockAch('actions200');
        if (state.stats.waterSaved >= 500 && !getAch('water500').unlocked) unlockAch('water500');
        if (state.stats.energySaved >= 500 && !getAch('energy500').unlocked) unlockAch('energy500');
    };

    function getAch(id) {
        return state.achievements.find(a => a.id === id);
    }
    function unlockAch(id) {
        const ach = getAch(id);
        if (ach && !ach.unlocked) {
            ach.unlocked = true;
            showAchievementToast(ach.name);
        }
    }

    // Show achievement toast
    const showAchievementToast = (achievementName) => {
        const toast = document.createElement('div');
        toast.className = 'achievement-toast';
        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fas fa-trophy"></i>
            </div>
            <div class="toast-content">
                <h4>Achievement Unlocked!</h4>
                <p>${achievementName}</p>
            </div>
        `;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => {
                    document.body.removeChild(toast);
                }, 500);
            }, 3000);
        }, 100);
    };

    // Streak update
    const updateStreak = () => {
        const today = getToday();
        if (state.user.lastActive === today) return false;
        if (!state.user.lastActive) {
            state.user.streak = 1;
        } else {
            const lastDate = new Date(state.user.lastActive);
            const diff = (new Date(today) - lastDate) / (1000*60*60*24);
            if (diff === 1) {
                state.user.streak += 1;
            } else {
                state.user.streak = 1;
            }
        }
        state.user.lastActive = today;
        saveState();
        return true;
    };

    // Log action
    const logAction = (actionType) => {
        if (!state.actions[actionType]) return;
        state.actions[actionType].count += 1;
        updateStreak();
        if (actionType === state.challenge.action) {
            state.challenge.current += 1;
            if (state.challenge.current >= state.challenge.target && !state.challenge.claimed) {
                elements.claimRewardBtn.disabled = false;
                elements.claimRewardBtn.textContent = 'Claim Reward!';
            }
        }
        updateStats();
        // Add to history
        const actionNames = {
            bike: 'Biked to work',
            recycle: 'Recycled items',
            vegetarian: 'Vegetarian meal',
            publicTransport: 'Used public transport',
            reusable: 'Used reusable items'
        };
        const actionImpact = {
            bike: `(saved ${state.actions.bike.co2}kg CO₂)`,
            recycle: `(saved ${state.actions.recycle.co2}kg CO₂)`,
            vegetarian: `(saved ${state.actions.vegetarian.co2}kg CO₂)`,
            publicTransport: `(saved ${state.actions.publicTransport.co2}kg CO₂)`,
            reusable: `(saved ${state.actions.reusable.co2}kg CO₂)`
        };
        state.history.unshift({
            date: 'Today',
            action: actionType,
            description: `${actionNames[actionType]} ${actionImpact[actionType]}`
        });
        for (let i = 1; i < state.history.length; i++) {
            if (state.history[i].date === 'Today') state.history[i].date = 'Yesterday';
            else if (state.history[i].date === 'Yesterday') state.history[i].date = '2 days ago';
        }
        if (state.history.length > 3) state.history = state.history.slice(0, 3);
        saveState();
        renderUI();
    };

    // Claim challenge reward
    const claimReward = () => {
        if (state.challenge.claimed) return;
        Object.keys(state.actions).forEach(action => {
            state.actions[action].count += 1;
        });
        state.challenge.claimed = true;
        elements.claimRewardBtn.disabled = true;
        elements.claimRewardBtn.textContent = 'Reward Claimed!';
        updateStats();
        saveState();
        renderUI();
        alert(`Congratulations! You've completed the challenge and earned bonus points for all your eco actions!\n\nCongratulations, you've planted 1 tree! 🌳`);
    };

    // Render action cards
    const renderActionCards = () => {
        if (!elements.actionsGrid) return;
        elements.actionsGrid.innerHTML = Object.entries(state.actions).map(([action, data]) => `
            <div class="action-card" data-action="${action}">
                <i class="fas fa-${getActionIcon(action)}"></i>
                <h4>${formatActionName(action)}</h4>
                <p>${getActionDescription(action)}</p>
                <span class="action-points">${data.points} pts</span>
            </div>
        `).join('');
        document.querySelectorAll('.action-card').forEach(card => {
            card.addEventListener('click', function() {
                const actionType = this.dataset.action;
                logAction(actionType);
                this.style.transform = 'scale(0.95)';
                setTimeout(() => { this.style.transform = ''; }, 200);
            });
        });
    };

    // Helper functions for UI
    const getActionIcon = (action) => {
        const icons = {
            bike: 'bicycle',
            recycle: 'recycle',
            vegetarian: 'leaf',
            publicTransport: 'bus',
            reusable: 'shopping-bag'
        };
        return icons[action] || 'check-circle';
    };
    const formatActionName = (action) => {
        const names = {
            bike: 'Bike Trip',
            recycle: 'Recycle Items',
            vegetarian: 'Vegetarian Meal',
            publicTransport: 'Public Transport',
            reusable: 'Reusable Items'
        };
        return names[action] || action;
    };
    const getActionDescription = (action) => {
        const desc = {
            bike: 'Instead of driving',
            recycle: 'Paper, plastic, glass',
            vegetarian: 'No meat or fish',
            publicTransport: 'Bus, train, subway',
            reusable: 'Bags, bottles, containers'
        };
        return desc[action] || 'Eco-friendly action';
    };

    // Render timeline
    const renderTimeline = () => {
        const timeline = document.querySelector('.timeline');
        if (!timeline) return;
        timeline.innerHTML = state.history.map(item => `
            <div class="timeline-item">
                <div class="timeline-date">${item.date}</div>
                <div class="timeline-content">
                    <i class="fas fa-${getActionIcon(item.action)}"></i>
                    <p>${item.description}</p>
                </div>
            </div>
        `).join('');
    };

    // Render achievements
    const renderAchievements = () => {
        const achievementsGrid = document.querySelector('.achievements-grid');
        if (!achievementsGrid) return;
        achievementsGrid.innerHTML = state.achievements.map(achievement => `
            <div class="achievement ${achievement.unlocked ? 'unlocked' : 'locked'}">
                <div class="achievement-icon">
                    <i class="fas fa-${achievement.id.startsWith('streak') ? 'fire' :
                        achievement.id === 'starter' ? 'seedling' :
                        achievement.id === 'champion' ? 'medal' :
                        achievement.id === 'hero' ? 'trophy' :
                        achievement.id === 'actions200' ? 'star' :
                        achievement.id === 'water500' ? 'tint' :
                        achievement.id === 'energy500' ? 'bolt' : 'award'}"></i>
                </div>
                <div class="achievement-info">
                    <h4>${achievement.name}</h4>
                    <p>${achievement.description}</p>
                </div>
            </div>
        `).join('');
    };

    // Update circular progress
    const updateCircularProgress = () => {
        if (!elements.progressRingFill) return;
        const circumference = 2 * Math.PI * 50;
        const offset = circumference - (state.stats.greenScore / 100) * circumference;
        elements.progressRingFill.style.strokeDashoffset = offset;
        let progressText = '';
        if (state.stats.greenScore < 30) progressText = 'Getting started - every action counts!';
        else if (state.stats.greenScore < 60) progressText = 'Good progress - keep it up!';
        else if (state.stats.greenScore < 85) progressText = 'Great job! You\'re making a real difference.';
        else progressText = 'Amazing! You\'re an eco superstar!';
        elements.progressText.textContent = progressText;
    };

    // Render all UI elements
    const renderUI = () => {
        elements.greenScore.textContent = state.stats.greenScore;
        elements.carbonSaved.textContent = `${state.stats.carbonSaved.toFixed(1)} kg`;
        elements.energySaved.textContent = `${state.stats.energySaved.toFixed(0)} kWh`;
        elements.waterSaved.textContent = `${state.stats.waterSaved.toFixed(0)} L`;
        elements.challengeDescription.textContent = state.challenge.name;
        elements.challengeCurrent.textContent = state.challenge.current;
        elements.challengeTarget.textContent = state.challenge.target;
        elements.challengeProgress.style.width = `${(state.challenge.current / state.challenge.target) * 100}%`;
        elements.streakCount.textContent = `${state.user.streak}-day streak`;
        updateCircularProgress();
        renderActionCards();
        renderTimeline();
        renderAchievements();

        // Hide login prompt, show dashboard if logged in
        if (elements.loginPrompt) elements.loginPrompt.style.display = 'none';
        if (elements.trackerDashboard) elements.trackerDashboard.style.display = 'block';

        // Show climate impact section only if logged in
        if (elements.climateImpactSection)
            elements.climateImpactSection.style.display = 'block';

        // Update claim reward button state
        if (elements.claimRewardBtn) {
            elements.claimRewardBtn.disabled = !(state.challenge.current >= state.challenge.target && !state.challenge.claimed);
            elements.claimRewardBtn.textContent = state.challenge.claimed
                ? 'Reward Claimed!'
                : (state.challenge.current >= state.challenge.target ? 'Claim Reward!' : 'Complete the Challenge!');
        }
    };

    // Set current weekly challenge
    const setWeeklyChallenge = (challengeIndex) => {
        const challenge = allChallenges[challengeIndex % allChallenges.length];
        state.challenge = {
            name: challenge.name,
            action: challenge.action,
            current: 0,
            target: challenge.target,
            reward: 50,
            claimed: false,
            index: challengeIndex % allChallenges.length
        };
    };

    // Initialize the tracker
    const init = (username) => {
        initState(username);
        if (username && elements.usernameDisplay) elements.usernameDisplay.textContent = username;
        renderUI();
        if (elements.claimRewardBtn) {
            elements.claimRewardBtn.removeEventListener('click', claimReward);
            elements.claimRewardBtn.addEventListener('click', claimReward);
        }
        // Weekly reset (every Sunday)
        const now = new Date();
        const day = now.getDay();
        const nextSunday = new Date();
        nextSunday.setDate(now.getDate() + (7 - day));
        nextSunday.setHours(0, 0, 0, 0);
        const timeToReset = nextSunday - now;
        setTimeout(resetWeeklyData, timeToReset);
    };

    // Weekly reset
    const resetWeeklyData = () => {
        Object.keys(state.actions).forEach(action => {
            state.actions[action].count = 0;
        });
        let nextIndex = (typeof state.challenge.index === 'number')
            ? (state.challenge.index + 1) % allChallenges.length
            : 0;
        setWeeklyChallenge(nextIndex);
        updateStats();
        saveState();
        renderUI();
        setTimeout(resetWeeklyData, 7 * 24 * 60 * 60 * 1000);
    };

    return { init, logAction };
})();

const UserAuth = (() => {
    const checkAuthState = () => {
        let storedUser = null;
        try {
            storedUser = JSON.parse(localStorage.getItem('user'));
        } catch {
            storedUser = null;
        }
        const email = storedUser?.email;
        const loginPrompt = document.querySelector('.login-prompt');
        const dashboard = document.querySelector('.tracker-dashboard');
        const logoutBtn = document.getElementById('logout-button');
        const loginLink = document.getElementById('login-link');
        const climateImpactSection = document.getElementById('climate-impact');

        if (email) {
            const username = email.split('@')[0] || 'Eco Warrior';
            EcoTracker.init(username);
            if (loginPrompt) loginPrompt.style.display = 'none';
            if (dashboard) dashboard.style.display = 'block';
            if (logoutBtn) logoutBtn.style.display = 'inline-block';
            if (loginLink) loginLink.style.display = 'none';
            if (climateImpactSection) climateImpactSection.style.display = 'block';
        } else {
            // Not logged in: show only login prompt
            if (loginPrompt) loginPrompt.style.display = 'block';
            if (dashboard) dashboard.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'none';
            if (loginLink) loginLink.style.display = 'inline-block';
            if (climateImpactSection) climateImpactSection.style.display = 'none';
        }
    };
    return { checkAuthState };
})();

const logoutButton = document.getElementById('logout-button');
const handleLogout = () => {
    localStorage.removeItem('user');
    UserAuth.checkAuthState();
};
if (logoutButton) {
    logoutButton.style.display = 'none';
    logoutButton.addEventListener('click', handleLogout);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    UserAuth.checkAuthState();
    // Show or hide logout/login links based on login state
    const storedUser = localStorage.getItem('user');
    const loginLink = document.getElementById('login-link');
    if (storedUser) {
        if (logoutButton) logoutButton.style.display = 'inline-block';
        if (loginLink) loginLink.style.display = 'none';
    } else {
        if (logoutButton) logoutButton.style.display = 'none';
        if (loginLink) loginLink.style.display = 'inline-block';
    }
    // Add styles for achievement toast (only once)
    if (!document.getElementById('eco-toast-style')) {
        const style = document.createElement('style');
        style.id = 'eco-toast-style';
        style.textContent = `
            .achievement-toast {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: white;
                border-radius: 10px;
                box-shadow: 0 5px 20px rgba(0,0,0,0.2);
                padding: 15px;
                display: flex;
                align-items: center;
                z-index: 1000;
                transform: translateX(150%);
                transition: transform 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                max-width: 300px;
            }
            .achievement-toast.show { transform: translateX(0); }
            .toast-icon {
                width: 40px; height: 40px;
                background-color: #FFD700;
                border-radius: 50%;
                display: flex; align-items: center; justify-content: center;
                margin-right: 15px;
                color: white; font-size: 18px;
            }
            .toast-content h4 { margin: 0 0 5px 0; color: #333; font-size: 1rem; }
            .toast-content p { margin: 0; color: #666; font-size: 0.9rem; }
        `;
        document.head.appendChild(style);
    }
});