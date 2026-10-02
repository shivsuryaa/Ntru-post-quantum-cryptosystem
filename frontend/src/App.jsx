import { useState } from "react";
import "./App.css";

// ======================================================
// API CONFIGURATION
// ======================================================

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

// ======================================================
// CONVERT INPUT STRING TO COEFFICIENT ARRAY
// Example:
// "1 0 -1 1 0"
// becomes
// [1, 0, -1, 1, 0]
// ======================================================

function parsePolynomial(value) {
  if (!value.trim()) {
    return [];
  }

  return value.trim().split(/\s+/).filter(Boolean).map(Number);
}

// ======================================================
// CONVERT COEFFICIENT ARRAY TO POLYNOMIAL
//
// Example:
// [2, 0, -1, 3, 1]
//
// becomes:
//
// 2x^4 - x^2 + 3x + 1
// ======================================================

function displayPolynomial(coefficients) {
  if (!coefficients || coefficients.length === 0) {
    return "0";
  }

  const n = coefficients.length;
  const terms = [];

  coefficients.forEach((coefficient, index) => {
    coefficient = Number(coefficient);

    if (coefficient === 0) {
      return;
    }

    const power = n - index - 1;
    const absolute = Math.abs(coefficient);

    let term = "";

    // -----------------------------
    // Coefficient
    // -----------------------------

    if (power === 0) {
      term = `${absolute}`;
    } else if (absolute !== 1) {
      term = `${absolute}`;
    }

    // -----------------------------
    // x and exponent
    // -----------------------------

    if (power > 0) {
      term += "x";

      if (power > 1) {
        term += `^${power}`;
      }
    }

    // -----------------------------
    // Sign
    // -----------------------------

    if (terms.length === 0) {
      if (coefficient < 0) {
        term = "-" + term;
      }
    } else {
      if (coefficient < 0) {
        term = "- " + term;
      } else {
        term = "+ " + term;
      }
    }

    terms.push(term);
  });

  return terms.length > 0 ? terms.join(" ") : "0";
}

// ======================================================
// MAIN APPLICATION
// ======================================================

