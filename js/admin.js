// Admin Panel JavaScript

let isLoggedIn = false;
let editingId = null;
let editingType = null;

// ─── AUTH ────────────────────────────────────────
async function handleLogin(e) {
    e.preventDefault();
    const pw = document.getElementById('admin-password').value;
    const errEl = document.getElementById('login-error');

    try {
        const settings = await DB.getSettings();
        const correctPw = settings.adminPassword || 'viron2024';

        if (pw === correctPw) {
            isLoggedIn = true;
            sessionStorage.setItem('viron_admin', '1');
            document.getElementById('login-page').style.display = 'none';
            document.getElementById('dashboard').style.display = 'flex';
            loadDashboard();
        } else {
            errEl.textContent = 'Yanlış şifre. Tekrar deneyin.';
            errEl.style.display = 'block';
        }
    } catch {
        if (pw === 'viron2024') {
            isLoggedIn = true;
            sessionStorage.setItem('viron_admin', '1');
            document.getElementById('login-page').style.display = 'none';
            document.getElementById('dashboard').style.display = 'flex';
            loadDashboard();
        } else {
            errEl.textContent = 'Yanlış şifre.';
            errEl.style.display = 'block';
        }
    }
}

function logout() {
    sessionStorage.removeItem('viron_admin');
    isLoggedIn = false;
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('login-page').style.display = 'flex';
}

// ─── DASHBOARD ───────────────────────────────────
async function loadDashboard() {
    try {
        const stats = await DB.getStats();
        document.getElementById('d-teams').textContent = stats.totalTeams || 0;
        document.getElementById('d-players').textContent = stats.totalPlayers || 0;
        document.getElementById('d-tournaments').textContent = stats.totalTournaments || 0;
        document.getElementById('d-prize').textContent = formatCurrency(stats.totalPrizeMoney);
    } catch {}
}

// ─── NAVIGATION ──────────────────────────────────
function showSection(name) {
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
    document.getElementById('section-' + name).classList.add('active');
    document.querySelector(`.sidebar-link[data-section="${name}"]`).classList.add('active');

    const loaders = {
        overview: loadDashboard,
        tournaments: loadTournaments,
        teams: loadTeams,
        players: loadPlayers,
        settings: loadSettings
    };
    if (loaders[name]) loaders[name]();
}

// ─── TOURNAMENTS ─────────────────────────────────
async function loadTournaments() {
    const tbody = document.getElementById('tournaments-tbody');
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--text-muted)"><div class="loading-spinner"></div></td></tr>`;
    const tournaments = await DB.getTournaments();

    if (!tournaments.length) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--text-muted)">Henüz turnuva yok.</td></tr>`;
        return;
    }

    tbody.innerHTML = tournaments.map(t => {
        const remaining = (Number(t.totalSlots) || 0) - (Number(t.filledSlots) || 0);
        return `<tr>
            <td>${escHtml(t.name)}</td>
            <td>${formatDate(t.date)}</td>
            <td class="amount gold">${formatCurrency(t.prize)}</td>
            <td>${Number(t.filledSlots)||0}/${Number(t.totalSlots)||0}</td>
            <td style="color:${remaining>0?'var(--color-green)':'var(--color-red)'}">${remaining > 0 ? remaining : 'Dolu'}</td>
            <td>${getStatusBadge(t.status)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon btn-icon-edit" onclick="openEditModal('tournament','${t.id}')" title="Düzenle"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon btn-icon-delete" onclick="confirmDelete('tournament','${t.id}','${escHtml(t.name)}')" title="Sil"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

async function saveTournament(e) {
    e.preventDefault();
    const data = {
        name: document.getElementById('t-name').value.trim(),
        date: document.getElementById('t-date').value,
        prize: Number(document.getElementById('t-prize').value) || 0,
        totalSlots: Number(document.getElementById('t-slots').value) || 0,
        filledSlots: Number(document.getElementById('t-filled').value) || 0,
        status: document.getElementById('t-status').value,
        whatsappLink: document.getElementById('t-wa').value.trim(),
        description: document.getElementById('t-desc').value.trim()
    };

    try {
        if (editingId) {
            await DB.updateTournament(editingId, data);
            showToast('Turnuva güncellendi.', 'success');
        } else {
            await DB.addTournament(data);
            showToast('Turnuva eklendi.', 'success');
        }
        closeModal('modal-tournament');
        loadTournaments();
        loadDashboard();
    } catch (err) {
        showToast('Hata: ' + err.message, 'error');
    }
}

// ─── TEAMS ───────────────────────────────────────
async function loadTeams() {
    const tbody = document.getElementById('teams-tbody');
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:30px"><div class="loading-spinner"></div></td></tr>`;
    const teams = await DB.getTeams();

    if (!teams.length) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--text-muted)">Henüz takım yok.</td></tr>`;
        return;
    }

    tbody.innerHTML = teams.map(team => `<tr>
        <td>
            <div class="player-info">
                <div class="player-avatar">${getInitials(team.name)}</div>
                <div>
                    <div class="player-name-text">${escHtml(team.name)}</div>
                    <div class="player-id-text">${team.tag ? '['+escHtml(team.tag)+']' : ''}</div>
                </div>
            </div>
        </td>
        <td style="color:var(--text-secondary)">${team.memberCount || 0}</td>
        <td style="color:var(--color-green)">${team.wins || 0}</td>
        <td style="color:var(--text-secondary)">${team.matches || 0}</td>
        <td class="amount gold">${formatCurrency(team.earnings)}</td>
        <td>
            <div class="action-buttons">
                <button class="btn-icon btn-icon-edit" onclick="openEditModal('team','${team.id}')" title="Düzenle"><i class="fas fa-edit"></i></button>
                <button class="btn-icon btn-icon-delete" onclick="confirmDelete('team','${team.id}','${escHtml(team.name)}')" title="Sil"><i class="fas fa-trash"></i></button>
            </div>
        </td>
    </tr>`).join('');
}

