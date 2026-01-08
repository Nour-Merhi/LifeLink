import QuizCards from "./InterfaceComponents/QuizCards";

export default function GameInterface() {
    return (
        <div className=" quizzlit-section h-screen w-screen">
            <div className="circle-container">
                <div className="circle-red animate-soft-pulse"></div>
                <div className="circle-purple animate-soft-pulse"></div>
                <div className="circle-red circle-bottom-right animate-soft-pulse"></div>
                <div className="circle-purple circle-bottom-right animate-soft-pulse"></div>
            </div>

            <div className="game-interface-container">
                <QuizCards />
            </div>
        </div>
    );
}