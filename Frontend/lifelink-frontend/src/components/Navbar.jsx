import lifelink_logo from "../assets/imgs/lifelink_logo.svg"

export default function Navbar(){
    return (
        <>
        <div id="navigation">
            <img src={lifelink_logo} alt="life link logo" />
            <div className="nav-bar">
                    <span>Home</span>
                    <span>Donate</span>
                    <span>Let's Play</span>
                    <span>Contact Us</span>
                <div className="btn">
                    <button type="button">Signin</button>
                </div>
            </div>
            
        </div>
        </>
    )
}