document.addEventListener('DOMContentLoaded', function() {
    const apiKey = 'API-ad2c969a1e6a5a85899fabf847435fe689a2bc83';
    const apiUrl = 'https://api.majdibo.com/api/content/items/comments';
    const postUrl = 'https://api.majdibo.com/api/content/item/comments';
    const replyTo =  encodeURIComponent(window.location.pathname);

    function fetchComments() {
        fetch(`${apiUrl}?filter=${encodeURIComponent(JSON.stringify({ replyTo }))}`, {
            headers: {
                'accept': 'application/json',
                'api-key': apiKey
            }
        })
        .then(response => response.json())
        .then(data => {
            data.sort((a, b) => new Date(b.datetime) - new Date(a.datetime));
            const commentsList = document.getElementById('comments-list');
            commentsList.innerHTML = '';
            data.forEach(comment => {
                const commentElement = document.createElement('div');
                commentElement.classList.add('comment');
                const formattedDate = timeAgo(comment.datetime);
                commentElement.innerHTML = `
                    <p><strong>${comment.user}</strong> <small><abbr title="${comment.datetime}">${formattedDate}</abbr></small></p>
                    <p>${comment.text}</p>
                `;
                commentsList.appendChild(commentElement);
            });
        })
        .catch(error => console.error('Error fetching comments:', error));
    }

    function postComment(event) {
        event.preventDefault();

        let user = localStorage.getItem('username');
        if (!user) {
            user = document.getElementById('user').value;
            localStorage.setItem('username', user);
        }
        let email = localStorage.getItem('email');
        if (!email) {
            email = document.getElementById('email').value;
            localStorage.setItem('email', email);
        }
        const text = document.getElementById('comment-text').value;
        const datetime = new Date().toISOString();

        const commentData = {
            data: {
                user,
                email,
                text,
                replyTo,
                datetime
            }
        };

        fetch(postUrl, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': apiKey,
                'content-type': 'application/json'
            },
            body: JSON.stringify(commentData)
        })
            .then(response => response.json())
            .then(data => {
                console.log('Comment posted:', data);
                fetchComments();
                updateForm(user);
                document.getElementById('comment-form').reset();
            })
            .catch(error => console.error('Error posting comment:', error));
    }

    function updateForm(user) {
        document.getElementById('user').style.display = 'none';
        document.getElementById('email').style.display = 'none';
        const formHeader = document.querySelector('#comment-form h3');
        if (formHeader) {
            formHeader.textContent = `Hey ${user}, share your thoughts`;
        } else {
            const newHeader = document.createElement('h3');
            newHeader.textContent = `Hey ${user}, share your thoughts`;
            document.getElementById('comment-form').prepend(newHeader);
        }
    }

    function displayWelcomeMessage(user) {
        const formHeader = document.querySelector('#comment-form h3');
        if (formHeader) {
            formHeader.textContent = `Hey ${user}, share your thoughts`;
        } else {
            const newHeader = document.createElement('h3');
            newHeader.textContent = `Hey ${user}, share your thoughts`;
            document.getElementById('comment-form').prepend(newHeader);
        }
    }

    const storedUser = localStorage.getItem('username');
    if (storedUser) {
        document.getElementById('user').value = storedUser;
        document.getElementById('user').style.display = 'none';
        displayWelcomeMessage(storedUser);
    }

    const storedEmail = localStorage.getItem('email');
    if (storedEmail) {
        document.getElementById('email').value = storedEmail;
        document.getElementById('email').style.display = 'none';
    }

    document.getElementById('comment-form').addEventListener('submit', postComment);

    fetchComments();
});

function timeAgo(date) {
    const now = new Date();
    const secondsPast = (now.getTime() - new Date(date).getTime()) / 1000;

    if (secondsPast < 60) {
        return "just now";
    }
    if (secondsPast < 3600) {
        return `${Math.floor(secondsPast / 60)} minutes ago`;
    }
    if (secondsPast < 86400) {
        return `${Math.floor(secondsPast / 3600)} hours ago`;
    }
    if (secondsPast < 2592000) {
        return `${Math.floor(secondsPast / 86400)} days ago`;
    }
    if (secondsPast < 31536000) {
        return `${Math.floor(secondsPast / 2592000)} months ago`;
    }
    return `${Math.floor(secondsPast / 31536000)} years ago`;
}

