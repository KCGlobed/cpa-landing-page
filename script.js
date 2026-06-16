
const hamburgerBtn = document.getElementById('hamburger-btn');
const navMenu = document.getElementById('nav-menu');

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
    KEY_ID: 'rzp_test_T1nLH080qVas7G', // Replace with your actual Razorpay Key ID
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
const reportPaymentStatus = async ({ orderId, paymentId, signature, amount, status, responseJson, lid }) => {
    try {
        const payload = {
            razorpay_order_id: orderId || "",
            razorpay_payment_id: paymentId || "",
            razorpay_signature: signature || "",
            amount: amount || "1.00",
            currency: RAZORPAY_CONFIG.CURRENCY,
            status: status, // "initiated", "success", "failed"
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

const leadForm = document.getElementById('lead-form');

if (leadForm) {
    leadForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = {
            full_name: document.getElementById('lead-name').value,
            email: document.getElementById('lead-email').value,
            phone: document.getElementById('lead-phone').value,
            state: document.getElementById('lead-state').value,
            city: document.getElementById('lead-city').value
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

            // Reset Form fields
            leadForm.reset();
            document.querySelector('.select-city').innerHTML =
                '<option value="">Select City</option>';

            // Step 2: Report Initiated Status to CPA backend
            showLoader('Initiating Payment...');
            
            await reportPaymentStatus({
                orderId: "",
                paymentId: "",
                signature: "",
                amount: RAZORPAY_CONFIG.AMOUNT,
                status: 'initiated',
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

            // Step 3: Open Razorpay Checkout Modal
            const 
            amountInPaise = Math.round(parseFloat(RAZORPAY_CONFIG.AMOUNT) * 100);

            const options = {
                key: RAZORPAY_CONFIG.KEY_ID,
                amount: amountInPaise,
                currency: RAZORPAY_CONFIG.CURRENCY,
                name: 'KC GlobEd',
                description: 'CPA Course Registration Fee',
                prefill: {
                    name: formData.full_name,
                    email: formData.email,
                    contact: formData.phone
                },
                handler: async function (rzpResponse) {
                    hideLoader();
                    showLoader('Verifying Payment...');
                    
                    // Step 4: Report Successful Payment to CPA backend
                    await reportPaymentStatus({
                        orderId: rzpResponse.razorpay_order_id || "",
                        paymentId: rzpResponse.razorpay_payment_id || "",
                        signature: rzpResponse.razorpay_signature || "",
                        amount: RAZORPAY_CONFIG.AMOUNT,
                        status: 'success',
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
                    showDialog('success', 'Thank You!', 'Payment Successful! Thank you for registering.');
                    submitButton.disabled = false;
                },
                modal: {
                    ondismiss: async function () {
                        hideLoader();
                        showLoader('Cancelling Payment...');
                        
                        // Step 5: Report Cancelled/Failed Payment to CPA backend
                        await reportPaymentStatus({
                            orderId: "",
                            paymentId: "",
                            signature: "",
                            amount: RAZORPAY_CONFIG.AMOUNT,
                            status: 'failed',
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

            hideLoader(); // Hide the loader before Razorpay opens its own checkout UI
            const rzp = new Razorpay(options);
            rzp.open();

        } catch (error) {
            console.error('Razorpay checkout error:', error);
            hideLoader();
            showDialog('error', 'Error', error.message || 'Something went wrong. Please try again.');
            submitButton.disabled = false;
        }
    });
}