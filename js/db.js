// ─────────────────────────────────────────────
//  Veritabanı İşlemleri
//  Firebase Firestore + localStorage fallback
// ─────────────────────────────────────────────

const DB = {
    // ─── LocalStorage Helpers ───────────────────
    lsGet(key, def = null) {
        try { return JSON.parse(localStorage.getItem('viron_' + key)) ?? def; }
        catch { return def; }
    },
    lsSet(key, val) {
        localStorage.setItem('viron_' + key, JSON.stringify(val));
    },

    // ─── Settings ───────────────────────────────
    async getSettings() {
        if (useLocalStorage) {
            return this.lsGet('settings', {
                orgName: 'Viron Organizasyon',
                whatsappLink: '#',
                adminPassword: 'viron2024',
                description: 'PUBG Mobile Scrim Organizasyonu'
            });
        }
        const doc = await db.collection('settings').doc('general').get();
        return doc.exists ? doc.data() : {};
    },

    async saveSettings(data) {
        if (useLocalStorage) { this.lsSet('settings', data); return; }
        await db.collection('settings').doc('general').set(data, { merge: true });
    },

    async getWeeklyBest() {
        if (useLocalStorage) {
            return this.lsGet('weeklyBest', {
                teamName: '', teamTag: '', teamEarnings: 0, teamWins: 0,
                playerName: '', playerPubgId: '', playerTeam: '', playerKills: 0, playerEarnings: 0
            });
        }
        const doc = await db.collection('settings').doc('weeklyBest').get();
        return doc.exists ? doc.data() : {};
    },

    async saveWeeklyBest(data) {
        if (useLocalStorage) { this.lsSet('weeklyBest', data); return; }
        await db.collection('settings').doc('weeklyBest').set(data, { merge: true });
    },

    async getStats() {
        if (useLocalStorage) {
            const teams = this.lsGet('teams', []);
            const players = this.lsGet('players', []);
            const tournaments = this.lsGet('tournaments', []);
            const totalPrize = tournaments.reduce((s, t) => s + (Number(t.prize) || 0), 0);
            return { totalTeams: teams.length, totalPlayers: players.length, totalTournaments: tournaments.length, totalPrizeMoney: totalPrize };
        }
        const [teams, players, tournaments] = await Promise.all([
            db.collection('teams').get(),
            db.collection('players').get(),
            db.collection('tournaments').get()
        ]);
        const totalPrize = tournaments.docs.reduce((s, d) => s + (Number(d.data().prize) || 0), 0);
        return {
            totalTeams: teams.size,
            totalPlayers: players.size,
            totalTournaments: tournaments.size,
            totalPrizeMoney: totalPrize
        };
    },

    // ─── Teams ──────────────────────────────────
    async getTeams() {
        if (useLocalStorage) return this.lsGet('teams', []);
        const snap = await db.collection('teams').orderBy('earnings', 'desc').get();
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    },

    async addTeam(team) {
        if (useLocalStorage) {
            const teams = this.lsGet('teams', []);
            const newTeam = { id: Date.now().toString(), ...team };
            this.lsSet('teams', [...teams, newTeam]);
            return newTeam.id;
        }
        const ref = await db.collection('teams').add(team);
        return ref.id;
    },

    async updateTeam(id, data) {
        if (useLocalStorage) {
            const teams = this.lsGet('teams', []);
            this.lsSet('teams', teams.map(t => t.id === id ? { ...t, ...data } : t));
            return;
        }
        await db.collection('teams').doc(id).update(data);
    },

    async deleteTeam(id) {
        if (useLocalStorage) {
            const teams = this.lsGet('teams', []);
            this.lsSet('teams', teams.filter(t => t.id !== id));
            return;
        }
        await db.collection('teams').doc(id).delete();
    },

    // ─── Players ────────────────────────────────
    async getPlayers() {
        if (useLocalStorage) return this.lsGet('players', []);
        const snap = await db.collection('players').orderBy('earnings', 'desc').get();
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    },

    async addPlayer(player) {
        if (useLocalStorage) {
            const players = this.lsGet('players', []);
            const newPlayer = { id: Date.now().toString(), ...player };
            this.lsSet('players', [...players, newPlayer]);
            return newPlayer.id;
        }
        const ref = await db.collection('players').add(player);
        return ref.id;
    },

    async updatePlayer(id, data) {
        if (useLocalStorage) {
            const players = this.lsGet('players', []);
            this.lsSet('players', players.map(p => p.id === id ? { ...p, ...data } : p));
            return;
        }
        await db.collection('players').doc(id).update(data);
    },

    async deletePlayer(id) {
        if (useLocalStorage) {
            const players = this.lsGet('players', []);
            this.lsSet('players', players.filter(p => p.id !== id));
            return;
        }
        await db.collection('players').doc(id).delete();
    },

    // ─── Tournaments ─────────────────────────────
    async getTournaments() {
        if (useLocalStorage) return this.lsGet('tournaments', []);
        const snap = await db.collection('tournaments').orderBy('date', 'asc').get();
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    },

    async addTournament(tournament) {
        if (useLocalStorage) {
            const tournaments = this.lsGet('tournaments', []);
            const newT = { id: Date.now().toString(), filledSlots: 0, ...tournament };
            this.lsSet('tournaments', [...tournaments, newT]);
            return newT.id;
        }
        const ref = await db.collection('tournaments').add({ filledSlots: 0, ...tournament });
        return ref.id;
    },

    async updateTournament(id, data) {
        if (useLocalStorage) {
            const tournaments = this.lsGet('tournaments', []);
            this.lsSet('tournaments', tournaments.map(t => t.id === id ? { ...t, ...data } : t));
            return;
        }
        await db.collection('tournaments').doc(id).update(data);
    },

    async deleteTournament(id) {
        if (useLocalStorage) {
            const tournaments = this.lsGet('tournaments', []);
            this.lsSet('tournaments', tournaments.filter(t => t.id !== id));
            return;
        }
        await db.collection('tournaments').doc(id).delete();
    }
};

function formatCurrency(amount) {
    const n = Number(amount) || 0;
    return n.toLocaleString('tr-TR') + ' TL';
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function getStatusBadge(status) {
    const map = {
        open: '<span class="badge badge-open">Açık</span>',
        full: '<span class="badge badge-full">Dolu</span>',
        closed: '<span class="badge badge-closed">Kapandı</span>',
        ongoing: '<span class="badge badge-ongoing">Devam Ediyor</span>'
    };
    return map[status] || '<span class="badge badge-closed">-</span>';
}

function getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}
