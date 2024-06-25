import React, { useState, useRef } from 'react';

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
      setTranscription(data.transcription || "Transcription failed");
    })
    .catch(error => {
      console.error('Error uploading audio:', error);
      setTranscription("Transcription failed");
    });
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