async function saveTeam(e) {
    e.preventDefault();
    const data = {
        name: document.getElementById('team-name').value.trim(),
        tag: document.getElementById('team-tag').value.trim(),
        memberCount: Number(document.getElementById('team-members').value) || 0,
        wins: Number(document.getElementById('team-wins').value) || 0,
        matches: Number(document.getElementById('team-matches').value) || 0,
        earnings: Number(document.getElementById('team-earnings').value) || 0
    };

    try {
        if (editingId) {
            await DB.updateTeam(editingId, data);
            showToast('Takım güncellendi.', 'success');
        } else {
            await DB.addTeam(data);
            showToast('Takım eklendi.', 'success');
        }
        closeModal('modal-team');
        loadTeams();
        loadDashboard();
    } catch (err) {
        showToast('Hata: ' + err.message, 'error');
    }
}

// ─── PLAYERS ─────────────────────────────────────
async function loadPlayers() {
    const tbody = document.getElementById('players-tbody');
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:30px"><div class="loading-spinner"></div></td></tr>`;
    const players = await DB.getPlayers();

    if (!players.length) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--text-muted)">Henüz oyuncu yok.</td></tr>`;
        return;
    }

    tbody.innerHTML = players.map(p => `<tr>
        <td>
            <div class="player-info">
                <div class="player-avatar">${getInitials(p.name)}</div>
                <div>
                    <div class="player-name-text">${escHtml(p.name)}</div>
                    <div class="player-id-text">${escHtml(p.pubgId || '')}</div>
                </div>
            </div>
        </td>
        <td style="color:var(--text-secondary)">${escHtml(p.team || '-')}</td>
        <td style="color:var(--color-green)">${p.kills || 0}</td>
        <td style="color:var(--text-secondary)">${p.deaths || 0}</td>
        <td style="color:var(--color-cyan)">${p.matches || 0}</td>
        <td class="amount gold">${formatCurrency(p.earnings)}</td>
        <td>
            <div class="action-buttons">
                <button class="btn-icon btn-icon-edit" onclick="openEditModal('player','${p.id}')" title="Düzenle"><i class="fas fa-edit"></i></button>
                <button class="btn-icon btn-icon-delete" onclick="confirmDelete('player','${p.id}','${escHtml(p.name)}')" title="Sil"><i class="fas fa-trash"></i></button>
            </div>
        </td>
    </tr>`).join('');
}

async function savePlayer(e) {
    e.preventDefault();
    const data = {
        name: document.getElementById('p-name').value.trim(),
        pubgId: document.getElementById('p-pubgid').value.trim(),
        team: document.getElementById('p-team').value.trim(),
        kills: Number(document.getElementById('p-kills').value) || 0,
        deaths: Number(document.getElementById('p-deaths').value) || 0,
        matches: Number(document.getElementById('p-matches').value) || 0,
        earnings: Number(document.getElementById('p-earnings').value) || 0
    };

    try {
        if (editingId) {
            await DB.updatePlayer(editingId, data);
            showToast('Oyuncu güncellendi.', 'success');
        } else {
            await DB.addPlayer(data);
            showToast('Oyuncu eklendi.', 'success');
        }
        closeModal('modal-player');
        loadPlayers();
        loadDashboard();
    } catch (err) {
        showToast('Hata: ' + err.message, 'error');
    }
}

