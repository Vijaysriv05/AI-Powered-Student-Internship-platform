export const handleChatbotMessage = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || message.trim() === "") {
      return res.status(400).json({ reply: "Please provide a message." });
    }

    // Simple chatbot logic (can be replaced with AI or keyword matching)
    let reply;
    if (message.toLowerCase().includes("hello")) {
      reply = "Hi there! How can I help you today?";
    } else if (message.toLowerCase().includes("internship")) {
      reply = "You can browse internships in the internships section!";
    } else {
      reply = `You said: "${message}". Chatbot works!`;
    }

    res.json({ reply });
  } catch (err) {
    console.error("❌ Chatbot error:", err);
    res.status(500).json({ reply: "Something went wrong, please try again later." });
  }
};
