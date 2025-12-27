import { createContext, useContext, useState, useCallback } from 'react';

const QuizContext = createContext(null);

export const useQuiz = () => {
    const context = useContext(QuizContext);
    if (!context) {
        throw new Error('useQuiz must be used within QuizProvider');
    }
    return context;
};

// Quiz questions data
const QUIZ_DATA = {
    'blood-donation': [
        {
            id: 1,
            question: "How often can a healthy adult donate whole blood?",
            options: [
                "Every 2 weeks",
                "Every 8 weeks",
                "Every 6 months",
                "Once a year"
            ],
            correctAnswer: 1,
            explanation: "Healthy adults can donate whole blood every 8 weeks (56 days) to allow the body to replenish blood cells."
        },
        {
            id: 2,
            question: "What is the minimum age requirement to donate blood?",
            options: [
                "16 years",
                "17 years",
                "18 years",
                "21 years"
            ],
            correctAnswer: 2,
            explanation: "The minimum age to donate blood is typically 18 years old, though some places allow 17-year-olds with parental consent."
        },
        {
            id: 3,
            question: "Which blood type is known as the 'universal donor'?",
            options: [
                "A+",
                "B+",
                "AB+",
                "O-"
            ],
            correctAnswer: 3,
            explanation: "O- is the universal donor because it lacks A, B, and Rh antigens, making it safe for all recipients."
        },
        {
            id: 4,
            question: "How much blood is typically collected during a donation?",
            options: [
                "250 ml",
                "450 ml",
                "500 ml",
                "750 ml"
            ],
            correctAnswer: 1,
            explanation: "A standard whole blood donation collects approximately 450 ml (about 1 pint) of blood."
        },
        {
            id: 5,
            question: "What should you do before donating blood?",
            options: [
                "Skip meals",
                "Drink plenty of water and eat a healthy meal",
                "Exercise vigorously",
                "Take aspirin"
            ],
            correctAnswer: 1,
            explanation: "Before donating, you should drink plenty of water, eat a healthy meal, and get adequate rest."
        },
        {
            id: 6,
            question: "How long does the actual blood donation process take?",
            options: [
                "5-10 minutes",
                "10-15 minutes",
                "15-20 minutes",
                "30-45 minutes"
            ],
            correctAnswer: 1,
            explanation: "The actual blood donation process typically takes 10-15 minutes, though the entire visit may take 45-60 minutes including registration and recovery."
        },
        {
            id: 7,
            question: "What happens to donated blood after collection?",
            options: [
                "Used immediately",
                "Tested, processed, and stored",
                "Discarded after 24 hours",
                "Frozen indefinitely"
            ],
            correctAnswer: 1,
            explanation: "Donated blood is tested for diseases, processed into components (red cells, plasma, platelets), and stored appropriately."
        },
        {
            id: 8,
            question: "Can you donate blood if you have a cold?",
            options: [
                "Yes, always",
                "No, you must be healthy",
                "Only if you take medicine",
                "Only in emergencies"
            ],
            correctAnswer: 1,
            explanation: "You should not donate blood if you have a cold, flu, or any active infection. Wait until you're fully recovered."
        },
        {
            id: 9,
            question: "What is the shelf life of donated red blood cells?",
            options: [
                "7 days",
                "21 days",
                "42 days",
                "90 days"
            ],
            correctAnswer: 2,
            explanation: "Red blood cells can be stored for up to 42 days when refrigerated at the proper temperature."
        },
        {
            id: 10,
            question: "Why is blood donation important?",
            options: [
                "It's a legal requirement",
                "It helps save lives and maintain blood supply",
                "It's a form of exercise",
                "It reduces body weight"
            ],
            correctAnswer: 1,
            explanation: "Blood donation is crucial for saving lives during surgeries, emergencies, and treating medical conditions. It helps maintain an adequate blood supply for patients in need."
        }
    ],
    'organ-donation': [
        {
            id: 1,
            question: "Which organs can be donated while the donor is alive?",
            options: [
                "Heart and lungs",
                "Kidney and liver (partial)",
                "Brain and eyes",
                "All organs"
            ],
            correctAnswer: 1,
            explanation: "While alive, you can donate a kidney or a portion of your liver, as these organs can regenerate or function with one remaining."
        },
        {
            id: 2,
            question: "What is the most common organ transplant?",
            options: [
                "Heart",
                "Kidney",
                "Liver",
                "Lung"
            ],
            correctAnswer: 1,
            explanation: "Kidney transplants are the most common type of organ transplant, with thousands performed each year."
        },
        {
            id: 3,
            question: "How many people can benefit from one organ donor?",
            options: [
                "1 person",
                "Up to 8 people",
                "Up to 50 people",
            ],
            correctAnswer: 1,
            explanation: "One organ donor can save up to 8 lives by donating organs, and can help many more through tissue donation."
        },
        {
            id: 4,
            question: "What is required to become an organ donor?",
            options: [
                "Medical exam",
                "Registration and consent",
                "Age requirement only",
                "Blood test"
            ],
            correctAnswer: 1,
            explanation: "To become an organ donor, you need to register your decision and inform your family. No medical exam is required to register."
        },
        {
            id: 5,
            question: "Can organs be donated after death?",
            options: [
                "No, only while alive",
                "Yes, if registered and conditions are met",
                "Only for research",
                "Only for family members"
            ],
            correctAnswer: 1,
            explanation: "Yes, organs can be donated after death if the donor is registered and medical conditions allow for organ recovery."
        },
        {
            id: 6,
            question: "What is the average waiting time for a kidney transplant?",
            options: [
                "1-3 months",
                "3-5 years",
                "10+ years",
                "Immediate"
            ],
            correctAnswer: 1,
            explanation: "The average waiting time for a kidney transplant is typically 3-5 years, depending on blood type, location, and medical urgency."
        },
        {
            id: 7,
            question: "Which factor is most important in organ matching?",
            options: [
                "Age",
                "Blood type and tissue compatibility",
                "Location",
                "Income"
            ],
            correctAnswer: 1,
            explanation: "Blood type and tissue compatibility (HLA matching) are the most critical factors in organ matching to prevent rejection."
        },
        {
            id: 8,
            question: "Can you live normally with one kidney?",
            options: [
                "No, you need both",
                "Yes, one healthy kidney is sufficient",
                "Only temporarily",
                "Only with medication"
            ],
            correctAnswer: 1,
            explanation: "Yes, you can live a completely normal, healthy life with just one kidney. The remaining kidney compensates for the loss."
        },
        {
            id: 9,
            question: "What is 'brain death' in organ donation?",
            options: [
                "Coma",
                "Irreversible loss of brain function",
                "Temporary unconsciousness",
                "Sleep"
            ],
            correctAnswer: 1,
            explanation: "Brain death is the irreversible loss of all brain function, confirmed by medical tests. It's different from a coma."
        },
        {
            id: 10,
            question: "Why is organ donation important?",
            options: [
                "It's mandatory",
                "It saves lives and gives hope to waiting patients",
                "It's profitable",
                "It's a trend"
            ],
            correctAnswer: 1,
            explanation: "Organ donation is vital because it saves lives, gives hope to thousands waiting for transplants, and can transform recipients' quality of life."
        }
    ],
    'health-first-aid': [
        {
            id: 1,
            question: "What is the first step in providing first aid?",
            options: [
                "Start CPR immediately",
                "Ensure the scene is safe",
                "Call for help",
                "Move the victim"
            ],
            correctAnswer: 1,
            explanation: "The first step is to ensure the scene is safe for both you and the victim before providing any assistance."
        },
        {
            id: 2,
            question: "How many chest compressions should you give during CPR?",
            options: [
                "15 compressions",
                "30 compressions",
                "50 compressions",
                "100 compressions"
            ],
            correctAnswer: 1,
            explanation: "Standard CPR involves 30 chest compressions followed by 2 rescue breaths for adults."
        },
        {
            id: 3,
            question: "What should you do for a bleeding wound?",
            options: [
                "Apply ice directly",
                "Apply direct pressure with a clean cloth",
                "Use a tourniquet immediately",
                "Leave it uncovered"
            ],
            correctAnswer: 1,
            explanation: "Apply direct pressure with a clean cloth or bandage to control bleeding. Elevate the wound if possible."
        },
        {
            id: 4,
            question: "What is the recovery position used for?",
            options: [
                "Heart attack",
                "Unconscious breathing person",
                "Broken bone",
                "Burns"
            ],
            correctAnswer: 1,
            explanation: "The recovery position is used for unconscious people who are breathing, to keep their airway clear and prevent choking."
        },
        {
            id: 5,
            question: "How do you treat a burn?",
            options: [
                "Apply ice",
                "Run cool (not cold) water for 10-20 minutes",
                "Apply butter",
                "Pop blisters"
            ],
            correctAnswer: 1,
            explanation: "For burns, run cool (not cold) water over the area for 10-20 minutes. Don't use ice, butter, or pop blisters."
        },
        {
            id: 6,
            question: "What is the universal emergency number?",
            options: [
                "911",
                "112",
                "999",
                "All of the above (varies by country)"
            ],
            correctAnswer: 3,
            explanation: "Emergency numbers vary by country: 911 (US), 112 (Europe), 999 (UK). Know your local emergency number."
        },
        {
            id: 7,
            question: "How should you position someone having a seizure?",
            options: [
                "Hold them down",
                "Put something in their mouth",
                "Clear the area and place them on their side",
                "Pour water on them"
            ],
            correctAnswer: 2,
            explanation: "During a seizure, clear the area, place the person on their side, and never put anything in their mouth or hold them down."
        },
        {
            id: 8,
            question: "What are the signs of a heart attack?",
            options: [
                "Only chest pain",
                "Chest pain, shortness of breath, nausea, arm pain",
                "Only arm pain",
                "Only nausea"
            ],
            correctAnswer: 1,
            explanation: "Heart attack symptoms include chest pain, shortness of breath, nausea, pain in arms/jaw/back, and cold sweats."
        },
        {
            id: 9,
            question: "How do you help someone who is choking?",
            options: [
                "Give them water",
                "Perform Heimlich maneuver or back blows",
                "Wait for it to pass",
                "Lay them down"
            ],
            correctAnswer: 1,
            explanation: "For choking, perform the Heimlich maneuver (abdominal thrusts) or back blows. Call emergency services if severe."
        },
        {
            id: 10,
            question: "What should you do if someone is unresponsive?",
            options: [
                "Leave them alone",
                "Shake them and shout, check breathing, call for help",
                "Give them water",
                "Move them immediately"
            ],
            correctAnswer: 1,
            explanation: "If someone is unresponsive, shake and shout to check responsiveness, check for breathing, and call emergency services immediately."
        }
    ]
};

