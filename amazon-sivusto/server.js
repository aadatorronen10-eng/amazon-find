require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { Groq } = require('groq-sdk'); // Tuodaan Groq OpenAI:n tilalle

const app = express();
const PORT = process.env.PORT || 3000;

// Alustetaan Groq käyttäen .env-tiedoston avainta
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// FUNKTIO: Pyytää eBayan palvelimelta väliaikaisen OAuth-tokenin
async function getEbayToken() {
    const auth = Buffer.from(`${process.env.EBAY_CLIENT_ID}:${process.env.EBAY_CLIENT_SECRET}`).toString('base64');
    try {
        const response = await axios.post('https://ebay.com', 
            'grant_type=client_credentials&scope=https://ebay.com', 
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${auth}`
                }
            }
        );
        return response.data.access_token;
    } catch (error) {
        console.error('eBay Token -virhe:', error.message);
        throw error;
    }
}

// API-REITTI: Groq-tekoälypohjainen tuotehaku kategorian mukaan
app.get('/api/ai-style-search', async (req, res) => {
    try {
        const styleCategory = req.query.style || 'classic style';
        
        // 1. Pyydetään Groqia generoimaan parhaat hakusanat eBayta varten (Llama-3-mallilla)
        const aiResponse = await groq.chat.completions.create({
            model: "llama-3.3-70b-specdec", // Huippunopea ja älykäs avoimen lähdekoodin malli
            messages: [
                { 
                    role: "system", 
                    content: "Your task is to convert a clothing style category into 3-4 highly effective, specific keywords for searching unisex clothing items on eBay. Focus on iconic garments, textures, or key clothing pieces for that style. Respond ONLY with the space-separated English keywords. Do not include quotes, explanations, punctuation, or words like clothing or apparel." 
                },
                { 
                    role: "user", 
                    content: `Generate eBay search keywords for this style: "${styleCategory}". It must target unisex fashion items.` 
                }
            ],
            max_tokens: 20
        });

        const aiKeywords = aiResponse.choices[0].message.content.trim();
        console.log(`[Groq AI stailisti] Kategoria: "${styleCategory}" -> Hakusanat eBaylle: "${aiKeywords}"`);

        // 2. Haetaan tuotteet eBaysta tekoälyn keksimillä hakusanoilla
        const token = await getEbayToken();
        const response = await axios.get(`https://ebay.com{encodeURIComponent(aiKeywords)}&limit=100`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'X-EBAY-C-ENDUSERCTX': `affiliateCampaignId=${process.env.EBAY_CAMPAIGN_ID},affiliateReferenceId=tekoaly_tyylit`
            }
        });
        
        res.json({
            usedKeywords: aiKeywords,
            items: response.data.itemSummaries || []
        });

    } catch (error) {
        console.error('Groq- tai eBay-haku epäonnistui:', error.message);
        res.status(500).json({ error: 'Tuotteiden haku epäonnistui' });
    }
});

app.listen(PORT, () => {
    console.log(`Groq-tekoälypalvelin käynnissä portissa http://localhost:${PORT}`);
});
