import React, { useRef, useState } from "react";
import "./App.css";
import "firebase/analytics";

import { useAuthState } from "react-firebase-hooks/auth";
import { useCollectionData } from "react-firebase-hooks/firestore";

// Correct imports for Firebase v9
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { doc, deleteDoc, updateDoc } from "firebase/firestore";
// import { formatRelative } from 'date-fns';

const app = initializeApp({
  apiKey: "AIzaSyDXNybZHtKzvxmzfyAeT-dD5NfyY7TTLow",
  authDomain: "chatapplication-task.firebaseapp.com",
  projectId: "chatapplication-task",
  storageBucket: "chatapplication-task.appspot.com",
  messagingSenderId: "725554251135",
  appId: "1:725554251135:web:60e0ce902fdbf4a881864a",
});

const auth = getAuth(app);
const firestore = getFirestore(app);
// const analytics = firebase.analytics();

function App() {
  const [user] = useAuthState(auth);
  return (
    <div className="App">
      <header className="App-header">
        <h1>LinkUp💬</h1>
        <SignOut />
      </header>

      <section>{user ? <ChatRoom /> : <SignIn />}</section>
    </div>
  );
}
function SignIn() {
  const signInWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider);
  };
  return (
    <>
      <button className="SignInBtn" onClick={signInWithGoogle}>
        Sign in with Google
      </button>
      <p className="introduction">
      Welcome to LinkUp💬 - a dynamic and engaging chat application built using React and powered by Firebase Authentication and Cloud Firestore. LinkUp offers a seamless and intuitive platform for connecting with people from around the globe in real-time.
      </p>
    </>
  );
}

function SignOut() {
  return (
    auth.currentUser && (
      <button className="SignOutBtn" onClick={() => signOut(auth)}>
        Sign Out
      </button>
    )
  );
}

function ChatRoom() {
  const dummy = useRef();
  const messagesRef = collection(firestore, "messages");
  const q = query(messagesRef, orderBy("createdAt"), limit(25));

  const [messages] = useCollectionData(q, { idField: "id" });
  const [formValue, setFormValue] = useState("");

  const sendMessage = async (e) => {
    e.preventDefault();
    const { uid, photoURL } = auth.currentUser;

    // const messagesRef = collection(firestore, 'messages');

    await addDoc(messagesRef, {
      text: formValue,
      createdAt: serverTimestamp(),
      uid,
      photoURL,
      readBy: [], // Initialize read receipts
    });

    setFormValue("");
    dummy.current.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <main>
        {messages &&
          messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)}

        <span ref={dummy}></span>
      </main>

      <form onSubmit={sendMessage}>
        <input
          value={formValue}
          onChange={(e) => setFormValue(e.target.value)}
        />
        <button type="submit" disabled={!formValue}>
          Send
        </button>
      </form>
    </>
  );
}

function ChatMessage({ message }) {
  const { text, uid, photoURL, createdAt, id, readBy } = message;
  const messageClass = uid === auth.currentUser.uid ? "sent" : "received";
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(text);

  const canEdit = createdAt ? new Date() - createdAt.toDate() < 3600000 : false; // 1 hour in milliseconds

  const handleEdit = async () => {
    try {
      if (!id) return; // Ensure id is defined
      const messageRef = doc(firestore, "messages", id);
      await updateDoc(messageRef, { text: editedText });
      setIsEditing(false);
    } catch (error) {
      console.error("Error editing message:", error);
    }
  };

  const handleDelete = async () => {
    try {
      if (!id) return; // Ensure id is defined
      const messageRef = doc(firestore, "messages", id);
      await deleteDoc(messageRef);
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
    return timestamp.toDate().toLocaleString();
  };

  return (
    <div className={`message ${messageClass}`}>
      <img
        src={
          photoURL || "https://api.adorable.io/avatars/23/abott@adorable.png"
        }
        alt="Avatar"
      />
      {isEditing ? (
        <input
          value={editedText}
          onChange={(e) => setEditedText(e.target.value)}
        />
      ) : (
        <p>{text}</p>
      )}
      <span className="timestamp">
        {createdAt ? formatTimestamp(createdAt) : ""}
      </span>
      {uid === auth.currentUser.uid && canEdit && (
        <>
          {isEditing ? (
            <button onClick={handleEdit}>Save</button>
          ) : (
            <button onClick={() => setIsEditing(true)}>Edit</button>
          )}
          <button onClick={handleDelete}>Delete</button>
        </>
      )}

      <div className="read-receipts">
        {readBy &&
          readBy.map((readerId) => (
            <span key={readerId} className="read-receipt">
              ✓
            </span>
          ))}
      </div>
    </div>
  );
}

export default App;
