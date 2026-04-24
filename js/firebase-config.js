// ─────────────────────────────────────────────
//  Firebase Konfigürasyonu
//  1. https://console.firebase.google.com adresine git
//  2. "Add project" ile yeni proje oluştur
//  3. Firestore Database'i etkinleştir (test mode)
//  4. Project Settings > Your apps > Web app ekle
//  5. Aşağıdaki değerleri kendi projenin bilgileriyle değiştir
// ─────────────────────────────────────────────

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Firebase başlat
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Demo verilerini ilk kurulumda yükle
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
                teamName: '',
                teamTag: '',
                teamEarnings: 0,
                teamWins: 0,
                playerName: '',
                playerPubgId: '',
                playerTeam: '',
                playerKills: 0,
                playerEarnings: 0
            });
            await db.collection('settings').doc('stats').set({
                totalTournaments: 0,
                totalPrizeMoney: 0,
                totalPlayers: 0,
                totalTeams: 0
            });
            console.log('Demo veriler yüklendi.');
        }
    } catch (e) {
        console.warn('Firebase bağlantısı yok, localStorage kullanılıyor.');
        useLocalStorage = true;
    }
}

let useLocalStorage = false;

// Firebase bağlantı kontrolü
firebase.firestore().collection('settings').doc('general').get()
    .then(() => { useLocalStorage = false; })
    .catch(() => {
        console.warn('Firebase bağlantısı kurulamadı. Lütfen firebase-config.js dosyasını doldurun.');
        useLocalStorage = true;
    });
