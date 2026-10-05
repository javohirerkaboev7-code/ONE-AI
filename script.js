// =====================================================
// ONE AI
// Gemini API
// =====================================================

// 1. GOOGLE AI STUDIO'DAN OLINGAN API KEYINGNI SHU YERGA QO'Y
const API_KEY = "AQ.Ab8RN6L7UWATIK7gr6PWL8q-DE4l80D5g-KhXoBQy48fy1ly0w";

// 2. MODEL
const MODEL = "gemini-3.8-flash";


// =====================================================
// ELEMENTS
// =====================================================

const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const imageBtn = document.getElementById("imageBtn");
const imageInput = document.getElementById("imageInput");

const chat = document.getElementById("chat");
const welcome = document.getElementById("welcome");

const imagePreview = document.getElementById("imagePreview");
const previewImg = document.getElementById("previewImg");
const removeImage = document.getElementById("removeImage");

const newChat = document.getElementById("newChat");
const clearBtn = document.getElementById("clearBtn");
const themeBtn = document.getElementById("themeBtn");

const history = document.getElementById("history");

const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");


// =====================================================
// STATE
// =====================================================

let messages = [];

let selectedImage = null;

let chats = JSON.parse(
    localStorage.getItem("oneAI_chats") || "[]"
);


// =====================================================
// IMAGE
// =====================================================

imageBtn.addEventListener("click", () => {
    imageInput.click();
});


imageInput.addEventListener("change", () => {

    const file = imageInput.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {

        alert("Faqat rasm tanlang.");

        return;
    }

    selectedImage = file;

    const reader = new FileReader();

    reader.onload = () => {

        previewImg.src = reader.result;

        imagePreview.classList.remove("hidden");

    };

    reader.readAsDataURL(file);
});


removeImage.addEventListener("click", () => {

    selectedImage = null;

    imageInput.value = "";

    imagePreview.classList.add("hidden");

    previewImg.src = "";

});


// =====================================================
// TEXTAREA
// =====================================================

messageInput.addEventListener("input", () => {

    messageInput.style.height = "auto";

    messageInput.style.height =
        Math.min(messageInput.scrollHeight, 180) + "px";
});


messageInput.addEventListener("keydown", (e) => {

    if (e.key === "Enter" && !e.shiftKey) {

        e.preventDefault();

        sendMessage();
    }

});


// =====================================================
// SEND BUTTON
// =====================================================

sendBtn.addEventListener("click", sendMessage);


// =====================================================
// SEND MESSAGE
// =====================================================

async function sendMessage() {

    const text = messageInput.value.trim();

    if (!text && !selectedImage) return;

    if (
        !API_KEY ||
        API_KEY === "YOUR_GEMINI_API_KEY"
    ) {

        addMessage(
            "assistant",
            "⚠️ Gemini API key topilmadi. `script.js` ichidagi `YOUR_GEMINI_API_KEY` o‘rniga Google AI Studio API key'ingni qo‘y."
        );

        return;
    }


    // UI
    welcome.style.display = "none";

    chat.classList.add("active");

    sendBtn.disabled = true;


    // USER MESSAGE
    let imageData = null;

    if (selectedImage) {

        imageData = await fileToBase64(selectedImage);

    }


    addMessage(
        "user",
        text || "Rasmni tahlil qil.",
        imageData
    );


    // Save history
    if (text) {

        saveChatTitle(text);

    }


    // Loading
    const loading = addLoading();


    try {

        const result = await askGemini(
            text || "Ushbu rasmni tahlil qil.",
            imageData
        );


        loading.remove();

        addMessage(
            "assistant",
            result
        );


    } catch (error) {

        loading.remove();

        console.error(error);

        addMessage(
            "assistant",
            "❌ Xatolik yuz berdi:\n\n" +
            getErrorMessage(error)
        );

    }


    // reset
    messageInput.value = "";

    messageInput.style.height = "auto";

    selectedImage = null;

    imageInput.value = "";

    imagePreview.classList.add("hidden");

    previewImg.src = "";

    sendBtn.disabled = false;

    messageInput.focus();
}


// =====================================================
// GEMINI API
// =====================================================

async function askGemini(text, imageData) {

    const url =
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;


    const parts = [

        {
            text:
                `You are ONE AI, a helpful, intelligent and friendly AI assistant.

Answer the user clearly and naturally.

If the user writes Uzbek, answer in Uzbek.
If the user writes Russian, answer in Russian.
If the user writes English, answer in English.

For programming questions, provide clean code and explain it simply.

User message:
${text}`
        }

    ];


    // IMAGE
    if (imageData) {

        parts.push({

            inline_data: {

                mime_type: imageData.mimeType,

                data: imageData.base64

            }

        });

    }


    const body = {

        contents: [

            {
                role: "user",
                parts: parts
            }

        ],

        generationConfig: {

            temperature: 0.7,

            maxOutputTokens: 4096

        }

    };


    const response = await fetch(
        url,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(body)
        }
    );


    const data = await response.json();


    if (!response.ok) {

        throw new Error(
            data?.error?.message ||
            "Gemini API xatosi."
        );

    }


    const answer =
        data?.candidates?.[0]?.content?.parts
            ?.map(part => part.text || "")
            .join("")
            .trim();


    if (!answer) {

        throw new Error(
            "AI javob qaytarmadi."
        );

    }


    return answer;
}


