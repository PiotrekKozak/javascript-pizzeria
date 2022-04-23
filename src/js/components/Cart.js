import { select, settings, templates, classNames } from '../settings.js';
import { utils } from '../utils.js';
import CartProduct from './CartProduct.js';

class Cart {
  constructor(element) {
    const thisCart = this;

    thisCart.products = [];

    thisCart.getElements(element);
    thisCart.initActions();

    //console.log('new Cart', thisCart);
  }

  getElements(element) {
    const thisCart = this;

    thisCart.dom = {};

    thisCart.dom.wrapper = element;
    thisCart.dom.toggleTrigger = element.querySelector(
      select.cart.toggleTrigger
    );
    thisCart.dom.productList = element.querySelector(select.cart.productList);

    thisCart.dom.deliveryFee = element.querySelector(select.cart.deliveryFee);
    thisCart.dom.subtotalPrice = element.querySelector(
      select.cart.subtotalPrice
    );
    thisCart.dom.totalPrice = element.querySelectorAll(select.cart.totalPrice);
    thisCart.dom.totalNumber = element.querySelector(select.cart.totalNumber);

    thisCart.dom.form = element.querySelector(select.cart.form);
    thisCart.dom.address = element.querySelector(select.cart.address);
    thisCart.dom.phone = element.querySelector(select.cart.phone);
  }

  initActions() {
    const thisCart = this;

    thisCart.dom.toggleTrigger.addEventListener('click', function (event) {
      event.preventDefault();

      thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
    });

    thisCart.dom.productList.addEventListener('updated', function () {
      thisCart.update();
    });

    thisCart.dom.productList.addEventListener('remove', function (event) {
      thisCart.remove(event.detail.cartProduct);
    });

    thisCart.dom.form.addEventListener('submit', function (event) {
      event.preventDefault();
      thisCart.sendOrder();
    });
  }

  add(menuProduct) {
    const thisCart = this;

    /* generate HTML based on template */
    const generatedHTML = templates.cartProduct(menuProduct);

    /* create element using utils.createElementFromHTML */
    const generatedDOM = utils.createDOMFromHTML(generatedHTML);

    /* add element to menu */
    thisCart.dom.productList.appendChild(generatedDOM);

    //console.log('adding product', menuProduct);
    thisCart.products.push(new CartProduct(menuProduct, generatedDOM));
    //console.log('thisCartProducts', thisCart.products);

    thisCart.update();
  }

  update() {
    const thisCart = this;

    let deliveryFee = settings.cart.defaultDeliveryFee;
    thisCart.totalNumber = 0;
    thisCart.subtotalPrice = 0;

    for (const product of thisCart.products) {
      thisCart.totalNumber += product.amount;
      thisCart.subtotalPrice += product.price;
    }

    if (thisCart.totalNumber <= 0) {
      deliveryFee = 0;
    }

    thisCart.totalPrice = deliveryFee + thisCart.subtotalPrice;

    thisCart.dom.totalNumber.innerHTML = thisCart.totalNumber;
    thisCart.dom.deliveryFee.innerHTML = deliveryFee;
    thisCart.dom.subtotalPrice.innerHTML = thisCart.subtotalPrice;

    thisCart.dom.totalPrice.forEach((domElement) => {
      domElement.innerHTML = thisCart.totalPrice;
    });
  }

  remove(instance) {
    const thisCart = this;

    const list = thisCart.products;

    const productIndex = list.indexOf(instance);

    list.splice(productIndex, 1);

    thisCart.update();
  }

  sendOrder() {
    const thisCart = this;

    const url = settings.db.url + '/' + settings.db.orders;

    const payload = {
      address: thisCart.dom.address.calue,
      phone: thisCart.dom.phone.value,
      totalPrice: thisCart.totalPrice,
      subtotalPrice: thisCart.subtotalPrice,
      totalNumber: thisCart.totalNumber,
      deliveryFee: settings.cart.defaultDeliveryFee,
      products: [],
    };

    for (const prod of thisCart.products) {
      payload.products.push(prod.getData());
    }

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };

    fetch(url, options);
  }
}

export default Cart;
