const hamburgerBtn = document.getElementById('hamburger-btn');
const navMenu = document.getElementById('nav-menu');

document.getElementById("subscribeBtn").addEventListener("click", () => {
    document.getElementById("enquiry-form").scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
});

if (hamburgerBtn && navMenu) {
    hamburgerBtn.addEventListener('click', () => {
        hamburgerBtn.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Close menu when clicking a link
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            hamburgerBtn.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });
}

const loadStates = async () => {
    const response = await fetch("state-city.json");
    return await response.json();
};

const populateStates = async () => {
    const statesData = await loadStates();

    const selectState = document.querySelector(".select-state");
    const selectCity = document.querySelector(".select-city");

    // Populate states
    for (const state in statesData) {
        const option = document.createElement("option");
        option.value = state;
        option.textContent = state;
        selectState.appendChild(option);
    }

    // State change event
    selectState.addEventListener("change", () => {
        const selectedState = selectState.value;

        // Clear cities
        selectCity.innerHTML =
            '<option value="">Select City</option>';

        const cities = statesData[selectedState];

        if (cities) {
            cities.forEach(city => {
                const option = document.createElement("option");
                option.value = city;
                option.textContent = city;
                selectCity.appendChild(option);
            });
        }
    });
};

populateStates();

// --- RAZORPAY CONFIGURATION ---
const RAZORPAY_CONFIG = {
    KEY_ID: 'rzp_live_kaycXLonITtI0t', 
    // KEY_ID: 'rzp_test_T1nLH080qVas7G', 
    AMOUNT: '50000.00',                   // Amount in rupees
    CURRENCY: 'INR'
};

const CPA_API_CONFIG = {
    BASE_URL: 'https://cpa-prod-738131651355.asia-south1.run.app',
    CREATE_PAYMENT_URL: 'https://cpa-prod-738131651355.asia-south1.run.app/api/careers/create_payment/'
};

// --- CUSTOM LOADER & POPUP HELPER FUNCTIONS ---
const loaderOverlay = document.getElementById('custom-loader-overlay');
const loaderMessage = document.getElementById('loader-message');
const dialogOverlay = document.getElementById('custom-dialog-overlay');
const dialogIcon = document.getElementById('dialog-icon');
const dialogTitle = document.getElementById('dialog-title');
const dialogMessage = document.getElementById('dialog-message');
const dialogCloseBtn = document.getElementById('dialog-close-btn');

const showLoader = (message) => {
    loaderMessage.textContent = message;
    loaderOverlay.style.display = 'flex';
    // Allow thread to render the block before setting opacity
    setTimeout(() => {
        loaderOverlay.classList.add('active');
    }, 10);
};

const hideLoader = () => {
    loaderOverlay.classList.remove('active');
    setTimeout(() => {
        loaderOverlay.style.display = 'none';
    }, 250);
};

const showDialog = (type, title, message) => {
    // Reset styles
    dialogIcon.className = 'dialog-icon';
    if (type === 'success') {
        dialogIcon.classList.add('success-icon');
    } else {
        dialogIcon.classList.add('error-icon');
    }

    dialogTitle.textContent = title;
    dialogMessage.textContent = message;

    dialogOverlay.style.display = 'flex';
    setTimeout(() => {
        dialogOverlay.classList.add('active');
    }, 10);
};

const hideDialog = () => {
    dialogOverlay.classList.remove('active');
    setTimeout(() => {
        dialogOverlay.style.display = 'none';
    }, 250);
};

// Bind close button
if (dialogCloseBtn) {
    dialogCloseBtn.addEventListener('click', hideDialog);
}

// Function to call CPA create_payment API
const reportPaymentStatus = async ({ orderId, paymentId, signature, amount, duration, status, method, responseJson, lid }) => {
    try {
        const payload = {
            razorpay_order_id: orderId || "",
            razorpay_payment_id: paymentId || "",
            razorpay_signature: signature || "",
            amount: amount ,
            duration: duration,
            currency: RAZORPAY_CONFIG.CURRENCY,
            status: status, // "initiated", "success", "failed"
            payment_method: method || "", // "upi", "card", "netbanking", "wallet", etc.
            response: JSON.stringify(responseJson || {}),
            lid: String(lid)
        };

        const response = await fetch(CPA_API_CONFIG.CREATE_PAYMENT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            console.error("Failed to report payment status to CPA backend:", response.statusText);
        } else {
            console.log(`Successfully reported payment status (${status}) to CPA backend.`);
        }
    } catch (error) {
        console.error("Error reporting payment status to CPA backend:", error);
    }
};

