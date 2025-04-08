import React from "react";

const QueueTips = () => { //Just some general text for users
    return (
        <>
            <h3 className="queue-tips-heading">Queue Tips</h3>
            <div className="queue-tips-container">
                <div className="queue-tips">
                    <div className="tip">
                        <img src="/stay-signed-in.svg" alt="Stay Signed In" className="tip-icon" />
                        <div>
                            <h4>Stay Signed In</h4>
                            <p>Remain signed in to your account for the entire sale.</p>
                        </div>
                    </div>
                    <div className="tip">
                        <img src="/browser-open.svg" alt="Keep Browser Open" className="tip-icon" />
                        <div>
                            <h4>Keep Browser Open</h4>
                            <p>Don’t close or refresh this page until it's your turn.</p>
                        </div>
                    </div>
                    <div className="tip">
                        <img src="/verified-account.svg" alt="Verified Account" className="tip-icon" />
                        <div>
                            <h4>Use Verified Accounts</h4>
                            <p>Only verified wallets can complete the purchase.</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default QueueTips;