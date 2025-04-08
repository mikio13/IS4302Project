import { useState } from "react";
import { registerUser } from "../utils/contractServices";

// Displays the registration form for new users
export default function UserRegistration({ onRegistered }) {
    const [name, setName] = useState("");
    const [nric, setNric] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    // Handles the form submission and registers the user on-chain
    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            // This sends a transaction to UserRegistry.sol to register the user
            await registerUser(nric, name); // Storing NRIC in plaintext for demo purposes
            setMessage("✅ Registration successful!");
            setName("");
            setNric("");
            onRegistered(); // Notifies App.jsx to proceed with loading the UserDashboard page
        } catch (error) {
            console.error("Registration error:", error);
            if (error.message.includes("Already registered")) {
                setMessage("❌ You have already registered.");
            } else {
                setMessage("❌ Registration failed.");
            }
        } finally {
            setLoading(false);
            // Auto-hide message after 4 seconds
            setTimeout(() => setMessage(""), 4000);
        }
    };

    return (
        <div className="form-card">
            <h2>Please Register</h2>
            <form onSubmit={handleSubmit}>
                {/* Input field for user's name */}
                <input
                    type="text"
                    value={name}
                    placeholder="Name"
                    onChange={(e) => setName(e.target.value)}
                    required
                />

                {/* Input field for user's NRIC */}
                <input
                    type="text"
                    value={nric}
                    placeholder="NRIC"
                    onChange={(e) => setNric(e.target.value)}
                    required
                />

                {/* Submit button */}
                <button type="submit" disabled={loading}>
                    {loading ? "Registering..." : "Register"}
                </button>

                {/* Display success or error message */}
                {message && <p className="message">{message}</p>}
            </form>
        </div>
    );
}