function App() {
  // ----------------------------------------------------
  // PAGE NAVIGATION
  // ----------------------------------------------------

  const [page, setPage] = useState("home");

  // ----------------------------------------------------
  // NTRU PARAMETERS
  // ----------------------------------------------------

  const [n, setN] = useState(5);
  const [p, setP] = useState(3);
  const [q, setQ] = useState(32);

  // ----------------------------------------------------
  // POLYNOMIAL INPUTS
  // ----------------------------------------------------

  const [f, setF] = useState("");
  const [g, setG] = useState("");

  const [message, setMessage] = useState("");
  const [r, setR] = useState("");

  // ----------------------------------------------------
  // RESULTS
  // ----------------------------------------------------

  const [keys, setKeys] = useState(null);

  const [encrypted, setEncrypted] = useState(null);

  const [decrypted, setDecrypted] = useState(null);

  // ----------------------------------------------------
  // APPLICATION STATUS
  // ----------------------------------------------------

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  // ====================================================
  // GENERATE NTRU KEYS
  // ====================================================

  const generateKeys = async () => {
    setError("");
    setLoading(true);

    try {
      if (!f.trim() || !g.trim()) {
        throw new Error("Please enter both f and g polynomials.");
      }

      const response = await fetch(`${API_URL}/generate-keys`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          n: Number(n),
          p: Number(p),
          q: Number(q),

          f: parsePolynomial(f),
          g: parsePolynomial(g),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Key generation failed.");
      }

      setKeys(data.keys);

      setEncrypted(null);
      setDecrypted(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ====================================================
  // ENCRYPT MESSAGE
  // ====================================================

  const encryptMessage = async () => {
    if (!keys) {
      setError("Please generate the NTRU keys first.");

      return;
    }

    if (!message.trim()) {
      setError("Please enter the message polynomial.");

      return;
    }

    if (!r.trim()) {
      setError("Please enter the random polynomial r.");

      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/encrypt`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          n: Number(n),

          q: Number(q),

          h: keys.h,

          r: parsePolynomial(r),

          message: parsePolynomial(message),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Encryption failed.");
      }

      setEncrypted(data.encrypted);

      setDecrypted(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ====================================================
  // DECRYPT MESSAGE
  // ====================================================

  const decryptMessage = async () => {
    if (!keys) {
      setError("Please generate keys first.");

      return;
    }

    if (!encrypted) {
      setError("Please encrypt a message first.");

      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/decrypt`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          n: Number(n),

          p: Number(p),

          q: Number(q),

          f: keys.f,

          fp: keys.fp,

          encrypted: encrypted,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Decryption failed.");
      }

      setDecrypted(data.decrypted);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ====================================================
  // VERIFICATION
  // ====================================================

  const originalMessage = message ? parsePolynomial(message) : [];

  const normalize = (array) => {
    if (!array) {
      return [];
    }

    return array.map(
      (value) => ((Number(value) % Number(p)) + Number(p)) % Number(p),
    );
  };

  const verified =
    decrypted !== null &&
    JSON.stringify(normalize(originalMessage)) ===
      JSON.stringify(normalize(decrypted));

  // ====================================================
  // UI
  // ====================================================

  return (
    <div className="app">
      {/* ================================================
          NAVIGATION BAR
      ================================================= */}

      <nav className="navbar">
        <div className="logo" onClick={() => setPage("home")}>
          NTRU<span>Secure</span>
        </div>

        <div className="navLinks">
          <button onClick={() => setPage("home")}>Home</button>

          <button onClick={() => setPage("keys")}>Key Generation</button>

          <button onClick={() => setPage("encrypt")}>Encryption</button>

          <button onClick={() => setPage("decrypt")}>Decryption</button>
        </div>
      </nav>

      {/* ================================================
          ERROR MESSAGE
      ================================================= */}

      {error && <div className="error">{error}</div>}

      {/* ================================================
          HOME PAGE
      ================================================= */}

      {page === "home" && (
        <main className="hero">
          <div className="heroContent">
            <p className="tag">POST-QUANTUM CRYPTOGRAPHY</p>

            <h1>
              Secure Data with
              <span> NTRU Cryptography</span>
            </h1>

            <p className="heroText">
              An interactive implementation of the NTRU lattice-based public-key
              cryptosystem for key generation, encryption, decryption and
              message verification.
            </p>

            <button className="primary" onClick={() => setPage("keys")}>
              Get Started
            </button>
          </div>

          <div className="architecture">
            <div>Generate Keys</div>

            <span>↓</span>

            <div>Encrypt Message</div>

            <span>↓</span>

            <div>Decrypt Message</div>

            <span>↓</span>

            <div>Verify Message</div>
          </div>
        </main>
      )}

      {/* ================================================
          KEY GENERATION PAGE
      ================================================= */}

      {page === "keys" && (
        <main className="container">
          <div className="pageHeader">
            <p className="tag">STEP 01</p>

            <h2>NTRU Key Generation</h2>

            <p>
              Configure the NTRU parameters and polynomial values to generate
              the public and private keys.
            </p>
          </div>

          <div className="card">
            <h3>Cryptographic Parameters</h3>

            <div className="threeColumns">
              <div className="field">
                <label>Polynomial Degree (n)</label>

                <input
                  type="number"
                  min="2"
                  value={n}
                  onChange={(e) => setN(e.target.value)}
                />
              </div>

              <div className="field">
                <label>Small Modulus (p)</label>

                <input
                  type="number"
                  min="2"
                  value={p}
                  onChange={(e) => setP(e.target.value)}
                />
              </div>

              <div className="field">
                <label>Large Modulus (q)</label>

                <input
                  type="number"
                  min="2"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
            </div>

            {/* f */}

            <div className="field">
              <label>Private Polynomial f(x)</label>

              <input
                value={f}
                onChange={(e) => setF(e.target.value)}
                placeholder="Example: 1 0 -1 1 0"
              />

              {f.trim() && (
                <small>f(x) = {displayPolynomial(parsePolynomial(f))}</small>
              )}
            </div>

            {/* g */}

            <div className="field">
              <label>Polynomial g(x)</label>

              <input
                value={g}
                onChange={(e) => setG(e.target.value)}
                placeholder="Example: 0 1 -1 0 1"
              />

              {g.trim() && (
                <small>g(x) = {displayPolynomial(parsePolynomial(g))}</small>
              )}
            </div>

            <p>Enter polynomial coefficients separated by spaces.</p>

            <button
              className="primary full"
              onClick={generateKeys}
              disabled={loading}
            >
              {loading ? "Generating Keys..." : "Generate Keys"}
            </button>
          </div>

          {/* KEY RESULTS */}

          {keys && (
            <div className="results">
              <div className="resultCard">
                <p>Public Key h(x)</p>

                <code>h(x) = {displayPolynomial(keys.h)}</code>
              </div>

              <div className="resultCard">
                <p>Private Key Inverse f⁻¹ mod p</p>

                <code>fp(x) = {displayPolynomial(keys.fp)}</code>
              </div>

              <button className="primary" onClick={() => setPage("encrypt")}>
                Continue to Encryption
              </button>
            </div>
          )}
        </main>
      )}

      {/* ================================================
          ENCRYPTION PAGE
      ================================================= */}

      {page === "encrypt" && (
        <main className="container">
          <div className="pageHeader">
            <p className="tag">STEP 02</p>

            <h2>Message Encryption</h2>

            <p>
              Encrypt a message polynomial using the generated NTRU public key.
            </p>
          </div>

          {!keys ? (
            <div className="notice">
              <p>Generate the NTRU keys before performing encryption.</p>

              <button className="primary" onClick={() => setPage("keys")}>
                Generate Keys
              </button>
            </div>
          ) : (
            <>
              <div className="resultCard">
                <p>Current Public Key</p>

                <code>h(x) = {displayPolynomial(keys.h)}</code>
              </div>

              <div className="card">
                {/* MESSAGE */}

                <div className="field">
                  <label>Message Polynomial m(x)</label>

                  <input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Example: 1 0 1 0 0"
                  />

                  {message.trim() && (
                    <small>
                      m(x) = {displayPolynomial(parsePolynomial(message))}
                    </small>
                  )}
                </div>

                {/* RANDOM POLYNOMIAL */}

                <div className="field">
                  <label>Random Polynomial r(x)</label>

                  <input
                    value={r}
                    onChange={(e) => setR(e.target.value)}
                    placeholder="Example: 0 1 -1 0 1"
                  />

                  {r.trim() && (
                    <small>
                      r(x) = {displayPolynomial(parsePolynomial(r))}
                    </small>
                  )}
                </div>

                <button
                  className="primary full"
                  onClick={encryptMessage}
                  disabled={loading}
                >
                  {loading ? "Encrypting..." : "Encrypt Message"}
                </button>
              </div>
            </>
          )}

          {/* ENCRYPTED RESULT */}

          {encrypted && (
            <div className="results">
              <div className="resultCard">
                <p>Encrypted Message</p>

                <code>e(x) = {displayPolynomial(encrypted)}</code>
              </div>

              <button className="primary" onClick={() => setPage("decrypt")}>
                Continue to Decryption
              </button>
            </div>
          )}
        </main>
      )}

      {/* ================================================
          DECRYPTION PAGE
      ================================================= */}

      {page === "decrypt" && (
        <main className="container">
          <div className="pageHeader">
            <p className="tag">STEP 03</p>

            <h2>Message Decryption</h2>

            <p>Recover the original message using the NTRU private key.</p>
          </div>

          {!encrypted ? (
            <div className="notice">
              <p>Encrypt a message before performing decryption.</p>

              <button className="primary" onClick={() => setPage("encrypt")}>
                Go to Encryption
              </button>
            </div>
          ) : (
            <>
              {/* CIPHERTEXT */}

              <div className="resultCard">
                <p>Ciphertext</p>

                <code>e(x) = {displayPolynomial(encrypted)}</code>
              </div>

              <button
                className="primary full"
                onClick={decryptMessage}
                disabled={loading}
              >
                {loading ? "Decrypting..." : "Decrypt Message"}
              </button>
            </>
          )}

          {/* DECRYPTED RESULT */}

          {decrypted && (
            <div className="results">
              <div className="resultCard">
                <p>Original Message</p>

                <code>m(x) = {displayPolynomial(originalMessage)}</code>
              </div>

              <div className="resultCard">
                <p>Recovered Message</p>

                <code>m'(x) = {displayPolynomial(decrypted)}</code>
              </div>

              {/* VERIFICATION */}

              <div
                className={
                  verified ? "verification success" : "verification failure"
                }
              >
                {verified
                  ? "✓ Decryption Successful — Original and recovered messages match."
                  : "✕ Verification Failed — Original and recovered messages do not match."}
              </div>
            </div>
          )}
        </main>
      )}

      {/* ================================================
          FOOTER
      ================================================= */}

      <footer> Nth--degree | NTRU Post-Quantum Cryptosystem</footer>
    </div>
  );
}

export default App;
