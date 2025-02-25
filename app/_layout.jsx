// components/Layout.js
import React from "react";
import { View, StyleSheet } from "react-native";
import ChatApp from "./page";

const Layout = ({ children }) => {
  return (
    <View style={styles.container}>
      <ChatApp />
      {/* <View style={styles.content}>{children}</View> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 10,
  },
});

export default Layout;
