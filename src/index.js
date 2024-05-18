const API_URL = 'https://statuesque-fast-floor.glitch.me';

const buttons = document.querySelectorAll(".store__category-button");
const productList = document.querySelector(".store__list");
const cartButton = document.querySelector(".store__cart-button");
const cartCount = cartButton.querySelector(".store__cart-cnt");
const modalOverlay = document.querySelector(".modal-overlay");
const cartItemsList = document.querySelector(".modal__cart-items");
const modalCloseButton = document.querySelector(".modal-overlay_close-button");
const cartTotalPriceElement = document.querySelector (".modal__cart-price");
const cartForm = document.querySelector(".modal__cart-form");


const orderMessageElement = document.createElement("div");
orderMessageElement.classList.add("order-message");

const orderMessageText = document.createElement("p");
orderMessageText.classList.add("order-message__text");

const orderMessageCloseButton = document.createElement("button");
orderMessageCloseButton.classList.add("order-message__close-button");
orderMessageCloseButton.textContent = "Закрыть";

orderMessageElement.append(orderMessageText, orderMessageCloseButton);

orderMessageCloseButton.addEventListener("click", () => {
    orderMessageElement.remove();
});


const createProductCard = ({ id, photoUrl, name, price }) => {
    const productCard = document.createElement('li');
    productCard.classList.add('store__item');
    productCard.innerHTML = `
    <article class="store__product product">
        <img class="product__image" src="${API_URL}${photoUrl}" alt="${name}" width="388" height="261">

        <h3 class="product__title">${name}</h3>

        <p class="product__price">${price}&nbsp;₽</p>

        <button class="product_btn-add-cart" data-id="${id}">Заказать</button>
    </article>    
    `;
    
    return productCard;
};

const renderProducts = (products) => {
    productList.textContent = "";
    products.forEach(product => {
        const productCard = createProductCard(product);

        productList.append(productCard);
    });
};

const fetchProductByCategory = async (category) => {
    try {
        const response = await fetch(`${API_URL}/api/products/category/${category}`)

        if (!response.ok) {
            throw new Error(response.status);
        }

        const products = await response.json();

        renderProducts(products);

    } catch (error) {
        console.error(`Ошибка запроса товаров: ${error}`);
    }
};

const fetchCartItems = async (ids) => {
    try {
        const response = await fetch(
            `${API_URL}/api/products/list/${ids.join(",")}`,
    );

    if (!response.ok) {
        throw new Error (response.status)
    }

    return await response.json()
    } catch (error) {
        console.error(`Ошибка запроса товаров для корзины: ${error}`);
        return [];
    }
};


const changeCategory = ({target}) => {
    const category = target.textContent;

    buttons.forEach((button) => {
        button.classList.remove("store__category-button_active");
    });

    target.classList.add("store__category-button_active");
    fetchProductByCategory(category);
};

buttons.forEach((button) => {
button.addEventListener("click", changeCategory);
if (button.classList.contains("store__category-button_active")) {
    fetchProductByCategory(button.textContent);
}
});

const calculateTotalPrice = (cartItems, products) => cartItems.reduce((acc, item) => {
    const product = products.find(prod => prod.id === item.id);
    return acc + product.price * item.count;
}, 0);

// модальное окно
const renderCartItems = async () => {
    cartItemsList.textContent = "";
    const cartItems = JSON.parse(localStorage.getItem("cartItems") || "[]");
    const products = JSON.parse(localStorage.getItem("cartProductDetails") || "[]");

    products.forEach(({id, photoUrl, name, price}) => {
        const cartItem = cartItems.find(item => item.id === id)
        if (!cartItem) {
            return;
        }

        const listItem = document.createElement("li");
        listItem.classList.add("modal__cart-item");
        listItem.innerHTML = `
            <img class="modal__cart-item-image" src="${API_URL}${photoUrl}" alt="${name}">

            <h3 class="modal__cart-item-title">${name}</h3>

            <div class="modal__cart-item-count">
                <button class="modal__btn modal__minus" data-id=${id}>-</button>
                <span class="modal__count">${cartItem.count}</span>
                <button class="modal__btn modal__plus" data-id=${id}>+</button>
            </div>

            <p class="modal__cart-item-price">${price * cartItem.count}&nbsp;₽</p>
        `;

        cartItemsList.append(listItem);
    });

    const TotalPrice = calculateTotalPrice(cartItems, products);
    cartTotalPriceElement.innerHTML = `${TotalPrice}&nbsp;₽`;
    
};

