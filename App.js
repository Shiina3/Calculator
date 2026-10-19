import { useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { evaluateExpression, formatNumber } from "./calculator";

const KEY_ROWS = [
  [
    { label: "C", action: "clear", tone: "dark" },
    { label: "⌫", action: "delete", tone: "utility", accessibilityLabel: "Delete last character" },
    { label: "(", value: "(", tone: "utility" },
    { label: ")", value: ")", tone: "utility" },
  ],
  [
    { label: "7", value: "7" },
    { label: "8", value: "8" },
    { label: "9", value: "9" },
    { label: "÷", value: "÷", tone: "operator" },
  ],
  [
    { label: "4", value: "4" },
    { label: "5", value: "5" },
    { label: "6", value: "6" },
    { label: "×", value: "×", tone: "operator" },
  ],
  [
    { label: "1", value: "1" },
    { label: "2", value: "2" },
    { label: "3", value: "3" },
    { label: "−", value: "-", tone: "operator" },
  ],
  [
    { label: "%", value: "%", tone: "operator" },
    { label: "0", value: "0" },
    { label: ".", value: "." },
    { label: "+", value: "+", tone: "operator" },
  ],
];

function CalculatorKey({ item, onPress, style }) {
  const tone = item.tone || "number";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={item.accessibilityLabel || item.label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.key,
        styles[`key_${tone}`],
        style,
        pressed && styles.keyPressed,
      ]}
    >
      <Text style={[styles.keyText, styles[`keyText_${tone}`]]}>{item.label}</Text>
    </Pressable>
  );
}

