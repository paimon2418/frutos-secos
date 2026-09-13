let cart = JSON.parse(localStorage.getItem("cart")) || [];

const checkoutItems = document.getElementById("checkout-items");
const subtotal = document.getElementById("subtotal");
const total = document.getElementById("checkout-total");

let grandTotal = 0;

if(cart.length === 0){

    checkoutItems.innerHTML = "<p>Your cart is empty.</p>";

}else{

    cart.forEach(item => {

        grandTotal += item.price * item.quantity;

        checkoutItems.innerHTML += `

        <div class="checkout-item">

            <span>${item.name} × ${item.quantity}</span>

            <span>₹${item.price * item.quantity}</span>

        </div>

        `;

    });

}

subtotal.innerHTML = "₹" + grandTotal;
total.innerHTML = "₹" + grandTotal;

document.getElementById("place-order").onclick = function(){

    window.location.href = "payment.html";

};