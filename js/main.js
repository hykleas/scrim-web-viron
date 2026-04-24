// Ana Sayfa JavaScript

let whatsappLink = '#';

async function loadHomepage() {
    try {
        const [settings, weekly, tournaments, stats] = await Promise.all([
            DB.getSettings(),
            DB.getWeeklyBest(),
            DB.getTournaments(),
            DB.getStats()
        ]);

        whatsappLink = settings.whatsappLink || '#';

        // Stats bar
        document.getElementById('stat-tournaments').textContent = stats.totalTournaments || 0;
        document.getElementById('stat-teams').textContent = stats.totalTeams || 0;
        document.getElementById('stat-players').textContent = stats.totalPlayers || 0;
        document.getElementById('stat-prize').textContent = formatCurrency(stats.totalPrizeMoney);

        // WhatsApp buttons
        document.querySelectorAll('.wa-main-btn').forEach(btn => {
            btn.href = settings.whatsappLink || '#';
        });

        renderWeeklyBest(weekly);
        renderTournaments(tournaments);

    } catch (e) {
        console.error('Yükleme hatası:', e);
    }
}

function renderWeeklyBest(data) {
    const teamEl = document.getElementById('weekly-team');
    const playerEl = document.getElementById('weekly-player');

    if (data.teamName) {
        teamEl.innerHTML = `
            <div class="weekly-card-label"><i class="fas fa-crown"></i> Haftanın En İyi Takımı</div>
            <div class="weekly-name">${escHtml(data.teamName)} <span style="color:var(--text-muted);font-size:1.2rem;">[${escHtml(data.teamTag || '')}]</span></div>
            <div class="weekly-sub">Bu haftanın şampiyonu</div>
            <div class="weekly-stats">
                <div class="weekly-stat">
                    <span class="weekly-stat-value">${formatCurrency(data.teamEarnings)}</span>
                    <span class="weekly-stat-label">Toplam Kazanç</span>
                </div>
                <div class="weekly-stat">
                    <span class="weekly-stat-value">${data.teamWins || 0}</span>
                    <span class="weekly-stat-label">Galibiyet</span>
                </div>
            </div>
            <div class="weekly-crown">🏆</div>`;
    } else {
        teamEl.innerHTML = `
            <div class="weekly-card-label"><i class="fas fa-crown"></i> Haftanın En İyi Takımı</div>
            <div class="empty-state" style="padding:20px 0">
                <i class="fas fa-users" style="font-size:2rem;opacity:0.2;display:block;margin-bottom:8px"></i>
                <p style="font-size:0.85rem;color:var(--text-muted)">Henüz belirlenmedi</p>
            </div>
            <div class="weekly-crown">🏆</div>`;
    }

    if (data.playerName) {
        playerEl.innerHTML = `
            <div class="weekly-card-label"><i class="fas fa-star"></i> Haftanın En İyi Oyuncusu</div>
            <div class="weekly-name">${escHtml(data.playerName)}</div>
            <div class="weekly-sub">${escHtml(data.playerPubgId || '')} ${data.playerTeam ? '• ' + escHtml(data.playerTeam) : ''}</div>
            <div class="weekly-stats">
                <div class="weekly-stat">
                    <span class="weekly-stat-value">${formatCurrency(data.playerEarnings)}</span>
                    <span class="weekly-stat-label">Kazanç</span>
                </div>
                <div class="weekly-stat">
                    <span class="weekly-stat-value">${data.playerKills || 0}</span>
                    <span class="weekly-stat-label">Kill</span>
                </div>
            </div>
            <div class="weekly-crown">⭐</div>`;
    } else {
        playerEl.innerHTML = `
            <div class="weekly-card-label"><i class="fas fa-star"></i> Haftanın En İyi Oyuncusu</div>
            <div class="empty-state" style="padding:20px 0">
                <i class="fas fa-user" style="font-size:2rem;opacity:0.2;display:block;margin-bottom:8px"></i>
                <p style="font-size:0.85rem;color:var(--text-muted)">Henüz belirlenmedi</p>
            </div>
            <div class="weekly-crown">⭐</div>`;
    }
}

function renderTournaments(tournaments) {
    const container = document.getElementById('tournaments-list');
    const active = tournaments.filter(t => t.status !== 'closed');

    if (!active.length) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column:1/-1">
                <i class="fas fa-trophy"></i>
                <p>Şu an aktif turnuva bulunmuyor.<br>Yakında yeni turnuvalar eklenecek!</p>
            </div>`;
        return;
    }

    container.innerHTML = active.map(t => {
        const filled = Number(t.filledSlots) || 0;
        const total = Number(t.totalSlots) || 1;
        const remaining = total - filled;
        const pct = Math.min(100, Math.round((filled / total) * 100));
        const link = t.whatsappLink || whatsappLink;

        return `
        <div class="tournament-card">
            <div class="tournament-header">
                <div>
                    <div class="tournament-name">${escHtml(t.name)}</div>
                    <div class="tournament-date"><i class="fas fa-calendar-alt"></i> ${formatDate(t.date)}</div>
                </div>
                ${getStatusBadge(t.status)}
            </div>
            <div class="tournament-body">
                <div class="tournament-info">
                    <div class="t-info-item">
                        <span class="t-info-label">Ödül Havuzu</span>
                        <span class="t-info-value gold">${formatCurrency(t.prize)}</span>
                    </div>
                    <div class="t-info-item">
                        <span class="t-info-label">Kalan Slot</span>
                        <span class="t-info-value" style="color:${remaining > 0 ? 'var(--color-green)' : 'var(--color-red)'}">${remaining > 0 ? remaining + ' Slot' : 'Dolu'}</span>
                    </div>
                </div>
                <div class="slot-bar"><div class="slot-fill" style="width:${pct}%"></div></div>
                <div class="slot-text">
                    <span>${filled}/${total} Slot Dolu</span>
                    <span>%${pct}</span>
                </div>
                ${t.description ? `<p style="font-size:0.82rem;color:var(--text-muted);margin-top:12px;line-height:1.5">${escHtml(t.description)}</p>` : ''}
            </div>
            <div class="tournament-footer">
                ${t.status === 'open' && remaining > 0 ? `
                    <a href="${escHtml(link)}" target="_blank" rel="noopener" class="btn btn-whatsapp btn-full btn-sm">
                        <i class="fab fa-whatsapp"></i> WhatsApp'tan Kayıt Ol
                    </a>` : `
                    <button class="btn btn-ghost btn-full btn-sm" disabled>
                        <i class="fas fa-lock"></i> Kayıt Kapalı
                    </button>`}
            </div>
        </div>`;
    }).join('');
}

function escHtml(s) {
    if (!s) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function toggleMenu() {
    document.querySelector('.nav-links').classList.toggle('open');
}

document.addEventListener('DOMContentLoaded', loadHomepage);
