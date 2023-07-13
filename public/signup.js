function togglePasswordVisibility(inputId, buttonId) {
    var passwordInput = document.getElementById(inputId);
    var visibilityButton = document.getElementById(buttonId);

    if (passwordInput.type === "password") {
      passwordInput.type = "text";
      visibilityButton.innerHTML = '<i class="material-icons">visibility_off</i>'; // Google Material Icons: visibility_off
    } else {
      passwordInput.type = "password";
      visibilityButton.innerHTML = '<i class="material-icons">visibility</i>'; // Google Material Icons: visibility
    }
  }

    function validateForm() {
      var nameInput = document.getElementById("name");
      var nameError = document.getElementById("nameError");

      var mobileNumberInput = document.getElementById("mobilenumber");
      var mobileNumberError = document.getElementById("mobileNumberError");

      var addressInput = document.getElementById("address");
      var addressError = document.getElementById("addressError");

      var pincodeInput = document.getElementById("pincode");
      var pincodeError = document.getElementById("pincodeError");

      var usernameInput = document.getElementById("email");
      var usernameError = document.getElementById("emailError");

      var passwordInput = document.getElementById("password");
      var passwordError = document.getElementById("passwordError");

      var confirmPasswordInput = document.getElementById("confirmpassword");
      var confirmPasswordError = document.getElementById("confirmPasswordError");

      // Reset error messages
      nameError.textContent = "";
      mobileNumberError.textContent = "";
      addressError.textContent = "";
      pincodeError.textContent = "";
      usernameError.textContent = "";
      passwordError.textContent = "";
      confirmPasswordError.textContent = "";

      // Validate name field
      if (nameInput.value.trim() === "") {
        nameError.textContent = "Name is required";
        return false; // Prevent form submission
      }

      // Validate mobile number field
      if (mobileNumberInput.value.trim() === "") {
        mobileNumberError.textContent = "Mobile Number is required";
        return false; // Prevent form submission
      }

      // Validate address field
      if (addressInput.value.trim() === "") {
        addressError.textContent = "Address is required";
        return false; // Prevent form submission
      }

      // Validate pincode field
      if (pincodeInput.value.trim() === "") {
        pincodeError.textContent = "Pincode is required";
        return false; // Prevent form submission
      }

      // Validate username field
      if (usernameInput.value.trim() === "") {
        usernameError.textContent = "Username is required";
        return false; // Prevent form submission
      }

      // Validate password field
      if (passwordInput.value.trim() === "") {
        passwordError.textContent = "Password is required";
        return false; // Prevent form submission
      }

      // Validate confirm password field
      if (confirmPasswordInput.value.trim() === "") {
        confirmPasswordError.textContent = "Confirm Password is required";
        return false; // Prevent form submission
      }

      // Check if passwords match
      if (passwordInput.value !== confirmPasswordInput.value) {
        confirmPasswordError.textContent = "Passwords do not match";
        alert("Passwords do not match"); // Show alert box
        return false; // Prevent form submission
      }
      var passwordPattern = /[!@#$%^&*(),.?":{}|<>]/;
      if (!passwordPattern.test(passwordInput.value)) {
        passwordError.textContent = "Password must contain at least one special character";
        alert("Password must contain at least one special character"); // Show alert box
        return false; // Prevent form submission
      }

      // Form is valid, allow form submission
      return true;
    }