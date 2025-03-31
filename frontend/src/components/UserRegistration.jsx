import { useState } from "react";
import { registerUser } from "../utils/contractServices";

export default function UserRegistration({ onRegistered }) {
    const [name, setName] = useState("");
    const [nric, setNric] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            await registerUser(nric, name); // Storing NRIC in plaintext for demo purposes
            setMessage("✅ Registration successful!");
            setName("");
            setNric("");
            onRegistered(); // Inform parent component that registration is done
        } catch (error) {
            console.error("Registration error:", error);
            if (error.message.includes("Already registered")) {
                setMessage("❌ You have already registered.");
            } else {
                setMessage("❌ Registration failed.");
            }
        } finally {
            setLoading(false);
            setTimeout(() => setMessage(""), 4000);
        }
    };

    return (
        <div className="form-card">
            <h2>Please Register</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={name}
                    placeholder="Name"
                    onChange={(e) => setName(e.target.value)}
                    required
                />
                <input
                    type="text"
                    value={nric}
                    placeholder="NRIC"
                    onChange={(e) => setNric(e.target.value)}
                    required
                />
                <button type="submit" disabled={loading}>
                    {loading ? "Registering..." : "Register"}
                </button>
                {message && <p className="message">{message}</p>}
            </form>
        </div>
    );
}