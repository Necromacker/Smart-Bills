document.addEventListener('DOMContentLoaded', () => {
    // Theme Management
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const html = document.documentElement;
    const savedTheme = localStorage.getItem('volttrack-theme') || 'light';
    html.setAttribute('data-theme', savedTheme);
    if (themeIcon) themeIcon.className = savedTheme === 'light' ? 'ph-bold ph-moon' : 'ph-bold ph-sun';

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = html.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            html.setAttribute('data-theme', newTheme);
            localStorage.setItem('volttrack-theme', newTheme);
            if (themeIcon) themeIcon.className = newTheme === 'light' ? 'ph-bold ph-moon' : 'ph-bold ph-sun';
        });
    }

    const appliancesGrid = document.getElementById('appliancesGrid');

    // Default 5 Appliances
    const defaultAppliances = [
        { id: 'ac', name: 'Air Conditioner', room: 'Living Room', iconClass: 'ph-fill ph-wind', colorClass: 'ac', usage: '0', cost: '0', active: true },
        { id: 'fridge', name: 'Refrigerator', room: 'Kitchen', iconClass: 'ph-fill ph-snowflake', colorClass: 'fridge', usage: '0', cost: '0', active: true },
        { id: 'washing', name: 'Washing Machine', room: 'Laundry', iconClass: 'ph-fill ph-washing-machine', colorClass: 'machine', usage: '0', cost: '0', active: true },
        { id: 'lights', name: 'Lighting', room: 'All Rooms', iconClass: 'ph-fill ph-lightbulb', colorClass: 'lights', usage: '0', cost: '0', active: true },
        { id: 'fans', name: 'Ceiling Fans', room: 'All Rooms', iconClass: 'ph-fill ph-fan', colorClass: 'fan', usage: '0', cost: '0', active: true }
    ];

    function createSparkline(id, color, data) {
        const el = document.getElementById(id);
        if (!el) return;
        const ctx = el.getContext('2d');
        return new Chart(ctx, {
            type: 'line',
            data: { labels: Array(data.length).fill(''), datasets: [{ data: data, borderColor: color, borderWidth: 2, pointRadius: 0, tension: 0.4, fill: false }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: false } }, scales: { x: { display: false }, y: { display: false } } }
        });
    }

    function saveAppliances() {
        const appliances = [];
        document.querySelectorAll('.appliance-card').forEach(card => {
            const id = card.querySelector('.toggle-switch input').id;
            const name = card.querySelector('.app-details h3').textContent;
            const room = card.dataset.room;
            const iconBox = card.querySelector('.icon-box');
            const iconClass = iconBox.querySelector('i').className;
            const colorClass = iconBox.classList[1];
            const usageInput = card.querySelector('.usage-input');
            const usage = usageInput ? usageInput.value : '0.0';
            const cost = card.querySelector('.metric:last-child .val').textContent.replace('₹', '');
            const active = card.querySelector('.toggle-switch input').checked;
            appliances.push({ id, name, room, iconClass, colorClass, usage, cost, active });
        });
        localStorage.setItem('volttrack-appliances', JSON.stringify(appliances));
    }

    function calculateCost(unitsPerMonth) {
        return (unitsPerMonth * 11.04).toFixed(0);
    }

    function updateGlobalStats() {
        const appliances = JSON.parse(localStorage.getItem('volttrack-appliances') || '[]');
        const lastBill = JSON.parse(localStorage.getItem('volttrack-last-bill'));
        const activeAppliances = appliances.filter(a => a.active);
        const totalUserKwh = activeAppliances.reduce((acc, app) => acc + (parseFloat(app.usage) || 0), 0);
        
        const dailyText = document.querySelector('.view-title p');
        if (dailyText) {
            if (lastBill) {
                const diff = (lastBill.units_consumed - totalUserKwh).toFixed(0);
                dailyText.innerHTML = `Active accounted: <strong>${totalUserKwh.toFixed(0)} kWh/m</strong> / ${lastBill.units_consumed} kWh. <span style="color: ${diff >= 0 ? 'var(--text-green)' : 'var(--text-red)'}">Balance: ${diff} kWh</span>`;
            } else {
                dailyText.textContent = `Total accounted: ${totalUserKwh.toFixed(0)} kWh/m`;
            }
        }

        const connectedVal = document.querySelectorAll('.stat-pill .value')[0];
        if (connectedVal) connectedVal.textContent = appliances.length;
        const statusVal = document.querySelectorAll('.stat-pill .value')[1];
        if (statusVal) {
            statusVal.textContent = activeAppliances.length > 0 ? 'Optimal' : 'All Off';
            statusVal.style.color = 'var(--text-green)';
        }
    }

    function loadAppliances() {
        let saved = JSON.parse(localStorage.getItem('volttrack-appliances') || '[]');
        if (saved.length === 0) {
            saved = defaultAppliances;
            localStorage.setItem('volttrack-appliances', JSON.stringify(saved));
        }
        if (appliancesGrid) {
            appliancesGrid.innerHTML = '';
            saved.forEach(app => renderAppliance(app));
            updateGlobalStats();
        }
    }

    function renderAppliance(app) {
        const newCard = document.createElement('div');
        newCard.className = 'card appliance-card';
        newCard.dataset.room = app.room;
        newCard.innerHTML = `
            <div class="card-status ${app.active ? 'active' : ''}"></div>
            <div class="app-header">
                <div class="icon-box ${app.colorClass}"><i class="${app.iconClass}"></i></div>
                <div class="toggle-switch">
                    <input type="checkbox" id="${app.id}" ${app.active ? 'checked' : ''}>
                    <label for="${app.id}"></label>
                </div>
            </div>
            <div class="app-details">
                <h3>${app.name}</h3>
                <p>${app.room} • ${app.active ? 'Active' : 'Offline'}</p>
            </div>
            <div class="app-metrics" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px;">
                <div class="metric">
                    <span class="label" style="font-size: 0.75rem; color: var(--text-secondary); display: block; margin-bottom: 4px;">Usage (kWh/m)</span>
                    <input type="number" step="1" min="0" class="usage-input" value="${app.usage || '0'}" style="width: 100%; padding: 8px; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-main); color: var(--text-primary); font-family: inherit;">
                </div>
                <div class="metric">
                    <span class="label" style="font-size: 0.75rem; color: var(--text-secondary); display: block; margin-bottom: 4px;">Est. Cost/Mo</span>
                    <span class="val" style="font-weight: 700; color: var(--text-primary); font-size: 1.1rem;">₹${calculateCost(app.usage || 0)}</span>
                </div>
            </div>
            <div class="sparkline-container" style="height: 40px; margin-top: 15px;">
                <canvas id="sparkline-${app.id}"></canvas>
            </div>
        `;
        appliancesGrid.appendChild(newCard);

        setTimeout(() => {
            const colors = { ac: '#ee5d50', fridge: '#05cd99', machine: '#a855f7', lights: '#fab005', fan: '#4318ff' };
            const colorCode = colors[app.colorClass] || '#4318ff';
            const data = app.active ? [3, 5, 2, 6, 4] : [0, 0, 0, 0, 0];
            createSparkline(`sparkline-${app.id}`, colorCode, data);
        }, 100);

        const usageInput = newCard.querySelector('.usage-input');
        usageInput.addEventListener('input', (e) => {
            const newVal = parseFloat(e.target.value) || 0;
            const lastBill = JSON.parse(localStorage.getItem('volttrack-last-bill'));
            if (lastBill) {
                const appliances = JSON.parse(localStorage.getItem('volttrack-appliances') || '[]');
                const otherUsage = appliances.reduce((acc, a) => a.id === app.id ? acc : acc + (parseFloat(a.usage) || 0), 0);
                if ((otherUsage + newVal) > lastBill.units_consumed) {
                    alert(`Action blocked: Total appliance usage would exceed the bill total (${lastBill.units_consumed} kWh).`);
                    e.target.value = app.usage;
                    return;
                }
            }
            newCard.querySelector('.metric:last-child .val').textContent = `₹${calculateCost(newVal)}`;
            saveAppliances();
            updateGlobalStats();
        });

        newCard.querySelector('.toggle-switch input').addEventListener('change', (e) => {
            newCard.querySelector('.card-status').className = `card-status ${e.target.checked ? 'active' : ''}`;
            newCard.querySelector('.app-details p').textContent = `${app.room} • ${e.target.checked ? 'Active' : 'Offline'}`;
            saveAppliances();
            updateGlobalStats();
            location.reload(); // Refresh to update sparklines
        });
    }

    loadAppliances();
});
