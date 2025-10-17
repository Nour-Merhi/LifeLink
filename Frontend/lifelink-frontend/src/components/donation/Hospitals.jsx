
import { FaHospital } from "react-icons/fa";
import { FaLocationDot } from "react-icons/fa6";
import { FaCar } from "react-icons/fa";
import { FaStar } from "react-icons/fa";

import "../../styles/BloodDonation.css"

export default function Hospitals ({ onSelect }){
   
    return (
        <div className="search-hospital">
            <div className="urgent-needs">
                <h1>Urgent Need:</h1>

                <button className="hospital-info"
                        type="button" 
                        onClick={() => onSelect({
                            id: 1,
                            name: "AL Rasool Al Aazam Hospital",
                            bloodType: "B+",
                            address: "Airport Street, Beirut",
                            slots: 12
                        })} >
                    <div className="hospital-icon">
                        <FaHospital />
                    </div>

                    <div className="info">
                        <h2>AL Rasool Al Aazam Hospital <span className="urgent-blood-types animate-pulse bg-red-600">Urgent: B+</span></h2>
                        <div className="details">
                            <div className="location">
                                <FaLocationDot />
                                <small>Airpot Street, Beirut</small>
                            </div>

                            <div className="distance">
                                <FaCar />
                                <small>2.3km</small>
                            </div>

                            <div className="rating">
                                <FaStar className="text-yellow-400"/>
                                <FaStar className="text-yellow-400" />
                                <FaStar className="text-yellow-400" />
                                <FaStar className="text-yellow-400"/>
                                <small>(4)</small>
                            </div>
                        </div>
                    </div>

                    <div className="slots">
                        <h2>12</h2>
                        <small>Available Slots</small>
                    </div>
                </button>

                <button className="hospital-info"
                        type="button" 
                        onClick={() => onSelect(h)}
                >
                    <div className="hospital-icon">
                        <FaHospital />
                    </div>

                    <div className="info">
                        <h2>AL Rasool Al Aazam Hospital <span className="urgent-blood-types animate-pulse bg-red-600 ">Urgent: B+</span></h2>
                        <div className="details">
                            <div className="location">
                                <FaLocationDot />
                                <small>Airpot Street, Beirut</small>
                            </div>

                            <div className="distance">
                                <FaCar />
                                <small>2.3km</small>
                            </div>

                            <div className="rating">
                                <FaStar className="text-yellow-400"/>
                                <FaStar className="text-yellow-400" />
                                <FaStar className="text-yellow-400" />
                                <FaStar className="text-yellow-400"/>
                                <small>(4)</small>
                            </div>
                        </div>
                    </div>

                    <div className="slots">
                        <h2>12</h2>
                        <small>Available Slots</small>
                    </div>
                </button>
            </div>

             <div id="normal-register" className="urgent-needs">
                <h1 className="register-hospital">Registered Hospitals:</h1>

                <button id="registered-hospital" className="hospital-info"
                        type="button" 
                        onClick={() => onSelect(h)}
                >
                    <div className="hospital-icon">
                        <FaHospital />
                    </div>

                    <div className="info">
                        <h2>AL Rasool Al Aazam Hospital</h2>
                        <div className="details">
                            <div className="location">
                                <FaLocationDot />
                                <small>Airpot Street, Beirut</small>
                            </div>

                            <div className="distance">
                                <FaCar />
                                <small>2.3km</small>
                            </div>

                            <div className="rating">
                                <FaStar className="text-yellow-400"/>
                                <FaStar className="text-yellow-400" />
                                <FaStar className="text-yellow-400" />
                                <FaStar className="text-yellow-400"/>
                                <small>(4)</small>
                            </div>
                        </div>
                    </div>

                    <div className="slots">
                        <h2>12</h2>
                        <small>Available Slots</small>
                    </div>
                </button>

                <button id="registered-hospital" className="hospital-info"
                        type="button" 
                        onClick={() => onSelect(h)}
                >
                    <div className="hospital-icon">
                        <FaHospital />
                    </div>

                    <div className="info">
                        <h2>AL Rasool Al Aazam Hospital</h2>
                        <div className="details">
                            <div className="location">
                                <FaLocationDot />
                                <small>Airpot Street, Beirut</small>
                            </div>

                            <div className="distance">
                                <FaCar />
                                <small>2.3km</small>
                            </div>

                            <div className="rating">
                                <FaStar className="text-yellow-400"/>
                                <FaStar className="text-yellow-400" />
                                <FaStar className="text-yellow-400" />
                                <FaStar className="text-yellow-400"/>
                                <small>(4)</small>
                            </div>
                        </div>
                    </div>

                    <div className="slots">
                        <h2>12</h2>
                        <small>Available Slots</small>
                    </div>
                </button>
                <button id="registered-hospital" className="hospital-info"
                        type="button" 
                        onClick={() => onSelect(h)}
                >
                    <div className="hospital-icon">
                        <FaHospital />
                    </div>

                    <div className="info">
                        <h2>AL Rasool Al Aazam Hospital</h2>
                        <div className="details">
                            <div className="location">
                                <FaLocationDot />
                                <small>Airpot Street, Beirut</small>
                            </div>

                            <div className="distance">
                                <FaCar />
                                <small>2.3km</small>
                            </div>

                            <div className="rating">
                                <FaStar className="text-yellow-400"/>
                                <FaStar className="text-yellow-400" />
                                <FaStar className="text-yellow-400" />
                                <FaStar className="text-yellow-400"/>
                                <small>(4)</small>
                            </div>
                        </div>
                    </div>

                    <div className="slots">
                        <h2>12</h2>
                        <small>Available Slots</small>
                    </div>
                </button>
            </div>
        </div>
    )
}