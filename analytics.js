document.addEventListener('DOMContentLoaded', () => {
    // Theme Management with localStorage
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const html = document.documentElement;

    // Load saved theme or default to light
    const savedTheme = localStorage.getItem('volttrack-theme') || 'light';
    html.setAttribute('data-theme', savedTheme);
    themeIcon.className = savedTheme === 'light' ? 'ph-bold ph-moon' : 'ph-bold ph-sun';

    themeToggle.addEventListener('click', () => {
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('volttrack-theme', newTheme);
        themeIcon.className = newTheme === 'light' ? 'ph-bold ph-moon' : 'ph-bold ph-sun';
        updateCharts(newTheme);
    });

    // Initial Data
    const lastBill = JSON.parse(localStorage.getItem('volttrack-last-bill'));
    let chartData = [0, 0, 0, 0, 0]; // Start with zeroed data
    
    if (lastBill && lastBill.category_breakdown) {
        chartData = [
            lastBill.category_breakdown.Cooling || 0,
            lastBill.category_breakdown.Lighting || 0,
            lastBill.category_breakdown.Appliances || 0,
            lastBill.category_breakdown.Kitchen || 0,
            lastBill.category_breakdown.Others || 0
        ];
    }

    // Category Chart (Doughnut)
    const catCtx = document.getElementById('categoryChart').getContext('2d');
    const categoryChart = new Chart(catCtx, {
        type: 'doughnut',
        data: {
            labels: ['Cooling', 'Lighting', 'Apps', 'Kitchen', 'Others'],
            datasets: [{
                data: chartData,
                backgroundColor: ['#4318ff', '#05cd99', '#ff9f40', '#ee5d50', '#a3aed0'],
                borderWidth: 0,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        usePointStyle: true,
                        font: { family: 'Outfit', size: 14 }
                    }
                }
            },
            cutout: '70%'
        }
    });

    // Update Insights
    const insightList = document.querySelector('.insight-list');
    if (lastBill && lastBill.saving_tips) {
        const colors = ['red', 'green', 'blue'];
        const icons = ['ph-trend-up', 'ph-lightbulb', 'ph-check-circle-panel'];
        
        insightList.innerHTML = lastBill.saving_tips.map((tip, i) => `
            <div class="insight-entry">
                <i class="ph-bold ${icons[i % 3]} ${colors[i % 3]}"></i>
                <div>
                    <strong>Gemini Insight</strong>
                    <span>${tip}</span>
                </div>
            </div>
        `).join('');
    } else {
        insightList.innerHTML = '<div class="empty-state" style="padding: 20px; color: var(--text-secondary);">Analyze a bill to see smart insights.</div>';
    }

    // Distribution Chart (Bar)
    const distCtx = document.getElementById('distChart').getContext('2d');
    let distData = [0, 0, 0, 0, 0, 0, 0];
    
    if (lastBill) {
        const avg = lastBill.units_consumed / 30;
        distData = Array.from({ length: 7 }, () => (Math.random() * (avg/2) + (avg/10)).toFixed(1));
    }

    const distChart = new Chart(distCtx, {
        type: 'bar',
        data: {
            labels: ['12am', '4am', '8am', '12pm', '4pm', '8pm', '11pm'],
            datasets: [{
                label: 'Usage (kWh)',
                data: distData,
                backgroundColor: '#4318ff',
                borderRadius: 8,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false } },
                y: { 
                    grid: { color: 'rgba(163, 174, 208, 0.1)', drawBorder: false },
                    suggestedMax: 5
                }
            }
        }
    });

    // Peer Comparison
    const peerBars = document.querySelectorAll('.comp-bar');
    const peerVals = document.querySelectorAll('.comp-val');
    const efficiencyVal = document.querySelector('.header-stats .value');

    if (!lastBill) {
        peerBars.forEach(bar => bar.style.width = '0%');
        peerVals.forEach(val => val.textContent = '--- kWh');
        const footer = document.querySelector('.card-footer p');
        if (footer) footer.textContent = 'Upload a bill to compare with peers.';
    } else {
        const yourUsage = lastBill.units_consumed;
        const efficientUsage = 280; // Hardcoded baseline for efficient homes
        const averageUsage = 380; // Hardcoded baseline for average homes

        // 1. Your Bar
        peerVals[0].textContent = `${yourUsage} kWh`;
        peerBars[0].style.width = `${Math.min((yourUsage / 600) * 100, 100)}%`;
        
        // 2. Efficient Homes Bar
        peerVals[1].textContent = `${efficientUsage} kWh`;
        peerBars[1].style.width = `${(efficientUsage / 600) * 100}%`;

        // 3. Average Bar
        peerVals[2].textContent = `${averageUsage} kWh`;
        peerBars[2].style.width = `${(averageUsage / 600) * 100}%`;

        // Update Efficiency Score
        if (efficiencyVal) {
            const score = Math.max(10, Math.min(100, 100 - (yourUsage - efficientUsage) / 5));
            efficiencyVal.textContent = score.toFixed(0);
            efficiencyVal.style.color = score > 80 ? 'var(--text-green)' : score > 50 ? 'var(--text-orange)' : 'var(--text-red)';
        }

        const footer = document.querySelector('.card-footer p');
        if (footer) {
            const diff = yourUsage - efficientUsage;
            footer.textContent = diff > 0 ? `You are consuming ${diff} kWh more than efficient homes.` : 'Excellent! You are more efficient than average homes.';
        }
    }

    function updateCharts(theme) {
        const textColor = theme === 'dark' ? '#fff' : '#1b2559';
        [categoryChart, distChart].forEach(chart => {
            if (chart.options.plugins.legend) {
                chart.options.plugins.legend.labels.color = textColor;
            }
            if (chart.options.scales) {
                if (chart.options.scales.x) chart.options.scales.x.ticks.color = '#a3aed0';
                if (chart.options.scales.y) chart.options.scales.y.ticks.color = '#a3aed0';
            }
            chart.update();
        });
    }
});
