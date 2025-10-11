function toggleMenu() {
    const menu = document.getElementById("mobileMenu");
    const menuOverlay = document.getElementById("menuOverlay");
    menu.classList.toggle("show");
    menuOverlay.classList.toggle("active");
}

function closeMenu() {
    const menu = document.getElementById("mobileMenu");
    const menuOverlay = document.getElementById("menuOverlay");
    menu.classList.remove("show");
    menuOverlay.classList.remove("active");
}

function openHistoryPopup(event) {
    event.preventDefault();
    const popup = document.getElementById("historyPopup");
    const overlay = document.getElementById("overlay");
    popup.classList.add("active");
    overlay.classList.add("active");
    closeMenu();
}

function closeHistoryPopup() {
    const popup = document.getElementById("historyPopup");
    const overlay = document.getElementById("overlay");
    popup.classList.remove("active");
    overlay.classList.remove("active");
}

function openRightPanel(event) {
    event.preventDefault();
    const popup = document.getElementById("rightPanel");
    const overlay = document.getElementById("overlay");
    popup.classList.add("active");
    overlay.classList.add("active");
    closeMenu();
}

function closeRightPanel() {
    const popup = document.getElementById("rightPanel");
    const overlay = document.getElementById("overlay");
    popup.classList.remove("active");
    overlay.classList.remove("active");
}

function closeAllPopups() {
    closeHistoryPopup();
    closeRightPanel();
}

const textarea = document.getElementById("userInput");
if (textarea) {
    textarea.addEventListener("input", function () {
        this.style.height = "auto";
        this.style.height = this.scrollHeight + "px";
    });
}
