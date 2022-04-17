// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getAuth} from 'firebase/auth'
import { getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCyjoU0ii6f8J5XxoKzr5R_LbaC_--WO98",
  authDomain: "blobsonline.firebaseapp.com",
  projectId: "blobsonline",
  storageBucket: "blobsonline.appspot.com",
  messagingSenderId: "373085419292",
  appId: "1:373085419292:web:a5f8d80a602747b57eecd9",
  databaseURL:"https://blobsonline-default-rtdb.europe-west1.firebasedatabase.app/"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app)
const db = getDatabase(app)

export {app,auth,db}