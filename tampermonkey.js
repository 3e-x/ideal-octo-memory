// ==UserScript==
    // @name         Zendesk Form Field Manager
    // @namespace    http://tampermonkey.net/
    // @version      1.1
    // @description  Hide/Show specific form fields in Zendesk
    // @author       Al-Abbas
    // @match        *://*.zendesk.com/*
    // @grant        none
    // @run-at       document-end
    // @changelog    Fixed autofill persistence issues with Route ID and User ID fields using React's internal state management
    // ==/UserScript==

    (function() {
        'use strict';

        let isFieldsHidden = true;
        let globalButton = null;
        let textWindow = null;


        function injectCSS() {
            if (document.getElementById('form-manager-styles')) return;

            const style = document.createElement('style');
            style.id = 'form-manager-styles';
            style.textContent = `
                .hidden-form-field {
                    display: none !important;
                }
                .form-toggle-icon {
                    width: 26px;
                    height: 26px;
                    cursor: pointer;
                    padding: 8px;
                    border-radius: 4px;
                    margin: 4px 12px;
                    background: transparent;
                    border: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: rgb(23, 24, 26);
                }
                .form-toggle-icon:hover {
                    background-color: rgba(47, 57, 65, 0.08);
                }
                .form-toggle-icon svg {
                    width: 26px;
                    height: 26px;
                    fill: currentColor;
                }
                .nav-separator {
                    height: 2px;
                    background-color: rgba(47, 57, 65, 0.24);
                    margin: 12px 16px;
                    width: calc(100% - 32px);
                    border-radius: 1px;
                }
                .custom-nav-section {
                    margin-top: 12px;
                }
                .form-toggle-text {
                    font-family: -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                    font-size: 13px;
                    margin-left: 8px;
                    color: rgb(68, 73, 80);
                }
                .text-window-pane {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    z-index: 10000;
                    width: 400px;
                    display: none;
                }
                .text-window-pane.show {
                    display: block;
                }
                .text-window-textarea {
                    width: 100%;
                    height: 200px;
                    margin: 10px 0;
                    padding: 8px;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                    resize: vertical;
                    font-family: inherit;
                }
                .text-window-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                }
                .text-window-title {
                    font-size: 16px;
                    font-weight: 600;
                    color: #2f3941;
                }
                .text-window-close {
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    padding: 4px;
                    color: #68737d;
                    font-size: 20px;
                }
                .text-window-close:hover {
                    color: #2f3941;
                }
                .text-window-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    z-index: 9999;
                    display: none;
                }
                .text-window-overlay.show {
                    display: block;
                }
                .nav-list-item {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    width: 100%;
                }
                .toast-notification {
                    position: fixed;
                    top: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background-color: #17494D;
                    color: white;
                    padding: 12px 24px;
                    border-radius: 4px;
                    z-index: 10000;
                    font-family: -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                    font-size: 14px;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                    opacity: 0;
                    transition: opacity 0.3s ease-in-out;
                }
                .toast-notification.show {
                    opacity: 1;
                }
                .copy-button {
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    padding: 4px;
                    margin-left: 4px;
                    border-radius: 4px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    color: rgb(68, 73, 80);
                    position: absolute;
                    right: 8px;
                    z-index: 100;
                }
                .copy-button:hover {
                    background-color: rgba(47, 57, 65, 0.08);
                }
                .copy-button svg {
                    width: 14px;
                    height: 14px;
                    fill: currentColor;
                }
                .sidebar_box_container {
                    padding-bottom: 20px !important;
                }
                            .label-container {
                display: flex;
                align-items: center;
                margin-bottom: 4px;
            }
            .StyledField-sc-12gzfsu-0 {
                position: relative;
            }
            [data-garden-id="forms.input_label"] {
                display: inline-flex;
                align-items: center;
            }
            /* Fix for autocomplete menu labels */
            label.StyledLabel-sc-2utmsz-0[data-garden-id="forms.input_label"][for^="downshift-"][id^="downshift-"][class*="jIoHmc"],
            .mount-point-wrapper:empty {
                display: none !important;
            }
            .text-window-transform-button {
                background-color: #17494D;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                margin-top: 10px;
                width: 100%;
                transition: background-color 0.2s;
            }
            .text-window-transform-button:hover {
                background-color: #1A5B60;
            }
            .text-window-transform-button:active {
                background-color: #153F42;
            }
            .text-window-pane {
                width: 600px;
            }
            .text-window-textarea {
                height: 300px;
                font-family: monospace;
                white-space: pre;
                font-size: 14px;
                line-height: 1.4;
            }
            `;
            document.head.appendChild(style);
        }


        const eyeOpenSVG = `<svg viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>`;
        const eyeClosedSVG = `<svg viewBox="0 0 24 24"><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/></svg>`;


        const copySVG = `<svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>`;

        const checklistSVG = `<svg viewBox="0 0 24 24"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7zm-4 6h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/></svg>`;


        const autoFillSVG = `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M21 3h-6.18C14.4 1.84 13.3 1 12 1s-2.4.84-2.82 2H3v18h18V3zm-9 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm-2 15l-5-5 1.41-1.41L10 15.17l7.59-7.59L19 9l-9 9z"/></svg>`;

        const memoSVG = `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13zm-3 5c0 .6.4 1 1 1h6c.6 0 1-.4 1-1s-.4-1-1-1h-6c-.6 0-1 .4-1 1zm0 3c0 .6.4 1 1 1h6c.6 0 1-.4 1-1s-.4-1-1-1h-6c-.6 0-1 .4-1 1zm-2-6c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm0 3c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm0 3c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1z"/></svg>`;

        const historyListSVG = `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.25 2.52.77-1.28-3.52-2.09V8z"/></svg>`;


        function isTargetField(field) {
            const label = field.querySelector('label');
            if (!label) return false;

            const targetLabels = [
                'Reason (Quality/GO/Billing)*',
                'Captain ID',
                'Booking ID',
                'Parent Ticket Source',
                'User ID',
                'City',
                'Country',
                'Route ID',
                'SSOC - Action with Customer',
                'SSOC - Action with Captain',
                'SSOC - Escalation Call',
                'SSOC Reason',
                'Is Insurance required ?'
            ];

            return targetLabels.some(targetText =>
                label.textContent.trim() === targetText
            );
        }


        function clearUserIdField(container) {
            const fields = container.children;
            Array.from(fields).forEach(field => {
                const label = field.querySelector('label');
                if (label && label.textContent.trim() === 'User ID') {
                    const input = field.querySelector('input');
                    if (input) {
                        // Get the React fiber node
                        const key = Object.keys(input).find(key => key.startsWith('__reactProps$'));
                        if (key) {
                            const props = input[key];
                            if (props.onChange) {
                                // Simulate React's synthetic event
                                const syntheticEvent = {
                                    target: input,
                                    currentTarget: input,
                                    type: 'change',
                                    bubbles: true,
                                    cancelable: true,
                                    preventDefault: () => {},
                                    stopPropagation: () => {},
                                    persist: () => {}
                                };
                                
                                // Set value and trigger React's onChange
                                input.value = '';
                                props.onChange(syntheticEvent);
                                
                                // Additional native events for good measure
                                input.dispatchEvent(new Event('input', { bubbles: true }));
                                input.dispatchEvent(new Event('change', { bubbles: true }));
                            }
                        }
                        console.log('Cleared User ID field');
                    }
                }
            });
        }


        function copyBookingIdToRouteId(container) {
            const fields = container.children;
            let bookingIdValue = '';

            Array.from(fields).forEach(field => {
                const label = field.querySelector('label');
                if (label && label.textContent.trim() === 'Booking ID') {
                    const input = field.querySelector('input');
                    if (input) {
                        bookingIdValue = input.value;
                    }
                }
            });

            if (bookingIdValue) {
                Array.from(fields).forEach(field => {
                    const label = field.querySelector('label');
                    if (label && label.textContent.trim() === 'Route ID') {
                        const input = field.querySelector('input');
                        if (input) {
                            // Get the React fiber node
                            const key = Object.keys(input).find(key => key.startsWith('__reactProps$'));
                            if (key) {
                                const props = input[key];
                                if (props.onChange) {
                                    // Simulate React's synthetic event
                                    const syntheticEvent = {
                                        target: input,
                                        currentTarget: input,
                                        type: 'change',
                                        bubbles: true,
                                        cancelable: true,
                                        preventDefault: () => {},
                                        stopPropagation: () => {},
                                        persist: () => {}
                                    };
                                    
                                    // Set value and trigger React's onChange
                                    input.value = bookingIdValue;
                                    props.onChange(syntheticEvent);
                                    
                                    // Additional native events for good measure
                                    input.dispatchEvent(new Event('input', { bubbles: true }));
                                    input.dispatchEvent(new Event('change', { bubbles: true }));
                                }
                            }
                            console.log('Copied and saved Booking ID to Route ID:', bookingIdValue);
                        }
                    }
                });
            }
        }


        const cityToCountry = {

            'Abu Dhabi': 'United Arab Emirates',
            'Dubai': 'United Arab Emirates',
            'Al Ain': 'United Arab Emirates',
            'Sharjah': 'United Arab Emirates',
            'Fujairah': 'United Arab Emirates',
            'Ras Al Khaimah': 'United Arab Emirates',
            'Ajman': 'United Arab Emirates',


            'Amman': 'Jordan',
            'Irbid': 'Jordan',
            'Zarqa': 'Jordan',
            'Aqaba': 'Jordan',


            'Al Hada': 'Saudi Arabia',
            'Al Hasa': 'Saudi Arabia',
            'Al Bahah': 'Saudi Arabia',
            'Aseer': 'Saudi Arabia',
            'Ash Shafa': 'Saudi Arabia',
            'Dammam': 'Saudi Arabia',
            'Hail': 'Saudi Arabia',
            'Jazan': 'Saudi Arabia',
            'Jeddah': 'Saudi Arabia',
            'Jubail': 'Saudi Arabia',
            'Madinah': 'Saudi Arabia',
            'Makkah': 'Saudi Arabia',
            'Qassim': 'Saudi Arabia',
            'Riyadh': 'Saudi Arabia',
            'Tabuk': 'Saudi Arabia',
            'Taif': 'Saudi Arabia',
            'Yanbu': 'Saudi Arabia',
            'Abqaiq': 'Saudi Arabia',
            'Al Ula': 'Saudi Arabia',
            'AlJowf': 'Saudi Arabia',
            'Al Kharj': 'Saudi Arabia',
            'Ar Rass': 'Saudi Arabia',
            'Hafar AlBatin': 'Saudi Arabia',
            'KAEC': 'Saudi Arabia',
            'Madinah Governorates': 'Saudi Arabia',
            'Najran': 'Saudi Arabia',
            'Ras Tanura': 'Saudi Arabia',
            'Tabuk Governorates': 'Saudi Arabia',
            'Tihamah': 'Saudi Arabia',
            'Al Leith': 'Saudi Arabia',
            'Al Qunfudah': 'Saudi Arabia',
            'ALQurayyat': 'Saudi Arabia',
            'Sharurah': 'Saudi Arabia',
            'Wadi Al Dawasir': 'Saudi Arabia',


            'Alexandria': 'Egypt',
            'Banha': 'Egypt',
            'Cairo': 'Egypt',
            'Damanhour': 'Egypt',
            'Damietta': 'Egypt',
            'Gouna': 'Egypt',
            'Hurghada': 'Egypt',
            'Ismailia': 'Egypt',
            'Kafr El-Shiek': 'Egypt',
            'Mansoura': 'Egypt',
            'Port Said': 'Egypt',
            'Sahel': 'Egypt',
            'Suez': 'Egypt',
            'Tanta': 'Egypt',
            'zagazig': 'Egypt',
            'Zagzig': 'Egypt',
            'Asyut': 'Egypt',
            'Minya': 'Egypt',
            'Menofia': 'Egypt',
            'Sohag': 'Egypt',
            'Aswan': 'Egypt',
            'Qena': 'Egypt',
            'Fayoum': 'Egypt',
            'Marsa Matrouh': 'Egypt',
            'Beni Suef': 'Egypt',
            'Luxor': 'Egypt',
            'Marsa Matruh': 'Egypt',
            'Sokhna': 'Egypt',


            'Faisalabad': 'Pakistan',
            'Gujranwala': 'Pakistan',
            'Hyderabad': 'Pakistan',
            'Islamabad': 'Pakistan',
            'Karachi': 'Pakistan',
            'Lahore': 'Pakistan',
            'Multan': 'Pakistan',
            'Peshawar': 'Pakistan',
            'Sialkot': 'Pakistan',
            'Abbottabad': 'Pakistan',
            'Mardan': 'Pakistan',
            'Quetta': 'Pakistan',
            'Sargodha': 'Pakistan',
            'Sukkur': 'Pakistan',
            'Bahawalpur': 'Pakistan',


            'Beirut': 'Lebanon',
            'Jounieh': 'Lebanon',


            'Casablanca': 'Morocco',
            'Rabat': 'Morocco',
            'Marrakech': 'Morocco',
            'Mohammedia': 'Morocco',
            'Tangier': 'Morocco',


            'Kuwait City': 'Kuwait',


            'Manama': 'Bahrain',


            'Muscat': 'Oman',


            'Doha': 'Qatar',
            'Wakrah': 'Qatar',


            'Baghdad': 'Iraq',
            'Basrah': 'Iraq',
            'Mosul': 'Iraq',
            'Najaf': 'Iraq',
            'Erbil': 'Iraq',


            'ramallah': 'Palestine',
            'gaza': 'Palestine',
            'nablus': 'Palestine',
            'Bethlehem': 'Palestine',


            'Algiers': 'Algeria',


            'Istanbul': '',
            'bodrum': '',
            'bursa': '',
            'Adana': '',


            'khartoum': '',


            'Gotham City': ''
        };


        const countryToIndex = {
            'Algeria': 1,
            'Bahrain': 2,
            'Egypt': 3,
            'Iraq': 4,
            'Jordan': 5,
            'Kuwait': 6,
            'Lebanon': 7,
            'Morocco': 8,
            'Oman': 9,
            'Pakistan': 10,
            'Palestine': 11,
            'Saudi Arabia': 12,
            'United Arab Emirates': 13
        };


        function getSelectedCity(container) {
            const fields = container.children;
            let selectedCity = '';

            Array.from(fields).forEach(field => {
                const label = field.querySelector('label');
                if (label && label.textContent.trim() === 'City') {

                    const cityElement = field.querySelector('div[title]');
                    if (cityElement) {
                        selectedCity = cityElement.getAttribute('title');
                    }


                    if (!selectedCity) {
                        const ellipsisDiv = field.querySelector('.StyledEllipsis-sc-1u4umy-0');
                        if (ellipsisDiv) {
                            selectedCity = ellipsisDiv.textContent.trim();
                        }
                    }
                }
            });

            console.log('Found selected city:', selectedCity);
            return selectedCity;
        }


        function setCountryBasedOnCity(container) {
            const selectedCity = getSelectedCity(container);
            console.log('Selected city:', selectedCity);

            if (!selectedCity || selectedCity === '-') {
                console.log('No city selected or city is empty');
                return;
            }

            const country = cityToCountry[selectedCity];
            if (!country) {
                console.log('No country mapping found for city:', selectedCity);
                return;
            }

            const countryIndex = countryToIndex[country];
            if (!countryIndex) {
                console.log('No index found for country:', country);
                return;
            }

            const fields = container.children;
            Array.from(fields).forEach(field => {
                const label = field.querySelector('label');
                if (label && label.textContent.trim() === 'Country') {
                    console.log('Found Country field');

                    // Check current value first
                    const currentValue = field.querySelector('[title]')?.getAttribute('title') || 
                                       field.querySelector('.StyledEllipsis-sc-1u4umy-0')?.textContent.trim() ||
                                       field.querySelector('[data-garden-id="typography.ellipsis"]')?.textContent.trim();

                    if (currentValue && currentValue !== '-' && currentValue === country) {
                        console.log('Country already correctly set to:', currentValue);
                        return; // Skip if already set to correct value
                    }

                    console.log('Setting country to:', country, 'at index:', countryIndex);

                    const dropdownTrigger = field.querySelector('input[data-test-id="ticket-field-input"]') ||
                                        field.querySelector('button[data-garden-id="dropdowns.faux_input"]') ||
                                        field.querySelector('[role="combobox"]');

                    if (dropdownTrigger) {
                        console.log('Found dropdown trigger');

                        dropdownTrigger.focus();
                        dropdownTrigger.click();

                        setTimeout(() => {
                            const options = Array.from(document.querySelectorAll('[role="option"], [data-test-id="ticket-field-option"]'));
                            console.log('Found options:', options.length);

                            const countryOption = options[countryIndex];

                            if (countryOption) {
                                console.log('Found country option:', countryOption.textContent);

                                setTimeout(() => {
                                    countryOption.click();

                                    setTimeout(() => {
                                        if (dropdownTrigger.tagName.toLowerCase() === 'input') {
                                            dropdownTrigger.value = country;
                                            dropdownTrigger.dispatchEvent(new Event('input', { bubbles: true }));
                                            dropdownTrigger.dispatchEvent(new Event('change', { bubbles: true }));
                                        }

                                        dropdownTrigger.dispatchEvent(new KeyboardEvent('keydown', {
                                            key: 'Enter',
                                            code: 'Enter',
                                            keyCode: 13,
                                            which: 13,
                                            bubbles: true
                                        }));

                                        setTimeout(() => {
                                            dropdownTrigger.blur();
                                            console.log('Set Country to:', country);
                                        }, 100);
                                    }, 100);
                                }, 100);
                            } else {
                                console.log('Country option not found in dropdown list');
                                dropdownTrigger.blur();
                            }
                        }, 500);
                    } else {
                        console.log('Could not find dropdown trigger for Country field');
                    }
                }
            });
        }

        function createToggleButton() {
            const listItem = document.createElement('li');
            listItem.className = 'nav-list-item';

            const button = document.createElement('button');
            button.className = 'form-toggle-icon StyledBaseNavItem-sc-zvo43f-0 StyledNavButton-sc-f5ux3-0 gvFgbC dXnFqH';
            button.setAttribute('tabindex', '0');
            button.setAttribute('data-garden-id', 'chrome.nav_button');
            button.setAttribute('data-garden-version', '9.5.2');

            const iconWrapper = document.createElement('div');
            iconWrapper.style.display = 'flex';
            iconWrapper.style.alignItems = 'center';

            const icon = document.createElement('div');
            icon.innerHTML = eyeClosedSVG;  // Changed to start with closed eye
            icon.firstChild.setAttribute('width', '26');
            icon.firstChild.setAttribute('height', '26');
            icon.firstChild.setAttribute('data-garden-id', 'chrome.nav_item_icon');
            icon.firstChild.setAttribute('data-garden-version', '9.5.2');
            icon.firstChild.classList.add('StyledBaseIcon-sc-1moykgb-0', 'StyledNavItemIcon-sc-7w9rpt-0', 'eWlVPJ', 'YOjtB');

            const text = document.createElement('span');
            text.textContent = 'Show Fields';  // Changed to start with "Show Fields"
            text.className = 'StyledNavItemText-sc-13m84xl-0 iOGbGR';
            text.setAttribute('data-garden-id', 'chrome.nav_item_text');
            text.setAttribute('data-garden-version', '9.5.2');

            iconWrapper.appendChild(icon);
            iconWrapper.appendChild(text);
            button.appendChild(iconWrapper);
            listItem.appendChild(button);

            return listItem;
        }


        function createFieldOpsButton() {
            const listItem = document.createElement('li');
            listItem.className = 'nav-list-item';

            const button = document.createElement('button');
            button.className = 'form-toggle-icon StyledBaseNavItem-sc-zvo43f-0 StyledNavButton-sc-f5ux3-0 gvFgbC dXnFqH';
            button.setAttribute('tabindex', '0');
            button.setAttribute('data-garden-id', 'chrome.nav_button');
            button.setAttribute('data-garden-version', '9.5.2');

            const iconWrapper = document.createElement('div');
            iconWrapper.style.display = 'flex';
            iconWrapper.style.alignItems = 'center';

            const icon = document.createElement('div');
            icon.innerHTML = checklistSVG;  // Changed from autoFillSVG to checklistSVG
            icon.firstChild.setAttribute('width', '26');
            icon.firstChild.setAttribute('height', '26');
            icon.firstChild.setAttribute('data-garden-id', 'chrome.nav_item_icon');
            icon.firstChild.setAttribute('data-garden-version', '9.5.2');
            icon.firstChild.classList.add('StyledBaseIcon-sc-1moykgb-0', 'StyledNavItemIcon-sc-7w9rpt-0', 'eWlVPJ', 'YOjtB');

            const text = document.createElement('span');
            text.textContent = 'Auto Fill';
            text.className = 'StyledNavItemText-sc-13m84xl-0 iOGbGR';
            text.setAttribute('data-garden-id', 'chrome.nav_item_text');
            text.setAttribute('data-garden-version', '9.5.2');

            iconWrapper.appendChild(icon);
            iconWrapper.appendChild(text);
            button.appendChild(iconWrapper);
            listItem.appendChild(button);

            return listItem;
        }

        function toggleAllFields() {
            const allForms = document.querySelectorAll('div[data-test-id="ticket-fields"][data-tracking-id="ticket-fields"]');
            
            if (allForms.length === 0) {
                console.log('No forms found to toggle');
                return;
            }

            isFieldsHidden = !isFieldsHidden;
            
            allForms.forEach(form => {
                if (!form || !form.children) return;
                
                const fields = Array.from(form.children).filter(field => field.nodeType === Node.ELEMENT_NODE);
                
                fields.forEach(field => {
                    try {
                        if (!isTargetField(field)) {
                            if (isFieldsHidden) {
                                field.classList.add('hidden-form-field');
                            } else {
                                field.classList.remove('hidden-form-field');
                            }
                        }
                    } catch (e) {
                        console.log('Error toggling field:', e);
                    }
                });
            });

            // Update button state
            if (globalButton) {
                const button = globalButton.querySelector('button');
                if (button) {
                    const iconSvg = button.querySelector('svg');
                    if (iconSvg) {
                        iconSvg.outerHTML = isFieldsHidden ? eyeClosedSVG : eyeOpenSVG;
                        const newIcon = button.querySelector('svg');
                        newIcon.setAttribute('width', '26');
                        newIcon.setAttribute('height', '26');
                        newIcon.setAttribute('data-garden-id', 'chrome.nav_item_icon');
                        newIcon.setAttribute('data-garden-version', '9.5.2');
                        newIcon.classList.add('StyledBaseIcon-sc-1moykgb-0', 'StyledNavItemIcon-sc-7w9rpt-0', 'eWlVPJ', 'YOjtB');
                    }
                    button.title = isFieldsHidden ? 'Show All Fields' : 'Hide Extra Fields';
                    const span = button.querySelector('span');
                    if (span) {
                        span.textContent = isFieldsHidden ? 'Show Fields' : 'Hide Fields';
                    }
                }
            }
        }


        function showToast(message, duration = 3000) {

            const existingToast = document.querySelector('.toast-notification');
            if (existingToast) {
                existingToast.remove();
            }


            const toast = document.createElement('div');
            toast.className = 'toast-notification';
            toast.textContent = message;
            document.body.appendChild(toast);


            toast.offsetHeight;
            toast.classList.add('show');


            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }

        function setReasonToNA(container) {
            const fields = container.children;
            Array.from(fields).forEach(field => {
                const label = field.querySelector('label');
                if (label && label.textContent.trim() === 'Reason (Quality/GO/Billing)*') {
                    console.log('Found Reason field');

                    // Check current value first
                    const currentValue = field.querySelector('[title]')?.getAttribute('title') || 
                                       field.querySelector('.StyledEllipsis-sc-1u4umy-0')?.textContent.trim() ||
                                       field.querySelector('[data-garden-id="typography.ellipsis"]')?.textContent.trim();

                    // Always set to N/A unless it's already N/A
                    if (currentValue === 'N/A') {
                        console.log('Reason already set to N/A');
                        return;
                    }

                    const dropdownTrigger = field.querySelector('input[data-test-id="ticket-field-input"]') ||
                                        field.querySelector('button[data-garden-id="dropdowns.faux_input"]') ||
                                        field.querySelector('[role="combobox"]');

                    if (dropdownTrigger) {
                        console.log('Found dropdown trigger for Reason field');
                        console.log('Current value:', currentValue, 'changing to N/A');

                        dropdownTrigger.focus();
                        dropdownTrigger.click();

                        setTimeout(() => {
                            const options = Array.from(document.querySelectorAll('[role="option"], [data-test-id="ticket-field-option"]'));
                            console.log('Found options:', options.length);

                            const naOption = options[145];

                            if (naOption) {
                                console.log('Found N/A option');

                                setTimeout(() => {
                                    naOption.click();

                                    setTimeout(() => {
                                        if (dropdownTrigger.tagName.toLowerCase() === 'input') {
                                            dropdownTrigger.value = 'N/A';
                                            dropdownTrigger.dispatchEvent(new Event('input', { bubbles: true }));
                                            dropdownTrigger.dispatchEvent(new Event('change', { bubbles: true }));
                                        }

                                        dropdownTrigger.dispatchEvent(new KeyboardEvent('keydown', {
                                            key: 'Enter',
                                            code: 'Enter',
                                            keyCode: 13,
                                            which: 13,
                                            bubbles: true
                                        }));

                                        setTimeout(() => {
                                            dropdownTrigger.blur();
                                            console.log('Set Reason to N/A');
                                        }, 100);
                                    }, 100);
                                }, 100);
                            } else {
                                console.log('N/A option not found in dropdown list');
                                dropdownTrigger.blur();
                            }
                        }, 500);
                    } else {
                        console.log('Could not find dropdown trigger for Reason field');
                    }
                }
            });
        }

        function updateAllFields() {
            const allForms = document.querySelectorAll('div[data-test-id="ticket-fields"][data-tracking-id="ticket-fields"]');
            allForms.forEach(form => {
                clearUserIdField(form);
                copyBookingIdToRouteId(form);
                
                // Check if country needs to be updated
                const selectedCity = getSelectedCity(form);
                const desiredCountry = selectedCity ? cityToCountry[selectedCity] : null;
                let countryNeedsUpdate = false;

                if (desiredCountry) {
                    const countryField = Array.from(form.children).find(field => {
                        const label = field.querySelector('label');
                        return label && label.textContent.trim() === 'Country';
                    });

                    if (countryField) {
                        const currentValue = countryField.querySelector('[title]')?.getAttribute('title') || 
                                          countryField.querySelector('.StyledEllipsis-sc-1u4umy-0')?.textContent.trim() ||
                                          countryField.querySelector('[data-garden-id="typography.ellipsis"]')?.textContent.trim();
                        
                        countryNeedsUpdate = !currentValue || currentValue === '-' || currentValue !== desiredCountry;
                    }
                }

                // If country needs update, set timeout for reason
                if (countryNeedsUpdate) {
                    setCountryBasedOnCity(form);
                    setTimeout(() => {
                        setReasonToNA(form);
                    }, 1500); // Wait 1.5 seconds after country operation
                } else {
                    // If country doesn't need update, set reason immediately
                    setReasonToNA(form);
                }
            });
        }

        function createCopyButton() {
            const button = document.createElement('button');
            button.className = 'copy-button';
            button.innerHTML = copySVG;
            button.title = 'Copy SSOC Reason';
            return button;
        }

        function copySSOCReason(container) {

            const ssocReasonElement = container.querySelector('[title^="SSOC -"]') ||
                                    container.querySelector('.StyledEllipsis-sc-1u4uqmy-0') ||
                                    container.querySelector('[data-garden-id="typography.ellipsis"]');

            if (ssocReasonElement) {
                const ssocReason = ssocReasonElement.getAttribute('title') || ssocReasonElement.textContent.trim();
                navigator.clipboard.writeText(ssocReason)
                    .then(() => {
                        showToast('SSOC Reason copied to clipboard!');
                    })
                    .catch(err => {
                        console.error('Failed to copy text:', err);
                        showToast('Failed to copy SSOC Reason');
                    });
            }
        }

        function addCopyButtonToSSOCReason(container) {
            const fields = container.children;
            Array.from(fields).forEach(field => {

                const label = field.querySelector('label[data-garden-id="forms.input_label"]') ||
                            field.querySelector('label');

                if (label &&
                    label.textContent.trim() === 'SSOC Reason' &&
                    !field.querySelector('.copy-button')) {

                    const copyButton = createCopyButton();
                    copyButton.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        copySSOCReason(field);
                    });


                    const labelContainer = label.parentElement;
                    if (labelContainer) {
                        labelContainer.style.position = 'relative';
                        labelContainer.appendChild(copyButton);
                    }
                }
            });
        }

        function initFormManager(container) {
            if (!container || !container.children) {
                console.log('Invalid container, skipping initialization');
                return;
            }

            // Wait for fields to be fully rendered
            setTimeout(() => {
                const fields = Array.from(container.children).filter(field => field.nodeType === Node.ELEMENT_NODE);
                
                if (fields.length === 0) {
                    console.log('No fields found in container');
                    return;
                }

                console.log(`Processing ${fields.length} fields`);
                
                fields.forEach(field => {
                    try {
                        if (!isTargetField(field)) {
                            if (isFieldsHidden) {
                                field.classList.add('hidden-form-field');
                            }
                        } else {
                            // Ensure target fields are always visible
                            field.classList.remove('hidden-form-field');
                        }
                    } catch (e) {
                        console.log('Error processing field:', e);
                    }
                });

                // Add copy button to SSOC Reason
                addCopyButtonToSSOCReason(container);
            }, 100);
        }

        function setCaptainId(captainId) {
            const allForms = document.querySelectorAll('div[data-test-id="ticket-fields"][data-tracking-id="ticket-fields"]');
            allForms.forEach(form => {
                const fields = form.children;
                Array.from(fields).forEach(field => {
                    const label = field.querySelector('label');
                    if (label && label.textContent.trim() === 'Captain ID') {
                        const input = field.querySelector('input');
                        if (input) {
                            input.value = captainId;
                            input.dispatchEvent(new Event('input', { bubbles: true }));
                            input.dispatchEvent(new Event('change', { bubbles: true }));
                            console.log('Set Captain ID to:', captainId);
                        }
                    }
                });
            });
        }

        function processText(inputText) {
            // Store the CSV result
            let csvResult = '';
            
            // Process block history if it exists
            if (inputText.includes('BLOCK HISTORY')) {
                csvResult = processBlockHistory(inputText);
            }

            const captainIdMatch = inputText.match(/\((\d+)\)/);
            const captainId = captainIdMatch ? captainIdMatch[1] : '';

            if (captainId) {
                setCaptainId(captainId);
            }

            const tripsMatch = inputText.match(/MONTHLY \/ TOTAL TRIPS\s*(\d+\s*\/\s*\d+)/);

            let rating = 'N/A';

            const ratingLine = inputText.match(/AVERAGE\s*\/\s*LIFETIME\s*RATING\s*([0-9.]+\s*\/\s*[0-9.]*)/i);

            if (ratingLine) {
                rating = ratingLine[1].trim();
            }

            const tierMatch = inputText.match(/CURRENT TIER\s*(\w+)/);
            const dateMatch = inputText.match(/(\d+)\s+(\w+),\s+(\d{4})/);

            let tenureCategory = '';
            if (dateMatch) {
                const [_, day, month, year] = dateMatch;
                const joinDate = new Date(`${month} ${day}, ${year}`);
                const now = new Date();
                const tenureInMonths = (now.getFullYear() - joinDate.getFullYear()) * 12 +
                                     (now.getMonth() - joinDate.getMonth());
                const tenureInYears = tenureInMonths / 12;

                if (tenureInYears >= 10) {
                    tenureCategory = '( 10+ )';
                } else if (tenureInYears >= 6) {
                    tenureCategory = '( 6 - 9 )';
                } else if (tenureInYears >= 5) {
                    tenureCategory = '( 2 - 5 )';
                } else if (tenureInYears >= 2) {
                    tenureCategory = '( 2 - 5 )';
                } else if (tenureInMonths >= 6) {
                    tenureCategory = '( 6 - 2 )';
                } else {
                    tenureCategory = '( 0 - 6 )';
                }
            }

            const formattedText = `Dear Team,

Kindly refer to the ticket below

Information So Far:

**\*Captain Profile**
* Trips: ${tripsMatch ? tripsMatch[1] : 'N/A'}
* Tenure:
    * ${tenureCategory}
* Rating: ${rating}
* Tier: ${tierMatch ? tierMatch[1] : 'N/A'}
* Block History:
    1- Sexual behavior: (Number of incidents, Mention the incident)
    2- Physical altercations: (Number of incidents, Mention the incident)
    3- Road safety: (Number of incidents, Mention the incident)
    4- Minor: (Number of incidents, Mention the incident)
    5- Others SSOC related: (Number of incidents, Mention the incident)


* Past Trips Rating:`;

            // Store both the formatted text and CSV result
            return {
                formattedText,
                csvResult
            };
        }

        function createTextWindow() {
            const overlay = document.createElement('div');
            overlay.className = 'text-window-overlay';

            const windowPane = document.createElement('div');
            windowPane.className = 'text-window-pane';

            const header = document.createElement('div');
            header.className = 'text-window-header';

            const title = document.createElement('div');
            title.className = 'text-window-title';
            title.textContent = 'Paste Captain Profile';

            const closeButton = document.createElement('button');
            closeButton.className = 'text-window-close';
            closeButton.innerHTML = '×';
            closeButton.onclick = closeTextWindow;

            const textarea = document.createElement('textarea');
            textarea.className = 'text-window-textarea';
            textarea.placeholder = 'Paste captain profile text here...';

            textarea.addEventListener('paste', (e) => {
                setTimeout(() => {
                    const inputText = textarea.value;
                    const result = processText(inputText);

                    // Set the formatted text in the textarea
                    textarea.value = result.formattedText;
                    
                    // TEMPORARY: Add CSV below formatted text for testing
                    if (result.csvResult) {
                        textarea.value += '\n\n=== CSV Output (TEMPORARY) ===\n' + result.csvResult;

                        // NEW: Add SSOC mapping output below CSV
                        const ssocMappings = convertSSOCEntries(result.csvResult);
                        if (ssocMappings) {
                            textarea.value += '\n\n=== SSOC Category Mapping ===\n' + ssocMappings;
                        }
                    }

                    // Copy the formatted text to clipboard
                    navigator.clipboard.writeText(result.formattedText)
                        .then(() => {
                            showToast('Profile formatted and copied to clipboard!');
                            if (result.csvResult) {
                                // Store CSV result for later use
                                textarea.dataset.csvResult = result.csvResult;
                                showToast('Block history processed and stored!');
                            }
                            closeTextWindow();
                        })
                        .catch(err => {
                            console.error('Failed to copy text:', err);
                            showToast('Error copying to clipboard');
                        });
                }, 100);
            });

            header.appendChild(title);
            header.appendChild(closeButton);
            windowPane.appendChild(header);
            windowPane.appendChild(textarea);

            overlay.appendChild(windowPane);
            document.body.appendChild(overlay);

            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    closeTextWindow();
                }
            });

            return {
                overlay,
                windowPane,
                textarea
            };
        }

        function showTextWindow() {
            if (!textWindow) {
                textWindow = createTextWindow();
            }
            textWindow.overlay.classList.add('show');
            textWindow.windowPane.classList.add('show');
            textWindow.textarea.focus();
        }

        function closeTextWindow() {
            if (textWindow) {
                textWindow.overlay.classList.remove('show');
                textWindow.windowPane.classList.remove('show');
            }
        }

        function processBlockHistory(text) {
            // Split the text into lines and filter out empty lines
            const lines = text.split('\n').filter(line => line.trim());
            
            // Initialize CSV string with headers
            let csv = '"date","user","captain status","revised status","category","sub-category","comment","unblocking"\n';
            
            // Create a map to store unique entries based on B.ID and T.ID
            const uniqueEntries = new Map();
            
            // Array to store Safety-Other entries (no deduplication needed)
            const safetyOtherEntries = [];

            // Array to store ride_behavior entries and related retraining
            const rideBehaviorEntries = [];

            // Flag to track if we found any non-matching entries
            let hasNonMatchingEntries = false;
            
            // Helper function to extract B.ID and T.ID from comment
            function extractIds(comment) {
                const bIdMatch = comment.match(/B\.\s*ID:(\d+)/);
                const tIdMatch = comment.match(/T\.\s*ID:(\d+)/);
                return bIdMatch && tIdMatch ? `${bIdMatch[1]}-${tIdMatch[1]}` : null;
            }

            // Helper function to parse date
            function parseDate(dateStr) {
                const [dayName, month, day, year, time] = dateStr.split(' ');
                const [hours, minutes] = time.split(':');
                return new Date(`${month} ${day} ${year} ${hours}:${minutes}`);
            }

            // Keep track of the previous entry's sub-category and date
            let prevSubCategory = '';
            let prevDate = null;

            // Process each line
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                
                // Skip header lines and irrelevant content
                if (line === 'BLOCK HISTORY' || line === 'Date\tUser\tCaptain Status\tCategory\tSub-Category\tComment\tUnblocking' || 
                    line === 'Previous\tRevised' || !line.includes('\t')) {
                    continue;
                }

                // Split by tabs and clean up each field
                const parts = line.split('\t').map(part => part.trim());
                
                // Skip if we don't have enough parts
                if (parts.length < 4) continue;

                // Extract the fields, handling undefined values
                const date = parts[0] || '';
                const user = parts[1] || '';
                const captainStatus = parts[2] || '';
                let revisedStatus = '';
                let category = '';
                let subCategory = '';
                let comment = '';
                let unblocking = '';

                // Handle the case where Revised Status exists
                if (parts[3] === 'Active' || parts[3] === 'Temporary Blocked' || parts[3] === 'Permanent Blocked' || 
                    parts[3] === 'Invalid' || parts[3] === 'Temporary Block (24 hours)') {
                    revisedStatus = parts[3];
                    category = parts[4] || '';
                    subCategory = parts[5] || '';
                    comment = parts[6] || '';
                    unblocking = parts[7] || '';
                } else {
                    // Case where Revised Status is missing
                    category = parts[3] || '';
                    subCategory = parts[4] || '';
                    comment = parts[5] || '';
                    unblocking = parts[6] || '';
                }

                // Create entry object
                const entry = {
                    date,
                    user,
                    captainStatus,
                    revisedStatus,
                    category,
                    subCategory,
                    comment,
                    unblocking,
                    timestamp: parseDate(date),
                    hasCorrection: comment.toLowerCase().includes('correction')
                };

                // Check if this is a non-matching entry
                if (subCategory !== 'SSOC' && 
                    !(category === 'Safety' && subCategory === 'Other') && 
                    subCategory !== 'ride_behavior' &&
                    subCategory !== 'Re-training completed') {
                    hasNonMatchingEntries = true;
                }

                // Handle ride_behavior entries
                if (subCategory === 'ride_behavior') {
                    if (prevSubCategory === 'Re-training completed') {
                        rideBehaviorEntries.push({
                            ...entry,
                            isPartOfPair: true
                        });
                    } else {
                        rideBehaviorEntries.push({
                            ...entry,
                            isPartOfPair: false
                        });
                    }
                } else if (subCategory === 'Re-training completed') {
                    prevSubCategory = subCategory;
                    prevDate = date;
                } else {
                    prevSubCategory = subCategory;
                    prevDate = date;

                    if (category === 'Safety' && subCategory === 'Other') {
                        safetyOtherEntries.push(entry);
                        continue;
                    }

                    if (subCategory === 'SSOC') {
                        const ids = extractIds(comment);
                        if (!ids) continue;

                        if (uniqueEntries.has(ids)) {
                            const existingEntry = uniqueEntries.get(ids);
                            
                            if (entry.hasCorrection && !existingEntry.hasCorrection) {
                                uniqueEntries.set(ids, entry);
                            } else if (entry.hasCorrection === existingEntry.hasCorrection) {
                                if (entry.timestamp >= existingEntry.timestamp) {
                                    uniqueEntries.set(ids, entry);
                                }
                            }
                        } else {
                            uniqueEntries.set(ids, entry);
                        }
                    }
                }
            }
            
            // Convert unique SSOC entries and all other entries to CSV
            for (const entry of uniqueEntries.values()) {
                const escapedFields = [
                    `"${entry.date.toLowerCase()}"`,
                    `"${entry.user.toLowerCase()}"`,
                    `"${entry.captainStatus.toLowerCase()}"`,
                    `"${entry.revisedStatus.toLowerCase()}"`,
                    `"${entry.category.toLowerCase()}"`,
                    `"${entry.subCategory.toLowerCase()}"`,
                    `"${entry.comment.toLowerCase()}"`,
                    `"${entry.unblocking.toLowerCase()}"`
                ];
                csv += escapedFields.join(',') + '\n';
            }

            // Add all Safety-Other entries
            for (const entry of safetyOtherEntries) {
                const escapedFields = [
                    `"${entry.date.toLowerCase()}"`,
                    `"${entry.user.toLowerCase()}"`,
                    `"${entry.captainStatus.toLowerCase()}"`,
                    `"${entry.revisedStatus.toLowerCase()}"`,
                    `"${entry.category.toLowerCase()}"`,
                    `"${entry.subCategory.toLowerCase()}"`,
                    `"${entry.comment.toLowerCase()}"`,
                    `"${entry.unblocking.toLowerCase()}"`
                ];
                csv += escapedFields.join(',') + '\n';
            }

            // Add ride_behavior entries
            for (const entry of rideBehaviorEntries) {
                if (entry.isPartOfPair) {
                    const retrainingFields = [
                        `"${prevDate.toLowerCase()}"`,
                        `"${entry.user.toLowerCase()}"`,
                        `"${entry.captainStatus === 'Active' ? 'temporary blocked' : 'active'}"`,
                        `"${entry.captainStatus.toLowerCase()}"`,
                        `"${entry.category.toLowerCase()}"`,
                        `"re-training completed"`,
                        `"retraining for ride behavior"`,
                        `"${entry.unblocking.toLowerCase()}"`
                    ];
                    csv += retrainingFields.join(',') + '\n';
                }

                const escapedFields = [
                    `"${entry.date.toLowerCase()}"`,
                    `"${entry.user.toLowerCase()}"`,
                    `"${entry.captainStatus.toLowerCase()}"`,
                    `"${entry.revisedStatus.toLowerCase()}"`,
                    `"${entry.category.toLowerCase()}"`,
                    `"${entry.subCategory.toLowerCase()}"`,
                    `"${entry.comment.toLowerCase()}"`,
                    `"${entry.unblocking.toLowerCase()}"`
                ];
                csv += escapedFields.join(',') + '\n';
            }

            // Add "Not SSOC related" line if we found any non-matching entries
            if (hasNonMatchingEntries) {
                csv += '"not ssoc related","not ssoc related","not ssoc related","not ssoc related","not ssoc related","not ssoc related","not ssoc related",""\n';
            }
            
            return csv;
        }

        function createBlockHistoryWindow() {
            const overlay = document.createElement('div');
            overlay.className = 'text-window-overlay';

            const windowPane = document.createElement('div');
            windowPane.className = 'text-window-pane';

            const header = document.createElement('div');
            header.className = 'text-window-header';

            const title = document.createElement('div');
            title.className = 'text-window-title';
            title.textContent = 'Block History to CSV';

            const closeButton = document.createElement('button');
            closeButton.className = 'text-window-close';
            closeButton.innerHTML = '×';
            closeButton.onclick = () => {
                overlay.classList.remove('show');
                windowPane.classList.remove('show');
            };

            const textarea = document.createElement('textarea');
            textarea.className = 'text-window-textarea';
            textarea.placeholder = 'Paste block history text here...';

            const transformButton = document.createElement('button');
            transformButton.className = 'text-window-transform-button';
            transformButton.textContent = 'Convert to CSV';
            transformButton.onclick = () => {
                const inputText = textarea.value;
                const csvText = processBlockHistory(inputText);
                textarea.value = csvText;
                navigator.clipboard.writeText(csvText)
                    .then(() => {
                        showToast('CSV copied to clipboard!');
                    })
                    .catch(err => {
                        console.error('Failed to copy CSV:', err);
                        showToast('Error copying CSV to clipboard');
                    });
            };

            header.appendChild(title);
            header.appendChild(closeButton);
            windowPane.appendChild(header);
            windowPane.appendChild(textarea);
            windowPane.appendChild(transformButton);

            overlay.appendChild(windowPane);
            document.body.appendChild(overlay);

            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.classList.remove('show');
                    windowPane.classList.remove('show');
                }
            });

            return {
                overlay,
                windowPane,
                textarea
            };
        }

        let blockHistoryWindow = null;

        function showBlockHistoryWindow() {
            if (!blockHistoryWindow) {
                blockHistoryWindow = createBlockHistoryWindow();
            }
            blockHistoryWindow.overlay.classList.add('show');
            blockHistoryWindow.windowPane.classList.add('show');
            blockHistoryWindow.textarea.focus();
        }

        function createTextInputButton() {
            const listItem = document.createElement('li');
            listItem.className = 'nav-list-item';

            const button = document.createElement('button');
            button.className = 'form-toggle-icon StyledBaseNavItem-sc-zvo43f-0 StyledNavButton-sc-f5ux3-0 gvFgbC dXnFqH';
            button.setAttribute('tabindex', '0');
            button.setAttribute('data-garden-id', 'chrome.nav_button');
            button.setAttribute('data-garden-version', '9.5.2');

            const iconWrapper = document.createElement('div');
            iconWrapper.style.display = 'flex';
            iconWrapper.style.alignItems = 'center';

            const icon = document.createElement('div');
            icon.innerHTML = memoSVG;
            icon.firstChild.setAttribute('width', '26');
            icon.firstChild.setAttribute('height', '26');
            icon.firstChild.setAttribute('data-garden-id', 'chrome.nav_item_icon');
            icon.firstChild.setAttribute('data-garden-version', '9.5.2');
            icon.firstChild.classList.add('StyledBaseIcon-sc-1moykgb-0', 'StyledNavItemIcon-sc-7w9rpt-0', 'eWlVPJ', 'YOjtB');

            const text = document.createElement('span');
            text.textContent = 'Text Input';
            text.className = 'StyledNavItemText-sc-13m84xl-0 iOGbGR';
            text.setAttribute('data-garden-id', 'chrome.nav_item_text');
            text.setAttribute('data-garden-version', '9.5.2');

            iconWrapper.appendChild(icon);
            iconWrapper.appendChild(text);
            button.appendChild(iconWrapper);
            listItem.appendChild(button);

            button.addEventListener('click', showTextWindow);

            return listItem;
        }

        function createSeparator() {
            const separator = document.createElement('li');
            separator.className = 'nav-separator';
            return separator;
        }

        function tryAddButtons() {

            const navLists = document.querySelectorAll('ul[data-garden-id="chrome.nav_list"]');
            const navList = navLists[navLists.length - 1]; // Get the last nav list
            console.log('Searching for empty nav list:', navList);

            if (navList && !globalButton) {
                console.log('Found nav list, creating buttons');


                const separator = createSeparator();
                navList.appendChild(separator);


                const customSection = document.createElement('div');
                customSection.className = 'custom-nav-section';


                globalButton = createToggleButton();
                const button = globalButton.querySelector('button');
                button.addEventListener('click', toggleAllFields);
                customSection.appendChild(globalButton);


                const fieldOpsButton = createFieldOpsButton();
                const fieldOpsButtonEl = fieldOpsButton.querySelector('button');
                fieldOpsButtonEl.addEventListener('click', updateAllFields);
                customSection.appendChild(fieldOpsButton);


                const textInputButton = createTextInputButton();
                customSection.appendChild(textInputButton);

                navList.appendChild(customSection);

                console.log('Buttons added to nav list');
                return true;
            }
            return false;
        }


        function initObserver() {
            console.log('Starting form manager initialization...');
            injectCSS();

            // Function to check if we're in a ticket view
            function isTicketView() {
                return window.location.pathname.includes('/agent/tickets/');
            }

            // Function to handle ticket view changes
            function handleTicketView() {
                if (!isTicketView()) return;

                // Add buttons if they don't exist
                if (!globalButton) {
                    tryAddButtons();
                }

                // Find and initialize visible form containers
                const formContainers = document.querySelectorAll('div[data-test-id="ticket-fields"][data-tracking-id="ticket-fields"]');
                
                if (formContainers.length === 0) {
                    // If no containers found, retry after a short delay
                    setTimeout(() => {
                        const retryContainers = document.querySelectorAll('div[data-test-id="ticket-fields"][data-tracking-id="ticket-fields"]');
                        retryContainers.forEach(container => {
                            if (container.offsetParent !== null) {
                                console.log('Initializing visible form container (retry)...');
                                initFormManager(container);
                            }
                        });
                    }, 500);
                    return;
                }

                formContainers.forEach(container => {
                    if (container.offsetParent !== null) {
                        console.log('Initializing visible form container...');
                        initFormManager(container);
                    }
                });
            }

            // Create a lightweight observer for form changes
            const formObserver = new MutationObserver((mutations) => {
                let shouldHandle = false;
                
                for (const mutation of mutations) {
                    // Check if the mutation involves our target elements
                    if (mutation.target.matches && 
                        (mutation.target.matches('div[data-test-id="ticket-fields"]') ||
                         mutation.target.closest('div[data-test-id="ticket-fields"]'))) {
                        shouldHandle = true;
                        break;
                    }
                }

                if (shouldHandle) {
                    handleTicketView();
                }
            });

            // Observe the main content area instead of the entire body
            const mainContent = document.querySelector('main') || document.body;
            formObserver.observe(mainContent, {
                childList: true,
                subtree: true,
                attributes: false // Don't watch attributes to reduce overhead
            });

            // Handle URL changes for single page app navigation
            let lastUrl = location.href;
            const urlObserver = new MutationObserver(() => {
                const url = location.href;
                if (url !== lastUrl) {
                    lastUrl = url;
                    // Wait a short moment for the page to update
                    setTimeout(handleTicketView, 500);
                }
            });

            // Only observe title changes to detect navigation
            urlObserver.observe(document.querySelector('title'), {
                childList: true,
                characterData: true
            });

            // Initial setup
            if (isTicketView()) {
                // Delay initial setup slightly to ensure page is ready
                setTimeout(handleTicketView, 1000);
            }
        }

        function convertSSOCEntries(csvText) {
            // Split CSV into lines, skip header
            const lines = csvText.split('\n').filter(line => line.trim());
            if (lines.length < 2) return '';
            const header = lines[0];
            const entries = lines.slice(1);
            let output = '';
            for (const line of entries) {
                // Split CSV line, handling quoted commas
                const fields = line.match(/\"([^\"]*)\"/g)?.map(f => f.replace(/\"/g, ''));
                if (!fields || fields.length < 8) continue;
                const subCategory = fields[5]?.toLowerCase();
                if (subCategory === 'ssoc') {
                    const comment = fields[6]?.toLowerCase();
                    const mapped = mapSSOCComment(comment);
                    output += `"${fields[0]}","${fields[1]}","${fields[2]}","${fields[3]}","${fields[4]}","${fields[5]}","${fields[6]}","${fields[7]}","${mapped}"\n`;
                }
            }
            if (!output) return '';
            return 'date,user,captain status,revised status,category,sub-category,comment,unblocking,ssoc-mapped\n' + output;
        }

        function mapSSOCComment(input) {
            // Lowercase for easier matching
            const s = input.toLowerCase();
            function hasAny(...arr) { return arr.some(word => s.includes(word)); }
            // ACCIDENTS
            if (hasAny('accident', 'accidents')) {
                if (hasAny('fatality', 'fatalities')) {
                    if (hasAny('unknown', 'unverified')) return 'Accident Fatality - Unknown Cause';
                    if (s.includes('using phone')) return 'Accident Fatality - Using Phone';
                    if (hasAny('speed', 'reckless')) return 'Accident Fatality - Reckless';
                    if (s.includes('3rd party')) return 'Accident Fatality - 3rd party';
                    return 'Accident Fatality';
                } else if (hasAny('injury', 'injuries')) {
                    if (hasAny('unknown', 'unverified')) return 'Accident Injury - Unknown Cause';
                    if (s.includes('using phone')) return 'Accident Injury - Using Phone';
                    if (hasAny('speed', 'reckless')) return 'Accident Injury - Reckless';
                    if (s.includes('3rd party')) return 'Accident Injury - 3rd party';
                    return 'Accident Injury';
                } else if (hasAny('no injury', 'no injuries')) {
                    if (hasAny('unknown', 'unverified')) return 'Accident No Injuries - Unknown Cause';
                    if (s.includes('using phone')) return 'Accident No Injuries - Using Phone';
                    if (hasAny('speed', 'reckless')) return 'Accident No Injuries - Reckless';
                    if (s.includes('3rd party')) return 'Accident No Injuries - 3rd party';
                    return 'Accident No Injuries';
                } else {
                    return 'Accident';
                }
            }
            if (s.includes('customer touched captain')) return 'Customer Touched Captain';
            if (s.includes('captain touched customer')) return 'Captain Touched Customer';
            if (s.includes('inappropriate talk')) return 'Inappropriate Talk';
            if (hasAny('mirror', 'staring')) return 'Staring';
            if (s.includes('other sexual physical contact')) return 'Other Sexual Physical Contact';
            if (s.includes('sexual harassment')) return 'Sexual Harassment';
            if (s.includes('contact after ride')) {
                if (s.includes('stalking')) return 'Stalking';
                return 'Contact After Ride';
            }
            if (s.includes('customer kidnapped captain')) return 'Customer Kidnapped Captain';
            if (s.includes('captain kidnapped customer')) return 'Captain Kidnapped Customer';
            if (s.includes('kidnap')) return 'Kidnap';
            if (hasAny('held by law enforcement', 'held by law')) return 'Held By Law Enforcement';
            if (s.includes('held against will')) return 'Held Against Will';
            if (s.includes('medical emergency')) return 'Medical Emergency';
            if (s.includes('physical attack')) return 'Physical Attack';
            if (s.includes('threats of physical harm')) return 'Threats of Physical Harm';
            if (hasAny('unsafe / forced drop off', 'unsafe drop off', 'forced drop off', 'unsafe / forced dropoff', 'unsafe dropoff', 'forced dropoff')) return 'Forced Drop off';
            if (hasAny('covid 19', 'covid19', 'covid-19')) return 'Covid-19';
            if (s.includes('customer under influence')) return 'Customer Under Influence';
            if ((hasAny('selling', 'offering')) && s.includes('drugs')) return 'Selling Drugs';
            if (s.includes('transporting drugs')) return 'Transporting Drugs';
            if (s.includes('driving under influence')) return 'Driving Under Influence';
            if (s.includes('armed robbery')) return 'Armed Robbery';
            if (s.includes('theft')) return 'Theft';
            if (hasAny('no seatbelt', 'no helmet', 'no seatbelt / helmet')) return 'No Seatbelt / Helmet';
            if (hasAny('reckless driving', 'reckless')) return 'Reckless Driving';
            if (hasAny('sleepy', 'tired', 'sleepy / tired captain')) return 'Sleepy Captain';
            if (s.includes('using phone')) return 'Using Phone';
            if (hasAny('not specified captain') || (s.includes('impostor') && s.includes('captain'))) return 'Impostor Captain';
            if (hasAny('not specified car') || (s.includes('impostor') && s.includes('car'))) return 'Impostor Car';
            if (s.includes('unauthorized person in vehicle')) return 'Unauthorized Person in Vehicle';
            return 'Unknown / Needs Review';
        }


        console.log('Script starting...');
        initObserver();
    })();