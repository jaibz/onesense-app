import React, { useState, useRef } from 'react';
import { storage, firestore } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, doc, setDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

const Recorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [transcription, setTranscription] = useState("Structured Information");
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = () => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        mediaRecorderRef.current = new MediaRecorder(stream);

        mediaRecorderRef.current.ondataavailable = event => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorderRef.current.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
          const url = URL.createObjectURL(audioBlob);
          setAudioUrl(url);
          console.log('Audio blob created:', audioBlob);
          uploadAudio(audioBlob);
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
      const uuid = uuidv4(); // Generate UUID
      
      const storageRef = ref(storage, `audio/${uuid}.mp4`);
      
      const snapshot = await uploadBytes(storageRef, audioBlob);
      
      const url = await getDownloadURL(snapshot.ref);
      
      // Save URL, UUID, and timestamp to Firestore collection with UUID as document ID
      const docRef = doc(collection(firestore, 'audio_file'), uuid);
      await setDoc(docRef, {
        audio_file_url: url,
        timestamp: new Date(), // Add the timestamp
        is_processed: false
      });
      
      setTranscription("Audio uploaded successfully");
    } catch (error) {
      console.error('Error uploading audio:', error);
      setTranscription("Transcription failed");
  
      // Handle specific error cases if needed
      if (error.code === 'storage/unknown') {
        console.error('Unknown error occurred during upload.');
      }
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