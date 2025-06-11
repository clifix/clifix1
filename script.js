// Save eco impact
function saveEcoImpact() {
  const username = document.getElementById("username").value;
  const ecoImpact = parseInt(document.getElementById("ecoImpact").value);

  if (!username || isNaN(ecoImpact)) {
    alert("Please enter a valid username and eco impact.");
    return;
  }

  fetch("/api/user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, ecoImpact })
  })
    .then(res => res.json())
    .then(data => {
      document.getElementById("result").innerText = data.message;
    })
    .catch(err => {
      document.getElementById("result").innerText = "Error saving data.";
      console.error(err);
    });
}

// Get eco impact
function getEcoImpact() {
  const username = document.getElementById("username").value;

  if (!username) {
    alert("Please enter a username.");
    return;
  }

  fetch(`/api/user/${username}`)
    .then(res => res.json())
    .then(data => {
      if (data.ecoImpact !== undefined) {
        document.getElementById("result").innerText = `Your eco impact score is: ${data.ecoImpact}`;
      } else {
        document.getElementById("result").innerText = "User not found.";
      }
    })
    .catch(err => {
      document.getElementById("result").innerText = "Error fetching data.";
      console.error(err);
    });
}


// Initialize Leaflet map

// Mobile menu toggle
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const navMenu = document.querySelector('.nav-menu');

mobileMenuBtn.addEventListener('click', () => {
  navMenu.classList.toggle('active');
});

// Close menu when a nav link is clicked (optional)
const navLinks = document.querySelectorAll('.nav-menu ul li a');
navLinks.forEach(link => {
  link.addEventListener('click', () => {
    navMenu.classList.remove('active');
  });
});
