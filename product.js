const products = {

    almonds:{

        name:"ROASTED ALMONDS",

        tagline:"Harvested Goodness",

        description:"Premium California almonds roasted to perfection. Rich in protein and antioxidants.",

        price:"₹99",

        image:"images/almonds.png",

        ingredients:"Almonds, Himalayan Pink Salt",

        nutrition:"High Protein • Rich in Vitamin E • Healthy Fats",

        benefits:"Supports heart health, provides long-lasting energy and is packed with essential nutrients."

    },

    cashews:{

        name:"ROASTED CASHEWS",

        tagline:"Harvested Goodness",

        description:"Premium roasted cashews with a rich buttery taste and irresistible crunch.",

        price:"₹109",

        image:"images/cashew.png",

        ingredients:"Cashews, Himalayan Pink Salt",

        nutrition:"Protein • Magnesium • Healthy Fats",

        benefits:"A delicious snack that provides energy and supports overall wellness."

    },

    pistachios:{

        name:"SALTED PISTACHIOS",

        tagline:"Harvested Goodness",

        description:"Premium salted pistachios carefully roasted to perfection.",

        price:"₹129",

        image:"images/pistachio.png",

        ingredients:"Pistachios, Salt",

        nutrition:"Protein • Fiber • Vitamin B6",

        benefits:"Supports heart health and keeps you energized."

    },

    pumpkin:{

        name:"ROASTED PUMPKIN SEEDS",

        tagline:"Harvested Goodness",

        description:"Crunchy roasted pumpkin seeds packed with nutrients.",

        price:"₹99",

        image:"images/pumpkin.png",

        ingredients:"Pumpkin Seeds, Salt",

        nutrition:"Protein • Zinc • Magnesium",

        benefits:"Great for immunity and muscle recovery."

    },

    makhana:{

        name:"PUDINA MAKHANA",

        tagline:"Harvested Goodness",

        description:"Crunchy fox nuts infused with refreshing mint flavour.",

        price:"₹89",

        image:"images/makhana.png",

        ingredients:"Fox Nuts, Mint Seasoning",

        nutrition:"Low Calories • Protein • Fiber",

        benefits:"Healthy guilt-free snacking."

    },

    bbq:{

        name:"BARBEQUE PEANUTS",

        tagline:"Harvested Goodness",

        description:"Crunchy peanuts coated with smoky barbeque seasoning.",

        price:"₹79",

        image:"images/bbq-peanuts.png",

        ingredients:"Peanuts, BBQ Seasoning",

        nutrition:"Protein • Healthy Fats",

        benefits:"Bold flavour with satisfying crunch."

    },

    walnuts:{

        name:"SPICED WALNUTS",

        tagline:"Harvested Goodness",

        description:"Premium walnuts roasted with aromatic spices.",

        price:"₹149",

        image:"images/walnuts.png",

        ingredients:"Walnuts, Spice Blend",

        nutrition:"Omega-3 • Protein • Fiber",

        benefits:"Excellent for brain and heart health."

    }

};

const params = new URLSearchParams(window.location.search);

const key = params.get("product");

const product = products[key];

document.getElementById("product-name").innerHTML = product.name;

document.getElementById("tagline").innerHTML = product.tagline;

document.getElementById("description").innerHTML = product.description;

document.getElementById("price").innerHTML = product.price;

document.getElementById("product-image").src = product.image;

document.getElementById("ingredients").innerHTML = product.ingredients;

document.getElementById("nutrition").innerHTML = product.nutrition;

document.getElementById("benefits").innerHTML = product.benefits;
function addToCart(){

    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    let found = false;

    for(let i = 0; i < cart.length; i++){

        if(cart[i].name === product.name){

            cart[i].quantity++;

            found = true;

            break;

        }

    }

    if(!found){

        cart.push({

            name: product.name,

            price: Number(product.price.replace("₹","")),

            quantity: 1,

            image: product.image

        });

    }

    localStorage.setItem("cart", JSON.stringify(cart));

    alert(product.name + " added to cart!");

}