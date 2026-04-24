const firebaseConfig = {
    apiKey: "AIzaSyDNSGTcMHK6xp1_7aU_EbxyWkXRFKOn440",
    authDomain: "viron-org.firebaseapp.com",
    projectId: "viron-org",
    storageBucket: "viron-org.firebasestorage.app",
    messagingSenderId: "77280927551",
    appId: "1:77280927551:web:e748608c4a082930927d8a",
    measurementId: "G-GMDEZ7V0K3"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let useLocalStorage = false;

async function initDemoData() {
    try {
        const settingsDoc = await db.collection('settings').doc('general').get();
        if (!settingsDoc.exists) {
            await db.collection('settings').doc('general').set({
                orgName: 'Viron Organizasyon',
                whatsappLink: 'https://chat.whatsapp.com/LINKINIZI_BURAYA_YAZIN',
                adminPassword: 'viron2024',
                description: 'Türkiye\'nin en iyi PUBG Mobile scrim organizasyonu'
            });
            await db.collection('settings').doc('weeklyBest').set({
                teamName: '', teamTag: '', teamEarnings: 0, teamWins: 0,
                playerName: '', playerPubgId: '', playerTeam: '', playerKills: 0, playerEarnings: 0
            });
            await db.collection('settings').doc('stats').set({
                totalTournaments: 0, totalPrizeMoney: 0, totalPlayers: 0, totalTeams: 0
            });
        }
    } catch (e) {
        console.warn('Firebase bağlantısı yok, localStorage kullanılıyor.');
        useLocalStorage = true;
    }
}

firebase.firestore().collection('settings').doc('general').get()
    .then(() => { useLocalStorage = false; initDemoData(); })
    .catch(() => {
        console.warn('Firebase bağlantısı kurulamadı, localStorage kullanılıyor.');
        useLocalStorage = true;
    });
