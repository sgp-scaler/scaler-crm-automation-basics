// ==UserScript==
// @name         CRM Automation
// @namespace    http://tampermonkey.net/
// @version      4.3
// @match        https://sales.crm.scaler.com/*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/sgp-scaler/scaler-crm-automation-basics/main/scaler-crm-automation.user.js
// @downloadURL  https://raw.githubusercontent.com/sgp-scaler/scaler-crm-automation-basics/main/scaler-crm-automation.user.js
// ==/UserScript==

(function () {
    'use strict';

    console.log("CRM Automation Loaded");

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // =========================================================
    // DNP AUTOMATION
    // Processes → Call Attempted → No → Submit
    // =========================================================

    async function processDNP() {

        console.log("DNP: Step 1 - Processes");

        const processesButton = [...document.querySelectorAll("button")]
            .find(btn => btn.textContent.includes("Processes"));

        if (!processesButton) {
            alert("Processes button not found");
            return;
        }

        processesButton.click();

        await sleep(400);

        console.log("DNP: Step 2 - Call Attempted");

        const callAttempted = [...document.querySelectorAll(".ant-dropdown-menu-item")]
            .find(item => item.textContent.includes("Call Attempted"));

        if (!callAttempted) {
            alert("Call Attempted option not found");
            return;
        }

        callAttempted.click();

        // Wait for drawer
        await sleep(1200);

        console.log("DNP: Step 3 - Selecting No");

        const noRadio = document.querySelector(
            'input[type="radio"][value="No"]'
        );

        if (!noRadio) {
            alert("No radio button not found");
            return;
        }

        // Click the radio label
        const noLabel = noRadio.closest("label");

        if (noLabel) {
            noLabel.click();
        } else {
            noRadio.click();
        }

        await sleep(500);

        console.log("DNP: Step 4 - Submit");

        const submitButton = [...document.querySelectorAll("button")]
            .find(btn => btn.textContent.trim() === "Submit");

        if (!submitButton) {
            alert("Submit button not found");
            return;
        }

        submitButton.click();

        console.log("DNP: Done ✅");
    }


    // =========================================================
    // CALL LEAD AUTOMATION
    // Call Lead → Call → wait → OK
    // =========================================================

    async function callLead() {

        console.log("CALL: Step 1 - Call Lead");

        const callLeadButton = [...document.querySelectorAll("button")]
            .find(btn => btn.textContent.trim() === "Call Lead");

        if (!callLeadButton) {
            alert("Call Lead button not found");
            return;
        }

        callLeadButton.click();

        // Wait for confirmation dialog
        await sleep(700);

        console.log("CALL: Step 2 - Confirmation Call");

        const callButton = [...document.querySelectorAll("button")]
            .find(btn => btn.textContent.trim() === "Call");

        if (!callButton) {
            alert("Confirmation Call button not found");
            return;
        }

        callButton.click();

        console.log("CALL: Calling...");

        // Give CRM time to initiate/ring
        await sleep(3000);

        console.log("CALL: Step 3 - Looking for OK");

        const okButton = [...document.querySelectorAll("button")]
            .find(btn => btn.textContent.trim() === "OK");

        if (!okButton) {
            alert("OK button not found");
            return;
        }

        okButton.click();

        console.log("CALL: Done ✅");
    }


    // =========================================================
    // FLOATING BUTTON CREATION
    // =========================================================

    function createButton(id, text, top, background, action) {

        if (document.getElementById(id)) {
            return;
        }

        const btn = document.createElement("button");

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

        btn.addEventListener("mouseenter", () => {
            btn.style.opacity = "0.85";
        });

        btn.addEventListener("mouseleave", () => {
            btn.style.opacity = "1";
        });

        btn.addEventListener("click", async () => {

            // Prevent double clicking while automation is running
            btn.disabled = true;
            btn.style.opacity = "0.6";
            btn.style.cursor = "wait";

            try {
                await action();
            } finally {
                btn.disabled = false;
                btn.style.opacity = "1";
                btn.style.cursor = "pointer";
            }
        });

        document.body.appendChild(btn);
    }


    // =========================================================
    // CREATE BUTTONS
    // =========================================================

    const interval = setInterval(() => {

        if (!document.body) {
            return;
        }

        // Existing DNP button
        createButton(
            "crm-dnp-btn",
            "📞 DNP",
            20,
            "#1677ff",
            processDNP
        );

        // New Call Lead button
        createButton(
            "crm-call-btn",
            "☎️ Call Lead TEST",
            70,
            "#52c41a",
            callLead
        );

        clearInterval(interval);

    }, 500);

})();