export const QuizProvider = ({ children }) => {
    const [quizState, setQuizState] = useState({
        category: null,
        questions: [],
        currentQuestionIndex: 0,
        selectedAnswers: [],
        correctCount: 0,
        wrongCount: 0,
        timeStarted: null,
        timeEnded: null,
        isCompleted: false,
        questionStartTime: null
    });

    const startQuiz = useCallback((category) => {
        const questions = QUIZ_DATA[category] || [];
        // Shuffle questions for variety
        const shuffled = [...questions].sort(() => Math.random() - 0.5);
        
        setQuizState({
            category,
            questions: shuffled,
            currentQuestionIndex: 0,
            selectedAnswers: [],
            correctCount: 0,
            wrongCount: 0,
            timeStarted: Date.now(),
            timeEnded: null,
            isCompleted: false,
            questionStartTime: Date.now()
        });
    }, []);

    const selectAnswer = useCallback((answerIndex) => {
        setQuizState(prev => {
            const currentQuestion = prev.questions[prev.currentQuestionIndex];
            // If answerIndex is -1, it means time expired, so mark as incorrect
            const isCorrect = answerIndex !== -1 && answerIndex === currentQuestion.correctAnswer;
            
            const newSelectedAnswers = [...prev.selectedAnswers];
            newSelectedAnswers[prev.currentQuestionIndex] = {
                answerIndex: answerIndex === -1 ? null : answerIndex,
                isCorrect,
                questionId: currentQuestion.id,
                timeSpent: Date.now() - (prev.questionStartTime || Date.now())
            };

            return {
                ...prev,
                selectedAnswers: newSelectedAnswers,
                correctCount: isCorrect ? prev.correctCount + 1 : prev.correctCount,
                wrongCount: !isCorrect ? prev.wrongCount + 1 : prev.wrongCount
            };
        });
    }, []);

    const nextQuestion = useCallback(() => {
        setQuizState(prev => {
            if (prev.currentQuestionIndex < prev.questions.length - 1) {
                return {
                    ...prev,
                    currentQuestionIndex: prev.currentQuestionIndex + 1,
                    questionStartTime: Date.now()
                };
            } else {
                return {
                    ...prev,
                    isCompleted: true,
                    timeEnded: Date.now()
                };
            }
        });
    }, []);

    const resetQuiz = useCallback(() => {
        setQuizState({
            category: null,
            questions: [],
            currentQuestionIndex: 0,
            selectedAnswers: [],
            correctCount: 0,
            wrongCount: 0,
            timeStarted: null,
            timeEnded: null,
            isCompleted: false,
            questionStartTime: null
        });
    }, []);

    const getCurrentQuestion = useCallback(() => {
        return quizState.questions[quizState.currentQuestionIndex] || null;
    }, [quizState.questions, quizState.currentQuestionIndex]);

    const getScore = useCallback(() => {
        return {
            correct: quizState.correctCount,
            wrong: quizState.wrongCount,
            total: quizState.questions.length,
            percentage: Math.round((quizState.correctCount / quizState.questions.length) * 100)
        };
    }, [quizState.correctCount, quizState.wrongCount, quizState.questions.length]);

    const getBadge = useCallback(() => {
        const percentage = (quizState.correctCount / quizState.questions.length) * 100;
        if (percentage >= 90) return { type: 'gold', label: 'Gold Hero' };
        if (percentage >= 70) return { type: 'silver', label: 'Silver Hero' };
        if (percentage >= 50) return { type: 'bronze', label: 'Bronze Hero' };
        return { type: 'participant', label: 'Participant' };
    }, [quizState.correctCount, quizState.questions.length]);

    return (
        <QuizContext.Provider
            value={{
                quizState,
                startQuiz,
                selectAnswer,
                nextQuestion,
                resetQuiz,
                getCurrentQuestion,
                getScore,
                getBadge
            }}
        >
            {children}
        </QuizContext.Provider>
    );
};

