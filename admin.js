// Import Firebase SDK functions (same modular v10 approach as main site)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

/* 
  ==============================================================
  FIREBASE CONFIGURATION (same as script.js)
  ==============================================================
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

let db;
try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
} catch (error) {
    console.error("Firebase init error:", error);
}

/* 
  ==============================================================
  ADMIN PASSWORD  
  ==============================================================
*/
const ADMIN_PASSWORD = "Admin123";

/* 
  ==============================================================
  DOM REFERENCES
  ==============================================================
*/
const loginGate = document.getElementById("login-gate");
const loginForm = document.getElementById("login-form");
const passwordInput = document.getElementById("admin-password");
const loginError = document.getElementById("login-error");
const dashboard = document.getElementById("admin-dashboard");
const logoutBtn = document.getElementById("logout-btn");
const bookingsBody = document.getElementById("bookings-body");
const loadingState = document.getElementById("loading-state");
const emptyState = document.getElementById("empty-state");
const searchInput = document.getElementById("search-input");
const filterPlan = document.getElementById("filter-plan");

// Stat elements
const statTotal = document.getElementById("stat-total");
const statBasic = document.getElementById("stat-basic");
const statHealthy = document.getElementById("stat-healthy");
const statChoice = document.getElementById("stat-choice");

// In-memory bookings store
let allBookings = [];

/* 
  ==============================================================
  LOGIN / LOGOUT LOGIC
  ==============================================================
*/
// Check if admin already authenticated in this session
if (sessionStorage.getItem("mealplan_admin_auth") === "true") {
    showDashboard();
}

loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const entered = passwordInput.value;

    if (entered === ADMIN_PASSWORD) {
        sessionStorage.setItem("mealplan_admin_auth", "true");
        loginError.classList.add("hidden");
        showDashboard();
    } else {
        loginError.textContent = "Incorrect password. Try again.";
        loginError.classList.remove("hidden");
        passwordInput.value = "";
        passwordInput.focus();
    }
});

logoutBtn.addEventListener("click", () => {
    sessionStorage.removeItem("mealplan_admin_auth");
    dashboard.classList.add("hidden");
    loginGate.classList.remove("hidden");
    passwordInput.value = "";
});

function showDashboard() {
    loginGate.classList.add("hidden");
    dashboard.classList.remove("hidden");
    fetchBookings();
}

/* 
  ==============================================================
  FETCH & RENDER BOOKINGS
  ==============================================================
*/
async function fetchBookings() {
    loadingState.classList.remove("hidden");
    emptyState.classList.add("hidden");
    bookingsBody.innerHTML = "";

    try {
        if (!db) throw new Error("Firebase not configured.");

        const bookingsRef = collection(db, "bookings");
        const q = query(bookingsRef, orderBy("timestamp", "desc"));
        const snapshot = await getDocs(q);

        allBookings = [];
        snapshot.forEach((doc) => {
            allBookings.push({ id: doc.id, ...doc.data() });
        });

        loadingState.classList.add("hidden");
        updateStats();
        renderBookings(allBookings);

    } catch (err) {
        console.error("Error fetching bookings:", err);
        loadingState.classList.add("hidden");
        emptyState.querySelector("p").textContent = "Error loading bookings. Check console.";
        emptyState.classList.remove("hidden");
    }
}

function updateStats() {
    statTotal.textContent = allBookings.length;
    statBasic.textContent = allBookings.filter(b => b.selectedPlan === "Basic Plan").length;
    statHealthy.textContent = allBookings.filter(b => b.selectedPlan === "Healthy Plan").length;
    statChoice.textContent = allBookings.filter(b => b.selectedPlan === "Choice Plan").length;
}

function renderBookings(bookings) {
    bookingsBody.innerHTML = "";

    if (bookings.length === 0) {
        emptyState.classList.remove("hidden");
        return;
    }

    emptyState.classList.add("hidden");

    bookings.forEach((b, i) => {
        const row = document.createElement("tr");
        row.style.animationDelay = `${i * 0.04}s`;

        // Format the timestamp
        let bookedOn = "—";
        if (b.timestamp) {
            const d = b.timestamp.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
            bookedOn = d.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric"
            }) + ", " + d.toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit"
            });
        }

        // Status badge class
        const statusClass = (b.status || "pending").toLowerCase();

        row.innerHTML = `
            <td>${i + 1}</td>
            <td><strong>${escapeHtml(b.name || "—")}</strong></td>
            <td>${escapeHtml(b.phone || "—")}</td>
            <td>${escapeHtml(b.selectedPlan || "—")}</td>
            <td>${escapeHtml(b.totalPrice || "—")}</td>
            <td>${escapeHtml(b.mealPreference || "—")}</td>
            <td>${escapeHtml(b.startDate || "—")}</td>
            <td><span class="status-badge ${statusClass}">${escapeHtml(b.status || "Pending")}</span></td>
            <td>${bookedOn}</td>
        `;

        bookingsBody.appendChild(row);
    });
}

/* 
  ==============================================================
  SEARCH & FILTER
  ==============================================================
*/
searchInput.addEventListener("input", applyFilters);
filterPlan.addEventListener("change", applyFilters);

function applyFilters() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const planFilter = filterPlan.value;

    let filtered = allBookings;

    // Filter by plan
    if (planFilter !== "all") {
        filtered = filtered.filter(b => b.selectedPlan === planFilter);
    }

    // Search across name, phone, plan
    if (searchTerm) {
        filtered = filtered.filter(b => {
            const name = (b.name || "").toLowerCase();
            const phone = (b.phone || "").toLowerCase();
            const plan = (b.selectedPlan || "").toLowerCase();
            const pref = (b.mealPreference || "").toLowerCase();
            return name.includes(searchTerm) || phone.includes(searchTerm) || plan.includes(searchTerm) || pref.includes(searchTerm);
        });
    }

    renderBookings(filtered);
}

/* 
  ==============================================================
  UTILITY
  ==============================================================
*/
function escapeHtml(str) {
    const div = document.createElement("div");
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}
