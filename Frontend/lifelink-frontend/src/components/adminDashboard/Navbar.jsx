import "../../styles/Navbar.css"

import profile from "../../assets/imgs/profile.svg"
import { MdOutlineNotificationsActive } from "react-icons/md";

export default function Navbar(){
    return(
        <>
            <div  className="navbar">
                <h2>Welcome Back, Admin</h2>
                <div className="nav-info">
                    <MdOutlineNotificationsActive className="admin-icon"/>
                    <div className="admin-info">
                        <img src={profile} alt="profile" width="40px" height="40px" />
                        <div className="admin-name">
                            <h3>Nour Merhi</h3>
                            <small>Administrator</small>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}