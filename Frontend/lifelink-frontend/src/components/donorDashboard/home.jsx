import { FaHeartCirclePlus } from "react-icons/fa6";
import { FaHandsHoldingCircle } from "react-icons/fa6";
import { FaHandHoldingHeart } from "react-icons/fa";
import { IoMdArrowForward } from "react-icons/io";
import { useNavigate } from "react-router-dom";

export default function Home(){
    const navigate = useNavigate();
    return (
        <>
        <div className="home-layout ">
            <div className="home-action div-1 donor-container p-5">
                <button onClick={() => navigate('/donation/home-blood-donation')}>
                    <FaHeartCirclePlus className="text-5xl text-red-600 mb-4"/>
                    <h2 className="text-2xl text-left font-bold">Schedule<br/>Blood Donation</h2>
                    <p className="text-gray-500 !text-sm !text-left">Register blood donation appointment</p>
                </button>
            </div>
            <div className="home-action div-2 donor-container p-5">
                <button onClick={() => navigate('/donation/alive-organ-donation')}>
                    <FaHandsHoldingCircle className="text-5xl text-green-600 mb-4"/>
                    <h2 className="text-2xl text-left font-bold">Register<br/>Organ Donation</h2>
                    <p className="text-gray-500 !text-sm !text-left">Pledge to save lives</p>
                </button>
            </div>
            <div className="home-action div-3 donor-container p-5">
                <button onClick={() => navigate('/donation/financial-support')}>
                    <FaHandHoldingHeart className="text-5xl text-purple-600 mb-4"/>
                    <h2 className="text-2xl text-left font-bold">Provide<br/>Financial Support</h2>
                    <p className="text-gray-500 !text-sm !text-left">Contribute to patient care</p>
                </button>
            </div>

            <div className="level-progress div-4 donor-container p-5">
                <div className="level-progress-header">
                    <div className="level-progress-title-section">
                        <h2 className="level-progress-title">Level 2 Progress</h2>
                        <p className="level-progress-subtitle">400 Xp until level 3</p>
                    </div>
                    <div className="level-progress-xp-section">
                        <p className="level-progress-xp-value">600</p>
                        <p className="level-progress-xp-label">Total XP</p>
                    </div>
                </div>
                <div className="level-progress-bar">
                    <div className="level-progress-bar-fill" style={{ width: '60%' }}></div>
                </div>
            </div>
            <div className="level-progress-info div-5 donor-container p-5">
                <h2 className="text-xl font-bold mb-4">Progress</h2>
                <div className="progress-details">
                    <div className="progress-metric">
                        <p className="progress-label">You have donated</p>
                        <p className="progress-value">5 times</p>
                    </div>
                    <div className="progress-metric">
                        <p className="progress-label">You've saved</p>
                        <p className="progress-value">12 lives</p>
                    </div>
                    <div className="progress-metric">
                        <p className="progress-label">Total XP earned</p>
                        <p className="progress-value">600 xp</p>
                    </div>
                </div>
            </div>

            <div className="upcoming-appointments div-6">
                <h2 className="text-xl font-bold mb-3 pl-2">Upcoming Appointments</h2>
                <div className="donor-container table-design ">
                    <table className="h1-table p-2">
                        <thead>
                            <tr>
                                <th className="col-hospital text-left">Hospital</th>
                                <th className="col-date">Date</th>
                                <th className="col-time">Time</th>
                                <th className="col-actions"></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="col-hospital">Al Rasool Al Aazam Hospital</td>
                                <td className="col-date">Aug 23</td>
                                <td className="col-time">10:00 AM</td>
                                <td className="col-actions">
                                    <IoMdArrowForward className="cursor-pointer" />
                                </td>
                            </tr>
                            <tr>
                                <td className="col-hospital">Al Rasool Al Aazam Hospital</td>
                                <td className="col-date">Aug 23</td>
                                <td className="col-time">10:00 AM</td>
                                <td className="col-actions">
                                    <IoMdArrowForward className="cursor-pointer" />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="donation-history div-7">
                <h2 className="text-xl font-bold mb-3 pl-2">Donation History</h2>
                <div className="donor-container table-design">
                    <table className="h1-table p-2">
                        <thead>
                            <tr>
                                <th className="col-donation-type text-left">Donation Type</th>
                                <th className="col-status">Status</th>
                                <th className="col-date">Date</th>
                                <th className="col-reward">Reward</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="col-donation-type">Blood Donation</td>
                                <td className="col-status">
                                    <span style={{ color: '#16a34a' }}>Completed</span>
                                </td>
                                <td className="col-date">Jul 12</td>
                                <td className="col-reward">+150 XP</td>
                            </tr>
                            <tr>
                                <td className="col-donation-type">Organ Donation</td>
                                <td className="col-status">
                                    <span style={{ color: '#f5cf26' }}>Pending</span>
                                </td>
                                <td className="col-date">Jul 12</td>
                                <td className="col-reward">loading...</td>
                            </tr>
                            <tr>
                                <td className="col-donation-type">Blood Donation</td>
                                <td className="col-status">
                                    <span style={{ color: '#16a34a' }}>Completed</span>
                                </td>
                                <td className="col-date">Jul 12</td>
                                <td className="col-reward">+150 XP</td>
                            </tr>
                            <tr>
                                <td className="col-donation-type">Blood Donation</td>
                                <td className="col-status">
                                    <span style={{ color: '#E92C30' }}>Canceled</span>
                                </td>
                                <td className="col-date">Jul 12</td>
                                <td className="col-reward">+0 XP</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        </>
    )
}