export default function App() {
  const { width } = useWindowDimensions();
  const [expression, setExpression] = useState("");
  const [result, setResult] = useState(null);
  const [justCalculated, setJustCalculated] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [feedbackIsError, setFeedbackIsError] = useState(false);
  const [history, setHistory] = useState([]);
  const cardWidth = Math.min(width - 32, 380);
  const cardPadding = cardWidth < 350 ? 18 : 23;
  const keyGap = cardWidth < 350 ? 7 : 9;
  const keyWidth = (cardWidth - cardPadding * 2 - keyGap * 3) / 4;

  function clear() {
    setExpression("");
    setResult(null);
    setJustCalculated(false);
    setFeedback("");
    setFeedbackIsError(false);
  }

  function append(value) {
    let nextExpression = expression;
    if (justCalculated) {
      nextExpression = /[0-9.(]/.test(value) ? "" : formatNumber(result);
      setResult(null);
    }
    setExpression(nextExpression + value);
    setJustCalculated(false);
    setFeedback("");
    setFeedbackIsError(false);
  }

  function removeLast() {
    setExpression((current) => current.slice(0, -1));
    setResult(null);
    setJustCalculated(false);
    setFeedback("");
    setFeedbackIsError(false);
  }

  function calculate() {
    try {
      const value = evaluateExpression(expression);
      const formatted = formatNumber(value);
      setResult(value);
      setJustCalculated(true);
      setFeedback("");
      setFeedbackIsError(false);
      setHistory((current) => [{ expression, result: formatted }, ...current].slice(0, 8));
    } catch (error) {
      setFeedback(error.message);
      setFeedbackIsError(true);
    }
  }

  async function copyResult() {
    if (result === null) {
      setFeedback("Calculate something first.");
      setFeedbackIsError(true);
      return;
    }
    try {
      await Clipboard.setStringAsync(formatNumber(result));
      setFeedback("Result copied.");
      setFeedbackIsError(false);
    } catch {
      setFeedback("Couldn't copy the result. Check clipboard permissions.");
      setFeedbackIsError(true);
    }
  }

  function restoreHistory(entry) {
    setExpression(entry.expression);
    setResult(Number(entry.result));
    setJustCalculated(true);
    setFeedback("");
    setFeedbackIsError(false);
  }

  const displayedResult = result === null ? (expression ? "" : "0") : formatNumber(result);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#d7ed32" />
      <View pointerEvents="none" style={styles.pattern}>
        <View style={[styles.diamond, styles.diamondOne]} />
        <View style={[styles.diamond, styles.diamondTwo]} />
        <View style={[styles.diamond, styles.diamondThree]} />
        <View style={[styles.diamond, styles.diamondFour]} />
      </View>
      <ScrollView
        contentContainerStyle={styles.page}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.heading}>
          <Text style={styles.brandMark}>✳</Text>
          <Text style={styles.brandText}>GOOD THINGS ADD UP</Text>
        </View>

        <View style={[styles.card, { width: cardWidth, padding: cardPadding }]}>
          <View style={styles.display}>
            <View style={styles.toolbar}>
              <Text style={styles.displayLabel}>STANDARD</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Copy result"
                onPress={copyResult}
                style={({ pressed }) => [styles.copyButton, pressed && styles.keyPressed]}
              >
                <Text style={styles.copyIcon}>▢</Text>
              </Pressable>
            </View>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={styles.expression}
            >
              {justCalculated && expression ? `${expression} =` : expression}
            </Text>
            <Text
              accessibilityLabel={`Result ${displayedResult}`}
              numberOfLines={1}
              adjustsFontSizeToFit
              style={styles.result}
            >
              {displayedResult}
            </Text>
            <Text style={[styles.feedback, feedbackIsError && styles.feedbackError]}>
              {feedback}
            </Text>
          </View>

          <View style={[styles.keypad, { gap: keyGap }]}>
            {KEY_ROWS.flatMap((row, rowIndex) =>
              row.map((item, columnIndex) => (
                <CalculatorKey
                  key={`${rowIndex}-${item.label}`}
                  item={item}
                  onPress={() => {
                    if (item.action === "clear") clear();
                    else if (item.action === "delete") removeLast();
                    else append(item.value);
                  }}
                  style={{ width: keyWidth, height: keyWidth * 0.9 }}
                />
              )),
            )}
            <CalculatorKey
              item={{ label: "=", tone: "dark", accessibilityLabel: "Equals" }}
              onPress={calculate}
              style={[styles.equalsKey, { height: keyWidth * 0.86 }]}
            />
          </View>

          <View style={styles.history}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>RECENT CALCULATIONS</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => setHistory([])}
                style={styles.clearHistory}
              >
                <Text style={styles.clearHistoryText}>Clear</Text>
              </Pressable>
            </View>
            {history.length === 0 ? (
              <Text style={styles.emptyHistory}>Your calculations will show up here.</Text>
            ) : (
              <ScrollView style={styles.historyList} nestedScrollEnabled>
                {history.map((entry, index) => (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${entry.expression} equals ${entry.result}`}
                    key={`${entry.expression}-${index}`}
                    onPress={() => restoreHistory(entry)}
                    style={styles.historyEntry}
                  >
                    <Text numberOfLines={1} style={styles.historyExpression}>
                      {entry.expression}
                    </Text>
                    <Text style={styles.historyResult}>{entry.result}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>

          <Text style={styles.keyboardHint}>Tap the keys to enter a calculation.</Text>
        </View>
        <Text style={styles.footer}>A little clarity goes a long way.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#d7ed32",
  },
  pattern: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  diamond: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.12)",
    transform: [{ rotate: "45deg" }],
  },
  diamondOne: { top: -86, left: -74 },
  diamondTwo: { top: 165, right: -112 },
  diamondThree: { bottom: 100, left: -120 },
  diamondFour: { bottom: -115, right: 20 },
  page: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 28,
  },
  heading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 18,
  },
  brandMark: {
    color: "#343a1b",
    fontSize: 18,
  },
  brandText: {
    color: "#343a1b",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.7,
  },
  card: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.65)",
    borderRadius: 27,
    backgroundColor: "#fbfbf5",
    shadowColor: "#44500d",
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 9,
  },
  display: {
    minHeight: 143,
    justifyContent: "flex-end",
    paddingHorizontal: 4,
    paddingBottom: 16,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "auto",
  },
  displayLabel: {
    color: "#9a9c92",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  copyButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  copyIcon: {
    color: "#777b6c",
    fontSize: 23,
    lineHeight: 25,
  },
  expression: {
    minHeight: 25,
    color: "#96988d",
    fontFamily: "monospace",
    fontSize: 15,
    textAlign: "right",
  },
  result: {
    color: "#1e211c",
    fontFamily: "monospace",
    fontSize: 48,
    fontWeight: "500",
    letterSpacing: -2,
    lineHeight: 58,
    textAlign: "right",
  },
  feedback: {
    minHeight: 16,
    marginTop: 5,
    color: "#9a9c92",
    fontSize: 11,
    textAlign: "right",
  },
  feedbackError: {
    color: "#bf3d2c",
  },
  keypad: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  key: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "#f0f1e9",
  },
  key_number: {
    backgroundColor: "#f0f1e9",
  },
  key_utility: {
    backgroundColor: "#eaf0c8",
  },
  key_operator: {
    backgroundColor: "#eaf0c8",
  },
  key_dark: {
    backgroundColor: "#1e211c",
  },
  keyPressed: {
    opacity: 0.72,
  },
  keyText: {
    color: "#1e211c",
    fontSize: 19,
    fontWeight: "600",
  },
  keyText_utility: {
    color: "#596323",
    fontSize: 17,
  },
  keyText_operator: {
    color: "#596323",
    fontSize: 21,
  },
  keyText_dark: {
    color: "#d7ed32",
    fontSize: 18,
    fontWeight: "700",
  },
  equalsKey: {
    width: "100%",
    marginTop: 2,
  },
  history: {
    marginTop: 21,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#eeefe7",
  },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  historyTitle: {
    color: "#777b6c",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  clearHistory: {
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  clearHistoryText: {
    color: "#777b6c",
    fontSize: 11,
  },
  emptyHistory: {
    paddingTop: 8,
    color: "#a1a398",
    fontSize: 12,
  },
  historyList: {
    maxHeight: 126,
    marginTop: 7,
  },
  historyEntry: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 5,
    borderRadius: 8,
  },
  historyExpression: {
    flex: 1,
    color: "#85877d",
    fontFamily: "monospace",
    fontSize: 11,
  },
  historyResult: {
    color: "#1e211c",
    fontFamily: "monospace",
    fontSize: 12,
  },
  keyboardHint: {
    marginTop: 15,
    color: "#a1a398",
    fontSize: 10,
    textAlign: "center",
  },
  footer: {
    marginTop: 18,
    color: "#343a1b",
    fontSize: 10,
    fontWeight: "500",
    letterSpacing: 1,
  },
});
