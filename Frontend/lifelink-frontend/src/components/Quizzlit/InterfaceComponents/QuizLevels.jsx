import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../api/axios";
import { IoMdCheckmark } from "react-icons/io";
import { RiLock2Fill } from "react-icons/ri";
import { AiFillThunderbolt } from "react-icons/ai";

export default function QuizLevels({ currentLevel: propCurrentLevel, onLevelChange }) {
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
  
  // Minigame positions: 
  // First: between levels 2, 3, 4 (at level 3 - middle of 2-4)
  // Second: between levels 4, 5, 6 (at level 5 - middle of 4-6)
  const minigamePositions = [3, 5, 7, 9];

  const pathRef = useRef(null);
  const svgRef = useRef(null);
  const containerRef = useRef(null);

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

  // Calculate level positions - separate effect for resize handling
  useEffect(() => {
    const path = pathRef.current;
    const svg = svgRef.current;
    const container = containerRef.current;
    
    if (!path || !svg || !container) return;

    const calculatePositions = () => {
      const totalLength = path.getTotalLength();

      // Get SVG dimensions and position for coordinate transformation
      const svgBBox = svg.getBoundingClientRect();
      const containerBBox = container.getBoundingClientRect();
      
      // Get viewBox dimensions
      const viewBox = svg.viewBox.baseVal;
      const viewBoxWidth = viewBox.width;
      const viewBoxHeight = viewBox.height;
      
      // Calculate scale factors
      const scaleX = svgBBox.width / viewBoxWidth;
      const scaleY = svgBBox.height / viewBoxHeight;
      
      // Calculate SVG position relative to container
      const svgOffsetX = svgBBox.left - containerBBox.left;
      const svgOffsetY = svgBBox.top - containerBBox.top;

      // compute positions for each level
      const newPoints = Array.from({length: totalLevels}, (_, i) => {
          const level = i + 1;
          const t = level / totalLevels;                  // normalized progress
          const lengthAtLevel = totalLength * t;          // length on curve
          const { x, y } = path.getPointAtLength(lengthAtLevel);
          
          // Transform SVG coordinates to container coordinates
          return { 
            x: x * scaleX + svgOffsetX,
            y: y * scaleY + svgOffsetY
          };
      });
      
      setPoints(newPoints);
      
      // Calculate start position (at the beginning of the path - length 0)
      const startLength = 0;
      const startPointOnPath = path.getPointAtLength(startLength);
      const startPosition = {
        x: startPointOnPath.x * scaleX + svgOffsetX,
        y: startPointOnPath.y * scaleY + svgOffsetY
      };
      setStartPoint(startPosition);
      
      // compute positions for minigames (positioned in middle between levels, offset from path)
      const newMinigamePoints = minigamePositions.map((position, index) => {
          // Get the point on the path at the midpoint position between two levels
          const midT = position / totalLevels;
          const midLength = totalLength * midT;
          const midPoint = path.getPointAtLength(midLength);
          
          // Calculate tangent direction by getting nearby points along the path
          const delta = Math.max(1, totalLength * 0.01); // Small offset (1% of path)
          const beforePoint = path.getPointAtLength(Math.max(0, midLength - delta));
          const afterPoint = path.getPointAtLength(Math.min(totalLength, midLength + delta));
          
          // Calculate tangent vector (direction of the path at this point)
          const tangentX = afterPoint.x - beforePoint.x;
          const tangentY = afterPoint.y - beforePoint.y;
          const tangentLength = Math.sqrt(tangentX * tangentX + tangentY * tangentY);
          
          // Normalize tangent to get unit vector
          const normalizedTanX = tangentLength > 0 ? tangentX / tangentLength : 0;
          const normalizedTanY = tangentLength > 0 ? tangentY / tangentLength : 1;
          
          // Calculate perpendicular (normal) vector (rotate 90 degrees counterclockwise)
          // Perpendicular to (tangentX, tangentY) is (-tangentY, tangentX)
          const normalX = -normalizedTanY;
          const normalY = normalizedTanX;
          
          // Offset distance from path (in viewBox coordinates, will be scaled)
          // Using ~30-35 in viewBox coordinates for visual spacing
          const offsetDistance = index % 2=== 0 ? -150 : 150;
          
          // Calculate offset position (perpendicular to path, away from it)
          const offsetX = midPoint.x + normalX * offsetDistance;
          const offsetY = midPoint.y + normalY * offsetDistance;
          
          // Transform SVG coordinates to container coordinates
          return { 
            x: offsetX * scaleX + svgOffsetX,
            y: offsetY * scaleY + svgOffsetY
          };
      });
      
      setMinigamePoints(newMinigamePoints);
    };

    // Initial calculation
    calculatePositions();

    // Recalculate on window resize
    const handleResize = () => {
      calculatePositions();
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  
  }, [totalLevels]);

  return (
    <div ref={containerRef} className="quiz-levels-container"  style={{ position: "relative" }}>
      <div className="level-path-container">
        <svg
          ref={svgRef}
          viewBox="0 0 339 1650"
          className="w-[150px] h-auto"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* background path */}
          <path
            d="M162.827 9.5C224.801 9.5 226.897 9.5 255.489 9.5C283.103 9.5 305.5 31.8858 305.5 59.5V263.5C305.5 291.114 283.114 313.5 255.5 313.5H59.5C31.8858 313.5 9.5 335.886 9.5 363.5V567.5C9.5 595.114 31.8858 617.5 59.5 617.5H255.5C283.114 617.5 305.5 639.886 305.5 667.5V871.5C305.5 899.114 283.114 921.5 255.5 921.5H59.5C31.8858 921.5 9.5 943.886 9.5 971.5V1175.5C9.5 1203.11 31.8858 1225.5 59.5 1225.5H255.5C283.114 1225.5 305.5 1247.89 305.5 1275.5V1479.5C305.5 1507.11 283.114 1529.5 255.5 1529.5H162.827"
            stroke="#ffffff1a"
            strokeWidth="20"
          />

          {/* animated progress path */}
          <path
            ref={pathRef}
            d="M162.827 9.5C224.801 9.5 226.897 9.5 255.489 9.5C283.103 9.5 305.5 31.8858 305.5 59.5V263.5C305.5 291.114 283.114 313.5 255.5 313.5H59.5C31.8858 313.5 9.5 335.886 9.5 363.5V567.5C9.5 595.114 31.8858 617.5 59.5 617.5H255.5C283.114 617.5 305.5 639.886 305.5 667.5V871.5C305.5 899.114 283.114 921.5 255.5 921.5H59.5C31.8858 921.5 9.5 943.886 9.5 971.5V1175.5C9.5 1203.11 31.8858 1225.5 59.5 1225.5H255.5C283.114 1225.5 305.5 1247.89 305.5 1275.5V1479.5C305.5 1507.11 283.114 1529.5 255.5 1529.5H162.827"
            stroke="#6132BE"
            strokeWidth="20"
          />
        </svg>
      </div>

      {/* Start Circle */}
      {startPoint && (
        <div
          className="start-circle"
          style={{
            position: "absolute",
            left: startPoint.x - 35,   // center circle (half size)
            top: startPoint.y - 23,
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
                const { x, y } = point;

                return (
                <div
                    key={level}
                    className="level-shape-background"
                    style={{
                    position: "absolute",
                    left: x - 30,   // center box (half size)
                    top: y - 30,
                    width: 63,
                    height: 63,
                    background: isUnlocked ? "#6132BE" : "#ffffff1a",
                    
                    }}
                >   <div 
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

      {/* Minigame levels */}
      <div className="minigame-levels">
        {minigamePoints.length === minigamePositions.length &&
          minigamePoints.map((point, index) => {
            // Minigame is unlocked after completing the level at which it's positioned
            // For position 3 (between levels 2, 3, 4), need level 3 completed
            // For position 5 (between levels 4, 5, 6), need level 5 completed
            const minigamePosition = minigamePositions[index];
            const requiredLevel = minigamePosition; // The minigame is at this level position
            // Unlocked if currentLevel >= requiredLevel (completed that level)
            // e.g., minigame at 3 requires level 3 completed, so currentLevel >= 3
            // e.g., minigame at 5 requires level 5 completed, so currentLevel >= 5
            const isUnlocked = currentLevel >= requiredLevel;
            const { x, y } = point;

            return (
              <div
                key={`minigame-${minigamePosition}`}
                className="minigame-box"
                style={{
                  position: "absolute",
                  left: x - 25,   // center box (half size - smaller than regular levels)
                  top: y - 25,
                  width: 50,
                  height: 50,
                  borderRadius: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: isUnlocked ? "#6132BE" : "#2F2F3A",
                  opacity: isUnlocked ? 1 : 0.4,
                  border: isUnlocked ? "2px solid #B58CFF" : "2px solid #444",
                  boxShadow: isUnlocked ? "0 0 10px rgba(97, 50, 190, 0.5)" : "none",
                }}
                title="Minigame"
              >
                {isUnlocked ? <AiFillThunderbolt className="level-icon-minigame"/> : <AiFillThunderbolt className="level-icon-lock"/>}
              </div>
            );
          })}
      </div>

    </div>
  );
}
