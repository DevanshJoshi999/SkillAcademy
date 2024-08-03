function openTab(event, tabName) {
  // Get all elements with class "tabcontent" and hide them
  let tabcontents = document.getElementsByClassName("tabcontent");
  for (let i = 0; i < tabcontents.length; i++) {
    tabcontents[i].style.display = "none";
  }

  // Get all elements with class "tablink" and remove the "active" class
  let tablinks = document.getElementsByClassName("tablink");
  for (let i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }

  // Show the current tab and add an "active" class to the link that opened it
  document.getElementById(tabName).style.display = "block";
  event.currentTarget.className += " active";
}

// Set the default tab to be opened
document.addEventListener("DOMContentLoaded", function () {
  document.querySelector(".tablink").click();
});
