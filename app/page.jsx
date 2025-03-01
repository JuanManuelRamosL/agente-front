import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  ScrollView,
} from "react-native";
import axios from "axios";
import { Audio } from "expo-av";
import Icon from "react-native-vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";

export default function ChatApp() {
  const [sessionId, setSessionId] = useState("");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState("EXAVITQu4vr4xnSDxMaL");
  const [showVoiceModal, setShowVoiceModal] = useState(false);

  useEffect(() => {
    axios
      .get("https://chatbot-voz-production.up.railway.app/new_session")
      .then((res) => setSessionId(res.data.session_id))
      .catch((err) => console.error("Error al obtener sesión", err));

    axios
      .get("https://api.elevenlabs.io/v1/voices")
      .then((res) => setVoices(res.data.voices))
      .catch((err) => console.error("Error al obtener voces", err));
  }, []);

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
          voice_id: selectedVoice?.voice_id || "EXAVITQu4vr4xnSDxMaL",
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

  const handleSelectVoice = (voice) => {
    setSelectedVoice(voice);
    setShowVoiceModal(false);
  };

  return (
    <View style={styles.container}>
      <Modal
        visible={showVoiceModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowVoiceModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecciona una voz</Text>
            <ScrollView>
              {voices.map((voice) => (
                <TouchableOpacity
                  key={voice.voice_id}
                  style={styles.voiceItem}
                  onPress={() => handleSelectVoice(voice)}
                >
                  <Text style={styles.voiceName}>{voice.name}</Text>
                  <Text style={styles.voiceDetails}>
                    {voice.labels?.accent} - {voice.labels?.gender}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowVoiceModal(false)}
            >
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <LinearGradient
          colors={["#00FFAA", "#0077FF"]} // Degradado de verde a azul
          start={{ x: 0, y: 0 }} // Dirección del degradado (izquierda a derecha)
          end={{ x: 1, y: 0 }}
          style={styles.gradientBackground}
        >
          <Text style={styles.headerText}>EvexIA</Text>
        </LinearGradient>
        <TouchableOpacity onPress={() => setAutoPlay(!autoPlay)}>
          <Text style={autoPlay ? styles.autoPlayOn : styles.autoPlayOff}>
            {autoPlay ? "🔊 AutoPlay ON" : "🔇 AutoPlay OFF"}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.selectVoiceButton}
        onPress={() => setShowVoiceModal(true)}
      >
        <Text style={styles.selectVoiceButtonText}>
          🎤 Elegir voz:{" "}
          {selectedVoice ? selectedVoice.name : "No seleccionada"}
        </Text>
      </TouchableOpacity>

      <LinearGradient
        colors={["#1e1e1e", "#333"]}
        style={styles.messagesContainer}
      >
        <FlatList
          data={messages}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View
              style={[
                styles.messageBubble,
                item.type === "user" ? styles.userBubble : styles.botBubble,
              ]}
            >
              <Text
                style={item.type === "user" ? styles.userText : styles.botText}
              >
                {item.text}
              </Text>
              {item.audio && (
                <TouchableOpacity onPress={() => playAudio(item.audio)}>
                  <Text style={styles.audioText}>🔊 Reproducir</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      </LinearGradient>

      <View style={styles.inputContainer}>
        <TextInput
          value={question}
          onChangeText={setQuestion}
          placeholder="Escribe un mensaje..."
          style={styles.input}
          placeholderTextColor="#999"
        />
        <TouchableOpacity
          onPress={handleSendMessage}
          style={styles.sendButton}
          underlayColor="#005bb5"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Icon name="send" size={24} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  gradientBackground: {
    padding: 10,
    borderRadius: 10, // Bordes redondeados (opcional)
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff", // Texto en blanco para contrastar con el degradado
  },
  autoPlayOn: {
    color: "#4CAF50",
    fontSize: 16,
  },
  autoPlayOff: {
    color: "#FF5252",
    fontSize: 16,
  },
  voiceSelector: {
    backgroundColor: "#333",
    padding: 12,
    borderRadius: 20,
    marginBottom: 10,
    alignItems: "center",
  },
  voiceSelectorText: {
    color: "#fff",
    fontSize: 16,
  },
  messageBubble: {
    padding: 14,
    borderRadius: 20,
    marginVertical: 8,
    maxWidth: "75%",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#007AFF",
  },
  botBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#333",
  },
  userText: {
    color: "#fff",
    fontSize: 16,
  },
  botText: {
    color: "#fff",
    fontSize: 16,
  },
  audioText: {
    color: "#00BCD4",
    marginTop: 5,
  },
  messagesContainer: {
    flex: 1,
    marginBottom: 15,
    borderRadius: 15,
    padding: 10,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#444",
    paddingTop: 10,
  },
  input: {
    flex: 1,
    padding: 12,
    borderRadius: 25,
    backgroundColor: "#222",
    color: "#fff",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#444",
  },
  sendButton: {
    marginLeft: 12,
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#333",
    borderRadius: 15,
    padding: 25,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 15,
  },
  voiceItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#444",
  },
  voiceName: {
    color: "#fff",
    fontSize: 16,
  },
  voiceDetails: {
    color: "#bbb",
    fontSize: 14,
  },
  closeButton: {
    marginTop: 15,
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  selectVoiceButton: {
    backgroundColor: "#444",
    padding: 12,
    borderRadius: 15,
    alignItems: "center",
    marginBottom: 12,
  },
  selectVoiceButtonText: {
    color: "#fff",
    fontSize: 16,
  },
});
