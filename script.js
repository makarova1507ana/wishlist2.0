// =========================
// SUPABASE
// =========================

const SUPABASE_URL =
    "https://asjdvimcdgncaowdbgur.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_vkbQgKbMguWGAMqJVjbhZw_sKj9Im-s";


const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


// =========================
// ЭЛЕМЕНТЫ
// =========================

const wishlistContainer =
    document.getElementById("wishlist");

const modal =
    document.getElementById("modal");

const openModalBtn =
    document.getElementById("openModalBtn");

const closeModalBtn =
    document.getElementById("closeModalBtn");

const cancelBtn =
    document.getElementById("cancelBtn");

const form =
    document.getElementById("wishlistForm");

const imageInput =
    document.getElementById("itemImage");

const imagePreview =
    document.getElementById("imagePreview");

const modalTitle =
    document.getElementById("modalTitle");

const userInput =
    document.getElementById("itemUser");
const filterUser =
    document.getElementById("filterUser");

let allItems = [];

let editingId = null;


// =========================
// ОТКРЫТИЕ ДОБАВЛЕНИЯ
// =========================

openModalBtn.addEventListener("click", () => {

    editingId = null;

    modalTitle.textContent =
        "Добавить желание";

    form.reset();

    // Пользователь по умолчанию
    userInput.value = "Настя";

    imagePreview.innerHTML =
        "<span>Здесь появится фотография</span>";

    modal.classList.remove("hidden");

});


// =========================
// ЗАКРЫТИЕ ОКНА
// =========================

function closeModal() {

    modal.classList.add("hidden");

    editingId = null;

    form.reset();

    userInput.value = "Настя";

    imagePreview.innerHTML =
        "<span>Здесь появится фотография</span>";

}


closeModalBtn.addEventListener(
    "click",
    closeModal
);


cancelBtn.addEventListener(
    "click",
    closeModal
);


// Закрытие при клике вне окна

modal.addEventListener("click", (event) => {

    if (event.target === modal) {
        closeModal();
    }

});


// =========================
// ПРЕДПРОСМОТР ФОТО
// =========================

imageInput.addEventListener("input", () => {

    const imageUrl =
        imageInput.value.trim();


    if (!imageUrl) {

        imagePreview.innerHTML =
            "<span>Здесь появится фотография</span>";

        return;

    }


    imagePreview.innerHTML = `
        <img
            src="${escapeAttribute(imageUrl)}"
            alt="Предпросмотр"
            onerror="imageError(this)"
        >
    `;

});


// Если картинка не загрузилась

function imageError(image) {

    image.style.display = "none";

    image.parentElement.innerHTML = `
        <span>
            Не удалось загрузить фотографию
        </span>
    `;

}


// =========================
// ЗАГРУЗКА WISHLIST
// =========================
function applyFilter() {
    const selectedUser =
        filterUser.value;

    if (selectedUser === "all") {
        renderWishlist(allItems);
        return;
    }

    const filteredItems =
        allItems.filter(
            (item) =>
                (item.user_name || "Настя")
                === selectedUser
        );

    renderWishlist(filteredItems);
}
async function loadWishlist() {

    wishlistContainer.innerHTML = `
        <p>Загрузка...</p>
    `;


    const { data, error } =
        await supabaseClient
            .from("wishlist")
            .select("*")
            .order("created_at", {
                ascending: false
            });


    if (error) {

        console.error(
            "Ошибка загрузки:",
            error
        );

        wishlistContainer.innerHTML = `
            <p>
                Не удалось загрузить Wishlist.
            </p>
        `;

        return;
    }


    allItems = data || [];

applyFilter();

}


// =========================
// СОХРАНЕНИЕ ФОРМЫ
// =========================

form.addEventListener("submit", async (event) => {

    event.preventDefault();


    const name =
        document
            .getElementById("itemName")
            .value
            .trim();


    const description =
        document
            .getElementById("itemDescription")
            .value
            .trim();


    const link =
        document
            .getElementById("itemLink")
            .value
            .trim();


    const image =
        imageInput.value.trim();


    const userName =
        userInput.value;


    // =========================
    // РЕДАКТИРОВАНИЕ
    // =========================

    if (editingId !== null) {

        const { error } =
            await supabaseClient
                .from("wishlist")
                .update({
                    name: name,
                    user_name: userName,
                    description: description,
                    link: link,
                    image: image
                })
                .eq("id", editingId);


        if (error) {

            console.error(
                "Ошибка редактирования:",
                error
            );

            alert(
                "Не удалось сохранить изменения."
            );

            return;
        }


        await loadWishlist();

        closeModal();

        return;
    }


    // =========================
    // ДОБАВЛЕНИЕ
    // =========================

    const { error } =
        await supabaseClient
            .from("wishlist")
            .insert({
                name: name,
                user_name: userName,
                description: description,
                link: link,
                image: image
            });


    if (error) {

        console.error(
            "Ошибка добавления:",
            error
        );

        alert(
            "Не удалось добавить желание."
        );

        return;
    }


    await loadWishlist();

    closeModal();

});


// =========================
// РЕДАКТИРОВАНИЕ
// =========================

async function editItem(id) {

    const { data: item, error } =
        await supabaseClient
            .from("wishlist")
            .select("*")
            .eq("id", id)
            .single();


    if (error || !item) {

        console.error(
            "Ошибка получения элемента:",
            error
        );

        return;
    }


    editingId = id;


    modalTitle.textContent =
        "Редактировать желание";


    document.getElementById(
        "itemName"
    ).value =
        item.name || "";


    document.getElementById(
        "itemDescription"
    ).value =
        item.description || "";


    document.getElementById(
        "itemLink"
    ).value =
        item.link || "";


    imageInput.value =
        item.image || "";


    userInput.value =
        item.user_name || "Настя";


    // Показываем текущую фотографию

    if (item.image) {

        imagePreview.innerHTML = `
            <img
                src="${escapeAttribute(item.image)}"
                alt="${escapeAttribute(item.name || "")}"
                onerror="imageError(this)"
            >
        `;

    } else {

        imagePreview.innerHTML =
            "<span>Здесь появится фотография</span>";

    }


    modal.classList.remove("hidden");

}


