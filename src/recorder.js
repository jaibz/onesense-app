import React, { useState, useRef, useEffect } from 'react';
import './recorder.css';  // Import the new CSS file
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
  const [whisperPublicUrl, setWhisperPublicUrl] = useState(null);

  useEffect(() => {
    fetchWhisperPublicUrl();
  }, []);

  const fetchWhisperPublicUrl = async () => {
    try {
      const querySnapshot = await getDocs(collection(firestore, 'whisper_dynamic_url'));
      querySnapshot.forEach((doc) => {
        const url = doc.data().whisper_public_url;
        console.log("Fetched whisper public URL:", url);
        setWhisperPublicUrl(url);
      });
    } catch (error) {
      console.error('Error fetching whisper public URL:', error);
    }
  };

  useEffect(() => {
    if (uuid) {
      console.log(`Listening for updates on document with UUID: ${uuid}`);
      
      const docRef = doc(firestore, 'processed_data', uuid);
      const unsubscribe = onSnapshot(docRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          console.log(`Document with UUID ${uuid} updated.`);
          
          const data = docSnapshot.data();
          console.log('Document data:', data);
  
          if (data && data.processed_response) {
            const { processed_response } = data;

            const formattedResponse = `
              Doctor Name: ${processed_response.doctor_name || 'N/A'}
              Patient Name: ${processed_response.patient_name || 'N/A'}
              Patient Age: ${processed_response.patient_age || 'N/A'}
              Patient Sex: ${processed_response.patient_sex || 'N/A'}
              Patient Symptoms: ${
                processed_response.patient_symptoms && processed_response.patient_symptoms.length > 0
                  ? processed_response.patient_symptoms.filter(symptom => symptom != null).map(symptom => `${symptom.symptom || 'N/A'} (${symptom.duration || 'N/A'})`).join(', ')
                  : 'N/A'
              }
              Doctor Prescription: ${
                processed_response.doctor_prescription && processed_response.doctor_prescription.length > 0
                  ? processed_response.doctor_prescription.filter(prescription => prescription != null).map(prescription => `
              Medication: ${prescription.medication || 'N/A'}, Dosage: ${prescription.dosage || 'N/A'}, Frequency: ${prescription.frequency || 'N/A'}, Days: ${prescription.days || 'N/A'}`).join('\n')
                  : 'N/A'
            }`;

            console.log('Formatted response:', formattedResponse);
            setTranscription(formattedResponse);
          }
        }
      });
  
      return () => {
        console.log(`Stopped listening for updates on document with UUID: ${uuid}`);
        unsubscribe();
      };
    } else {
      console.log('UUID not provided.');
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
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          const url = URL.createObjectURL(audioBlob);
          setAudioUrl(url);
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
      const newUuid = uuidv4();
      setUuid(newUuid);
      
      const storageRef = ref(storage, `audio/${newUuid}.wav`);
      const snapshot = await uploadBytes(storageRef, audioBlob);
      const url = await getDownloadURL(snapshot.ref);
      
      const docRef = doc(collection(firestore, 'audio_file'), newUuid);
      await setDoc(docRef, {
        audio_file_url: url,
        timestamp: new Date(),
        is_processed: false
      });

      await makePostRequest(newUuid);
      
    } catch (error) {
      console.error('Error uploading audio:', error);
      setTranscription("Transcription failed");
  
      if (error.code === 'storage/unknown') {
        console.error('Unknown error occurred during upload.');
      }
    }
  };

  const makePostRequest = async (newUuid) => {
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
        body: JSON.stringify({ uuid: newUuid })
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
