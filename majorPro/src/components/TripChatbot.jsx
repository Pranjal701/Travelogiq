import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { apiUrl } from "../api";
import { motion, AnimatePresence } from "framer-motion";

const WELCOME_MESSAGE = {
  role: "bot",
  content: "Hey! 👋 I'm your AI travel assistant. Tell me about your dream trip — where do you want to go, or describe what kind of experience you're looking for!",
  suggestedOptions: [],
};

function TripChatbot() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [extracted, setExtracted] = useState({});
  const [showSummary, setShowSummary] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerStart, setPickerStart] = useState("");
  const [pickerEnd, setPickerEnd] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Auto-show date picker when destination is set but dates are missing
  useEffect(() => {
    if (extracted.destination && !extracted.startDate && !extracted.endDate && !loading) {
      setShowDatePicker(true);
    } else {
      setShowDatePicker(false);
    }
  }, [extracted, loading]);

  const handleDateSubmit = () => {
    if (pickerStart && pickerEnd) {
      sendMessage(`From ${pickerStart} to ${pickerEnd}`);
      setShowDatePicker(false);
      setPickerStart("");
      setPickerEnd("");
    }
  };

  const buildConversationHistory = () => {
    return messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "bot" ? "model" : "user",
        content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
      }));
  };

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;

    const userMsg = { role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await axios.post(
        apiUrl("/chat"),
        {
          message: text.trim(),
          conversationHistory: buildConversationHistory(),
          extracted,
        },
        { withCredentials: true }
      );

      const data = res.data;

      setExtracted(data.extracted || {});
      setShowSummary(data.showSummary || false);

      const botMsg = {
        role: "bot",
        content: data.message,
        suggestedOptions: data.suggestedOptions || [],
        complete: data.complete || false,
        extracted: data.extracted,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      console.log("Chat error:", error);
      const errorMsg = {
        role: "bot",
        content: "Oops, something went wrong. Could you try again? 😅",
        suggestedOptions: [],
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleOptionClick = (option) => {
    sendMessage(option);
  };

  const handleGenerateItinerary = async () => {
    if (saving) return;
    setSaving(true);

    try {
      const payload = {
        destination: extracted.destination,
        startDate: extracted.startDate,
        endDate: extracted.endDate,
        budget: extracted.budget,
        group: extracted.group,
        interests: extracted.interests || [],
        pacing: extracted.pacing,
        notes: extracted.notes || "",
      };

      const res = await axios.post(apiUrl("/save_chat_details"), payload, {
        withCredentials: true,
      });

      if (res.data.message === "Details Saved") {
        navigate("/itinerary");
      }
    } catch (error) {
      console.log("Save error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          content: "Failed to save trip details. Please try again.",
          suggestedOptions: [],
        },
      ]);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setMessages([WELCOME_MESSAGE]);
    setExtracted({});
    setShowSummary(false);
    setInput("");
  };

  // Format field labels for display
  const fieldLabels = {
    destination: { icon: "location_on", label: "Destination" },
    startDate: { icon: "event", label: "Start Date" },
    endDate: { icon: "event_available", label: "End Date" },
    budget: { icon: "payments", label: "Budget" },
    group: { icon: "groups", label: "Group" },
    pacing: { icon: "speed", label: "Pace" },
    interests: { icon: "interests", label: "Interests" },
    notes: { icon: "sticky_note_2", label: "Notes" },
  };

  const filledCount = Object.entries(extracted).filter(
    ([k, v]) =>
      v !== null &&
      v !== undefined &&
      k !== "notes" &&
      k !== "interests" &&
      (typeof v !== "string" || v.length > 0)
  ).length;

  const totalRequired = 6; // destination, startDate, endDate, budget, group, pacing

  return (
    <div className="chatbot-container">
      {/* Header */}
      <div className="chatbot-header">
        <div className="chatbot-header-left">
          <div className="chatbot-avatar">
            <span className="material-symbols-outlined">smart_toy</span>
          </div>
          <div>
            <h2 className="chatbot-title">TraveloGIQ AI</h2>
            <p className="chatbot-subtitle">
              {loading ? "Thinking..." : "Online"}
            </p>
          </div>
        </div>
        <div className="chatbot-header-right">
          {/* Progress indicator */}
          <div className="chatbot-progress">
            <div className="chatbot-progress-bar">
              <div
                className="chatbot-progress-fill"
                style={{ width: `${(filledCount / totalRequired) * 100}%` }}
              />
            </div>
            <span className="chatbot-progress-text">
              {filledCount}/{totalRequired}
            </span>
          </div>
          <button onClick={handleReset} className="chatbot-reset-btn" title="Start over">
            <span className="material-symbols-outlined">refresh</span>
          </button>
        </div>
      </div>

      {/* Extracted Data Pills */}
      {Object.entries(extracted).some(
        ([, v]) => v !== null && (!Array.isArray(v) || v.length > 0)
      ) && (
        <div className="chatbot-pills-bar">
          {Object.entries(extracted).map(([key, value]) => {
            if (value === null || value === undefined) return null;
            if (Array.isArray(value) && value.length === 0) return null;
            if (typeof value === "string" && value.length === 0) return null;
            const field = fieldLabels[key];
            if (!field) return null;
            return (
              <span key={key} className="chatbot-pill">
                <span className="material-symbols-outlined chatbot-pill-icon">
                  {field.icon}
                </span>
                {Array.isArray(value) ? value.join(", ") : String(value)}
              </span>
            );
          })}
        </div>
      )}

      {/* Messages */}
      <div className="chatbot-messages">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className={`chatbot-msg ${msg.role === "user" ? "chatbot-msg-user" : "chatbot-msg-bot"}`}
            >
              {msg.role === "bot" && (
                <div className="chatbot-msg-avatar">
                  <span className="material-symbols-outlined">smart_toy</span>
                </div>
              )}
              <div className={`chatbot-bubble ${msg.role === "user" ? "chatbot-bubble-user" : "chatbot-bubble-bot"}`}>
                <p className="chatbot-bubble-text">{msg.content}</p>

                {/* Suggested options */}
                {msg.suggestedOptions && msg.suggestedOptions.length > 0 && (
                  <div className="chatbot-options">
                    {msg.suggestedOptions.map((opt, j) => (
                      <button
                        key={j}
                        onClick={() => handleOptionClick(opt)}
                        className="chatbot-option-btn"
                        disabled={loading || i !== messages.length - 1}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}

                {/* Generate button when complete */}
                {msg.complete && (
                  <div className="chatbot-generate-section">
                    <div className="chatbot-summary-card">
                      <h4 className="chatbot-summary-title">
                        <span className="material-symbols-outlined">flight_takeoff</span>
                        Trip Summary
                      </h4>
                      <div className="chatbot-summary-grid">
                        {extracted.destination && (
                          <div className="chatbot-summary-item">
                            <span className="material-symbols-outlined">location_on</span>
                            <span>{extracted.destination}</span>
                          </div>
                        )}
                        {extracted.startDate && extracted.endDate && (
                          <div className="chatbot-summary-item">
                            <span className="material-symbols-outlined">date_range</span>
                            <span>{extracted.startDate} → {extracted.endDate}</span>
                          </div>
                        )}
                        {extracted.budget && (
                          <div className="chatbot-summary-item">
                            <span className="material-symbols-outlined">payments</span>
                            <span className="capitalize">{extracted.budget}</span>
                          </div>
                        )}
                        {extracted.group && (
                          <div className="chatbot-summary-item">
                            <span className="material-symbols-outlined">groups</span>
                            <span className="capitalize">{extracted.group}</span>
                          </div>
                        )}
                        {extracted.pacing && (
                          <div className="chatbot-summary-item">
                            <span className="material-symbols-outlined">speed</span>
                            <span>{extracted.pacing}</span>
                          </div>
                        )}
                        {extracted.interests && extracted.interests.length > 0 && (
                          <div className="chatbot-summary-item">
                            <span className="material-symbols-outlined">interests</span>
                            <span>{extracted.interests.join(", ")}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={handleGenerateItinerary}
                      disabled={saving}
                      className="chatbot-generate-btn"
                    >
                      {saving ? (
                        <>
                          <span className="chatbot-spinner" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined">auto_awesome</span>
                          Generate My Itinerary
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="chatbot-msg chatbot-msg-bot"
          >
            <div className="chatbot-msg-avatar">
              <span className="material-symbols-outlined">smart_toy</span>
            </div>
            <div className="chatbot-bubble chatbot-bubble-bot">
              <div className="chatbot-typing">
                <span className="chatbot-typing-dot" />
                <span className="chatbot-typing-dot" />
                <span className="chatbot-typing-dot" />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Date Picker */}
      <AnimatePresence>
        {showDatePicker && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="chatbot-date-picker"
          >
            <div className="chatbot-date-picker-inner">
              <div className="chatbot-date-picker-header">
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--primary)" }}>calendar_month</span>
                <span>Select your travel dates</span>
              </div>
              <div className="chatbot-date-picker-fields">
                <div className="chatbot-date-field">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={pickerStart}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => {
                      setPickerStart(e.target.value);
                      if (pickerEnd && e.target.value > pickerEnd) setPickerEnd("");
                    }}
                  />
                </div>
                <span className="material-symbols-outlined chatbot-date-arrow">arrow_forward</span>
                <div className="chatbot-date-field">
                  <label>End Date</label>
                  <input
                    type="date"
                    value={pickerEnd}
                    min={pickerStart || new Date().toISOString().split("T")[0]}
                    onChange={(e) => setPickerEnd(e.target.value)}
                  />
                </div>
                <button
                  onClick={handleDateSubmit}
                  disabled={!pickerStart || !pickerEnd}
                  className="chatbot-date-submit"
                >
                  <span className="material-symbols-outlined">check</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <form onSubmit={handleSubmit} className="chatbot-input-bar">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tell me about your dream trip..."
          className="chatbot-input"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="chatbot-send-btn"
        >
          <span className="material-symbols-outlined">send</span>
        </button>
      </form>
    </div>
  );
}

export default TripChatbot;
