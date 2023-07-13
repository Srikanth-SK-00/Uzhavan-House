function togglePasswordVisibility() {
    var passwordInput = document.getElementById("password");
    var passwordIcon = document.getElementById("password-icon");

    if (passwordInput.type === "password") {
      passwordInput.type = "text";
      passwordIcon.innerHTML = '<i class="material-icons">visibility</i>'; 
    } else {
      passwordInput.type = "password";
      passwordIcon.innerHTML =
        '<i class="material-icons">visibility_off</i>'; 
    }
  }