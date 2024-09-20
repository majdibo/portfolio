document.addEventListener('DOMContentLoaded', function() {
    const cookieBanner = document.getElementById('wncCookieBanner');

    if (needsCookieConsent()) {
        if (localStorage.getItem('wncCookieConsentMode') === null) {
            cookieBanner.showModal();
            gtag('consent', 'default', {
                ad_storage: 'denied',
                analytics_storage: 'denied',
                personalization_storage: 'denied',
                ad_personalization: 'denied',
                ad_user_data: 'denied',
                functionality_storage: 'denied',
                security_storage: 'denied',
            });
        } else {
            gtag('consent', 'default', JSON.parse(localStorage.getItem('wncCookieConsentMode')));
        }
    } else {
        const consentMode = {
            functionality_storage: 'granted',
            security_storage: 'granted',
            ad_storage: 'denied',
            analytics_storage: 'granted',
            personalization: 'denied',
            ad_personalization: 'denied',
            ad_user_data: 'denied'
        };
        gtag('consent', 'default', consentMode);
        localStorage.setItem('wncCookieConsentMode', JSON.stringify(consentMode));
    }



    document.querySelectorAll('#wncCookieBanner button').forEach(button => {
        button.addEventListener('click', function() {
            const accept = this.textContent.includes('Accept');
            updateCookies(accept);
        });
    });
});

function updateCookies(accept) {
    const consentMode = {
        functionality_storage: accept ? 'granted' : 'denied',
        security_storage: accept ? 'granted' : 'denied',
        ad_storage: 'denied',
        analytics_storage: accept ? 'granted' : 'denied',
        personalization: 'denied',
        ad_personalization: 'denied',
        ad_user_data: 'denied'
    };
    gtag('consent', 'update', consentMode);
    localStorage.setItem('wncCookieConsentMode', JSON.stringify(consentMode));

    const cookieBanner = document.getElementById('wncCookieBanner');
    cookieBanner.close();
}

function getUserCountryByTimezone() {
    // Get the user's timezone using JavaScript's built-in method
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const timeZoneToCountry = {
        "Europe/Vienna": "Austria",
        "Europe/Brussels": "Belgium",
        "Europe/Sofia": "Bulgaria",
        "Europe/Zagreb": "Croatia",
        "Asia/Nicosia": "Cyprus",
        "Europe/Prague": "Czech Republic",
        "Europe/Copenhagen": "Denmark",
        "Europe/Tallinn": "Estonia",
        "Europe/Helsinki": "Finland",
        "Europe/Paris": "France",
        "Europe/Berlin": "Germany",
        "Europe/Busingen": "Germany",
        "Europe/Athens": "Greece",
        "Europe/Budapest": "Hungary",
        "Atlantic/Reykjavik": "Iceland",
        "Europe/Dublin": "Ireland",
        "Europe/Rome": "Italy",
        "Europe/Riga": "Latvia",
        "Europe/Vilnius": "Lithuania",
        "Europe/Luxembourg": "Luxembourg",
        "Europe/Malta": "Malta",
        "Europe/Amsterdam": "Netherlands",
        "Europe/Oslo": "Norway",
        "Europe/Warsaw": "Poland",
        "Europe/Lisbon": "Portugal",
        "Atlantic/Madeira": "Portugal",
        "Atlantic/Azores": "Portugal",
        "Europe/Bucharest": "Romania",
        "Europe/Bratislava": "Slovakia",
        "Europe/Ljubljana": "Slovenia",
        "Europe/Madrid": "Spain",
        "Atlantic/Canary": "Spain",
        "Africa/Ceuta": "Spain",
        "Europe/Stockholm": "Sweden",
        "Europe/London": "UK",
        "Europe/Zurich": "Switzerland"
    };


    // Default country is "Unknown" if timezone isn't in the map
    return timeZoneToCountry[timeZone] || "Unknown";
}

function needsCookieConsent() {
    // List of GDPR countries
    const gdprCountries = [
        "Austria", "Belgium", "Bulgaria", "Croatia", "Cyprus", "Czech Republic", "Denmark",
        "Estonia", "Finland", "France", "Germany", "Greece", "Hungary", "Iceland", "Ireland",
        "Italy", "Latvia", "Lithuania", "Luxembourg", "Malta", "Netherlands", "Norway", "Poland",
        "Portugal", "Romania", "Slovakia", "Slovenia", "Spain", "Sweden", "UK"
    ];

    // Get the user's country based on their timezone
    const userCountry = getUserCountryByTimezone();

    // Check if the user's country is in the GDPR list
    if (gdprCountries.includes(userCountry)) {
        console.log("Show cookie consent banner,", userCountry);
        return true;  // Needs consent
    } else {
        console.log("No cookie consent required,", userCountry);
        return false;  // No consent required
    }
}
