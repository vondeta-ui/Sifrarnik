// barKodSkener.js

let html5QrcodeScanner = null;

// Funkcija za pokretanje skenera
function startScanner(onScanSuccess) {
    // Funkcija koja se poziva u slučaju greške (npr. ne može da nađe barkod)
    // Ostavljamo je praznu da ne bi ispisivala poruke u konzoli sve vreme
    const onScanFailure = (error) => {
        // console.warn(`Code scan error = ${error}`);
    };

    // Ako skener nije već inicijalizovan, kreiraj novi
    if (!html5QrcodeScanner) {
        html5QrcodeScanner = new Html5QrcodeScanner(
            "reader", // ID diva gde će se skener prikazati
            {
                fps: 10, // Preporučeno
                qrbox: { width: 250, height: 150 }, // Pravougaoni oblik, bolji za barkodove
                rememberLastUsedCamera: true,
                supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
            },
            /* verbose= */ false
        );
    }
    
    // Pokreni renderovanje skenera i prosledi funkcije za uspeh i neuspeh
    html5QrcodeScanner.render(onScanSuccess, onScanFailure);
}

// Funkcija za zaustavljanje i brisanje skenera
function stopScanner() {
    if (html5QrcodeScanner) {
        html5QrcodeScanner.clear().catch(error => {
            console.error("Greška pri zaustavljanju skenera.", error);
        });
        html5QrcodeScanner = null;
    }
}