cartButton.addEventListener("click", async () => {
    modalOverlay.style.display = "flex";
    
    const cartItems = JSON.parse(localStorage.getItem("cartItems") || "[]");
    const ids = cartItems.map(item => item.id);

    if (!ids.length) {
        cartItemsList.textContent = "";
        const listItem = document.createElement("li");
        listItem.textContent = "Корзина пуста";
        cartItemsList.append(listItem);
        return;
    }

    const products = await fetchCartItems(ids);
    localStorage.setItem("cartProductDetails", JSON.stringify(products));
    renderCartItems();
});

modalOverlay.addEventListener("click", ({target}) => {
    if (
        target === modalOverlay ||
        target.closest(".modal-overlay_close-button")
    ) {
        modalOverlay.style.display = "none";
    }    
});

// добавление товаров в корзину
const updateCartCount = () => {
    const cartItems = JSON.parse(localStorage.getItem("cartItems") || "[]");
    cartCount.textContent = cartItems.length;
};

updateCartCount();

const addToCart = (productId) => {
    const cartItems = JSON.parse(localStorage.getItem("cartItems") || "[]");

    const existingItem = cartItems.find((item) => item.id === productId);

    if (existingItem) {
        existingItem.count += 1;
    } else {
        cartItems.push({ id: productId, count: 1 })
    }

    localStorage.setItem("cartItems", JSON.stringify(cartItems));
    updateCartCount();
};

productList.addEventListener("click", ({target}) => {
    if (target.closest(".product_btn-add-cart")) {
        const productId = target.dataset.id;    
        addToCart(productId);
    };
});

const updateCartItem = (productId, change) => {
    const cartItems = JSON.parse(localStorage.getItem("cartItems") || "[]");
    const itemIndex = cartItems.findIndex(item => item.id === productId);

    if (itemIndex !== -1) {
        cartItems[itemIndex].count += change;

        if (cartItems[itemIndex].count <= 0) {
            cartItems.splice(itemIndex, 1);
        }
        localStorage.setItem("cartItems", JSON.stringify(cartItems));
        
        updateCartCount();
        renderCartItems();
    }
};

cartItemsList.addEventListener("click", ({target}) => {
    if (target.classList.contains("modal__plus")) {
        const productId = target.dataset.id;
        updateCartItem(productId, 1)
    }

    if (target.classList.contains("modal__minus")) {
        const productId = target.dataset.id;
        updateCartItem(productId, -1)
    }
});

// форма
const submitOrder = async (e) => {
    e.preventDefault();

    const storeId = cartForm.store.value;
    const cartItems = JSON.parse(localStorage.getItem("cartItems") || "[]");

    const products = cartItems.map(({ id, count }) => ({
        id,
        quantity: count,
    }));

    try {
        const response = await fetch(`${API_URL}/api/orders`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ storeId, products }),
        });

        if (!response.ok) {
            throw new Error(response.status);
        }

        localStorage.removeItem("cartItems");
        localStorage.removeItem("cartProductDetails");

        const { orderId } = await response.json();

        orderMessageText.textContent = `Ваш заказ оформлен, номер ${orderId}. Вы можете его забрать завтра после 12:00`;
        document.body.append(orderMessageElement);

        modalOverlay.style.display = "none";
        updateCartCount();

    } catch (error) {
        console.error(`Ошибка оформления заказа: ${error}`);
    }
};

cartForm.addEventListener("submit", submitOrder);