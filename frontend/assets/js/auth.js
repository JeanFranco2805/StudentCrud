const API_URL = "http://localhost:8000";

let pendingEmail = "";

if (localStorage.getItem("token")) {
    window.location.href = "dashboard.html";
}

document.addEventListener("DOMContentLoaded", () => {
    bindEmailForm();
    bindOTPForm();
    bindBackBtn();
    bindResendBtn();
});

function bindEmailForm() {
    const emailInput = document.getElementById("email-input");
    const emailBtn = document.getElementById("email-btn");

    emailInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") emailBtn.click();
    });

    emailBtn.addEventListener("click", async () => {
        const email = emailInput.value.trim();
        if (!email || !email.includes("@")) {
            emailInput.classList.add("error");
            emailInput.focus();
            return;
        }
        emailInput.classList.remove("error");

        setLoading(emailBtn, true, "Enviando...");

        try {
            const res = await fetch(`${API_URL}/auth/request-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "Error al enviar código");

            pendingEmail = email;

            if (data.dev_otp) {
                document.getElementById("dev-otp-value").textContent = data.dev_otp;
                document.getElementById("dev-otp-notice").style.display = "block";
            }

            showOTPStep(email);
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            setLoading(emailBtn, false, "Enviar código de verificación");
        }
    });
}

function bindOTPForm() {
    const otpBtn = document.getElementById("otp-btn");
    otpBtn.addEventListener("click", verifyOTP);
}

function bindBackBtn() {
    document.getElementById("back-btn").addEventListener("click", () => {
        showEmailStep();
    });
}

function bindResendBtn() {
    document.getElementById("resend-btn").addEventListener("click", async () => {
        if (!pendingEmail) return;

        showToast("Reenviando código...", "info");

        try {
            const res = await fetch(`${API_URL}/auth/request-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: pendingEmail }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "Error al reenviar");

            if (data.dev_otp) {
                document.getElementById("dev-otp-value").textContent = data.dev_otp;
                document.getElementById("dev-otp-notice").style.display = "block";
            }

            clearOTPInputs();
            showToast("Código reenviado", "success");
        } catch (err) {
            showToast(err.message, "error");
        }
    });
}

function showOTPStep(email) {
    document.getElementById("step-indicator-2").classList.add("done");
    document.getElementById("otp-email-display").textContent = email;

    document.getElementById("card-header").querySelector("h2").textContent = "Verifica tu correo";
    document.getElementById("card-header").querySelector("p").textContent = "Ingresa el código de 6 dígitos que enviamos.";

    document.getElementById("step-email").classList.remove("active");
    document.getElementById("step-otp").classList.add("active");

    setupOTPInputs();
}

function showEmailStep() {
    document.getElementById("step-indicator-2").classList.remove("done");
    document.getElementById("card-header").querySelector("h2").textContent = "Bienvenido";
    document.getElementById("card-header").querySelector("p").textContent = "Ingresa tu correo para recibir el código de verificación.";

    document.getElementById("step-otp").classList.remove("active");
    document.getElementById("step-email").classList.add("active");
    document.getElementById("dev-otp-notice").style.display = "none";
    document.getElementById("email-input").focus();
}

function setupOTPInputs() {
    const inputs = document.querySelectorAll(".otp-input");
    const otpBtn = document.getElementById("otp-btn");

    inputs.forEach((input, index) => {
        input.value = "";
        input.classList.remove("filled", "error");

        input.addEventListener("input", (e) => {
            const val = e.target.value.replace(/\D/g, "").slice(0, 1);
            input.value = val;

            if (val) {
                input.classList.add("filled");
                if (index < inputs.length - 1) inputs[index + 1].focus();
            } else {
                input.classList.remove("filled");
            }

            updateOTPButton(inputs, otpBtn);
        });

        input.addEventListener("keydown", (e) => {
            if (e.key === "Backspace") {
                if (!input.value && index > 0) {
                    inputs[index - 1].value = "";
                    inputs[index - 1].classList.remove("filled");
                    inputs[index - 1].focus();
                    updateOTPButton(inputs, otpBtn);
                }
            }
            if (e.key === "Enter") {
                const allFilled = [...inputs].every((i) => i.value.length === 1);
                if (allFilled) otpBtn.click();
            }
        });

        input.addEventListener("paste", (e) => {
            e.preventDefault();
            const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
            pasted.split("").forEach((char, i) => {
                if (inputs[i]) {
                    inputs[i].value = char;
                    inputs[i].classList.add("filled");
                }
            });
            updateOTPButton(inputs, otpBtn);
            const next = Math.min(pasted.length, inputs.length - 1);
            inputs[next].focus();
        });
    });

    setTimeout(() => inputs[0].focus(), 100);
}

function updateOTPButton(inputs, btn) {
    const allFilled = [...inputs].every((i) => i.value.length === 1);
    btn.disabled = !allFilled;
}

function getOTPValue() {
    return [...document.querySelectorAll(".otp-input")].map((i) => i.value).join("");
}

function clearOTPInputs() {
    document.querySelectorAll(".otp-input").forEach((i) => {
        i.value = "";
        i.classList.remove("filled", "error");
    });
    document.getElementById("otp-btn").disabled = true;
    document.querySelectorAll(".otp-input")[0].focus();
}

async function verifyOTP() {
    const code = getOTPValue();
    if (code.length !== 6) return;

    const otpBtn = document.getElementById("otp-btn");
    setLoading(otpBtn, true, "Verificando...");

    try {
        const res = await fetch(`${API_URL}/auth/verify-otp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: pendingEmail, code }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Código inválido");

        localStorage.setItem("token", data.access_token);
        localStorage.setItem("userEmail", pendingEmail);
        showToast("Acceso concedido", "success");
        setTimeout(() => (window.location.href = "dashboard.html"), 600);
    } catch (err) {
        document.querySelectorAll(".otp-input").forEach((i) => i.classList.add("error"));
        setTimeout(() => {
            document.querySelectorAll(".otp-input").forEach((i) => i.classList.remove("error"));
        }, 700);
        showToast(err.message, "error");
        setLoading(otpBtn, false, "Verificar código");
    }
}

function setLoading(btn, loading, label) {
    if (loading) {
        btn.dataset.originalText = btn.innerHTML;
        btn.innerHTML = `<span class="spinner"></span> ${label}`;
        btn.disabled = true;
    } else {
        btn.innerHTML = label || btn.dataset.originalText || "Enviar";
        btn.disabled = false;
    }
}

function showToast(message, type = "info", duration = 3500) {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span class="toast-dot"></span>${message}`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add("leaving");
        toast.addEventListener("animationend", () => toast.remove());
    }, duration);
}
