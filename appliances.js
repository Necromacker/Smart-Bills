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
    });

    // Helper to create sparklines
    function createSparkline(id, color, data) {
        const ctx = document.getElementById(id).getContext('2d');
        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: Array(data.length).fill(''),
                datasets: [{
                    data: data,
                    borderColor: color,
                    borderWidth: 2,
                    pointRadius: 0,
                    tension: 0.4,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { enabled: false } },
                scales: { x: { display: false }, y: { display: false } }
            }
        });
    }

    // Initialize Sparklines
    createSparkline('sparkline-ac', '#ee5d50', [6, 4, 7, 5, 8, 6, 9, 8, 7]);
    createSparkline('sparkline-fridge', '#05cd99', [2, 2.1, 2, 2.2, 2.1, 2.1, 2, 2.1]);
    createSparkline('sparkline-wm', '#a855f7', [0, 0, 1.2, 0, 0, 1.5, 0]);
    createSparkline('sparkline-tv', '#0ea5e9', [0.2, 0.4, 0.3, 0.5, 0.4, 0.6, 0.4]);

    // Filter Logic
    const filterBtns = document.querySelectorAll('.filter-btn');
    const cards = document.querySelectorAll('.appliance-card');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const room = btn.textContent;
            cards.forEach(card => {
                if (room === 'All Rooms' || card.dataset.room === room) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });

    // Toggle Interaction
    const toggles = document.querySelectorAll('.toggle-switch input');
    toggles.forEach(toggle => {
        toggle.addEventListener('change', (e) => {
            const card = e.target.closest('.appliance-card');
            const status = card.querySelector('.card-status');
            if (e.target.checked) {
                status.classList.add('active');
            } else {
                status.classList.remove('active');
            }
        });
    });

    // Add Device Functionality
    const addDeviceBtn = document.querySelector('.btn-add');
    const appliancesGrid = document.getElementById('appliancesGrid');
    let deviceCounter = 1;

    if (addDeviceBtn) {
        addDeviceBtn.addEventListener('click', () => {
            const deviceName = prompt('Enter device name (e.g., "Microwave", "Heater"):');
            if (!deviceName) return;

            const roomName = prompt('Enter room location (e.g., "Kitchen", "Bedroom"):');
            if (!roomName) return;

            const deviceTypes = {
                'ac': { icon: 'ph-snowflake', color: 'ac', colorCode: '#ee5d50' },
                'fan': { icon: 'ph-fan', color: 'fan', colorCode: '#4318ff' },
                'light': { icon: 'ph-lightbulb', color: 'lights', colorCode: '#fab005' },
                'fridge': { icon: 'ph-thermometer-cold', color: 'fridge', colorCode: '#05cd99' },
                'tv': { icon: 'ph-television', color: 'tv', colorCode: '#0ea5e9' },
                'washing': { icon: 'ph-washing-machine', color: 'machine', colorCode: '#a855f7' },
                'default': { icon: 'ph-plug', color: 'machine', colorCode: '#a855f7' }
            };

            const deviceType = deviceName.toLowerCase().includes('ac') || deviceName.toLowerCase().includes('air') ? 'ac' :
                deviceName.toLowerCase().includes('fan') ? 'fan' :
                    deviceName.toLowerCase().includes('light') || deviceName.toLowerCase().includes('bulb') ? 'light' :
                        deviceName.toLowerCase().includes('fridge') || deviceName.toLowerCase().includes('refrigerator') ? 'fridge' :
                            deviceName.toLowerCase().includes('tv') || deviceName.toLowerCase().includes('television') ? 'tv' :
                                deviceName.toLowerCase().includes('wash') ? 'washing' : 'default';

            const device = deviceTypes[deviceType];
            const uniqueId = `device-${Date.now()}`;

            const newCard = document.createElement('div');
            newCard.className = 'card appliance-card';
            newCard.dataset.room = roomName;
            newCard.innerHTML = `
                <div class="card-status"></div>
                <div class="app-header">
                    <div class="icon-box ${device.color}"><i class="ph-fill ${device.icon}"></i></div>
                    <div class="toggle-switch">
                        <input type="checkbox" id="${uniqueId}">
                        <label for="${uniqueId}"></label>
                    </div>
                </div>
                <div class="app-details">
                    <h3>${deviceName}</h3>
                    <p>${roomName} • New Device</p>
                </div>
                <div class="app-metrics">
                    <div class="metric">
                        <span class="label">Usage</span>
                        <span class="val">0.0 kWh</span>
                    </div>
                    <div class="metric">
                        <span class="label">Cost/Mo</span>
                        <span class="val">₹0</span>
                    </div>
                </div>
                <div class="sparkline-container">
                    <canvas id="sparkline-${uniqueId}"></canvas>
                </div>
                <div class="app-footer">
                    <span>Just added</span>
                </div>
            `;

            appliancesGrid.appendChild(newCard);

            // Create sparkline for new device
            setTimeout(() => {
                createSparkline(`sparkline-${uniqueId}`, device.colorCode, [0, 0, 0, 0, 0, 0, 0]);
            }, 100);

            // Add toggle functionality to new device
            const newToggle = newCard.querySelector('.toggle-switch input');
            newToggle.addEventListener('change', (e) => {
                const status = newCard.querySelector('.card-status');
                if (e.target.checked) {
                    status.classList.add('active');
                } else {
                    status.classList.remove('active');
                }
            });

            alert(`${deviceName} added successfully to ${roomName}!`);
        });
    }

    // Search Functionality for Appliances
    const searchInput = document.querySelector('.search-bar input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();

            cards.forEach(card => {
                const deviceName = card.querySelector('.app-details h3')?.textContent.toLowerCase() || '';
                const deviceLocation = card.querySelector('.app-details p')?.textContent.toLowerCase() || '';

                if (deviceName.includes(searchTerm) || deviceLocation.includes(searchTerm)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }
});