const injectPlanModalStyles = () => {
    if (document.getElementById('plan-modal-styles')) return;
    const style = document.createElement('style');
    style.id = 'plan-modal-styles';
    style.textContent = `
    .plan-modal-overlay {
        position: fixed;
        top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(4px);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease, visibility 0.3s ease;
        font-family: "Inter", sans-serif;
    }
    .plan-modal-overlay.active {
        opacity: 1;
        visibility: visible;
    }
    .plan-modal {
        background: #fafafa;
        border-radius: 16px;
        width: 90%;
        max-width: 500px;
        padding: 30px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.1);
        transform: translateY(20px);
        transition: transform 0.3s ease;
        text-align: left;
        position: relative;
    }
    .plan-modal-overlay.active .plan-modal {
        transform: translateY(0);
    }
    .plan-modal-close {
        position: absolute;
        top: 15px; right: 15px;
        background: transparent;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #999;
        transition: color 0.2s;
    }
    .plan-modal-close:hover {
        color: #333;
    }
    .plan-modal h2 {
        font-size: 22px;
        color: #111;
        margin-top: 0;
        margin-bottom: 24px;
        font-weight: 700;
    }
    .plan-cards {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }
    .plan-card {
        display: flex;
        align-items: center;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        padding: 20px;
        cursor: pointer;
        transition: all 0.2s ease;
        background: #fff;
        position: relative;
    }
    .plan-card.selected {
        border: 2px solid #8457e7;
    }
    .plan-card-checkbox {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        border: 2px solid #d1d5db;
        display: flex;
        justify-content: center;
        align-items: center;
        margin-right: 16px;
        transition: all 0.2s ease;
    }
    .plan-card-checkbox svg {
        width: 14px;
        height: 14px;
        fill: none;
        stroke: #d1d5db;
        stroke-width: 3;
        stroke-linecap: round;
        stroke-linejoin: round;
    }
    .plan-card.selected .plan-card-checkbox {
        background: #10b981;
        border-color: #10b981;
    }
    .plan-card.selected .plan-card-checkbox svg {
        stroke: #fff;
    }
    .plan-card-content {
        flex: 1;
    }
    .plan-card-title {
        font-size: 16px;
        font-weight: 700;
        color: #111;
        margin-bottom: 4px;
    }
    .plan-card-breakdown {
        font-size: 14px;
        color: #6b7280;
    }
    .plan-card-badge {
        position: absolute;
        top: 16px;
        right: 16px;
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: 700;
        border: 1px solid #8457e7;
        color: #8457e7;
        background: #fff;
        transition: all 0.2s ease;
    }
    .plan-card.selected .plan-card-badge {
        background: #10b981;
        color: #fff;
        border-color: #10b981;
    }
    .plan-modal-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 30px;
        padding-top: 20px;
        border-top: 1px solid #e5e7eb;
    }
    .plan-modal-total-label {
        font-size: 18px;
        font-weight: 600;
        color: #111;
    }
    .plan-modal-total-price {
        font-size: 28px;
        font-weight: 800;
        color: #111;
    }
    .plan-modal-submit-btn {
        background: #8457e7;
        color: #fff;
        border: none;
        padding: 14px 24px;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        width: 100%;
        margin-top: 24px;
        transition: background 0.3s ease;
    }
    .plan-modal-submit-btn:hover {
        background: #6e44c5;
    }
    `;
    document.head.appendChild(style);
};

