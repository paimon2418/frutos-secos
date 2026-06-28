let cart = JSON.parse(localStorage.getItem("cart")) || [];

let checkoutItems = document.getElementById("checkout-items");

let total = 0;

cart.forEach(item=>{

    total += item.price * item.quantity;

    checkoutItems.innerHTML += `

    <p>

        ${item.name} × ${item.quantity}

        <span style="float:right;">₹${item.price * item.quantity}</span>

    </p>

    <br>

    `;

});

document.getElementById("checkout-total").innerHTML="₹"+total;

document.getElementById("place-order").onclick=function(){

    alert("Order Placed Successfully!");

    localStorage.removeItem("cart");

  window.location.href="payment.html";";

};