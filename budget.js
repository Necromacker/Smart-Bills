document.addEventListener('DOMContentLoaded', () => {
    // Theme Management with localStorage
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const html = document.documentElement;

    // Load saved theme or default to light
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

    // Budget Slider Logic
    const budgetRange = document.getElementById('budgetRange');
    const budgetValue = document.getElementById('budgetValue');
    const dailyLimitText = document.querySelector('.budget-impact strong');

    if (budgetRange && budgetValue) {
        const savedBudget = localStorage.getItem('volttrack-budget') || 5000;
        budgetRange.value = savedBudget;
        budgetValue.textContent = parseInt(savedBudget).toLocaleString();
        if (dailyLimitText) dailyLimitText.textContent = `₹${Math.floor(savedBudget / 30)}/day`;

        budgetRange.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            budgetValue.textContent = val.toLocaleString();
            if (dailyLimitText) dailyLimitText.textContent = `₹${Math.floor(val / 30)}/day`;
        });
    }

    const saveBtn = document.getElementById('saveBudget');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            const val = budgetRange.value;
            localStorage.setItem('volttrack-budget', val);
            alert(`Target budget updated to ₹${parseInt(val).toLocaleString()}!`);
            updateUI();
        });
    }

    // Bill Upload Handling
    const billUpload = document.getElementById('billUpload');
    const analysisOverlay = document.getElementById('analysisOverlay');
    const dataModal = document.getElementById('dataModal');
    const billForm = document.getElementById('billForm');
    const closeModal = document.getElementById('closeModal');

    let currentAnalysis = null;

    if (billUpload) {
        billUpload.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (analysisOverlay) analysisOverlay.style.display = 'flex';

            try {
                currentAnalysis = await analyzeBill(file);

                // Populate Modal
                document.getElementById('formName').value = currentAnalysis.customer_name || '';
                document.getElementById('formUnits').value = currentAnalysis.units_consumed || '';
                document.getElementById('formAmount').value = currentAnalysis.total_amount || '';
                document.getElementById('formPeriod').value = currentAnalysis.bill_period || '';

                if (dataModal) dataModal.style.display = 'flex';
            } catch (error) {
                alert('Error analyzing bill. Please try again.');
            } finally {
                if (analysisOverlay) analysisOverlay.style.display = 'none';
            }
        });
    }

    if (billForm) {
        billForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const updatedData = {
                ...currentAnalysis,
                customer_name: document.getElementById('formName').value,
                units_consumed: parseFloat(document.getElementById('formUnits').value),
                total_amount: parseFloat(document.getElementById('formAmount').value),
                bill_period: document.getElementById('formPeriod').value
            };

            saveBillData(updatedData);
            updateUI();
            if (dataModal) dataModal.style.display = 'none';
            alert('Bill details saved successfully!');
        });
    }

    if (closeModal) {
        closeModal.addEventListener('click', () => {
            if (dataModal) dataModal.style.display = 'none';
        });
    }

    // Clear History Logic
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear your billing history?')) {
                localStorage.removeItem('volttrack-bill-history');
                updateUI();
            }
        });
    }

    function updateUI() {
        const lastBill = JSON.parse(localStorage.getItem('volttrack-last-bill'));
        const budget = parseFloat(localStorage.getItem('volttrack-budget') || 5000);

        const predictionVal = document.querySelector('.expected .val');
        const fixedCharges = document.getElementById('fixedChargesVal');
        const energyCharges = document.getElementById('energyChargesVal');
        const energyLabel = document.getElementById('energyLabel');
        const taxes = document.getElementById('taxesVal');
        const historyList = document.getElementById('historyList');

        if (lastBill) {
            const prediction = predictFutureBill();
            if (prediction && predictionVal) {
                predictionVal.textContent = `₹ ${prediction.amount}`;
                const statusIndicator = document.querySelector('.status-indicator');
                if (statusIndicator) {
                    statusIndicator.className = `status-indicator ${prediction.status === 'On Track' ? 'safe' : 'warning'}`;
                    statusIndicator.innerHTML = `<i class="ph-bold ph-${prediction.status === 'On Track' ? 'check-circle' : 'warning'}"></i> ${prediction.status}`;
                }
            }

            if (fixedCharges) fixedCharges.textContent = `₹ ${lastBill.fixed_charges || 0}`;
            if (energyCharges) energyCharges.textContent = `₹ ${lastBill.energy_charges || 0}`;
            if (energyLabel) energyLabel.textContent = `Energy Used (${lastBill.units_consumed || 0} kWh)`;
            if (taxes) taxes.textContent = `₹ ${lastBill.taxes_and_cess || 0}`;

            // Weekly Progress
            const weekBars = document.querySelectorAll('.week-bar');
            const weekVals = document.querySelectorAll('.week-val');
            const totalAmount = lastBill.total_amount;
            const weekDistribution = [0.2, 0.25, 0.35, 0.2];

            weekBars.forEach((bar, i) => {
                const weekRatio = weekDistribution[i];
                const weekAmount = (totalAmount * weekRatio).toFixed(0);
                const weekTarget = budget / 4;
                const percentage = (weekAmount / weekTarget) * 100;

                bar.style.width = `${Math.min(percentage, 100)}%`;
                bar.style.background = percentage > 100 ? 'var(--text-red)' : percentage > 80 ? 'var(--text-orange)' : 'var(--text-green)';
                if (weekVals[i]) weekVals[i].textContent = `₹ ${weekAmount}`;
            });

        } else {
            if (predictionVal) predictionVal.textContent = '₹ ---';
            if (fixedCharges) fixedCharges.textContent = '₹ ---';
            if (energyCharges) energyCharges.textContent = '₹ ---';
            if (energyLabel) energyLabel.textContent = 'Energy Used (--- kWh)';
            if (taxes) taxes.textContent = '₹ ---';
            const weekVals = document.querySelectorAll('.week-val');
            weekVals.forEach(v => v.textContent = '₹ ---');
        }

        const history = JSON.parse(localStorage.getItem('volttrack-bill-history') || '[]');
        if (historyList) {
            if (history.length > 0) {
                historyList.innerHTML = history.map(item => {
                    const dateParts = (item.date || 'JAN 2024').split(' ');
                    const month = dateParts[0].substring(0, 3).toUpperCase();
                    const year = dateParts[1] || '';
                    return `
                        <div class="history-item">
                            <div class="date-box">
                                <strong>${month}</strong>
                                <span>${year}</span>
                            </div>
                            <div class="bill-info">
                                <strong>₹ ${parseFloat(item.amount || 0).toLocaleString()}</strong>
                                <span>${item.units || 0} units consumed</span>
                            </div>
                            <button class="btn-icon"><i class="ph-bold ph-download-simple"></i></button>
                        </div>
                    `;
                }).join('');
            } else {
                historyList.innerHTML = '<div class="empty-state" style="text-align:center; padding: 20px; color: var(--text-secondary);">No bills analyzed yet.</div>';
            }
        }
    }

    updateUI();
});