const createPlanModal = () => {
    injectPlanModalStyles();
    const existingOverlay = document.getElementById('plan-modal-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }

    const overlay = document.createElement('div');
    overlay.className = 'plan-modal-overlay';
    overlay.id = 'plan-modal-overlay';

    overlay.innerHTML = `
        <div class="plan-modal">
            <button class="plan-modal-close" id="plan-modal-close">&times;</button>
            <h2>Select Your Subscription Plan</h2>
            <div class="plan-cards">
                <div class="plan-card selected" data-amount="59000" data-duration="31536000">
                    <div class="plan-card-checkbox">
                        <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                    <div class="plan-card-content">
                        <div class="plan-card-title">1 Year Subscription</div>
                        <div class="plan-card-breakdown">₹50,000 + 18% GST (₹9,000)</div>
                    </div>
                </div>
                
                <div class="plan-card" data-amount="94400" data-duration="63072000">
                    <div class="plan-card-checkbox">
                        <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                    <div class="plan-card-content">
                        <div class="plan-card-title">2 Year Subscription</div>
                        <div class="plan-card-breakdown">₹80,000 + 18% GST (₹14,400)</div>
                    </div>
                </div>
            </div>

            <div class="plan-modal-footer">
                <div class="plan-modal-total-label">Total</div>
                <div class="plan-modal-total-price" id="plan-modal-total">₹59,000</div>
            </div>
            
            <button class="plan-modal-submit-btn" id="plan-modal-proceed">Proceed to Payment</button>
        </div>
    `;
    document.body.appendChild(overlay);
};

const showPlanModal = (onSelectCallback, onCancelCallback) => {
    createPlanModal();
    const overlay = document.getElementById('plan-modal-overlay');

    const closeBtn = document.getElementById('plan-modal-close');
    const cards = document.querySelectorAll('.plan-card');
    const totalEl = document.getElementById('plan-modal-total');
    const proceedBtn = document.getElementById('plan-modal-proceed');

    let selectedAmount = "59000";
    let selectedDuration = "31536000";

    const hideModal = () => {
        overlay.classList.remove('active');
    };

    closeBtn.onclick = () => {
        hideModal();
        if (onCancelCallback) onCancelCallback();
    };

    cards.forEach(card => {
        card.onclick = () => {
            cards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');

            selectedAmount = card.getAttribute('data-amount');
            selectedDuration = card.getAttribute('data-duration');

            const formatted = new Intl.NumberFormat('en-IN').format(selectedAmount);
            totalEl.textContent = '₹' + formatted;
        };
    });

    proceedBtn.onclick = () => {
        hideModal();
        if (onSelectCallback) onSelectCallback(selectedAmount, selectedDuration);
    };

    setTimeout(() => overlay.classList.add('active'), 10);
};

const leadForm = document.getElementById('lead-form');

if (leadForm) {
    leadForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const isEA = window.location.pathname.toLowerCase().includes('ea');

        const formData = {
            full_name: document.getElementById('lead-name').value,
            email: document.getElementById('lead-email').value,
            phone: document.getElementById('lead-phone').value,
            state: document.getElementById('lead-state').value,
            city: document.getElementById('lead-city').value,
            source_form: isEA ? 2 : 1
        };

        const submitButton = leadForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;

        submitButton.disabled = true;
        showLoader('Submitting Form...');

        try {
            // Step 1: Submit Form to get Form ID (lid)
            const response = await fetch(
                'https://cpa-prod-738131651355.asia-south1.run.app/api/careers/create_cpa_career_form/',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || 'Failed to submit form'
                );
            }

            // Extract form id (lid)
            const lid = (data.data && Array.isArray(data.data) && data.data[0] && data.data[0].lid)
                || data.id
                || (data.data && data.data.id)
                || data.lid;

            if (!lid) {
                throw new Error("Form submission succeeded but no ID (lid) was returned.");
            }

            hideLoader();

            // Show Plan Selection Modal
            showPlanModal(async (selectedAmount, selectedDuration) => {
                showLoader('Initiating Payment...');

                // NOTE: orderId is empty here because no Razorpay order has been
                // created yet at this point (checkout opens without a server-side
                // order_id). If you add an order-creation step, pass that id here.
                await reportPaymentStatus({
                    orderId: "",
                    paymentId: "",
                    signature: "",
                    amount: selectedAmount,
                    duration: selectedDuration,
                    status: 'initiated',
                    method: "",
                    responseJson: {
                        message: "Payment checkout opened",
                        name: formData.full_name,
                        email: formData.email,
                        phone: formData.phone,
                        state: formData.state,
                        city: formData.city
                    },
                    lid: lid
                });

                const amountInPaise = Math.round(parseFloat(selectedAmount) * 100);

                const options = {
                    key: RAZORPAY_CONFIG.KEY_ID,
                    amount: amountInPaise,
                    currency: RAZORPAY_CONFIG.CURRENCY,
                    name: 'KC GlobEd',
                    description: 'Course Registration Fee',
                    prefill: {
                        name: formData.full_name,
                        email: formData.email,
                        contact: formData.phone
                    },
                    handler: async function (rzpResponse) {
                        hideLoader();
                        showLoader('Verifying Payment...');

                        // NOTE: Razorpay's checkout `handler` callback does not
                        // return the payment method (upi/card/netbanking/wallet).
                        // razorpay_order_id is also only present if you created
                        // the order server-side and passed options.order_id above.
                        // For the authoritative method/order details, fetch the
                        // payment from Razorpay's Payments API
                        // (GET /v1/payments/:id) on your backend using
                        // razorpay_payment_id, and store that against this lid.
                        await reportPaymentStatus({
                            orderId: rzpResponse.razorpay_order_id || "",
                            paymentId: rzpResponse.razorpay_payment_id || "",
                            signature: rzpResponse.razorpay_signature || "",
                            amount: selectedAmount,
                            duration: selectedDuration,
                            status: 'success',
                            method: rzpResponse.method || "",
                            responseJson: {
                                ...rzpResponse,
                                name: formData.full_name,
                                email: formData.email,
                                phone: formData.phone,
                                state: formData.state,
                                city: formData.city
                            },
                            lid: lid
                        });

                        hideLoader();

                        // Reset Form fields upon successful payment
                        leadForm.reset();
                        document.querySelector('.select-city').innerHTML =
                            '<option value="">Select City</option>';

                        showDialog('success', 'Thank You!', 'Payment Successful! Thank you for registering.');
                        submitButton.disabled = false;
                    },
                    modal: {
                        ondismiss: async function () {
                            hideLoader();
                            showLoader('Cancelling Payment...');

                            await reportPaymentStatus({
                                orderId: options.order_id || "",
                                paymentId: "",
                                signature: "",
                                amount: selectedAmount,
                                duration: selectedDuration,
                                status: 'failed',
                                method: "",
                                responseJson: {
                                    error: "User dismissed payment modal",
                                    reason: "The user manually closed the Razorpay popup interface before completion.",
                                    name: formData.full_name,
                                    email: formData.email,
                                    phone: formData.phone,
                                    state: formData.state,
                                    city: formData.city
                                },
                                lid: lid
                            });

                            hideLoader();
                            showDialog('error', 'Payment Cancelled', 'The payment session was closed or cancelled.');
                            submitButton.disabled = false;
                        }
                    },
                    theme: {
                        color: '#8457e7'
                    }
                };

                hideLoader();
                const rzp = new Razorpay(options);

                // Catches failed payment attempts (e.g. card declined) that
                // happen *before* the user dismisses the modal. Razorpay's
                // payment.failed event gives richer error metadata, including
                // order/payment ids and (in most cases) the method attempted.
                rzp.on('payment.failed', async function (failResponse) {
                    const err = failResponse.error || {};
                    const metadata = err.metadata || {};

                    hideLoader();
                    showLoader('Recording Failed Payment...');

                    await reportPaymentStatus({
                        orderId: metadata.order_id || options.order_id || "",
                        paymentId: metadata.payment_id || "",
                        signature: "",
                        amount: selectedAmount,
                        duration: selectedDuration,
                        status: 'failed',
                        method: err.method || "",
                        responseJson: {
                            error: err,
                            name: formData.full_name,
                            email: formData.email,
                            phone: formData.phone,
                            state: formData.state,
                            city: formData.city
                        },
                        lid: lid
                    });

                    hideLoader();
                    showDialog('error', 'Payment Failed', err.description || 'Your payment could not be processed. Please try again.');
                    submitButton.disabled = false;
                });

                rzp.open();

            }, () => {
                // Modal cancelled by user
                showDialog('error', 'Plan Not Selected', 'You must select a plan to proceed with the registration.');
                submitButton.disabled = false;
            });

        } catch (error) {
            console.error('Razorpay checkout error:', error);
            hideLoader();
            showDialog('error', 'Error', error.message || 'Something went wrong. Please try again.');
            submitButton.disabled = false;
        }
    });
}