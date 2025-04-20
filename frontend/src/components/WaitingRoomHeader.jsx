const WaitingRoomHeader = ({ eventName }) => {
    return (
        <div className="masthead">
            <div className="masthead-bg" />
            <div className="masthead-content">
                <img className="event-poster" src="/eventImage.jpg" alt="Event Poster" />
                <div className="masthead-text left-aligned">
                    <p>
                        <span>03 May 2025 (Sat.) | 04 May 2025 (Sun.)</span>
                        <span className="sep"> / </span>
                        <span>Singapore Indoor Stadium</span>
                    </p>
                    <h1>{eventName}</h1>
                </div>
            </div>
        </div>
    );
};
export default WaitingRoomHeader;