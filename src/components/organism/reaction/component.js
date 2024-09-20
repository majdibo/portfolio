document.addEventListener('DOMContentLoaded', (event) => {
    getReactionCounts();
    generateAnonymousId();
});

let selectedReaction = null;
let userId = localStorage.getItem('anonymousId');
let username = localStorage.getItem('username');

function generateAnonymousId() {
    if (!localStorage.getItem('anonymousId')) {
        const anonymousId = crypto.randomUUID();
        localStorage.setItem('anonymousId', anonymousId);
        userId = anonymousId;
    }
}

function selectReaction(reactionType) {
    checkExistingReaction(reactionType).then(exists => {
        if (!exists) {
            selectedReaction = reactionType;
            addReaction(reactionType);
        } else {
            console.log('Reaction already exists for this user and content.');
        }
    });
}

function checkExistingReaction(reactionType) {
    return fetch(`https://api.majdibo.com/api/content/items/reactions?filter=%7B+%22user%22%3A+%22${userId}%22%2C+%22reactTo%22%3A+%22${encodeURIComponent(window.location.pathname)}%22%2C+%22reactionType%22%3A+%22${reactionType}%22%7D&fields=%7B%22reactionType%22%3Atrue%2C+%22_id%22%3Afalse%7D`, {
        method: 'GET',
        headers: {
            'accept': 'application/json',
            'api-key': 'API-ad2c969a1e6a5a85899fabf847435fe689a2bc83'
        }
    })
        .then(response => response.json())
        .then(data => data.length > 0)
        .catch((error) => {
            console.error('Error:', error);
            return false;
        });
}

function addReaction(reactionType) {
    const data = {
        data: {
            user: userId,
            reactTo: window.location.pathname,
            reactionType: reactionType
        }
    };

    fetch('https://api.majdibo.com/api/content/item/reactions', {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'api-key': 'API-ad2c969a1e6a5a85899fabf847435fe689a2bc83',
            'content-type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
            getReactionCounts();
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}

function getReactionCounts() {
    fetch(`https://api.majdibo.com/api/content/items/reactions?filter=%7B+%22reactTo%22%3A+%22${encodeURIComponent(window.location.pathname)}%22%7D&fields=%7B%22reactionType%22%3Atrue%2C+%22_id%22%3Afalse%7D`, {
        method: 'GET',
        headers: {
            'accept': 'application/json',
            'api-key': 'API-ad2c969a1e6a5a85899fabf847435fe689a2bc83'
        }
    })
        .then(response => response.json())
        .then(data => {
            const counts = {
                'Inspiring': 0,
                'Insightful': 0,
                'Basic': 0,
                'Confusing': 0,
                'Misleading': 0
            };

            data.forEach(reaction => {
                counts[reaction.reactionType]++;
            });

            document.getElementById('count-inspiring').innerText = counts['Inspiring'];
            document.getElementById('count-insightful').innerText = counts['Insightful'];
            document.getElementById('count-basic').innerText = counts['Basic'];
            document.getElementById('count-confusing').innerText = counts['Confusing'];
            document.getElementById('count-misleading').innerText = counts['Misleading'];
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}
