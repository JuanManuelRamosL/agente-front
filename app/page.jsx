import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  ActivityIndicator,
  Alert,
} from "react-native";
import axios from "axios";
import { Audio } from "expo-av";

export default function ChatApp() {
  const [sessionId, setSessionId] = useState("");
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");
  const [audioUrl, setAudioUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true); // Estado para activar/desactivar reproducción automática

  // Obtener session_id al iniciar la app
  useEffect(() => {
    axios
      .get("https://chatbot-voz-production.up.railway.app/new_session")
      .then((res) => setSessionId(res.data.session_id))
      .catch((err) => console.error("Error al obtener sesión", err));
  }, []);

  // Enviar mensaje al backend
  const handleSendMessage = async () => {
    if (!question.trim()) return Alert.alert("Error", "Escribe una pregunta");

    setLoading(true);

    try {
      const res = await axios.post(
        "https://chatbot-voz-production.up.railway.app/chat",
        {
          session_id: sessionId,
          question: question,
        }
      );

      setResponse(res.data.response);
      setAudioUrl(res.data.audio_url);
    } catch (err) {
      console.error("Error al enviar mensaje", err);
      setResponse("Hubo un error. Intenta de nuevo.");
    }

    setLoading(false);
    setQuestion("");
  };

  // Reproducir audio desde la URL
  const playAudio = async () => {
    if (!audioUrl) return;

    try {
      const { sound } = await Audio.Sound.createAsync({ uri: audioUrl });
      await sound.playAsync();
    } catch (err) {
      console.error("Error al reproducir audio", err);
      Alert.alert("Error", "No se pudo reproducir el audio");
    }
  };

  // Reproducir automáticamente el audio si está activado
  useEffect(() => {
    if (audioUrl && autoPlay) {
      playAudio();
    }
  }, [audioUrl, autoPlay]);

  return (
    <View
      style={{
        flex: 1,
        padding: 20,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 10 }}>
        Chat IA con Audio
      </Text>

      <Button
        title={autoPlay ? "🚫 Desactivar AutoPlay" : "✅ Activar AutoPlay"}
        onPress={() => setAutoPlay(!autoPlay)}
        style={{ marginTop: 10 }}
      />

      <TextInput
        value={question}
        onChangeText={setQuestion}
        placeholder="Escribe tu pregunta..."
        style={{
          width: "100%",
          padding: 10,
          borderWidth: 1,
          borderColor: "#ccc",
          borderRadius: 5,
          marginBottom: 10,
        }}
      />

      <Button
        title={loading ? "Enviando..." : "Enviar"}
        onPress={handleSendMessage}
        disabled={loading}
      />

      {loading && (
        <ActivityIndicator
          size="large"
          color="#0000ff"
          style={{ marginTop: 10 }}
        />
      )}

      {response ? (
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontWeight: "bold" }}>Respuesta:</Text>
          <Text>{response}</Text>
        </View>
      ) : null}

      <>
        <Button
          title="🔊 Reproducir Audio"
          onPress={playAudio}
          style={{ marginTop: 10 }}
        />
      </>
    </View>
  );
}
