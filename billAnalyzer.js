const GEMINI_API_KEY = 'AQ.Ab8RN6LYd8OMssD9K5v9ATDI2SwjXcu3Erk8CZK1_9vQWtHDhA';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

async function analyzeBill(file) {
    try {
        const base64Data = await fileToBase64(file);
        const base64Content = base64Data.split(',')[1];
        const mimeType = file.type;

        const prompt = `Analyze this electricity bill image and extract the following information in strict JSON format:
        {
            "customer_name": "Full Name",
            "bill_period": "Month Year",
            "units_consumed": number,
            "total_amount": number,
            "due_date": "YYYY-MM-DD",
            "fixed_charges": number,
            "energy_charges": number,
            "taxes_and_cess": number,
            "category_breakdown": {
                "Cooling": percentage,
                "Lighting": percentage,
                "Appliances": percentage,
                "Kitchen": percentage,
                "Others": percentage
            },
            "saving_tips": ["tip 1", "tip 2", "tip 3"],
            "predicted_next_bill": number
        }
        Provide ONLY the JSON object. Do not include markdown code blocks or extra text. If a field is missing, use null.`;

        const response = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: prompt },
                        { inline_data: { mime_type: mimeType, data: base64Content } }
                    ]
                }]
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Bill analysis failed');
        }

        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (rawText) {
            // Robust extraction of JSON even if AI wraps it in text or markdown
            let jsonStr = rawText.trim();
            if (jsonStr.includes('```')) {
                const match = jsonStr.match(/```(?:json)?([\s\S]*?)```/);
                if (match) jsonStr = match[1].trim();
            }

            try {
                const result = JSON.parse(jsonStr);
                saveBillData(result);
                return result;
            } catch (e) {
                console.error('Extraction Error:', rawText);
                throw new Error('Could not parse bill data. Please upload a clearer image.');
            }
        } else {
            throw new Error('No analysis data received from Gemini AI.');
        }
    } catch (error) {
        console.error('AnalyzeBill Error:', error);
        throw error;
    }
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

function saveBillData(data) {
    if (!data) return;
    
    // Save current bill
    localStorage.setItem('volttrack-last-bill', JSON.stringify(data));

    // Add to history if not already present
    let history = JSON.parse(localStorage.getItem('volttrack-bill-history') || '[]');
    const exists = history.some(h => h.date === data.bill_period && h.amount === data.total_amount);
    
    if (!exists) {
        history.unshift({
            id: Date.now(),
            date: data.bill_period,
            amount: data.total_amount,
            units: data.units_consumed
        });
        localStorage.setItem('volttrack-bill-history', JSON.stringify(history));
    }
}

// Prediction Logic
function predictFutureBill() {
    const lastBill = JSON.parse(localStorage.getItem('volttrack-last-bill'));

    if (!lastBill) {
        return {
            amount: '0',
            status: 'On Track'
        };
    }

    // Use API prediction if available, otherwise fallback to simple calculation
    const predictedAmount = lastBill.predicted_next_bill || (lastBill.total_amount * 1.05);
    const variance = (predictedAmount / lastBill.total_amount) - 1;

    return {
        amount: parseFloat(predictedAmount).toFixed(2),
        status: variance > 0.1 ? 'High' : 'On Track'
    };
}
