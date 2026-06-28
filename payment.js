let selectedMethod = "";

const options = document.querySelectorAll(".payment-option");

options.forEach(button => {

    button.onclick = function(){

        options.forEach(btn => btn.classList.remove("selected"));

        this.classList.add("selected");

        selectedMethod = this.innerText;

    };

});

document.getElementById("pay-btn").onclick = function(){

    if(selectedMethod === ""){

        alert("Please select a payment method.");

        return;

    }

    localStorage.removeItem("cart");

    alert("Payment Successful using " + selectedMethod);

    window.location.href = "order-success.html";

};