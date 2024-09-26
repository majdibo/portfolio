// Enhanced Copy to Clipboard Logic with Fallback
document.querySelectorAll('.copy-btn').forEach((button) => {
    button.addEventListener('click', (e) => {
        const codeBlock = e.target.closest('.code-snippet').querySelector('pre code');
        const codeText = codeBlock.innerText;

        // Try Clipboard API first
        if (navigator.clipboard) {
            navigator.clipboard.writeText(codeText).then(() => {
                // Provide feedback to the user
                button.innerHTML = '<i class="fa-solid fa-check success"></i>';
                setTimeout(() => {
                    button.innerHTML = '<i class="fa-regular fa-copy"></i>';
                }, 2000);
            }).catch((err) => {
                console.error('Clipboard API failed, falling back', err);
                fallbackCopyToClipboard(codeText, button);
            });
        } else {
            // Fallback if Clipboard API is not available
            fallbackCopyToClipboard(codeText, button);
        }
    });
});

// Fallback Method to Copy using a Temporary <textarea>
function fallbackCopyToClipboard(text, button) {
    const tempTextArea = document.createElement('textarea');
    tempTextArea.value = text;
    document.body.appendChild(tempTextArea);
    tempTextArea.select();

    try {
        document.execCommand('copy');
        button.innerHTML = '<i class="fa-solid fa-check success"></i>';
        setTimeout(() => {
            button.innerHTML = '<i class="fa-regular fa-copy"></i>';
        }, 2000);
    } catch (err) {
        console.error('Fallback copy failed', err);
    }

    // Remove the temporary textarea
    document.body.removeChild(tempTextArea);
}
