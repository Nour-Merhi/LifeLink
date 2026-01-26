import "../../../styles/MemoryGame.css";

export default function SingleCard({card, handleChoice, flipped, disabled}){

    const handleClick = () => {
        if(!disabled){
           handleChoice(card)
        }
    }

    return (
        <div key={card.id} className="memory-card">
            <div className={flipped ? "flipped" : ""}>
                <div className="front">
                    <img src={card.src} alt="card-front" />
                </div>
                <div className="back"
                     onClick={handleClick}
                ></div>
            </div>
        </div>
    )
}