// ─── SETTINGS ────────────────────────────────────
async function loadSettings() {
    const [settings, weekly, teams, players] = await Promise.all([
        DB.getSettings(), DB.getWeeklyBest(), DB.getTeams(), DB.getPlayers()
    ]);

    document.getElementById('s-orgname').value = settings.orgName || '';
    document.getElementById('s-wa').value = settings.whatsappLink || '';
    document.getElementById('s-desc').value = settings.description || '';

    const teamSel = document.getElementById('s-team-select');
    teamSel.innerHTML = '<option value="">— Takım Seçin —</option>' +
        teams.map(t => {
            const sel = t.name === weekly.teamName ? ' selected' : '';
            const label = escHtml(t.name) + (t.tag ? ' [' + escHtml(t.tag) + ']' : '');
            return `<option value="${t.id}" data-name="${escHtml(t.name)}" data-tag="${escHtml(t.tag||'')}" data-earnings="${t.earnings||0}" data-wins="${t.wins||0}"${sel}>${label}</option>`;
        }).join('');
    document.getElementById('s-team-earnings').value = weekly.teamEarnings || '';
    document.getElementById('s-team-wins').value = weekly.teamWins || '';

    const playerSel = document.getElementById('s-player-select');
    playerSel.innerHTML = '<option value="">— Oyuncu Seçin —</option>' +
        players.map(p => {
            const sel = p.name === weekly.playerName ? ' selected' : '';
            const label = escHtml(p.name) + (p.pubgId ? ' (' + escHtml(p.pubgId) + ')' : '');
            return `<option value="${p.id}" data-name="${escHtml(p.name)}" data-pubgid="${escHtml(p.pubgId||'')}" data-team="${escHtml(p.team||'')}" data-kills="${p.kills||0}" data-earnings="${p.earnings||0}"${sel}>${label}</option>`;
        }).join('');
    document.getElementById('s-player-kills').value = weekly.playerKills || '';
    document.getElementById('s-player-earnings').value = weekly.playerEarnings || '';
}

function onWeeklyTeamChange(select) {
    const opt = select.selectedOptions[0];
    if (!opt || !opt.value) return;
    document.getElementById('s-team-earnings').value = opt.dataset.earnings || 0;
    document.getElementById('s-team-wins').value = opt.dataset.wins || 0;
}

function onWeeklyPlayerChange(select) {
    const opt = select.selectedOptions[0];
    if (!opt || !opt.value) return;
    document.getElementById('s-player-kills').value = opt.dataset.kills || 0;
    document.getElementById('s-player-earnings').value = opt.dataset.earnings || 0;
}

async function saveGeneralSettings(e) {
    e.preventDefault();
    try {
        await DB.saveSettings({
            orgName: document.getElementById('s-orgname').value.trim(),
            whatsappLink: document.getElementById('s-wa').value.trim(),
            description: document.getElementById('s-desc').value.trim()
        });
        showToast('Genel ayarlar kaydedildi.', 'success');
    } catch (err) { showToast('Hata: ' + err.message, 'error'); }
}

async function saveWeeklySettings(e) {
    e.preventDefault();
    try {
        const teamOpt = document.getElementById('s-team-select').selectedOptions[0];
        const playerOpt = document.getElementById('s-player-select').selectedOptions[0];
        await DB.saveWeeklyBest({
            teamName: teamOpt?.dataset.name || '',
            teamTag: teamOpt?.dataset.tag || '',
            teamEarnings: Number(document.getElementById('s-team-earnings').value) || 0,
            teamWins: Number(document.getElementById('s-team-wins').value) || 0,
            playerName: playerOpt?.dataset.name || '',
            playerPubgId: playerOpt?.dataset.pubgid || '',
            playerTeam: playerOpt?.dataset.team || '',
            playerKills: Number(document.getElementById('s-player-kills').value) || 0,
            playerEarnings: Number(document.getElementById('s-player-earnings').value) || 0
        });
        showToast('Haftanın en iyileri kaydedildi.', 'success');
    } catch (err) { showToast('Hata: ' + err.message, 'error'); }
}

async function changePassword(e) {
    e.preventDefault();
    const curr = document.getElementById('pw-current').value;
    const newPw = document.getElementById('pw-new').value;
    const confirm = document.getElementById('pw-confirm').value;

    if (newPw !== confirm) { showToast('Yeni şifreler eşleşmiyor.', 'error'); return; }
    if (newPw.length < 4) { showToast('Şifre en az 4 karakter olmalı.', 'error'); return; }

    try {
        const settings = await DB.getSettings();
        if (curr !== (settings.adminPassword || 'viron2024')) {
            showToast('Mevcut şifre yanlış.', 'error');
            return;
        }
        await DB.saveSettings({ ...settings, adminPassword: newPw });
        showToast('Şifre değiştirildi.', 'success');
        e.target.reset();
    } catch (err) { showToast('Hata: ' + err.message, 'error'); }
}

