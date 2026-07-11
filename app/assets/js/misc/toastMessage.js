const activeToasts = [];

const defaultDurations = {
    'success': 1500,
    'message': 2000,
    'warning': 2500,
    'error': 3000,
    'instance': 30000
};

const toast = {
    'create': (type, icon, content, duration) => {
        const intervalRate = 100;
        let toastTotalDuration = duration || defaultDurations[type] || 2000;
        let toastContainer = document.querySelector('#omnichess-toast-container');
        let fadeTime = 300;
        let elapsedTime = 0;
        let isHovered = false;
        let loadingSpinnerInterval;
        let customTimeout;

        // Deduplication Check
        const duplicate = activeToasts.find(t => t.type === type && t.content === content);
        if (duplicate) {
            duplicate.reset(duration);
            return { 'close': duplicate.close };
        }

        if(!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'omnichess-toast-container';
            document.body.appendChild(toastContainer);
        }

        const toastElem = document.createElement('div');
        toastElem.className = `omnichess-toast omnichess-toast-${type}`;

        function triggerFadeOut() {
            // Remove from activeToasts list
            const index = activeToasts.indexOf(toastObj);
            if (index !== -1) {
                activeToasts.splice(index, 1);
            }
            if (customTimeout) clearInterval(customTimeout);
            if (loadingSpinnerInterval) clearInterval(loadingSpinnerInterval);
            toastElem.classList.add('omnichess-toast-fadeout');
            setTimeout(() => toastElem.remove(), fadeTime);
        }

        const iconElem = document.createElement('div');
        iconElem.classList.add('omnichess-toast-icon');
        const emojiRegex = /\p{Emoji}/u;

        if(emojiRegex.test(icon)) {
            iconElem.innerText = icon;
        } else {
            iconElem.classList.add(icon);
        }

        const contentElem = document.createElement('div');
        contentElem.classList.add('omnichess-toast-content');
        contentElem.innerText = content;

        const closeBtn = document.createElement('button');
        closeBtn.classList.add('omnichess-toast-close-btn');
        closeBtn.innerHTML = '✕';
        closeBtn.onclick = () => triggerFadeOut();

        const progressContainer = document.createElement('div');
        progressContainer.classList.add('omnichess-toast-progress-container');
        const progressBarElem = document.createElement('div');
        progressBarElem.classList.add('omnichess-toast-progress-bar');
        progressContainer.appendChild(progressBarElem);

        toastElem.appendChild(iconElem);
        toastElem.appendChild(contentElem);
        toastElem.appendChild(closeBtn);
        toastElem.appendChild(progressContainer);

        toastElem.addEventListener('mouseenter', () => {
            isHovered = true;
        });
        toastElem.addEventListener('mouseleave', () => {
            isHovered = false;
        });

        function startTimer() {
            if (customTimeout) clearInterval(customTimeout);
            customTimeout = setInterval(() => {
                if(!document.body.contains(toastElem)) {
                    clearInterval(customTimeout);
                    if (loadingSpinnerInterval) clearInterval(loadingSpinnerInterval);
                    return;
                }

                if(isHovered) return;

                if(toastTotalDuration <= elapsedTime) {
                    clearInterval(customTimeout);
                    if (loadingSpinnerInterval) clearInterval(loadingSpinnerInterval);
                    triggerFadeOut();
                } else {
                    elapsedTime += intervalRate;
                    const progressPercent = `${Math.min(100, Math.ceil(elapsedTime / toastTotalDuration * 100))}%`;
                    progressBarElem.style.width = progressPercent;
                }
            }, intervalRate);
        }

        function reset(newDuration) {
            elapsedTime = 0;
            if (newDuration) {
                toastTotalDuration = newDuration;
            }
            toastElem.classList.remove('omnichess-toast-pulse');
            void toastElem.offsetWidth; // Force layout reflow to restart animation
            toastElem.classList.add('omnichess-toast-pulse');
            progressBarElem.style.width = '0%';
            startTimer();
        }

        if(type === 'instance') {
            const spinner = ['🕛','🕐','🕑','🕒','🕓','🕔','🕕','🕖','🕗','🕘','🕙','🕚'];
            let spinnerIndex = 0;
            let elapsed = 0;
            
            loadingSpinnerInterval = setInterval(() => {
                if(!document.body.contains(toastElem)) {
                    clearInterval(loadingSpinnerInterval);
                    return;
                }
                iconElem.innerText = spinner[spinnerIndex];
                spinnerIndex = (spinnerIndex + 1) % spinner.length;
                elapsed += 200;

                if(elapsed === (200 * 40)) {
                    const sMsg = TRANS_OBJ?.dependingOnNetworkSpeed ?? 'Depending on your network speed, it might take a while for the engine to load...';
                    const small = document.createElement('small');
                    small.innerText = `(${sMsg})`;

                    closeBtn.classList.add('highlight');
                    contentElem.appendChild(small);
                }
            }, 200);
        }

        toastContainer.prepend(toastElem);
        startTimer();

        const toastObj = {
            type,
            content,
            elem: toastElem,
            reset,
            close: triggerFadeOut
        };
        activeToasts.push(toastObj);

        return { 'close': triggerFadeOut };
    },
    'success': (content, duration) => toast.create('success', '👍', content, duration),
    'message': (content, duration) => toast.create('message', '🗿', content, duration),
    'warning': (content, duration) => toast.create('warning', '😐', content, duration),
    'error': (content, duration) => toast.create('error', '💀', content, duration),
    'instance': (content, duration) => toast.create('instance', '🕛', content, duration)
};