// =====================================================
// FILE → BASE64
// =====================================================

function fileToBase64(file) {

    return new Promise((resolve, reject) => {

        const reader = new FileReader();

        reader.onload = () => {

            const result = reader.result;

            const base64 =
                result.split(",")[1];

            resolve({

                base64: base64,

                mimeType: file.type

            });

        };

        reader.onerror = reject;

        reader.readAsDataURL(file);

    });

}


// =====================================================
// ADD MESSAGE
// =====================================================

function addMessage(type, text, imageData = null) {

    const message = document.createElement("div");

    message.className =
        `message ${type}`;


    const avatar = document.createElement("div");

    avatar.className = "avatar";

    avatar.textContent =
        type === "user" ? "You" : "✦";


    const content = document.createElement("div");

    content.className = "content";


    if (imageData) {

        const img = document.createElement("img");

        img.src =
            `data:${imageData.mimeType};base64,${imageData.base64}`;

        img.className = "user-image";

        content.appendChild(img);

    }


    if (text) {

        const textDiv =
            document.createElement("div");

        textDiv.innerHTML =
            formatText(text);

        content.appendChild(textDiv);

    }


    message.appendChild(avatar);

    message.appendChild(content);

    chat.appendChild(message);


    chat.scrollTop =
        chat.scrollHeight;

}


// =====================================================
// FORMAT TEXT
// =====================================================

function formatText(text) {

    let safe =
        escapeHTML(text);


    // code blocks
    safe = safe.replace(
        /```([\s\S]*?)```/g,
        "<pre><code>$1</code></pre>"
    );


    // bold
    safe = safe.replace(
        /\*\*(.*?)\*\*/g,
        "<strong>$1</strong>"
    );


    // line breaks
    safe = safe.replace(
        /\n/g,
        "<br>"
    );


    return safe;
}


function escapeHTML(text) {

    return text
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// =====================================================
// LOADING
// =====================================================

function addLoading() {

    const message =
        document.createElement("div");

    message.className =
        "message assistant";


    message.innerHTML = `

        <div class="avatar">✦</div>

        <div class="content">

            <div class="loading">

                <span></span>
                <span></span>
                <span></span>

            </div>

        </div>

    `;


    chat.appendChild(message);

    chat.scrollTop =
        chat.scrollHeight;


    return message;
}


// =====================================================
// NEW CHAT
// =====================================================

newChat.addEventListener("click", () => {

    messages = [];

    chat.innerHTML = "";

    chat.classList.remove("active");

    welcome.style.display = "flex";

    messageInput.value = "";

    selectedImage = null;

    imagePreview.classList.add("hidden");

    sidebar.classList.remove("open");

});


// =====================================================
// CLEAR CHATS
// =====================================================

clearBtn.addEventListener("click", () => {

    if (
        !confirm("Barcha chatlarni o‘chirishni xohlaysizmi?")
    ) return;

    chats = [];

    localStorage.removeItem("oneAI_chats");

    renderHistory();

});


// =====================================================
// SAVE CHAT
// =====================================================

function saveChatTitle(text) {

    const title =
        text.length > 35
            ? text.substring(0, 35) + "..."
            : text;


    chats.unshift({

        title: title,

        date: Date.now()

    });


    chats =
        chats.slice(0, 30);


    localStorage.setItem(
        "oneAI_chats",
        JSON.stringify(chats)
    );


    renderHistory();
}


// =====================================================
// HISTORY
// =====================================================

function renderHistory() {

    history.innerHTML = "";


    chats.forEach(item => {

        const div =
            document.createElement("div");

        div.className =
            "history-item";

        div.textContent =
            "💬 " + item.title;


        history.appendChild(div);

    });

}


renderHistory();


// =====================================================
// DARK MODE
// =====================================================

themeBtn.addEventListener("click", () => {

    document.body.classList.toggle("dark");

    const dark =
        document.body.classList.contains("dark");


    localStorage.setItem(
        "oneAI_dark",
        dark ? "1" : "0"
    );

});


if (
    localStorage.getItem("oneAI_dark") === "1"
) {

    document.body.classList.add("dark");

}


// =====================================================
// MOBILE MENU
// =====================================================

menuBtn.addEventListener("click", () => {

    sidebar.classList.toggle("open");

});


// =====================================================
// SUGGESTIONS
// =====================================================

document.querySelectorAll(".suggestion")
.forEach(button => {

    button.addEventListener("click", () => {

        messageInput.value =
            button.textContent
                .replace(/^[^\w]+/, "")
                .trim();

        messageInput.focus();

    });

});


// =====================================================
// ERROR MESSAGE
// =====================================================

function getErrorMessage(error) {

    const msg =
        error?.message || "";


    if (
        msg.toLowerCase().includes("api key")
    ) {

        return "API key noto‘g‘ri yoki topilmadi.";

    }


    if (
        msg.toLowerCase().includes("quota")
    ) {

        return "API limitiga yetildi.";

    }


    if (
        msg.toLowerCase().includes("not found")
    ) {

        return "Model topilmadi. MODEL nomini tekshiring.";

    }


    return msg ||
        "Noma'lum xatolik.";
}