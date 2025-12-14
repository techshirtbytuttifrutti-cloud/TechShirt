// public/firebase-messaging-sw.js
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyCI4ButXE1zB1pWscY3WaXeogEjl56QkEY",
  authDomain:  "techshirt-32583.firebaseapp.com",
  projectId: "techshirt-32583",
  storageBucket:  "techshirt-32583.firebasestorage.app",
  messagingSenderId:  "529450318985",
  appId: "1:529450318985:web:1749c12af452a776369a58",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  console.log("Received background message ", payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/logo192.png",
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
