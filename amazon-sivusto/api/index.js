import express from 'express';
import axios from 'axios';
import cors from 'cors';
import { Groq } from 'groq-sdk';
import serverless from 'serverless-http';

const app = express();

// Alustetaan Groq Vercelin ympäristömuuttujista
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

app.use(cors());
app.use(express.json());

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

// REITTI 1: eBay-haku
app.get('/api/ai-style-search', async (req, res) => {
    try {
        const styleCategory = req.query.style || 'classic style';
        
        const aiResponse = await groq.chat.completions.create({
            model: "llama-3.3-70b-specdec",
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

        const aiKeywords = aiResponse.choices.message.content.trim();
        console.log(`[Groq AI stailisti] Kategoria: "${styleCategory}" -> Hakusanat eBaylle: "${aiKeywords}"`);

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
        res.status(500).json({ error: 'Tuotteiden haku epäonnistui', details: error.message });
    }
});

// REITTI 2: Amazon-affiliate-linkki
app.get('/api/amazon-search-link', async (req, res) => {
    try {
        const theme = req.query.theme || 'vintage living room';
        const trackingId = process.env.AMAZON_TRACKING_ID || 'associates-tag-20';

        const aiResponse = await groq.chat.completions.create({
            model: "llama-3.3-70b-specdec",
            messages: [
                { 
                    role: "system", 
                    content: "Your task is to convert a home decor or product theme into 3-4 highly effective, specific keywords for searching products on Amazon. Respond ONLY with the space-separated English keywords. Do not include quotes, explanations, punctuation, or generic filler words." 
                },
                { 
                    role: "user", 
                    content: `Generate Amazon search keywords for this theme: "${theme}".` 
                }
            ],
            max_tokens: 15
        });

        const aiKeywords = aiResponse.choices.message.content.trim();
        const amazonUrl = `https://amazon.com{encodeURIComponent(aiKeywords)}&tag=${trackingId}`;

        console.log(`[Amazon AI] Teema: "${theme}" -> Hakusanat: "${aiKeywords}"`);
        res.json({ url: amazonUrl });

    } catch (error) {
        console.error('Amazon-hakulinkin luonti epäonnistui:', error.message);
        res.status(500).json({ error: 'Linkin luonti epäonnistui' });
    }
});

// Vienti ES Module -muodossa
const handler = serverless(app);
export default handler;
