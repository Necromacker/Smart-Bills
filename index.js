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

        // Save to localStorage
        localStorage.setItem('volttrack-theme', newTheme);

        // Update Icon
        themeIcon.className = newTheme === 'light' ? 'ph-bold ph-moon' : 'ph-bold ph-sun';

        // Update Chart colors
        updateChartTheme(newTheme);
    });

    // Notification Panel Toggle
    const notificationBtn = document.getElementById('notificationBtn');
    const notificationPanel = document.getElementById('notificationPanel');
    const profileBtn = document.getElementById('profileBtn');
    const profileDropdown = document.getElementById('profileDropdown');

    if (notificationBtn && notificationPanel) {
        notificationBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            notificationPanel.classList.toggle('show');
            if (profileDropdown) profileDropdown.classList.remove('show');
        });

        // Mark all as read
        const markReadBtn = document.querySelector('.mark-read');
        if (markReadBtn) {
            markReadBtn.addEventListener('click', () => {
                const unreadItems = document.querySelectorAll('.notification-item.unread');
                unreadItems.forEach(item => item.classList.remove('unread'));
                // Remove notification dot
                notificationBtn.classList.remove('notification-dot');
            });
        }

        // Click on notification item
        const notifItems = document.querySelectorAll('.notification-item');
        notifItems.forEach(item => {
            item.addEventListener('click', () => {
                item.classList.remove('unread');
            });
        });
    }

    // Profile Dropdown Toggle
    if (profileBtn && profileDropdown) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle('show');
            if (notificationPanel) notificationPanel.classList.remove('show');
        });

        // Logout functionality
        const logoutBtn = profileDropdown.querySelector('.logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (confirm('Are you sure you want to logout?')) {
                    alert('Logged out successfully!');
                    // In a real app, redirect to login page
                }
            });
        }
    }

    // Close dropdowns when clicking outside
    document.addEventListener('click', () => {
        if (notificationPanel) notificationPanel.classList.remove('show');
        if (profileDropdown) profileDropdown.classList.remove('show');
    });

    // Chart.js Implementation
    const ctx = document.getElementById('usageChart').getContext('2d');

    const chartData = {
        labels: ['8 am', '10 am', '12 pm', '2 pm', '4 pm', '6 pm', '8 pm', '10 pm', '12 am', '2 am', '4 am', '6 am', '8 am'],
        datasets: [{
            label: 'Usage (kWh)',
            data: [0.8, 1.2, 2.5, 3.8, 2.2, 1.8, 4.5, 6.2, 3.5, 1.2, 0.8, 0.6, 0.9],
            borderColor: '#4318ff',
            backgroundColor: (context) => {
                const chart = context.chart;
                const { ctx, chartArea } = chart;
                if (!chartArea) return null;
                const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                gradient.addColorStop(0, 'rgba(67, 24, 255, 0)');
                gradient.addColorStop(1, 'rgba(67, 24, 255, 0.1)');
                return gradient;
            },
            fill: true,
            tension: 0.4,
            borderWidth: 3,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: '#4318ff',
            pointHoverBorderColor: '#fff',
            pointHoverBorderWidth: 3,
        }]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#1b2559',
                titleColor: '#fff',
                bodyColor: '#fff',
                padding: 12,
                displayColors: false,
                callbacks: {
                    label: (context) => `${context.parsed.y} kWh`
                }
            }
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { color: '#a3aed0', font: { family: 'Outfit', size: 12 } }
            },
            y: {
                grid: { color: 'rgba(163, 174, 208, 0.1)', drawBorder: false },
                ticks: { color: '#a3aed0', font: { family: 'Outfit', size: 12 } }
            }
        },
        interaction: {
            intersect: false,
            mode: 'index',
        }
    };

    let usageChart = new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: chartOptions
    });

    function updateChartTheme(theme) {
        const textColor = theme === 'light' ? '#a3aed0' : '#a3aed0';
        const gridColor = theme === 'light' ? 'rgba(163, 174, 208, 0.1)' : 'rgba(163, 174, 208, 0.05)';

        usageChart.options.scales.x.ticks.color = textColor;
        usageChart.options.scales.y.ticks.color = textColor;
        usageChart.options.scales.y.grid.color = gridColor;
        usageChart.update();
    }

    // Time Filter Interaction
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const timeline = btn.textContent.trim();
            let newLabels, newData;

            switch (timeline) {
                case '1D':
                    newLabels = ['12am', '2am', '4am', '6am', '8am', '10am', '12pm', '2pm', '4pm', '6pm', '8pm', '10pm'];
                    newData = Array.from({ length: 12 }, () => (Math.random() * 5 + 1).toFixed(1));
                    break;
                case '1W':
                    newLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                    newData = Array.from({ length: 7 }, () => (Math.random() * 15 + 10).toFixed(1));
                    break;
                case '1M':
                    newLabels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
                    newData = Array.from({ length: 4 }, () => (Math.random() * 80 + 50).toFixed(1));
                    break;
                case '1Y':
                    newLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    newData = Array.from({ length: 12 }, () => (Math.random() * 300 + 200).toFixed(1));
                    break;
                default:
                    newLabels = ['8 am', '10 am', '12 pm', '2 pm', '4 pm', '6 pm', '8 pm', '10 pm', '12 am', '2 am', '4 am', '6 am', '8 am'];
                    newData = Array.from({ length: 13 }, () => (Math.random() * 5 + 1).toFixed(1));
            }

            usageChart.data.labels = newLabels;
            usageChart.data.datasets[0].data = newData;
            usageChart.update();
        });
    });

    // Navigation Item Interaction (Visual update)
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            if (item.id === 'theme-toggle' || item.getAttribute('href') === '#') return;
            // The browser will handle the redirect naturally since we aren't calling e.preventDefault()
        });
    });

    // Simulate "Live" updates
    setInterval(() => {
        const loadValue = document.querySelector('.header-stats .stat-pill:first-child .value');
        if (loadValue) {
            const currentLoad = (Math.random() * 1.5 + 1.5).toFixed(1);
            loadValue.textContent = `${currentLoad} kW`;
        }
    }, 5000);

    // Search Functionality
    const searchInput = document.querySelector('.search-bar input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const tableRows = document.querySelectorAll('.table-row');

            tableRows.forEach(row => {
                const applianceName = row.querySelector('.appliance-info strong')?.textContent.toLowerCase() || '';
                const applianceLocation = row.querySelector('.appliance-info span')?.textContent.toLowerCase() || '';

                if (applianceName.includes(searchTerm) || applianceLocation.includes(searchTerm)) {
                    row.style.display = 'grid';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }

    // Budget Setter
    const budgetBtn = document.getElementById('set-budget-btn');
    budgetBtn.addEventListener('click', () => {
        const newLimit = prompt('Enter your monthly budget limit (₹):', '5000');
        if (newLimit && !isNaN(newLimit)) {
            document.querySelector('.budget-status span:last-child').textContent = `Budget: ₹${parseInt(newLimit).toLocaleString()}`;
            alert('Monthly budget limit updated successfully!');
        }
    });
});
