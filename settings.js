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

    // Profile Save Simulation
    const inputs = document.querySelectorAll('.profile-form input');
    inputs.forEach(input => {
        input.addEventListener('change', () => {
            console.log(`Setting updated: ${input.value}`);
            // Show a toast or notification in real app
        });
    });

    const dangerBtn = document.querySelector('.btn-danger');
    dangerBtn.addEventListener('click', () => {
        if (confirm('Are you absolutely sure you want to delete all usage history? This action cannot be undone.')) {
            alert('All data has been wiped.');
        }
    });
});
