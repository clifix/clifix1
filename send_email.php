<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $to = 'your.email@gmail.com'; // Replace with your Gmail
    $subject = 'New Contact Form Submission';
    
    $name = htmlspecialchars($_POST['name']);
    $email = filter_var($_POST['email'], FILTER_SANITIZE_EMAIL);
    $message = htmlspecialchars($_POST['message']);
    
    $body = "Name: $name\nEmail: $email\n\nMessage:\n$message";
    
    $headers = "From: website@yourdomain.com\r\n"; // Replace with your domain
    $headers .= "Reply-To: $email\r\n";
    $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

    if (mail($to, $subject, $body, $headers)) {
        header('Location: thank-you.html'); // Create a thank-you page
    } else {
        header('Location: error.html');
    }
} else {
    header("Location: contact.html");
}
?>