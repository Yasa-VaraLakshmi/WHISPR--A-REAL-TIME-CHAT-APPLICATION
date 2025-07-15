import { useState } from "react";
import { ArrowRightLeft } from "lucide-react";

const CurrencyConverter = () => {
  const [amount, setAmount] = useState("");
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("INR");
  const [convertedAmount, setConvertedAmount] = useState(null);

  const currencyOptions = [
    "USD", "EUR", "GBP", "INR", "JPY", "AUD", "CAD", "CHF", "CNY", "SGD",
    "ZAR", "NZD", "SEK", "NOK", "DKK", "MXN", "BRL", "RUB", "HKD", "TWD",
    "THB", "MYR", "IDR", "PHP", "KRW", "PLN", "CZK", "HUF", "AED", "SAR",
    "TRY", "EGP", "NGN", "PKR", "BDT", "LKR", "VND", "KWD", "QAR", "OMR", "BHD",
  ];

  const convertCurrency = async () => {
    if (!amount || isNaN(amount)) return;

    try {
      const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
      const data = await res.json();
      const rate = data.rates[toCurrency];
      const result = parseFloat(amount) * rate;
      setConvertedAmount(result.toFixed(2));
    } catch (error) {
      console.error("Error fetching exchange rates:", error);
      alert("Failed to fetch exchange rates.");
    }
  };

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setConvertedAmount(null);
  };

  return (
    <div className="flex justify-center items-start h-full w-full overflow-y-auto px-4 pt-24">
      {/* pt-24 ensures it's not behind the navbar */}
      <div className="max-w-xl w-full bg-base-100 shadow-xl rounded-xl p-6">
        <h1 className="text-3xl font-bold mb-6 text-center">Currency Converter</h1>

        <div className="form-control w-full mb-4">
          <label className="label">
            <span className="label-text">Amount</span>
          </label>
          <input
            type="number"
            placeholder="Enter amount"
            className="input input-bordered"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">From</span>
            </label>
            <select
              className="select select-bordered"
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value)}
            >
              {currencyOptions.map((cur) => (
                <option key={cur} value={cur}>{cur}</option>
              ))}
            </select>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">To</span>
            </label>
            <select
              className="select select-bordered"
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value)}
            >
              {currencyOptions.map((cur) => (
                <option key={cur} value={cur}>{cur}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-between items-center gap-4 mb-4">
          <button className="btn btn-primary w-full" onClick={convertCurrency}>
            Convert
          </button>
          <button className="btn btn-outline" onClick={swapCurrencies}>
            <ArrowRightLeft className="w-5 h-5" />
          </button>
        </div>

        {convertedAmount && (
          <div className="mt-4 text-center text-lg font-semibold">
            Converted Amount:{" "}
            <span className="text-primary">{convertedAmount} {toCurrency}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CurrencyConverter;
