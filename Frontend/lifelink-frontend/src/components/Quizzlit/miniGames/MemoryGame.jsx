import { useState, useEffect, useCallback } from "react";
import SingleCard from "./SingleCard";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../api/axios";
import "../../../styles/MemoryGame.css";

import Heart from "../../../assets/imgs/MemoryCards/heart.png";
import Kidneys from "../../../assets/imgs/MemoryCards/kidneys.png";
import Lunges from "../../../assets/imgs/MemoryCards/lunges.png";
import Liver from "../../../assets/imgs/MemoryCards/liver-organ.png";
import Stomach from "../../../assets/imgs/MemoryCards/stomach.png";
import BoneMarrow from "../../../assets/imgs/MemoryCards/bone-marrow.png";

const CARD_IMAGES = [
  { src: Heart, matched: false },
  { src: Kidneys, matched: false },
  { src: Liver, matched: false },
  { src: Lunges, matched: false },
  { src: Stomach, matched: false },
  { src: BoneMarrow, matched: false },
];

const BASE_XP = 50;
const PERFECT_TURNS = 6; // 6 pairs = 6 turns minimum
const BONUS_XP_MAX = 40;

function computeXp(turns) {
  const bonus = Math.max(0, BONUS_XP_MAX - (turns - PERFECT_TURNS) * 5);
  return BASE_XP + bonus;
}

export default function MemoryGame({
  embedded = false,
  onBack,
  onWin,
  minigameLevel,
  currentLevel = 1,
}) {
  const { user } = useAuth();
  const [cards, setCards] = useState([]);
  const [turns, setTurns] = useState(0);
  const [choiceOne, setChoiceOne] = useState(null);
  const [choiceTwo, setChoiceTwo] = useState(null);
  const [disabled, setDisabled] = useState(false);
  const [won, setWon] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);

  const shuffleCards = () => {
    const shuffled = [...CARD_IMAGES, ...CARD_IMAGES]
      .sort(() => Math.random() - 0.5)
      .map((c) => ({ ...c, id: Math.random() }));
    setChoiceOne(null);
    setChoiceTwo(null);
    setCards(shuffled);
    setTurns(0);
    setWon(false);
    setXpEarned(0);
  };

  const handleChoice = (card) => {
    if (disabled || won) return;
    if (card.matched || card === choiceOne || card === choiceTwo) return;
    choiceOne ? setChoiceTwo(card) : setChoiceOne(card);
  };

  const resetTurns = useCallback(() => {
    setChoiceOne(null);
    setChoiceTwo(null);
    setTurns((t) => t + 1);
    setDisabled(false);
  }, []);

  useEffect(() => {
    if (!choiceOne || !choiceTwo) return;
    setDisabled(true);
    if (choiceOne.src === choiceTwo.src) {
      setCards((prev) =>
        prev.map((c) =>
          c.src === choiceOne.src ? { ...c, matched: true } : c
        )
      );
      resetTurns();
    } else {
      const id = setTimeout(resetTurns, 1000);
      return () => clearTimeout(id);
    }
  }, [choiceOne, choiceTwo, resetTurns]);

  // Win detection: all matched (run only once when we transition to won)
  useEffect(() => {
    if (cards.length === 0 || won) return;
    const allMatched = cards.every((c) => c.matched);
    if (!allMatched) return;
    setWon(true);
    const xp = computeXp(turns);
    setXpEarned(xp);
    onWin?.(xp);
    if (user) {
      api
        .post("/api/quiz/minigame-complete", {
          game_type: "memory",
          xp_earned: xp,
          level: minigameLevel ?? currentLevel,
        })
        .catch(() => {});
    }
  }, [cards, turns, won, user, minigameLevel, currentLevel, onWin]);

  useEffect(() => {
    shuffleCards();
  }, []);

  const content = (
    <>
      <div className="memory-game-header">
        <div className="memory-game-header-left">
          {embedded && onBack && (
            <button
              type="button"
              className="memory-game-back-button"
              onClick={onBack}
            >
              ← Back to Quiz
            </button>
          )}
          <h2 className="memory-game-title">Memory Game</h2>
        </div>
        <div className="memory-game-header-right">
          <span className="memory-game-turns">Turns: {turns}</span>
          <button
            type="button"
            className="memory-game-new-button"
            onClick={shuffleCards}
          >
            New Game
          </button>
        </div>
      </div>

      {won ? (
        <div className="memory-game-win-overlay">
          <div className="memory-game-win-card">
            <h3 className="memory-game-win-title">You win!</h3>
            <p className="memory-game-win-xp">+{xpEarned} XP</p>
            <p className="memory-game-win-turns">
              Completed in {turns} turn{turns !== 1 ? "s" : ""}
            </p>
            <div className="memory-game-win-actions">
              <button
                type="button"
                className="memory-game-win-play-again"
                onClick={shuffleCards}
              >
                Play Again
              </button>
              {embedded && onBack && (
                <button
                  type="button"
                  className="memory-game-win-back"
                  onClick={onBack}
                >
                  Back to Quiz
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="memory-game-content-grid">
          {cards.map((card) => (
            <SingleCard
              key={card.id}
              card={card}
              handleChoice={handleChoice}
              flipped={
                card === choiceOne || card === choiceTwo || card.matched
              }
              disabled={disabled}
            />
          ))}
        </div>
      )}
    </>
  );

  if (embedded) {
    return (
      <div className="quiz-question-container memory-game-embedded">
        <div className="memory-game-inner">{content}</div>
      </div>
    );
  }

  return (
    <section className="memory-game-section quizzlit-section">
      <div className="memory-game-container">
        <div className="memory-game-inner">{content}</div>
      </div>
    </section>
  );
}
