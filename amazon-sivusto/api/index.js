import { Groq } from 'groq-sdk';
import axios from 'axios';

// Alustetaan tekoäly
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

// APUFUNKTIO: Haetaan eBayan token
async function getEbayToken() {
    const auth = Buffer.from(`${process.env.EBAY_CLIENT_ID}:${process.env.EBAY_CLIENT_SECRET}`).toString('base64');
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
}

// VERCELIN NATIIVI HANDLER JOKA OTTAA PYYNNÖT VASTAAN
export default async function handler(req, res) {
    // Sallitaan CORS-yhteydet omalta sivustolta
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // TARKISTETAAN KUMPAA REITTIÄ KÄYTTÄJÄ HUUTAA OSOITERIVILLÄ
    const url = new URL(req.url, `http://${req.headers.host}`);

    // --- 1. EBAY HAKU ---
    if (url.pathname.includes('ai-style-search')) {
        try {
            const styleCategory = req.query.style || 'classic style';
            
            const aiResponse = await groq.chat.completions.create({
                model: "llama-3.3-70b-specdec",
                messages: [
                    { 
                        role: "system", 
                        content: "Your task is to convert a clothing style category into 3-4 effective keywords for searching unisex clothing items on eBay. Focus on iconic garments. Respond ONLY with space-separated English keywords." 
                    },
                    { role: "user", content: `Generate eBay search keywords for: "${styleCategory}".` }
                ],
                max_tokens: 20
            });

            const aiKeywords = aiResponse.choices.message.content.trim();
            const token = await getEbayToken();
            
            const response = await axios.get(`https://ebay.com{encodeURIComponent(aiKeywords)}&limit=100`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-EBAY-C-ENDUSERCTX': `affiliateCampaignId=${process.env.EBAY_CAMPAIGN_ID},affiliateReferenceId=tekoaly`
                }
            });
            
            return res.status(200).json({
                usedKeywords: aiKeywords,
                items: response.data.itemSummaries || []
            });
        } catch (error) {
            return res.status(500).json({ error: 'eBay-haku epäonnistui', details: error.message });
        }
    }

    // --- 2. AMAZON HAKULINKKI ---
    if (url.pathname.includes('amazon-search-link')) {
        try {
            const theme = req.query.theme || 'vintage living room';
            const trackingId = process.env.AMAZON_TRACKING_ID || 'associates-tag-20';

            const aiResponse = await groq.chat.completions.create({
                model: "llama-3.3-70b-specdec",
                messages: [
                    { 
                        role: "system", 
                        content: "Convert a home decor theme into 3-4 effective keywords for Amazon search. Respond ONLY with space-separated English keywords." 
                    },
                    { role: "user", content: `Keywords for: "${theme}".` }
                ],
                max_tokens: 15
            });

            const aiKeywords = aiResponse.choices.message.content.trim();
            const amazonUrl = `https://amazon.com{encodeURIComponent(aiKeywords)}&tag=${trackingId}`;

            return res.status(200).json({ url: amazonUrl });
        } catch (error) {
            return res.status(500).json({ error: 'Amazon-linkki epäonnistui' });
        }
    }

    // Jos reittiä ei löydy
    return res.status(404).json({ error: 'Reittiä ei löydy' });
}
