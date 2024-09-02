document.addEventListener('DOMContentLoaded', function() {
    const cookieBanner = document.getElementById('wncCookieBanner');

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
        cookieBanner.close();
    }

    document.querySelectorAll('#wncCookieBanner button').forEach(button => {
        button.addEventListener('click', function() {
            const accept = this.textContent.includes('Accept');
            updateCookies(accept);
        });
    });
});
