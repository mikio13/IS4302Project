import { useState } from 'react';

export default function UserRegistration() {
    const [name, setName] = useState('');
    const [nric, setNric] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();

        const response = await fetch('http://localhost:3000/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, nric }),
        });

        if (response.ok) {
            const user = await response.json();
            console.log('User created:', user);
            setMessage('✅ Registration successful!');
            setName('');
            setNric('');
        } else {
            console.error('Failed to create user');
            setMessage('❌ Registration failed.');
        }

        setTimeout(() => setMessage(''), 3000); // Clear message after 3 seconds
    };

    return (
        <div className="form-card">
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
                <button type="submit">Register</button>
                {message && <p className="message">{message}</p>}
            </form>
        </div>
    );
}