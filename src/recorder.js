import React, { useState, useRef, useEffect } from 'react';
import { storage, firestore } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, doc, setDoc, onSnapshot, getDocs } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

const Recorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [transcription, setTranscription] = useState("Structured information will appear here.");
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [uuid, setUuid] = useState(null);
  const [whisperPublicUrl, setWhisperPublicUrl] = useState(null); // State to hold whisper public URL

  useEffect(() => {
    fetchWhisperPublicUrl();
  }, []);

  const fetchWhisperPublicUrl = async () => {
    try {
      const querySnapshot = await getDocs(collection(firestore, 'whisper_dynamic_url'));
      querySnapshot.forEach((doc) => {
        const url = doc.data().whisper_public_url;
        setWhisperPublicUrl(url);
      });
    } catch (error) {
      console.error('Error fetching whisper public URL:', error);
    }
  };

  useEffect(() => {
    if (uuid) {
      // Start listening to the document for updates
      const docRef = doc(firestore, 'processed_data', uuid);
      const unsubscribe = onSnapshot(docRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          if (data && data.transcription) {
            setTranscription(data.transcription);
          }
        }
      });

      return () => unsubscribe(); // Clean up the listener on unmount
    }
  }, [uuid]);

  const startRecording = () => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        mediaRecorderRef.current = new MediaRecorder(stream);

        mediaRecorderRef.current.ondataavailable = event => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorderRef.current.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp4' });
          const url = URL.createObjectURL(audioBlob);
          setAudioUrl(url);
          uploadAudio(audioBlob);
          makePostRequest();
          setTranscription("Processing transcription...");
        };

        audioChunksRef.current = [];
        mediaRecorderRef.current.start();
        setIsRecording(true);
      })
      .catch(error => {
        console.error('Error accessing media devices.', error);
      });
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  const uploadAudio = async (audioBlob) => {
    try {
      const newUuid = uuidv4(); // Generate UUID
      setUuid(newUuid); // Set UUID in state
      
      const storageRef = ref(storage, `audio/${newUuid}.mp4`);
      const snapshot = await uploadBytes(storageRef, audioBlob);
      const url = await getDownloadURL(snapshot.ref);
      
      // Save URL, UUID, and timestamp to Firestore collection with UUID as document ID
      const docRef = doc(collection(firestore, 'audio_file'), newUuid);
      await setDoc(docRef, {
        audio_file_url: url,
        timestamp: new Date(), // Add the timestamp
        is_processed: false
      });

      // After upload, proceed to make POST request with whisperPublicUrl
      makePostRequest(newUuid);
      
    } catch (error) {
      console.error('Error uploading audio:', error);
      setTranscription("Transcription failed");
  
      // Handle specific error cases if needed
      if (error.code === 'storage/unknown') {
        console.error('Unknown error occurred during upload.');
      }
    }
  };

  const makePostRequest = async () => {
    try {
      if (!whisperPublicUrl) {
        console.error('No whisper public URL found.');
        return;
      }

      const postUrl = `${whisperPublicUrl}/process/whisper`;
      const response = await fetch(postUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: ({})
      });

      if (response.ok) {
        console.log(`POST request to ${postUrl} was successful.`);
      } else {
        console.error(`Failed to make POST request to ${postUrl}. Status code: ${response.status}`);
      }
      
    } catch (error) {
      console.error('Error making POST request:', error);
    }
  };

  return (
    <div className="container">
      <button className="circular" onClick={isRecording ? stopRecording : startRecording}>
        {isRecording ? 'Stop' : 'Start'}
      </button>
      <div className="media-container">
        <audio id="audioPlayback" src={audioUrl} controls />
        <textarea value={transcription} readOnly placeholder="Structured Information will appear here..."></textarea>
      </div>
    </div>
  );
};

export default Recorder;