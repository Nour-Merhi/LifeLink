import { useState } from "react";
import { IoClose } from "react-icons/io5";
import { SpinnerDotted } from 'spinners-react';

export default function CreateNotificationForm({ onClose }) {
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    return (
        <section className="modal">
            <div className="modal-container">
                {showSuccess && (
                    <div className="success-overlay">
                        <div className="success-check">
                            <svg viewBox="0 0 52 52">
                                <path className="checkmark__circle" d="M26 2c13.255 0 24 10.745 24 24S39.255 50 26 50 2 39.255 2 26 12.745 2 26 2z"/>
                                <path className="checkmark__check" d="M14 27l7 7 17-17"/>
                            </svg>
                            <div className="success-text">Notification created successfully</div>
                        </div>
                    </div>
                )}
                {!loading ? (
                    <>
                        <div className="modal-title">
                            <h2>Create Notification</h2>
                            <button onClick={onClose}><IoClose /></button>
                        </div>
                        <div className="modal-form">
                            <p>Notification form will be implemented here</p>
                        </div>
                    </>
                ) : (
                    <div className="loader">
                        <SpinnerDotted size={60} thickness={125} speed={100} color="#f01010ff" />
                        <h3>Creating Notification...</h3>
                    </div>
                )}
            </div>
        </section>
    );
}

