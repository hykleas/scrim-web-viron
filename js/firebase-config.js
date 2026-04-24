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

// Tarayıcı cache — sonraki yüklemelerde anlık açılır
db.enablePersistence({ synchronizeTabs: true }).catch(() => {});

let useLocalStorage = false;
