import firebase from "firebase/app";
import "firebase/firestore";
import "firebase/database";

firebase.initializeApp({
  apiKey: "AIzaSyANO_PX2eipnVtVzbHKogFzQv32jWk4-58",
  authDomain: "nonograms-6ce33.firebaseapp.com",
  projectId: "nonograms-6ce33",
  storageBucket: "nonograms-6ce33.appspot.com",
  messagingSenderId: "524180026312",
  appId: "1:524180026312:web:f8b0b180c5ea837ec706fd",
  measurementId: "G-06DSN1ZPRH",
});

export const firestore = firebase.firestore();
export const realtimeDb = firebase.database();
