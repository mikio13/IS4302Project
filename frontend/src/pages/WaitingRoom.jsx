import React from "react";
import "./WaitingRoom.css";

const WaitingRoom = () => {
    return (
        <div className="waiting-room-page">
            {/* ========== MASTHEAD SECTION ========== */}
            <div className="masthead">
                <div className="masthead-bg" />
                <div className="masthead-content">
                    <img
                        className="event-poster"
                        src="/eventImage.jpg"
                        alt="Event Poster"
                    />
                    <div className="masthead-text left-aligned">
                        <p>
                            <span>03 May 2025 (Sat.) | 04 May 2025 (Sun.)</span>
                            <span className="sep"> / </span>
                            <span>Singapore Indoor Stadium</span>
                        </p>
                        <h1>TAEYEON CONCERT - The TENSE in SINGAPORE</h1>
                    </div>
                </div>
            </div>

            {/* ========== MAIN CONTENT ========== */}
            <div className="content-container">
                {/* WAITING ROOM BOX */}
                <div className="waiting-box">
                    <h2>Thank You for Joining the Waiting Room</h2>
                    <p>
                        When the sale begins, your screen will automatically refresh and
                        you will be able to buy your ticket.
                    </p>
                    <p className="people-ahead">
                        Approximately <strong>3000</strong> People Ahead
                    </p>
                    <div className="progress-bar-container">
                        <div className="progress-bar-fill" style={{ width: "25%" }} />
                    </div>
                </div>

                {/* QUEUE TIPS HEADER */}
                <h3 className="queue-tips-heading">Queue Tips</h3>

                {/* QUEUE TIPS BOX */}
                <div className="queue-tips-container">
                    <div className="queue-tips">
                        <div className="tip">
                            <img src="/stay-signed-in.svg" alt="Stay Signed In" className="tip-icon" />
                            <div>
                                <h4>Stay Signed In</h4>
                                <p>Remain signed in to your account on one browser for the entire sale.</p>
                            </div>
                        </div>
                        <div className="tip">
                            <img src="/browser-open.svg" alt="Keep Browser Open" className="tip-icon" />
                            <div>
                                <h4>Keep Browser Open</h4>
                                <p>Leave your browser window open and do not refresh.</p>
                            </div>
                        </div>
                        <div className="tip">
                            <img src="/verified-account.svg" alt="Verified Account" className="tip-icon" />
                            <div>
                                <h4>Use Only Verified Accounts</h4>
                                <p>Only Singpass verified accounts can purchase tickets.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WaitingRoom;