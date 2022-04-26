import { select, templates } from '../settings.js';
import { utils } from '../utils.js';
import AmountWidget from './AmountWidget.js';

class Booking {
  constructor(element) {
    const thisBooking = this;

    thisBooking.render(element);
    thisBooking.initWidgets();
  }

  render(element) {
    const thisBooking = this;

    /* generate HTML based on template */
    const generatedHTML = templates.bookingWidget();

    /* create element using utils.createElementFromHTML */
    thisBooking.element = utils.createDOMFromHTML(generatedHTML);

    /* add element to menu */
    element.appendChild(thisBooking.element);

    thisBooking.dom = {};
    thisBooking.dom.wrapper = element;
    thisBooking.dom.wrapper.innerHTML = generatedHTML;
    thisBooking.dom.peopleAmount = document.querySelector(
      select.booking.peopleAmount
    );
    thisBooking.dom.hoursAmount = document.querySelector(
      select.booking.hoursAmount
    );
  }

  initWidgets() {
    const thisBooking = this;

    thisBooking.peopleAmountElement = new AmountWidget(
      thisBooking.dom.peopleAmount
    );
    thisBooking.hoursAmountElement = new AmountWidget(
      thisBooking.dom.hoursAmount
    );
  }
}

export default Booking;
