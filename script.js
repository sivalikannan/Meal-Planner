// Import Firebase SDK functions (Modular v10 approach)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

/* 
  ==============================================================
  FIREBASE CONFIGURATION
  ==============================================================
  TODO: Replace this entire object with your project's credentials.
*/
const firebaseConfig = {
    apiKey: "AIzaSyDPO_rLGuq8AomYmQCUzHim2JZzfkaaPxs",
    authDomain: "meal-planner-app-828ab.firebaseapp.com",
    projectId: "meal-planner-app-828ab",
    storageBucket: "meal-planner-app-828ab.firebasestorage.app",
    messagingSenderId: "116174994738",
    appId: "1:116174994738:web:828f50aa33b66212e5eb2b",
    measurementId: "G-TXGJJXBTQJ"
};

// Initialize Firebase App
let db;
try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
} catch (error) {
    console.warn("Firebase config is incomplete. Please add your credentials. Form submissions will fail until corrected.");
}

/* 
  ==============================================================
  APPLICATION LOGIC & DATA
  ==============================================================
*/

// Mock Data for Plans (Easily scalable)
const plans = [
    {
        id: "veg-plan",
        name: "Basic Plan",
        price: "₹2000",
        desc: "Delicious and nutrient-rich vegetarian meals crafted with fresh seasonal ingredients.",
        icon: "🥗"
    },
    {
        id: "non-veg-plan",
        name: "Healthy Plan",
        price: "₹3000",
        desc: "High-protein meals featuring lean meats, fish, and balanced complex carbohydrates.",
        icon: "🍗"
    },
    {
        id: "diet-plan",
        name: "Choice Plan",
        price: "₹4000",
        desc: "Strict macro-counted meals tailored for weight loss and maintaining ketosis.",
        icon: "🥑"
    }
];

