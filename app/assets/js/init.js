import { createInstance } from './instanceManager.js';
import { installNotificationElem, autoMoveCheckbox, hiddenSettingPanel } from './gui/elementDeclarations.js';
import { highlightSettingElem, initGUI } from './gui.js';

let started = false;

function displayNoUserscriptNotification(isEnable) {
    if(isEnable)
        installNotificationElem.classList.add('hidden');
    else
        installNotificationElem.classList.remove('hidden');
}

async function initDbValue(name, value) {
    const dbValue = await USERSCRIPT.getValue(name);

    if(dbValue === undefined) {
        USERSCRIPT.setValue(name, value);
    }

    return true;
}

async function initializeDatabase() {
    const gmConfigKey = USERSCRIPT_SHARED_VARS.gmConfigKey;
    const tempValueIndicator = USERSCRIPT_SHARED_VARS.tempValueIndicator;

    // add OmniChessConfig value if it doesn't exist already
    await initDbValue(gmConfigKey, {
        'global': {
            'chessEngineProfile': 'default',
            'profiles': {
                'default': {
                    'engineEnabled': true,
                    'chessEngine': 'stockfish-18-lite-single',
                    'engineElo': 2600
                }
            }
        }
    });

    await MIGRATE_OUTDATED_PROFILE_KEYS(); // migrates old profile keys to new format if necessary

    const currentConfig = await USERSCRIPT.getValue(gmConfigKey);
    if(currentConfig?.global && !currentConfig.global.profiles?.default) {
        currentConfig.global.profiles ??= {};
        currentConfig.global.profiles.default ??= {
            'engineEnabled': true,
            'chessEngine': 'stockfish-18-lite-single',
            'engineElo': 2600
        };
        await USERSCRIPT.setValue(gmConfigKey, currentConfig);
    }

    const gmStorageKeys = await USERSCRIPT.listValues();
    const tempValueKeys = gmStorageKeys.filter(key => key.includes(tempValueIndicator));
    const config = await USERSCRIPT.getValue(gmConfigKey);
    
    const configInstances = config?.instance;
    
    // removes instance config values from instance IDs that aren't active anymore
    if(configInstances) {
        const configInstanceKeys = Object.keys(configInstances);

        configInstanceKeys.forEach(instanceIdKey => {
            const isConfigInstanceRelevant = tempValueKeys.find(key => key.includes(instanceIdKey))
                ? true : false;

            if(!isConfigInstanceRelevant) {
                delete config.instance[instanceIdKey];

                USERSCRIPT.setValue(gmConfigKey, config);
            }
        });
    }
    
    const expiredKeys = await Promise.all(
        tempValueKeys.map(async key => {
            const configValue = await USERSCRIPT.getValue(key);
            // Treat malformed/missing entries as expired so they get cleaned up,
            // and avoid crashing initializeDatabase() on a TypeError.
            if(!configValue || typeof configValue.date !== 'number') return key;
            const isExpired = Date.now() - configValue.date > 6e4 * 60;
            return isExpired ? key : null;
        })
    );
    
    // removes temp values with no usage for over 60 minutes
    expiredKeys
        .filter(key => key !== null)
        .forEach(key => USERSCRIPT.deleteValue(key));
}

function processUrlParams() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const highlight = urlParams.get('hl');
    const settingToHighlight = urlParams.get('shl');

    if(highlight) {
        switch(highlight) {
            case 'controlPanel':
                highlightSettingElem(document.querySelector('#settings-control-panel'), 
                    REMOVE_PARAM_FROM_URL('hl'));
                break;
            case 'supportedSites':
                highlightSettingElem(document.querySelector('#see-supported-sites-btn'), 
                    REMOVE_PARAM_FROM_URL('hl'));
                break;
        }
    } else if(settingToHighlight) {
        const foundSettingElem = [...document.querySelectorAll('input[data-key]')]
            .find(elem => elem.dataset.key === settingToHighlight);

        const settingContainer = foundSettingElem?.closest('.custom-input');

        if(foundSettingElem && settingContainer) {
            highlightSettingElem(settingContainer, () => REMOVE_PARAM_FROM_URL('shl'));
        }
    }

    if(urlParams.get('hidden') === 'true')
        hiddenSettingPanel.classList.remove('hidden');
    else if(autoMoveCheckbox?.checked)
        autoMoveCheckbox.click();
}

function startCommLink() {
    const MainCommLink = new CommLinkHandler('mum', {
        'singlePacketResponseWaitTime': 1500,
        'maxSendAttempts': 3,
        'statusCheckInterval': 1,
        'silentMode': true,
        'functions': {
            'getValue': USERSCRIPT.getValue,
            'setValue': USERSCRIPT.setValue,
            'deleteValue': USERSCRIPT.deleteValue,
            'listValues': USERSCRIPT.listValues,
        }
    });

    MainCommLink.registerListener('mum', packet => {
        try {
            switch(packet.command) {
                case 'ping':
                    return `pong (took ${Date.now() - packet.date}ms)`;
                case 'createInstance':
                    const data = packet.data;

                    createInstance(data.domain, data.instanceID, data.chessVariant);
    
                    return true;
            }
        } catch(e) {
            console.error(e);
            return null;
        }
    });
}

async function attemptStarting() {
    if(started)
        return;

    const isUserscriptActive = window.isUserscriptActive;

    if(isUserscriptActive) {
        started = true;

        displayNoUserscriptNotification(true);

        initializeDatabase();
        initGUI();
        processUrlParams();
        startCommLink();

        console.log('Userscript ready! Listening to instance calls...');
    } else {
        displayNoUserscriptNotification();
    }
}

await attemptStarting();

const userscriptSearchInterval = SET_INTERVAL_ASYNC(async () => {
    if(!started) await attemptStarting();
    else userscriptSearchInterval.stop();
}, 1);