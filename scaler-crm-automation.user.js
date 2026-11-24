// ==UserScript==
// @name         Scaler CRM - Combined Automation
// @namespace    http://tampermonkey.net/
// @version      4.7
// @description  DNP + Call Lead + OTG + WhatsApp DNP
// @match        https://sales.crm.scaler.com/*
// @match        https://web.whatsapp.com/*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/sgp-scaler/scaler-crm-automation-basics/main/scaler-crm-automation.user.js
// @downloadURL  https://raw.githubusercontent.com/sgp-scaler/scaler-crm-automation-basics/main/scaler-crm-automation.user.js
// ==/UserScript==

(function () {
    'use strict';

    // Prevent accidental duplicate initialization if this script is injected twice.
    if (window.__SCALER_CRM_COMBINED_LOCAL_TEST__) return;
    window.__SCALER_CRM_COMBINED_LOCAL_TEST__ = true;

    const IS_CRM = window.location.hostname === 'sales.crm.scaler.com';
    const IS_WHATSAPP = window.location.hostname === 'web.whatsapp.com';
    console.log('[CRM Combined] Script loaded on:', window.location.hostname);

    // =========================================================
    // SHARED TRACKING
    // =========================================================

    const CLICK_TRACKER_URL =
        'https://zisxaykwhdfxvitbgsjq.supabase.co/functions/v1/track-click';

    const FEATURE_TRACKER_URL =
        'https://zisxaykwhdfxvitbgsjq.supabase.co/functions/v1/track-feature';

    function trackClick(action) {
        fetch(CLICK_TRACKER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action }),
            keepalive: true
        }).then(response => {
            if (!response.ok) {
                console.warn('[CRM Combined] Click tracking returned status:', response.status);
            }
        }).catch(error => {
            console.warn('[CRM Combined] Click tracking failed:', error);
        });
    }

    function trackFeature(action) {
        console.log('[CRM Combined] Sending feature event:', action);

        fetch(FEATURE_TRACKER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action }),
            keepalive: true
        }).then(async response => {
            const result = await response.text();
            if (response.ok) {
                console.log('[CRM Combined] Feature tracking successful:', action, response.status, result);
            } else {
                console.error('[CRM Combined] Feature tracking failed:', action, response.status, result);
            }
        }).catch(error => {
            console.error('[CRM Combined] Feature tracking request error:', action, error);
        });
    }

    // Shared delay utility.
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // =========================================================
    // DNP AUTOMATION
    // Processes → Call Attempted → No → Submit
    // =========================================================

    async function processDNP() {
        console.log('DNP: Step 1 - Processes');

        const processesButton = [...document.querySelectorAll('button')]
            .find(btn => btn.textContent.includes('Processes'));

        if (!processesButton) {
            alert('Processes button not found');
            return;
        }

        processesButton.click();
        await sleep(400);

        console.log('DNP: Step 2 - Call Attempted');

        const callAttempted = [...document.querySelectorAll('.ant-dropdown-menu-item')]
            .find(item => item.textContent.includes('Call Attempted'));

        if (!callAttempted) {
            alert('Call Attempted option not found');
            return;
        }

        callAttempted.click();
        await sleep(1800);

        console.log('DNP: Step 3 - Selecting No');

        const noRadio = document.querySelector('input[type="radio"][value="No"]');

        if (!noRadio) {
            alert('No radio button not found');
            return;
        }

        const noLabel = noRadio.closest('label');
        if (noLabel) {
            noLabel.click();
        } else {
            noRadio.click();
        }

        await sleep(500);

        console.log('DNP: Step 4 - Submit');

        const submitButton = [...document.querySelectorAll('button')]
            .find(btn => btn.textContent.trim() === 'Submit');

        if (!submitButton) {
            alert('Submit button not found');
            return;
        }

        submitButton.click();
        console.log('DNP: Done ✅');
    }

    // =========================================================
    // CALL LEAD AUTOMATION
    // Call Lead → Call → wait → OK
    // =========================================================

    async function callLead() {
        console.log('CALL: Step 1 - Call Lead');

        const callLeadButton = [...document.querySelectorAll('button')]
            .find(btn => btn.textContent.trim() === 'Call Lead');

        if (!callLeadButton) {
            alert('Call Lead button not found');
            return;
        }

        callLeadButton.click();
        await sleep(700);

        console.log('CALL: Step 2 - Confirmation Call');

        const callButton = [...document.querySelectorAll('button')]
            .find(btn => btn.textContent.trim() === 'Call');

        if (!callButton) {
            alert('Confirmation Call button not found');
            return;
        }

        callButton.click();
        console.log('CALL: Calling...');
        await sleep(3000);

        console.log('CALL: Step 3 - Looking for OK');

        const okButton = [...document.querySelectorAll('button')]
            .find(btn => btn.textContent.trim() === 'OK');

        if (!okButton) {
            alert('OK button not found');
            return;
        }

        okButton.click();
        console.log('CALL: Done ✅');
    }

    // =========================================================
    // OTG AUTOMATION
    // =========================================================

    const OTG_BUTTON_ID = 'crm-otg-standalone-btn';
    const OTG_MENU_ID = 'crm-otg-standalone-menu';
    const OTG_ACTION_DELAY = 350;

    const OTG_REASONS = [
        { label: 'Student', value: 'Student / No degree' },
        { label: 'No English Proficiency', value: 'No English proficiency' },
        {
            label: 'Irrelevant Profile',
            value: 'Irrelevant profile to any Scaler Program'
        },
        { label: 'Unemployed', value: 'Unemployed' }
    ];

    const otgSleep = ms => new Promise(resolve => setTimeout(resolve, ms));

    const isVisible = el =>
        !!el &&
        el.getClientRects().length > 0 &&
        getComputedStyle(el).visibility !== 'hidden' &&
        getComputedStyle(el).display !== 'none';

    async function waitFor(fn, description, timeout = 9000) {
        const start = Date.now();

        while (Date.now() - start < timeout) {
            const value = fn();
            if (value) return value;
            await otgSleep(150);
        }

        throw new Error(`Timed out waiting for ${description}`);
    }

    function getDrawer() {
        return [...document.querySelectorAll('.ant-drawer-content')]
            .find(el =>
                isVisible(el) &&
                el.querySelector('.ant-drawer-title')?.textContent.trim() === 'Call Attempted'
            );
    }

    function normalizeLabel(text) {
        return text
            .replace(/\*/g, '')
            .replace(/:/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();
    }

    function itemByLabel(root, names) {
        const expectedNames = names.map(normalizeLabel);
        const labels = [...root.querySelectorAll('.ant-form-item-label label')];
        const label = labels.find(el => expectedNames.includes(normalizeLabel(el.textContent)));
        return label?.closest('.ant-form-item') || null;
    }

    async function selectRadio(root, labelNames, value) {
        const result = await waitFor(() => {
            const item = itemByLabel(root, labelNames);
            if (!item) return null;

            const input = [...item.querySelectorAll(
                'input.ant-radio-button-input, input[type="radio"]'
            )].find(el => el.value === value);

            return input ? { item, input } : null;
        }, `${labelNames[0]} radio option "${value}"`, 9000);

        let { input } = result;
        await otgSleep(OTG_ACTION_DELAY);

        const currentItem = itemByLabel(root, labelNames);
        input = currentItem
            ? [...currentItem.querySelectorAll(
                'input.ant-radio-button-input, input[type="radio"]'
              )].find(el => el.value === value)
            : null;

        if (!input) {
            throw new Error(`Radio input "${value}" disappeared from ${labelNames[0]}`);
        }

        if (!input.checked) {
            const wrapper = input.closest('label.ant-radio-button-wrapper');
            if (!wrapper) {
                throw new Error(`Clickable radio wrapper not found for ${labelNames[0]}: ${value}`);
            }
            wrapper.click();
            await otgSleep(OTG_ACTION_DELAY);
        }

        await waitFor(() => {
            const updatedItem = itemByLabel(root, labelNames);
            const updatedInput = updatedItem
                ? [...updatedItem.querySelectorAll(
                    'input.ant-radio-button-input, input[type="radio"]'
                  )].find(el => el.value === value)
                : null;
            return updatedInput?.checked;
        }, `${labelNames[0]} = ${value}`, 5000);

        console.log(`[OTG] Selected ${labelNames[0]}: ${value}`);
    }

    async function setConversation(root) {
        const item = await waitFor(
            () => itemByLabel(root, ['Conversation Details']),
            'Conversation Details'
        );

        await otgSleep(OTG_ACTION_DELAY);
        const textarea = item.querySelector('textarea');
        if (!textarea) throw new Error('Conversation Details textarea not found');

        const setter = Object.getOwnPropertyDescriptor(
            HTMLTextAreaElement.prototype,
            'value'
        ).set;

        setter.call(textarea, 'OTG');
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.dispatchEvent(new Event('change', { bubbles: true }));
        await otgSleep(OTG_ACTION_DELAY);

        await waitFor(() => textarea.value === 'OTG', 'OTG conversation text');
        console.log('[OTG] Conversation Details: OTG');
    }

    async function setJunkReason(root, value) {
        const item = await waitFor(
            () => itemByLabel(root, ['Reason for Junk']),
            'Reason for Junk'
        );

        await otgSleep(OTG_ACTION_DELAY);
        const select = item.querySelector('.ant-select');
        if (!select) throw new Error('Reason for Junk dropdown not found');

        const selector = select.querySelector('.ant-select-selector') || select;
        const searchInput = select.querySelector('input.ant-select-selection-search-input');
        if (searchInput) searchInput.focus();

        selector.dispatchEvent(new MouseEvent('mousedown', {
            bubbles: true, cancelable: true, view: window, button: 0, buttons: 1
        }));
        await otgSleep(OTG_ACTION_DELAY);

        selector.dispatchEvent(new MouseEvent('mouseup', {
            bubbles: true, cancelable: true, view: window, button: 0
        }));
        selector.dispatchEvent(new MouseEvent('click', {
            bubbles: true, cancelable: true, view: window, button: 0
        }));

        await waitFor(() => {
            const opened =
                select.classList.contains('ant-select-open') ||
                select.getAttribute('aria-expanded') === 'true';
            const popupVisible = [...document.querySelectorAll('.ant-select-dropdown')]
                .some(dropdown =>
                    !dropdown.classList.contains('ant-select-dropdown-hidden') && isVisible(dropdown)
                );
            return opened || popupVisible;
        }, 'Reason for Junk dropdown to open', 7000);

        const option = await waitFor(() => {
            const visibleDropdowns = [...document.querySelectorAll('.ant-select-dropdown')]
                .filter(dropdown =>
                    !dropdown.classList.contains('ant-select-dropdown-hidden') && isVisible(dropdown)
                );

            for (const dropdown of visibleDropdowns) {
                const found = [...dropdown.querySelectorAll(
                    '.rc-virtual-list-holder-inner .ant-select-item-option'
                )].find(el => el.getAttribute('title') === value && isVisible(el));
                if (found) return found;
            }
            return null;
        }, `visible junk reason option "${value}"`, 7000);

        await otgSleep(OTG_ACTION_DELAY);
        console.log('[OTG] Clicking junk reason:', value);
        option.click();
        await otgSleep(OTG_ACTION_DELAY);

        await waitFor(() => {
            const selected = select.querySelector('.ant-select-selection-item');
            return selected && selected.textContent.trim() === value;
        }, `junk reason selected: ${value}`, 5000);

        console.log('[OTG] Reason selected:', value);
    }

    async function runOTG(reason) {
        try {
            console.log('[OTG] Starting:', reason.value);

            const processes = await waitFor(
                () => [...document.querySelectorAll('button')].find(el =>
                    isVisible(el) && el.textContent.trim() === 'Processes'
                ),
                'Processes button'
            );
            processes.click();
            await otgSleep(OTG_ACTION_DELAY);

            const callAttempted = await waitFor(
                () => [...document.querySelectorAll('.ant-dropdown-menu-item, [role="menuitem"]')]
                    .find(el => isVisible(el) && el.textContent.trim().includes('Call Attempted')),
                'Call Attempted menu option'
            );
            callAttempted.click();
            await otgSleep(OTG_ACTION_DELAY);

            const root = await waitFor(getDrawer, 'Call Attempted drawer');
            await otgSleep(OTG_ACTION_DELAY);

            await selectRadio(root, ['Call Connected'], 'Yes');
            await selectRadio(root, ['Lead Vertical'], 'Academy');
            await setConversation(root);
            await selectRadio(root, ['Target Group'], 'No');
            await setJunkReason(root, reason.value);

            const call = itemByLabel(root, ['Call Connected']);
            const vertical = itemByLabel(root, ['Lead Vertical']);
            const details = itemByLabel(root, ['Conversation Details']);
            const target = itemByLabel(root, ['Target Group']);
            const junk = itemByLabel(root, ['Reason for Junk']);

            const valid =
                call?.querySelector('input[value="Yes"]')?.checked &&
                vertical?.querySelector('input[value="Academy"]')?.checked &&
                details?.querySelector('textarea')?.value === 'OTG' &&
                target?.querySelector('input[value="No"]')?.checked &&
                junk?.querySelector('.ant-select-selection-item')?.textContent.trim() === reason.value;

            if (!valid) {
                throw new Error('Final field validation failed. Submit was not attempted.');
            }

            console.log('[OTG] All fields validated.');

            const submit = [...root.querySelectorAll('.ant-drawer-footer button')]
                .find(el => isVisible(el) && el.textContent.trim() === 'Submit' && !el.disabled);

            if (!submit) throw new Error('Submit button not found or disabled.');

            const confirmed = window.confirm(
                `Please confirm OTG entry:\n\n` +
                `Call Connected: Yes\n` +
                `Lead Vertical: Academy\n` +
                `Conversation Details: OTG\n` +
                `Target Group: No\n` +
                `Reason: ${reason.value}\n\n` +
                `Submit this entry?`
            );

            if (!confirmed) {
                console.log('[OTG] User cancelled submission.');
                return;
            }

            submit.click();
            console.log('[OTG] Submit clicked:', reason.value);

            await waitFor(() => !getDrawer(), 'Call Attempted drawer to close', 10000);
            console.log(`[OTG] Submitted: ${reason.label}`);
            trackFeature('OTG_BUTTON');

        } catch (err) {
            console.error('[OTG] Stopped safely:', err);
            alert(`OTG automation stopped.\n\n${err.message}\n\nPlease inspect the CRM form.`);
        }
    }

    function closeOTGMenu() {
        document.getElementById(OTG_MENU_ID)?.remove();
    }

    function createOTGButton() {
        if (document.getElementById(OTG_BUTTON_ID)) return;

        const button = document.createElement('button');
        button.id = OTG_BUTTON_ID;
        button.textContent = '🚫 OTG';
        button.style.cssText = `
            position: fixed;
            top: 20px;
            right: 450px;
            z-index: 999999;
            padding: 12px 18px;
            background: #cf1322;
            color: #fff;
            border: 0;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 700;
            box-shadow: 0 4px 10px rgba(0,0,0,.2);
        `;

        button.addEventListener('click', event => {
            event.stopPropagation();

            if (document.getElementById(OTG_MENU_ID)) {
                closeOTGMenu();
                return;
            }

            const menu = document.createElement('div');
            menu.id = OTG_MENU_ID;
            menu.style.cssText = `
                position: fixed;
                top: 166px;
                right: 350px;
                z-index: 1000000;
                min-width: 220px;
                padding: 6px;
                background: #fff;
                color: #222;
                border: 1px solid #d9d9d9;
                border-radius: 8px;
                box-shadow: 0 6px 18px rgba(0,0,0,.18);
            `;

            OTG_REASONS.forEach(reason => {
                const option = document.createElement('button');
                option.type = 'button';
                option.textContent = reason.label;
                option.style.cssText = `
                    display: block;
                    width: 100%;
                    padding: 11px 12px;
                    text-align: left;
                    background: #fff;
                    color: #222;
                    border: 0;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 13px;
                `;

                option.addEventListener('mouseenter', () => { option.style.background = '#f3f3f3'; });
                option.addEventListener('mouseleave', () => { option.style.background = '#fff'; });

                option.addEventListener('click', async () => {
                    closeOTGMenu();
                    button.disabled = true;
                    button.style.opacity = '0.6';
                    button.style.cursor = 'wait';

                    try {
                        await runOTG(reason);
                    } finally {
                        button.disabled = false;
                        button.style.opacity = '1';
                        button.style.cursor = 'pointer';
                    }
                });

                menu.appendChild(option);
            });

            document.body.appendChild(menu);
        });

        document.addEventListener('click', event => {
            const menu = document.getElementById(OTG_MENU_ID);
            if (menu && !menu.contains(event.target) && event.target !== button) {
                closeOTGMenu();
            }
        });

        document.body.appendChild(button);
    }

    // =========================================================
    // DNP + CALL LEAD BUTTON CREATION
    // =========================================================

    function createButton(id, text, top, background, action) {
        if (document.getElementById(id)) return;

        const btn = document.createElement('button');
        btn.id = id;
        btn.innerText = text;
        btn.style.cssText = `
            position: fixed;
            top: ${top}px;
            right: 350px;
            z-index: 999999;
            padding: 12px 18px;
            background: ${background};
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            box-shadow: 0 4px 10px rgba(0,0,0,0.2);
        `;

        btn.addEventListener('mouseenter', () => { btn.style.opacity = '0.85'; });
        btn.addEventListener('mouseleave', () => { btn.style.opacity = '1'; });

        btn.addEventListener('click', async () => {
            if (id === 'crm-dnp-btn') {
                trackClick('DNP');
            } else if (id === 'crm-call-btn') {
                trackClick('CALL_LEAD');
            }

            btn.disabled = true;
            btn.style.opacity = '0.6';
            btn.style.cursor = 'wait';

            try {
                await action();
            } finally {
                btn.disabled = false;
                btn.style.opacity = '1';
                btn.style.cursor = 'pointer';
            }
        });

        document.body.appendChild(btn);
    }

    // =========================================================
    // WHATSAPP DNP - CRM SIDE
    // =========================================================

    const WA_LOG = '[Scaler WhatsApp DNP]';
    const WA_PHONE_SELECTOR =
        'button[class*="_copyButtonRow"] span[class*="_copyButtonText"]';
    const WA_NAME_SELECTOR = 'h3[class*="_leadTitle_"]';
    const WA_SEARCH_SELECTOR =
        'input[aria-label="Search name, number or @username"]';
    const WA_RESULT_SELECTOR =
        'div[data-testid="cell-frame-container"][role="button"]';
    const WA_MESSAGE_BOX_SELECTOR =
        'div[data-testid="conversation-compose-box-input"][contenteditable="true"]';

    function waLog(...args) {
        console.log(WA_LOG, ...args);
    }

    function normalizePhone(phone) {
        return String(phone || '').replace(/\D/g, '');
    }

    async function waitForElement(selector, timeout = 20000) {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            const element = document.querySelector(selector);
            if (element) return element;
            await sleep(300);
        }
        throw new Error('Element not found: ' + selector);
    }

    function getLeadName() {
        const element = document.querySelector(WA_NAME_SELECTOR);
        if (!element) throw new Error('Lead name not found.');
        const name = element.innerText.trim();
        if (!name) throw new Error('Lead name is empty.');
        return name;
    }

    function getPhoneNumber() {
        const element = document.querySelector(WA_PHONE_SELECTOR);
        if (!element) throw new Error('Lead phone number not found.');
        const phone = element.innerText.trim();
        if (!phone) throw new Error('Phone number is empty.');
        return phone;
    }

    async function copyPhoneToClipboard(phone) {
        try {
            await navigator.clipboard.writeText(phone);
            waLog('Phone copied:', phone);
        } catch (error) {
            const textarea = document.createElement('textarea');
            textarea.value = phone;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();
            document.execCommand('copy');
            textarea.remove();
            waLog('Phone copied using fallback:', phone);
        }
    }

    function createWhatsAppDNPButton() {
        if (document.getElementById('scaler-open-whatsapp')) return;

        const button = document.createElement('button');
        button.id = 'scaler-open-whatsapp';
        button.innerText = '📱 WHATSAPP DNP';
        Object.assign(button.style, {
            position: 'fixed', top: '70px', right: '480px', zIndex: '999999',
            padding: '14px 20px', background: '#25D366', color: '#fff',
            border: 'none', borderRadius: '8px', fontSize: '14px',
            fontWeight: '700', cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(0,0,0,0.25)'
        });

        button.addEventListener('click', async function () {
            // Log the feature click, matching the standalone script's behaviour.
            trackFeature('WHATSAPP_DNP');
            button.disabled = true;
            button.innerText = '⏳ OPENING...';

            try {
                const name = getLeadName();
                const phone = getPhoneNumber();
                waLog('Lead name:', name);
                waLog('Lead phone:', phone);
                await copyPhoneToClipboard(phone);

                const dnpMessage =
                    `Hey ${name},\n` +
                    `Sadroop here from Scaler.\n\n` +
                    `Tried reaching you earlier, I understand you were busy at the time.\n` +
                    `Do let me know when would be a good time to connect.`;

                waLog('DNP message:', dnpMessage);
                const url = 'https://web.whatsapp.com/' +
                    '?scalerPhone=' + encodeURIComponent(phone) +
                    '&scalerMessage=' + encodeURIComponent(dnpMessage) +
                    '&scalerTrigger=' + Date.now();

                waLog('Opening WhatsApp...');
                window.open(url, '_blank');
                button.innerText = '✅ WHATSAPP OPENED';
                await sleep(1500);
                button.innerText = '📱 WHATSAPP DNP';
            } catch (error) {
                console.error(WA_LOG, error);
                alert('WhatsApp DNP failed:\n\n' + error.message);
                button.innerText = '📱 WHATSAPP DNP';
            } finally {
                button.disabled = false;
            }
        });

        document.body.appendChild(button);
        waLog('📱 WHATSAPP DNP button added.');
    }

    // =========================================================
    // INITIALIZATION
    // =========================================================

    if (IS_CRM) {
        const initInterval = setInterval(() => {
            if (!document.body) return;

            createButton('crm-dnp-btn', '📞 DNP', 20, '#1677ff', processDNP);
            createButton('crm-call-btn', '☎️ Call Lead', 70, '#52c41a', callLead);
            createOTGButton();
            createWhatsAppDNPButton();

            clearInterval(initInterval);
            console.log('[CRM Combined] All four CRM buttons initialized.');
        }, 500);
    }

    // =========================================================
    // WHATSAPP DNP - WHATSAPP WEB SIDE
    // =========================================================

    if (IS_WHATSAPP) {
        const params = new URLSearchParams(window.location.search);
        const phone = params.get('scalerPhone');
        const message = params.get('scalerMessage');
        const trigger = params.get('scalerTrigger');

        if (!phone || !message || !trigger) {
            waLog('Normal WhatsApp visit. Nothing to do.');
            return;
        }

        waLog('WhatsApp automation triggered.');
        waLog('Phone:', phone);
        waLog('Message:', message);

        window.history.replaceState({}, document.title, 'https://web.whatsapp.com/');

        async function openNewChat() {
            waLog('Waiting for New Chat button...');
            const button = await waitForElement('button[aria-label="New chat"]', 20000);
            await sleep(500);
            button.click();
            waLog('New Chat clicked.');
            await sleep(1000);
        }

        async function searchPhone() {
            waLog('Waiting for phone search box...');
            const input = await waitForElement(WA_SEARCH_SELECTOR, 15000);
            input.focus();
            const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
            setter.call(input, phone);
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            waLog('Phone entered:', phone);
            await sleep(1500);
            return normalizePhone(phone);
        }

        async function openMatchingResult(normalizedPhone) {
            waLog('Looking for matching WhatsApp result...');
            const start = Date.now();
            while (Date.now() - start < 15000) {
                const results = Array.from(document.querySelectorAll(WA_RESULT_SELECTOR));
                for (const result of results) {
                    const titleElement = result.querySelector(
                        '[data-testid="cell-frame-title"] span[title]'
                    );
                    if (!titleElement) continue;
                    const title = titleElement.getAttribute('title') || '';
                    const normalizedTitle = normalizePhone(title);
                    if (normalizedTitle.includes(normalizedPhone) ||
                        normalizedPhone.includes(normalizedTitle)) {
                        waLog('Correct number found:', title);
                        result.click();
                        waLog('Chat opened.');
                        return;
                    }
                }
                await sleep(300);
            }
            throw new Error('Could not find matching WhatsApp number.');
        }

        async function getMessageBox() {
            waLog('Waiting for WhatsApp message box...');
            const box = await waitForElement(WA_MESSAGE_BOX_SELECTOR, 20000);
            waLog('Message box found.');
            return box;
        }

        async function insertMessage() {
            const box = await getMessageBox();
            await sleep(700);
            box.focus();
            waLog('Preparing DNP message...');
            box.innerHTML = '';
            const lines = message.split('\n');
            lines.forEach(line => {
                const paragraph = document.createElement('p');
                paragraph.setAttribute('dir', 'auto');
                paragraph.className = 'selectable-text copyable-text';
                if (line.length > 0) paragraph.textContent = line;
                else paragraph.appendChild(document.createElement('br'));
                box.appendChild(paragraph);
            });

            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(box);
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);

            box.dispatchEvent(new InputEvent('input', {
                bubbles: true, inputType: 'insertText', data: message
            }));
            await sleep(500);
            waLog('================================');
            waLog('MESSAGE READY FOR REVIEW');
            waLog('Message:', message);
            waLog('NOT SENT');
            waLog('================================');
            showToast('✓ DNP message ready — review and send.');
        }

        function showToast(text) {
            const old = document.getElementById('scaler-dnp-toast');
            if (old) old.remove();
            const toast = document.createElement('div');
            toast.id = 'scaler-dnp-toast';
            toast.textContent = text;
            Object.assign(toast.style, {
                position: 'fixed', left: '50%', bottom: '150px',
                transform: 'translateX(-50%)', zIndex: '2147483647',
                padding: '12px 18px', borderRadius: '10px',
                background: '#111827', color: '#fff',
                fontFamily: 'Arial, sans-serif', fontSize: '13px',
                fontWeight: '600', boxShadow: '0 8px 30px rgba(0,0,0,0.35)'
            });
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 5000);
        }

        async function runWhatsAppDNP() {
            try {
                await openNewChat();
                const normalizedPhone = await searchPhone();
                await openMatchingResult(normalizedPhone);
                await insertMessage();
                waLog('✅ DNP automation complete.');
            } catch (error) {
                console.error(WA_LOG, error);
                showToast('❌ ' + error.message);
            }
        }

        setTimeout(runWhatsAppDNP, 2500);
    }

})();
