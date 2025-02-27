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

export default function ChatApp() {
  const [sessionId, setSessionId] = useState("");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);
  const [voices, setVoices] = useState([]); // Estado para almacenar las voces
  const [selectedVoice, setSelectedVoice] = useState("EXAVITQu4vr4xnSDxMaL"); // Estado para la voz seleccionada
  const [showVoiceModal, setShowVoiceModal] = useState(false); // Estado para mostrar/ocultar el modal de voces

  // Obtener session_id al iniciar la app
  useEffect(() => {
    axios
      .get("https://chatbot-voz-production.up.railway.app/new_session")
      .then((res) => setSessionId(res.data.session_id))
      .catch((err) => console.error("Error al obtener sesión", err));

    // Obtener la lista de voces
    axios
      .get("https://api.elevenlabs.io/v1/voices") // Reemplaza con tu endpoint
      .then((res) => setVoices(res.data.voices))
      .catch((err) => console.error("Error al obtener voces", err));
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
          voice_id: selectedVoice?.voice_id, // Envía el ID de la voz seleccionada
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

  // Seleccionar una voz
  const handleSelectVoice = (voice) => {
    setSelectedVoice(voice);
    setShowVoiceModal(false); // Cierra el modal después de seleccionar
  };

  return (
    <View style={styles.container}>
      {/* Modal para seleccionar voces */}
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

      {/* Encabezado */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Chat IA</Text>
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

      {/* Selector de voz */}
      <TouchableOpacity
        style={styles.voiceSelector}
        onPress={() => setShowVoiceModal(true)}
      >
        <Text style={styles.voiceSelectorText}>
          {selectedVoice ? selectedVoice.name : "Seleccionar voz"}
        </Text>
      </TouchableOpacity>

      {/* Lista de mensajes */}
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

      {/* Input y botón de enviar */}
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
    padding: 15,
    backgroundColor: "#1e1e1e",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
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
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: "center",
  },
  voiceSelectorText: {
    color: "#fff",
    fontSize: 16,
  },
  messageBubble: {
    padding: 15,
    borderRadius: 20,
    marginVertical: 5,
    maxWidth: "75%",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
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
  },
  botText: {
    color: "#fff",
  },
  audioText: {
    color: "#00BCD4",
    marginTop: 5,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  input: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: "#444",
    borderRadius: 25,
    backgroundColor: "#333",
    color: "#fff",
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: "#007AFF",
    padding: 15,
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
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#333",
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
  },
  voiceItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#444",
  },
  voiceName: {
    color: "#fff",
    fontSize: 16,
  },
  voiceDetails: {
    color: "#aaa",
    fontSize: 14,
  },
  closeButton: {
    marginTop: 10,
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  selectVoiceButton: {
    backgroundColor: "#444",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  selectVoiceButtonText: {
    color: "#fff",
    fontSize: 16,
  },
});
