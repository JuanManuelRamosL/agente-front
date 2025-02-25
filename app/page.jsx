import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import axios from "axios";
import { Audio } from "expo-av";

export default function ChatApp() {
  const [sessionId, setSessionId] = useState("");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);

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
    setMessages((prev) => [...prev, { type: "user", text: question }]);

    try {
      const res = await axios.post(
        "https://chatbot-voz-production.up.railway.app/chat",
        {
          session_id: sessionId,
          question: question,
        }
      );

      const botMessage = {
        type: "bot",
        text: res.data.response,
        audio: res.data.audio_url,
      };
      setMessages((prev) => [...prev, botMessage]);

      if (autoPlay && botMessage.audio) {
        playAudio(botMessage.audio);
      }
    } catch (err) {
      console.error("Error al enviar mensaje", err);
      setMessages((prev) => [
        ...prev,
        { type: "bot", text: "Hubo un error. Intenta de nuevo." },
      ]);
    }

    setLoading(false);
    setQuestion("");
  };

  // Reproducir audio desde la URL
  const playAudio = async (url) => {
    if (!url) return;

    try {
      const { sound } = await Audio.Sound.createAsync({ uri: url });
      await sound.playAsync();
    } catch (err) {
      console.error("Error al reproducir audio", err);
      Alert.alert("Error", "No se pudo reproducir el audio");
    }
  };

  return (
    <View style={{ flex: 1, padding: 15, backgroundColor: "#f5f5f5" }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <Text style={{ fontSize: 20, fontWeight: "bold" }}>Chat IA</Text>
        <TouchableOpacity onPress={() => setAutoPlay(!autoPlay)}>
          <Text style={{ color: autoPlay ? "green" : "red" }}>
            {autoPlay ? "🔊 AutoPlay ON" : "🔇 AutoPlay OFF"}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View
            style={{
              alignSelf: item.type === "user" ? "flex-end" : "flex-start",
              backgroundColor: item.type === "user" ? "#dcf8c6" : "#fff",
              padding: 10,
              borderRadius: 10,
              marginVertical: 5,
              maxWidth: "75%",
              shadowColor: "#000",
              shadowOpacity: 0.1,
              shadowRadius: 3,
              shadowOffset: { width: 0, height: 2 },
            }}
          >
            <Text>{item.text}</Text>
            {item.audio && (
              <TouchableOpacity onPress={() => playAudio(item.audio)}>
                <Text style={{ color: "blue", marginTop: 5 }}>
                  🔊 Reproducir
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />

      <View
        style={{ flexDirection: "row", alignItems: "center", marginTop: 10 }}
      >
        <TextInput
          value={question}
          onChangeText={setQuestion}
          placeholder="Escribe un mensaje..."
          style={{
            flex: 1,
            padding: 10,
            borderWidth: 1,
            borderColor: "#ccc",
            borderRadius: 20,
            backgroundColor: "#fff",
          }}
        />
        <TouchableOpacity
          onPress={handleSendMessage}
          style={{
            marginLeft: 10,
            backgroundColor: "#007AFF",
            padding: 10,
            borderRadius: 50,
          }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: "#fff" }}>➡️</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
