import Navbar from "../components/Navbar"
import bloodIllustration from "../assets/illustrations/blood_home.svg"

export default function Home(){

    return (
        <>
        <Navbar />
        <section id="hero">
            <div id="text-img">
                <div className="hero-info">
                    <h1>BE THE </h1>
                    <h1>LINK THAT SAVES A LIFE</h1>
                    <p>Join LifeLink in connecting donors, hospitals and patients to save lives through blood, organ, and financial donations</p>
                </div>
                <div className="first-illustration">
                    <img src={bloodIllustration} alt=" illustration for blood donation" />
                </div>
            </div>

            <div className="wave-illustartion">
                <svg className="wave"
                    viewBox="0 0 1082 802" 
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path d="M0.5 0C0.499736 164 53.5 318 168.501 401C283.501 484 511.501 501.5 633.5 452C753.467 403.325 747 704 811.5 755.5C868.312 800.862 976.5 811.5 1082 792V0H382.924H0.5Z" fill="#F12C31"/>
                </svg>
            </div>

            
        </section>
        </>
    )
}