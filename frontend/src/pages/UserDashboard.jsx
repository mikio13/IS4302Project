export default function UserDashboard({ account }) {
    return (
        <div className="dashboard">
            <h2>Welcome!</h2>
            <p>Your account: {account}</p>
            <p>This is your dashboard, where you'll interact with tickets.</p>
        </div>
    );
}  