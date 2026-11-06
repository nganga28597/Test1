const reservationForm = document.querySelector("#reservation-form");
const dateInput = document.querySelector("#booking-date");
const guestCount = document.querySelector("#guest-count");
const guestName = document.querySelector("#guest-name");
const guestEmail = document.querySelector("#guest-email");
const timeInput = document.querySelector("#booking-time");
const timeOptions = [...document.querySelectorAll(".time-option")];
const dateError = document.querySelector("#date-error");
const timeError = document.querySelector("#time-error");
const bookingError = document.querySelector("#booking-error");
const confirmation = document.querySelector("#confirmation");
const confirmationDetails = document.querySelector("#confirmation-details");
const newBookingButton = document.querySelector("#new-booking");
const menuToggle = document.querySelector(".menu-toggle");
const navigation = document.querySelector("#primary-nav");

function localDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isClosedDay(dateString) {
  return new Date(`${dateString}T12:00:00`).getDay() === 1;
}

function getSlotDate(dateString, time) {
  const [clock, period] = time.split(" ");
  const [hourText, minuteText] = clock.split(":");
  let hour = Number(hourText) % 12;
  if (period === "PM") hour += 12;
  const slotDate = new Date(`${dateString}T00:00:00`);
  slotDate.setHours(hour, Number(minuteText), 0, 0);
  return slotDate;
}

function hasAvailableTimes(date) {
  const dateString = localDateString(date);
  return !isClosedDay(dateString) && (
    dateString !== localDateString(new Date()) ||
    timeOptions.some((button) => getSlotDate(dateString, button.dataset.time) > new Date())
  );
}

function initializeDate() {
  const today = new Date();
  dateInput.min = localDateString(today);
  const firstOpenDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  while (!hasAvailableTimes(firstOpenDay)) {
    firstOpenDay.setDate(firstOpenDay.getDate() + 1);
  }
  dateInput.value = localDateString(firstOpenDay);
}

function updateTimeAvailability() {
  const selectedDate = dateInput.value;
  const closed = selectedDate && isClosedDay(selectedDate);
  const isToday = selectedDate === localDateString(new Date());
  let availableCount = 0;

  timeOptions.forEach((button) => {
    const unavailable = closed || !selectedDate ||
      (isToday && getSlotDate(selectedDate, button.dataset.time) <= new Date());

    button.disabled = Boolean(unavailable);
    if (unavailable && button.getAttribute("aria-pressed") === "true") {
      button.setAttribute("aria-pressed", "false");
      timeInput.value = "";
    }
    if (!unavailable) availableCount += 1;
  });

  if (closed) {
    dateInput.setCustomValidity("We are closed on Mondays. Please choose another day.");
    dateError.textContent = "We’re closed on Mondays. Please choose another day.";
  } else {
    dateInput.setCustomValidity("");
    dateError.textContent = "";
  }

  if (isToday && !availableCount && !closed) {
    dateError.textContent = "There are no more times available today. Please choose another day.";
  }
}

function clearBookingError() {
  bookingError.hidden = true;
  bookingError.textContent = "";
}

initializeDate();
updateTimeAvailability();

dateInput.addEventListener("change", () => {
  timeInput.value = "";
  timeOptions.forEach((button) => button.setAttribute("aria-pressed", "false"));
  timeError.textContent = "";
  clearBookingError();
  updateTimeAvailability();
});

timeOptions.forEach((button) => {
  button.addEventListener("click", () => {
    timeOptions.forEach((option) => option.setAttribute("aria-pressed", "false"));
    button.setAttribute("aria-pressed", "true");
    timeInput.value = button.dataset.time;
    timeError.textContent = "";
    clearBookingError();
  });
});

reservationForm.addEventListener("submit", (event) => {
  event.preventDefault();
  clearBookingError();

  if (!dateInput.checkValidity()) {
    dateInput.reportValidity();
    return;
  }

  if (!timeInput.value) {
    timeError.textContent = "Choose a reservation time before continuing.";
    timeOptions.find((button) => !button.disabled)?.focus();
    return;
  }

  if (!reservationForm.reportValidity()) return;

  const reservation = {
    name: guestName.value.trim(),
    email: guestEmail.value.trim(),
    date: dateInput.value,
    guests: Number(guestCount.value),
    time: timeInput.value,
    createdAt: new Date().toISOString(),
  };

  try {
    const savedReservations = JSON.parse(localStorage.getItem("alderAshBookings") || "[]");
    if (!Array.isArray(savedReservations)) {
      throw new Error("Saved reservation data is not a list.");
    }

    localStorage.setItem("alderAshBookings", JSON.stringify([...savedReservations, reservation]));
  } catch {
    bookingError.textContent = "We couldn’t save this demo booking in your browser. Please check your browser storage settings and try again.";
    bookingError.hidden = false;
    return;
  }

  const formattedDate = new Date(`${reservation.date}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  confirmationDetails.textContent = `${reservation.name}, ${reservation.guests} ${reservation.guests === 1 ? "guest" : "guests"} on ${formattedDate} at ${reservation.time}. This demo booking is saved on this device.`;
  reservationForm.hidden = true;
  confirmation.hidden = false;
});

newBookingButton.addEventListener("click", () => {
  reservationForm.reset();
  initializeDate();
  timeInput.value = "";
  timeOptions.forEach((button) => button.setAttribute("aria-pressed", "false"));
  timeError.textContent = "";
  clearBookingError();
  updateTimeAvailability();
  confirmation.hidden = true;
  reservationForm.hidden = false;
  dateInput.focus();
});

menuToggle.addEventListener("click", () => {
  const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isExpanded));
  navigation.classList.toggle("is-open", !isExpanded);
});

navigation.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    menuToggle.setAttribute("aria-expanded", "false");
    navigation.classList.remove("is-open");
  });
});