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
            updateChartTheme(newTheme);
        });
    }

    // Chart.js
    const usageChartEl = document.getElementById('usageChart');
    let usageChart;
    let currentFilter = '1M';

    if (usageChartEl) {
        const ctx = usageChartEl.getContext('2d');
        usageChart = new Chart(ctx, {
            type: 'line',
            data: { labels: [], datasets: [{ label: 'Usage (kWh)', data: [], borderColor: '#4318ff', backgroundColor: 'rgba(67, 24, 255, 0.1)', fill: true, tension: 0.4, borderWidth: 3, pointRadius: 0 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { color: '#a3aed0' } }, y: { grid: { color: 'rgba(163, 174, 208, 0.1)' }, ticks: { color: '#a3aed0' } } } }
        });
    }

    function updateChartTheme(theme) {
        if (!usageChart) return;
        usageChart.options.scales.x.ticks.color = '#a3aed0';
        usageChart.options.scales.y.ticks.color = '#a3aed0';
        usageChart.update();
    }

    // Time Filter Listeners
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.textContent.trim();
            updateDashboardUI();
        });
    });

    // Reset Buttons
    const resetAllBtn = document.getElementById('resetAllBtn');
    if (resetAllBtn) {
        resetAllBtn.addEventListener('click', () => {
            if (confirm('Are you sure? This will delete all analyzed bills, appliances, and settings.')) {
                localStorage.removeItem('volttrack-last-bill');
                localStorage.removeItem('volttrack-appliances');
                localStorage.removeItem('volttrack-budget');
                localStorage.removeItem('volttrack-bill-history');
                location.reload();
            }
        });
    }

    function updateDashboardUI() {
        const lastBill = JSON.parse(localStorage.getItem('volttrack-last-bill'));
        const appliances = JSON.parse(localStorage.getItem('volttrack-appliances') || '[]');
        const budget = parseFloat(localStorage.getItem('volttrack-budget') || 5000);
        const prediction = predictFutureBill();

        const activeAppliances = appliances.filter(a => a.active);
        const totalActiveUsage = activeAppliances.reduce((acc, a) => acc + (parseFloat(a.usage) || 0), 0);

        // Header & Stats
        const currentLoadPill = document.querySelectorAll('.stat-pill .value')[0];
        const dailyAvgPill = document.querySelectorAll('.stat-pill .value')[1];
        const savingsPill = document.querySelectorAll('.stat-pill .value')[2];
        const amountPrediction = document.querySelector('.amount-prediction');
        const budgetSpentSpan = document.querySelector('.budget-status span:first-child');
        const budgetLimitSpan = document.querySelector('.budget-status span:last-child');
        const progressBar = document.querySelector('.progress-bar');
        
        if (amountPrediction) amountPrediction.textContent = `₹ ${prediction ? prediction.amount : '---'}`;

        if (lastBill) {
            if (currentLoadPill) currentLoadPill.textContent = `${totalActiveUsage || lastBill.units_consumed} kWh`;
            if (dailyAvgPill) dailyAvgPill.textContent = `${((totalActiveUsage || lastBill.units_consumed) / 30).toFixed(1)} kWh`;
            const savings = budget - lastBill.total_amount;
            if (savingsPill) {
                savingsPill.textContent = `₹ ${savings.toFixed(0)}`;
                savingsPill.className = `value ${savings >= 0 ? 'green' : 'red'}`;
            }
            if (budgetSpentSpan) budgetSpentSpan.textContent = `₹${lastBill.total_amount.toLocaleString()} spent`;
            if (budgetLimitSpan) budgetLimitSpan.textContent = `Budget: ₹${parseInt(budget).toLocaleString()}`;
            if (progressBar && prediction) {
                const progress = (prediction.amount / budget) * 100;
                progressBar.style.width = `${Math.min(progress, 100)}%`;
                progressBar.style.backgroundColor = progress > 100 ? 'var(--text-red)' : 'white';
            }
        } else {
            if (budgetSpentSpan) budgetSpentSpan.textContent = `₹0 spent`;
            if (budgetLimitSpan) budgetLimitSpan.textContent = `Budget: ₹${parseInt(budget).toLocaleString()}`;
            if (progressBar) progressBar.style.width = '0%';
        }

        // Appliance Table & Efficiency
        const applianceTable = document.querySelector('.appliance-table');
        let alertsCount = 0;
        let alertsHTML = '';
        let suggestionsHTML = '';

        if (applianceTable) {
            const rows = applianceTable.querySelectorAll('.table-row, .empty-table-state');
            rows.forEach(row => row.remove());
            appliances.forEach(app => {
                const usage = parseFloat(app.usage) || 0;
                let efficiency = usage > 200 ? 'Low' : usage > 100 ? 'Moderate' : 'High';
                let effClass = usage > 200 ? 'low' : usage > 100 ? 'medium' : 'high';
                const row = document.createElement('div');
                row.className = 'table-row';
                row.innerHTML = `<div class="appliance-info"><div class="icon-box ${app.colorClass}"><i class="${app.iconClass}"></i></div><div class="details"><strong>${app.name}</strong><span>${app.room}</span></div></div><div class="status-badge ${app.active ? 'on' : 'off'}">${app.active ? 'Active' : 'Off'}</div><span>${usage} kWh/m</span><div class="efficiency-pill ${effClass}">${efficiency}</div><span class="${efficiency === 'Low' && app.active ? 'alert-warning' : 'alert-success'}">${(efficiency === 'Low' && app.active) ? 'High Load' : 'Optimal'}</span>`;
                applianceTable.appendChild(row);

                if (app.active) {
                    if (efficiency === 'Low') {
                        alertsCount++;
                        alertsHTML += `<div class="alert-entry warning"><i class="ph-bold ph-warning"></i><div class="alert-content"><strong>${app.name} Efficiency</strong><span>High load (${usage} kWh/m)</span></div></div>`;
                        suggestionsHTML += `<div class="suggestion-item"><div class="dot yellow"></div><p>Upgrade <strong>${app.name}</strong> for better efficiency.</p></div>`;
                    } else if (efficiency === 'Moderate') {
                        suggestionsHTML += `<div class="suggestion-item"><div class="dot blue"></div><p>Optimize <strong>${app.name}</strong> usage.</p></div>`;
                    }
                }
            });
        }

        // Budget Alert
        if (lastBill && budget < lastBill.total_amount) {
            alertsCount++;
            alertsHTML += `<div class="alert-entry critical"><i class="ph-bold ph-warning-circle" style="color: var(--text-red);"></i><div class="alert-content"><strong>Budget Exceeded</strong><span>₹${lastBill.total_amount} exceeds limit.</span></div></div>`;
            suggestionsHTML += `<div class="suggestion-item"><div class="dot blue"></div><p>Your bill is <strong>₹${(lastBill.total_amount - budget).toFixed(0)}</strong> over budget. Increase budget or reduce usage.</p></div>`;
        }

        // Category Breakdown Sync
        if (lastBill) {
            const categories = { Cooling: 0, Lighting: 0, Appliances: 0, Kitchen: 0, Others: 0 };
            activeAppliances.forEach(app => {
                const usage = parseFloat(app.usage) || 0;
                const name = app.name.toLowerCase();
                if (name.includes('ac') || name.includes('fan')) categories.Cooling += usage;
                else if (name.includes('light')) categories.Lighting += usage;
                else if (name.includes('fridge') || name.includes('micro')) categories.Kitchen += usage;
                else categories.Appliances += usage;
            });
            lastBill.category_breakdown = categories;
            localStorage.setItem('volttrack-last-bill', JSON.stringify(lastBill));
        }

        // Graph Update
        if (lastBill && usageChart) {
            const totalUnits = totalActiveUsage || lastBill.units_consumed;
            let labels = [], data = [];
            if (currentFilter === '1D') { labels = ['8am', '10am', '12pm', '2pm', '4pm', '6pm', '8pm', '10pm', '12am', '2am', '4am', '6am', '8am']; data = Array.from({ length: 13 }, (_, i) => ((totalUnits / 30 / 13) * (Math.exp(-Math.pow(i - 6, 2) / 8) + 0.5)).toFixed(1)); }
            else if (currentFilter === '1W') { labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']; data = Array.from({ length: 7 }, () => ((totalUnits / 30) * (0.8 + Math.random() * 0.4)).toFixed(1)); }
            else if (currentFilter === '1M') { labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4']; data = Array.from({ length: 4 }, () => ((totalUnits / 4) * (0.9 + Math.random() * 0.2)).toFixed(1)); }
            else if (currentFilter === '1Y') { labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']; data = Array.from({ length: 12 }, () => ((totalUnits) * (0.7 + Math.random() * 0.6)).toFixed(1)); }
            usageChart.data.labels = labels;
            usageChart.data.datasets[0].data = data;
            usageChart.update();
            const amountDisplay = document.querySelector('.card-value-main .amount');
            if (amountDisplay) amountDisplay.textContent = (currentFilter === '1D' ? totalUnits / 30 : totalUnits).toFixed(0);
        }

        // UI Lists
        const suggestionsList = document.getElementById('suggestionsList');
        const alertsList = document.getElementById('alertsList');
        const alertBadge = document.querySelector('.badge');
        if (suggestionsList) suggestionsList.innerHTML = suggestionsHTML || '<div class="empty-state">No suggestions.</div>';
        if (alertsList) alertsList.innerHTML = alertsHTML || '<div class="empty-state">No active alerts.</div>';
        if (alertBadge) alertBadge.textContent = `${alertsCount} New`;
    }

    updateDashboardUI();
    window.addEventListener('storage', updateDashboardUI);
});
