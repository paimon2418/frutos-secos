let cart = JSON.parse(localStorage.getItem("cart")) || [];

let cartItems = document.getElementById("cart-items");

let total = 0;

if(cart.length==0){

    cartItems.innerHTML="<p>Your Cart is Empty</p>";

}else{

    cart.forEach((item,index)=>{

        total += item.price * item.quantity;

        cartItems.innerHTML += `

<div class="cart-card">

    <img src="${item.image}" class="cart-image">

    <div class="cart-info">

        <h2>${item.name}</h2>

        <p>₹${item.price}</p>

        <p>

            <button onclick="decreaseQuantity(${index})">-</button>

            <strong>${item.quantity}</strong>

            <button onclick="increaseQuantity(${index})">+</button>

        </p>

        <button onclick="removeItem(${index})">

            🗑 Remove

        </button>

    </div>

</div>

`;

        

    });

}

document.getElementById("total").innerHTML="Total : ₹"+total;

function increaseQuantity(index){

    cart[index].quantity++;

    localStorage.setItem("cart",JSON.stringify(cart));

    location.reload();

}

function decreaseQuantity(index){

    if(cart[index].quantity>1){

        cart[index].quantity--;

    }else{

        cart.splice(index,1);

    }

    localStorage.setItem("cart",JSON.stringify(cart));

    location.reload();

}

function removeItem(index){

    cart.splice(index,1);

    localStorage.setItem("cart",JSON.stringify(cart));

    location.reload();

}