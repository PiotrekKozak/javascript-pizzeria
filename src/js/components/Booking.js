import { select, templates, settings, classNames } from '../settings.js';
import { utils } from '../utils.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';

class Booking {
  constructor(element) {
    const thisBooking = this;

    thisBooking.render(element);
    thisBooking.initWidgets();
    thisBooking.getData();

    thisBooking.selectedTableInfo = '';
  }

  getData(){
    const thisBooking = this;

    const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePickerElement.minDate);

    const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePickerElement.maxDate);

    const params = {
      bookings: [
        startDateParam,
        endDateParam,

      ],
      eventsCurrent: [
        settings.db.notRepeatParam,
        startDateParam,
        endDateParam,
      ],
      eventsRepeat: [
        settings.db.repeatParam,
        endDateParam,
      ],
    };

    //console.log('getData params', params);

    const urls = {
      bookings:       settings.db.url + '/' + settings.db.booking + '?' + params.bookings.join('&'),
      eventsCurrent: settings.db.url + '/' + settings.db.event + '?' + params.eventsCurrent.join('&'),
      eventsRepeat:  settings.db.url + '/' + settings.db.event + '?' + params.eventsRepeat.join('&'),      
    };
    //console.log('urls', urls);
    Promise.all([
      fetch(urls.bookings),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ])
      .then(function (allResponses){
        const bookingsResponse = allResponses[0];
        const eventsCurrentResponse = allResponses[1];
        const eventsRepeatResponse = allResponses[2];
        return Promise.all([
          bookingsResponse.json(),
          eventsCurrentResponse.json(),
          eventsRepeatResponse.json(),
        ]);
      })
      .then(function ([bookings, eventsCurrent, eventsRepeat]){
        // console.log(bookings);
        // console.log(eventsCurrent);
        // console.log(eventsRepeat);
        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
      });
  }

  parseData(bookings, eventsCurrent, eventsRepeat){
    const thisBooking = this;

    thisBooking.booked = {};

    for(let item of bookings){
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    for(let item of eventsCurrent){
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    const minDate = thisBooking.datePickerElement.minDate;
    const maxDate = thisBooking.datePickerElement.maxDate;

    for(let item of eventsRepeat){
      if(item.repeat == 'daily'){
        for (let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)){
          thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
        }
      }
    }
    //console.log('thisBooking.booked', thisBooking.booked);

    thisBooking.updateDOM();
  }

  makeBooked(date, hour, duration, table){
    const thisBooking = this;

    if(typeof thisBooking.booked[date] == 'undefined'){
      thisBooking.booked[date] = {};
    }

    const startHour = utils.hourToNumber(hour);
    
    for(let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5){
      //console.log('loop', hourBlock);

      if(typeof thisBooking.booked[date][hourBlock] == 'undefined'){
        thisBooking.booked[date][hourBlock] = [];
      }

      thisBooking.booked[date][hourBlock].push(table);
    }
  }

  updateDOM(){
    const thisBooking = this;

    thisBooking.date = thisBooking.datePickerElement.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPickerElement.value);

    let allAvailable = false;

    if(
      typeof thisBooking.booked[thisBooking.date] == 'undefined'
      ||
      typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'
    ){
      allAvailable = true;
    }

    for(let table of thisBooking.dom.tables){
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if(!isNaN(tableId)){
        tableId = parseInt(tableId);
      }

      if(
        !allAvailable

        &&
        thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId) >= 1
      ){
        table.classList.add(classNames.booking.tableBooked);
      } else {
        table.classList.remove(classNames.booking.tableBooked);
      }
    }      
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
    thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(
      select.booking.peopleAmount
    );
    thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(
      select.booking.hoursAmount
    );
    thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(
      select.widgets.datePicker.wrapper
    );
    thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(
      select.widgets.hourPicker.wrapper
    );
    thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(
      select.booking.tables
    );
    
    thisBooking.dom.tableDiv = thisBooking.dom.wrappper.querySelector(
      '.floor-plan'
    );
    thisBooking.dom.phoneElement = thisBooking.dom.wrappper.querySelector(
      select.booking.phone
    );
    thisBooking.dom.addressElement = thisBooking.dom.wrappper.querySelector(
      select.booking.address
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
    thisBooking.datePickerElement = new DatePicker(
      thisBooking.dom.datePicker
    );
    thisBooking.hourPickerElement = new HourPicker(
      thisBooking.dom.hourPicker
    );
    
    thisBooking.dom.wrapper.addEventListener('updated', function(){
      thisBooking.updateDOM();
    });

    thisBooking.dom.tableDiv.addEventListener('click', function(event){
      thisBooking.initTables(event);
    });
  }

  initTables(event) {
    const thisBooking = this;

    let selectedTableInfo = '';
    thisBooking.selectedTableInfo += selectedTableInfo;

    if(
      event.target.classList.contains('table') &
      !event.target.classList.contains(classNames.booking.tablesBooked) &
      !event.target.classList.contains('selected')
    ) {
      for(let table of thisBooking.dom.tables) {
        if(table.classList.contains('selected')) {
          table.classList.remove('selected');
        }
        event.target.classList.add('selected');
      }

      const selectedTableId = event.target.getAttribute('data-table');

      selectedTableInfo += selectedTableId;
    } else if (
      event.target.classList.contains('table') &
      event.target.classList.contains(classNames.booking.tableBooked)
    ) {
      alert('Ten stolik jest zajęty');
    } else if (
      event.target.classList.contains('table') &
      !event.target.classList.contains(classNames.booking.tableBooked) &
      event.target.classList.contains('selected')
    ) {
      event.target.classList.remove('selected');
      selectedTableInfo = '';
    }
  }

  sendOrder() {
    const thisBooking = this;

    const url = settings.db.url + '/' + settings.db.bookings;

    const payload = {
      date: thisBooking.date,
      hour: thisBooking.hourPickerElement.value,
      table: thisBooking.tableId,
      duration: thisBooking.hoursAmountElement.value,
      ppl: thisBooking.peopleAmountElement.value,
      phone: thisBooking.dom.phoneElement.value,
      address: thisBooking.dom.addressElement.value,
    };

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

export default Booking;
