// Sıralama Sayfası JavaScript

let currentTab = 'teams';

async function loadLeaderboard() {
    await switchTab(currentTab);
}

async function switchTab(tab) {
    currentTab = tab;

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    const container = document.getElementById('leaderboard-container');
    container.innerHTML = `<div style="text-align:center;padding:60px"><div class="loading-spinner"></div></div>`;

    try {
        if (tab === 'teams') {
            const teams = await DB.getTeams();
            renderTeams(teams);
        } else {
            const players = await DB.getPlayers();
            renderPlayers(players);
        }
    } catch (e) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Veriler yüklenemedi.</p></div>`;
    }
}

function renderTeams(teams) {
    const countEl = document.getElementById('total-count');
    if (countEl) countEl.textContent = teams.length + ' takım';
    const container = document.getElementById('leaderboard-container');

    if (!teams.length) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-users"></i><p>Henüz takım kaydı yok.</p></div>`;
        return;
    }

    const sorted = [...teams].sort((a, b) => (Number(b.earnings) || 0) - (Number(a.earnings) || 0));

    container.innerHTML = `
        <table class="leaderboard-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Takım</th>
                    <th>Oyuncu Sayısı</th>
                    <th>Galibiyet</th>
                    <th>Maç</th>
                    <th>Toplam Kazanç</th>
                </tr>
            </thead>
            <tbody>
                ${sorted.map((team, i) => {
                    const rank = i + 1;
                    const rankClass = rank <= 3 ? `rank-${rank}` : 'rank-other';
                    return `
                    <tr>
                        <td><span class="rank-badge ${rankClass}">${rank <= 3 ? ['🥇','🥈','🥉'][rank-1] : rank}</span></td>
                        <td>
                            <div class="player-info">
                                <div class="player-avatar" style="border-radius:8px">${getInitials(team.name)}</div>
                                <div>
                                    <div class="player-name-text">${escHtml(team.name)}</div>
                                    <div class="player-id-text">${team.tag ? '[' + escHtml(team.tag) + ']' : ''}</div>
                                </div>
                            </div>
                        </td>
                        <td style="color:var(--text-secondary)">${team.memberCount || team.members?.length || 0}</td>
                        <td><span class="amount green">${team.wins || 0}</span></td>
                        <td style="color:var(--text-secondary)">${team.matches || 0}</td>
                        <td><span class="amount gold">${formatCurrency(team.earnings)}</span></td>
                    </tr>`;
                }).join('')}
            </tbody>
        </table>`;
}

function renderPlayers(players) {
    const countEl = document.getElementById('total-count');
    if (countEl) countEl.textContent = players.length + ' oyuncu';
    const container = document.getElementById('leaderboard-container');

    if (!players.length) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-user"></i><p>Henüz oyuncu kaydı yok.</p></div>`;
        return;
    }

    const sorted = [...players].sort((a, b) => (Number(b.earnings) || 0) - (Number(a.earnings) || 0));

    container.innerHTML = `
        <table class="leaderboard-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Oyuncu</th>
                    <th>Takım</th>
                    <th>Kill</th>
                    <th>K/D</th>
                    <th>Toplam Kazanç</th>
                </tr>
            </thead>
            <tbody>
                ${sorted.map((player, i) => {
                    const rank = i + 1;
                    const rankClass = rank <= 3 ? `rank-${rank}` : 'rank-other';
                    const kd = player.deaths ? (Number(player.kills) / Number(player.deaths)).toFixed(2) : (player.kills || 0);
                    return `
                    <tr>
                        <td><span class="rank-badge ${rankClass}">${rank <= 3 ? ['🥇','🥈','🥉'][rank-1] : rank}</span></td>
                        <td>
                            <div class="player-info">
                                <div class="player-avatar">${getInitials(player.name)}</div>
                                <div>
                                    <div class="player-name-text">${escHtml(player.name)}</div>
                                    <div class="player-id-text">${escHtml(player.pubgId || '')}</div>
                                </div>
                            </div>
                        </td>
                        <td style="color:var(--text-secondary)">${escHtml(player.team || '-')}</td>
                        <td><span class="amount green">${player.kills || 0}</span></td>
                        <td style="color:var(--text-secondary)">${kd}</td>
                        <td><span class="amount gold">${formatCurrency(player.earnings)}</span></td>
                    </tr>`;
                }).join('')}
            </tbody>
        </table>`;
}

function escHtml(s) {
    if (!s) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function toggleMenu() {
    document.querySelector('.nav-links').classList.toggle('open');
}

document.addEventListener('DOMContentLoaded', loadLeaderboard);
