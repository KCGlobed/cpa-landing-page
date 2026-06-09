
const hamburgerBtn = document.getElementById('hamburger-btn');
const navMenu = document.getElementById('nav-menu');

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

// --- CASHFREE CONFIGURATION ---
// Replace these values with your actual API endpoints and Cashfree environment
const API_CONFIG = {
    // The endpoint on your backend that saves form data and returns Cashfree order details
    CREATE_ORDER_URL: 'https://api.yourdomain.com/payments/create-order',
    // The endpoint on your backend to verify order payment status
    CHECK_STATUS_URL: 'https://api.yourdomain.com/payments/check-status',
    // Set to 'sandbox' for testing, or 'production' for live payments
    CASHFREE_MODE: 'sandbox' 
};

// Initialize Cashfree SDK
let cashfree;
try {
    cashfree = Cashfree({
        mode: API_CONFIG.CASHFREE_MODE
    });
} catch (error) {
    console.error("Failed to initialize Cashfree SDK. Make sure the SDK script is loaded in index.html.", error);
}

// Function to call your API and verify/update payment status
const handlePaymentVerification = async (orderId) => {
    try {
        const response = await fetch(`${API_CONFIG.CHECK_STATUS_URL}?order_id=${orderId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Verification API responded with status: ${response.status}`);
        }

        const verificationData = await response.json();
        
        // Show success/failure based on the API response
        if (verificationData.status === 'SUCCESS' || verificationData.payment_status === 'SUCCESS') {
            alert("Payment Successful! Thank you for registering.");
            // Optionally redirect to a thank you page
            // window.location.href = "/thank-you.html";
        } else {
            alert(`Payment Status: ${verificationData.status || verificationData.payment_status || 'FAILED'}`);
        }
    } catch (error) {
        console.error("Error verifying payment status:", error);
        alert("Unable to verify payment status. Please contact support.");
    }
};

// Check if we were redirected back with an order_id in the URL parameters
const checkUrlForPaymentStatus = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('order_id');
    if (orderId) {
        // Clear query parameters from URL without reloading the page
        const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
        window.history.replaceState({ path: cleanUrl }, '', cleanUrl);

        // Verify the payment status
        handlePaymentVerification(orderId);
    }
};

// Execute check on page load
checkUrlForPaymentStatus();

// Handle Form Submission
const leadForm = document.getElementById('lead-form');
if (leadForm) {
    leadForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Collect Form Data
        const formData = {
            name: document.getElementById('lead-name').value,
            email: document.getElementById('lead-email').value,
            phone: document.getElementById('lead-phone').value,
            state: document.getElementById('lead-state').value,
            city: document.getElementById('lead-city').value
        };

        const submitButton = leadForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Processing...';

        try {
            // Send Lead Form data to your backend API to create an order
            const response = await fetch(API_CONFIG.CREATE_ORDER_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error(`Failed to create order. Server responded with status: ${response.status}`);
            }

            const data = await response.json();
            
            // Extract the payment session ID and order ID.
            const paymentSessionId = data.payment_session_id || data.paymentSessionId;
            const orderId = data.order_id || data.orderId;

            if (!paymentSessionId) {
                throw new Error("No payment session ID returned from the server.");
            }

            if (!cashfree) {
                throw new Error("Cashfree SDK is not initialized.");
            }

            // Trigger Cashfree checkout flow
            const checkoutOptions = {
                paymentSessionId: paymentSessionId,
                // Cashfree will replace {order_id} with the actual order ID in the redirect query param
                returnUrl: `${window.location.origin}${window.location.pathname}?order_id={order_id}`,
                redirectTarget: "_self" // Use "_self", "_blank", or "_modal" (for popup/iframe checkout if allowed)
            };
            
            cashfree.checkout(checkoutOptions).then((result) => {
                if (result.error) {
                    console.error("Payment initiation error or user closed modal:", result.error);
                    alert(`Payment failed or cancelled: ${result.error.message}`);
                }
                if (result.redirect) {
                    console.log("Redirecting user to Cashfree payment page...");
                }
            });

        } catch (error) {
            console.error("Checkout integration error:", error);
            alert(`Error: ${error.message || 'Something went wrong. Please try again.'}`);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    });
}