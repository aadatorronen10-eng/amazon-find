import './style.css';
// 1. HIGH-CONVERTING PRODUCT DATA (Popular Amazon Home Decor Items)
               const tuotteet = [
          {
            id: 1,
            nimi: "Govee RGBIC LED Neon Rope Light (10ft)",
            kuvaus: "The ultimate TikTok-viral room upgrade. Shape it into any design, control via app, and sync it with your music.",
            kategoria: "led-suosikit",
            hintaTaso: "Budget-Friendly",
            linkki: "#",
            kuvaUrl: "https://media-amazon.com"
          },
          {
            id: 2,
            nimi: "Logitech Litra Glow Premium LED Light",
            kuvaus: "Create the perfect cozy aesthetic or TikTok background instantly with professional-grade ambient lighting.",
            kategoria: "led-suosikit",
            hintaTaso: "Cheap Thrill",
            linkki: "#",
            kuvaUrl: "https://media-amazon.com"
          },
          {
            id: 3,
            nimi: "Modern Minimalist Arc Floor Lamp",
            kuvaus: "High-end luxury look for less. This sleek matte black statement piece provides beautiful dimmable lighting.",
            kategoria: "moderni",
            hintaTaso: "Premium Investment",
            linkki: "#",
            kuvaUrl: "https://media-amazon.com"
          },
          {
            id: 4,
            nimi: "Soft Bouclé Velvet Throw Pillow Covers",
            kuvaus: "Instantly elevate your sofa. These textured cream-white accent pillows add an organic minimalist vibe.",
            kategoria: "moderni",
            hintaTaso: "Budget-Friendly",
            linkki: "#",
            kuvaUrl: "https://media-amazon.com"
          },
          {
            id: 5,
            nimi: "SAFAVIEH Madison Boho Chic Vintage Rug",
            kuvaus: "The centerpiece of a warm home. Features an intricate traditional pattern with a beautifully faded look.",
            kategoria: "vintage",
            hintaTaso: "Premium Investment",
            linkki: "#",
            kuvaUrl: "https://media-amazon.com"
          },
          {
            id: 6,
            nimi: "Meyda Tiffany Vintage Amber Glass Desk Lamp",
            kuvaus: "Mid-century modern charm. Features a beautiful sturdy base paired with a warm amber glass shade.",
            kategoria: "vintage",
            hintaTaso: "Affordable Mid-Tier",
            linkki: "#",
            kuvaUrl: "https://media-amazon.com"
          }
        ];
 


// 2. DOM ELEMENTS
const tuoteRistikko = document.getElementById('products-grid');
const tyyliValitsin = document.getElementById('style-select');

// 3. RENDER FUNCTION
function naytaTuotteet(suodatin) {
  tuoteRistikko.innerHTML = ""; 
  
  const valitutTuotteet = tuotteet.filter(t => suodatin === "kaikki" || t.kategoria === suodatin);
  
  if(valitutTuotteet.length === 0) {
    tuoteRistikko.innerHTML = "<p style='grid-column: 1/-1; text-align: center; font-size: 1.2rem; color: #666;'>No products found in this category.</p>";
    return;
  }

  valitutTuotteet.forEach(tuote => {
    const kortti = document.createElement('div');
    kortti.className = 'product-card';
    kortti.innerHTML = `
      <!-- Tuotteen Oikea Kuva -->
      <img src="${tuote.kuvaUrl}" alt="${tuote.nimi}" class="product-image" style="object-fit: cover;">
      
      <div class="product-info">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
          <span class="product-tag">${tuote.kategoria}</span>
          <span style="font-size: 0.8rem; font-weight: bold; color: #2ecc71; background: #e8f8f0; padding: 0.2rem 0.5rem; border-radius: 4px;">${tuote.hintaTaso}</span>
        </div>
        <h3>${tuote.nimi}</h3>
        <p>${tuote.kuvaus}</p>
        <a href="${tuote.linkki}" target="_blank" rel="noopener noreferrer" class="amazon-btn">Check Price on Amazon →</a>
      </div>
    `;
    tuoteRistikko.appendChild(kortti);
  });
}

// 4. DROPDOWN EVENT LISTENER
tyyliValitsin.addEventListener('change', (e) => {
  naytaTuotteet(e.target.value);
});

// 5. TIKTOK DEEPLINK ROUTER
const urlParametrit = new URLSearchParams(window.location.search);
const suoraTyyliLinkki = urlParametrit.get('tyyli');

if (suoraTyyliLinkki && ["moderni", "vintage", "led-suosikit"].includes(suoraTyyliLinkki)) {
  tyyliValitsin.value = suoraTyyliLinkki;
  naytaTuotteet(suoraTyyliLinkki);
} else {
  naytaTuotteet("kaikki");
}
