const socket = io();

const $messageForm = document.querySelector("#message-form");
const $sendLocation = document.querySelector("#send-location");
const $messageFormInput = $messageForm.querySelector("input");
const $messageFormButton = $messageForm.querySelector("button");
const $messages = document.querySelector("#messages");

//templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector("#location-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

//Options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const autoscroll = () => {
  //new message element
  const $newMessage = $messages.lastElementChild;

  //  height of the new message
  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  //  visible height
  const visibleHeight = $messages.offsetHeight;

  //  height of messages container
  const containerHeight = $messages.scrollHeight;

  //  how far have I scrolled
  const scrollOffset = $messages.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight;
  }
};

socket.on("messageAll", (message) => {
  console.log(message);
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.created).format("h:mm a"),
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

socket.on("locationMessage", (location) => {
  const locationT = Mustache.render(locationTemplate, {
    username: location.username,
    location: location.url,
    createdAt: moment(location.createdAt).format("h:mm a"),
  });
  $messages.insertAdjacentHTML("beforeend", locationT);
  autoscroll();
});

socket.on("roomData", ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users,
  });
  document.querySelector("#sidebar").innerHTML = html;
});

$messageForm.addEventListener("submit", (e) => {
  e.preventDefault();
  //disable button after send
  $messageFormButton.setAttribute("disabled", "disabled");

  const finalMessage = e.target.elements.message.value;
  socket.emit("sendMessage", finalMessage, (error) => {
    //enable button again
    $messageFormButton.removeAttribute("disabled");

    $messageFormInput.value = "";
    $messageFormInput.focus();

    if (error) {
      return console.error(error);
    }
    console.log("Message delivered successfully");
  });
});

$sendLocation.addEventListener("click", () => {
  if (!navigator.geolocation) {
    return alert("geolocation is not supported by your browser");
  }
  //disable button while location fetches
  $sendLocation.setAttribute("disabled", "disabled");

  navigator.geolocation.getCurrentPosition((position) => {
    const { latitude, longitude } = position.coords;
    const location = {
      latitude,
      longitude,
    };
    socket.emit("sendLocation", location, () => {
      $sendLocation.removeAttribute("disabled");
      console.log("Location shared");
    });
  });
});

socket.emit("join", { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});
