import { useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { Send, X, Image as ImageIcon } from "lucide-react";
import toast from "react-hot-toast";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import CollaborativeCanvas from "../pages/CollaborativeCanvas"; // 🖌️ Import your canvas component

const autoSuggestions = {
  a: "alright",
  aa: "awesome",
  ab: "anytime",
  ac: "asap",
  ad: "all good",

  b: "bye",
  ba: "be right back",
  bb: "be safe",
  bc: "bless you",
  bd: "be there soon",

  c: "cool",
  ca: "can't wait",
  cb: "call me",
  cc: "catch you later",
  cd: "chill",

  d: "done",
  da: "don't worry",
  db: "deal",
  dc: "definitely",
  dd: "dope",

  e: "enjoy",
  ea: "everything's fine",
  eb: "excellent",
  ec: "exactly",
  ed: "easy peasy",

  f: "fine",
  fa: "for sure",
  fb: "feeling good",
  fc: "fyi",
  fd: "fingers crossed",

  g: "got it",
  ga: "good morning",
  gb: "great job",
  gc: "go ahead",
  gd: "grats",

  h: "hi",
  ha: "hello",
  hb: "how are you?",
  hc: "hold on",
  hd: "hang on",

  i: "I'm here",
  ia: "I see",
  ib: "I'll try",
  ic: "I agree",
  id: "I don't know",

  j: "just a sec",
  ja: "just kidding",
  jb: "join me",
  jc: "joking",
  jd: "just saying",

  k: "kk",
  ka: "kinda busy",
  kb: "kudos",
  kc: "keep going",
  kd: "k bye",

  l: "lol",
  la: "let's go",
  lb: "later",
  lc: "love it",
  ld: "let me know",

  m: "me too",
  ma: "my bad",
  mb: "miss you",
  mc: "much love",
  md: "maybe later",

  n: "nice",
  na: "no problem",
  nb: "no worries",
  nc: "not sure",
  nd: "nah",

  o: "okay",
  oa: "on it",
  ob: "oh yeah",
  oc: "of course",
  od: "one sec",

  p: "please",
  pa: "perfect",
  pb: "ping me",
  pc: "pretty good",
  pd: "probably",

  q: "question",
  qa: "quick question",
  qb: "quite good",
  qc: "quiet now",
  qd: "queued",

  r: "right",
  ra: "really?",
  rb: "roger that",
  rc: "running late",
  rd: "relax",

  s: "sure",
  sa: "see you",
  sb: "so true",
  sc: "same here",
  sd: "sounds good",

  t: "thanks",
  ta: "take care",
  tb: "talk soon",
  tc: "that's fine",
  td: "ttyl",

  u: "u there?",
  ua: "u rock",
  ub: "understood",
  uc: "ur welcome",
  ud: "u okay?",

  v: "very nice",
  va: "valid point",
  vb: "vote for it",
  vc: "vibe check",
  vd: "very true",

  w: "wow",
  wa: "what's up?",
  wb: "well done",
  wc: "will do",
  wd: "whatever",

  x: "xoxo",
  xa: "xactly",
  xb: "xtra nice",
  xc: "xmas",
  xd: "xo",

  y: "yeah",
  ya: "you too",
  yb: "you're welcome",
  yc: "yup",
  yd: "yo",

  z: "zoned out",
  za: "zzZ",
  zb: "zero issues",
  zc: "zoom later?",
  zd: "zany",

  gm: "good morning",
  gn: "good night",
  ty: "thank you",
  yw: "you're welcome",
  brb: "be right back",
  lol: "laugh out loud",
  idk: "I don't know",
  omg: "oh my god",
  btw: "by the way",
  np: "no problem",
  asap: "as soon as possible",
  ttyl: "talk to you later",
  imo: "in my opinion",
  smh: "shaking my head",
  afk: "away from keyboard",
  rn: "right now",
  bff: "best friends forever",
  wfh: "work from home",
  idc: "I don't care",
};


const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null); // Added state for image preview
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showCanvas, setShowCanvas] = useState(false);

  const imageInputRef = useRef(null);
  const { sendMessage } = useChatStore();

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;

    try {
      await sendMessage({ text: text.trim(), image: imagePreview }); // Send image data if it's available
      setText("");
      setImagePreview(null); // Reset the image after sending
      setFilteredSuggestions([]);
      setActiveIndex(0);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setText(value);

    const words = value.trim().split(" ");
    const lastWord = words[words.length - 1].toLowerCase();

    const matches = Object.keys(autoSuggestions)
      .filter((key) => key.startsWith(lastWord) && lastWord)
      .map((key) => ({ key, suggestion: autoSuggestions[key] }));

    setFilteredSuggestions(matches);
    setActiveIndex(0);
  };

  const handleKeyDown = (e) => {
    if (filteredSuggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % filteredSuggestions.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) =>
          prev === 0 ? filteredSuggestions.length - 1 : prev - 1
        );
      } else if (e.key === "Tab" || e.key === "Enter") {
        e.preventDefault();
        applySuggestion(filteredSuggestions[activeIndex].suggestion);
      }
    }
  };

  const applySuggestion = (replacement) => {
    const words = text.trim().split(" ");
    words[words.length - 1] = replacement;
    setText(words.join(" ") + " ");
    setFilteredSuggestions([]);
  };

  const handleEmojiClick = (emoji) => {
    setText((prev) => prev + emoji.native);
    setShowEmojiPicker(false);
  };

  const handleSendLocation = () => {
    if (!navigator.geolocation) return toast.error("Geolocation not supported");

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const mapsUrl = `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`;
        await sendMessage({ text: `📍 Location: ${mapsUrl}` });
      },
      () => toast.error("Unable to retrieve location")
    );
  };

  // Handle image change
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file?.type?.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result); // Set the preview of the image
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (imageInputRef.current) imageInputRef.current.value = ""; // Reset the file input
  };

  return (
    <div className="p-4 w-full relative">
      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="absolute bottom-20 left-4 z-50">
          <Picker data={data} onEmojiSelect={handleEmojiClick} theme="light" />
        </div>
      )}

      {/* Suggestions */}
      {filteredSuggestions.length > 0 && (
        <div className="absolute -top-24 left-4 w-60 bg-base-200 rounded shadow-lg text-sm z-40">
          {filteredSuggestions.map((item, index) => (
            <div
              key={item.key}
              className={`px-3 py-2 cursor-pointer ${
                index === activeIndex ? "bg-base-300" : ""
              }`}
              onClick={() => applySuggestion(item.suggestion)}
            >
              <span className="text-blue-600">{item.key}</span> → {item.suggestion}
            </div>
          ))}
        </div>
      )}

      {/* Canvas Modal */}
      {showCanvas && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center">
          <div className="bg-white p-4 rounded-lg w-[90%] max-w-4xl shadow-xl relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
              onClick={() => setShowCanvas(false)}
            >
              <X />
            </button>
            <CollaborativeCanvas roomId="canvas-room-123" onClose={() => setShowCanvas(false)} />
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <div className="flex-1 flex gap-2 items-center">
          {/* Emoji button */}
          <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
            😊
          </button>

          {/* Text input */}
          <input
            type="text"
            className="w-full input input-bordered rounded-lg input-sm sm:input-md"
            placeholder="Type a message..."
            value={text}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
          />

          {/* Image button */}
          <button
            type="button"
            className="hidden sm:flex btn btn-circle text-zinc-400"
            onClick={() => imageInputRef.current?.click()} // Open the file input on button click
          >
            <ImageIcon size={20} />
          </button>

          {/* Hidden image input */}
          <input
            type="file"
            accept="image/*"
            ref={imageInputRef}
            className="hidden"
            onChange={handleImageChange} // Handle image change
          />

          

          {/* Location button */}
          <button
            type="button"
            className="hidden sm:flex btn btn-circle text-blue-500"
            onClick={handleSendLocation}
            title="Send Location"
          >
            📍
          </button>
        </div>

        {/* Image preview */}
        {imagePreview && (
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-16 h-16 object-cover rounded-lg border border-zinc-700"
            />
            <button
              onClick={removeImage}
              className="absolute top-0 right-0 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center"
              type="button"
            >
              <X size={16} className="text-white" />
            </button>
          </div>
        )}

        {/* Send button */}
        <button
          type="submit"
          className="btn btn-sm btn-circle"
          disabled={!text.trim() && !imagePreview} // Disable button if no text or image
        >
          <Send size={22} />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
