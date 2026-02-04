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

    // Budget Slider Logic
    const budgetRange = document.getElementById('budgetRange');
    const budgetValue = document.getElementById('budgetValue');
    const dailyLimitText = document.querySelector('.budget-impact strong');

    budgetRange.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        budgetValue.textContent = val.toLocaleString();

        // Calculate daily estimate
        const daily = Math.floor(val / 30);
        dailyLimitText.textContent = `₹${daily}/day`;
    });

    const saveBtn = document.getElementById('saveBudget');
    saveBtn.addEventListener('click', () => {
        const val = budgetRange.value;
        alert(`Target budget updated to ₹${parseInt(val).toLocaleString()}!`);
    });
});