// =========================
// УДАЛЕНИЕ
// =========================

async function deleteItem(id) {

    const confirmed =
        confirm(
            "Удалить это желание?"
        );


    if (!confirmed) {
        return;
    }


    const { error } =
        await supabaseClient
            .from("wishlist")
            .delete()
            .eq("id", id);


    if (error) {

        console.error(
            "Ошибка удаления:",
            error
        );

        alert(
            "Не удалось удалить желание."
        );

        return;
    }


    await loadWishlist();

}


// =========================
// ПОЛНОЕ ОПИСАНИЕ
// =========================

function openDescription(
    id,
    name,
    description,
    userName,
    image
) {
    const descriptionModal =
        document.createElement("div");

    descriptionModal.className =
        "description-modal";

    const imageHTML = image
        ? `
            <div class="description-image">
                <img
                    src="${escapeAttribute(image)}"
                    alt="${escapeAttribute(name || "")}"
                    onerror="imageError(this)"
                >
            </div>
        `
        : "";

    descriptionModal.innerHTML = `
        <div class="description-modal-content">

            <button
                class="description-close"
                onclick="
                    this
                        .closest('.description-modal')
                        .remove()
                "
            >
                ×
            </button>

            ${imageHTML}

            <h2>
                ${escapeHTML(name)}
            </h2>

            <div class="description-user">
                Добавила: ${escapeHTML(userName || "")}
            </div>

            <p>
                ${
                    escapeHTML(
                        description ||
                        "Описание отсутствует"
                    )
                }
            </p>

        </div>
    `;

    document.body.appendChild(
        descriptionModal
    );

    descriptionModal.addEventListener(
        "click",
        (event) => {
            if (
                event.target ===
                descriptionModal
            ) {
                descriptionModal.remove();
            }
        }
    );
}

// =========================
// СОКРАЩЕНИЕ ТЕКСТА
// =========================

function shortenDescription(
    text,
    maxLength = 50
) {

    if (!text) {
        return "";
    }


    if (text.length <= maxLength) {
        return text;
    }


    const shortened =
        text.slice(0, maxLength);


    const lastSpace =
        shortened.lastIndexOf(" ");


    if (lastSpace === -1) {
        return shortened + "...";
    }


    return (
        shortened.slice(0, lastSpace)
        + "..."
    );

}


// =========================
// ОТОБРАЖЕНИЕ КАРТОЧЕК
// =========================

function renderWishlist(items) {

    wishlistContainer.innerHTML = "";


    items.forEach((item) => {

        const card =
            document.createElement("article");


        card.className =
            "card";


        const imageHTML =
            item.image

                ? `
                    <img
                        src="${escapeAttribute(item.image)}"
                        alt="${escapeAttribute(item.name || "")}"
                        onerror="imageError(this)"
                    >
                `

                : `
                    <span class="no-image">
                        Нет фотографии
                    </span>
                `;


        const linkHTML =
            item.link

                ? `
                    <a
                        class="view-link"
                        href="${escapeAttribute(item.link)}"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Открыть ↗
                    </a>
                `

                : "";


        const shortName =
            shortenDescription(
                item.name || "",
                50
            );


        const shortDescription =
            shortenDescription(
                item.description || "",
                50
            );


        const userName =
            item.user_name || "Настя";


        card.innerHTML = `

            <div class="card-buttons">

                <button
                    class="card-button edit-button"
                    onclick="editItem('${escapeAttribute(item.id)}')"
                    title="Редактировать"
                >
                    ✎
                </button>


                <button
                    class="card-button delete-button"
                    onclick="deleteItem('${escapeAttribute(item.id)}')"
                    title="Удалить"
                >
                    ×
                </button>

            </div>


            <div class="photo-frame">

                ${imageHTML}

            </div>


            <div class="card-content">

                <h3
                    class="card-title"
                    onclick="
                    openDescription(
    '${escapeAttribute(item.id)}',
    '${escapeAttribute(item.name || "")}',
    '${escapeAttribute(item.description || "")}',
    '${escapeAttribute(userName)}',
    '${escapeAttribute(item.image || "")}'
)
                    "
                >
                    ${escapeHTML(shortName)}
                </h3>


                <div class="card-user">
                    ${escapeHTML(userName)}
                </div>


                <p
                    class="card-description"
                    onclick="
                  openDescription(
    '${escapeAttribute(item.id)}',
    '${escapeAttribute(item.name || "")}',
    '${escapeAttribute(item.description || "")}',
    '${escapeAttribute(userName)}',
    '${escapeAttribute(item.image || "")}'
)
                    "
                >
                    ${escapeHTML(shortDescription)}
                </p>


                <div class="card-footer">

                    ${linkHTML}

                </div>

            </div>

        `;


        wishlistContainer.appendChild(
            card
        );

    });

}


// =========================
// ЗАЩИТА HTML
// =========================

function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent =
        text;

    return div.innerHTML;

}


// =========================
// ЗАЩИТА ATTRIBUTE
// =========================

function escapeAttribute(text) {

    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

}


// =========================
// ЗАПУСК
// =========================
filterUser.addEventListener(
    "change",
    applyFilter
);
loadWishlist();
