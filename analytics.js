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

    // Category Chart (Doughnut)
    const catCtx = document.getElementById('categoryChart').getContext('2d');
    const categoryChart = new Chart(catCtx, {
        type: 'doughnut',
        data: {
            labels: ['Cooling', 'Lighting', 'Apps', 'Kitchen', 'Others'],
            datasets: [{
                data: [45, 15, 20, 10, 10],
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

    // Distribution Chart (Bar)
    const distCtx = document.getElementById('distChart').getContext('2d');
    const distChart = new Chart(distCtx, {
        type: 'bar',
        data: {
            labels: ['12am', '4am', '8am', '12pm', '4pm', '8pm', '11pm'],
            datasets: [{
                label: 'Usage (kWh)',
                data: [1.2, 0.8, 2.5, 3.1, 2.8, 5.4, 4.2],
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
                y: { grid: { color: 'rgba(163, 174, 208, 0.1)', drawBorder: false } }
            }
        }
    });

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
