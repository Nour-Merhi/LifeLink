import { useState, useEffect } from 'react';

const cardImages = [
    {id: 1, image:  'assets/memory/card1.png'},
    {id: 2, image:  'assets/memory/card2.png'},
    {id: 3, image:  'assets/memory/card3.png'},
    {id: 4, image:  'assets/memory/card4.png'},
    {id: 5, image:  'assets/memory/card5.png'},
    {id: 6, image:  'assets/memory/card6.png'},
    {id: 7, image:  'assets/memory/card7.png'},   
]

export default function MemoryGame(){
    conts [cards, setCards] = useState([]);

    //Shufle cards
    const shuffleCards = () => [
        
    ]

    return (
        <AnimatePresence mode="wait">
            <motion.div
            key={cards.length}
            initial={{ opacity: 0, y:100}}
            animate={{ opacity:1, y: 0}}
            exit={{ opacity: 0, y: -100}}
            transition={{ duration: 0.5}}
            >
                 <section className="memory-game-section">
                    <div className="memorr-game-container">
                        <div className="memory-game-header">
                            <h2 className="memory-game-title">Memory Game</h2>
                        </div>
                        <div className="memory-game-content">
                            <div className="memory-game-cards">
                                <div className="memory-game-card">
                                    <div className="memory-game-card-front">
                                        <img src={cards.image} alt={card.title} />
                                    </div>
                                    <div classNamw="memory-card-back">
                                        <img src={card.image} alt={card.title} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </motion.div>
        </AnimatePresence>
    )
}