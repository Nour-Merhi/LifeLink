import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import QuizCards from "./InterfaceComponents/QuizCards";
import QuizLevels from "./InterfaceComponents/QuizLevels";
import MemoryGame from "./miniGames/MemoryGame";

export default function GameInterface() {
    const location = useLocation();
    const { startLevel } = location.state || {};
    const { user } = useAuth();
    const [currentLevel, setCurrentLevel] = useState(startLevel || 1);
    const [activeView, setActiveView] = useState("quiz"); // "quiz" | "minigame"
    const [minigameLevel, setMinigameLevel] = useState(null); // 3, 5, 7, or 9 when minigame active

    // Update level if startLevel is provided from navigation
    useEffect(() => {
        if (startLevel) {
            setCurrentLevel(startLevel);
        }
    }, [startLevel]);

    // Fetch current level from backend if no startLevel is provided (normal navigation)
    useEffect(() => {
        const fetchProgress = async () => {
            if (!startLevel && user) {
                try {
                    const response = await api.get('/api/quiz/progress');
                    const level = response.data.currentLevel || 1;
                    setCurrentLevel(level);
                } catch (err) {
                    console.error('Error fetching quiz progress:', err);
                    // Keep default level on error
                }
            }
        };

        fetchProgress();
    }, [user, startLevel]);

    const handleMinigameSelect = (level) => {
        setMinigameLevel(level);
        setActiveView("minigame");
    };

    const handleMinigameBack = () => {
        setActiveView("quiz");
        setMinigameLevel(null);
    };

    const handleMinigameWin = (xpEarned) => {
        // XP is shown in MemoryGame win UI; backend called there if API exists
    };

    return (
        <div className="quizzlit-section h-screen w-screen">
            <div className="circle-container">
                <div className="circle-red animate-soft-pulse"></div>
                <div className="circle-purple animate-soft-pulse"></div>
                <div className="circle-red circle-bottom-right animate-soft-pulse"></div>
                <div className="circle-purple circle-bottom-right animate-soft-pulse"></div>
            </div>

            <div className="game-interface-container">
                <QuizLevels
                    currentLevel={currentLevel}
                    onLevelChange={setCurrentLevel}
                    onMinigameSelect={handleMinigameSelect}
                    activeView={activeView}
                    minigameLevel={minigameLevel}
                />
                {activeView === "quiz" ? (
                    <QuizCards currentLevel={currentLevel} />
                ) : (
                    <MemoryGame
                        embedded
                        currentLevel={currentLevel}
                        minigameLevel={minigameLevel}
                        onBack={handleMinigameBack}
                        onWin={handleMinigameWin}
                    />
                )}
            </div>
        </div>
    );
}