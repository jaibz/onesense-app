import React, { useState, useRef } from 'react';

const Recorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [extractedInfo, setExtractedInfo] = useState('');
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

          // Extract information here (replace with actual extraction logic)
          const extractedInfo = extractInformationFromAudio(audioChunksRef.current);
          setExtractedInfo(extractedInfo);

          uploadAudio(audioBlob);
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

  const uploadAudio = (audioBlob) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recorded_audio.mp3');

    fetch('your-api-endpoint', {
      method: 'POST',
      body: formData
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to upload audio');
      }
      return response.json();
    })
    .then(data => {
      console.log('Audio uploaded successfully:', data);
    })
    .catch(error => {
      console.error('Error uploading audio:', error);
    });
  };

  const extractInformationFromAudio = (audioChunks) => {
    // Replace this with your actual extraction logic
    return 'Doctor Name: Dr. Smith\nPatient Name: John Doe\nHealth Issue: Headache\nPrescribed Medicines: Aspirin\nPrescribed Remedy: Rest';
  };

  return (
    <div>
      <button onClick={isRecording ? stopRecording : startRecording}>
        {isRecording ? 'Stop Recording' : 'Start Recording'}
      </button>
      <button 
        onClick={() => audioUrl && document.getElementById('audioPlayback').play()}
        disabled={!audioUrl}
      >
        Play Recorded Audio
      </button>
      <audio id="audioPlayback" src={audioUrl} controls />
      <textarea
        placeholder="Structured Information"
        readOnly
        value={extractedInfo}
        style={{ width: '100%', height: '100px', marginTop: '20px' }}
      />
    </div>
  );
};

export default Recorder;
