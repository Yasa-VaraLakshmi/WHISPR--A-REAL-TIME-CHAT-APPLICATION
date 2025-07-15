import { useState } from "react";
import languages from "./languages";
import { ArrowRightLeft } from "lucide-react";

const Translator = () => {
  const [fromLang, setFromLang] = useState("en-GB");
  const [toLang, setToLang] = useState("hi-IN");
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");

  const translateText = async () => {
    if (!inputText) return;

    const apiUrl = `https://api.mymemory.translated.net/get?q=${inputText}&langpair=${fromLang}|${toLang}`;
    try {
      const response = await fetch(apiUrl);
      const data = await response.json();
      setOutputText(data.responseData.translatedText);
    } catch (err) {
      console.error("Translation error:", err);
    }
  };

  const swapLanguages = () => {
    setFromLang(toLang);
    setToLang(fromLang);
    setInputText(outputText);
    setOutputText(inputText);
  };

  return (
    <div className="flex justify-center items-start h-full w-full overflow-y-auto px-4 pt-24">
      <div className="max-w-4xl w-full bg-base-100 shadow-xl rounded-xl p-6">
        <h1 className="text-3xl font-bold mb-6 text-center">Language Translator</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="label font-semibold">From</label>
            <select
              className="select select-bordered w-full"
              value={fromLang}
              onChange={(e) => setFromLang(e.target.value)}
            >
              {Object.entries(languages).map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
            <textarea
              className="textarea textarea-bordered w-full mt-3"
              rows={8}
              placeholder="Enter text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
          </div>

          <div>
            <label className="label font-semibold">To</label>
            <select
              className="select select-bordered w-full"
              value={toLang}
              onChange={(e) => setToLang(e.target.value)}
            >
              {Object.entries(languages).map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
            <textarea
              className="textarea textarea-bordered w-full mt-3"
              rows={8}
              placeholder="Translated text"
              value={outputText}
              readOnly
            />
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center justify-center mt-6">
          <button className="btn btn-primary" onClick={translateText}>
            Translate
          </button>
          <button className="btn btn-outline flex items-center gap-2" onClick={swapLanguages}>
            <ArrowRightLeft className="w-4 h-4" />
            Swap
          </button>
        </div>
      </div>
    </div>
  );
};

export default Translator;
