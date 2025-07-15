// src/lib/getBotReply.js

export const getBotReply = async (messageText) => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "You are a helpful chatbot assistant." },
            { role: "user", content: messageText },
          ],
        }),
      });
  
      const data = await res.json();
      return data.choices?.[0]?.message?.content ?? "Sorry, I couldn't think of a reply!";
    } catch (error) {
      console.error("Bot reply error:", error);
      return "Something went wrong with my brain. Try again later!";
    }
  };
  