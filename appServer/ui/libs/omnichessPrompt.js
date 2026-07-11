window.OmniChessPrompt = (function() {
    const dialog = document.createElement('dialog');
    dialog.classList.add('prompt-dialog');
    dialog.innerHTML = `
        <form method="dialog">
            <p id="omnichess-message"></p>
            <input type="text" id="omnichess-input" style="width: 90%; margin-bottom: 1em;" required />
            <menu style="display:flex; justify-content:flex-end; gap: 0.5em;">
                <button id="omnichess-cancel" class="omnichess-fancy-button" style="display: none; padding: 8px 15px;" type="button">Cancel</button>
                <button id="omnichess-ok" class="omnichess-fancy-button" style="padding: 8px 15px;" type="submit">OK</button>
            </menu>
        </form>
    `;

    document.body.appendChild(dialog);

    const messageElem = dialog.querySelector('#omnichess-message');
    const inputElem = dialog.querySelector('#omnichess-input');
    const cancelBtn = dialog.querySelector('#omnichess-cancel');

    cancelBtn.addEventListener('click', () => dialog.close('cancel'));

    return {
        prompt: function(message, defaultValue) {
            defaultValue = defaultValue || '';
            return new Promise(function(resolve) {
                messageElem.textContent = message;
                inputElem.value = defaultValue;

                function handler() {
                    dialog.removeEventListener('close', handler);
                    resolve(dialog.returnValue === 'cancel' ? null : inputElem.value);
                }

                dialog.addEventListener('close', handler);
                dialog.showModal();
                inputElem.focus();
            });
        }
    };
})();