/* 
  ==============================================================
  MENU DATA CONFIGURATION 
  (Edit these arrays below to change your meals!)
  ==============================================================
*/
const menus = {
    // 🥗 VEG ONLY MENU
    veg: [
        { day: "Day 1", meals: [{ type: "Breakfast", name: "Idli, Sambar & Chutney", isVeg: true }, { type: "Lunch", name: "Veg Biryani & Raita", isVeg: true }, { type: "Dinner", name: "Chapathi & Paneer Butter Masala", isVeg: true }] },
        { day: "Day 2", meals: [{ type: "Breakfast", name: "Masala Dosa & Chutney", isVeg: true }, { type: "Lunch", name: "Chapathi & Veg Kurma", isVeg: true }, { type: "Dinner", name: "Poori & Chana Masala", isVeg: true }] },
        { day: "Day 3", meals: [{ type: "Breakfast", name: "Pongal & Coconut Chutney", isVeg: true }, { type: "Lunch", name: "Tomato Rice & Appalam", isVeg: true }, { type: "Dinner", name: "Parotta & Mushroom Masala", isVeg: true }] },
        { day: "Day 4", meals: [{ type: "Breakfast", name: "Rava Upma & Kesari", isVeg: true }, { type: "Lunch", name: "Sambar Rice & Kootu", isVeg: true }, { type: "Dinner", name: "Curd Rice & Pickle", isVeg: true }] },
        { day: "Day 5", meals: [{ type: "Breakfast", name: "Appam & Coconut Milk", isVeg: true }, { type: "Lunch", name: "Lemon Rice & Vadai", isVeg: true }, { type: "Dinner", name: "Paneer Fried Rice & Gobi Manchurian", isVeg: true }] },
        { day: "Day 6", meals: [{ type: "Breakfast", name: "Idiyappam & Kurma", isVeg: true }, { type: "Lunch", name: "Tamarind Rice & Poriyal", isVeg: true }, { type: "Dinner", name: "Dosa & Aloo Masala", isVeg: true }] },
        { day: "Day 7", meals: [{ type: "Breakfast", name: "Medu Vada & Sambar", isVeg: true }, { type: "Lunch", name: "Coconut Rice & Rasam", isVeg: true }, { type: "Dinner", name: "Kothu Parotta (Veg) & Raita", isVeg: true }] }
    ],

    // 🍗 NON-VEG ONLY MENU
    nonVeg: [
        { day: "Day 1", meals: [{ type: "Breakfast", name: "Egg Dosa & Chutney", isVeg: false }, { type: "Lunch", name: "Chicken Biryani & Raita", isVeg: false }, { type: "Dinner", name: "Chicken Chettinad & Rice", isVeg: false }] },
        { day: "Day 2", meals: [{ type: "Breakfast", name: "Omelette & Bread Toast", isVeg: false }, { type: "Lunch", name: "Mutton Biryani & Salna", isVeg: false }, { type: "Dinner", name: "Fish Fry & Kuzhambhu", isVeg: false }] },
        { day: "Day 3", meals: [{ type: "Breakfast", name: "Egg Pongal & Chutney", isVeg: false }, { type: "Lunch", name: "Chicken Fried Rice & Manchurian", isVeg: false }, { type: "Dinner", name: "Mutton Kola Urundai & Parotta", isVeg: false }] },
        { day: "Day 4", meals: [{ type: "Breakfast", name: "Egg Parotta & Salna", isVeg: false }, { type: "Lunch", name: "Prawn Biryani & Raita", isVeg: false }, { type: "Dinner", name: "Chicken Gravy & Chapathi", isVeg: false }] },
        { day: "Day 5", meals: [{ type: "Breakfast", name: "Boiled Eggs & Idli", isVeg: false }, { type: "Lunch", name: "Fish Biryani & Onion Raita", isVeg: false }, { type: "Dinner", name: "Chicken 65 & Naan", isVeg: false }] },
        { day: "Day 6", meals: [{ type: "Breakfast", name: "Egg Kothu Parotta", isVeg: false }, { type: "Lunch", name: "Chicken Kuzhambhu & Rice", isVeg: false }, { type: "Dinner", name: "Mutton Chukka & Parotta", isVeg: false }] },
        { day: "Day 7", meals: [{ type: "Breakfast", name: "Egg Appam & Stew", isVeg: false }, { type: "Lunch", name: "Nattu Kozhi Biryani", isVeg: false }, { type: "Dinner", name: "Fish Curry & Steamed Rice", isVeg: false }] }
    ],

    // 🥗🍗 COMBINED MENU (Mix of both)
    combined: [
        { day: "Day 1", meals: [{ type: "Breakfast", name: "Idli, Sambar & Chutney", isVeg: true }, { type: "Lunch", name: "Chicken Biryani & Raita", isVeg: false }, { type: "Dinner", name: "Chapathi & Paneer Butter Masala", isVeg: true }] },
        { day: "Day 2", meals: [{ type: "Breakfast", name: "Egg Dosa & Chutney", isVeg: false }, { type: "Lunch", name: "Sambar Rice & Poriyal", isVeg: true }, { type: "Dinner", name: "Chicken Chettinad & Rice", isVeg: false }] },
        { day: "Day 3", meals: [{ type: "Breakfast", name: "Pongal & Coconut Chutney", isVeg: true }, { type: "Lunch", name: "Mutton Biryani & Salna", isVeg: false }, { type: "Dinner", name: "Parotta & Veg Kurma", isVeg: true }] },
        { day: "Day 4", meals: [{ type: "Breakfast", name: "Rava Upma & Kesari", isVeg: true }, { type: "Lunch", name: "Fish Fry & Kuzhambhu Rice", isVeg: false }, { type: "Dinner", name: "Dosa & Aloo Masala", isVeg: true }] },
        { day: "Day 5", meals: [{ type: "Breakfast", name: "Egg Parotta & Salna", isVeg: false }, { type: "Lunch", name: "Lemon Rice & Vadai", isVeg: true }, { type: "Dinner", name: "Chicken 65 & Naan", isVeg: false }] },
        { day: "Day 6", meals: [{ type: "Breakfast", name: "Appam & Coconut Milk", isVeg: true }, { type: "Lunch", name: "Prawn Biryani & Raita", isVeg: false }, { type: "Dinner", name: "Kothu Parotta (Veg) & Raita", isVeg: true }] },
        { day: "Day 7", meals: [{ type: "Breakfast", name: "Egg Appam & Stew", isVeg: false }, { type: "Lunch", name: "Coconut Rice & Rasam", isVeg: true }, { type: "Dinner", name: "Nattu Kozhi Varuval & Parotta", isVeg: false }] }
    ]
};

// DOM Element References
const menuContainer = document.getElementById("menu-container");
const plansContainer = document.getElementById("plans-container");
const modal = document.getElementById("booking-modal");
const closeBtn = document.getElementById("close-modal");
const bookingForm = document.getElementById("booking-form");
const planDisplayName = document.getElementById("plan-display-name");
const selectedPlanInput = document.getElementById("selected-plan");
const submitBtn = document.getElementById("submit-btn");
const formMessage = document.getElementById("form-message");

// Render Weekly Menu
function renderMenu(menuType) {
    const selectedData = menus[menuType];
    menuContainer.innerHTML = ''; // Clear out the old cards before drawing new ones

    selectedData.forEach(dayInfo => {
        const card = document.createElement("div");
        card.className = "menu-day-card";

        let mealsHtml = '';
        dayInfo.meals.forEach(meal => {
            const badgeClass = meal.isVeg ? 'veg-badge' : 'non-veg-badge';
            const badgeText = meal.isVeg ? '(Veg)' : '(Non-Veg)';

            mealsHtml += `
                <div class="meal-item">
                    <span class="meal-type">${meal.type}</span>
                    <span class="meal-name">${meal.name} <small class="${badgeClass}">${badgeText}</small></span>
                </div>
            `;
        });

        card.innerHTML = `
            <h3 class="menu-day-title">${dayInfo.day}</h3>
            ${mealsHtml}
        `;
        menuContainer.appendChild(card);
    });
}

