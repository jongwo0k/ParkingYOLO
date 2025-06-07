import React, { useState, useEffect } from 'react';
import ImageUploader from './ImageUploader';
import MapViewer from './MapViewer';
import { createCarStateFromBox, handleCarMovement } from './carController';
import { hasReachedDestination, isColliding, excludeStartingBox } from './gameController';

function App() {
  const [backgroundImg, setBackgroundImg] = useState(null);         // 배경 이미지(base64)
  const [carSprites, setCarSprites] = useState([]);                 // car sprite
  const [carCandidates, setCarCandidates] = useState([]);           // car bbox
  const [carAngles, setCarAngles] = useState([]);                   // car angle
  const [carState, setCarState] = useState(null);                   // 선택된 차량의 상태
  const [selectedCarIndex, setSelectedCarIndex] = useState(null);   // 선택된 차량 저장
  const [destinationBox, setDestinationBox] = useState(null);       // destination
  const [score, setScore] = useState(100);                          // 점수 관리
  const [isGameOver, setIsGameOver] = useState(false);              // 게임 종료
  const [occupiedBoxes, setOccupiedBoxes] = useState([]);           // 충돌 감지
  const [startingBox, setStartingBox] = useState(null);             // starting point

  // image(map) 업로드 후 yolo가 detect
  const handleImageSelected = async (file) => {
    // 이전 상태 초기화
    setScore(100);
    setIsGameOver(false);
    setSelectedCarIndex(null);
    setCarState(null);
    setStartingBox(null);
    
    const formData = new FormData();
    formData.append('image', file);

    // formData로 flask 서버(5000)에 전송
    try {
      const res = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      const prefix = 'data:image/png;base64,';

      // YOLO 결과 받아와서 변환, 저장
      setBackgroundImg(prefix + data.background);
      setCarSprites(data.car_sprites.map((s) => prefix + s));
      setCarCandidates(data.car_candidates);
      setCarAngles(data.car_angles);
      setDestinationBox(data.destination_bbox);
      setOccupiedBoxes(data.occupied_boxes || []);   
    } catch (err) {
      console.error("YOLO API Error", err);
    }
  };

  // 사용할 차량 선택
  const handleCandidateSelect = (index) => {
    const box = carCandidates[index];
    if (!box || box.length !== 4) return;

    const angle = carAngles[index] || 0;
    const newCarState = createCarStateFromBox(box, angle);

    setSelectedCarIndex(index);
    setCarState(newCarState);
    setStartingBox(box);
  };

  // 선택된 차량 sprite로 변환
  const getSelectedSprite = () => {
    if (selectedCarIndex === null) return null;
    return carSprites[selectedCarIndex];
  };

  // 키보드 방향키로 선택한 차량 조작 starting point ~ destination 충돌 하지 않고 높은 점수로 이동
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isGameOver) return;

      setCarState((prev) => {
        if (!prev) return null;
        const next = handleCarMovement(prev, e.key);

        if (hasReachedDestination(next, destinationBox)) {
          setIsGameOver(true);
          return next; // 도착하면 조작 불가
        }

        // 충돌
        const carBox = [
          next.x - next.width / 2,
          next.y - next.height / 2,
          next.x + next.width / 2,
          next.y + next.height / 2,
        ];

        // yolo에서 detect 됐지만 선택되지 않은 차량은 충돌 처리, 선택된 차량은 제외
        const filteredCarCandidates = excludeStartingBox(
          carCandidates.filter((_, i) => i !== selectedCarIndex),
          startingBox
        );

        // yolo에서 detect 된 occupied는 충돌 처리, starting point는 제외
        const filteredOccupiedBoxes = excludeStartingBox(
          occupiedBoxes,
          startingBox
        );

        // 충돌 지역
        const carCollision = filteredCarCandidates.some((box) => isColliding(carBox, box));
        const occupiedCollision = filteredOccupiedBoxes.some((box) => isColliding(carBox, box));

        // 충돌 시 감점
        if (carCollision || occupiedCollision) {
          console.log("충돌 발생");
          setScore((s) => Math.max(0, s - 1));
        }

        return next;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [destinationBox, isGameOver, carCandidates, occupiedBoxes, selectedCarIndex, startingBox]);

  

  // UI 렌더링
  return (
    <div style={{
      width: '100vw', height: '100vh', padding: 20,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      backgroundColor: '#222', color: '#fff', boxSizing: 'border-box',
    }}>
      {/* title */}
      <div style={{ width: '100%', maxWidth: 1400, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ margin: 0 }}>ParkingYOLO!</h1>
        <ImageUploader onImageSelected={handleImageSelected} />
      </div>

      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: 1400,
        aspectRatio: '2 / 1',
        backgroundColor: '#111',
      }}>
        <MapViewer
          backgroundImg={backgroundImg}
          carSprite={getSelectedSprite()}
          carState={carState}
          destinationBox={destinationBox}
          carCandidates={carCandidates}
          onCandidateClick={handleCandidateSelect}
          startingBox={startingBox}
        />

        {/* 점수 표시 (실시간, 최종) */}
        <div style={{
          position: 'absolute', top: 20, right: 20,
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          color: 'red', padding: '10px 15px',
          borderRadius: '8px', fontWeight: 'bold', fontSize: '18px',
        }}>Score: {score}</div>

        {isGameOver && (
          <div style={{
            position: 'absolute', top: '40%', left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(0,0,0,0.75)',
            color: 'white', padding: '30px 50px',
            borderRadius: '15px', fontSize: '36px',
            fontWeight: 'bold', zIndex: 1000, textAlign: 'center'
          }}>
            Game Clear!<br />Final Score: {score}
          </div>
        )}
      </div>
    </div>
  );
}


export default App;