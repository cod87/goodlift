import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";

function App() {
  const [input, setInput] = useState("");
  const [notes, setNotes] = useState([]);

  // Load notes from Firestore when the app loads:
  useEffect(() => {
    const fetchNotes = async () => {
      const querySnapshot = await getDocs(collection(db, "notes"));
      setNotes(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchNotes();
  }, []);

  // Add a note to Firestore:
  const handleAddNote = async () => {
    if (input.trim() === "") return;
    await addDoc(collection(db, "notes"), { text: input });
    setInput("");

    // Reload notes
    const querySnapshot = await getDocs(collection(db, "notes"));
    setNotes(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  return (
    <div style={{padding: 40}}>
      <h1>Good Lift Firestore Demo</h1>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type a note"
        style={{marginRight: 10}}
      />
      <button onClick={handleAddNote}>Add Note</button>
      <ul>
        {notes.map(note => (
          <li key={note.id}>{note.text}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;