// ─── MODALS ──────────────────────────────────────
async function populateTeamSelect(selectId, selectedTeam) {
    const sel = document.getElementById(selectId);
    sel.innerHTML = '<option value="">— Takım Seçin —</option>';
    try {
        const teams = await DB.getTeams();
        teams.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t.name;
            opt.textContent = t.name + (t.tag ? ' [' + t.tag + ']' : '');
            if (t.name === selectedTeam) opt.selected = true;
            sel.appendChild(opt);
        });
    } catch(e) {}
}

async function openAddModal(type) {
    editingId = null;
    editingType = type;
    const modalId = 'modal-' + type;
    document.getElementById(modalId + '-title').textContent =
        { tournament: 'Yeni Turnuva', team: 'Yeni Takım', player: 'Yeni Oyuncu' }[type];
    document.getElementById(modalId + '-form').reset();
    if (type === 'player') await populateTeamSelect('p-team', '');
    openModal(modalId);
}

async function openEditModal(type, id) {
    editingId = id;
    editingType = type;
    const modalId = 'modal-' + type;
    document.getElementById(modalId + '-title').textContent =
        { tournament: 'Turnuva Düzenle', team: 'Takım Düzenle', player: 'Oyuncu Düzenle' }[type];

    try {
        let items;
        if (type === 'tournament') items = await DB.getTournaments();
        else if (type === 'team') items = await DB.getTeams();
        else items = await DB.getPlayers();

        const item = items.find(i => i.id === id);
        if (!item) { showToast('Kayıt bulunamadı.', 'error'); return; }

        if (type === 'tournament') {
            document.getElementById('t-name').value = item.name || '';
            document.getElementById('t-date').value = item.date || '';
            document.getElementById('t-prize').value = item.prize || '';
            document.getElementById('t-slots').value = item.totalSlots || '';
            document.getElementById('t-filled').value = item.filledSlots || '';
            document.getElementById('t-status').value = item.status || 'open';
            document.getElementById('t-wa').value = item.whatsappLink || '';
            document.getElementById('t-desc').value = item.description || '';
        } else if (type === 'team') {
            document.getElementById('team-name').value = item.name || '';
            document.getElementById('team-tag').value = item.tag || '';
            document.getElementById('team-members').value = item.memberCount || '';
            document.getElementById('team-wins').value = item.wins || '';
            document.getElementById('team-matches').value = item.matches || '';
            document.getElementById('team-earnings').value = item.earnings || '';
        } else {
            document.getElementById('p-name').value = item.name || '';
            document.getElementById('p-pubgid').value = item.pubgId || '';
            await populateTeamSelect('p-team', item.team || '');
            document.getElementById('p-kills').value = item.kills || '';
            document.getElementById('p-deaths').value = item.deaths || '';
            document.getElementById('p-matches').value = item.matches || '';
            document.getElementById('p-earnings').value = item.earnings || '';
        }
        openModal(modalId);
    } catch (err) {
        showToast('Hata: ' + err.message, 'error');
    }
}

function openModal(id) {
    document.getElementById(id).classList.add('open');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('open');
    editingId = null;
}

function confirmDelete(type, id, name) {
    document.getElementById('delete-name').textContent = name;
    document.getElementById('delete-confirm-btn').onclick = () => performDelete(type, id);
    openModal('modal-delete');
}

async function performDelete(type, id) {
    try {
        if (type === 'tournament') await DB.deleteTournament(id);
        else if (type === 'team') await DB.deleteTeam(id);
        else await DB.deletePlayer(id);

        showToast('Kayıt silindi.', 'success');
        closeModal('modal-delete');

        if (type === 'tournament') loadTournaments();
        else if (type === 'team') loadTeams();
        else loadPlayers();
        loadDashboard();
    } catch (err) {
        showToast('Hata: ' + err.message, 'error');
    }
}

// ─── TOAST ───────────────────────────────────────
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas ${icons[type]}"></i> ${escHtml(message)}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}

function escHtml(s) {
    if (!s) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function toggleMenu() {
    document.querySelector('.nav-links').classList.toggle('open');
}

// ─── INIT ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    if (sessionStorage.getItem('viron_admin') === '1') {
        isLoggedIn = true;
        document.getElementById('login-page').style.display = 'none';
        document.getElementById('dashboard').style.display = 'flex';
        loadDashboard();
    }
});