// Attach Event Listeners to the Menu Filter Buttons
const filterBtns = document.querySelectorAll('.filter-btn');
filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        // Remove active styling from all buttons
        filterBtns.forEach(b => b.classList.remove('active'));

        // Make the clicked button active
        e.target.classList.add('active');

        // Read the "data-menu" attribute (e.g., 'veg', 'nonVeg', 'combined') and re-render
        renderMenu(e.target.getAttribute('data-menu'));
    });
});

// Function to render plan cards dynamically into the HTML
function renderPlans() {
    plans.forEach(plan => {
        const card = document.createElement("div");
        card.className = "plan-card";
        card.innerHTML = `
            <div class="plan-icon">${plan.icon}</div>
            <h3 class="plan-name">${plan.name}</h3>
            <div class="plan-price">${plan.price}<span>/mo</span></div>
            <p class="plan-desc">${plan.desc}</p>
            <button class="btn btn-primary" onclick="window.openModal('${plan.name}')">Book Now</button>
        `;
        plansContainer.appendChild(card);
    });
}

// Modal Logic
// Attach to window so onclick from HTML can access it (since this is an ES module)
window.openModal = function (planName) {
    planDisplayName.textContent = `Selected Plan: ${planName}`;
    selectedPlanInput.value = planName;
    modal.classList.add("active");

    // Reset Form when opened
    bookingForm.reset();
    formMessage.className = "hidden";
    formMessage.textContent = "";
    submitBtn.disabled = false;
    submitBtn.textContent = "Confirm Booking";
}

function closeModal() {
    modal.classList.remove("active");
}

// Event listeners to close the modal
closeBtn.addEventListener("click", closeModal);
modal.addEventListener("click", (e) => {
    // Check if the actual overlay was clicked
    if (e.target === modal) {
        closeModal();
    }
});

/* 
  ==============================================================
  FORM SUBMISSION & FIREBASE INTEGRATION
  ==============================================================
*/
bookingForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // 1. Get and Validate Data
    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const startDate = document.getElementById("start-date").value;
    const mealPref = document.getElementById("meal-pref").value;
    const planName = selectedPlanInput.value;

    if (!name || !phone || !startDate) {
        showMessage("Please fill out all required fields.", "error");
        return;
    }

    // 2. Prevent Multiple Submissions (Disable Button)
    submitBtn.disabled = true;
    submitBtn.textContent = "Processing...";
    showMessage("", "hidden"); // clear previous message

    // 3. Submit to Firebase Firestore
    try {
        if (!db) {
            throw new Error("Cannot submit. Firebase configuration is missing.");
        }

        // --- Prevent Duplicate Booking ---
        const bookingsRef = collection(db, "bookings");
        const q = query(bookingsRef, where("phone", "==", phone));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            showMessage("A booking already exists for this phone number!", "error");
            submitBtn.disabled = false;
            submitBtn.textContent = "Confirm Booking";
            return;
        }

        // Find the selected plan price to store it
        const selectedPlanObj = plans.find(p => p.name === planName);
        const totalPrice = selectedPlanObj ? selectedPlanObj.price : "N/A";

        // Add a new document to the "bookings" collection
        await addDoc(bookingsRef, {
            name: name,
            phone: phone,
            startDate: startDate,
            mealPreference: mealPref || "No Preference",
            selectedPlan: planName,
            totalPrice: totalPrice,
            timestamp: serverTimestamp(),
            status: "Pending" // useful for an admin panel later
        });

        // 4. Handle Success
        showMessage("Booking Successful! We will contact you soon.", "success");

        // Auto-close modal after successful booking
        setTimeout(() => {
            closeModal();
        }, 3500);

    } catch (error) {
        console.error("Firebase Error:", error);

        // 5. Handle Error
        showMessage(error.message || "Something went wrong. Please try again.", "error");

        // Re-enable the button so the user can fix the issue and retry
        submitBtn.disabled = false;
        submitBtn.textContent = "Confirm Booking";
    }
});

// Helper function to display form status messages
function showMessage(msg, type) {
    if (type === "hidden") {
        formMessage.className = "hidden";
        return;
    }
    formMessage.textContent = msg;
    formMessage.className = type; // 'success' or 'error'
}

// Boot up the application
renderMenu('combined'); // initially load the combined menu
renderPlans();
