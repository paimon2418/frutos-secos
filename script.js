function addToCart() {

    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    let product = {
        name: "Roasted Almonds",
        price: 99,
        image: "images/almonds.png",
        quantity: 1
    };

    cart.push(product);

    localStorage.setItem("cart", JSON.stringify(cart));

    alert("Roasted Almonds added to cart!");

}