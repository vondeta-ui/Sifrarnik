document.addEventListener('DOMContentLoaded', () => {
    const contentDiv = document.getElementById('content');
    const mainTitle = document.getElementById('main-title');
    const scannerContainer = document.getElementById('scanner-container');
    const closeScannerBtn = document.getElementById('close-scanner-btn');

    let sviPodaci = [];
    let searchTerm = '';
    let scrollPosition = 0;
    let scrollListener = null; // Promenljiva za čuvanje scroll listenera

    // RUTER FUNKCIJE
    function renderPage(templateId, data = {}) {
        const template = document.getElementById(templateId);
        if (!template) { console.error('Template not found:', templateId); return; }
        const clonedContent = document.importNode(template.content, true);
        contentDiv.innerHTML = '';
        contentDiv.appendChild(clonedContent);

        // Uklanjamo stari listener da se ne bi duplirao
        if (scrollListener) {
            window.removeEventListener('scroll', scrollListener);
        }

        if (templateId === 'template-home') {
            const poljeZaPretragu = document.getElementById('poljeZaPretragu');
            poljeZaPretragu.value = searchTerm;
            poljeZaPretragu.addEventListener('keyup', (e) => {
                searchTerm = e.target.value;
                pretraziPodatke(searchTerm);
            });
            pretraziPodatke(searchTerm);
            setTimeout(() => { window.scrollTo(0, scrollPosition); }, 0);

            const barcodeScannerBtn = document.getElementById('barcode-scanner-btn');
            if(barcodeScannerBtn) {
                barcodeScannerBtn.addEventListener('click', () => {
                    // === IZMENA ZA BACK DUGME #1: Postavljamo hash da bismo otvorili skener ===
                    window.location.hash = 'scanner';
                });
            }

            // === IZMENA ZA SKLANJANJE TASTATURE ===
            // Definišemo funkciju listenera
            scrollListener = () => {
                // Proveravamo da li je polje za pretragu u fokusu
                if (document.activeElement === poljeZaPretragu) {
                    poljeZaPretragu.blur(); // Uklanjamo fokus, što sklanja tastaturu
                }
            };
            // Dodajemo listener na prozor
            window.addEventListener('scroll', scrollListener);


        } else if (templateId === 'template-artikal') {
            displayArtikalDetails(data);
            document.getElementById('nazad-na-pretragu-btn').addEventListener('click', () => navigate('home'));
        } else if (templateId === 'template-barcode-not-found') {
            document.getElementById('nazad-na-pretragu-btn-notfound').addEventListener('click', () => navigate('home'));
        }
    }
    function navigate(page, data = null) {
        if (window.location.hash === '' || window.location.hash.startsWith('#home')) {
            scrollPosition = window.scrollY;
        }
        if (page === 'home') { window.location.hash = 'home'; }
        else if (page === 'artikal' && data && data.robe_sifra) { window.location.hash = `artikal/${data.robe_sifra}`; }
        else if (page === 'barcode-not-found') { window.location.hash = 'barcode-not-found'; }
        // Ne zovemo route() direktno, hashchange listener će to uraditi
    }
    
    // Glavna funkcija za rutiranje na osnovu URL hash-a
    function route() {
        const hash = window.location.hash;

        // === IZMENA ZA BACK DUGME #2: Logika za prikazivanje/skrivanje skenera ===
        if (hash === '#scanner') {
            scannerContainer.classList.remove('scanner-hidden');
            startScanner(handleBarcodeScanned);
            return; // Prekini dalje izvršavanje
        } else {
            // Ako hash nije #scanner, osiguraj da je skener sakriven
            if (!scannerContainer.classList.contains('scanner-hidden')) {
                stopScanner();
                scannerContainer.classList.add('scanner-hidden');
            }
        }

        if (!hash || hash === '#home') { renderPage('template-home'); }
        else if (hash.startsWith('#artikal/')) {
            const sifra = hash.substring(hash.lastIndexOf('/') + 1);
            const artikal = sviPodaci.find(item => String(item.robe_sifra) === sifra);
            if (artikal) { renderPage('template-artikal', artikal); }
            else { window.location.hash = 'home'; }
        } else if (hash === '#barcode-not-found') { renderPage('template-barcode-not-found'); }
    }

    // UČITAVANJE PODATAKA (bez izmena)
    fetch('aktiv.json')
        .then(response => { if (!response.ok) { throw new Error('Mreža nije odgovorila sa OK'); } return response.text(); })
        .then(text => {
            const correctedText = text.replace(/("robe_sifra":\s*)(\d+)/g, '$1"$2"').replace(/("bar_cod":\s*)(\d+)/g, '$1"$2"');
            const data = JSON.parse(correctedText);
            sviPodaci = data.map(stavka => ({ ...stavka, robe_sifra: String(stavka.robe_sifra), bar_cod: String(stavka.bar_cod || '') }));
            route(); // Prvo pokretanje rutera
        })
        .catch(error => {
            console.error('Greška pri učitavanju ili parsiranju aktiv.json:', error);
            contentDiv.innerHTML = '<p style="color:red;">Greška pri učitavanju podataka.</p>';
        });

    // FUNKCIJE PRETRAGE I PRIKAZA (bez izmena)
    function pretraziPodatke(text) {
        const kontejnerRezultata = document.getElementById('rezultatiPretrage');
        if (!kontejnerRezultata) return;
        const trenutniSkrol = window.scrollY;
        kontejnerRezultata.innerHTML = '';
        const unetiTekst = text.toLowerCase().trim();
        if (unetiTekst.length === 0) { return; }
        const keywords = unetiTekst.split(' ').filter(k => k.length > 0);
        const filtriraniPodaci = sviPodaci.filter(stavka => {
            const sifra = stavka.robe_sifra.toLowerCase();
            const naziv = (stavka.robe_naziv || '').toLowerCase();
            const sifraMatch = sifra.includes(unetiTekst);
            const nazivMatch = keywords.every(keyword => naziv.includes(keyword));
            return sifraMatch || nazivMatch;
        });
        if (filtriraniPodaci.length === 0) {
            kontejnerRezultata.innerHTML = '<p>Nema rezultata za uneti pojam.</p>';
        } else {
            filtriraniPodaci.forEach(stavka => {
                const divStavke = document.createElement('div');
                divStavke.className = 'artikal-stavka';
                divStavke.innerHTML = `<h3>${stavka.robe_naziv}</h3><p><strong>Šifra:</strong> ${stavka.robe_sifra}</p><p><strong>Bar-kod:</strong> ${stavka.bar_cod || 'N/A'}</p>`;
                divStavke.addEventListener('click', () => navigate('artikal', stavka));
                kontejnerRezultata.appendChild(divStavke);
            });
        }
        window.scrollTo(0, trenutniSkrol);
    }
    function displayArtikalDetails(artikal) {
        const detaljiArtiklaDiv = document.getElementById('detaljiArtikla');
        // Prikazuje detalje koristeći podatke iz 'artikal' objekta
        detaljiArtiklaDiv.innerHTML = `
            <h2>${artikal.robe_naziv}</h2>
            <p><strong>Šifra:</strong> ${artikal.robe_sifra}</p>
            <p><strong>Naziv:</strong> ${artikal.robe_naziv}</p>
            <p><strong>Bar-kod:</strong> ${artikal.bar_cod || 'N/A'}</p>
        `;
    }

    // UPRAVLJANJE BARKOD SKENEROM
    closeScannerBtn.addEventListener('click', () => {
        // === IZMENA ZA BACK DUGME #3: Koristimo history.back() da bismo uklonili #scanner hash ===
        window.history.back();
    });
    function handleBarcodeScanned(decodedText, decodedResult) {
        // Ne moramo da sakrivamo kontejner, promena hash-a će to uraditi
        const foundArtikal = sviPodaci.find(item => item.bar_cod === decodedText);
        if (foundArtikal) {
            navigate('artikal', foundArtikal);
        } else {
            navigate('barcode-not-found');
        }
    }

    // GLOBALNI DOGAĐAJI
    mainTitle.addEventListener('click', () => {
        searchTerm = '';
        navigate('home');
    });

    // === IZMENA ZA BACK DUGME #4: Glavni listener koji reaguje na promene hash-a ===
    window.addEventListener('hashchange', route);
});