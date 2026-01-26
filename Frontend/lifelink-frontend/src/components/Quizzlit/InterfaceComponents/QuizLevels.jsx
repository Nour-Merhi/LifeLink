import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../api/axios";
import { IoMdCheckmark } from "react-icons/io";
import { RiLock2Fill } from "react-icons/ri";
import { AiFillThunderbolt } from "react-icons/ai";

export default function QuizLevels({ currentLevel: propCurrentLevel, onLevelChange, onMinigameSelect, activeView, minigameLevel }) {
  const { user } = useAuth();
  const [currentLevel, setCurrentLevel] = useState(propCurrentLevel || 1);
  const [points, setPoints] = useState([]);
  const [minigamePoints, setMinigamePoints] = useState([]);
  const [startPoint, setStartPoint] = useState(null);

  // Sync local state with prop (prop is the source of truth, managed by GameInterface)
  useEffect(() => {
    if (propCurrentLevel !== undefined && propCurrentLevel !== null) {
      setCurrentLevel(propCurrentLevel);
    }
  }, [propCurrentLevel]);

  const totalLevels = 10;
  const progress = currentLevel / totalLevels;
  
  const minigamePositions = [3, 5, 7, 9];
  const VIEWBOX_WIDTH = 339;
  const VIEWBOX_HEIGHT = 1650;

  const pathRef = useRef(null);
  const svgRef = useRef(null);

  // Setup stroke animation separately - only when progress changes
  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;

    const totalLength = path.getTotalLength();
    if (totalLength === 0) return; // Path not ready yet
    
    // Set stroke properties
    path.style.strokeDasharray = `${totalLength}`;
    path.style.transition = "stroke-dashoffset 1.2s ease";

    // Calculate the exact length at the current level position
    // Levels are positioned at: level / totalLevels along the path
    // For currentLevel, we want the path to reach that level's position
    const levelProgress = currentLevel / totalLevels;
    const lengthAtCurrentLevel = totalLength * levelProgress;
    
    // Calculate the target offset (what we want to show)
    // stroke-dashoffset controls how much is hidden from the start
    // To show up to lengthAtCurrentLevel, we offset by (totalLength - lengthAtCurrentLevel)
    const targetOffset = totalLength - lengthAtCurrentLevel;
    
    // Set initial offset (hide the path completely)
    path.style.strokeDashoffset = `${totalLength}`;
    
    // Animate to show path up to current level
    // Use double requestAnimationFrame to ensure the initial state is rendered first
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        path.style.strokeDashoffset = `${targetOffset}`;
      });
    });
  }, [currentLevel, totalLevels]);

  // Calculate level positions using viewBox percentages (no getBoundingClientRect)
  // Overlay matches SVG size; positions are % of viewBox → always aligned with path
  useEffect(() => {
    const run = () => {
      const path = pathRef.current;
      if (!path) return;
      const totalLength = path.getTotalLength();
      if (totalLength === 0) return;

    const newPoints = Array.from({ length: totalLevels }, (_, i) => {
      const level = i + 1;
      const t = level / totalLevels;
      const lengthAtLevel = totalLength * t;
      const { x, y } = path.getPointAtLength(lengthAtLevel);
      return {
        xPct: (x / VIEWBOX_WIDTH) * 100,
        yPct: (y / VIEWBOX_HEIGHT) * 100,
      };
    });
    setPoints(newPoints);

    const startPointOnPath = path.getPointAtLength(0);
    setStartPoint({
      xPct: (startPointOnPath.x / VIEWBOX_WIDTH) * 100,
      yPct: (startPointOnPath.y / VIEWBOX_HEIGHT) * 100,
    });

    const newMinigamePoints = minigamePositions.map((position, index) => {
      const midT = position / totalLevels;
      const midLength = totalLength * midT;
      const midPoint = path.getPointAtLength(midLength);
      const delta = Math.max(1, totalLength * 0.01);
      const beforePoint = path.getPointAtLength(Math.max(0, midLength - delta));
      const afterPoint = path.getPointAtLength(Math.min(totalLength, midLength + delta));
      const tangentX = afterPoint.x - beforePoint.x;
      const tangentY = afterPoint.y - beforePoint.y;
      const tangentLength = Math.sqrt(tangentX * tangentX + tangentY * tangentY);
      const normalizedTanX = tangentLength > 0 ? tangentX / tangentLength : 0;
      const normalizedTanY = tangentLength > 0 ? tangentY / tangentLength : 1;
      const normalX = -normalizedTanY;
      const normalY = normalizedTanX;
      const offsetDistance = index % 2 === 0 ? -150 : 150;
      const offsetX = midPoint.x + normalX * offsetDistance;
      const offsetY = midPoint.y + normalY * offsetDistance;
      return {
        xPct: (offsetX / VIEWBOX_WIDTH) * 100,
        yPct: (offsetY / VIEWBOX_HEIGHT) * 100,
      };
    });
    setMinigamePoints(newMinigamePoints);
    };
    const id = requestAnimationFrame(() => requestAnimationFrame(run));
    return () => cancelAnimationFrame(id);
  }, [totalLevels]);

  const centerTransform = "translate(-50%, -50%)";

  return (
    <div className="quiz-levels-container" style={{ position: "relative" }}>
      <div className="level-path-container">
        <div className="level-path-inner">
          <div className="level-path-svg-wrap">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
              className="level-path-svg"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M162.827 9.5C224.801 9.5 226.897 9.5 255.489 9.5C283.103 9.5 305.5 31.8858 305.5 59.5V263.5C305.5 291.114 283.114 313.5 255.5 313.5H59.5C31.8858 313.5 9.5 335.886 9.5 363.5V567.5C9.5 595.114 31.8858 617.5 59.5 617.5H255.5C283.114 617.5 305.5 639.886 305.5 667.5V871.5C305.5 899.114 283.114 921.5 255.5 921.5H59.5C31.8858 921.5 9.5 943.886 9.5 971.5V1175.5C9.5 1203.11 31.8858 1225.5 59.5 1225.5H255.5C283.114 1225.5 305.5 1247.89 305.5 1275.5V1479.5C305.5 1507.11 283.114 1529.5 255.5 1529.5H162.827"
                stroke="#ffffff1a"
                strokeWidth="20"
              />
              <path
                ref={pathRef}
                d="M162.827 9.5C224.801 9.5 226.897 9.5 255.489 9.5C283.103 9.5 305.5 31.8858 305.5 59.5V263.5C305.5 291.114 283.114 313.5 255.5 313.5H59.5C31.8858 313.5 9.5 335.886 9.5 363.5V567.5C9.5 595.114 31.8858 617.5 59.5 617.5H255.5C283.114 617.5 305.5 639.886 305.5 667.5V871.5C305.5 899.114 283.114 921.5 255.5 921.5H59.5C31.8858 921.5 9.5 943.886 9.5 971.5V1175.5C9.5 1203.11 31.8858 1225.5 59.5 1225.5H255.5C283.114 1225.5 305.5 1247.89 305.5 1275.5V1479.5C305.5 1507.11 283.114 1529.5 255.5 1529.5H162.827"
                stroke="#6132BE"
                strokeWidth="20"
              />
            </svg>
            {/* Overlay: same size as SVG; positions in % of viewBox → always on path */}
            <div className="level-path-overlay">
              {startPoint && (
                <div
                  className="start-circle"
                  style={{
                    position: "absolute",
                    left: `${startPoint.xPct}%`,
                    top: `${startPoint.yPct}%`,
                    width: 65,
                    height: 65,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#6132BE",
                    border: "3px solid #B58CFF",
                    boxShadow: "0 0 15px rgba(97, 50, 190, 0.5)",
                    zIndex: 10,
                    transform: centerTransform,
                  }}
                  title="Start"
                >
                  <div style={{
                    color: "#ffffff",
                    fontSize: "14px",
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}>
                    Start
                  </div>
                </div>
              )}

              <div className="levels">
                {points.length === totalLevels &&
                  points.map((point, index) => {
                    const level = index + 1;
                    const isUnlocked = level <= currentLevel;
                    const { xPct, yPct } = point;

                    return (
                      <div
                        key={level}
                        className="level-shape-background"
                        style={{
                          position: "absolute",
                          left: `${xPct}%`,
                          top: `${yPct}%`,
                          width: 63,
                          height: 63,
                          background: isUnlocked ? "#6132BE" : "#ffffff1a",
                          transform: centerTransform,
                        }}
                      >
                        <div
                          className={`level-shape-background-inner 
                            ${isUnlocked ? "level-shape-background-inner-unlocked" : "level-shape-background-inner-locked"}`}
                        >
                          <div className="level-shape-text">
                            {isUnlocked ? <IoMdCheckmark className="level-icon-check"/> : <RiLock2Fill className="level-icon-lock"/>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>

              <div className="minigame-levels">
                {minigamePoints.length === minigamePositions.length &&
                  minigamePoints.map((point, index) => {
                    const minigamePosition = minigamePositions[index];
                    const requiredLevel = minigamePosition;
                    const isUnlocked = currentLevel >= requiredLevel;
                    const isActive = activeView === "minigame" && minigameLevel === minigamePosition;
                    const { xPct, yPct } = point;

                    return (
                      <div
                        key={`minigame-${minigamePosition}`}
                        className="minigame-box"
                        role="button"
                        tabIndex={isUnlocked ? 0 : -1}
                        onClick={() => isUnlocked && onMinigameSelect?.(minigamePosition)}
                        onKeyDown={(e) => {
                          if (!isUnlocked) return;
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onMinigameSelect?.(minigamePosition);
                          }
                        }}
                        style={{
                          position: "absolute",
                          left: `${xPct}%`,
                          top: `${yPct}%`,
                          width: 50,
                          height: 50,
                          borderRadius: 12,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: isActive ? "#7C4BDB" : isUnlocked ? "#6132BE" : "#2F2F3A",
                          opacity: isUnlocked ? 1 : 0.4,
                          border: isUnlocked ? "2px solid #B58CFF" : "2px solid #444",
                          boxShadow: isUnlocked ? "0 0 10px rgba(97, 50, 190, 0.5)" : "none",
                          cursor: isUnlocked ? "pointer" : "default",
                          transform: centerTransform,
                        }}
                        title={isUnlocked ? "Play Memory minigame" : "Complete more levels to unlock"}
                      >
                        {isUnlocked ? <AiFillThunderbolt className="level-icon-minigame"/> : <AiFillThunderbolt className="level-icon-lock"/>}
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
